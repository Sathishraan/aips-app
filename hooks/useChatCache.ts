import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
    buildChatCacheData,
    inferChatPeerRole,
    resolveLockedPeerName,
    type ChatPeerRole,
} from '../utils/chatCache.utils';

// Helper: never let one corrupt SecureStore entry break the whole chat list
const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch (e) {
        console.warn('⚠️ [ChatCache] Corrupt cache entry ignored');
        return fallback;
    }
};

// Tiny deterministic string hash (djb2) — used to disambiguate sanitized
// SecureStore keys so two different chatIds that collapse to the same
// [a-zA-Z0-9._-] string don't silently share a message store.
const shortHash = (input: string): string => {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36);
};

export interface Message {
    id: string;
    type: 'text' | 'image' | 'video' | 'file' | 'voice' | 'poll';
    content: string;
    sender: 'user' | 'other';
    senderName?: string;
    rawSenderId?: string;
    timestamp: string;
    duration?: string;
    fileName?: string;
    status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    createdAt?: string;
    /** Soft-deleted for everyone (staff unsend) */
    isDeleted?: boolean;
    /** True for locally-created messages awaiting server confirmation */
    isOptimistic?: boolean;
    pollData?: {
        pollId: number | string;
        question: string;
        options: { id: number | string; text: string; votes: number; votedByMe?: boolean }[];
        totalVotes: number;
        hasVoted?: boolean;
    };
}

export interface ChatCacheItem {
    id: string;
    name: string;
    peerRole?: ChatPeerRole;
    lastMessage: string;
    lastSenderName?: string;
    lastMessageStatus?: Message['status'];
    lastMessageSender?: Message['sender'];
    time: string;
    type: 'individual' | 'group';
    data: any;
    messages?: Message[];
    unreadCount?: number;
}

const applyPeerIdentity = (
    chat: Partial<ChatCacheItem> & { id: string },
    proposedName?: string,
    incomingData?: any,
    lastSenderIsMe?: boolean
) => {
    const type: ChatCacheItem['type'] =
        chat.type ||
        (String(chat.id).startsWith('group_') || chat.id === 'broadcast_all_school' ? 'group' : 'individual');
    const mergedData = { ...(chat.data || {}), ...(incomingData || {}) };
    if (!mergedData.peerRole && chat.peerRole) {
        mergedData.peerRole = chat.peerRole;
    }
    const peerRole = inferChatPeerRole({ chatId: chat.id, type, data: mergedData });
    const roleName =
        peerRole === 'staff'
            ? (mergedData.staff_name || proposedName)
            : peerRole === 'student'
                ? (mergedData.student_name || proposedName)
                : proposedName;
    const peerName =
        resolveLockedPeerName({
            existingName: chat.name,
            proposedName,
            roleName,
            lastSenderName: chat.lastSenderName,
            lastSenderIsMe,
        }) ||
        proposedName ||
        chat.name ||
        (peerRole === 'staff' ? 'Staff Member' : peerRole === 'group' ? 'Group Chat' : 'Student');

    return {
        name: peerName,
        peerRole,
        type,
        data: buildChatCacheData({
            chatId: chat.id,
            type,
            peerRole,
            peerName,
            incoming: incomingData,
            existing: chat.data,
        }),
    };
};

const CURRENT_CHAT_CACHE_VERSION = 'v8';
const CHAT_FRESH_START_FLAG = 'chat_fresh_start_v8';
const LEGACY_CHAT_VERSIONS = ['', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'];

const uniqueStrings = (values: string[]) => [...new Set(values.filter(Boolean))];

const purgeUserChatCaches = async (userId: string) => {
    const listKeys = uniqueStrings([
        ...LEGACY_CHAT_VERSIONS.flatMap((version) => [
            version ? `recent_chats_${userId}_${version}` : `recent_chats_${userId}`,
            version ? `recent_chats_${version}` : 'recent_chats',
        ]),
    ]);

    for (const listKey of listKeys) {
        try {
            const stored = await SecureStore.getItemAsync(listKey);
            const summaries = safeParse<Array<{ id?: string }>>(stored, []);
            await Promise.all(
                summaries.map(async (chat) => {
                    const chatId = String(chat?.id || '');
                    if (!chatId) return;
                    const sanitized = chatId.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const hashed = shortHash(chatId);
                    const msgKeys = uniqueStrings(
                        LEGACY_CHAT_VERSIONS.flatMap((version) => {
                            const prefix = version
                                ? `msg_store_${userId}_${version}_`
                                : `msg_store_${userId}_`;
                            return [
                                `${prefix}${sanitized}_${hashed}`,
                                `${prefix}${sanitized}`,
                            ];
                        })
                    );
                    await Promise.all(msgKeys.map((key) => SecureStore.deleteItemAsync(key).catch(() => undefined)));
                })
            );
            await SecureStore.deleteItemAsync(listKey);
        } catch {
            // Ignore missing/legacy keys
        }
    }
};

export const useChatCache = (userId?: string) => {
    const [chats, setChats] = useState<ChatCacheItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Reactive cache keys based on userId - MUST BE MEMOIZED TO PREVENT INFINITE LOOPS
    const { CHAT_CACHE_KEY, CHAT_MESSAGES_PREFIX } = useMemo(() => ({
        CHAT_CACHE_KEY: userId ? `recent_chats_${userId}_${CURRENT_CHAT_CACHE_VERSION}` : `recent_chats_${CURRENT_CHAT_CACHE_VERSION}`,
        CHAT_MESSAGES_PREFIX: userId ? `msg_store_${userId}_${CURRENT_CHAT_CACHE_VERSION}_` : `msg_store_${CURRENT_CHAT_CACHE_VERSION}_`
    }), [userId]);

    const CHAT_UPDATE_EVENT = 'chat_cache_updated';

    // --- Write serialization ---------------------------------------------
    // All of the mutator functions below do read -> modify -> write against
    // SecureStore (CHAT_CACHE_KEY and/or a per-chat message key). Without
    // serialization, two mutators firing close together (e.g. a new socket
    // message landing while markChatAsRead is running) can both read the
    // same "old" snapshot and the later write silently clobbers the other's
    // change (lost unread counts, resurrected/duplicated messages, etc).
    //
    // This chains every mutation through a single promise per hook instance,
    // so within one mounted component all cache writes are strictly
    // sequential. It does not protect against two separate component
    // instances writing concurrently, but SecureStore itself has no
    // cross-process locking to offer there either.
    const lockRef = useRef<Promise<any>>(Promise.resolve());
    const withLock = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
        const run = lockRef.current.then(fn, fn);
        // Keep the chain alive even if a step rejects.
        lockRef.current = run.then(
            () => undefined,
            () => undefined
        );
        return run;
    }, []);

    // Helper: SecureStore keys cannot have spaces on Android, and must be
    // unique per chat — append a short hash of the original id so that two
    // different chatIds which sanitize to the same string can't collide.
    const getMsgKey = useCallback((chatId: string) => {
        if (!chatId) return 'unknown_chat';
        const sanitizedChatId = chatId.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `${CHAT_MESSAGES_PREFIX}${sanitizedChatId}_${shortHash(chatId)}`;
    }, [CHAT_MESSAGES_PREFIX]);

    /** Keep SecureStore under Android's ~2048 byte limit */
    const sanitizeMessageForStore = useCallback((m: Message): Message => {
        let content = m.content || '';
        if (m.isDeleted) {
            content = '';
        } else if (content.startsWith('data:')) {
            content = '[media]';
        } else if (content.startsWith('E2EE:')) {
            content = '[encrypted]';
        } else if (content.length > 180) {
            content = content.substring(0, 180);
        }

        return {
            id: m.id,
            type: m.type,
            content,
            sender: m.sender,
            senderName: m.senderName ? m.senderName.substring(0, 40) : undefined,
            rawSenderId: m.rawSenderId,
            timestamp: m.timestamp,
            duration: m.duration,
            fileName: m.fileName ? m.fileName.substring(0, 40) : undefined,
            status: m.status,
            createdAt: m.createdAt,
            isDeleted: m.isDeleted,
            isOptimistic: m.isOptimistic,
            // Drop heavy poll payloads from SecureStore
            pollData: m.type === 'poll' && m.pollData
                ? {
                    pollId: m.pollData.pollId,
                    question: (m.pollData.question || '').substring(0, 60),
                    options: (m.pollData.options || []).slice(0, 4).map((o) => ({
                        id: o.id,
                        text: (o.text || '').substring(0, 40),
                        votes: o.votes || 0,
                    })),
                    totalVotes: m.pollData.totalVotes || 0,
                    hasVoted: m.pollData.hasVoted,
                }
                : undefined,
        };
    }, []);

    // Helper: Save messages for a specific chat separately
    const persistMessages = useCallback(async (chatId: string, messages: Message[]) => {
        if (!userId) return; // Don't persist if no user
        try {
            const key = getMsgKey(chatId);
            // Only last 5, heavily truncated — SecureStore Android limit ~2048 bytes
            const truncated = messages.slice(-5).map(sanitizeMessageForStore);
            const payload = JSON.stringify(truncated);
            if (payload.length > 1900) {
                // Emergency shrink: keep 2 messages, strip content further
                const emergency = truncated.slice(-2).map((m) => ({
                    ...m,
                    content: (m.content || '').substring(0, 40),
                    pollData: undefined,
                }));
                await SecureStore.setItemAsync(key, JSON.stringify(emergency));
                return;
            }
            await SecureStore.setItemAsync(key, payload);
        } catch (e) {
            console.error('Failed to persist messages for ', chatId, e);
        }
    }, [getMsgKey, userId, sanitizeMessageForStore]);

    // Helper: Save the list of chats summary
    const persistChatList = useCallback(async (items: ChatCacheItem[]) => {
        if (!userId) return;
        try {
            const summaries = items.slice(0, 8).map((chat) => {
                const type: ChatCacheItem['type'] =
                    chat.type ||
                    (String(chat.id).startsWith('group_') || chat.id === 'broadcast_all_school'
                        ? 'group'
                        : 'individual');
                const peerRole = chat.peerRole || inferChatPeerRole({ chatId: chat.id, type, data: chat.data });
                const peerName = (chat.name || 'Chat').substring(0, 40);
                return {
                    id: chat.id,
                    name: peerName,
                    peerRole,
                    lastMessage: (chat.lastMessage || '').substring(0, 40),
                    lastSenderName: chat.lastSenderName
                        ? String(chat.lastSenderName).substring(0, 24)
                        : undefined,
                    lastMessageStatus: chat.lastMessageStatus,
                    lastMessageSender: chat.lastMessageSender,
                    time: chat.time,
                    unreadCount: chat.unreadCount || 0,
                    type,
                    data: buildChatCacheData({
                        chatId: chat.id,
                        type,
                        peerRole,
                        peerName,
                        existing: chat.data,
                    }),
                };
            });
            const payload = JSON.stringify(summaries);
            if (payload.length > 1900) {
                const slim = summaries.slice(0, 5).map(({ data, ...rest }) => ({
                    ...rest,
                    data: data
                        ? {
                              receiverId: data.receiverId,
                              type: data.type,
                              isStaff: data.isStaff,
                              staff_name: data.staff_name,
                              student_name: data.student_name,
                              classId: data.classId,
                              sectionId: data.sectionId,
                          }
                        : undefined,
                }));
                await SecureStore.setItemAsync(CHAT_CACHE_KEY, JSON.stringify(slim));
                return;
            }
            await SecureStore.setItemAsync(CHAT_CACHE_KEY, payload);
        } catch (e) {
            console.error('Failed to persist chat list summary', e);
        }
    }, [CHAT_CACHE_KEY, userId]);

    const loadChats = useCallback(async () => {
        if (!userId) {
            setChats([]);
            setIsLoaded(true);
            return;
        }
        try {
            const freshFlagKey = `${CHAT_FRESH_START_FLAG}_${userId}`;
            const alreadyFresh = await SecureStore.getItemAsync(freshFlagKey);
            if (alreadyFresh !== '1') {
                console.log('🧹 [ChatCache] Clearing all stored chats for a fresh start');
                await purgeUserChatCaches(userId);
                await SecureStore.setItemAsync(freshFlagKey, '1');
                setChats([]);
                setIsLoaded(true);
                return;
            }

            const stored = await SecureStore.getItemAsync(CHAT_CACHE_KEY);

            if (stored) {
                const summaries: ChatCacheItem[] = safeParse(stored, []);
                const fullChats = await Promise.all(summaries.map(async (chat) => {
                    const key = getMsgKey(chat.id);
                    const msgStored = await SecureStore.getItemAsync(key);
                    return {
                        ...chat,
                        messages: safeParse<Message[]>(msgStored, [])
                    };
                }));
                setChats(fullChats);
            } else {
                setChats([]);
            }
            setIsLoaded(true);
        } catch (error) {
            console.error('Failed to load chat cache:', error);
            setIsLoaded(true);
        }
    }, [CHAT_CACHE_KEY, getMsgKey, userId]);

    const addChat = useCallback(async (item: ChatCacheItem) => {
        if (!userId) return;
        await withLock(async () => {
            try {
                const stored = await SecureStore.getItemAsync(CHAT_CACHE_KEY);
                let currentSummaries: any[] = safeParse(stored, []);

                const existingIndex = currentSummaries.findIndex(c => c.id === item.id);
                if (existingIndex !== -1) {
                    currentSummaries.splice(existingIndex, 1);
                }

                const identity = applyPeerIdentity(item, item.name, item.data, false);
                const nextItem = { ...item, ...identity };
                currentSummaries.unshift(nextItem);
                await persistChatList(currentSummaries);
                if (item.messages) await persistMessages(item.id, item.messages);

                DeviceEventEmitter.emit(CHAT_UPDATE_EVENT);
            } catch (error) {
                console.error('Failed to save chat to cache:', error);
            }
        });
    }, [CHAT_CACHE_KEY, persistChatList, persistMessages, userId, withLock]);

    const addMessageToCache = useCallback(async (chatId: string, message: Message, fallbackName?: string, data?: any) => {
        if (!userId) return;
        await withLock(async () => {
            try {
                if (!chatId) {
                    console.warn('⚠️ [ChatCache] addMessageToCache called with empty chatId');
                    return;
                }

                const stored = await SecureStore.getItemAsync(CHAT_CACHE_KEY);
                let currentSummaries: any[] = safeParse(stored, []);

                const msgKey = getMsgKey(chatId);
                const msgStored = await SecureStore.getItemAsync(msgKey);
                let history: Message[] = safeParse(msgStored, []);

                // Normalize the incoming message the same way it will be
                // stored, BEFORE comparing it against history. History is
                // always stored post-sanitizeMessageForStore (content capped
                // at 180 chars), so comparing raw incoming content against it
                // would never match for longer messages and optimistic
                // messages would never reconcile with their server echo.
                const normalizedIncoming = sanitizeMessageForStore(message);

                // 1. Exact Duplicate (same ID)
                const exactIndex = history.findIndex(m => m.id === normalizedIncoming.id);

                // 2. Fuzzy Duplicate (sender is user, same content, recent)
                // This catches optimistic messages when server returns a different ID
                let fuzzyIndex = -1;
                if (exactIndex === -1 && normalizedIncoming.sender === 'user') {
                    fuzzyIndex = history.findIndex(m =>
                        m.sender === 'user' &&
                        m.content === normalizedIncoming.content &&
                        (m.status === 'pending' || m.status === 'sent')
                        // IDs like 'temp_' or UUIDs are likely optimistic
                        && (m.isOptimistic || m.id.includes('temp') || m.id.length > 30)
                    );
                }

                const isDuplicate = exactIndex !== -1 || fuzzyIndex !== -1;

                if (exactIndex !== -1) {
                    // Update existing exact message
                    history[exactIndex] = sanitizeMessageForStore({ ...history[exactIndex], ...message });
                } else if (fuzzyIndex !== -1) {
                    // Match optimistic message to server message
                    console.log(`🔄 [Cache] Fuzzy match found for ${message.id}. Replacing optimistic ${history[fuzzyIndex].id}`);
                    history[fuzzyIndex] = normalizedIncoming;
                } else {
                    // Truly new message
                    history = [...history, normalizedIncoming];
                }
                history = history.slice(-5);
                await SecureStore.setItemAsync(msgKey, JSON.stringify(history));

                const chatIndex = currentSummaries.findIndex(c => c.id === chatId);
                let targetChat: any;

                if (chatIndex !== -1) {
                    targetChat = currentSummaries[chatIndex];
                    targetChat.lastMessage = message.type === 'text' ? message.content : `[${message.type}]`;
                    targetChat.time = message.timestamp;
                    targetChat.lastSenderName = message.senderName;
                    targetChat.lastMessageStatus = message.status || 'sent';
                    targetChat.lastMessageSender = message.sender;
                    Object.assign(
                        targetChat,
                        applyPeerIdentity(targetChat, fallbackName, data, message.sender === 'user')
                    );

                    if (message.sender !== 'user' && !isDuplicate) {
                        targetChat.unreadCount = (targetChat.unreadCount || 0) + 1;
                    }

                    currentSummaries.splice(chatIndex, 1);
                } else {
                    const seed = applyPeerIdentity(
                        {
                            id: chatId,
                            type: (chatId || '').startsWith('group_') ? 'group' : 'individual',
                            lastSenderName: message.senderName,
                        },
                        fallbackName,
                        data,
                        message.sender === 'user'
                    );
                    targetChat = {
                        id: chatId,
                        lastMessage: message.type === 'text' ? message.content : `[${message.type}]`,
                        lastMessageStatus: message.status || 'sent',
                        lastMessageSender: message.sender,
                        lastSenderName: message.senderName,
                        time: message.timestamp,
                        unreadCount: message.sender !== 'user' ? 1 : 0,
                        ...seed,
                    };
                }

                currentSummaries.unshift(targetChat);
                await persistChatList(currentSummaries);

                DeviceEventEmitter.emit(CHAT_UPDATE_EVENT);
            } catch (error) {
                console.error('Failed to add message to cache:', error);
            }
        });
    }, [CHAT_CACHE_KEY, getMsgKey, persistChatList, userId, sanitizeMessageForStore, withLock]);

    const getChatMessages = useCallback(async (chatId: string) => {
        if (!userId) return [];
        const key = getMsgKey(chatId);
        const stored = await SecureStore.getItemAsync(key);
        return safeParse<Message[]>(stored, []);
    }, [getMsgKey, userId]);

    const syncMessagesToCache = useCallback(async (chatId: string, messages: Message[], fallbackName?: string, data?: any) => {
        if (!userId || !chatId) return;
        await withLock(async () => {
            try {
                const storedSummaries = await SecureStore.getItemAsync(CHAT_CACHE_KEY);
                let summaries: any[] = safeParse(storedSummaries, []);

                const chatIndex = summaries.findIndex(c => c.id === chatId);

                // Merge with existing cached msgs so realtime/pending aren't wiped by history sync
                const msgKey = getMsgKey(chatId);
                const existingStored = await SecureStore.getItemAsync(msgKey);
                const existing: Message[] = safeParse(existingStored, []);
                const map = new Map<string, Message>();
                existing.forEach((m) => map.set(m.id, sanitizeMessageForStore(m)));
                messages.forEach((m) => {
                    const prev = map.get(m.id);
                    const next = sanitizeMessageForStore(m);
                    map.set(m.id, prev ? { ...prev, ...next, isDeleted: prev.isDeleted || next.isDeleted } : next);
                });

                // Remove exact duplicate content from the same sender within the
                // same second when a realtime/cache race produced two records.
                // Messages without a createdAt fall back to a key derived from
                // their own id (rather than a constant "0" bucket), so distinct
                // timestamp-less messages with identical text don't collapse
                // into each other and get incorrectly dropped.
                const seenContent = new Set<string>();
                Array.from(map.values()).forEach((message) => {
                    if (message.type !== 'text') return;
                    const bucket = message.createdAt
                        ? String(Math.floor(new Date(message.createdAt).getTime() / 1000))
                        : `no-ts-${message.id}`;
                    const key = `${message.sender}|${message.content}|${bucket}`;
                    if (seenContent.has(key)) map.delete(message.id);
                    else seenContent.add(key);
                });
                // Fuzzy: drop optimistic temps that match a server message
                Array.from(map.values()).forEach((m) => {
                    const looksOptimistic = m.isOptimistic || m.id.includes('temp') || m.id.length > 30;
                    if (m.sender !== 'user' || !looksOptimistic) return;
                    const serverMatch = Array.from(map.values()).find(
                        (o) =>
                            o.id !== m.id &&
                            o.sender === 'user' &&
                            o.content === m.content &&
                            !(o.isOptimistic || o.id.includes('temp') || o.id.length > 30)
                    );
                    if (serverMatch) map.delete(m.id);
                });

                const history = Array.from(map.values()).slice(-5);
                const lastMsg = history.length > 0 ? history[history.length - 1] : null;
                const chatKind = chatId.startsWith('group_') || chatId === 'broadcast_all_school' ? 'group' : 'individual';

                let targetSummary: any;
                if (chatIndex !== -1) {
                    targetSummary = summaries[chatIndex];
                    if (lastMsg) {
                        targetSummary.lastMessage = lastMsg.type === 'text' ? lastMsg.content : `[${lastMsg.type}]`;
                        targetSummary.time = lastMsg.timestamp;
                        targetSummary.lastMessageStatus = lastMsg.status;
                        targetSummary.lastMessageSender = lastMsg.sender;
                        if (lastMsg.senderName) targetSummary.lastSenderName = lastMsg.senderName;
                    }
                    Object.assign(
                        targetSummary,
                        applyPeerIdentity(targetSummary, fallbackName, data, lastMsg?.sender === 'user')
                    );
                    summaries.splice(chatIndex, 1);
                } else {
                    const seed = applyPeerIdentity(
                        {
                            id: chatId,
                            type: chatKind,
                            lastSenderName: lastMsg?.senderName,
                        },
                        fallbackName,
                        data,
                        lastMsg?.sender === 'user'
                    );
                    targetSummary = {
                        id: chatId,
                        lastMessage: lastMsg ? (lastMsg.type === 'text' ? lastMsg.content : `[${lastMsg.type}]`) : '',
                        lastMessageStatus: lastMsg?.status,
                        lastMessageSender: lastMsg?.sender,
                        lastSenderName: lastMsg?.senderName,
                        time: lastMsg ? lastMsg.timestamp : '',
                        unreadCount: 0,
                        ...seed,
                    };
                }

                summaries.unshift(targetSummary);
                await persistChatList(summaries);
                await SecureStore.setItemAsync(msgKey, JSON.stringify(history));

                DeviceEventEmitter.emit(CHAT_UPDATE_EVENT);
            } catch (error) {
                console.error('❌ [ChatCache] Sync failed:', error);
            }
        });
    }, [CHAT_CACHE_KEY, getMsgKey, persistChatList, userId, sanitizeMessageForStore, withLock]);

    const clearCache = useCallback(async () => {
        await withLock(async () => {
            try {
                // Delete each chat's message store first, then the summary list
                const stored = await SecureStore.getItemAsync(CHAT_CACHE_KEY);
                const summaries: any[] = safeParse(stored, []);
                await Promise.all(
                    summaries.map((chat) => SecureStore.deleteItemAsync(getMsgKey(chat.id)).catch(() => { }))
                );
                await SecureStore.deleteItemAsync(CHAT_CACHE_KEY);
                setChats([]);
                DeviceEventEmitter.emit(CHAT_UPDATE_EVENT);
            } catch (e) {
                console.error('Failed to clear cache:', e);
            }
        });
    }, [CHAT_CACHE_KEY, getMsgKey, withLock]);

    useEffect(() => {
        loadChats();
        let timeoutId: any = null;
        const subscription = DeviceEventEmitter.addListener(CHAT_UPDATE_EVENT, () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                loadChats();
            }, 150);
        });
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            subscription.remove();
        };
    }, [loadChats]);

    const markChatAsRead = useCallback(async (chatId: string) => {
        if (!userId) return;
        await withLock(async () => {
            try {
                const stored = await SecureStore.getItemAsync(CHAT_CACHE_KEY);
                let currentSummaries: any[] = safeParse(stored, []);

                const chatIndex = currentSummaries.findIndex(c => c.id === chatId);
                if (chatIndex !== -1 && (currentSummaries[chatIndex].unreadCount || 0) > 0) {
                    currentSummaries[chatIndex].unreadCount = 0;
                    await persistChatList(currentSummaries);
                    DeviceEventEmitter.emit(CHAT_UPDATE_EVENT);
                }
            } catch (error) {
                console.error('Failed to mark chat as read:', error);
            }
        });
    }, [CHAT_CACHE_KEY, persistChatList, userId, withLock]);

    const updateMessageStatus = useCallback(async (chatId: string, messageId: string, status: Message['status']) => {
        if (!userId) return;
        await withLock(async () => {
            try {
                let changed = false;
                // 1. Update Message History
                const msgKey = getMsgKey(chatId);
                const msgStored = await SecureStore.getItemAsync(msgKey);
                if (msgStored) {
                    let history: Message[] = safeParse(msgStored, []);
                    const msgIndex = history.findIndex(m => m.id === messageId);
                    if (msgIndex !== -1 && history[msgIndex].status !== status) {
                        history[msgIndex].status = status;
                        await SecureStore.setItemAsync(msgKey, JSON.stringify(history));
                        changed = true;
                    }
                }

                // 2. Update Chat Summary
                const stored = await SecureStore.getItemAsync(CHAT_CACHE_KEY);
                if (stored) {
                    let currentSummaries: any[] = safeParse(stored, []);
                    const chatIndex = currentSummaries.findIndex(c => c.id === chatId);
                    if (chatIndex !== -1) {
                        const chat = currentSummaries[chatIndex];
                        if (chat.lastMessageStatus !== status) {
                            chat.lastMessageStatus = status;
                            await persistChatList(currentSummaries);
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    DeviceEventEmitter.emit(CHAT_UPDATE_EVENT);
                }
            } catch (error) {
                console.error('Failed to update message status in cache:', error);
            }
        });
    }, [CHAT_CACHE_KEY, getMsgKey, persistChatList, userId, withLock]);

    const markMessageDeleted = useCallback(async (chatId: string, messageId: string) => {
        if (!userId || !chatId || !messageId) return;
        await withLock(async () => {
            try {
                const msgKey = getMsgKey(chatId);
                const msgStored = await SecureStore.getItemAsync(msgKey);
                let history: Message[] = safeParse(msgStored, []);
                const idx = history.findIndex(
                    (m) => m.id === messageId || m.id === messageId.toString()
                );
                if (idx !== -1) {
                    history[idx] = {
                        ...history[idx],
                        isDeleted: true,
                        content: '',
                        type: history[idx].type === 'poll' ? 'text' : history[idx].type,
                        pollData: undefined,
                        fileName: undefined,
                    };
                    await SecureStore.setItemAsync(msgKey, JSON.stringify(history));
                }

                const stored = await SecureStore.getItemAsync(CHAT_CACHE_KEY);
                let summaries: any[] = safeParse(stored, []);
                const chatIndex = summaries.findIndex((c) => c.id === chatId);
                if (chatIndex !== -1) {
                    const lastVisible = [...history].reverse().find((m) => !m.isDeleted);
                    const chat = summaries[chatIndex];
                    if (lastVisible) {
                        chat.lastMessage = lastVisible.type === 'text'
                            ? lastVisible.content
                            : `[${lastVisible.type}]`;
                        chat.lastMessageStatus = lastVisible.status;
                        chat.lastMessageSender = lastVisible.sender;
                        chat.time = lastVisible.timestamp;
                    } else if (idx !== -1) {
                        chat.lastMessage = 'This message was deleted';
                    }
                    await persistChatList(summaries);
                }
                DeviceEventEmitter.emit(CHAT_UPDATE_EVENT);
            } catch (error) {
                console.error('Failed to mark message deleted in cache:', error);
            }
        });
    }, [CHAT_CACHE_KEY, getMsgKey, persistChatList, userId, withLock]);

    const updateChatStatus = useCallback(async (chatId: string, status: Message['status']) => {
        if (!userId) return;
        await withLock(async () => {
            try {
                // 1. Update History (last 5 messages)
                const msgKey = getMsgKey(chatId);
                const msgStored = await SecureStore.getItemAsync(msgKey);
                if (msgStored) {
                    let history: Message[] = safeParse(msgStored, []);
                    let changed = false;
                    history.forEach(m => {
                        if (m.sender === 'user' && m.status !== status) {
                            m.status = status;
                            changed = true;
                        }
                    });
                    if (changed) await SecureStore.setItemAsync(msgKey, JSON.stringify(history));
                }

                // 2. Update Summary
                const stored = await SecureStore.getItemAsync(CHAT_CACHE_KEY);
                if (stored) {
                    let currentSummaries: any[] = safeParse(stored, []);
                    const chatIndex = currentSummaries.findIndex(c => c.id === chatId);
                    if (chatIndex !== -1) {
                        const chat = currentSummaries[chatIndex];
                        if (chat.lastMessageSender === 'user' && chat.lastMessageStatus !== status) {
                            chat.lastMessageStatus = status;
                            await persistChatList(currentSummaries);
                        }
                    }
                }
                DeviceEventEmitter.emit(CHAT_UPDATE_EVENT);
            } catch (error) {
                console.error('Failed to update chat status in cache:', error);
            }
        });
    }, [CHAT_CACHE_KEY, getMsgKey, persistChatList, userId, withLock]);

    return {
        chats,
        isLoaded,
        addChat,
        loadChats,
        addMessageToCache,
        getChatMessages,
        syncMessagesToCache,
        markChatAsRead,
        updateMessageStatus,
        updateChatStatus,
        markMessageDeleted,
        clearCache
    };
};