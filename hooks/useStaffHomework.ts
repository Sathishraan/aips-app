// hooks/useStaffHomework.ts

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getData, postData, updateData, getAuthenticatedUrl } from '../api/generic.api';
import { canonicalizeSection } from './useStaffErp';
import { materializeHomeworkFile } from '../utils/homeworkImage';
import {
    CreateHomeworkRequest,
    SubjectHomeworkData,
    HomeworkResponse,
    ApiError,
    HomeworkFormData,
    SubjectType,
    ImageFile,
    SubmissionMethodType
} from '../types/staffHomework.type';

/* =============================
   API ENDPOINTS
============================= */

const API = {
    LIST: 'api/homework/list',
    DETAILS: (id: string) => `api/homework/details/${id}`,
    CREATE: 'api/homework/create',
    UPDATE: (id: string) => `api/homework/details/${id}`,
    DELETE: 'api/staff/homework/delete',
    SUBJECTS: 'api/subject/list'
};

/* =============================
   QUERY KEYS
============================= */

const homeworkKeys = {
    all: ['staff-homework'] as const,
    list: (params?: any) => [...homeworkKeys.all, 'list', JSON.stringify(params)],
    details: (id: string) => [...homeworkKeys.all, 'details', id]
};

/* =============================
   GET HOMEWORK LIST
============================ */

export const useStaffHomeworkList = (params?: any) => {
    return useQuery({
        queryKey: homeworkKeys.list(params),
        queryFn: async () => {
            const url = API.LIST;
            const fullUrl = getAuthenticatedUrl(url, { skipStudentScope: true });
            console.log(`📡 [useStaffHomeworkList] Fetching from: ${fullUrl}`);

            try {
                const response = await getData<any>(url, { skipStudentScope: true });
                console.log(`📥 [useStaffHomeworkList] Response received:`, response);

                // Handle various response formats
                if (Array.isArray(response)) return response;
                if (response?.data && Array.isArray(response.data)) return response.data;
                if (response?.homework_list) return response.homework_list;

                return [];
            } catch (error) {
                console.error(`❌ [useStaffHomeworkList] Fetch failed:`, error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000
    });
};


/* =============================
   GET SUBJECT LIST
============================= */

export const useSubjectList = () => {
    return useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const url = API.SUBJECTS;
            const fullUrl = getAuthenticatedUrl(url);
            console.log(`📡 [useSubjectList] Fetching from: ${fullUrl}`);

            try {
                const response = await getData<any>(url);
                console.log(`📥 [useSubjectList] Response received:`, response);

                // Handle various response formats
                let subjects = [];
                if (Array.isArray(response)) {
                    subjects = response;
                } else if (response?.data && Array.isArray(response.data)) {
                    subjects = response.data;
                } else if (response?.subjects && Array.isArray(response.subjects)) {
                    subjects = response.subjects;
                }

                // Map to subject names (assuming API returns objects with 'name' or 'subject_name' field)
                const subjectNames = subjects.map((subject: any) => {
                    if (typeof subject === 'string') return subject;
                    return subject.name || subject.subject_name || subject.title || '';
                }).filter((name: string) => name.trim() !== '');

                console.log(`✅ [useSubjectList] Parsed ${subjectNames.length} subjects:`, subjectNames);
                return subjectNames;
            } catch (error) {
                console.error(`❌ [useSubjectList] Fetch failed:`, error);
                // Return empty array on error instead of throwing
                return [];
            }
        },
        staleTime: 30 * 60 * 1000, // Cache for 30 minutes
        retry: 2
    });
};

/* =============================
   GET HOMEWORK DETAILS
============================= */

export const useStaffHomeworkDetails = (homeworkId: string) => {
    return useQuery({
        queryKey: homeworkKeys.details(homeworkId),
        queryFn: async () => {
            const url = API.DETAILS(homeworkId);
            const fullUrl = getAuthenticatedUrl(url);
            console.log(`📡 [useStaffHomeworkDetails] Fetching ID ${homeworkId} from: ${fullUrl}`);
            return getData(url);
        },
        enabled: !!homeworkId
    });
};

/* =============================
   CREATE HOMEWORK
============================= */

export const useCreateStaffHomework = () => {
    const queryClient = useQueryClient();

    return useMutation<
        HomeworkResponse,
        ApiError,
        {
            formData: CreateHomeworkRequest;
            subjectHomeworkData: SubjectHomeworkData;
        }
    >({
        mutationFn: async ({ formData, subjectHomeworkData }) => {
            const fullUrl = getAuthenticatedUrl(API.CREATE);
            console.log(`🚀 [useCreateStaffHomework] Sending request to: ${fullUrl}`);

            const data = new FormData();
            const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

            const classId = String(formData.class || '');
            const sectionId = canonicalizeSection(String(formData.section || '')) || String(formData.section || '');
            const dueDate = String(formData.submissionDate || '').split('T')[0].split(' ')[0];

            // 1. Core Fields
            data.append('title', formData.title);
            data.append('class_id', classId);
            data.append('section_id', sectionId);
            data.append('submission_date', dueDate);
            data.append('status', '1');
            data.append('homework_date', today);
            data.append('priority', 'medium');
            data.append('class', classId);
            data.append('section', sectionId);

            // 3. Submission Methods (Backend expects array)
            const selectedMethods = Object.entries(formData.submissionMethods)
                .filter(([_, active]) => active)
                .map(([name]) => name === 'mobileApp' ? 'mobile_app' : name);

            selectedMethods.forEach((method, index) => {
                data.append(`submission_methods[${index}]`, method);
            });
            data.append('submission_methods', JSON.stringify(selectedMethods));

            const descriptions: Record<string, string> = {};

            for (let index = 0; index < formData.subjects.length; index++) {
                const subjectId = formData.subjects[index];
                data.append(`subject_ids[${index}]`, subjectId);

                const description = subjectHomeworkData[subjectId]?.description || '';
                descriptions[subjectId] = description;
                data.append(`descriptions[${subjectId}]`, description);

                const images = subjectHomeworkData[subjectId]?.images || [];
                for (const image of images) {
                    const local = image.base64
                        ? image
                        : await materializeHomeworkFile(image);
                    if (!local?.base64) {
                        throw new Error('Could not read an attachment. Try another image or PDF.');
                    }
                    data.append('files_b64[]', local.base64);
                    data.append('image_subjects[]', subjectId);
                    data.append('file_names[]', local.name);
                    data.append('file_mimes[]', local.type || 'application/octet-stream');
                }
            }

            data.append('subject_ids', JSON.stringify(formData.subjects));
            data.append('descriptions_json', JSON.stringify(descriptions));

            const result = await postData<any>(API.CREATE, data);
            if (result && (result.status === 'error' || result.status === 0 || result.success === false)) {
                throw new Error(result.message || result.error || 'Failed to save homework');
            }
            return result;
        },

        onSuccess: () => {
            console.log('🔄 [useCreateStaffHomework] Invaliding homework queries...');
            queryClient.invalidateQueries({ queryKey: homeworkKeys.all });
            queryClient.invalidateQueries({ queryKey: ['homeworkList'] });
            queryClient.invalidateQueries({ queryKey: ['homeworkDetail'] });
        },
        onError: (error: any) => {
            console.error('❌ [useCreateStaffHomework] Mutation failed:', error);
        }
    });
};

/* =============================
   UPDATE HOMEWORK
============================= */

export const useUpdateStaffHomework = () => {
    const queryClient = useQueryClient();

    return useMutation<
        HomeworkResponse,
        ApiError,
        {
            homeworkId: string;
            formData: CreateHomeworkRequest;
            subjectHomeworkData: SubjectHomeworkData;
        }
    >({
        mutationFn: async ({ homeworkId, formData }) => {
            const url = API.UPDATE(homeworkId);
            const fullUrl = getAuthenticatedUrl(url);
            console.log(`🚀 [useUpdateStaffHomework] Updating ID ${homeworkId} at: ${fullUrl}`);
            console.log('📦 [useUpdateStaffHomework] Payload:', formData);

            try {
                const result = await updateData<HomeworkResponse, any>(
                    url,
                    { ...formData, status: '1' }
                );
                console.log('✅ [useUpdateStaffHomework] Update successful:', result);
                return result;
            } catch (error: any) {
                console.error('❌ [useUpdateStaffHomework] API Error:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    url: fullUrl
                });
                throw error;
            }
        },

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.all });
            queryClient.invalidateQueries({
                queryKey: homeworkKeys.details(variables.homeworkId)
            });
        },
        onError: (error: any) => {
            console.error('❌ [useUpdateStaffHomework] Mutation failed:', error);
        }
    });
};

/* =============================
   DELETE HOMEWORK
============================= */

export const useDeleteStaffHomework = () => {
    const queryClient = useQueryClient();

    return useMutation<any, ApiError, string>({
        mutationFn: async (homeworkId) => {
            const fullUrl = getAuthenticatedUrl(API.DELETE);
            console.log(`🚀 [useDeleteStaffHomework] Deleting ID ${homeworkId} via: ${fullUrl}`);
            try {
                const result = await postData(API.DELETE, { homeworkId });
                console.log('✅ [useDeleteStaffHomework] Delete successful:', result);
                return result;
            } catch (error: any) {
                console.error('❌ [useDeleteStaffHomework] API Error:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    url: fullUrl
                });
                throw error;
            }
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.all });
        },
        onError: (error: any) => {
            console.error('❌ [useDeleteStaffHomework] Mutation failed:', error);
        }
    });
};

/* =============================
   HOMEWORK FORM HOOK
============================= */

export const useHomeworkForm = () => {
    const [formData, setFormData] = useState<HomeworkFormData>({
        title: '',
        submissionDate: '',
        class: '',
        section: '',
        subjects: [],
        submissionMethods: {
            whatsapp: false,
            email: false,
            mobileApp: true,
        },
    });

    const [subjectHomework, setSubjectHomework] = useState<SubjectHomeworkData>({});

    const updateField = <K extends keyof HomeworkFormData>(
        field: K,
        value: HomeworkFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleSubject = (subject: SubjectType) => {
        setFormData((prev) => {
            const exists = prev.subjects.includes(subject);
            const subjects = exists
                ? prev.subjects.filter((s) => s !== subject)
                : [...prev.subjects, subject];
            return { ...prev, subjects };
        });

        setSubjectHomework((prev) => {
            if (prev[subject]) {
                const { [subject]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [subject]: { description: '', images: [] },
            };
        });
    };

    const updateSubjectDescription = (subject: SubjectType, description: string) => {
        setSubjectHomework((prev) => ({
            ...prev,
            [subject]: {
                ...prev[subject],
                description,
            },
        }));
    };

    const addSubjectImages = (subject: SubjectType, images: ImageFile[]) => {
        setSubjectHomework((prev) => ({
            ...prev,
            [subject]: {
                ...prev[subject],
                images: [...(prev[subject]?.images || []), ...images],
            },
        }));
    };

    const removeSubjectImage = (subject: SubjectType, index: number) => {
        setSubjectHomework((prev) => ({
            ...prev,
            [subject]: {
                description: prev[subject]?.description || '',
                images: (prev[subject]?.images || []).filter((_, i) => i !== index),
            },
        }));
    };

    const toggleSubmissionMethod = (method: SubmissionMethodType) => {
        setFormData((prev) => ({
            ...prev,
            submissionMethods: {
                ...prev.submissionMethods,
                [method]: !prev.submissionMethods[method],
            },
        }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            submissionDate: '',
            class: '',
            section: '',
            subjects: [],
            submissionMethods: {
                whatsapp: false,
                email: false,
                mobileApp: true,
            },
        });
        setSubjectHomework({});
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!formData.title.trim()) {
            errors.push('Please enter a homework title');
        }

        if (!formData.submissionDate) {
            errors.push('Please select a submission date');
        }

        if (!formData.class) {
            errors.push('Please select a class');
        }

        if (!formData.section) {
            errors.push('Please select a section');
        }

        if (formData.subjects.length === 0) {
            errors.push('Please select at least one subject');
        }

        if (
            !formData.submissionMethods.whatsapp &&
            !formData.submissionMethods.email &&
            !formData.submissionMethods.mobileApp
        ) {
            errors.push('Please select at least one submission method');
        }

        // Validate subject homework
        for (const subject of formData.subjects) {
            if (!subjectHomework[subject]?.description?.trim()) {
                errors.push(`Please add description for ${subject}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    };

    return {
        formData,
        subjectHomework,
        updateField,
        toggleSubject,
        updateSubjectDescription,
        addSubjectImages,
        removeSubjectImage,
        toggleSubmissionMethod,
        resetForm,
        validateForm,
    };
};

// Alias for compatibility
export const useCreateHomework = useCreateStaffHomework;
