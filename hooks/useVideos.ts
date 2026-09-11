import { useQuery } from '@tanstack/react-query';
import { getData, getAuthenticatedUrl } from '../api/generic.api';
import { Video } from '../types/videos.type';

export const useVideos = () => {
    return useQuery<Video[]>({
        queryKey: ['videos'],
        queryFn: async () => {
            try {
                const response = await getData<any>('api/video/list');
                let rawVideos: any[] = [];
                if (response?.videos && Array.isArray(response.videos)) rawVideos = response.videos;
                else if (response?.data && Array.isArray(response.data)) rawVideos = response.data;
                else if (Array.isArray(response)) rawVideos = response;


                return rawVideos.map((item: any, idx: number) => {
                    const rawUrl = item.video_link || item.video_url || item.url || item.link || '';
                    const isExternal = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
                    return {
                        id: item.id || item.video_id || String(idx),
                        title: item.title || item.video_name || item.video_title || 'Untitled Video',
                        description: item.description || item.video_description || '',
                        video_url: isExternal ? rawUrl : (rawUrl ? getAuthenticatedUrl(rawUrl) : ''),
                        thumbnail: item.thumbnail || item.video_thumbnail ? getAuthenticatedUrl(item.thumbnail || item.video_thumbnail) : undefined,
                        created_at: item.created_at || item.publish_date || item.academic_year,
                    };
                });
            } catch (error) {
                console.log('--- Videos List fetch failed ---', error);
                return [];
            }
        },
    });
};
