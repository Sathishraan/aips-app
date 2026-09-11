import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getData, postData, getAuthenticatedUrl } from '../api/generic.api';
import { LeaveItem, LeaveRequestPayload } from '../types/leave.type';

export const useLeaveList = () => {
    return useQuery<LeaveItem[]>({
        queryKey: ['leave', 'list'],
        queryFn: async () => {
            const response = await getData<any>('api/leave/list');
            let data: LeaveItem[] = [];
            if (response?.data && Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response)) {
                data = response;
            }

            return data.map(item => ({
                ...item,
                attachmentFullUrl: item.attachment ? getAuthenticatedUrl(item.attachment) : undefined
            }));
        },
    });
};

export const useApplyLeave = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: LeaveRequestPayload) => {
         console.log('--- Leave Request Payload ---');

            const formData = new FormData();
            // Backend expects camelCase field names (LeaveController::getPost)
            formData.append('fromDate', payload.from_date);
            formData.append('toDate', payload.to_date);
            formData.append('reason', payload.reason?.trim() || 'Leave');

            const formFields: Record<string, any> = {
                fromDate: payload.from_date,
                toDate: payload.to_date,
                reason: payload.reason?.trim() || 'Leave',
            };

            if (payload.attachment && payload.attachment.uri) {
                const uri = payload.attachment.uri;
                const fileName = payload.attachment.name || uri.split('/').pop() || 'attachment.jpg';
                const fileType = (fileName.split('.').pop() || 'jpg').toLowerCase();
                const mimeType =
                    payload.attachment.mimeType ||
                    (fileType === 'pdf' ? 'application/pdf' : `image/${fileType === 'jpg' ? 'jpeg' : fileType}`);

                formData.append('attachment', {
                    uri,
                    name: fileName,
                    type: mimeType,
                } as any);
                formFields.attachment = { uri, name: fileName, type: mimeType };
            }

            console.log('--- Leave Request FormData (POST body) ---');
            console.log(JSON.stringify(formFields, null, 2));
            console.log('Endpoint: POST api/leave/application/save');
            console.log('Content-Type: multipart/form-data');

            try {
                const result = await postData<any>('api/leave/application/save', formData);
                console.log('--- Leave Request POST Response ---');
                console.log(JSON.stringify(result, null, 2));
                if (result?.status === false) {
                    throw new Error(result?.message || 'Leave submit failed');
                }





































                return result;
            } catch (err: any) {
                console.error('--- Leave Request POST Failed ---');
                console.error(err?.message || err);
                if (err.response) {
                    console.error('Server response:', JSON.stringify(err.response.data, null, 2));
                }
                throw err;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave', 'list'] });
        },
    });
};

export const useRevokeLeave = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (leaveId: string) => {
            const result = await postData<any>('api/leave/revoke', { id: leaveId });
            if (result?.status === false || result?.status === 0) {
                throw new Error(result?.msg || result?.message || 'Could not revoke leave');
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave', 'list'] });
        },
    });
};
