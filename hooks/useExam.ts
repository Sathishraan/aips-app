import { useQuery } from '@tanstack/react-query';
import { getData } from '../api/generic.api';
import { ExamListResponse } from '../types/exams.type';

export const useExamList = () => {
    return useQuery<ExamListResponse>({
        queryKey: ['exams', 'list'],
        queryFn: async () => {
            console.log('📡 [useExamList] Fetching exam list from api/exam/list');
            try {
                const response = await getData<any>('api/exam/list');
                console.log('📥 [useExamList] Raw Response:', JSON.stringify(response, null, 2));

                let result: ExamListResponse = {};
                if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                    result = response.data;
                } else if (response && typeof response === 'object' && !Array.isArray(response)) {
                    result = response;
                }


                const keys = Object.keys(result);
                console.log(`📊 [useExamList] Exam Categories Found: ${keys.length} (${keys.join(', ')})`);
                return result;
            } catch (error) {
                console.error('❌ [useExamList] Fetch Failed:', error);
                return {};
            }
        },
    });
};
