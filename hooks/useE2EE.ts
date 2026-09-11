import 'expo-standard-web-crypto';
import * as SecureStore from 'expo-secure-store';
import { nodeApi } from '../api/base';

const KEY_PAIR_KEY = 'e2ee_identity_key_pair';

// ---------------------------------------------------------------------------
// Module-level caches (shared by every component using this hook).
// Without these, every encrypt/decrypt triggers a network fetch of the
// recipient's public key + a fresh ECDH derivation — which hammers the
// server during history sync and makes chat feel slow.
// ---------------------------------------------------------------------------
const PUBKEY_MISS_TTL_MS = 60 * 1000; // re-check "no key yet" users after 1 min

let identityKeyPairPromise: Promise<{ publicKey: string; privateKey: string }> | null = null;
let myPrivateCryptoKey: CryptoKey | null = null;

// userId -> imported public CryptoKey (null = known miss, with timestamp)
const publicKeyCache = new Map<string, { key: CryptoKey | null; at: number }>();
// userId -> derived AES-GCM shared key
const sharedKeyCache = new Map<string, CryptoKey>();
// which userId we already registered this session (avoid POST spam)
let registeredUserId: string | null = null;

const clearPeerCaches = (peerId?: string) => {
    if (peerId) {
        publicKeyCache.delete(peerId);
        sharedKeyCache.delete(peerId);
    } else {
        publicKeyCache.clear();
        sharedKeyCache.clear();
    }
};

/**
 * Internal: Get standard WebCrypto Subtle instance
 */
const getSubtle = (): SubtleCrypto | null => {
    const polyfilledCrypto = (global as any).crypto;
    if (!polyfilledCrypto) {
        console.error("❌ [E2EE] Global crypto object is completely missing!");
        return null;
    }
    if (!polyfilledCrypto.subtle) {
        console.error("❌ [E2EE] crypto.subtle is undefined! The polyfill failed to attach.");
        return null;
    }
    return polyfilledCrypto.subtle;
};

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Helper: ArrayBuffer to Base64 (Native-friendly)
 */
const bufferToBase64 = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let base64 = '';
    let i = 0;
    while (i < bytes.length) {
        const byte1 = bytes[i++];
        const byte2 = i < bytes.length ? bytes[i++] : -1;
        const byte3 = i < bytes.length ? bytes[i++] : -1;

        const enc1 = byte1 >> 2;
        const enc2 = ((byte1 & 3) << 4) | (byte2 !== -1 ? byte2 >> 4 : 0);
        const enc3 = byte2 !== -1 ? ((byte2 & 15) << 2) | (byte3 !== -1 ? byte3 >> 6 : 0) : 64;
        const enc4 = byte3 !== -1 ? byte3 & 63 : 64;

        base64 += B64_CHARS[enc1] + B64_CHARS[enc2] + (enc3 === 64 ? '=' : B64_CHARS[enc3]) + (enc4 === 64 ? '=' : B64_CHARS[enc4]);
    }
    return base64;
};

/**
 * Helper: Base64 to ArrayBuffer (Native-friendly)
 */
const base64ToBuffer = (base64: string) => {
    const str = base64.replace(/=+$/, '');
    const len = str.length;
    const bytes = new Uint8Array(Math.floor((len * 3) / 4));
    let p = 0;
    for (let i = 0; i < len; i += 4) {
        const encoded1 = B64_CHARS.indexOf(str[i]);
        const encoded2 = B64_CHARS.indexOf(str[i + 1]);
        const encoded3 = i + 2 < len ? B64_CHARS.indexOf(str[i + 2]) : 0;
        const encoded4 = i + 3 < len ? B64_CHARS.indexOf(str[i + 3]) : 0;

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        if (i + 2 < len) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        if (i + 3 < len) bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
    }
    return bytes.buffer;
};

/**
 * Generate or Retrieve Identity Key Pair (ECDH P-256).
 * Result is memoized in-memory; SecureStore is only hit once per app session.
 */
const getIdentityKeyPair = (): Promise<{ publicKey: string; privateKey: string }> => {
    if (identityKeyPairPromise) return identityKeyPairPromise;

    identityKeyPairPromise = (async () => {
        const storedKeys = await SecureStore.getItemAsync(KEY_PAIR_KEY);
        if (storedKeys) {
            return JSON.parse(storedKeys);
        }

        const subtle = getSubtle();
        if (!subtle) throw new Error("Subtle crypto not available");

        const keyPair = await subtle.generateKey(
            { name: "ECDH", namedCurve: "P-256" },
            true,
            ["deriveKey", "deriveBits"]
        );

        const publicKeyBuf = await subtle.exportKey("spki", keyPair.publicKey);
        const privateKeyBuf = await subtle.exportKey("pkcs8", keyPair.privateKey);

        const keys = {
            publicKey: bufferToBase64(publicKeyBuf),
            privateKey: bufferToBase64(privateKeyBuf)
        };

        await SecureStore.setItemAsync(KEY_PAIR_KEY, JSON.stringify(keys));
        console.log("🔐 [E2EE] New identity key pair generated.");
        return keys;
    })();

    // Allow retry on failure instead of caching the rejection forever
    identityKeyPairPromise.catch(() => { identityKeyPairPromise = null; });
    return identityKeyPairPromise;
};

/**
 * Import my private key once and keep the CryptoKey in memory.
 */
const getMyPrivateKey = async (): Promise<CryptoKey | null> => {
    if (myPrivateCryptoKey) return myPrivateCryptoKey;

    const subtle = getSubtle();
    if (!subtle) return null;

    const { privateKey } = await getIdentityKeyPair();
    myPrivateCryptoKey = await subtle.importKey(
        "pkcs8",
        base64ToBuffer(privateKey),
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
    );
    return myPrivateCryptoKey;
};

/**
 * Fetch (and cache) a peer's public key. Caches misses briefly so history
 * sync doesn't fire hundreds of requests for users without keys.
 */
const fetchPeerPublicKey = async (peerId: string, forceRefresh = false): Promise<CryptoKey | null> => {
    const cleanId = peerId.trim();

    if (!forceRefresh) {
        const cached = publicKeyCache.get(cleanId);
        if (cached && (cached.key !== null || Date.now() - cached.at < PUBKEY_MISS_TTL_MS)) {
            return cached.key;
        }
    }

    try {
        const response = await nodeApi.get(`api/communication/public-key/${cleanId}`);
        const publicKeyBase64 = response.data?.data?.publicKey;
        if (!publicKeyBase64) {
            publicKeyCache.set(cleanId, { key: null, at: Date.now() });
            return null;
        }

        const subtle = getSubtle();
        if (!subtle) return null;

        const key = await subtle.importKey(
            "spki",
            base64ToBuffer(publicKeyBase64),
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        );
        publicKeyCache.set(cleanId, { key, at: Date.now() });
        return key;
    } catch (error: any) {
        // 404 = peer never registered a key; cache the miss to stay quiet
        publicKeyCache.set(cleanId, { key: null, at: Date.now() });
        if (error?.response?.status !== 404) {
            console.error(`❌ [E2EE] Error fetching key for ${cleanId}:`, error?.message || error);
        }
        return null;
    }
};

/**
 * Derive (and cache) the AES-GCM shared key for a peer.
 * ECDH(myPrivate, peerPublic) === ECDH(peerPrivate, myPublic), so the same
 * key encrypts outgoing and decrypts incoming messages for that peer.
 */
const getSharedKey = async (peerId: string, forceRefresh = false): Promise<CryptoKey | null> => {
    const cleanId = peerId.trim();

    if (!forceRefresh) {
        const cached = sharedKeyCache.get(cleanId);
        if (cached) return cached;
    } else {
        sharedKeyCache.delete(cleanId);
    }

    const subtle = getSubtle();
    if (!subtle) return null;

    const peerPubKey = await fetchPeerPublicKey(cleanId, forceRefresh);
    if (!peerPubKey) return null;

    const myPrivKey = await getMyPrivateKey();
    if (!myPrivKey) return null;

    const sharedKey = await subtle.deriveKey(
        { name: "ECDH", public: peerPubKey },
        myPrivKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    sharedKeyCache.set(cleanId, sharedKey);
    return sharedKey;
};

/**
 * Hook for End-to-End Encryption (E2EE)
 */
export const useE2EE = () => {

    /**
     * Register Public Key on Server (once per session per user)
     */
    const registerMyPublicKey = async (userId: string) => {
        try {
            if (!userId) return;
            const cleanId = userId.toString().trim();
            if (!cleanId || cleanId === 'anonymous' || cleanId === 'NONE' || cleanId === 'undefined' || cleanId === 'null') return;
            if (registeredUserId === cleanId) return;

            // Different account logged in on this device -> stale peer caches
            if (registeredUserId && registeredUserId !== cleanId) {
                clearPeerCaches();
            }

            const keyPair = await getIdentityKeyPair().catch(() => null);
            if (!keyPair || !keyPair.publicKey) return;

            await nodeApi.post('api/communication/public-key', {
                userId: cleanId,
                publicKey: keyPair.publicKey
            }).catch(() => {});

            registeredUserId = cleanId;
            console.log(`✅ [E2EE] Public key registered for user ${cleanId}`);
        } catch (error: any) {
            console.log("ℹ️ [E2EE] Key registration deferred/unavailable");
        }
    };

    /**
     * Encrypt Message (ECDH + AES-GCM). Falls back to plain text when the
     * recipient has no registered key or crypto is unavailable.
     */
    const encryptMessage = async (recipientId: string, plainText: string) => {
        if (!plainText || !recipientId) return plainText;
        try {
            const subtle = getSubtle();
            if (!subtle) return plainText;

            const sharedKey = await getSharedKey(recipientId);
            if (!sharedKey) {
                console.warn(`⚠️ [E2EE] No public key for ${recipientId}, sending plain text`);
                return plainText;
            }

            const iv = (global as any).crypto.getRandomValues(new Uint8Array(12));

            // Native-friendly UTF-8 string to bytes conversion
            const plainTextBuf = new Uint8Array(unescape(encodeURIComponent(plainText)).split('').map(c => c.charCodeAt(0)));

            const encryptedBuf = await subtle.encrypt(
                { name: "AES-GCM", iv },
                sharedKey,
                plainTextBuf
            );

            return "E2EE:" + bufferToBase64(iv.buffer) + ":" + bufferToBase64(encryptedBuf);
        } catch (error) {
            console.error("❌ [E2EE] Encryption failed:", error);
            return plainText;
        }
    };

    /**
     * Decrypt Message. If the cached shared key fails (peer reinstalled and
     * rotated keys), refetches the peer key once and retries.
     */
    const decryptMessage = async (peerId: string, encryptedData: string) => {
        if (!encryptedData || !encryptedData.startsWith("E2EE:")) return encryptedData;
        try {
            const subtle = getSubtle();
            if (!subtle) return "[Encrypted Content - Crypto Unavailable]";

            const parts = encryptedData.split(":");
            if (parts.length < 3) return encryptedData;

            const iv = new Uint8Array(base64ToBuffer(parts[1]));
            const cipherTextBuf = base64ToBuffer(parts[2]);

            const attemptDecrypt = async (forceRefresh: boolean) => {
                const sharedKey = await getSharedKey(peerId, forceRefresh);
                if (!sharedKey) return null;
                return subtle.decrypt({ name: "AES-GCM", iv }, sharedKey, cipherTextBuf);
            };

            let decryptedBuf: ArrayBuffer | null = null;
            try {
                decryptedBuf = await attemptDecrypt(false);
            } catch {
                // Cached key may be stale (peer rotated keys) — retry fresh once
                console.warn(`🔄 [E2EE] Decrypt failed with cached key for ${peerId}, retrying with fresh key...`);
                decryptedBuf = await attemptDecrypt(true);
            }

            if (!decryptedBuf) return "[Encrypted Content - Key Missing]";

            // Native-friendly bytes to UTF-8 string conversion
            return decodeURIComponent(escape(String.fromCharCode(...new Uint8Array(decryptedBuf))));
        } catch (error) {
            console.error("❌ [E2EE] Decryption failed:", error);
            return "[Decryption Error]";
        }
    };

    return {
        registerMyPublicKey,
        encryptMessage,
        decryptMessage
    };
};
