import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Image,
    useWindowDimensions,
    Animated,
    Modal,
    Alert,
    Keyboard,
    PanResponder
} from 'react-native';
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getExpoAudio } from '../../utils/expoAv';
import BackButton from '../../components/common/BackButton';
import { socket } from '../../api/socket';
import { useUser, isStudent, isAdmin, isEmployee, isPrincipal } from '../../hooks/useUser';
import { useRoleColors } from '../../hooks/useRoleColors';
import { useMessages, useSendCommunication, useGroupMessages, useCreatePoll, useVotePoll, useDeleteMessage } from '../../hooks/useStudentData';
import { useChatCache, Message } from '../../hooks/useChatCache';
import { useE2EE } from '../../hooks/useE2EE';
import * as Crypto from 'expo-crypto';
import { setActiveChatId } from '../../utils/notification.utils';
import {
    buildGroupCacheId,
    isGroupPayload,
    resolveCacheChatId,
    resolveMessageContentType,
} from '../../utils/chatCache.utils';

const NODE_URL = process.env.EXPO_PUBLIC_NODE_URL;

const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('file')) return path;
    const cleanBase = (NODE_URL || '').endsWith('/') ? NODE_URL : `${NODE_URL}/`;
    return `${cleanBase}${path.startsWith('/') ? path.substring(1) : path}`;
};

const isPlaceholderChatName = (name?: string | null) =>
    !name ||
    ['Chat', 'Chat Member', 'Unknown', 'Unknown Sender', 'Staff', 'Communication'].includes(name.trim()) ||
    /^EMP\d+$/i.test(name.trim()) ||
    /^\d+$/.test(name.trim());


const isIdentityId = (name?: string | null) => !!name && /^\d+$/.test(name.trim());

const firstDisplayName = (...names: Array<string | null | undefined>) =>
    names.find((name) => name && !isPlaceholderChatName(name) && !isIdentityId(name) && !/^EMP\d+$/i.test(name.trim())) || undefined;

const namesEqual = (a?: string | null, b?: string | null) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

const displayNameFromUser = (user: any) => {
    if (!user) return 'You';
    if (isEmployee(user) || isStudent(user)) {
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You';
    }
    if (isAdmin(user)) return user.name || 'You';
    return 'You';
};

const ChatScreen = ({ navigation, route }: any) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // 3-button / gesture nav: some Android phones report 0 with edge-to-edge.
    const navInset = Math.max(
        insets.bottom,
        initialWindowMetrics?.insets?.bottom ?? 0,
        Platform.OS === 'android' ? 24 : 8,
    );
    const { encryptMessage, decryptMessage, registerMyPublicKey } = useE2EE();
    const { user } = useUser();
    const brand = useRoleColors();
    const { recipient, data, chatTitle: passedTitle, chatId: passedChatId } = route.params || {};
    const isStaffUser = Boolean(user && !isStudent(user));
    const isGroup = recipient === 'group' || data?.type === 'group' || isGroupPayload(data);
    const myOwnDisplayName = displayNameFromUser(user);
    const pickPeerName = (...names: Array<string | null | undefined>) =>
        names.find((name) =>
            name &&
            !isPlaceholderChatName(name) &&
            !isIdentityId(name) &&
            !namesEqual(name, myOwnDisplayName)
        );

    let initialTitle = 'Communication';
    let initialSubtitle = '';

    // Individual chats: student↔staff or staff↔staff.
    const isStaffPartner = !isGroup && Boolean(
        recipient === 'staff' ||
        data?.isStaff ||
        data?.peerRole === 'staff' ||
        data?.emp_id ||
        (user && isStudent(user))
    );

    const routeReceiverName = isGroup
        ? undefined
        : isStaffPartner
            ? pickPeerName(data?.staff_name, passedTitle)
            : pickPeerName(
                data?.student_name,
                data?.stud_firstname ? `${data.stud_firstname} ${data.stud_lastname || ''}`.trim() : null,
                passedTitle
            );

    if (recipient === 'group' || data?.type === 'group') {
        initialTitle = data?.className || data?.classId || passedTitle || 'Group Chat';
        initialSubtitle = data?.sectionName || (data?.sectionId ? `Section ${data.sectionId}` : 'All Sections');
    } else if (isStaffPartner) {
        initialTitle = routeReceiverName || 'Staff Member';
        initialSubtitle = 'School Staff';
    } else {
        initialTitle = routeReceiverName || 'Student';
        initialSubtitle = data?.stud_no || data?.studentNumber ? `ID: ${data.stud_no || data.studentNumber}` : (data?.stud_class ? `Class ${data.stud_class}` : 'Student');
    }

    const [chatTitle, setChatTitle] = useState(initialTitle);
    const [chatSubtitle, setChatSubtitle] = useState(initialSubtitle);

    const userId = (user as any)?.studentId || (user as any)?.employeeId || (user as any)?.adminId || (user as any)?.emp_id || (user as any)?.stud_id || (user as any)?.user_id || 'anonymous';
    const myIdentityIds = [
        userId,
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
    ]
        .filter(Boolean)
        .map((id) => id.toString().trim());
    const isMyMessageSender = (senderId?: string | number | null) => {
        if (senderId == null || senderId === '') return false;
        return myIdentityIds.includes(senderId.toString().trim());
    };
    const { addMessageToCache, getChatMessages, syncMessagesToCache, markChatAsRead, clearCache, markMessageDeleted } = useChatCache(userId);

    // Stabilize socket handlers — decryptMessage from useE2EE is not memoized
    const onReceiveMessageRef = useRef<any>(null);
    const onStatusUpdateRef = useRef<any>(null);
    const applyLocalDeleteRef = useRef<any>(null);
    const decryptMessageRef = useRef(decryptMessage);
    decryptMessageRef.current = decryptMessage;

    // 🔐 Automatic E2EE Key Registration
    useEffect(() => {
        if (userId && userId !== 'anonymous') {
            console.log(`🔐 [Chat] Auto-registering identity key for ${userId}`);
            registerMyPublicKey(userId.toString());
        }
    }, [userId]);

    const chatId =
        resolveCacheChatId({
            routeData: data,
            passedChatId,
            myIds: myIdentityIds,
            payload: isGroup
                ? { type: 2, classId: data?.classId, sectionId: data?.sectionId }
                : undefined,
        }) ||
        (isGroup
            ? buildGroupCacheId(data?.classId, data?.sectionId)
            : undefined);

    // Suppress notification popup while this chat is open
    useEffect(() => {
        if (chatId) setActiveChatId(chatId.toString());
        return () => setActiveChatId(null);
    }, [chatId]);

    const [messages, setMessages] = useState<Message[]>([]);
    const lastUserId = useRef<string>(userId);

    // Poll States
    const { mutate: createPollMutation } = useCreatePoll();
    const { mutate: votePollMutation } = useVotePoll();
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    // Handle User Switch
    useEffect(() => {
        if (userId && userId !== 'anonymous' && userId !== lastUserId.current) {
            console.log('🔄 [Chat] User ID changed, clearing messages:', { from: lastUserId.current, to: userId });
            setMessages([]);
            lastUserId.current = userId;
        }
    }, [userId]);

    // 1. Load from Cache First
    useEffect(() => {
        const loadFromCache = async () => {
            if (chatId && userId) {
                console.log('📂 [Chat] Loading cache for:', { chatId, userId });
                const cached = await getChatMessages(chatId.toString());
                if (cached.length > 0) {
                    console.log('📦 [Chat] Loaded messages from cache:', cached.length);
                    setMessages(cached);
                }
            }
        };
        loadFromCache();
    }, [chatId, userId]);

    const effectiveReceiverId = (recipient === 'group' || data?.type === 'group')
        ? `G_${data?.classId || '?'}_${data?.sectionId || 'all'}`
        : (data?.receiverId?.toString() || data?.receiver_id?.toString() || data?.employeeId?.toString() || data?.emp_id?.toString() || data?.stud_id?.toString() || data?.id?.toString() || data?.stud_no?.toString() || chatId?.toString());

    console.log('[Chat] Conversation IDs:', {
        chatId: chatId?.toString(),
        senderId: userId?.toString(),
        receiverId: effectiveReceiverId,
        routeData: data,
    });

    // 1. Individual Messages Hook
    const { data: individualHistory, isLoading: isLoadingIndividual } = useMessages(
        userId?.toString(),
        !isGroup ? effectiveReceiverId : '',
        isStaffPartner ? 'staff' : 'student'
    );

    // 2. Group Messages Hook
    const { data: groupHistory, isLoading: isLoadingGroup } = useGroupMessages(
        isGroup ? data?.classId : undefined,
        isGroup ? data?.sectionId : undefined
    );

    const historyData = isGroup ? groupHistory : individualHistory;
    const isLoadingHistory = isGroup ? isLoadingGroup : isLoadingIndividual;

    // 2. Sync with Server History (Online behavior)
    useEffect(() => {
        const processHistory = async () => {
            if (historyData) {
                const mappedHistory: Message[] = await Promise.all(historyData.map(async (m: any, idx: number) => {
                    // Determine content and type — never treat chat type 1|2 as media type
                    let content = m.message || m.content || m.attachment || m.voice_note || m.voiceNote || '';
                    let messageType: Message['type'] = resolveMessageContentType(m);
                    if (m.messageType === 'image' || m.type === 'image') messageType = 'image';
                    else if (m.messageType === 'voice' || m.type === 'voice') messageType = 'voice';
                    else if (m.messageType === 'video' || m.type === 'video') messageType = 'video';
                    else if (m.messageType === 'file' || m.type === 'file') messageType = 'file';
                    else if (m.messageType === 'poll' || m.type === 'poll') messageType = 'poll';

                    // 2. Fallback to robust field & extension detection
                    const hasVoiceField = m.voice_note || m.voiceNote;
                    const hasImgField = m.attachment || m.isAttachment || m.is_attachment;

                    const contentStr = typeof content === 'string' ? content : '';
                    const isVoiceExt = contentStr.match(/\.(m4a|mp3|wav|aac|ogg)(\?.*)?$/i);
                    const isImgExt = contentStr.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i);

                    if (messageType === 'text') {
                        if (hasVoiceField || isVoiceExt) messageType = 'voice';
                        else if (hasImgField || isImgExt) messageType = 'image';
                    }

                    // 3. E2EE Decryption for history
                    if (messageType === 'text' && contentStr.startsWith('E2EE:')) {
                        const mSenderId = (m.senderId || m.sender_id)?.toString();
                        const isMe = mSenderId === userId?.toString();

                        // For history, the other party ID is either the sender (if it's not me) 
                        // or the receiver (if it is me).
                        const decryptTargetId = isMe ? (m.receiverId || m.receiver_id || effectiveReceiverId) : mSenderId;

                        if (decryptTargetId) {
                            console.log(`🔓 [E2EE] Decrypting history message. isMe: ${isMe}, Target: ${decryptTargetId}`);
                            content = await decryptMessageRef.current(decryptTargetId.toString(), contentStr);
                        }
                    }

                    // 4. Normalize content (ensure it's a URL if it's media)
                    if (messageType !== 'text') {
                        content = content || m.voice_note || m.voiceNote || m.attachment || '';
                        content = getMediaUrl(content as string);
                    }

                    let time = '...';
                    let rawDate = new Date().toISOString();
                    try {
                        const dateSource = m.created_at || m.dateTime || m.timestamp;
                        if (dateSource) {
                            const d = new Date(dateSource);
                            time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                            rawDate = d.toISOString();
                        }
                    } catch (e) { }

                    const senderVal = isMyMessageSender(m.senderId) || isMyMessageSender(m.sender_id) || isMyMessageSender(m.fromId) ? 'user' : 'other';
                    let status: Message['status'] = 'sent';
                    // Exhaustive status check
                    const isRead = m.is_read === 1 || m.is_read === true || m.isRead || m.read_at || m.seen || m.is_seen || m.isSeen;
                    const isDelivered = m.delivered_at || m.deliveredAt || m.is_delivered || m.isDelivered || m.delivered;

                    if (isRead) status = 'read';
                    else if (isDelivered) status = 'delivered';
                    if (senderVal === 'other' && !isGroup && messageType === 'voice') status = 'read';

                    let pollResult: any = undefined;
                    if (messageType === 'poll' && m.pollData) {
                        pollResult = {
                            pollId: m.id,
                            question: m.message || m.pollData.question || 'Poll',
                            options: m.pollData.options.map((opt: any) => ({
                                id: opt.id,
                                text: opt.optionText,
                                votes: Number(opt.votes) || 0,
                                votedByMe: m.pollData.userVotes?.some((v: any) => v.userId?.toString() === userId?.toString() && v.optionId === opt.id)
                            })),
                            totalVotes: m.pollData.options.reduce((sum: number, opt: any) => sum + (Number(opt.votes) || 0), 0),
                            hasVoted: m.pollData.userVotes?.some((v: any) => v.userId?.toString() === userId?.toString())
                        };
                    }

                    const peerName = isGroup
                        ? pickPeerName(m.sender_name, m.senderName, chatTitle)
                        : pickPeerName(
                            isStaffPartner ? data?.staff_name : data?.student_name,
                            routeReceiverName,
                            chatTitle,
                            senderVal === 'other' ? (m.sender_name || m.senderName) : (m.receiver_name || m.receiverName)
                        );
                    const resolvedSenderName = senderVal === 'user'
                        ? myOwnDisplayName
                        : (isGroup
                            ? (pickPeerName(m.sender_name, m.senderName, m.sender_username, peerName, chatTitle) || peerName || 'Staff')
                            : (peerName || routeReceiverName || chatTitle || 'Chat'));
                    const historySenderName = /^EMP\d+$/i.test(resolvedSenderName?.trim() || '')
                        ? (senderVal === 'user' ? myOwnDisplayName : (peerName || 'Staff'))
                        : resolvedSenderName;

                    return {
                        id: m.id?.toString() || m.uuid || m.client_id || `temp_${idx}`,
                        type: messageType,
                        content: content,
                        duration: m.duration || m.voice_duration || m.voiceDuration || m.audio_duration || m.audioDuration || undefined,
                        pollData: pollResult,
                        sender: senderVal as 'user' | 'other',
                        senderName: historySenderName,
                        rawSenderId: m.senderId?.toString() || m.sender_id?.toString(),
                        timestamp: time,
                        status: status,
                        createdAt: rawDate,
                        isDeleted: !!(
                            m.is_deleted ||
                            m.isDeleted ||
                            m.deleted ||
                            m.deleted_at ||
                            m.deletedAt ||
                            m.status === 'deleted'
                        ),
                    };
                }));

                const historyPeerName = pickPeerName(
                    routeReceiverName,
                    isStaffPartner ? data?.staff_name : data?.student_name,
                    ...mappedHistory.map((message, idx) => {
                        const raw = historyData[idx];
                        if (message.sender === 'other') return message.senderName || raw?.sender_name || raw?.senderName;
                        return raw?.receiver_name || raw?.receiverName;
                    })
                );
                const resolvedPeerTitle = routeReceiverName || historyPeerName || chatTitle;
                if (
                    historyPeerName &&
                    !namesEqual(chatTitle, historyPeerName) &&
                    !namesEqual(historyPeerName, myOwnDisplayName) &&
                    (!routeReceiverName || isPlaceholderChatName(chatTitle))
                ) {
                    setChatTitle(historyPeerName);
                }

                // 🏆 SMART MERGE (Single Source of Truth)
                setMessages(prev => {
                    const map = new Map();
                    prev.forEach(msg => map.set(msg.id, msg));

                    mappedHistory.forEach(m => {
                        if (map.has(m.id)) {
                            const existing = map.get(m.id);
                            map.set(m.id, {
                                ...m,
                                // Keep local unsend until server history also marks deleted
                                isDeleted: existing.isDeleted || m.isDeleted,
                            });
                        } else {
                            const optimisticMatch = Array.from(map.values()).find(existing =>
                                existing.sender === 'user' &&
                                existing.content === m.content &&
                                (existing.status === 'pending' || existing.status === 'sent') &&
                                (existing.id.length > 30 || existing.id.includes('temp'))
                            );

                            if (optimisticMatch) {
                                map.delete(optimisticMatch.id);
                                map.set(m.id, {
                                    ...m,
                                    isDeleted: optimisticMatch.isDeleted || m.isDeleted,
                                });
                            } else {
                                map.set(m.id, m);
                            }
                        }
                    });

                    return Array.from(map.values()).sort((a, b) => {
                        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return da - db;
                    });
                });

                if (chatId) {
                    syncMessagesToCache(chatId.toString(), mappedHistory, resolvedPeerTitle, isGroup
                        ? { type: 'group', classId: data?.classId, sectionId: data?.sectionId }
                        : isStaffPartner
                            ? { isStaff: true, staff_name: resolvedPeerTitle, emp_id: chatId, receiverId: chatId, type: 'individual' }
                            : { isStaff: false, student_name: resolvedPeerTitle, stud_id: chatId, receiverId: chatId, type: 'individual' }
                    );
                }
            }
        };
        processHistory();
    }, [historyData, chatId, userId]);

    const [inputText, setInputText] = useState('');
    const hasComposerText = inputText.trim().length > 0;
    const [keyboardOverlap, setKeyboardOverlap] = useState(0);

    // Reset input text when switching chats
    useEffect(() => {
        setInputText('');
    }, [chatId]);

    // Keep the composer above the keyboard AND the system navigation bar.
    // Android uses softwareKeyboardLayoutMode: "resize", so the window already
    // shrinks above the IME — do NOT add kbHeight again (that creates a huge gap).
    // iOS needs a manual lift for staff (KAV is disabled for that path).
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const onShow = (e: any) => {
            if (Platform.OS === 'android') {
                setKeyboardOverlap(1);
            } else {
                const kbHeight = Math.ceil(e?.endCoordinates?.height || 0);
                const safeBottom = Math.max(insets.bottom, 0);
                // Lift by keyboard height, but don't stack the home-indicator twice.
                setKeyboardOverlap(Math.max(0, kbHeight - safeBottom));
            }
            requestAnimationFrame(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            });
        };
        const onHide = () => setKeyboardOverlap(0);
        const showSub = Keyboard.addListener(showEvent, onShow);
        const hideSub = Keyboard.addListener(hideEvent, onHide);
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [insets.bottom]);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingLocked, setRecordingLocked] = useState(false);
    const [voiceReady, setVoiceReady] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingTimeRef = useRef(0);
    const recordingStartedAtRef = useRef(0);
    const micPressAtRef = useRef(0);
    const recordingLockedRef = useRef(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const recordingAnim = useRef(new Animated.Value(1)).current;
    const waveAnims = useRef([1, 2, 3, 4, 5, 6, 7, 8].map(() => new Animated.Value(0))).current;

    const [recording, setRecording] = useState<any>(null);
    const recordingRef = useRef<any>(null);
    const isRecordingRef = useRef(false);
    const handleVoiceNoteRef = useRef<(() => Promise<void>) | null>(null);
    const stopRecordingAndActionRef = useRef<((action: 'send' | 'discard') => Promise<void>) | null>(null);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);

    // Media playback states
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const [isVoicePaused, setIsVoicePaused] = useState(false);
    const [sound, setSound] = useState<any>(null);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [playbackDuration, setPlaybackDuration] = useState(0);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [sliderWidths, setSliderWidths] = useState<{ [key: string]: number }>({});
    const [isCancelling, setIsCancelling] = useState(false);
    const slideX = useRef(new Animated.Value(0)).current;
    // Per-message drag-start X for the voice progress slider PanResponder.
    // A plain ref keyed by message id — NOT `this` — since renderMessage is
    // not a class method and `this` is undefined inside it (module is
    // strict-mode ESM), so `(this as any).startLocX` would throw at runtime
    // the moment a user tried to drag the seek bar.
    const voiceSeekStartRef = useRef<{ [key: string]: number }>({});

    // Session-based deduplication to prevent processing same socket id twice
    const processedSocketIds = useRef(new Set<string>());

    // ⚡ [Socket Listener] Stable Effect
    const onReceiveMessage = useCallback(async (incomingData: any) => {
        console.log('📥 [Chat] Incoming Socket Msg:', incomingData.message ? 'TEXT' : 'FILE');

        const socketMsgId = incomingData.id?.toString() || incomingData.clientId?.toString();

        if (socketMsgId && processedSocketIds.current.has(socketMsgId)) {
            console.log(`[Chat] ⏭️ Skipping duplicate socket packet: ${socketMsgId}`);
            return;
        }
        if (socketMsgId) processedSocketIds.current.add(socketMsgId);

        console.log('📬 [Chat] Incoming Socket Data:', incomingData);

        // 🛑 1. STRICT FILTERING & SENDER IDENTIFICATION
        const isGroupChat = recipient === 'group' || data?.type === 'group' || isGroupPayload(data);
        const incomingSenderId = (incomingData.fromId || incomingData.senderId || incomingData.sender_id || incomingData.from_id)?.toString().trim();
        const incomingReceiverId = (
            incomingData.receiverId ||
            incomingData.receiver_id ||
            incomingData.stud_id ||
            incomingData.stud_no ||
            incomingData.toId
        )?.toString().trim();

        const myDisplayName = (() => {
            if (isEmployee(user)) return `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'You';
            if (isAdmin(user)) return (user as any).name || 'You';
            if (isStudent(user)) return `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'You';
            return 'You';
        })();

        console.log(`💬 [SOCKET RECEIVE] MsgID: ${incomingData.id || incomingData.clientId} | SENDER -> ID: ${incomingSenderId} ("${incomingData.senderName || incomingData.sender_name || 'Unknown'}") ===> RECEIVER -> ID: ${incomingReceiverId} ("${myDisplayName}") | Type: ${isGroupChat ? 'GROUP' : 'INDIVIDUAL'}`);

        if (isGroupChat) {
            const incomingClass = (incomingData.class_id || incomingData.classId || '').toString().trim();
            const incomingSection = (incomingData.section_id || incomingData.sectionId || 'all').toString().trim();
            const currentClass = (data?.classId || data?.class_id || data?.stud_class || '').toString().trim();
            const currentSection = (data?.sectionId || data?.section_id || data?.stud_section || 'all').toString().trim();

            const normIncClass = incomingClass.replace(/(ST|ND|RD|TH)$/i, '');
            const normCurClass = currentClass.replace(/(ST|ND|RD|TH)$/i, '');
            const normIncSec = incomingSection.replace(/^section\s+/i, '');
            const normCurSec = currentSection.replace(/^section\s+/i, '');

            const classMatches = !currentClass || incomingClass === currentClass || normIncClass === normCurClass;
            const sectionMatches = incomingSection === 'all' || currentSection === 'all' || !currentSection || incomingSection === currentSection || normIncSec === normCurSec;

            if (!classMatches || !sectionMatches) return;
        } else {
            // Match by stable peer cache id
            const incomingCacheId = resolveCacheChatId({
                payload: incomingData,
                myIds: myIdentityIds,
            });
            const currentIds = [
                chatId?.toString(),
                passedChatId?.toString(),
                data?.stud_no?.toString(),
                data?.stud_id?.toString(),
                data?.receiverId?.toString(),
                data?.receiver_id?.toString(),
                data?.cacheChatId?.toString(),
                data?.id?.toString(),
                data?.studentId?.toString(),
                data?.employeeId?.toString(),
                data?.user_id?.toString(),
                data?.mapId?.toString(),
            ]
                .filter(Boolean)
                .map(id => id!.toString().trim());

            const isByPeerId = !!(incomingCacheId && currentIds.includes(incomingCacheId));
            const isFromRecipient = !!(incomingSenderId && currentIds.includes(incomingSenderId));
            const isMirrorFromMe = isMyMessageSender(incomingSenderId);
            const isAddressedToMe = !!(
                incomingReceiverId && myIdentityIds.includes(incomingReceiverId)
            ) || isMyMessageSender(incomingData.stud_id) || isMyMessageSender(incomingData.stud_no);

            // Also accept when I sent and receiver is this chat peer
            const incomingReceiver = incomingReceiverId;
            const isMirrorToThisPeer =
                isMirrorFromMe &&
                !!(incomingReceiver && currentIds.includes(incomingReceiver));

            if (!isByPeerId && !isFromRecipient && !isMirrorToThisPeer && !isAddressedToMe) {
                console.log(
                    `[Chat] ⏭️ Ignored Msg. IncomingSender: ${incomingSenderId}, CacheId: ${incomingCacheId}. Expected: ${currentIds.join(', ')}`
                );
                return;
            }

            console.log('[Chat] MESSAGE CONTRACT ACCEPTED:', {
                messageId: incomingData.id,
                senderId: incomingSenderId,
                senderName: incomingData.senderName || incomingData.sender_name,
                receiverId: incomingReceiverId,
                addressedToMe: isAddressedToMe
            });
        }

        // 📝 2. E2EE DECRYPTION
        let content = incomingData.message || incomingData.content || incomingData.attachment || incomingData.voice_note || incomingData.voiceNote || '';

        if (typeof content === 'string' && content.startsWith('E2EE:')) {
            // If I am the sender, decrypt for the recipient. If someone else is sender, decrypt for them.
            const isMe = isMyMessageSender(incomingSenderId);
            const decryptTargetId = isMe ? (incomingData.receiverId || incomingData.receiver_id || incomingData.toId) : incomingSenderId;

            if (decryptTargetId) {
                console.log(`🔓 [E2EE] Decrypting live message. isMe: ${isMe}, Target: ${decryptTargetId}`);
                content = await decryptMessageRef.current(decryptTargetId.toString(), content);
            } else {
                console.warn('⚠️ [E2EE] Received encrypted message but could not determine decryption target ID');
            }
        }

        // 📝 3. PREPARE LIVE DATA

        // WhatsApp-style unsend: treat deleted payloads as soft-delete, not new messages
        const isDeletedIncoming =
            incomingData.is_deleted === true ||
            incomingData.isDeleted === true ||
            incomingData.deleted === true ||
            incomingData.status === 'deleted' ||
            incomingData.deleteForEveryone === true;

        if (isDeletedIncoming) {
            const deletedIds = [
                incomingData.id,
                incomingData.messageId,
                incomingData.clientId,
                incomingData.client_id,
            ]
                .filter((v) => v != null && v !== '')
                .map((v) => v.toString());

            console.log('🗑️ [Chat] Soft-delete from receive_message:', deletedIds);
            setMessages((prev) =>
                prev.map((m) =>
                    deletedIds.includes(m.id)
                        ? {
                            ...m,
                            isDeleted: true,
                            content: '',
                            pollData: undefined,
                            fileName: undefined,
                        }
                        : m
                )
            );
            if (chatId) {
                deletedIds.forEach((id) => markMessageDeleted(chatId.toString(), id));
            }
            return;
        }

        // Detect type for live message — never use chat type 1|2 as media type
        let messageType: Message['type'] = resolveMessageContentType(incomingData);

        const hasVoiceField = incomingData.voice_note || incomingData.voiceNote;
        const hasImgField = incomingData.isAttachment || incomingData.attachment || incomingData.is_attachment;
        const contentStr = typeof content === 'string' ? content : '';
        const isVoiceExt = contentStr.match(/\.(m4a|mp3|wav|aac|ogg)(\?.*)?$/i);
        const isImgExt = contentStr.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i);

        if (!['image', 'voice', 'video', 'file'].includes(messageType)) {
            if (hasVoiceField || isVoiceExt) messageType = 'voice';
            else if (hasImgField || isImgExt) messageType = 'image';
            else messageType = 'text';
        }

        if (messageType !== 'text') {
            content = getMediaUrl(content as string);
        }

        let status: Message['status'] = 'sent';
        const isRead = incomingData.is_read || incomingData.isRead || incomingData.seen || incomingData.isSeen || incomingData.is_seen;
        const isDelivered = incomingData.is_delivered || incomingData.deliveredAt || incomingData.delivered_at || incomingData.isDelivered || incomingData.delivered;

        if (isRead) status = 'read';
        else if (isDelivered) status = 'delivered';

        const incomingIsMine = isMyMessageSender(
            incomingData.fromId || incomingData.senderId || incomingData.sender_id || incomingData.from_id
        );
        const receiverVoiceHasBeenRead = !incomingIsMine && !isGroupChat && messageType === 'voice';
        if (receiverVoiceHasBeenRead) status = 'read';

        const isMySentMessage = isMyMessageSender(incomingData.fromId) || isMyMessageSender(incomingData.senderId) || isMyMessageSender(incomingData.sender_id) || isMyMessageSender(incomingData.from_id);
        const peerFallback = isGroupChat
            ? pickPeerName(
                isMySentMessage
                    ? (incomingData.receiverName || incomingData.receiver_name)
                    : (incomingData.senderName || incomingData.sender_name),
                chatTitle
            )
            : pickPeerName(
                isStaffPartner ? data?.staff_name : data?.student_name,
                routeReceiverName,
                chatTitle,
                isMySentMessage
                    ? (incomingData.receiverName || incomingData.receiver_name)
                    : (incomingData.senderName || incomingData.sender_name)
            );
        const rawIncomingSenderName = incomingData.senderName || incomingData.sender_name;
        const cleanedSenderName = (rawIncomingSenderName && /^EMP\d+$/i.test(rawIncomingSenderName.trim()))
            ? (peerFallback || 'Staff')
            : rawIncomingSenderName;
        const resolvedLiveSenderName = isMySentMessage
            ? myOwnDisplayName
            : (isGroupChat
                ? (pickPeerName(cleanedSenderName, peerFallback) || peerFallback || 'Staff')
                : (peerFallback || routeReceiverName || chatTitle || 'Chat'));
        const incomingMsg: Message = {
            id: incomingData.id?.toString() || `live_${Date.now()}`,
            type: messageType,
            content: content,
            duration: incomingData.duration || incomingData.voice_duration || incomingData.audioDuration,
            sender: isMySentMessage ? 'user' : 'other',
            senderName: resolvedLiveSenderName,
            rawSenderId: incomingData.fromId?.toString() || incomingData.senderId?.toString() || incomingData.sender_id?.toString(),
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            status: status,
            createdAt: incomingData.created_at || incomingData.dateTime || incomingData.timestamp || new Date().toISOString()
        };

        if (
            !isMySentMessage &&
            incomingMsg.senderName &&
            !routeReceiverName &&
            (isPlaceholderChatName(chatTitle) || isIdentityId(chatTitle) || namesEqual(chatTitle, myOwnDisplayName)) &&
            !namesEqual(incomingMsg.senderName, myOwnDisplayName)
        ) {
            setChatTitle(incomingMsg.senderName);
        }

        setMessages(prev => {
            // Better Deduping/Syncing:
            // If it's from me, look for a local message with the same content or clientId
            if (incomingMsg.sender === 'user') {
                // 1. Exact Match by clientId
                const localIndex = prev.findIndex(m => m.id === incomingData.clientId);
                if (localIndex !== -1) {
                    console.log('🔄 [Chat] Syncing server ID to local message via clientId:', incomingMsg.id);
                    const newMessages = [...prev];
                    newMessages[localIndex] = { ...incomingMsg, duration: prev[localIndex].duration || incomingMsg.duration };
                    return newMessages;
                }

                // 2. Fuzzy Match by content (for backends that don't return clientId).
                // Also require the SAME message type — two pending messages of
                // different types (e.g. a text message and a voice note) can
                // otherwise share identical `content` (both still empty, or the
                // same placeholder) and get reconciled to the wrong optimistic
                // entry.
                const fuzzyIndex = prev.findIndex(m =>
                    m.sender === 'user' &&
                    m.type === incomingMsg.type &&
                    m.content === incomingMsg.content &&
                    (m.status === 'pending' || m.status === 'sent')
                );
                if (fuzzyIndex !== -1) {
                    console.log('🔄 [Chat] Syncing server ID to local message via fuzzy match:', incomingMsg.id);
                    const newMessages = [...prev];
                    newMessages[fuzzyIndex] = { ...incomingMsg, duration: prev[fuzzyIndex].duration || incomingMsg.duration };
                    return newMessages;
                }
            }

            // Standard Deduping by ID
            const isDuplicate = prev.some(m => m.id === incomingMsg.id);

            // Handle poll type data mapping
            if (incomingMsg.type === 'poll' && incomingData.pollData) {
                const results = incomingData.pollData;
                incomingMsg.pollData = {
                    pollId: incomingMsg.id,
                    question: incomingMsg.content || results.question || 'Poll',
                    options: results.options.map((opt: any) => ({
                        id: opt.id,
                        text: opt.optionText,
                        votes: Number(opt.votes) || 0,
                        votedByMe: results.userVotes?.some((v: any) => v.userId?.toString() === userId?.toString() && v.optionId === opt.id)
                    })),
                    totalVotes: results.options.reduce((sum: number, opt: any) => sum + (Number(opt.votes) || 0), 0),
                    hasVoted: results.userVotes?.some((v: any) => v.userId?.toString() === userId?.toString())
                };
            }

            if (isDuplicate) return prev;
            return [...prev, incomingMsg];
        });

        if (chatId) {
            // FIX: Don't write to cache here to avoid race condition with GlobalListener
            // addMessageToCache(chatId.toString(), incomingMsg, chatTitle);

            // Mark as read immediately (with slight delay to let GlobalListener write first)
            setTimeout(() => {
                markChatAsRead(chatId.toString());
            }, 500);
        }

        // Notify server that message was delivered to me (for real-time double tick on sender side)
        if (incomingMsg.sender === 'other' && !isGroupChat) {
            console.log('[Chat] STATUS SENT TO SERVER:', {
                messageId: incomingMsg.id,
                senderId: incomingMsg.rawSenderId,
                receiverId: userId,
                statuses: ['delivered', 'read'],
            });
            socket.emit('message_status_update', {
                messageId: incomingMsg.id,
                status: 'delivered',
                chatId: chatId?.toString(),
                recipientId: incomingMsg.rawSenderId
            });

            // Also emit 'read' since we are in the chat
            socket.emit('message_status_update', {
                messageId: incomingMsg.id,
                status: 'read',
                chatId: chatId?.toString(),
                recipientId: incomingMsg.rawSenderId
            });
        }

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, [chatId, userId, data, recipient, chatTitle, markMessageDeleted]);

    const onStatusUpdate = useCallback((update: any) => {
        console.log('🔄 [Chat] Status Update Received:', update);
        const targetId = update.id || update.messageId || update.clientId;
        const isDeletedEvent =
            update.status === 'deleted' ||
            update.is_deleted === true ||
            update.isDeleted === true ||
            update.deleted === true ||
            update.deleteForEveryone === true;

        if (isDeletedEvent && targetId) {
            console.log('🗑️ [Chat] Delete via status update:', targetId);
            setMessages((prev) => {
                const ids = new Set(
                    [targetId, update.clientId, update.messageId, update.id]
                        .filter((v) => v != null && v !== '')
                        .map((v) => v.toString())
                );
                let matched = false;
                const next = prev.map((m) => {
                    if (!ids.has(m.id)) return m;
                    matched = true;
                    return {
                        ...m,
                        isDeleted: true,
                        content: '',
                        pollData: undefined,
                        fileName: undefined,
                    };
                });
                // Fallback: IDs can differ (client UUID vs server id) — unsend latest from that sender
                if (!matched) {
                    const senderHint = (
                        update.senderId ||
                        update.sender_id ||
                        update.fromId
                    )?.toString();
                    for (let i = next.length - 1; i >= 0; i--) {
                        const m = next[i];
                        if (m.isDeleted || m.sender === 'user') continue;
                        if (senderHint && m.rawSenderId && m.rawSenderId !== senderHint) {
                            continue;
                        }
                        next[i] = {
                            ...m,
                            isDeleted: true,
                            content: '',
                            pollData: undefined,
                            fileName: undefined,
                        };
                        if (chatId) markMessageDeleted(chatId.toString(), m.id);
                        matched = true;
                        break;
                    }
                }
                return matched ? [...next] : prev;
            });
            if (chatId) {
                markMessageDeleted(chatId.toString(), targetId.toString());
                if (update.clientId && update.clientId.toString() !== targetId.toString()) {
                    markMessageDeleted(chatId.toString(), update.clientId.toString());
                }
            }
            return;
        }

        setMessages(prev => {
            const index = prev.findIndex(m => m.id === targetId?.toString());
            if (index !== -1) {
                const newMessages = [...prev];
                let newStatus: Message['status'] = update.status;
                if (!newStatus) {
                    if (update.is_read || update.isRead || update.seen || update.isSeen || update.is_seen) newStatus = 'read';
                    else if (update.is_delivered || update.deliveredAt || update.delivered_at || update.isDelivered || update.delivered) newStatus = 'delivered';
                }

                if (newStatus && newMessages[index].status !== newStatus) {
                    newMessages[index] = { ...newMessages[index], status: newStatus };
                    return newMessages;
                }
            }
            return prev;
        });
    }, [chatId, markMessageDeleted]);

    const sendMutation = useSendCommunication();
    const deleteMutation = useDeleteMessage();

    const applyLocalDelete = useCallback(
        (messageId: string, altIds: Array<string | number | null | undefined> = []) => {
            const ids = new Set(
                [messageId, ...altIds]
                    .filter((v) => v != null && v !== '')
                    .map((v) => v!.toString())
            );
            setMessages((prev) =>
                prev.map((m) =>
                    ids.has(m.id)
                        ? {
                            ...m,
                            isDeleted: true,
                            content: '',
                            pollData: undefined,
                            fileName: undefined,
                        }
                        : m
                )
            );
            if (chatId) {
                ids.forEach((id) => markMessageDeleted(chatId.toString(), id));
            }
        },
        [chatId, markMessageDeleted]
    );

    const handleDeleteMessage = useCallback(
        (item: Message) => {
            if (item.isDeleted) return;
            // Staff can delete their own sent messages
            if (!isStaffUser) {
                Alert.alert('Delete unavailable', 'Only staff can delete messages.');
                return;
            }
            if (item.sender !== 'user' && !isMyMessageSender(item.rawSenderId)) {
                Alert.alert('Delete unavailable', 'You can only delete messages you sent.');
                return;
            }

            Alert.alert(
                'Delete message?',
                'This message will be deleted for everyone in this chat.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete for everyone',
                        style: 'destructive',
                        onPress: () => {
                            // WhatsApp-style: soft-delete locally immediately
                            applyLocalDelete(item.id);

                            const isGroupChat =
                                recipient === 'group' || data?.type === 'group';
                            // Use the same broad fallback chain as effectiveReceiverId so the
                            // delete event routes to the correct peer even when only an
                            // employeeId/emp_id/id is available (not just stud_id/receiverId).
                            const receiverId =
                                data?.stud_id ||
                                data?.receiverId ||
                                data?.receiver_id ||
                                data?.stud_no ||
                                effectiveReceiverId ||
                                passedChatId;

                            const deletePayload = {
                                messageId: item.id,
                                id: item.id,
                                clientId: item.id,
                                chatId: (data?.chatId || chatId || null)?.toString?.() || data?.chatId || chatId || null,
                                receiverId: isGroupChat ? null : receiverId,
                                recipientId: isGroupChat ? null : receiverId,
                                type: (isGroupChat ? 'group' : 'individual') as
                                    | 'group'
                                    | 'individual',
                                class_id: isGroupChat
                                    ? data?.classId || data?.class_id
                                    : undefined,
                                section_id: isGroupChat
                                    ? data?.sectionId || data?.section_id
                                    : undefined,
                                classId: isGroupChat
                                    ? data?.classId || data?.class_id
                                    : undefined,
                                sectionId: isGroupChat
                                    ? data?.sectionId || data?.section_id
                                    : undefined,
                                senderId: userId,
                                deleteForEveryone: true,
                                is_deleted: true,
                                status: 'deleted' as const,
                            };

                            // Use the same status channel that already syncs delivered/read ticks
                            socket.emit('message_status_update', deletePayload);
                            socket.emit('message_status', deletePayload);
                            socket.emit('delete_message', deletePayload);
                            socket.emit('message_deleted', deletePayload);

                            // Also push a lightweight receive_message so open chats update even if status isn't relayed
                            socket.emit('receive_message', {
                                ...deletePayload,
                                message: '',
                                content: '',
                                fromId: userId,
                                senderId: userId,
                                sender_id: userId,
                                toId: receiverId,
                                is_deleted: true,
                                isDeleted: true,
                                status: 'deleted',
                                messageType: item.type,
                                type: isGroupChat ? 'group' : 'individual',
                            });

                            deleteMutation.mutate(deletePayload, {
                                onSuccess: () =>
                                    console.log('✅ [Chat] Message deleted for everyone'),
                                onError: (error: any) =>
                                    console.warn(
                                        '⚠️ [Chat] Delete API failed (kept local + socket delete):',
                                        error?.message || error
                                    ),
                            });
                        },
                    },
                ]
            );
        },
        [
            isStaffUser,
            isMyMessageSender,
            applyLocalDelete,
            recipient,
            data,
            passedChatId,
            chatId,
            userId,
            deleteMutation,
            effectiveReceiverId,
        ]
    );

    useEffect(() => {
        onReceiveMessageRef.current = onReceiveMessage;
        onStatusUpdateRef.current = onStatusUpdate;
        applyLocalDeleteRef.current = applyLocalDelete;
    }, [onReceiveMessage, onStatusUpdate, applyLocalDelete]);

    useEffect(() => {
        if (!chatId) return;

        console.log('🔌 [Chat] Joining Room:', chatId);
        const role = isStudent(user) ? 'student' : 'staff';
        socket.emit('join', {
            userId: userId,
            role: role,
            classId: isGroup ? data?.classId : ((user as any)?.stud_class || (user as any)?.class),
            sectionId: isGroup ? data?.sectionId : ((user as any)?.stud_section || (user as any)?.section)
        });
        socket.emit('join_chat', chatId);

        // Mark read once per chat open — do not re-emit on every handler identity change
        markChatAsRead(chatId.toString());

        if (!isGroup) {
            socket.emit('message_seen', {
                chatId: chatId?.toString(),
                senderId: effectiveReceiverId,
                messageId: null
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, userId, isGroup, effectiveReceiverId]);

    useEffect(() => {
        const onReceive = (payload: any) => onReceiveMessageRef.current?.(payload);
        const onStatus = (payload: any) => onStatusUpdateRef.current?.(payload);
        const onDeleted = (payload: any) => {
            const deletedId = (
                payload?.messageId ||
                payload?.id ||
                payload?.clientId
            )?.toString();
            if (!deletedId) return;
            applyLocalDeleteRef.current?.(deletedId);
            if (
                payload?.clientId &&
                payload.clientId.toString() !== deletedId
            ) {
                applyLocalDeleteRef.current?.(payload.clientId.toString());
            }
        };
        const handlePollUpdate = (pollStats: any) => {
            setMessages(prev => prev.map(msg => {
                const isMatch = (msg.type === 'poll' && (msg.pollData?.pollId?.toString() === pollStats.pollId?.toString() || msg.id.toString() === pollStats.pollId?.toString()));
                if (isMatch) {
                    const hasVoted = pollStats.userVotes?.some((v: any) => v.userId?.toString() === userId?.toString());
                    return {
                        ...msg,
                        pollData: {
                            pollId: pollStats.pollId,
                            question: msg.pollData?.question || 'Poll',
                            options: pollStats.options.map((opt: any) => ({
                                id: opt.id,
                                text: opt.optionText,
                                votes: Number(opt.votes) || 0,
                                votedByMe: pollStats.userVotes?.some((v: any) => v.userId?.toString() === userId?.toString() && v.optionId === opt.id)
                            })),
                            totalVotes: pollStats.options.reduce((sum: number, opt: any) => sum + (Number(opt.votes) || 0), 0),
                            hasVoted
                        }
                    };
                }
                return msg;
            }));
        };

        socket.on('receive_message', onReceive);
        socket.on('message_status', onStatus);
        socket.on('message_status_update', onStatus);
        socket.on('poll_update', handlePollUpdate);
        socket.on('message_deleted', onDeleted);
        socket.on('delete_message', onDeleted);

        return () => {
            socket.off('receive_message', onReceive);
            socket.off('message_status', onStatus);
            socket.off('message_status_update', onStatus);
            socket.off('poll_update', handlePollUpdate);
            socket.off('message_deleted', onDeleted);
            socket.off('delete_message', onDeleted);
        };
    }, [userId]);

    const sendMessage = async (type: Message['type'] = 'text', content: string = inputText, extra: Partial<Message> = {}) => {
        console.log('🚀 [Chat] sendMessage triggered', { type, contentLength: content?.length });

        if (type === 'text' && !content.trim()) {
            console.log('⚠️ [Chat] Empty text message, aborting.');
            return;
        }

        const isGroup = recipient === 'group' || data?.type === 'group';
        // Use the same broad fallback chain as effectiveReceiverId (which is
        // what history fetching / decryption use) so encryption, the
        // self-message check, and the send payload all agree on who the peer
        // actually is — otherwise a peer identified only by
        // employeeId/emp_id/id would resolve differently here than
        // everywhere else, breaking E2EE (encrypting to the wrong key) and
        // potentially letting a real self-message slip through the check.
        const receiverId = data?.stud_id || data?.receiverId || data?.receiver_id || data?.stud_no || effectiveReceiverId || passedChatId;

        if (!isGroup && receiverId && myIdentityIds.includes(receiverId.toString().trim())) {
            console.warn('[Chat] Blocked self-message:', {
                senderIds: myIdentityIds,
                receiverId: receiverId.toString(),
            });
            Alert.alert('Invalid recipient', 'Please select another user. You cannot message yourself.');
            return;
        }

        const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        // Use Expo Crypto for robust UUID generation
        let newMessageId;
        try {
            newMessageId = Crypto.randomUUID();
        } catch (e) {
            console.error('❌ [Chat] UUID Generation Failed, falling back to timestamp', e);
            newMessageId = `temp_${Date.now()}_${Math.random()}`;
        }

        const newMessage: Message = {
            id: newMessageId,
            type,
            content,
            sender: 'user',
            senderName: myOwnDisplayName,
            timestamp,
            status: 'pending',
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            ...extra
        };

        console.log('📝 [Chat] Optimistic update:', newMessage);

        setMessages(prev => [...prev, newMessage]);
        if (type === 'text') setInputText('');

        // Save to cache
        const cacheIdentity = isGroup
            ? { type: 'group', classId: data?.classId, sectionId: data?.sectionId }
            : isStaffPartner
                ? { isStaff: true, staff_name: chatTitle, emp_id: chatId, receiverId: chatId, type: 'individual' }
                : { isStaff: false, student_name: chatTitle, stud_id: chatId, receiverId: chatId, type: 'individual' };

        if (chatId) {
            addMessageToCache(chatId.toString(), newMessage, chatTitle, cacheIdentity);
        }

        // CRITICAL: Use database ID (stud_id/emp_id) for E2EE keys to match registration

        // E2EE: Encrypt message content if it's a individual text message
        let finalMessageContent = content;
        if (!isGroup && type === 'text') {
            console.log(`🔒 [E2EE] Encrypting message for: ${receiverId}`);
            finalMessageContent = await encryptMessage(receiverId?.toString() || '', content);
        }

        const payload: any = {
            message: type === 'text' ? finalMessageContent : (extra.fileName || ''), // Send filename or empty for non-text
            chatId: data?.chatId || null,
            type: isGroup ? 'group' : 'individual',
            clientId: newMessageId // FIX: Send UUID/clientId to backend
        };

        if (type === 'image' || type === 'video' || type === 'file') {
            payload.attachment = content; // URI
        } else if (type === 'voice') {
            payload.voiceNote = content;
            if (extra.duration) payload.duration = extra.duration;
        }

        if (isGroup) {
            payload.class_id = data?.classId || data?.class_id || data?.stud_class;
            payload.section_id = data?.sectionId || data?.section_id || data?.stud_section;
            payload.sender_name = myOwnDisplayName;
        } else if (isStaffPartner) {
            payload.receiverId = receiverId;
            payload.emp_id = data?.emp_id || data?.employeeId || receiverId;
            payload.receiver_role = 'staff';
            payload.isStaffChat = true;
            payload.sender_name = myOwnDisplayName;
            payload.receiver_name = chatTitle;
        } else {
            payload.receiverId = receiverId;
            payload.stud_id = data?.stud_id || receiverId;
            payload.stud_no = data?.stud_no || data?.studentNumber || data?.admission_no;
            payload.sender_name = myOwnDisplayName;
            payload.receiver_name = chatTitle;
        }

        const mySenderDisplayName = (() => {
            if (isEmployee(user)) return `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'You';
            if (isAdmin(user)) return (user as any).name || 'You';
            if (isStudent(user)) return `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'You';
            return 'You';
        })();
        console.log(`💬 [CHAT SEND] SENDER -> ID: ${userId} ("${mySenderDisplayName}") ===> RECEIVER -> ID: ${receiverId || (isGroup ? 'GROUP' : 'Unknown')} ("${chatTitle}") | Type: ${type}`);
        console.log('📤 [Chat] Sending payload:', payload);

        try {
            const response = await sendMutation.mutateAsync(payload);
            console.log('✅ [Chat] Message sent successfully:', response);

            const serverMessage = response?.data?.id ? response.data : response?.data || response?.message || response;
            const serverMessageId = serverMessage?.id?.toString();
            if (serverMessageId) {
                setMessages((prev) => {
                    const optimistic = prev.find((message) => message.id === newMessageId);
                    if (!optimistic) return prev;
                    const withoutOptimistic = prev.filter((message) => message.id !== newMessageId);
                    const existingServer = withoutOptimistic.find((message) => message.id === serverMessageId);
                    if (existingServer) return withoutOptimistic;
                    return [
                        ...withoutOptimistic,
                        { ...optimistic, id: serverMessageId, status: 'sent', isOptimistic: false },
                    ];
                });

                if (chatId) {
                    await addMessageToCache(
                        chatId.toString(),
                        { ...newMessage, id: serverMessageId, status: 'sent', isOptimistic: false },
                        chatTitle,
                        cacheIdentity
                    );
                }
            }

            // Mark as 'sent' (single tick) immediately
            setMessages(prev => prev.map(m => m.id === serverMessageId || m.id === newMessageId
                ? { ...m, id: serverMessageId || m.id, status: 'sent' }
                : m));

            // On success, the real message ID will come back in history sync later
        } catch (error) {
            console.error('❌ [Chat] Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');

            // Optional: Mark message as failed in UI?
            setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, status: 'failed' as any } : m));
        }

        // NOTE: We no longer manually Emit to socket here. 
        // The Backend 'sendMessage' controller already emits 'receive_message' 
        // to the correct room. This prevents duplicate logic.
    };

    // Initial create message is already sent from Communication.tsx.
    // Do not auto-resend data.initialMessage here — that duplicated the first message.

    useEffect(() => {
        recordingTimeRef.current = recordingTime;
    }, [recordingTime]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;

        if (isRecording) {
            timer = setInterval(() => {
                const started = recordingStartedAtRef.current;
                if (!started) return;
                const secs = Math.max(0, Math.floor((Date.now() - started) / 1000));
                recordingTimeRef.current = secs;
                setRecordingTime(secs);
            }, 200);

            Animated.loop(
                Animated.sequence([
                    Animated.timing(recordingAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(recordingAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            waveAnims.forEach((anim) => {
                const animate = () => {
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 300 + Math.random() * 500,
                            useNativeDriver: false,
                        }),
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 300 + Math.random() * 500,
                            useNativeDriver: false,
                        }),
                    ]).start(() => {
                        if (isRecordingRef.current) animate();
                    });
                };

                animate();
            });
        } else {
            recordingAnim.setValue(1);
            waveAnims.forEach(anim => anim.stopAnimation());
        }

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                const Audio = getExpoAudio();
                if (Audio) {
                    await Audio.requestPermissionsAsync();
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: true,
                        playsInSilentModeIOS: true,
                    });
                }
            }
        })();
    }, []);

    const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
        if (!result.canceled) sendMessage(result.assets[0].type === 'video' ? 'video' : 'image', result.assets[0].uri);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled) sendMessage('image', result.assets[0].uri);
        setShowAttachmentMenu(false);
    };

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.8 });
        if (!result.canceled) sendMessage('video', result.assets[0].uri);
        setShowAttachmentMenu(false);
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: ['*/*'], copyToCacheDirectory: true });
            if (!result.canceled) sendMessage('file', result.assets[0].uri, { fileName: result.assets[0].name });
        } catch (err) { }
        setShowAttachmentMenu(false);
    };

    // Mic PanResponder — WhatsApp: hold to record, slide left cancel, slide up lock
    const micPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: () => {
                micPressAtRef.current = Date.now();
                slideX.setValue(0);
                setIsCancelling(false);
                if (!isRecordingRef.current && !voiceReady) {
                    handleVoiceNoteRef.current?.();
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isRecordingRef.current || recordingLockedRef.current) return;
                if (gestureState.dy < -70) {
                    recordingLockedRef.current = true;
                    setRecordingLocked(true);
                    slideX.setValue(0);
                    setIsCancelling(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    return;
                }
                if (gestureState.dx < 0) {
                    slideX.setValue(gestureState.dx);
                    setIsCancelling(gestureState.dx < -80);
                } else {
                    slideX.setValue(0);
                    setIsCancelling(false);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (!isRecordingRef.current) {
                    slideX.setValue(0);
                    setIsCancelling(false);
                    return;
                }
                if (recordingLockedRef.current) {
                    slideX.setValue(0);
                    setIsCancelling(false);
                    return;
                }
                if (gestureState.dx < -80) {
                    stopRecordingAndActionRef.current?.('discard');
                } else {
                    stopRecordingAndActionRef.current?.('send');
                }
                slideX.setValue(0);
                setIsCancelling(false);
            },
            onPanResponderTerminate: () => {
                if (isRecordingRef.current && !recordingLockedRef.current) {
                    stopRecordingAndActionRef.current?.('send');
                }
                slideX.setValue(0);
                setIsCancelling(false);
            },
        })
    ).current;

    const stopRecordingAndAction = async (action: 'send' | 'discard') => {
        const activeRecording = recordingRef.current;
        const elapsedMs = recordingStartedAtRef.current
            ? Date.now() - recordingStartedAtRef.current
            : recordingTimeRef.current * 1000;
        setIsRecording(false);
        isRecordingRef.current = false;
        recordingLockedRef.current = false;
        setRecordingLocked(false);
        slideX.setValue(0);
        setIsCancelling(false);

        if (!activeRecording) {
            setRecordingTime(0);
            recordingTimeRef.current = 0;
            recordingStartedAtRef.current = 0;
            return;
        }
        try {
            let durationMs = elapsedMs;
            try {
                const status = await activeRecording.getStatusAsync();
                if (status?.durationMillis) durationMs = status.durationMillis;
            } catch { /* use elapsed */ }
            const uri = activeRecording.getURI();
            await activeRecording.stopAndUnloadAsync();
            const Audio = getExpoAudio();
            if (Audio) {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                });
            }
            setRecording(null);
            recordingRef.current = null;

            const durationLabel = formatTime(Math.max(0, Math.round(durationMs / 1000)));
            if (action === 'send' && uri && durationMs >= 800) {
                sendMessage('voice', uri, { duration: durationLabel });
            }
            setRecordingTime(0);
            recordingTimeRef.current = 0;
            recordingStartedAtRef.current = 0;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setRecording(null);
            recordingRef.current = null;
            setRecordingTime(0);
            recordingStartedAtRef.current = 0;
        }
    };

    const handleVoiceNote = async () => {
        if (isRecordingRef.current) return;
        try {
            Keyboard.dismiss();
            const startedAt = Date.now();
            recordingStartedAtRef.current = startedAt;
            recordingTimeRef.current = 0;
            setRecordingTime(0);
            setIsRecording(true);
            isRecordingRef.current = true;
            recordingLockedRef.current = false;
            setRecordingLocked(false);
            setVoiceReady(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

            const Audio = getExpoAudio();
            if (!Audio) {
                setIsRecording(false);
                isRecordingRef.current = false;
                recordingStartedAtRef.current = 0;
                Alert.alert(
                    'Voice notes unavailable',
                    'Voice recording is not included in this app version. You can still send photos, videos, and files.'
                );
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
                (status) => {
                    if (status?.isRecording && status.durationMillis != null) {
                        const secs = Math.max(0, Math.floor(status.durationMillis / 1000));
                        recordingTimeRef.current = secs;
                        setRecordingTime(secs);
                    }
                },
                200
            );
            if (!isRecordingRef.current) {
                try {
                    await newRecording.stopAndUnloadAsync();
                } catch { /* already cancelled */ }
                return;
            }
            setRecording(newRecording);
            recordingRef.current = newRecording;
        } catch (error) {
            console.error('Failed to start recording:', error);
            setIsRecording(false);
            isRecordingRef.current = false;
            recordingStartedAtRef.current = 0;
            Alert.alert('Microphone Error', 'Could not access microphone');
        }
    };

    handleVoiceNoteRef.current = handleVoiceNote;
    stopRecordingAndActionRef.current = stopRecordingAndAction;

    const sendVoiceNote = async () => {
        if (!recordingUri) return;
        sendMessage('voice', recordingUri, { duration: formatTime(recordingTime) });
        setVoiceReady(false);
        setRecordingTime(0);
        setRecordingUri(null);
    };

    const discardVoiceNote = () => {
        setVoiceReady(false);
        setRecordingTime(0);
        setRecordingUri(null);
    };

    const formatMillis = (millis: number) => {
        const totalSeconds = millis / 1000;
        const seconds = Math.floor(totalSeconds % 60);
        const minutes = Math.floor(totalSeconds / 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };


    // Play/Pause voice note
    const playVoiceNote = async (voiceUri: string, messageId: string) => {
        try {
            // Determine full URI
            const uri = getMediaUrl(voiceUri);

            // If already playing this voice, toggle pause/play
            if (playingVoiceId === messageId && sound) {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    if (status.isPlaying) {
                        await sound.pauseAsync();
                        setIsVoicePaused(true);
                    } else {
                        await sound.playAsync();
                        setIsVoicePaused(false);
                    }
                }
                return;
            }

            // Stop any currently playing sound
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }

            // Play new voice note
            const Audio = getExpoAudio();
            if (!Audio) {
                Alert.alert(
                    'Voice notes unavailable',
                    'Voice playback is not included in this app version.'
                );
                return;
            }
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: uri },
                { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true },
                (status) => {
                    if (status.isLoaded) {
                        setPlaybackPosition(status.positionMillis);
                        setPlaybackDuration(status.durationMillis || 0);
                        if (status.didJustFinish) {
                            setPlayingVoiceId(null);
                            setIsVoicePaused(false);
                            setPlaybackPosition(0);
                        }
                    }
                }
            );

            setSound(newSound);
            setPlayingVoiceId(messageId);
            setIsVoicePaused(false);
        } catch (error) {
            console.error('Error playing voice note:', error);
            Alert.alert('Error', 'Could not play voice note');
        }
    };

    // Seek voice note
    const seekVoiceNote = async (ratio: number, messageId: string) => {
        if (playingVoiceId === messageId && sound) {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
                const targetPos = ratio * (status.durationMillis || 0);
                await sound.setPositionAsync(targetPos);
            }
        }
    };

    // Toggle playback rate
    const togglePlaybackRate = async () => {
        const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
        setPlaybackRate(nextRate);
        if (sound) {
            await sound.setRateAsync(nextRate, true);
        }
    };

    // View image in full screen
    const viewImage = (imageUri: string) => {
        setSelectedImage(imageUri);
        setShowImageViewer(true);
    };

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // Poll Creation Logic
    const handleCreatePoll = () => {
        const validOptions = pollOptions.filter(opt => opt.trim() !== '');
        if (!pollQuestion.trim() || validOptions.length < 2) {
            Alert.alert('Error', 'Please provide a question and at least 2 options.');
            return;
        }

        createPollMutation({
            question: pollQuestion,
            options: validOptions,
            classId: data?.classId,
            sectionId: data?.sectionId || 'all'
        }, {
            onSuccess: () => {
                setShowPollModal(false);
                setPollQuestion('');
                setPollOptions(['', '']);
            },
            onError: () => Alert.alert('Error', 'Failed to create poll')
        });
    };

    const handleVote = (pollId: string | number, optionId: string | number) => {
        // Haptic Feedback (WhatsApp-like feel)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // 1. Optimistic UI Update
        setMessages(prev => prev.map(msg => {
            const isMatch = (msg.type === 'poll' && (msg.pollData?.pollId?.toString() === pollId.toString() || msg.id.toString() === pollId.toString()));
            if (isMatch && msg.pollData) {
                const currentPoll = msg.pollData;

                // If already voted for this, do nothing (prevent double voting/spam)
                const alreadyVotedSelection = currentPoll.options.find(o => o.id === optionId && o.votedByMe);
                if (alreadyVotedSelection) return msg;

                const newOptions = currentPoll.options.map(opt => {
                    let newVotes = opt.votes;
                    let newVotedByMe = opt.votedByMe;

                    if (opt.id === optionId) {
                        newVotes += 1;
                        newVotedByMe = true;
                    } else if (opt.votedByMe) {
                        // Subtract from previous selection if switching
                        newVotes = Math.max(0, newVotes - 1);
                        newVotedByMe = false;
                    }
                    return { ...opt, votes: newVotes, votedByMe: newVotedByMe };
                });

                return {
                    ...msg,
                    pollData: {
                        ...currentPoll,
                        options: newOptions,
                        totalVotes: currentPoll.hasVoted ? currentPoll.totalVotes : currentPoll.totalVotes + 1,
                        hasVoted: true
                    }
                };
            }
            return msg;
        }));

        // 2. Persist to Server
        votePollMutation({ pollId, optionId }, {
            onError: (err) => {
                console.error('Vote failed:', err);
                Alert.alert('Error', 'Failed to cast vote. Retrying...');
                // Optional: Rollback logic here if needed, but socket will usually fix it anyway
            }
        });
    };

    const addOption = () => {
        if (pollOptions.length < 10) setPollOptions([...pollOptions, '']);
    };

    const removeOption = (index: number) => {
        if (pollOptions.length > 2) {
            const newOptions = [...pollOptions];
            newOptions.splice(index, 1);
            setPollOptions(newOptions);
        }
    };

    const renderStatus = (status?: Message['status'], isUser?: boolean, isGroupChat?: boolean) => {
        if (!status || !isUser) return null;

        let iconName = 'time-outline';
        let color = 'rgba(255,255,255,0.7)';

        if (status === 'pending') {
            iconName = 'time-outline';
            color = 'rgba(255,255,255,0.6)';
        } else if (status === 'sent') {
            iconName = 'checkmark';
            color = 'rgba(255,255,255,0.85)';
        } else if (status === 'delivered') {
            iconName = 'checkmark-done';
            color = 'rgba(255,255,255,0.95)';
        } else if (status === 'read') {
            iconName = 'checkmark-done';
            color = '#38BDF8'; // Vibrant modern cyan-blue
        }

        return (
            <Icon name={iconName as any} size={15} color={color} style={{ marginLeft: 4, marginBottom: -1 }} />
        );
    };

    const renderPoll = (message: Message) => {
        const isUser = message.sender === 'user';
        const poll = message.pollData;
        if (!poll) return null;

        return (
            <View style={styles.pollContainer}>
                <Text style={[styles.pollQuestion, isUser ? styles.userMessageText : styles.otherMessageText]}>
                    {poll.question}
                </Text>
                {poll.options.map((option) => {
                    const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[styles.pollOption, option.votedByMe && styles.votedOption]}
                            onPress={() => handleVote(poll.pollId, option.id)}
                            // Allow switching your vote to a different option — only the
                            // option you've already voted for is disabled (re-pressing it
                            // is a no-op in handleVote anyway, so disabling it here just
                            // avoids a pointless optimistic update / network call).
                            // Previously this disabled EVERY option once hasVoted was true,
                            // which silently made voting single-shot despite the comment
                            // (and handleVote's logic) clearly intending switching to work.
                            disabled={option.votedByMe}
                        >
                            <View style={styles.pollOptionContent}>
                                <Text style={[styles.pollOptionText, isUser ? styles.userMessageText : styles.otherMessageText]}>
                                    {option.text}
                                </Text>
                                {option.votedByMe && <Icon name="checkmark-circle" size={14} color={isUser ? "#fff" : "#424e79"} style={{ marginRight: 4 }} />}
                                <Text style={[styles.pollVoteCount, isUser ? styles.userMessageText : styles.otherMessageText]}>
                                    {option.votes}
                                </Text>
                            </View>
                            <View style={styles.pollProgressBg}>
                                <View style={[styles.pollProgressFill, { width: `${percentage}%`, backgroundColor: isUser ? '#fff' : '#424e79' }]} />
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <Text style={[styles.pollTotalVotes, isUser ? styles.userMessageText : styles.otherMessageText]}>
                    {poll.totalVotes} votes total
                </Text>
            </View>
        );
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user' || isMyMessageSender(item.rawSenderId);
        const isGroup = recipient === 'group' || data?.type === 'group';
        const canDelete = isStaffUser && isUser && !item.isDeleted;

        return (
            <View style={[styles.messageWrapper, isUser ? styles.userMessageWrapper : styles.otherMessageWrapper]}>
                <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
                    <Pressable
                        style={{ flexShrink: 1 }}
                        delayLongPress={280}
                        onLongPress={() => {
                            if (!canDelete) return;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                            handleDeleteMessage(item);
                        }}
                    >
                        <View style={[
                            styles.messageBubble,
                            isUser ? styles.userBubble : styles.otherBubble,
                            item.isDeleted && styles.deletedBubble,
                        ]}>
                            {item.isDeleted ? (
                                <>
                                    <View style={styles.deletedRow}>
                                        <Icon
                                            name="ban-outline"
                                            size={14}
                                            color={isUser ? 'rgba(255,255,255,0.85)' : '#94A3B8'}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={[
                                            styles.deletedMessageText,
                                            isUser ? styles.userDeletedText : styles.otherDeletedText,
                                        ]}>
                                            This message was deleted
                                        </Text>
                                    </View>
                                    <View style={styles.timestampContainer}>
                                        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.otherTimestamp]}>{item.timestamp}</Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    {item.type === 'poll' && renderPoll(item)}
                                    {item.type === 'text' && <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.otherMessageText]}>{item.content}</Text>}
                                    {item.type === 'image' && (
                                        <Pressable
                                            onPress={() => viewImage(getMediaUrl(item.content))}
                                            onLongPress={() => {
                                                if (!canDelete) return;
                                                handleDeleteMessage(item);
                                            }}
                                            delayLongPress={280}
                                        >
                                            <View style={styles.mediaContainer}>
                                                <Image
                                                    source={{ uri: getMediaUrl(item.content) }}
                                                    style={[styles.messageImage, { width: width * 0.6 }]}
                                                    resizeMode="cover"
                                                />
                                                <View style={styles.timestampContainerUnderMedia}>
                                                    <Text style={styles.timestampUnderMedia}>{item.timestamp}</Text>
                                                    {renderStatus(item.status, isUser, isGroup)}
                                                </View>
                                            </View>
                                        </Pressable>
                                    )}
                                    {item.type === 'video' && (
                                        <View style={styles.mediaContainer}>
                                            <View style={[styles.messageImage, styles.videoPlaceholder, { width: width * 0.6 }]}>
                                                <Icon name="play-circle" size={50} color="#fff" />
                                            </View>
                                            <View style={styles.timestampContainerUnderMedia}>
                                                <Text style={styles.timestampUnderMedia}>{item.timestamp}</Text>
                                                {renderStatus(item.status, isUser, isGroup)}
                                            </View>
                                        </View>
                                    )}
                                    {item.type === 'voice' && (
                                        <View style={styles.voiceContainer}>
                                            <View style={styles.voiceMainRow}>
                                                <TouchableOpacity
                                                    style={styles.voicePlayButton}
                                                    onPress={() => playVoiceNote(item.content, item.id)}
                                                    onLongPress={() => {
                                                        if (!canDelete) return;
                                                        handleDeleteMessage(item);
                                                    }}
                                                    delayLongPress={280}
                                                >
                                                    <Icon
                                                        name={playingVoiceId === item.id && !isVoicePaused ? "pause" : "play"}
                                                        size={30}
                                                        color={isUser ? "#fff" : "#424e79"}
                                                    />
                                                </TouchableOpacity>

                                                <View style={styles.voiceBody}>
                                                    <View
                                                        style={styles.voiceSliderContainer}
                                                        onLayout={(e) => {
                                                            const { width } = e.nativeEvent.layout;
                                                            setSliderWidths(prev => ({ ...prev, [item.id]: width }));
                                                        }}
                                                        {...PanResponder.create({
                                                            onStartShouldSetPanResponder: () => true,
                                                            onMoveShouldSetPanResponder: () => true,
                                                            onPanResponderGrant: (e) => {
                                                                if (playingVoiceId === item.id) {
                                                                    const { locationX } = e.nativeEvent;
                                                                    // Store drag-start position in a ref keyed by
                                                                    // message id — NOT `this` (see comment on
                                                                    // voiceSeekStartRef above).
                                                                    voiceSeekStartRef.current[item.id] = locationX;
                                                                    const w = sliderWidths[item.id] || 150;
                                                                    const ratio = Math.max(0, Math.min(1, locationX / w));
                                                                    seekVoiceNote(ratio, item.id);
                                                                }
                                                            },
                                                            onPanResponderMove: (_, gesture) => {
                                                                if (playingVoiceId === item.id) {
                                                                    const w = sliderWidths[item.id] || 150;
                                                                    const startLocX = voiceSeekStartRef.current[item.id] || 0;
                                                                    const currentPos = startLocX + gesture.dx;
                                                                    const ratio = Math.max(0, Math.min(1, currentPos / w));
                                                                    seekVoiceNote(ratio, item.id);
                                                                }
                                                            },
                                                        }).panHandlers}
                                                    >
                                                        <View style={styles.voiceProgressBarBg}>
                                                            <View
                                                                style={[
                                                                    styles.voiceProgressBarFill,
                                                                    {
                                                                        width: playingVoiceId === item.id
                                                                            ? `${(playbackPosition / (playbackDuration || 1)) * 100}%`
                                                                            : '0%',
                                                                        backgroundColor: isUser ? '#fff' : '#424e79'
                                                                    }
                                                                ]}
                                                            />
                                                            <View
                                                                style={[
                                                                    styles.voiceProgressKnob,
                                                                    {
                                                                        left: playingVoiceId === item.id
                                                                            ? `${(playbackPosition / (playbackDuration || 1)) * 100}%`
                                                                            : '0%',
                                                                        backgroundColor: isUser ? '#fff' : '#424e79'
                                                                    }
                                                                ]}
                                                            />
                                                        </View>
                                                    </View>

                                                    <View style={styles.voiceFooter}>
                                                        <Text style={[styles.voiceDuration, { color: isUser ? 'rgba(255,255,255,0.8)' : '#64748b' }]}>
                                                            {playingVoiceId === item.id
                                                                ? formatMillis(playbackPosition)
                                                                : (item.duration || '0:00')}
                                                        </Text>

                                                        <View style={styles.voiceFooterRight}>
                                                            {playingVoiceId === item.id && (
                                                                <TouchableOpacity
                                                                    onPress={togglePlaybackRate}
                                                                    style={[styles.voiceFloatingSpeed, { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : '#f1f5f9' }]}
                                                                >
                                                                    <Text style={[styles.voiceSpeedText, { color: isUser ? '#fff' : '#424e79' }]}>{playbackRate}x</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                            <View style={styles.timestampContainer}>
                                                                <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.otherTimestamp]}>{item.timestamp}</Text>
                                                                {/* Only the sender's own bubble shows delivery/read ticks —
                                                    a message you RECEIVED should never show ticks to you.
                                                    Previously this forced `isUser` to true whenever
                                                    item.type === 'voice', so received voice notes wrongly
                                                    displayed the sender-only status icon. */}
                                                                {renderStatus(item.status, isUser, isGroup)}
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View style={styles.voiceRightIcon}>
                                                    <Icon name="mic" size={18} color={isUser ? "#fff" : "#424e79"} style={{ opacity: 0.6 }} />
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                    {item.type === 'file' && (
                                        <View style={styles.fileContainer}>
                                            <Icon name="document-text" size={30} color={isUser ? "#fff" : "#424e79"} />
                                            <View style={styles.fileInfo}>
                                                <Text style={[styles.fileName, { color: isUser ? '#fff' : '#1e293b' }]} numberOfLines={1}>{item.fileName}</Text>
                                                <Text style={[styles.fileSize, { color: isUser ? 'rgba(255,255,255,0.7)' : '#64748b' }]}>File</Text>
                                            </View>
                                        </View>
                                    )}
                                    {item.type !== 'image' && item.type !== 'video' && item.type !== 'poll' && item.type !== 'voice' && (
                                        <View style={styles.timestampContainer}>
                                            <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.otherTimestamp]}>{item.timestamp}</Text>
                                            {renderStatus(item.status, isUser, isGroup)}
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </Pressable>
                </View>
            </View>
        );
    };

    // Android + resize: window already sits above the keyboard → tiny pad only.
    // iOS student path uses KeyboardAvoidingView → only nav inset.
    // iOS staff path uses manual keyboardOverlap lift.
    const composerGap =
        Platform.OS === 'android'
            ? (keyboardOverlap > 0 ? 6 : navInset)
            : Platform.OS === 'ios' && !isStaffUser
                ? navInset
                : (keyboardOverlap > 0 ? keyboardOverlap : navInset);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' && !isStaffUser ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <LinearGradient
                colors={brand.headerGradient}
                start={brand.headerStart}
                end={brand.headerEnd}
                style={[styles.header, { paddingTop: Math.max(insets.top, 8) + 8 }]}
            >
                <View style={styles.headerContent}>
                    <BackButton color={brand.primaryDark} backgroundColor="#eef0f8" size={48} iconSize={22} style={styles.headerBackButton} />
                    <View style={styles.headerCenter}>
                        <View style={styles.headerTitleRow}>
                            {recipient === 'student' && !isStaffPartner ? (
                                <Image source={data?.stud_photo ? { uri: data.stud_photo } : { uri: 'https://via.placeholder.com/50' }} style={styles.avatar} />
                            ) : (
                                <LinearGradient
                                    colors={isStaffPartner ? (brand.isStaff ? ['#eebd89', '#d13abd'] : ['#5a6898', '#424e79']) : (isGroup ? ['#14B8A6', '#0F766E'] : ['#3B82F6', '#1D4ED8'])}
                                    style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}
                                >
                                    <Icon name={isStaffPartner ? "person" : (isGroup ? "people" : "school")} size={20} color="#FFFFFF" />
                                </LinearGradient>
                            )}
                            <View style={{ flex: 1, marginLeft: 2 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.headerTitleText} numberOfLines={1}>{chatTitle}</Text>
                                    {isStaffPartner ? (
                                        <View style={styles.staffBadge}>
                                            <Icon name="shield-checkmark" size={10} color="#424e79" style={{ marginRight: 3 }} />
                                            <Text style={styles.staffBadgeText}>STAFF</Text>
                                        </View>
                                    ) : isGroup ? (
                                        <View style={styles.groupBadge}>
                                            <Icon name="people" size={10} color="#0D9488" style={{ marginRight: 3 }} />
                                            <Text style={styles.groupBadgeText}>GROUP</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.studentBadge}>
                                            <Icon name="school" size={10} color="#1D4ED8" style={{ marginRight: 3 }} />
                                            <Text style={styles.studentBadgeText}>STUDENT</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.statusRow}>
                                    <View style={[styles.statusDot, { backgroundColor: socket.connected ? '#10b981' : '#f43f5e' }]} />
                                    <Text style={styles.headerSubtitleText}>{socket.connected ? 'Online' : 'Connecting...'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        {!isStudent(user) && (
                            <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('NewCommunication')}>
                                <Icon name="add-circle-outline" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </LinearGradient>


            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id.toString()}
                style={styles.flatList}
                contentContainerStyle={styles.messageList}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={() => (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
                        <Text style={{ color: '#94a3b8' }}>No messages yet</Text>
                    </View>
                )}
            />

            <Modal visible={showAttachmentMenu} transparent={true} animationType="slide" onRequestClose={() => setShowAttachmentMenu(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAttachmentMenu(false)}>
                    <View style={[styles.attachmentMenu, { paddingBottom: 24 + navInset }]}>
                        <View style={styles.attachmentRow}>
                            <View style={styles.attachmentItemWrapper}><TouchableOpacity style={[styles.attachmentItem, { backgroundColor: '#7e57c2' }]} onPress={pickDocument}><Icon name="document" size={24} color="#fff" /></TouchableOpacity><Text style={styles.attachmentLabel}>Document</Text></View>
                            <View style={styles.attachmentItemWrapper}><TouchableOpacity style={[styles.attachmentItem, { backgroundColor: '#f06292' }]} onPress={takePhoto}><Icon name="camera" size={24} color="#fff" /></TouchableOpacity><Text style={styles.attachmentLabel}>Camera</Text></View>
                            <View style={styles.attachmentItemWrapper}><TouchableOpacity style={[styles.attachmentItem, { backgroundColor: '#ba68c8' }]} onPress={pickImage}><Icon name="images" size={24} color="#fff" /></TouchableOpacity><Text style={styles.attachmentLabel}>Gallery</Text></View>
                        </View>
                        <View style={styles.attachmentRow}>
                            <View style={styles.attachmentItemWrapper}><TouchableOpacity style={[styles.attachmentItem, { backgroundColor: '#4caf50' }]} onPress={pickDocument}><Icon name="stats-chart" size={24} color="#fff" /></TouchableOpacity><Text style={styles.attachmentLabel}>Excel</Text></View>
                            <View style={styles.attachmentItemWrapper}><TouchableOpacity style={[styles.attachmentItem, { backgroundColor: '#ff9800' }]} onPress={pickVideo}><Icon name="videocam" size={24} color="#fff" /></TouchableOpacity><Text style={styles.attachmentLabel}>Video</Text></View>
                            {isGroup && (
                                <View style={styles.attachmentItemWrapper}>
                                    <TouchableOpacity
                                        style={[styles.attachmentItem, { backgroundColor: '#607d8b' }]}
                                        onPress={() => { setShowAttachmentMenu(false); setShowPollModal(true); }}
                                    >
                                        <Icon name="stats-chart" size={24} color="#fff" />
                                    </TouchableOpacity>
                                    <Text style={styles.attachmentLabel}>Poll</Text>
                                </View>
                            )}
                            {!isGroup && <View style={styles.attachmentItemWrapper}><TouchableOpacity style={[styles.attachmentItem, { backgroundColor: '#1e88e5' }]} onPress={pickDocument}><Icon name="archive" size={24} color="#fff" /></TouchableOpacity><Text style={styles.attachmentLabel}>Zip</Text></View>}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {
                isGroup && isStudent(user) ? (
                    <View style={{ padding: 10, alignItems: 'center', backgroundColor: '#f8fafc' }}><Text style={{ fontSize: 12, color: '#94a3b8' }}>Group Broadcast Only</Text></View>
                ) : (
                    <View style={styles.composerDock}>
                    <View style={[
                        styles.inputContainer,
                        isRecording && styles.recordingContainer,
                    ]}>
                        {isRecording ? (
                            <>
                                {recordingLocked && (
                                    <TouchableOpacity
                                        style={styles.discardBtn}
                                        onPress={() => stopRecordingAndAction('discard')}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Icon name="trash" size={22} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                                <View style={styles.waTimerWrap}>
                                    <Animated.View style={[styles.recordingDot, { opacity: recordingAnim.interpolate({ inputRange: [1, 1.2], outputRange: [1, 0.4] }) }]} />
                                    <Text style={styles.waTimer}>{formatTime(recordingTime)}</Text>
                                </View>
                                <View style={styles.waHintWrap}>
                                    {recordingLocked ? (
                                        <Text style={styles.waLockedText}>Locked</Text>
                                    ) : (
                                        <View style={styles.slideNotice}>
                                            <Icon name="chevron-back" size={16} color={isCancelling ? '#ef4444' : '#94a3b8'} />
                                            <Text style={[styles.slideText, isCancelling && { color: '#ef4444' }]}>
                                                {isCancelling ? 'Release to cancel' : 'Slide to cancel'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        ) : (
                            <>
                                {!voiceReady && (
                                    <TouchableOpacity style={styles.attachmentBtn} onPress={() => setShowAttachmentMenu(true)}>
                                        <Icon name="add" size={28} color="#64748b" />
                                    </TouchableOpacity>
                                )}
                                {voiceReady && (
                                    <TouchableOpacity style={styles.discardBtn} onPress={discardVoiceNote}>
                                        <Icon name="trash-outline" size={24} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                                <View style={[
                                    styles.inputWrapper,
                                    voiceReady && styles.voiceReadyWrapper,
                                    !voiceReady && styles.standardInputWrapper
                                ]}>
                                    {voiceReady ? (
                                        <View style={styles.voicePreviewContent}>
                                            <Icon name="mic" size={20} color="#424e79" />
                                            <Text style={styles.voicePreviewText}>Voice Note ready ({formatTime(recordingTime)})</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Type a message..."
                                                value={inputText}
                                                onChangeText={setInputText}
                                                multiline
                                                blurOnSubmit={false}
                                                returnKeyType="send"
                                                onSubmitEditing={() => {
                                                    if (hasComposerText) sendMessage('text');
                                                }}
                                            />
                                            <TouchableOpacity style={styles.mediaBtn} onPress={takePhoto}>
                                                <Icon name="camera-outline" size={26} color="#64748b" />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </>
                        )}

                        {(hasComposerText || voiceReady) && !isRecording ? (
                            <TouchableOpacity style={styles.sendBtn} onPress={() => voiceReady ? sendVoiceNote() : sendMessage('text')}>
                                <LinearGradient colors={['#424e79', '#5a6898']} style={styles.sendBtnGradient}>
                                    <Icon name="send" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : recordingLocked ? (
                            <TouchableOpacity style={styles.sendBtn} onPress={() => stopRecordingAndAction('send')}>
                                <LinearGradient colors={['#25D366', '#128C7E']} style={styles.sendBtnGradient}>
                                    <Icon name="send" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <View
                                style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                                {...micPanResponder.panHandlers}
                            >
                                <Animated.View style={[
                                    styles.micBtnGradient,
                                    {
                                        transform: [
                                            { scale: recordingAnim },
                                            { translateX: recordingLocked ? 0 : slideX }
                                        ],
                                        backgroundColor: isRecording ? (isCancelling ? '#94a3b8' : '#ef4444') : '#424e79'
                                    }
                                ]}>
                                    <Icon name={isRecording ? (isCancelling ? "trash" : "mic") : "mic"} size={24} color="#fff" />
                                </Animated.View>
                            </View>
                        )}
                    </View>
                    <View
                        style={{
                            height: composerGap,
                            backgroundColor: '#ffffff',
                        }}
                    />
                    </View>
                )
            }

            {/* Full Screen Image Viewer */}
            <Modal visible={showImageViewer} transparent={true} animationType="fade" onRequestClose={() => setShowImageViewer(false)}>
                <View style={styles.imageViewerContainer}>
                    <TouchableOpacity
                        style={styles.imageViewerClose}
                        onPress={() => setShowImageViewer(false)}
                    >
                        <Icon name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* Poll Creation Modal */}
            <Modal visible={showPollModal} transparent={true} animationType="fade" onRequestClose={() => setShowPollModal(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.pollModalContainer}>
                    <View style={styles.pollModalContent}>
                        <Text style={styles.pollModalTitle}>Create Poll</Text>

                        <Text style={styles.pollLabel}>Question</Text>
                        <TextInput
                            style={styles.pollInput}
                            placeholder="What is your question?"
                            value={pollQuestion}
                            onChangeText={setPollQuestion}
                            multiline
                        />

                        <Text style={styles.pollLabel}>Options</Text>
                        <FlatList
                            data={pollOptions}
                            keyExtractor={(_, i) => i.toString()}
                            style={styles.pollOptionsList}
                            renderItem={({ item, index }) => (
                                <View style={styles.pollOptionInputRow}>
                                    <TextInput
                                        style={[styles.pollInput, { flex: 1, marginBottom: 0 }]}
                                        placeholder={`Option ${index + 1}`}
                                        value={item}
                                        onChangeText={(text) => {
                                            const newOptions = [...pollOptions];
                                            newOptions[index] = text;
                                            setPollOptions(newOptions);
                                        }}
                                    />
                                    {pollOptions.length > 2 && (
                                        <TouchableOpacity onPress={() => removeOption(index)} style={styles.removeOptionBtn}>
                                            <Icon name="close-circle" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        />

                        {pollOptions.length < 10 && (
                            <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                                <Icon name="add-circle-outline" size={20} color="#424e79" />
                                <Text style={styles.addOptionText}>Add Option</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.pollModalButtons}>
                            <TouchableOpacity style={[styles.pollModalBtn, styles.pollCancelBtn]} onPress={() => setShowPollModal(false)}>
                                <Text style={styles.pollCancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.pollModalBtn, styles.pollCreateBtn]} onPress={handleCreatePoll}>
                                <Text style={styles.pollCreateBtnText}>Create Poll</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2fa' },
    header: {
        backgroundColor: '#424e79',
        paddingBottom: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0,
        shadowColor: '#1a1f3c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6
    },
    headerBackButton: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerCenter: { flex: 1, marginHorizontal: 10 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.35)'
    },
    headerTitleText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2, maxWidth: '75%' },
    staffBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
    staffBadgeText: { fontSize: 9, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
    studentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
    studentBadgeText: { fontSize: 9, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
    groupBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.25)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6, borderWidth: 1, borderColor: 'rgba(16,185,129,0.5)' },
    groupBadgeText: { fontSize: 9, fontWeight: '800', color: '#6ee7b7', letterSpacing: 0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#6ee7b7' },
    headerSubtitleText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
    headerAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', marginLeft: 6 },
    flatList: { flex: 1 },
    messageList: { paddingHorizontal: 16, paddingVertical: 16 },
    messageWrapper: { marginVertical: 3, maxWidth: '82%' },
    userMessageWrapper: { alignSelf: 'flex-end' },
    otherMessageWrapper: { alignSelf: 'flex-start' },
    messageRow: { flexDirection: 'row', alignItems: 'flex-end' },
    messageRowUser: { flexDirection: 'row-reverse' },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        position: 'relative',
    },
    userBubble: {
        backgroundColor: '#424e79',
        borderBottomRightRadius: 3,
        shadowColor: '#1a1f3c',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    otherBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 3,
        borderWidth: 1,
        borderColor: '#dde0f0',
        shadowColor: '#424e79',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
    },
    deletedBubble: {
        opacity: 0.7,
        backgroundColor: '#eef0f8',
        borderWidth: 1,
        borderColor: '#c5cae8',
    },
    deletedRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deletedMessageText: {
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 18,
        color: '#8890b8',
    },
    userDeletedText: { color: 'rgba(255,255,255,0.55)' },
    otherDeletedText: { color: '#8890b8' },
    messageText: { fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
    userMessageText: { color: '#FFFFFF', fontWeight: '400' },
    otherMessageText: { color: '#1a1f3c', fontWeight: '400' },
    timestamp: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4, fontWeight: '500' },
    userTimestamp: { color: 'rgba(255,255,255,0.6)' },
    otherTimestamp: { color: '#8890b8' },
    mediaContainer: { borderRadius: 14, overflow: 'hidden' },
    messageImage: { width: 240, maxWidth: '100%', height: 200, borderRadius: 12 },
    timestampUnderMedia: { fontSize: 10, color: '#fff', position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    videoPlaceholder: { backgroundColor: '#1a1f3c', justifyContent: 'center', alignItems: 'center' },
    voiceContainer: { padding: 4, width: 220 },
    voiceMainRow: { flexDirection: 'row', alignItems: 'center' },
    voicePlayButton: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
    voiceBody: { flex: 1, marginLeft: 4 },
    voiceSliderContainer: { paddingVertical: 10, justifyContent: 'center' },
    voiceProgressBarBg: { height: 4, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 2, position: 'relative' },
    voiceProgressBarFill: { height: 4, borderRadius: 2 },
    voiceProgressKnob: { width: 12, height: 12, borderRadius: 6, position: 'absolute', top: -4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
    voiceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
    voiceFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    voiceFloatingSpeed: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    voiceRightIcon: { marginLeft: 6, marginRight: 2, justifyContent: 'center' },
    voiceSpeedText: { fontSize: 9, fontWeight: '800' },
    voiceDuration: { fontSize: 11, fontWeight: '600' },
    fileContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(66,78,121,0.07)', padding: 10, borderRadius: 12 },
    fileInfo: { marginLeft: 10, flex: 1 },
    fileName: { fontSize: 14, fontWeight: '600' },
    fileSize: { fontSize: 12 },
    composerDock: {
        backgroundColor: '#ffffff',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 8,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#dde0f0',
        shadowColor: '#1a1f3c',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 5
    },
    attachmentBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eef0f8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c5cae8'
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2fa',
        borderRadius: 24,
        paddingHorizontal: 14,
        minHeight: 44,
        marginHorizontal: 8,
        borderWidth: 1,
        borderColor: '#dde0f0'
    },
    input: { flex: 1, maxHeight: 100, paddingVertical: 8, fontSize: 15, color: '#1a1f3c' },
    mediaBtn: { padding: 4, marginLeft: 2 },
    sendBtn: { marginLeft: 2 },
    sendBtnGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1a1f3c',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4
    },
    micBtn: { marginLeft: 2 },
    micBtnGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1a1f3c',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4
    },
    pollContainer: { padding: 4, minWidth: 230 },
    pollQuestion: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
    pollOption: { marginVertical: 4, padding: 10, backgroundColor: 'rgba(66,78,121,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(66,78,121,0.12)' },
    votedOption: { borderColor: '#424e79', backgroundColor: 'rgba(66,78,121,0.15)' },
    pollOptionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    pollOptionText: { fontSize: 13, flex: 1, fontWeight: '600' },
    pollVoteCount: { fontSize: 12, fontWeight: '700' },
    pollProgressBg: { height: 6, backgroundColor: 'rgba(66,78,121,0.1)', borderRadius: 3, overflow: 'hidden' },
    pollProgressFill: { height: '100%', borderRadius: 3 },
    pollTotalVotes: { fontSize: 10, marginTop: 8, textAlign: 'right', fontWeight: '700' },
    pollModalContainer: { flex: 1, backgroundColor: 'rgba(26,31,60,0.7)', justifyContent: 'center', padding: 20 },
    pollModalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#1a1f3c', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    pollModalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1f3c', marginBottom: 20, textAlign: 'center' },
    pollLabel: { fontSize: 12, fontWeight: '700', color: '#4a5080', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    pollInput: { backgroundColor: '#f0f2fa', borderWidth: 1, borderColor: '#dde0f0', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14, color: '#1a1f3c' },
    pollOptionsList: { maxHeight: 240 },
    pollOptionInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    removeOptionBtn: { padding: 8, marginLeft: 4 },
    addOptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, marginTop: 6 },
    addOptionText: { color: '#424e79', fontWeight: '700', marginLeft: 8, fontSize: 14 },
    pollModalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
    pollModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    pollCancelBtn: { backgroundColor: '#eef0f8' },
    pollCreateBtn: { backgroundColor: '#424e79' },
    pollCancelBtnText: { color: '#4a5080', fontWeight: '700', fontSize: 15 },
    pollCreateBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
    recordingContainer: { paddingBottom: 10, backgroundColor: '#ffffff' },
    waTimerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
        minWidth: 78,
        paddingLeft: 4,
    },
    waTimer: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ef4444',
        minWidth: 52,
        fontVariant: ['tabular-nums'],
    },
    waHintWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
    },
    waLockedText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
    },
    standardInputWrapper: { borderWidth: 1, borderColor: '#dde0f0' },
    recordingStatus: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, minWidth: 72 },
    slideNotice: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
    slideText: { fontSize: 13, color: '#8890b8', fontWeight: '600' },
    micBtnRecording: { height: 56, width: 56, borderRadius: 28, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(26,31,60,0.55)', justifyContent: 'center', alignItems: 'center' },
    attachmentMenu: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, width: '100%', position: 'absolute', bottom: 0, shadowColor: '#1a1f3c', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12 },
    attachmentRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    attachmentItemWrapper: { alignItems: 'center', width: '30%' },
    attachmentItem: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    attachmentLabel: { fontSize: 12, color: '#4a5080', fontWeight: '600' },
    recordingWrapper: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    voiceReadyWrapper: { backgroundColor: '#eef0f8', borderWidth: 1, borderColor: '#c5cae8' },
    recordingContent: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
    recordingHeader: { flexDirection: 'row', alignItems: 'center' },
    recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 8 },
    recordingTimer: { fontSize: 18, fontWeight: '800', color: '#EF4444', minWidth: 52, fontVariant: ['tabular-nums'] },
    analyzerContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginHorizontal: 8, minWidth: 24, overflow: 'hidden' },
    analyzerBar: { width: 3, backgroundColor: '#424e79', borderRadius: 2 },
    cancelText: { color: '#4a5080', fontWeight: '600', fontSize: 13 },
    voicePreviewContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    voicePreviewText: { fontSize: 13, color: '#424e79', fontWeight: '600' },
    discardBtn: { padding: 8, marginRight: 4 },
    imageViewerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    imageViewerClose: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 },
    fullScreenImage: { width: '100%', height: '100%' },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    timestampContainerUnderMedia: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
});

export default ChatScreen;