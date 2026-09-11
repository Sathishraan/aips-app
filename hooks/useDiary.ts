import { useQuery } from '@tanstack/react-query';
import { getData } from '../api/generic.api';

export interface DiaryEntry {
  id: string;
  date: string;
  due_date?: string | null;
  subject: string;
  title: string;
  description: string;
  teacher?: string | null;
  type: 'homework' | 'remark' | string;
  class?: string;
  section?: string;
}

export interface DiaryDayGroup {
  date: string;
  entries: DiaryEntry[];
}

const formatDateLabel = (date: string) => {
  if (!date) return 'Unknown date';
  const d = new Date(date + (date.includes('T') ? '' : 'T00:00:00'));
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const mapToDiaryEntries = (list: any[]): DiaryEntry[] =>
  list.map((item: any, idx: number) => ({
    id: String(item.id || item.homework_id || idx + 1),
    date: String(item.date || item.homework_date || '').slice(0, 10),
    due_date: item.due_date || item.submission_date || item.submit_date || null,
    subject: item.subject || item.subject_name || 'General',
    title: item.title || item.homework_title || 'Diary entry',
    description: item.description || item.homework_description || item.subject_description || '',
    teacher: item.teacher || item.teacher_name || null,
    type: item.type || 'homework',
    class: item.class || item.class_id,
    section: item.section || item.section_id,
  }));

const groupByDate = (mapped: DiaryEntry[]): DiaryDayGroup[] => {
  const groupsMap = new Map<string, DiaryEntry[]>();
  mapped.forEach((entry) => {
    const key = entry.date || 'undated';
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key)!.push(entry);
  });
  return Array.from(groupsMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, entries]) => ({ date, entries }));
};

/** GET api/diary/list — view only; falls back to homework list */
export const useDiary = () => {
  return useQuery({
    queryKey: ['diary', 'list'],
    queryFn: async () => {
      let list: any[] = [];

      try {
        const response = await getData<any>('api/diary/list');
        console.log('--- Diary List Raw ---');
        console.log(JSON.stringify(response, null, 2)?.slice(0, 2000));

        if (Array.isArray(response?.data)) {
          list = response.data;
        } else if (Array.isArray(response)) {
          list = response;
        }
      } catch {
        // No diary API — use homework as read-only diary content
        const hw = await getData<any>('api/homework/list');
        if (Array.isArray(hw?.data)) {
          list = hw.data;
        } else if (Array.isArray(hw)) {
          list = hw;
        }
        console.log('--- Diary fallback: homework list ---', list.length);
      }

      const mapped = mapToDiaryEntries(list);
      const groups = groupByDate(mapped);

      console.log(`--- Diary Parsed: ${mapped.length} entries, ${groups.length} days ---`);

      return {
        editable: false,
        entries: mapped,
        groups,
        formatDateLabel,
      };
    },
    staleTime: 60 * 1000,
  });
};
