import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedUrl, getData } from '../api/generic.api';

export interface HomeworkSubject {
    id: string;
    homework_id: string;
    subject_id: string;
    subject_name?: string;
    description: string;
    created_at: string;
    attachments?: HomeworkAttachment[];
}

export interface HomeworkAttachment {
    id: string;
    homework_id: string;
    subject_id: string;
    file_name: string;
    file_path: string;
    file_url?: string;
    file_type: string;
    file_size: string;
    uploaded_at: string;
}

export const resolveHomeworkAttachmentUrl = (file?: {
    file_url?: string;
    file_path?: string;
}): string => {
    const raw = String(file?.file_url || file?.file_path || '').trim();
    if (!raw) return '';
    return getAuthenticatedUrl(raw, { skipStudentScope: true });
};

export interface HomeworkDetail {
    subjects: HomeworkSubject[];
    attachments: HomeworkAttachment[];
    homework?: Record<string, any>;
}

/**
 * Correct: GET api/homework/details/{id}
 * Wrong (404): api/homework/{id}  |  /aips/homework/list (web page, not API)
 */
const fetchHomeworkDetail = async (id: string): Promise<HomeworkDetail> => {
    if (!id) {
        return { subjects: [], attachments: [] };
    }

    const response = await getData<any>(`api/homework/details/${id}`);
    const data = response?.data && (response.data.subjects || response.data.attachments)
        ? response.data
        : response;

    const subjects = (data?.subjects || []).map((s: any) => ({
        ...s,
        subject_name: s.subject_name || s.subject || s.subject_id,
        attachments: s.attachments || [],
    }));

    const nestedAttachments = subjects.flatMap((s: any) =>
        (s.attachments || []).map((a: any) => ({
            ...a,
            subject_id: a.subject_id ?? s.subject_id,
        }))
    );

    return {
        subjects,
        attachments: (data?.attachments && data.attachments.length > 0)
            ? data.attachments
            : nestedAttachments,
        homework: data?.homework || undefined,
    };
};

export const useHomeworkDetail = (id: string) => {
    return useQuery({
        queryKey: ['homeworkDetail', id],
        queryFn: () => fetchHomeworkDetail(id),
        enabled: !!id,
        retry: 1,
    });
};
