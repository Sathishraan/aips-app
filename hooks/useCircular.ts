import { useQuery } from '@tanstack/react-query';
import { getData } from '../api/generic.api';
import { CircularItem } from '../types/circular.type';

export const useCirculars = () => {
    return useQuery<CircularItem[]>({
        queryKey: ['circulars', 'list'],
        queryFn: async () => {
            try {
                const response = await getData<any>('api/circular/list');
                let list: CircularItem[] = [];
                if (response && response.circulars && Array.isArray(response.circulars)) {
                    list = response.circulars;
                } else if (response && response.data && Array.isArray(response.data)) {
                    list = response.data;
                } else if (Array.isArray(response)) {
                    list = response;
                }
                return list;
            } catch (error) {
                console.log('--- Circular List fetch failed ---', error);
                return [];
            }
        },
    });
};
