import * as Crypto from 'expo-crypto';

/**
 * Encrypts a string using SHA-512
 * @param text The string to encrypt
 * @returns The SHA-512 hash as a hex string
 */
export const hashSHA512 = async (text: string): Promise<string> => {
    if (!text) return '';
    try {
        const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA512,
            text
        );
        return hash;
    } catch (error) {
        console.error('SHA-512 Hashing error:', error);
        return '';
    }
};
