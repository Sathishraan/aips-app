import { useQuery } from '@tanstack/react-query';
import { getData } from '../api/generic.api';
import { getSelectedStudentId } from '../api/selectedStudent';

export interface Homework {
    id: string;
    subject: string;
    title: string;
    description: string;
    dueDate: string;
    status: string;
    color?: string[];
    icon?: string;
    // Dynamic fields from API
    subject_name?: string;
    homework_date?: string;
    submit_date?: string;
    homework_title?: string;
    homework_description?: string;
    [key: string]: any;
}


/**
 * Student homework list — same backend route as staff list.
 * Correct: GET api/homework/list
 * Wrong (404): api/student/homework/list
 */
const fetchHomeworkList = async (): Promise<Homework[]> => {
    try {
        const response = await getData<any>('api/homework/list');

        console.log('--- Homework List Raw Response ---');
        console.log(JSON.stringify(response, null, 2));

        let list: any[] = [];
        if (Array.isArray(response)) {
            list = response;
        } else if (response?.data && Array.isArray(response.data)) {
            list = response.data;
        } else if (response?.homework_list && Array.isArray(response.homework_list)) {
            list = response.homework_list;
        } else if (response?.data?.homework_list && Array.isArray(response.data.homework_list)) {
            list = response.data.homework_list;
        }

        const mapped = list.map((item: any, idx: number) => {
            const subjectName = item.subject_name || item.subject || item.subject_id || 'Subject';
            const title = item.title || item.homework_title || 'Homework';
            const description =
                item.description ||
                item.homework_description ||
                item.subject_description ||
                '';
            const dueDate =
                item.submission_date ||
                item.submit_date ||
                item.due_date ||
                item.dueDate ||
                '';

            return {
                ...item,
                id: String(item.id || item.homework_id || idx + 1),
                subject: subjectName,
                subject_name: subjectName,
                title,
                homework_title: title,
                description,
                homework_description: description,
                dueDate,
                submit_date: dueDate,
                submission_date: item.submission_date || dueDate,
                homework_date: item.homework_date || '',
                status: item.submission_status || item.status || 'pending',
            };
        });


        console.log(`--- Homework List Mapped (${mapped.length} items) ---`);
        console.log(JSON.stringify(mapped, null, 2));

        return mapped;
    } catch (error) {
        console.log('--- Homework List fetch failed ---', error);
        return [];
    }
};

export const useHomework = (enabled = true) => {
    const selectedId = getSelectedStudentId();
    return useQuery({
        queryKey: ['homeworkList', selectedId],
        queryFn: fetchHomeworkList,
        staleTime: 1 * 60 * 1000,
        enabled,
    });
};
