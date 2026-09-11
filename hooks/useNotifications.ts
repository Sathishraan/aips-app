import { useQuery } from '@tanstack/react-query';
import { getData } from '../api/generic.api';
import { getSelectedStudentId } from '../api/selectedStudent';

export interface Notification {
    id: string;
    type: 'homework' | 'circular' | 'event' | 'fee' | 'attendance';
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    studentId?: string;
    studentName?: string;
    homeworkId?: string;
}

export const useNotifications = () => {
    const selectedId = getSelectedStudentId();

    return useQuery<Notification[]>({
        queryKey: ['notifications', selectedId],
        queryFn: async () => {
            let response: any;
            try {
                response = await getData<any>('api/notification/list');
            } catch {
                response = await getData<any>('api/student/notifications');
            }

            console.log('--- Notifications GET Raw ---');
            console.log(JSON.stringify(response, null, 2));

            let rawList: any[] = [];

            if (Array.isArray(response)) {
                rawList = response;
            } else if (response?.notifications && Array.isArray(response.notifications)) {
                rawList = response.notifications;
            } else if (response?.data && Array.isArray(response.data)) {
                rawList = response.data;
            } else if (response?.data?.notifications && Array.isArray(response.data.notifications)) {
                rawList = response.data.notifications;
            }

            const mapped = rawList.map((item: any, idx: number) => {
                const title = item.title || item.notification_title || item.notification || 'Notification';
                const message = item.message || item.notification_desc || item.description || item.content || '';
                const lower = `${title} ${message}`.toLowerCase();
                let type: Notification['type'] = (item.type || item.notification_type || 'homework') as Notification['type'];
                if (lower.includes('absent') || lower.includes('late') || lower.includes('attendance')) {
                    type = 'attendance';
                }

                const ref = String(item.stud_id || item.student_id || item.stud_no || item.studentId || '');

                return {
                    id: String(item.id || item.notification_id || idx + 1),
                    type,
                    title,
                    message,
                    time: item.time || item.created_at || item.date || '',
                    isRead: Boolean(item.isRead || item.is_read || item.seen === 1 || item.status === 'read'),
                    studentId: ref || selectedId || undefined,
                    studentName: item.student_name || undefined,
                    homeworkId: item.homework_id || item.homeworkId,
                };
            });

            return mapped;
        },
    });
};
