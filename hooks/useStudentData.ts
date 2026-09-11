import { useQuery, useMutation } from '@tanstack/react-query';
import api, { nodeApi, getAuthToken } from '../api/base';
import { getData, postData } from '../api/generic.api';
import { ClassItem, SectionItem, StudentItem, ChatMessage } from '../types/chat.type';

export const useMetadata = () => {
    return useQuery<{ classes: ClassItem[], sections: SectionItem[] }>({
        queryKey: ['communicationMetadata'],
        queryFn: async () => {
            const response = await getData<any>('api/communication/add');
            console.log('Metadata Raw:', response);

            const classData = response?.data?.class || [];
            const sectionData = response?.data?.section || [];

            return {
                classes: Array.isArray(classData) ? classData.map((c: string) => ({
                    class_id: c,
                    class_name: c
                })) : [],
                sections: Array.isArray(sectionData) ? sectionData.map((s: string) => ({
                    section_id: s,
                    section_name: s
                })) : []
            };
        }
    });
};

export const useStudents = (classId?: string | null, sectionId?: string | null) => {
    console.log(`🔍 [useStudents] Hook Rendering. Class: ${classId || 'ALL'}, Sect: ${sectionId || 'ALL'}`);
    return useQuery<StudentItem[]>({
        queryKey: ['students', classId, sectionId],
        queryFn: async () => {
            console.log('📡 [useStudents] FETCH START for:', { classId, sectionId });
            try {
                let url = 'api/students/list';
                if (classId && sectionId) {
                    url = `api/students/list/${classId}/${sectionId}`;
                } else if (classId) {
                    url = `api/students/list/${classId}`;
                }

                // Use getData wrapper which handles token query parameters automatically
                const responseData = await getData<any>(url);

                const list = Array.isArray(responseData) ? responseData : (responseData.data || []);
                console.log(`📥 [useStudents] Found ${list.length} students`);
                return list;
            } catch (err: any) {
                console.error('❌ [useStudents] Fetch failed:', err.message);
                return [];
            }
        },
        enabled: true,
        staleTime: 5000
    });
};

export const useEmployees = (enabled = true) => {
    return useQuery<any[]>({
        queryKey: ['employees'],
        enabled,
        queryFn: async () => {
            try {
                const responseData = await getData<any>('api/employees/list');
                const list = Array.isArray(responseData) ? responseData : (responseData?.data || []);
                console.log(`📥 [useEmployees] Found ${list.length} staff`);
                return list;
            } catch (err: any) {
                console.error('❌ [useEmployees] Fetch failed:', err.message);
                return [];
            }
        },
        staleTime: 15000,
    });
};

export const useSendCommunication = () => {
    return useMutation({
        mutationFn: async (data: any) => {
            const authToken = getAuthToken();
            // Check if we need to send as FormData (for files)
            const isFile = data.attachment || data.voiceNote;

            // Map type to integer: Individual = 1, Group = 2
            const mappedType = data.type === 'group' ? 2 : 1;

            try {
                if (data.type === 'group') {
                    console.log('📤 [Group Message] Sending Payload:', JSON.stringify({ ...data, type: mappedType }, null, 2));
                }

                if (isFile) {
                    const formData = new FormData();
                    if (authToken) {
                        formData.append('token', authToken);
                        formData.append('auth', authToken);
                    }
                    formData.append('message', data.message || '');
                    formData.append('receiverId', data.receiverId || '');
                    formData.append('chatId', data.chatId || '');
                    formData.append('type', mappedType.toString());
                    formData.append('clientId', data.clientId || '');
                    if (data.sender_name) formData.append('sender_name', data.sender_name);
                    if (data.receiver_name) formData.append('receiver_name', data.receiver_name);
                    if (data.stud_id) formData.append('stud_id', String(data.stud_id));
                    if (data.stud_no) formData.append('stud_no', String(data.stud_no));
                    if (data.emp_id) formData.append('emp_id', String(data.emp_id));
                    if (data.receiver_role) formData.append('receiver_role', String(data.receiver_role));
                    if (data.isStaffChat) formData.append('isStaffChat', '1');

                    if (data.class_id) formData.append('class_id', data.class_id);
                    if (data.section_id) formData.append('section_id', data.section_id);

                    if (data.attachment) {
                        const uri = data.attachment;
                        const filename = uri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        let mimeType = match ? `image/${match[1]}` : `image/jpeg`;

                        if (filename.endsWith('.pdf')) mimeType = 'application/pdf';
                        else if (filename.endsWith('.doc')) mimeType = 'application/msword';
                        else if (filename.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                        else if (filename.endsWith('.xls')) mimeType = 'application/vnd.ms-excel';
                        else if (filename.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                        else if (filename.endsWith('.mp4')) mimeType = 'video/mp4';

                        // @ts-ignore
                        formData.append('attachment', {
                            uri: uri,
                            name: filename || 'file.dat',
                            type: mimeType
                        });
                    }

                    if (data.voiceNote) {
                        // @ts-ignore
                        formData.append('voiceNote', {
                            uri: data.voiceNote,
                            name: 'voicenote.m4a',
                            type: 'audio/m4a'
                        });
                    }

                    try {
                        const response = await nodeApi.post('api/communication/sendMessage', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        return response.data;
                    } catch (nodeErr: any) {
                        console.warn('⚠️ [nodeApi] Network error on file upload, falling back to PHP backend:', nodeErr.message);
                        return await postData<any>('api/communication/new/message', formData);
                    }

                } else {
                    console.log('[SEND MESSAGE] MESSAGE CONTRACT:', {
                        senderId: 'authenticated-by-backend',
                        receiverId: data.receiverId,
                        senderName: 'resolved-by-backend',
                        clientId: data.clientId,
                        type: mappedType,
                        messageLength: (data.message || '').length
                    });
                    console.log('📤 [SEND MESSAGE] API Raw Payload:', JSON.stringify({
                        ...data,
                        type: mappedType,
                        token: authToken ? 'provided' : 'missing'
                    }, null, 2));

                    try {
                        const response = await nodeApi.post('api/communication/sendMessage', {
                            ...data,
                            type: mappedType,
                            token: authToken,
                            auth: authToken
                        });
                        return response.data;
                    } catch (nodeErr: any) {
                        console.warn('⚠️ [nodeApi] Network error on JSON send, falling back to PHP backend:', nodeErr.message);
                        return await postData<any>('api/communication/new/chat', {
                            receiverId: data.receiverId,
                            chatId: data.chatId,
                            message: data.message
                        });
                    }
                }
            } catch (error: any) {
                console.error('❌ [Send Communication] Error:', {
                    message: error.message,
                    response: error.response?.data,
                    payload: { ...data, type: mappedType }
                });
                throw error;
            }
        },
    });
};

export const useMessages = (senderId: string, receiverId: string, peerRole?: 'staff' | 'student') => {
    return useQuery<ChatMessage[]>({
        queryKey: ['messages', senderId, receiverId, peerRole || 'auto'],
        queryFn: async () => {
            console.log(`📡 [FRONTEND] SOLO Fetching messages: Sender=${senderId}, Receiver=${receiverId} peer=${peerRole || 'auto'}`);
            const authToken = getAuthToken();
            if (!senderId || !receiverId) return [];
            try {
                const response = await nodeApi.get('api/communication/getMessages', {
                    params: {
                        senderId,
                        receiverId,
                        token: authToken,
                        auth: authToken,
                        ...(peerRole ? { receiverRole: peerRole, peerRole } : {}),
                    },
                });
                console.log(`📥 [FRONTEND] SOLO Messages Response:`, response.data);
                return response.data.data || [];
            } catch (error: any) {
                console.error(`❌ [FRONTEND] SOLO Fetch Error:`, error.message);
                return [];
            }
        },
        enabled: !!senderId && !!receiverId,
        staleTime: 0,
        refetchOnMount: 'always',
    });
};

/**
 * useAllIndividualMessages - Fetch ALL private messages for a user (to populate chat list)
 */
export const useAllIndividualMessages = (userId: string) => {
    return useQuery<ChatMessage[]>({
        queryKey: ['allIndividualMessages', userId],
        queryFn: async () => {
            console.log(`📡 [useAllIndividualMessages] START - Fetching for: ${userId}`);
            const authToken = getAuthToken();
            if (!userId) {
                console.warn('⚠️ [useAllIndividualMessages] No userId provided!');
                return [];
            }
            try {
                const params = { senderId: userId, all: true, token: authToken, auth: authToken };
                console.log(`📡 [useAllIndividualMessages] GET api/communication/getMessages with params:`, JSON.stringify(params));

                const response = await nodeApi.get('api/communication/getMessages', { params });

                console.log(`📥 [useAllIndividualMessages] RESPONSE for ${userId}:`, {
                    status: response.status,
                    dataCount: response.data?.data?.length || 0,
                    success: response.data?.success,
                    firstItem: response.data?.data?.[0] ? JSON.stringify(response.data.data[0]).substring(0, 100) : 'none'
                });

                return response.data.data || [];
            } catch (error: any) {
                console.error(`❌ [useAllIndividualMessages] CRITICAL ERROR:`, {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                return [];
            }
        },
        enabled: !!userId,
        staleTime: 5000, // 5 seconds stability
        gcTime: 30000,
        refetchOnMount: 'always'
    });
};

/**
 * useGroupMessages - Fetch messages for a specific group (class/section)
 * 
 * @param classId - The class ID (e.g., "10", "9", "12")
 * @param sectionId - The section ID (e.g., "A", "B", or "all")
 * @returns Query result with group messages
 * 
 * @example
 * const { data: groupMessages, isLoading } = useGroupMessages("10", "A");
 */
export const useGroupMessages = (classId?: string, sectionId?: string) => {
    return useQuery<ChatMessage[]>({
        queryKey: ['groupMessages', classId, sectionId],
        queryFn: async () => {
            console.log('🔍 [DEBUG-FRONTEND] useGroupMessages called with:', { classId, sectionId });

            if (!classId) {
                console.warn('⚠️ [DEBUG-FRONTEND] No classId provided for sync');
                return [];
            }

            try {
                const authToken = getAuthToken();
                const url = 'api/communication/getGroupMessages';
                const groupIdentifier = `G_${classId}_${sectionId || 'all'}`;
                const params = {
                    classId,
                    sectionId: sectionId || 'all',
                    groupIdentifier,
                    groupId: groupIdentifier,
                    group_id: groupIdentifier,
                    token: authToken,
                    auth: authToken
                };

                console.log(`📡 [DEBUG-FRONTEND] Fetching from ${url} with params:`, params);

                const response = await nodeApi.get(url, { params });

                console.log('📥 [DEBUG-FRONTEND] Response received:', {
                    status: response.status,
                    dataCount: response.data?.data?.length || 0,
                    raw: response.data
                });

                const messages = response.data.data || [];

                if (messages.length === 0) {
                    console.log('ℹ️ [DEBUG-FRONTEND] No messages found for this group on server.');
                }

                return messages.map((m: any) => ({
                    id: m.id?.toString() || Math.random().toString(),
                    message: m.message || m.content,
                    senderId: m.senderId?.toString() || m.sender_id?.toString(),
                    sender_name: m.sender_name || m.senderName || 'Staff',
                    receiverId: m.receiverId || m.groupId,
                    type: m.type || (m.isPoll ? 'poll' : 'group'),
                    isPoll: !!m.isPoll,
                    pollData: m.pollData,
                    isGroup: true,
                    classId: m.classId || classId,
                    sectionId: m.sectionId || sectionId,
                    groupId: m.groupId || `G_${classId}_${sectionId}`,
                    created_at: m.created_at || m.timestamp || m.dateTime,
                    dateTime: m.created_at || m.timestamp || m.dateTime,
                    isAttachment: m.isAttachment || false
                }));
            } catch (error: any) {
                console.error('❌ [DEBUG-FRONTEND] Fetch failed:', {
                    message: error.message,
                    response: error.response?.data
                });
                throw error;
            }
        },
        enabled: !!classId,
        staleTime: 5000,
    });
};
/**
 * useDeleteMessage - Staff delete-for-everyone (unsends for sender + receiver)
 * Backend: POST api/communication/deleteMessage
 */
export const useDeleteMessage = () => {
    return useMutation({
        mutationFn: async (data: {
            messageId: string | number;
            clientId?: string;
            chatId?: string | null;
            receiverId?: string | number | null;
            type?: 'individual' | 'group' | 1 | 2;
            class_id?: string;
            section_id?: string;
        }) => {
            const authToken = getAuthToken();
            const mappedType =
                data.type === 'group' || data.type === 2 ? 2 : 1;

            const payload = {
                messageId: data.messageId,
                id: data.messageId,
                clientId: data.clientId,
                chatId: data.chatId || null,
                receiverId: data.receiverId || null,
                type: mappedType,
                class_id: data.class_id,
                section_id: data.section_id,
                deleteForEveryone: true,
                token: authToken,
                auth: authToken,
            };

            console.log('🗑️ [Delete Message] Payload:', payload);

            try {
                const response = await nodeApi.post(
                    'api/communication/deleteMessage',
                    payload
                );
                return response.data;
            } catch (nodeErr: any) {
                // Fallback path naming variants some backends use
                const status = nodeErr?.response?.status;
                if (status === 404) {
                    try {
                        const response = await nodeApi.post(
                            'api/communication/delete-message',
                            payload
                        );
                        return response.data;
                    } catch (e2: any) {
                        console.warn(
                            '⚠️ [Delete Message] Node endpoints missing, trying PHP fallback'
                        );
                        return await postData<any>(
                            'api/communication/delete/message',
                            payload
                        );
                    }
                }
                throw nodeErr;
            }
        },
    });
};

/**
 * useCreatePoll - Create a new poll for a group
 */
export const useCreatePoll = () => {
    return useMutation({
        mutationFn: async (data: { question: string, options: string[], classId: string, sectionId?: string }) => {
            const authToken = getAuthToken();
            const response = await nodeApi.post('api/communication/create-poll', {
                ...data,
                token: authToken,
                auth: authToken
            });
            return response.data;
        }
    });
};

/**
 * useVotePoll - Cast a vote in a poll
 */
export const useVotePoll = () => {
    return useMutation({
        mutationFn: async (data: { pollId: string | number, optionId: string | number }) => {
            const authToken = getAuthToken();
            const response = await nodeApi.post('api/communication/vote-poll', {
                ...data,
                token: authToken,
                auth: authToken
            });
            return response.data;
        }
    });
};
