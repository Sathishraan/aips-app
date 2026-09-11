export interface RawExam {
  exam_id: string;
  exam_date: string;
  term_id: string;
  class_name: string;
  class_group: string | null;
  subj_id: string;
  subjgroup_id: string;
  exam_session: string;
  exam_start: string;
  exam_end: string;
  total_mark: string;
  pass_mark: string;
  insert_date: string;
  academic_year: string;
  active: string;
  term_name: string;
  subjectName: string;
}

export type ExamListResponse = Record<string, RawExam[]>;

export interface Exam {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  totalMarks: number;
  instructions: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  venue: string;
  syllabus: string[];
  prerequisites?: string[];
  materials?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
}

export interface ExamResult {
  examId: string;
  studentId: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  status: 'pass' | 'fail' | 'absent';
  feedback?: string;
  gradedAt: string;
  gradedBy: string;
  detailedBreakdown?: {
    section: string;
    marks: number;
    maxMarks: number;
    comments?: string;
  }[];
}

export const examsData: Exam[] = [
  {
    id: 'EXAM001',
    title: 'Machine Learning Mid-term Examination',
    subject: 'Machine Learning',
    teacher: 'Dr. Rajesh Kumar',
    examDate: '2024-02-15',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    duration: 180,
    totalMarks: 100,
    instructions: [
      'Bring your student ID card',
      'No electronic devices allowed except calculator',
      'Arrive 15 minutes before exam time',
      'Answer all questions',
      'Show all working steps for calculations'
    ],
    status: 'upcoming',
    venue: 'Hall A, Academic Block 1',
    syllabus: [
      'Supervised Learning Algorithms',
      'Unsupervised Learning',
      'Model Evaluation Metrics',
      'Data Preprocessing Techniques'
    ],
    materials: [
      {
        id: 'MAT001',
        name: 'formula_sheet.pdf',
        type: 'pdf',
        url: 'https://example.com/exams/ml_formula_sheet.pdf'
      }
    ]
  },
  {
    id: 'EXAM002',
    title: 'Web Development Final Project Evaluation',
    subject: 'Web Development',
    teacher: 'Prof. Priya Singh',
    examDate: '2024-01-30',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    duration: 180,
    totalMarks: 150,
    instructions: [
      'Present your project live',
      'Prepare a 10-minute presentation',
      'Be ready for Q&A session',
      'Submit project documentation',
      'Demonstrate all features'
    ],
    status: 'completed',
    venue: 'Computer Lab 2',
    syllabus: [
      'React Application Development',
      'State Management',
      'API Integration',
      'UI/UX Design',
      'Performance Optimization'
    ],
    prerequisites: [
      'Completed all assignments',
      'Submitted project proposal',
      'Attended all workshops'
    ]
  },
  {
    id: 'EXAM003',
    title: 'Data Structures Quiz',
    subject: 'Data Structures',
    teacher: 'Dr. Amit Sharma',
    examDate: '2024-02-05',
    startTime: '02:00 PM',
    endTime: '03:30 PM',
    duration: 90,
    totalMarks: 50,
    instructions: [
      'This is a closed-book quiz',
      'Answer all multiple-choice questions',
      'No calculators allowed',
      'Time limit: 90 minutes'
    ],
    status: 'upcoming',
    venue: 'Classroom 201',
    syllabus: [
      'Arrays and Linked Lists',
      'Stacks and Queues',
      'Trees and Graphs',
      'Sorting and Searching Algorithms'
    ]
  },
  {
    id: 'EXAM004',
    title: 'Database Systems Practical Exam',
    subject: 'Database Systems',
    teacher: 'Prof. Meera Patel',
    examDate: '2024-02-20',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    duration: 180,
    totalMarks: 100,
    instructions: [
      'Complete all SQL queries',
      'Design and implement database schema',
      'Optimize queries for performance',
      'Document your solutions',
      'Test all functionality'
    ],
    status: 'upcoming',
    venue: 'Computer Lab 1',
    syllabus: [
      'SQL Query Writing',
      'Database Design',
      'Normalization',
      'Indexing and Optimization',
      'Transaction Management'
    ]
  }
];

export const examResultsData: ExamResult[] = [
  {
    examId: 'EXAM002',
    studentId: 'STU2024001',
    marksObtained: 135,
    totalMarks: 150,
    percentage: 90,
    grade: 'A',
    status: 'pass',
    feedback: 'Excellent project! Well-implemented features and good presentation skills.',
    gradedAt: '2024-02-02T14:30:00Z',
    gradedBy: 'Prof. Priya Singh',
    detailedBreakdown: [
      {
        section: 'Implementation',
        marks: 60,
        maxMarks: 60,
        comments: 'Perfect implementation of all required features'
      },
      {
        section: 'Presentation',
        marks: 45,
        maxMarks: 50,
        comments: 'Clear and engaging presentation'
      },
      {
        section: 'Documentation',
        marks: 30,
        maxMarks: 40,
        comments: 'Good documentation, could be more detailed'
      }
    ]
  }
];