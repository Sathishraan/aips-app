export interface AttendanceDetail {
  id: string;
  student_name: string;
  Class: string;
  section: string;
  action: string;
  date: string;
  stud_no: string;
  status?: string;
  reason?: string | null;
  message?: string;
}

export interface AttendanceSummary {
  total_working_days: string;
  present_days: string;
  absent_days: string;
  on_duty_days: string;
  late_days?: string;
  alerts?: AttendanceDetail[];
}

export type AttendanceAction = 'Present' | 'Absent' | 'On Duty' | 'Later Comers';

export interface LateComerItem {
  stud_no: string;
  admission_no?: string | null;
  student_name: string;
  class: string;
  section: string;
  date: string;
  action: string;
  reason?: string | null;
  status: string;
  message?: string;
}

export interface LateComersResponse {
  status: number;
  msg: string;
  count: number;
  data: LateComerItem[];
  filters?: Record<string, any>;
}

export interface CreateLatePayload {
  stud_no: string | number;
  date?: string;
  class?: string;
  section?: string;
  action?: 'Later Comers' | 'Absent' | 'Late';
  reason?: string;
  student_name?: string;
}
