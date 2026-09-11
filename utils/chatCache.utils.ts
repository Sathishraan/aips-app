/**
 * Stable cache-key helpers for WhatsApp-style chat lists.
 *
 * IMPORTANT:
 * - Server `chatId` is the DB parent thread id (communication.id).
 * - App cache MUST key individual chats by the peer user id,
 *   and group chats by `group_{classId}_{sectionId}`.
 * - Mixing those two caused split/duplicate threads and "missing" cache.
 */

export type CacheChatKind = 'individual' | 'group';

const asStr = (v: any): string | undefined => {
    if (v == null || v === '') return undefined;
    return String(v).trim();
};

/** Server sends type as 1/2 (int) or 'individual'/'group'. */
export const isGroupPayload = (data: any): boolean => {
    if (!data) return false;
    const t = data.type;
    if (t === 2 || t === '2' || t === 'group') return true;
    if (data.isGroup === true || data.isBroadcast === true) return true;
    if (data.groupId || data.group_id) return true;
    // Explicit class targeting without individual receiver
    if ((data.classId || data.class_id) && !(data.receiverId || data.receiver_id)) {
        return true;
    }
    return false;
};

export const normalizeCacheChatType = (data: any): CacheChatKind =>
    isGroupPayload(data) ? 'group' : 'individual';

/** Build group cache id: group_12_A / group_12_all */
export const buildGroupCacheId = (classId?: any, sectionId?: any): string | undefined => {
    const c = asStr(classId);
    if (!c) return undefined;
    const s = asStr(sectionId) || 'all';
    return `group_${c}_${s}`;
};

/**
 * Resolve the ONE cache key used by useChatCache / ChatList / ChatScreen / GlobalListener.
 *
 * @param myIds - all identity strings for the logged-in user (mapId, stud_no, emp_id, …)
 */
export const resolveCacheChatId = (opts: {
    payload?: any;
    routeData?: any;
    passedChatId?: any;
    myIds?: Array<string | number | null | undefined>;
}): string | undefined => {
    const { payload = {}, routeData = {}, passedChatId, myIds = [] } = opts;
    const mine = new Set(
        myIds.filter((x) => x != null && x !== '').map((x) => String(x).trim())
    );

    // Prefer an already-stable app cache key if present
    const preferred = asStr(passedChatId) || asStr(routeData?.cacheChatId);
    if (preferred) {
        if (preferred.startsWith('group_') || preferred === 'broadcast_all_school') {
            return preferred;
        }
        // Individual preferred key must look like a peer id, NOT a random DB parent id
        // when we also have peer fields — still accept it if it's what ChatList stored.
        if (!isGroupPayload(payload) && !isGroupPayload(routeData)) {
            return preferred;
        }
    }

    if (isGroupPayload(payload) || isGroupPayload(routeData) || String(passedChatId || '').startsWith('group_')) {
        const classId =
            payload.classId ||
            payload.class_id ||
            routeData.classId ||
            routeData.class_id;
        const sectionId =
            payload.sectionId ||
            payload.section_id ||
            routeData.sectionId ||
            routeData.section_id ||
            'all';
        return (
            buildGroupCacheId(classId, sectionId) ||
            (String(passedChatId || '').startsWith('group_') ? String(passedChatId) : undefined)
        );
    }

    // Individual: NEVER use server chatId/parentId — always the other party
    const senderId = asStr(
        payload.senderId ||
            payload.fromId ||
            payload.sender_id ||
            payload.from_id
    );
    const receiverId = asStr(
        payload.receiverId ||
            payload.receiver_id ||
            payload.toId ||
            payload.studentId ||
            payload.student_id
    );

    const isMine = (id?: string) => !!(id && mine.has(id));

    if (senderId && receiverId) {
        if (isMine(senderId) && !isMine(receiverId)) return receiverId;
        if (isMine(receiverId) && !isMine(senderId)) return senderId;
        // Both or neither match — prefer non-self
        if (!isMine(receiverId)) return receiverId;
        if (!isMine(senderId)) return senderId;
    }

    // Route / list data fallbacks (opening a chat from UI)
    const peerFromRoute = asStr(
        routeData.stud_id ||
            routeData.receiverId ||
            routeData.receiver_id ||
            routeData.employeeId ||
            routeData.emp_id ||
            routeData.stud_no ||
            routeData.studentNumber ||
            routeData.id
    );
    if (peerFromRoute && !isMine(peerFromRoute)) return peerFromRoute;
    if (peerFromRoute) return peerFromRoute;

    if (receiverId && !isMine(receiverId)) return receiverId;
    if (senderId && !isMine(senderId)) return senderId;

    return receiverId || senderId;
};

/** messageType only — never confuse with chat type 1/2 */
export const resolveMessageContentType = (raw: any): 'text' | 'image' | 'video' | 'file' | 'voice' | 'poll' => {
    const explicit = raw?.messageType || raw?.msgType || raw?.contentType;
    if (['image', 'voice', 'video', 'file', 'poll', 'text'].includes(explicit)) {
        return explicit;
    }
    // Do NOT use raw.type — that is chat kind (1/2) on the Node API
    return 'text';
};

export type ChatPeerRole = 'staff' | 'student' | 'group';

const GENERIC_CHAT_NAMES = new Set([
    'chat',
    'chat member',
    'unknown',
    'unknown sender',
    'staff',
    'staff member',
    'student',
    'communication',
    'student member',
    'you',
    'me',
]);

export const isGenericChatName = (name?: string | null): boolean => {
    if (!name) return true;
    const trimmed = name.trim();
    if (!trimmed) return true;
    if (GENERIC_CHAT_NAMES.has(trimmed.toLowerCase())) return true;
    if (/^EMP\d+$/i.test(trimmed)) return true;
    if (/^\d+$/.test(trimmed)) return true;
    return false;
};

export const chatNamesMatch = (a?: string | null, b?: string | null): boolean =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export const inferChatPeerRole = (opts: {
    chatId?: string;
    type?: 'individual' | 'group';
    data?: any;
}): ChatPeerRole => {
    const { chatId, type, data } = opts;
    if (type === 'group' || String(chatId || '').startsWith('group_') || chatId === 'broadcast_all_school' || data?.type === 'group') {
        return 'group';
    }
    if (data?.peerRole === 'staff' || data?.isStaff || data?.is_staff || data?.emp_id || data?.employeeId || data?.staff_name) {
        return 'staff';
    }
    if (data?.peerRole === 'student' || data?.stud_id || data?.student_name) {
        return 'student';
    }
    return 'student';
};

/**
 * Conversation title is ALWAYS the other person.
 * Never keep the logged-in user's name, and never promote last-sender
 * when that last sender was me.
 */
export const resolveLockedPeerName = (opts: {
    existingName?: string | null;
    proposedName?: string | null;
    roleName?: string | null;
    lastSenderName?: string | null;
    lastSenderIsMe?: boolean;
}): string | undefined => {
    const usable = (name?: string | null) => {
        if (isGenericChatName(name)) return false;
        if (opts.lastSenderIsMe && chatNamesMatch(name, opts.lastSenderName)) return false;
        return true;
    };

    if (usable(opts.existingName)) return opts.existingName!.trim();
    if (usable(opts.roleName)) return opts.roleName!.trim();
    if (usable(opts.proposedName)) return opts.proposedName!.trim();
    if (!opts.lastSenderIsMe && usable(opts.lastSenderName)) return opts.lastSenderName!.trim();
    return undefined;
};

/** Slim, role-scoped blob stored in SecureStore. Never copies staff_name onto student chats. */
export const buildChatCacheData = (opts: {
    chatId: string;
    type: 'individual' | 'group';
    peerRole: ChatPeerRole;
    peerName: string;
    incoming?: any;
    existing?: any;
}) => {
    const src = { ...(opts.existing || {}), ...(opts.incoming || {}) };
    if (opts.peerRole === 'group') {
        return {
            cacheChatId: opts.chatId,
            type: 'group',
            classId: src.classId || src.class_id,
            sectionId: src.sectionId || src.section_id || 'all',
            className: src.className,
            sectionName: src.sectionName,
            isBroadcast: !!src.isBroadcast,
        };
    }
    if (opts.peerRole === 'staff') {
        return {
            cacheChatId: opts.chatId,
            type: 'individual',
            receiverId: src.receiverId || src.emp_id || src.employeeId || opts.chatId,
            emp_id: src.emp_id || src.employeeId || opts.chatId,
            employeeId: src.employeeId || src.emp_id || opts.chatId,
            staff_name: opts.peerName,
            isStaff: true,
        };
    }
    return {
        cacheChatId: opts.chatId,
        type: 'individual',
        receiverId: src.receiverId || src.stud_id || opts.chatId,
        stud_id: src.stud_id || opts.chatId,
        stud_no: src.stud_no || src.studentNumber || src.admission_no,
        student_name: opts.peerName,
        isStaff: false,
    };
};
