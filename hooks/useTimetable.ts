import { useQuery } from '@tanstack/react-query';
import { getData } from '../api/generic.api';
import { TimetableResponse } from '../types/timetable.type';

export const useTimetable = () => {
  return useQuery<TimetableResponse>({
    queryKey: ['timetable'],
    queryFn: async () => {
      console.log('📡 [useTimetable] Fetching live timetable from api/timetable/list');
      const response = await getData<any>('api/timetable/list');

      console.log('📥 [useTimetable] Raw Response:', JSON.stringify(response, null, 2));

      const data = response?.data || response || {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayEntries = dayNames
        .filter((dayName) => Array.isArray(data?.[dayName]))
        .map((dayName) => ({ dayName, entries: data[dayName] as any[] }));

      const workingDays = Array.isArray(data.workingDays) || Array.isArray(data.working_days)
        ? (data.workingDays || data.working_days)
        : dayEntries.map(({ dayName }) => ({
          setting_id: dayName,
          academic_year: data.academic_year || '',
          day_name: dayName,
          is_working: '1',
          created_at: '',
        }));

      const timetable = Array.isArray(data.timetable)
        ? data.timetable
        : dayEntries.flatMap(({ dayName, entries }) => entries.map((entry: any, index) => ({
          timetable_id: entry.timetable_id?.toString() || `${dayName}-${entry.period || index + 1}`,
          academic_year: entry.academic_year || data.academic_year || '',
          class_id: entry.class_id || '',
          section_id: entry.section_id || '',
          day_name: dayName,
          period_id: entry.period_id?.toString() || entry.period?.toString() || `${index + 1}`,
          subject_id: entry.subject_id?.toString() || '',
          teacher_id: entry.teacher_id?.toString() || '',
          room_no: entry.room_no || entry.room || '',
          created_by: entry.created_by || '',
          created_at: entry.created_at || '',
          start_time: entry.start_time || entry.time?.split(' - ')[0] || '',
          end_time: entry.end_time || entry.time?.split(' - ')[1] || '',
          period_name: entry.period_name || entry.period?.toString() || `${index + 1}`,
          period_type: entry.period_type || 'class',
          subject_name: entry.subject_name || entry.subject || '',
          teacher_name: entry.teacher_name || entry.teacher || '',
        })));

      const periods = Array.isArray(data.periods) && data.periods.length > 0
        ? data.periods
        : Array.from(new Map(timetable.map((entry: any) => [entry.period_id, {
          period_id: entry.period_id,
          academic_year: entry.academic_year || data.academic_year || '',
          period_name: entry.period_name || entry.period_id,
          start_time: entry.start_time || '',
          end_time: entry.end_time || '',
          period_type: entry.period_type || 'class',
          created_at: entry.created_at || '',
        }])).values());


      console.log(`📊 [useTimetable] Mapped Result — Days: ${workingDays.length}, Slots: ${timetable.length}, Periods: ${periods.length}`);

      return {
        workingDays,
        timetable,
        periods,
      };
    },
  });
};
