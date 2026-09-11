import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getAuthenticatedUrl } from '../api/generic.api';
import { getAuthToken } from '../api/base';
import { GalleryItem } from '../types/gallery.type';
import { useUser, isStudent } from './useUser';

const norm = (value?: string | null) =>
    (value || '').toString().trim().toLowerCase();

const normClass = (value?: string | null) =>
    norm(value).replace(/\s*(st|nd|rd|th)\s*$/, '').replace(/^class\s+/, '');

const normSection = (value?: string | null) =>
    norm(value).replace(/^section\s+/, '');

/** Match gallery item class/section to the logged-in student. */
const matchesStudentClass = (
    item: GalleryItem,
    studentClass: string,
    studentSection: string
): boolean => {
    const itemClasses = [item.class_id, item.gallery_class]
        .map(normClass)
        .filter(Boolean);
    const itemSections = [item.section_id, item.gallery_section]
        .map(normSection)
        .filter(Boolean);
    const cls = normClass(studentClass);
    const sec = normSection(studentSection);

    // Empty, zero, or All means school-wide content.
    if (itemClasses.length === 0 || itemClasses.some((value) => value === '0' || value === 'all')) {
        return true;
    }

    if (!itemClasses.includes(cls)) return false;

    // Empty, zero, or All means the whole class can see it.
    if (
        itemSections.length === 0 ||
        itemSections.some((value) => value === '0' || value === 'all')
    ) {
        return true;
    }

    return !sec || itemSections.includes(sec);
};

export const useGallery = () => {
    const { user, isLoading: userLoading } = useUser();
    const studentClass = isStudent(user) ? user.class : '';
    const studentSection = isStudent(user) ? user.section : '';
    const isStudentUser = isStudent(user);

    return useQuery<GalleryItem[]>({
        queryKey: ['gallery', 'list-v2', studentClass, studentSection],
        enabled: !userLoading,
        queryFn: async () => {
            try {
                const fullUrl = getAuthenticatedUrl('api/gallery/list');
                const token = getAuthToken();

                const response = await axios.get(fullUrl, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                        'X-Authorization': `Bearer ${token}`,
                        auth: token || '',
                    },
                    timeout: 10000,
                });

                console.log('--- Gallery List Raw Response ---');
                console.log(JSON.stringify(response.data, null, 2));
                if (isStudentUser) {
                    console.log('--- Gallery Student Class Filter ---', {
                        class_id: studentClass,
                        section_id: studentSection,
                    });
                }

                let list: GalleryItem[] = [];
                if (response.data?.gallery && Array.isArray(response.data.gallery)) {
                    list = response.data.gallery;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    list = response.data.data;
                } else if (Array.isArray(response.data)) {
                    list = response.data;
                }

                list = list.map((item: any) => ({
                    ...item,
                    image_path: item.image_url || item.image_path || '',
                }));


                // Client-side filter for students (extra safety if API returns all)
                if (isStudentUser && studentClass) {
                    const before = list.length;
                    list = list.filter((item) =>
                        matchesStudentClass(item, studentClass, studentSection)
                    );
                    console.log(
                        `--- Gallery filtered for class=${studentClass} section=${studentSection}: ${before} → ${list.length} ---`
                    );
                }

                console.log(`--- Gallery List Parsed (${list.length} items) ---`);
                return list;
            } catch (error) {
                console.log('--- Gallery List fetch failed ---', error);
                return [];
            }
        },
    });
};
