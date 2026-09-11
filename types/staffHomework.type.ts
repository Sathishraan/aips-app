


export type ClassType = 'PREKG' | 'LKG' | 'UKG' | '1ST' | '2ND' | '3RD' | '4TH' | '5TH' | '6TH' | '7TH' | '8TH' | '9TH' | '10TH' | '11TH' | '12TH';
export type SectionType = 'Section A' | 'Section B' | 'Section C' | 'Section D';

export type SubjectType =
  | 'TAMIL'
  | 'ENGLISH'
  | 'MATHS'
  | 'SCIENCE'
  | 'SOCIAL'
  | 'PHYSICS'
  | 'CHEMISTRY'
  | 'COMPUTER SCIENCE'
  | 'BIOLOGY'
  | 'ZOLOGY'
  | 'BIO-BOTONY'
  | 'BIO-ZOLOGY'
  | 'ACCOUNTANTS'
  | 'BUSSINESS MATHS'
  | 'TEST';

export type SubmissionMethodType = 'whatsapp' | 'email' | 'mobileApp';

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  base64?: string;
}

export interface SubjectHomework {
  description: string;
  images: ImageFile[];
}

export interface SubmissionMethods {
  whatsapp: boolean;
  email: boolean;
  mobileApp: boolean;
}

export interface HomeworkFormData {
  title: string;
  submissionDate: string;
  class: string;
  section: string;
  subjects: SubjectType[];
  submissionMethods: SubmissionMethods;
}

export interface SubjectHomeworkData {
  [subject: string]: SubjectHomework;
}

export interface CreateHomeworkRequest {
  title: string;
  submissionDate: string;
  class: string;
  section: string;
  subjects: SubjectType[];
  submissionMethods: SubmissionMethods;
  homeworkData: SubjectHomeworkData;
  status: string;
}

export interface HomeworkResponse {
  success: boolean;
  message: string;
  data?: {
    homeworkId: string;
    title: string;
    class: ClassType;
    section: SectionType;
    subjects: SubjectType[];
    submissionDate: string;
    createdAt: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

export const AVAILABLE_SUBJECTS: SubjectType[] = [
  'TAMIL',
  'ENGLISH',
  'MATHS',
  'SCIENCE',
  'SOCIAL',
  'PHYSICS',
  'CHEMISTRY',
  'COMPUTER SCIENCE',
  'BIOLOGY',
  'ZOLOGY',
  'BIO-BOTONY',
  'BIO-ZOLOGY',
  'ACCOUNTANTS',
  'BUSSINESS MATHS',
  'TEST',
];

export const CLASSES: ClassType[] = ['PREKG', 'LKG', 'UKG', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH'];

export const SECTIONS: SectionType[] = ['Section A', 'Section B', 'Section C', 'Section D'];