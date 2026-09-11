import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getData, postData } from '../api/generic.api';
import { getSelectedStudentId } from '../api/selectedStudent';
import {
    AttendanceSummary,
    AttendanceDetail,
    AttendanceAction,
    LateComerItem,
    CreateLatePayload,
} from '../types/attendance.type';

const mapAttendanceRow = (item: any, index = 0): AttendanceDetail => ({
    id: String(item.id || `${item.stud_no || 'row'}-${item.date || index}-${index}`),
    student_name: String(item.student_name || ''),
    Class: String(item.Class || item.class || ''),
    section: String(item.section || ''),
    action: String(item.action || item.status || ''),
    status: String(item.status || item.action || ''),
    date: String(item.date || '').slice(0, 10),
    stud_no: String(item.stud_no || ''),
    reason: item.reason ? String(item.reason) : null,
    message: item.message ? String(item.message) : '',
});

export const useAttendanceReport = () => {
    const selectedId = getSelectedStudentId();
    return useQuery<AttendanceSummary>({
        queryKey: ['attendance', 'report', selectedId],
        queryFn: async () => {
            let res: any;
            try {
                res = await getData<any>('api/attendance/report');
            } catch {
                res = await getData<any>('api/student/attendance');
            }

            console.log('--- Attendance Report Raw ---');
            console.log(JSON.stringify(res, null, 2));

            const payload = res?.data && !Array.isArray(res.data) && (res.data.present_days || res.data.summary)
                ? res.data
                : res || {};
            const rows = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(payload?.data)
                    ? payload.data
                    : [];
            const summaryBlock = payload?.summary || res?.summary || {};
            const mapped = rows.map(mapAttendanceRow);
            const absent = (Array.isArray(res?.absent) ? res.absent : mapped.filter((row) => /absent/i.test(row.status || row.action))).map(mapAttendanceRow);
            const late = (Array.isArray(res?.later_comers) ? res.later_comers : mapped.filter((row) => /late/i.test(row.status || row.action))).map(mapAttendanceRow);
            const onDuty = mapped.filter((row) => /on duty|onduty/i.test(row.status || row.action)).length;

            const alerts = [...absent, ...late]
                .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                .slice(0, 8);

            return {
                total_working_days: String(summaryBlock.total_count ?? payload.total_working_days ?? payload.total_days ?? mapped.length ?? '0'),
                present_days: String(summaryBlock.present_count ?? payload.present_days ?? '0'),
                absent_days: String(summaryBlock.absent_count ?? payload.absent_days ?? absent.length ?? '0'),
                on_duty_days: String(payload.on_duty_days ?? payload.onduty_days ?? onDuty ?? '0'),
                late_days: String(summaryBlock.later_comers_count ?? payload.late_days ?? late.length ?? '0'),
                alerts,
            };
        },
    });
};

export const useAttendanceDetails = (status: AttendanceAction) => {
    const selectedId = getSelectedStudentId();
    return useQuery<AttendanceDetail[]>({
        queryKey: ['attendance', 'report', 'details', status, selectedId],
        queryFn: async () => {
            try {
                const encodedStatus = encodeURIComponent(status);
                const endpoint = `api/attendance/report/details/${encodedStatus}`;
                const response = await getData<any>(endpoint);

                console.log(`--- Attendance Details Raw (${status}) ---`);
                console.log(JSON.stringify(response, null, 2));

                const list = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response?.absent) && /absent/i.test(status)
                        ? response.absent
                        : Array.isArray(response?.later_comers) && /later/i.test(status)
                            ? response.later_comers
                            : Array.isArray(response?.present) && /present|on duty/i.test(status)
                                ? response.present
                                : Array.isArray(response)
                                    ? response
                                    : [];

                return list.map(mapAttendanceRow);
            } catch (error) {
                console.log(`--- Attendance Details failed (${status}) ---`, error);
                return [];
            }
        },
        enabled: !!status,
    });
};

/** GET /api/attendance?stud_no=123 */
export const useStudentAttendance = (studNo?: string | number) => {
    return useQuery({
        queryKey: ['attendance', 'student', studNo],
        queryFn: async () => {
            const qs = studNo ? `?stud_no=${encodeURIComponent(String(studNo))}` : '';
            const response = await getData<any>(`api/attendance${qs}`);

            console.log('--- Attendance GET Raw (stud_no) ---');
            console.log(JSON.stringify(response, null, 2));

            const list = response?.data || response;
            return {
                count: response?.count ?? (Array.isArray(list) ? list.length : 0),
                stud_no: response?.stud_no || studNo,
                data: Array.isArray(list) ? list : [],
            };
        },
        enabled: studNo !== undefined && studNo !== null && String(studNo) !== '',
    });
};

export type LateComersParams = {
    date?: string;
    from_date?: string;
    to_date?: string;
    class?: string;
    section?: string;
};

/** GET /api/attendance/late-comers */
export const useLateComers = (params: LateComersParams = {}) => {
    const key = JSON.stringify(params);

    return useQuery<LateComerItem[]>({
        queryKey: ['attendance', 'late-comers', key],
        queryFn: async () => {
            const search = new URLSearchParams();
            if (params.date) search.set('date', params.date);
            if (params.from_date) search.set('from_date', params.from_date);
            if (params.to_date) search.set('to_date', params.to_date);
            if (params.class) search.set('class', params.class);
            if (params.section) search.set('section', params.section);

            const qs = search.toString();
            const endpoint = qs
                ? `api/attendance/late-comers?${qs}`
                : 'api/attendance/late-comers';

            const response = await getData<any>(endpoint);

            console.log('--- Late Comers GET Raw ---');
            console.log(JSON.stringify(response, null, 2));

            let list: LateComerItem[] = [];
            if (Array.isArray(response?.data)) {
                list = response.data;
            } else if (Array.isArray(response)) {
                list = response;
            }

            console.log(`--- Late Comers Parsed (${list.length}) ---`);
            return list;
        },
    });
};

/**
 * POST /api/attendance/late-comers
 * Marks Later Comers / Absent and notifies parent when Absent/Late.
 */
export const useCreateLateAttendance = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateLatePayload) => {
            console.log('--- Late Comers POST Payload ---');
            console.log(JSON.stringify(payload, null, 2));

            const result = await postData<any>('api/attendance', {
                stud_no: payload.stud_no,
                date: payload.date || new Date().toISOString().slice(0, 10),
                class: payload.class,
                section: payload.section,
                status: payload.action || 'Later Comers',
                reason: payload.reason,
                name: payload.student_name,
                notify: true,
            });

            console.log('--- Late Comers POST Response ---');
            console.log(JSON.stringify(result, null, 2));

            if (result?.status === 0 || result?.status === false) {
                throw new Error(result?.msg || 'Failed to save late attendance');
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
