import { useEffect, useRef } from 'react';
import { socket } from '../api/socket';
import { useUser, isStudent, isPrincipal } from './useUser';
import { useChatCache, Message } from './useChatCache';
import { useGroupMessages, useAllIndividualMessages } from './useStudentData';
import { useE2EE } from './useE2EE';
import {
    showLocalNotification,
    resolveModuleNotification,
} from '../utils/notification.utils';
import {
    buildGroupCacheId,
    isGroupPayload,
    resolveCacheChatId,
    resolveMessageContentType,
} from '../utils/chatCache.utils';

const NODE_URL = process.env.EXPO_PUBLIC_NODE_URL || '';

const isPlaceholderName = (name?: string | null) =>
    !name ||
    ['Chat', 'Chat Member', 'Unknown', 'Unknown Sender', 'Staff', 'Communication', 'Student'].includes(String(name).trim()) ||
    /^EMP\d+$/i.test(String(name).trim()) ||
    /^\d+$/.test(String(name).trim());

const firstDisplayName = (...names: Array<string | null | undefined>) =>
    names.find((name) => name && !isPlaceholderName(name)) || undefined;

const isStaffRoleValue = (role?: any) => {
    const value = String(role || '').toLowerCase();
    return ['staff', 'employee', 'admin', '1', 'principal'].includes(value);
};

const messagePeerIsStaff = (m: any, isMe: boolean, iAmStudent: boolean) => {
    if (m?.isStaffChat || m?.isStaff || m?.is_staff) return true;
    if (String(m?.peerRole || '').toLowerCase() === 'staff') return true;
    const receiverRole = m?.receiverRole || m?.receiver_role;
    const senderRole = m?.senderRole || m?.sender_role;
    if (isStaffRoleValue(receiverRole) && isStaffRoleValue(senderRole)) return true;
    if (isMe && isStaffRoleValue(receiverRole)) return true;
    if (!isMe && isStaffRoleValue(senderRole)) return true;
    if ((m?.emp_id || m?.employeeId) && !m?.stud_id && !m?.stud_no) return true;
    return iAmStudent;
};

const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('file')) return path;
    const cleanBase = (NODE_URL || '').endsWith('/') ? NODE_URL : `${NODE_URL}/`;
    return `${cleanBase}${path.startsWith('/') ? path.substring(1) : path}`;
};

const extractMediaAndType = (raw: any): { content: string; type: Message['type'] } => {
    const attachment = raw.attachment || raw.isAttachment || raw.is_attachment;
    const voiceNote = raw.voice_note || raw.voiceNote;
    let message = raw.message || raw.content || '';

    // Never use raw.type — Node API uses type=1|2 for chat kind, not media type
    let type: Message['type'] = resolveMessageContentType(raw);

    const contentStr = typeof message === 'string' ? message : '';
    const isVoiceExt = contentStr.match(/\.(m4a|mp3|wav|aac|ogg)(\?.*)?$/i);
    const isImgExt = contentStr.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i);

    if (type === 'voice' || voiceNote || isVoiceExt) {
        type = 'voice';
        message = getMediaUrl(voiceNote || message || (typeof attachment === 'string' ? attachment : ''));
    } else if (type === 'image' || (typeof attachment === 'string' && attachment) || isImgExt) {
        type = 'image';
        message = getMediaUrl(typeof attachment === 'string' ? attachment : message);
    } else if (type === 'video' || contentStr.match(/\.(mp4|mov|avi)(\?.*)?$/i)) {
        type = 'video';
        message = getMediaUrl(typeof attachment === 'string' ? attachment : message);
    } else if (type === 'file' || contentStr.match(/\.(pdf|doc|docx|xls|xlsx|zip)(\?.*)?$/i)) {
        type = 'file';
        message = getMediaUrl(typeof attachment === 'string' ? attachment : message);
    } else if (type === 'poll') {
        type = 'poll';
    } else {
        type = 'text';
    }

    return { content: message, type };
};

/**
 * useGlobalMessageListener
 * Logic:
 * 1. Listen for real-time socket messages (Group & Individual)
 * 2. On Load: Sync historical group messages (Discovery)
 * 3. On Load: Sync all historical individual messages (Solo Discovery)
 */
export const useGlobalMessageListener = () => {
    const { user } = useUser();
    const userId = (user as any)?.studentId || (user as any)?.employeeId || (user as any)?.adminId;

    const { addMessageToCache, syncMessagesToCache, updateMessageStatus, updateChatStatus, markMessageDeleted } = useChatCache(userId);
    const { decryptMessage } = useE2EE();

    const student = user && isStudent(user) ? user : null;
    const myId = userId; // Keep for internal logic compatibility or replace throughout
    const isPrincipalUser = !!(user && isPrincipal(user));
    const myClass = student?.class;
    const mySection = student?.section;

    // Keep latest fns in refs so socket effect does not re-bind every render
    const addMessageToCacheRef = useRef(addMessageToCache);
    const updateMessageStatusRef = useRef(updateMessageStatus);
    const updateChatStatusRef = useRef(updateChatStatus);
    const markMessageDeletedRef = useRef(markMessageDeleted);
    const decryptMessageRef = useRef(decryptMessage);
    const syncMessagesToCacheRef = useRef(syncMessagesToCache);
    addMessageToCacheRef.current = addMessageToCache;
    updateMessageStatusRef.current = updateMessageStatus;
    updateChatStatusRef.current = updateChatStatus;
    markMessageDeletedRef.current = markMessageDeleted;
    decryptMessageRef.current = decryptMessage;
    syncMessagesToCacheRef.current = syncMessagesToCache;

    // Session-based deduplication map to prevent rapid-fire duplicate processing
    const processedMessageIds = useRef(new Set<string>());
    const loggedInit = useRef(false);
    if (!loggedInit.current && userId) {
        loggedInit.current = true;
        console.log('👂 [GlobalListener] Ready', { userId });
    }

    // 🚀 [Historical Sync] Discover group chats on login
    const { data: groupHistory } = useGroupMessages(
        student?.class,
        student?.section
    );

    useEffect(() => {
        if (groupHistory && groupHistory.length > 0 && student) {
            const classId = student.class;
            const sectionId = student.section || 'all';
            const cacheId = buildGroupCacheId(classId, sectionId)!;
            const chatName = `Class ${classId}${sectionId !== 'all' ? ` - ${sectionId}` : ''}`;

            console.log(`📡 [GlobalSync] Syncing ${groupHistory.length} group messages for ${cacheId}`);

            const transformed = groupHistory.map((m: any) => {
                const parsed = extractMediaAndType(m);
                return {
                    id: m.id?.toString() || Math.random().toString(),
                    type: parsed.type,
                    content: parsed.content,
                    sender: (m.senderId?.toString() === myId?.toString() || m.sender_id?.toString() === myId?.toString() ? 'user' : 'other') as any,
                    senderName: m.sender_name || m.senderName || 'Staff',
                    status: ((m.is_read || m.isRead || m.seen) ? 'read' : (m.is_delivered || m.isDelivered || m.delivered) ? 'delivered' : 'sent') as any,
                    timestamp: m.created_at || m.timestamp || new Date().toISOString()
                };
            });

            syncMessagesToCacheRef.current(
                cacheId,
                transformed,
                chatName,
                {
                    classId,
                    className: classId,
                    sectionId,
                    sectionName: sectionId === 'all' ? 'All Sections' : sectionId,
                    type: 'group',
                    cacheChatId: cacheId,
                }
            );
        }
    }, [groupHistory, myClass, mySection, myId]);

    // 🚀 [Historical Sync] Discover SOLO individual chats
    const { data: soloHistory, isLoading: isLoadingSolo } = useAllIndividualMessages(myId?.toString());

    useEffect(() => {
        console.log('🔄 [GlobalSync] soloHistory Effect Triggered', {
            myId,
            hasHistoryData: !!soloHistory,
            isLoadingSolo
        });

        if (!myId) {
            console.log('📡 [GlobalSync] Waiting for userId to start historical sync...');
            return;
        }

        if (isLoadingSolo) {
            console.log(`📡 [GlobalSync] soloHistory is loading for ${myId}...`);
            return;
        }

        if (soloHistory && soloHistory.length > 0) {
            console.log(`📡 [GlobalSync] Processing ${soloHistory.length} messages for ${myId}`);

            const threads: Record<string, { name: string, messages: any[], isStaff: boolean }> = {};

            const myGlobalIdentityIds = [
                myId,
                (user as any)?.employeeId,
                (user as any)?.employeeNo,
                (user as any)?.emp_id,
                (user as any)?.emp_no,
                (user as any)?.employee_work_id,
                (user as any)?.adminId,
                (user as any)?.admin_id,
                (user as any)?.studentId,
                (user as any)?.studentNumber,
                (user as any)?.stud_id,
                (user as any)?.stud_no,
                (user as any)?.admissionNumber,
                (user as any)?.admission_no,
                (user as any)?.mapId,
                (user as any)?.map_id,
                (user as any)?.user_id,
                (user as any)?.userId,
                (user as any)?.id,
                (user as any)?.username,
                (user as any)?.user_name,
                student?.studentNumber,
                student?.studentId,
            ]
                .filter(Boolean)
                .map((id) => String(id).trim());

            const isMySenderId = (senderId?: string | number | null) => {
                if (senderId == null || senderId === '') return false;
                return myGlobalIdentityIds.includes(String(senderId).trim());
            };

            const myThreadName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim();
            const iAmStudent = !!(user && isStudent(user));

            const processSoloHistory = async () => {
                for (const m of soloHistory) {
                    const sId = (m.senderId || m.sender_id || '').toString();
                    const rId = (m.receiverId || m.receiver_id || '').toString();

                    const isMe = isMySenderId(sId);
                    const otherId = isMe ? rId : sId;
                    if (!otherId) continue;

                    const rawTargetName = isMe
                        ? (m.receiver_name || m.receiverName)
                        : (m.sender_name || m.senderName);
                    const candidateName = firstDisplayName(rawTargetName);
                    const usableName =
                        candidateName && candidateName.trim().toLowerCase() !== myThreadName.toLowerCase()
                            ? candidateName
                            : undefined;

                    const thisPeerIsStaff = messagePeerIsStaff(m, isMe, iAmStudent);

                    if (!threads[otherId]) {
                        threads[otherId] = {
                            name: usableName || (thisPeerIsStaff ? 'Staff Member' : 'Student'),
                            messages: [],
                            isStaff: thisPeerIsStaff,
                        };
                    } else {
                        if (thisPeerIsStaff) threads[otherId].isStaff = true;
                        if (
                            usableName &&
                            (isPlaceholderName(threads[otherId].name) ||
                                threads[otherId].name.trim().toLowerCase() === myThreadName.toLowerCase())
                        ) {
                            threads[otherId].name = usableName;
                        }
                    }

                    let parsed = extractMediaAndType(m);
                    let content = parsed.content;
                    if (parsed.type === 'text' && typeof content === 'string' && content.startsWith('E2EE:')) {
                        // For solo history, otherId is always the "other party" (receiver if I sent, sender if I received)
                        content = await decryptMessageRef.current(otherId, content);
                    }

                    threads[otherId].messages.push({
                        id: m.id?.toString() || Math.random().toString(),
                        type: parsed.type,
                        content: content,
                        sender: (isMe ? 'user' : 'other') as any,
                        senderName: (() => {
                            if (isMe) return myThreadName || firstDisplayName(m.sender_name, m.senderName) || 'Me';
                            const rawName = firstDisplayName(m.sender_name, m.senderName);
                            if (rawName && /^EMP\d+$/i.test(rawName.trim())) {
                                return threads[otherId].name || 'Staff';
                            }
                            return rawName || threads[otherId].name || 'Staff';
                        })(),
                        status: ((m.is_read || m.isRead || m.seen) ? 'read' : (m.is_delivered || m.isDelivered || m.delivered) ? 'delivered' : 'sent') as any,
                        timestamp: m.created_at || m.timestamp || new Date().toISOString()
                    });
                }

                Object.keys(threads).forEach(peerId => {
                    const thread = threads[peerId];
                    syncMessagesToCacheRef.current(
                        peerId,
                        thread.messages,
                        thread.name,
                        {
                            receiverId: peerId,
                            ...(thread.isStaff
                                ? { emp_id: peerId, staff_name: thread.name, isStaff: true, peerRole: 'staff' }
                                : { stud_id: peerId, student_name: thread.name, isStaff: false, peerRole: 'student' }),
                            type: 'individual',
                            cacheChatId: peerId,
                        }
                    );
                });
            };

            processSoloHistory();
        } else {
            console.log(`📡 [GlobalSync] No individual messages found for ${myId}`);
        }
    }, [soloHistory, myId, isLoadingSolo]);

    // ⚡ [Real-time Listener]
    useEffect(() => {
        if (!userId) return;

        const handleIncomingMessage = async (data: any) => {
            const messageId = data.id?.toString() || data.clientId?.toString();

            // 🛑 DEDUPLICATION: Skip if already processed in this session
            if (messageId && processedMessageIds.current.has(messageId)) {
                console.log(`⏭️ [GlobalListener] Skipping duplicate message: ${messageId}`);
                return;
            }
            if (messageId) processedMessageIds.current.add(messageId);

            console.log('📩 [GlobalListener] Socket Message Received:', data.message || data.content);
            // Node emits type as INT 1|2 — never rely on === 'group' alone
            const isGroup = isGroupPayload(data);
            const myClass = (user as any).class;
            const mySection = (user as any).section;
            const myIdentityIds = [
                myId,
                (user as any)?.employeeId,
                (user as any)?.employeeNo,
                (user as any)?.emp_id,
                (user as any)?.emp_no,
                (user as any)?.employee_work_id,
                (user as any)?.adminId,
                (user as any)?.admin_id,
                (user as any)?.studentId,
                (user as any)?.studentNumber,
                (user as any)?.stud_id,
                (user as any)?.stud_no,
                (user as any)?.admissionNumber,
                (user as any)?.admission_no,
                (user as any)?.mapId,
                (user as any)?.map_id,
                (user as any)?.user_id,
                (user as any)?.userId,
                (user as any)?.id,
                (user as any)?.username,
                (user as any)?.user_name,
                student?.studentNumber,
                student?.studentId,
            ]
                .filter(Boolean)
                .map((id) => String(id).trim());

            const isMyLiveMessageSender = (id?: string | number | null) => {
                if (id == null || id === '') return false;
                return myIdentityIds.includes(String(id).trim());
            };

            // 🛑 FILTER LOGIC
            const isPrincipalUser = isPrincipal(user);

            if (isGroup) {
                const targetClass = String(data.classId || data.class_id || '').trim();
                const targetSection = String(data.sectionId || data.section_id || 'all').trim();
                const currentClass = String(myClass || '').trim();
                const currentSection = String(mySection || 'all').trim();

                const normTargetClass = targetClass.replace(/(ST|ND|RD|TH)$/i, '');
                const normCurClass = currentClass.replace(/(ST|ND|RD|TH)$/i, '');
                const normTargetSec = targetSection.replace(/^section\s+/i, '');
                const normCurSec = currentSection.replace(/^section\s+/i, '');

                const classMatches = !myClass || targetClass === currentClass || normTargetClass === normCurClass;
                const sectionMatches = targetSection === 'all' || currentSection === 'all' || !mySection || targetSection === currentSection || normTargetSec === normCurSec;

                if (!isPrincipalUser && (!classMatches || !sectionMatches)) return;
            } else {
                const incomingTargetIds = [
                    data.receiverId,
                    data.receiver_id,
                    data.studentId,
                    data.stud_id,
                    data.stud_no,
                    data.toId,
                ]
                    .filter((id) => id != null && id !== '')
                    .map((id) => String(id).trim());
                const incomingSenderId = (data.fromId || data.senderId || data.sender_id)?.toString().trim();

                const isForMe = incomingTargetIds.some((id) => isMyLiveMessageSender(id));
                const isFromMe = isMyLiveMessageSender(incomingSenderId);

                if (!isForMe && !isFromMe && !isPrincipalUser) return;
            }

            // 📝 PREPARE DATA
            const senderId = (data.senderId || data.fromId || data.sender_id)?.toString();
            const isMeSender = isMyLiveMessageSender(senderId) || isMyLiveMessageSender(data.fromId);
            // Robust Name Extraction — filter out raw EMP-ID strings like 'Emp402'
            const rawSenderName = data.senderName || data.sender_name || data.SenderName ||
                (data.data && (data.data.stud_firstname || data.data.staff_name)) ||
                'Unknown Sender';
            const senderName = (rawSenderName && /^EMP\d+$/i.test(rawSenderName.trim()))
                ? (data.senderRole === 'staff' || data.isStaff ? 'Staff' : 'Student')
                : rawSenderName;

            const myListenerName = (() => {
                if (user && isStudent(user)) return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student';
                if (user && (user as any).name) return (user as any).name;
                return 'You';
            })();

            console.log(`💬 [GLOBAL RECEIVE] SENDER -> ID: ${senderId} ("${senderName}") ===> RECEIVER -> ID: ${myId} ("${myListenerName}") | Type: ${isGroup ? 'GROUP' : 'INDIVIDUAL'}`);

            // Stable cache key: peer id OR group_{class}_{section} — NEVER DB parent chatId
            let chatId = resolveCacheChatId({
                payload: data,
                myIds: myIdentityIds,
            });
            let chatName: string | undefined;
            let chatData: any;

            if (isGroup) {
                const tClass = data.classId || data.class_id || myClass;
                const tSect = data.sectionId || data.section_id || mySection || 'all';
                chatId = chatId || buildGroupCacheId(tClass, tSect);
                chatName = data.chatName || `Class ${tClass}${tSect && tSect !== 'all' ? ` - ${tSect}` : ''}`;
                chatData = {
                    classId: tClass,
                    sectionId: tSect,
                    type: 'group',
                    cacheChatId: chatId,
                };
            } else {
                const incomingTargetId = (
                    data.receiverId ||
                    data.receiver_id ||
                    data.studentId ||
                    data.stud_id ||
                    data.stud_no ||
                    data.toId
                )?.toString().trim();
                const incomingSenderId = (data.fromId || data.senderId || data.sender_id)?.toString().trim();
                const isMeSender = isMyLiveMessageSender(incomingSenderId);

                if (!chatId) {
                    console.warn('⚠️ [GlobalListener] Could not determine cache chatId. Data:', JSON.stringify(data));
                    chatId = isMeSender ? incomingTargetId : (incomingSenderId || senderId);
                }

                const receivedName = data.senderName || data.sender_name || data.SenderName;
                const receiverName = data.receiverName || data.receiver_name || data.data?.receiverName;
                chatName = isMeSender
                    ? (!isPlaceholderName(receiverName) ? receiverName : undefined)
                    : (!isPlaceholderName(receivedName) ? receivedName : (!isPlaceholderName(senderName) ? senderName : undefined));

                const iAmStudent = !!student;
                const livePeerIsStaff = messagePeerIsStaff(data, isMeSender, iAmStudent);
                chatData = {
                    receiverId: chatId,
                    type: 'individual',
                    cacheChatId: chatId,
                    ...(livePeerIsStaff
                        ? { emp_id: chatId, staff_name: chatName, isStaff: true, peerRole: 'staff' }
                        : { stud_id: chatId, student_name: chatName, isStaff: false, peerRole: 'student' }),
                };
            }

            if (!chatId) {
                console.warn('⚠️ [GlobalListener] Skipping cache write — empty chatId');
                return;
            }

            let status: Message['status'] = 'sent';
            const isRead = data.is_read || data.isRead || data.seen || data.isSeen || data.is_seen;
            const isDelivered = data.is_delivered || data.deliveredAt || data.delivered_at || data.isDelivered || data.delivered;
            if (isRead) status = 'read';
            else if (isDelivered) status = 'delivered';

            const isMirrored = isMyLiveMessageSender(senderId) || isMyLiveMessageSender(data.fromId);

            let parsed = extractMediaAndType(data);
            let content = parsed.content;

            // Soft-delete sync for receivers who get a deleted payload as receive_message
            const isDeletedIncoming =
                data.is_deleted === true ||
                data.isDeleted === true ||
                data.deleted === true ||
                data.status === 'deleted' ||
                data.deleteForEveryone === true;

            if (isDeletedIncoming) {
                const deletedId = (
                    data.id ||
                    data.messageId ||
                    data.clientId
                )?.toString();
                if (deletedId && chatId) {
                    await markMessageDeletedRef.current(chatId, deletedId);
                    if (data.clientId && data.clientId.toString() !== deletedId) {
                        await markMessageDeletedRef.current(chatId, data.clientId.toString());
                    }
                }
                return;
            }

            if (parsed.type === 'text' && typeof content === 'string' && content.startsWith('E2EE:')) {
                // If I am the sender, the chat is with the receiver. 
                // If I am the receiver, the chat is with the sender.
                const decryptTargetId = isMirrored
                    ? (data.receiverId || data.receiver_id || data.studentId || data.toId)
                    : senderId;

                if (decryptTargetId) {
                    console.log(`🔓 [GlobalListener] Decrypting live message. isMe: ${isMirrored}, Target: ${decryptTargetId}`);
                    content = await decryptMessageRef.current(decryptTargetId.toString(), content);
                }
            }

            const newMessage: Message = {
                id: data.id?.toString() || data.clientId?.toString() || Date.now().toString(),
                type: parsed.type,
                content: content,
                sender: isMirrored ? 'user' : 'other',
                senderName: senderName,
                rawSenderId: senderId,
                status: status,
                timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            };

            await addMessageToCacheRef.current(chatId!, newMessage, chatName || undefined, chatData);

            // Parent popup: notify when staff/other sends a message (not own mirror)
            if (!isMirrored && !isDeletedIncoming) {
                const preview =
                    parsed.type === 'text'
                        ? (typeof content === 'string' ? content : 'New message')
                        : `[${parsed.type}]`;
                showLocalNotification({
                    title: isGroup ? (chatName || 'Class message') : (senderName || 'New message'),
                    body: String(preview).startsWith('E2EE:')
                        ? 'New encrypted message'
                        : String(preview).substring(0, 120),
                    channelId: 'messages',
                    data: {
                        type: 'message',
                        screen: 'Communication',
                        chatId: chatId?.toString(),
                        classId: chatData?.classId,
                        sectionId: chatData?.sectionId,
                    },
                });
            }
        };
        const myIdentityIds = [
            myId,
            (user as any)?.employeeId,
            (user as any)?.emp_id,
            (user as any)?.adminId,
            (user as any)?.studentId,
            student?.studentNumber,
        ];

        const resolveStatusChatId = (data: any) =>
            resolveCacheChatId({ payload: data, myIds: myIdentityIds });

        const handleStatusUpdate = (data: any) => {
            console.log('🔄 [GlobalListener] Status Update:', data);
            const messageId = (data.id || data.messageId || data.clientId)?.toString();
            const chatId = resolveStatusChatId(data);

            const isDeletedEvent =
                data.status === 'deleted' ||
                data.is_deleted === true ||
                data.isDeleted === true ||
                data.deleted === true ||
                data.deleteForEveryone === true;

            if (isDeletedEvent && messageId) {
                console.log('🗑️ [GlobalListener] Delete via status:', messageId);
                const targetChatId = resolveStatusChatId(data);
                if (targetChatId) {
                    markMessageDeletedRef.current(targetChatId, messageId);
                    if (data.clientId && data.clientId.toString() !== messageId) {
                        markMessageDeletedRef.current(targetChatId, data.clientId.toString());
                    }
                }
                return;
            }

            let status: Message['status'] = data.status;
            if (!status) {
                if (data.is_read || data.isRead || data.seen || data.isSeen || data.is_seen) status = 'read';
                else if (data.is_delivered || data.deliveredAt || data.delivered_at || data.isDelivered || data.delivered) status = 'delivered';
            }

            if (chatId && status) {
                if (messageId) {
                    updateMessageStatusRef.current(chatId, messageId, status);
                } else {
                    updateChatStatusRef.current(chatId, status);
                }
            }
        };

        const handleMessageDeleted = (data: any) => {
            console.log('🗑️ [GlobalListener] Message deleted:', data);
            const messageId = (data.messageId || data.id || data.clientId)?.toString();
            if (!messageId) return;

            const targetChatId = resolveStatusChatId(data);
            if (targetChatId) {
                markMessageDeletedRef.current(targetChatId, messageId);
                if (data.clientId && data.clientId.toString() !== messageId) {
                    markMessageDeletedRef.current(targetChatId, data.clientId.toString());
                }
            }
        };

        const handleModuleNotification = (raw: any) => {
            console.log('🔔 [GlobalListener] Module notification:', raw);
            const resolved = resolveModuleNotification(raw);
            showLocalNotification({
                title: resolved.title,
                body: resolved.body,
                channelId: resolved.channelId,
                data: resolved.data,
            });
        };

        socket.on('receive_message', handleIncomingMessage);
        socket.on('message_status', handleStatusUpdate);
        socket.on('message_status_update', handleStatusUpdate);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('delete_message', handleMessageDeleted);
        // Backend module pushes (gallery, homework, circular, fees, attendance, etc.)
        socket.on('notification', handleModuleNotification);
        socket.on('new_notification', handleModuleNotification);
        socket.on('module_notification', handleModuleNotification);
        socket.on('school_update', handleModuleNotification);
        socket.on('attendance_update', handleModuleNotification);
        socket.on('late_comers', handleModuleNotification);
        socket.on('attendance_notification', handleModuleNotification);

        return () => {
            socket.off('receive_message', handleIncomingMessage);
            socket.off('message_status', handleStatusUpdate);
            socket.off('message_status_update', handleStatusUpdate);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('delete_message', handleMessageDeleted);
            socket.off('notification', handleModuleNotification);
            socket.off('new_notification', handleModuleNotification);
            socket.off('module_notification', handleModuleNotification);
            socket.off('school_update', handleModuleNotification);
            socket.off('attendance_update', handleModuleNotification);
            socket.off('late_comers', handleModuleNotification);
            socket.off('attendance_notification', handleModuleNotification);
        };
    }, [userId, myId, myClass, mySection, isPrincipalUser, student?.studentNumber]);
};
