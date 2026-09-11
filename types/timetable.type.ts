export interface WorkingDay {
    setting_id: string;
    academic_year: string;
    day_name: string;
    is_working: string;
    created_at: string;
}

export interface TimetableEntry {
    timetable_id: string;
    academic_year: string;
    class_id: string;
    section_id: string;
    day_name: string;
    period_id: string;
    subject_id: string;
    teacher_id: string;
    room_no: string;
    created_by: string;
    created_at: string;
    start_time: string;
    end_time: string;
    period_name: string;
    period_type: string;
    subject_name?: string;
    teacher_name?: string;
    teacherName?: string;
    substituteTeacherName?: string | null;
}

export interface Period {
    period_id: string;
    academic_year: string;
    period_name: string;
    start_time: string;
    end_time: string;
    period_type: string;
    created_at: string;
}

export interface TimetableResponse {
    workingDays: WorkingDay[];
    timetable: TimetableEntry[];
    periods: Period[];
}
