import { useQuery } from '@tanstack/react-query';
import { getData } from '../api/generic.api';
import { ResultDetail } from '../types/results.type';

/**
 * Correct backend routes (ApiRoutes.php):
 * - GET api/exam/result/list
 * - GET api/exam/result/details/{id}
 * Wrong (404): api/student/results
 */
const asList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.subjects)) return response.subjects;
  return [];
};

export const useResultList = () => {
  return useQuery<any[]>({
    queryKey: ['results', 'list'],
    queryFn: async () => {
      try {
        const response = await getData<any>('api/exam/result/list');
        return asList(response);
      } catch (error) {
        console.log('--- Result List fetch failed ---', error);
        return [];
      }
    },
  });
};

export const useResultDetails = (examId: number | string | null | undefined) => {
  return useQuery<ResultDetail[]>({
    queryKey: ['results', 'details', examId],
    queryFn: async () => {
      if (!examId && examId !== 0) return [];

      try {
        const response = await getData<any>(`api/exam/result/details/${examId}`);
        return asList(response);
      } catch (error) {
        console.log('--- Result Details failed ---', error);
        return [];
      }
    },
    enabled: examId !== null && examId !== undefined && examId !== '',
  });
};
