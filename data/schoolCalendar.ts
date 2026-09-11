import calendarJson from './schoolCalendar.json';

export type CalendarEventType = 'holiday' | 'exam' | 'ptm' | 'value' | 'event';

export interface SchoolCalendarEvent {
  date: string;
  day: string;
  title: string;
  type: CalendarEventType;
}

export interface SchoolCalendarMonth {
  id: string;
  month: string;
  year: number;
  theme: string;
  events: SchoolCalendarEvent[];
}

export const SCHOOL_CALENDAR: SchoolCalendarMonth[] =
  calendarJson as SchoolCalendarMonth[];

export const getMonthById = (id: string) =>
  SCHOOL_CALENDAR.find((m) => m.id === id);

/** Meaningful events (skip routine Sunday holidays) */
export const getHighlightEvents = (month: SchoolCalendarMonth) =>
  month.events.filter(
    (e) => !(e.title === 'Holiday' && e.day === 'Sunday')
  );

export const EVENT_TYPE_META: Record<
  CalendarEventType,
  { label: string; color: string; bg: string; icon: string }
> = {
  holiday: { label: 'Holiday', color: '#DC2626', bg: '#FEE2E2', icon: 'sunny-outline' },
  exam: { label: 'Exam', color: '#7C3AED', bg: '#EDE9FE', icon: 'school-outline' },
  ptm: { label: 'PTM', color: '#2563EB', bg: '#DBEAFE', icon: 'people-outline' },
  value: { label: 'Value Day', color: '#059669', bg: '#D1FAE5', icon: 'heart-outline' },
  event: { label: 'Event', color: '#424e79', bg: '#eef0f8', icon: 'calendar-outline' },
};
