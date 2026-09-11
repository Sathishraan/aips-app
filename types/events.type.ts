// Sports Event Types
export interface SportsEvent {
    tournament_name?: string;
    tournament_conduct?: string;
    tournament_type?: string;
    tournment_name: string;
    tourment_conduct: string;
    venue: string;
    tournment_type: string;
    academic_year: string;
    held_date: string;
    sport_id: string;
    sport_name: string;
    sport_type: string;
    school_house: string;
    participant_student: string;
    sport_status: string;
    class: string;
    section: string;
    result: string;
}

export interface SportsResponse {
    sports: SportsEvent[];
}

// Competition Event Types
export interface CompetitionEvent {
    competition_name?: string;
    academic_year?: string;
    competetion_name: string;
    acadamic_year: string;
    conducted_by: string;
    venue: string;
    held_date: string;
    result: string;
    competetion_id: string;
    std_class: string;
    std_section: string;
    participate_student: string;
    prize: string;
    compet_status: string;
}

export interface CompetitionResponse {
    competitions: CompetitionEvent[];
}

// Program Event Types
export interface ProgramEvent {
    academic_year?: string;
    program_name: string;
    cultural_name: string;
    acadamic_year: string;
    venue: string;
    program_id: string;
    held_date: string;
    student_class: string;
    student_section: string;
    students_name: string;
    prize: string;
    p_status: string;
}

export interface ProgramResponse {
    programs: ProgramEvent[];
}

// Cultural Event Types
export interface CulturalEvent {
    cultural_status?: string;
    cultural_id: string;
    cultural_name: string;
    cutural_incharge: string;
    cultural_date: string;
    cutural_status: string;
    incharge_name: string;
}

export interface CulturalResponse {
    culturals: CulturalEvent[];
}

// Combined Events Types for convenience
export type EventType = 'sports' | 'competitions' | 'programs' | 'culturals';

export interface EventsData {
    sports: SportsEvent[];
    competitions: CompetitionEvent[];
    programs: ProgramEvent[];
    culturals: CulturalEvent[];
}
