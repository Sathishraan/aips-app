import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getData, postData } from '../api/generic.api';
import { CLASSES, SECTIONS } from '../types/staffHomework.type';
import { isHermesDateError, materializeHomeworkFile } from '../utils/homeworkImage';

export { CLASSES, SECTIONS };

/** Stable empty list so disabled queries don't create a new [] every render. */
const EMPTY_LIST: any[] = [];
const EMPTY_META = { classes: CLASSES as string[], sections: ['A', 'B'] as string[] };

const asList = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((part) => part.trim()).filter(Boolean);
  }
  return [];
};

const optionText = (item: any, kind: 'class' | 'section'): string => {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
  if (kind === 'section') {
    return String(item.section ?? item.stud_section ?? item.label ?? item.value ?? '').trim();
  }
  return String(item.class ?? item.stud_class ?? item.label ?? item.value ?? item.name ?? '').trim();
};

export const canonicalizeSection = (section: string): string => {
  const raw = String(section || '').trim();
  if (!raw || raw === '0' || raw.toLowerCase() === 'all') return '';
  const prefixed = /^(?:section|sec)[\s.\-:]*([A-Za-z0-9]+)$/i.exec(raw);
  if (prefixed) return prefixed[1].toUpperCase();
  if (/^[A-Za-z0-9]{1,4}$/.test(raw)) return raw.toUpperCase();
  return raw;
};

const normalizeOptionList = (raw: any, kind: 'class' | 'section'): string[] => {
  const seen = new Set<string>();
  const values: string[] = [];
  asList(raw).forEach((item) => {
    const text = optionText(item, kind);
    const value = kind === 'section' ? canonicalizeSection(text) : text;
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    values.push(value);
  });
  return values;
};

export const sectionLabel = (section: string) => {
  const value = canonicalizeSection(section) || String(section || '').trim();
  if (!value || value.toLowerCase() === 'all' || value === '0') return 'All sections';
  if (/^section\s+/i.test(value)) return value;
  if (value.length <= 4) return `Section ${value}`;
  return value;
};

const uniqueDropdownItems = (items: { label: string; value: string }[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || item.value == null || item.value === '') return false;
    const valueKey = canonicalizeSection(String(item.value)) || String(item.value).trim().toLowerCase();
    const labelKey = canonicalizeSection(String(item.label)) || String(item.label).trim().toLowerCase();
    const key = `${valueKey}|${labelKey}`;
    if (seen.has(valueKey) || seen.has(key)) return false;
    seen.add(valueKey);
    seen.add(key);
    return true;
  });
};

const pickMetaPayload = (response: any) => {
  const candidates = [response?.data, response, response?.data?.data];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    if (
      candidate.section != null ||
      candidate.sections != null ||
      candidate.class != null ||
      candidate.classes != null
    ) {
      return candidate;
    }
  }
  return {};
};

export const useClassSectionMeta = () =>
  useQuery<{ classes: string[]; sections: string[] }>({
    queryKey: ['staff', 'class-section-meta', 'v3'],
    placeholderData: EMPTY_META,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await getData<any>('api/students/meta', { skipStudentScope: true });
      const payload = pickMetaPayload(response);
      const classes = normalizeOptionList(payload.class || payload.classes, 'class');
      const sections = normalizeOptionList(payload.section || payload.sections, 'section');
      return {
        classes: classes.length ? classes : EMPTY_META.classes,
        sections: sections.length ? sections : EMPTY_META.sections,
      };
    },
  });

export type StaffStudent = {
  student_id?: string | number;
  stud_no?: string | number;
  stud_id?: string | number;
  admission_no?: string;
  student_name: string;
  stud_firstname?: string;
  stud_lastname?: string;
  class?: string;
  section?: string;
  stud_class?: string;
  stud_section?: string;
};

const studentName = (row: any): string => {
  const combined = `${row?.stud_firstname || ''} ${row?.stud_lastname || ''}`.trim();
  return row?.student_name || combined || row?.admission_no || 'Student';
};

const studentId = (row: any): string =>
  String(row?.stud_no || row?.student_id || row?.stud_id || row?.id || '');

export const useStaffFilterOptions = (includeAllSection = true) => {
  const { data } = useClassSectionMeta();
  const classes = data?.classes?.length ? data.classes : EMPTY_META.classes;
  const sections = data?.sections?.length ? data.sections : EMPTY_META.sections;
  const classItems = uniqueDropdownItems(classes.map((c) => ({ label: c, value: c })));
  const sectionItems = uniqueDropdownItems([
    ...(includeAllSection ? [{ label: 'All sections', value: 'all' }] : []),
    ...sections.map((s) => {
      const value = canonicalizeSection(s) || s;
      return {
        label: sectionLabel(value),
        value,
      };
    }),
  ]);
  return { classItems, sectionItems, classes, sections };
};

export const useClassStudents = (classId?: string, sectionId?: string) => {
  const enabled = !!classId;
  return useQuery<StaffStudent[]>({
    queryKey: ['staff', 'students', classId, sectionId || 'all'],
    enabled,
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('class', classId || '');
      params.set('section', sectionId || 'all');
      const response = await getData<any>(`api/students/list?${params.toString()}`, {
        skipStudentScope: true,
      });
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      return list.map((row: any) => ({
        ...row,
        student_id: studentId(row),
        stud_no: studentId(row),
        student_name: studentName(row),
      }));
    },
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      date: string;
      notify?: boolean;
      students: Array<{
        stud_no: string | number;
        status: string;
        reason?: string;
        name?: string;
        class?: string;
        section?: string;
      }>;
    }) => {
      const result = await postData<any>('api/attendance', payload);
      if (result?.status === 0 || result?.status === false) {
        throw new Error(result?.msg || 'Failed to save attendance');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff', 'attendance'] });
    },
  });
};

export const localDateYmd = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export type AttendanceHistoryDay = {
  date: string;
  is_today: boolean;
  can_edit: boolean;
  total: number;
  present: number;
  absent: number;
  late: number;
  on_duty: number;
};

export const useAttendanceHistory = (classId?: string, sectionId?: string) => {
  return useQuery<{ today: string; days: AttendanceHistoryDay[] }>({
    queryKey: ['staff', 'attendance', 'history', classId || 'all', sectionId || 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (classId) params.set('class', classId);
      params.set('section', sectionId || 'all');
      const qs = params.toString();
      const response = await getData<any>(`api/attendance/history${qs ? `?${qs}` : ''}`, {
        skipStudentScope: true,
      });
      const list = Array.isArray(response?.data) ? response.data : [];
      return {
        today: String(response?.today || localDateYmd()),
        days: list,
      };
    },
  });
};

const EMPTY_DAY = { canEdit: false, isToday: false, rows: EMPTY_LIST };

export const useAttendanceDay = (date?: string, classId?: string, sectionId?: string) => {
  const enabled = !!date;
  return useQuery({
    queryKey: ['staff', 'attendance', 'day', date, classId || 'all', sectionId || 'all'],
    enabled,
    placeholderData: EMPTY_DAY,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('date', date || '');
      if (classId) params.set('class', classId);
      params.set('section', sectionId || 'all');
      const response = await getData<any>(`api/attendance/day?${params.toString()}`, {
        skipStudentScope: true,
      });
      const list = Array.isArray(response?.data) ? response.data : [];
      return {
        canEdit: !!response?.can_edit,
        isToday: !!response?.is_today,
        rows: list,
      };
    },
  });
};

export const useExamTerms = () =>
  useQuery({
    queryKey: ['exam', 'terms'],
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const response = await getData<any>('api/exam/terms');
      const list = response?.data || response || [];
      return Array.isArray(list) ? list : [];
    },
  });

export const useExamSubjects = (classId?: string) =>
  useQuery({
    queryKey: ['exam', 'subjects', classId],
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const qs = classId ? `?class=${encodeURIComponent(classId)}` : '';
      const response = await getData<any>(`api/exam/subjects${qs}`);
      const list = response?.data || response || [];
      return Array.isArray(list) ? list : [];
    },
  });

export const useExamMarks = (params: {
  class?: string;
  section?: string;
  term_id?: string;
  subject_id?: string;
}) => {
  const enabled = !!params.class && !!params.term_id && !!params.subject_id;
  return useQuery({
    queryKey: ['exam', 'marks', params.class, params.section, params.term_id, params.subject_id],
    enabled,
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.class) search.set('class', params.class);
      if (params.section && params.section.toLowerCase() !== 'all' && params.section !== '0') {
        search.set('section', params.section);
      }
      if (params.term_id) search.set('term_id', params.term_id);
      if (params.subject_id) search.set('subject_id', params.subject_id);
      const response = await getData<any>(`api/exam/marks?${search.toString()}`);
      const list = response?.data || [];
      return Array.isArray(list) ? list : [];
    },
  });
};

export const useSaveExamMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      class: string;
      section: string;
      term_id: string;
      subject_id: string;
      students: Array<{
        student_id: string | number;
        written_marks: number;
        student_name?: string;
      }>;
    }) => {
      const result = await postData<any>('api/exam/marks/save', payload);
      if (result?.status === 0 || result?.status === false) {
        throw new Error(result?.msg || 'Failed to save marks');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
};

export const usePendingLeaves = () =>
  useQuery({
    queryKey: ['leave', 'pending'],
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const response = await getData<any>('api/leave/pending', { skipStudentScope: true });
      const list = response?.data || response || [];
      return Array.isArray(list) ? list : [];
    },
  });

export const useLeaveHistory = (status: '1' | '2' | 'all' = 'all') =>
  useQuery({
    queryKey: ['leave', 'history', status],
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const qs = status === 'all' ? '' : `?status=${status}`;
      const response = await getData<any>(`api/leave/history${qs}`, { skipStudentScope: true });
      const list = response?.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string | number; status: 1 | 2 }) => {
      const result = await postData<any>('api/leave/approve', payload);
      if (result?.status === 0 || result?.status === false) {
        throw new Error(result?.msg || 'Failed to update leave');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
  });
};

export const useStudentRemarks = (studId?: string) =>
  useQuery({
    queryKey: ['remarks', studId || 'mine'],
    enabled: studId !== undefined ? !!studId : true,
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const qs = studId ? `?stud_id=${encodeURIComponent(studId)}` : '';
      const response = await getData<any>(`api/remarks/list${qs}`);
      const list = response?.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

export const useSaveRemark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      stud_id: string | number;
      behaviour_remarks: string;
      remark_for?: string;
      action_desc?: string;
    }) => {
      const result = await postData<any>('api/remarks/save', payload);
      if (result?.status === 0 || result?.status === false) {
        throw new Error(result?.msg || 'Failed to save remark');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remarks'] });
    },
  });
};

export const useUploadGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      event_date: string;
      class_id?: string;
      section_id?: string;
      image: { uri: string; name: string; type: string; base64?: string; size?: number };
    }) => {
      let local;
      try {
        local = await materializeHomeworkFile({
          uri: payload.image.uri,
          name: payload.image.name,
          type: payload.image.type,
          size: payload.image.size || 0,
          base64: payload.image.base64,
        });
      } catch (error: any) {
        if (isHermesDateError(error)) {
          throw new Error('This photo format could not be read. Try another image.');
        }
        throw error;
      }
      if (!local?.base64) {
        throw new Error('Could not read this image. Use JPG, PNG, WEBP, HEIC, GIF, BMP, or TIFF.');
      }

      // JSON only — never FormData. RN Hermes throws "unsupported FormData part"
      // when a photo URI / file object is attached.
      const result = await postData<any>(
        'api/gallery/upload',
        {
          title: payload.title,
          description: payload.description || '',
          event_date: payload.event_date,
          class_id: payload.class_id || '0',
          section_id: payload.section_id || '0',
          gallery_image_b64: String(local.base64),
          file_name: String(local.name || 'gallery.jpg'),
          file_mime: String(local.type || 'image/jpeg'),
        },
        { timeout: 60000 }
      );
      if (result?.status === 0 || result?.status === false) {
        throw new Error(result?.msg || 'Failed to upload image');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};

export const STAFF_LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'LWP', 'Maternity', 'Paternity'] as const;

export const useStaffLeaveList = () =>
  useQuery({
    queryKey: ['staff-leave', 'list'],
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const response = await getData<any>('api/leave/staff/list', { skipStudentScope: true });
      const list = response?.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

export const useStaffLeaveBalance = () =>
  useQuery({
    queryKey: ['staff-leave', 'balance'],
    queryFn: async () => {
      const response = await getData<any>('api/leave/staff/balance', { skipStudentScope: true });
      return response?.data || response || {};
    },
  });

export const useStaffLeavePending = () =>
  useQuery({
    queryKey: ['staff-leave', 'pending'],
    placeholderData: EMPTY_LIST,
    queryFn: async () => {
      const response = await getData<any>('api/leave/staff/pending', { skipStudentScope: true });
      const list = response?.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

export const useApplyStaffLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      leave_type: string;
      leave_from: string;
      leave_to: string;
      leave_reason: string;
    }) => {
      const result = await postData<any>('api/leave/staff/apply', payload);
      if (result?.status === 0 || result?.status === false) {
        throw new Error(result?.msg || result?.message || 'Failed to apply leave');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-leave'] });
    },
  });
};

export const useApproveStaffLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { leave_id: string | number; status: 'Approved' | 'Rejected'; remarks?: string }) => {
      const result = await postData<any>('api/leave/staff/approve', payload);
      if (result?.status === 0 || result?.status === false) {
        throw new Error(result?.msg || 'Failed to update staff leave');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-leave'] });
    },
  });
};
