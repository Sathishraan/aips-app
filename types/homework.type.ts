export interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacher: string;
  assignedDate: string;
  dueDate: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'submitted' | 'graded' | 'overdue';
  totalMarks?: number;
  obtainedMarks?: number;
  grade?: string;
  feedback?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  submission?: {
    submittedAt: string;
    content: string;
    attachments?: {
      id: string;
      name: string;
      type: string;
      url: string;
    }[];
  };
  resources?: {
    id: string;
    title: string;
    type: 'document' | 'video' | 'link';
    url: string;
  }[];
}

export const homeworkData: Homework[] = [
  {
    id: 'HW001',
    title: 'Machine Learning Algorithm Implementation',
    description: 'Implement K-Means clustering algorithm from scratch using Python. Include data preprocessing, algorithm implementation, and evaluation metrics. Submit both code and a detailed report explaining your approach.',
    subject: 'Machine Learning',
    teacher: 'Dr. Rajesh Kumar',
    assignedDate: '2024-01-20',
    dueDate: '2024-02-05',
    priority: 'high',
    status: 'in-progress',
    totalMarks: 100,
    attachments: [
      {
        id: 'ATT001',
        name: 'dataset.csv',
        type: 'csv',
        url: 'https://example.com/homework/ml_dataset.csv'
      },
      {
        id: 'ATT002',
        name: 'requirements.pdf',
        type: 'pdf',
        url: 'https://example.com/homework/ml_requirements.pdf'
      }
    ],
    resources: [
      {
        id: 'RES001',
        title: 'K-Means Tutorial Video',
        type: 'video',
        url: 'https://example.com/videos/kmeans-tutorial.mp4'
      },
      {
        id: 'RES002',
        title: 'Clustering Evaluation Guide',
        type: 'document',
        url: 'https://example.com/docs/clustering-guide.pdf'
      }
    ]
  },
  {
    id: 'HW002',
    title: 'React Component Optimization',
    description: 'Optimize the given React application by implementing memoization, lazy loading, and performance best practices. Analyze the performance improvements and document your changes.',
    subject: 'Web Development',
    teacher: 'Prof. Priya Singh',
    assignedDate: '2024-01-18',
    dueDate: '2024-02-10',
    priority: 'normal',
    status: 'pending',
    totalMarks: 75,
    attachments: [
      {
        id: 'ATT003',
        name: 'react_app.zip',
        type: 'zip',
        url: 'https://example.com/homework/react_app.zip'
      }
    ],
    resources: [
      {
        id: 'RES003',
        title: 'React Performance Guide',
        type: 'link',
        url: 'https://react.dev/learn/render-and-commit'
      }
    ]
  },
  {
    id: 'HW003',
    title: 'Database Schema Design',
    description: 'Design a complete database schema for a university management system. Include ER diagrams, normalization up to 3NF, and SQL scripts for table creation.',
    subject: 'Database Systems',
    teacher: 'Prof. Meera Patel',
    assignedDate: '2024-01-15',
    dueDate: '2024-01-30',
    priority: 'high',
    status: 'submitted',
    totalMarks: 80,
    obtainedMarks: 72,
    grade: 'A',
    feedback: 'Excellent schema design with proper normalization. Minor improvements needed in relationship definitions.',
    submission: {
      submittedAt: '2024-01-28T23:45:00Z',
      content: 'Submitted complete database schema with ER diagrams and SQL scripts.',
      attachments: [
        {
          id: 'SUB001',
          name: 'schema_design.pdf',
          type: 'pdf',
          url: 'https://example.com/submissions/schema_design.pdf'
        },
        {
          id: 'SUB002',
          name: 'sql_scripts.sql',
          type: 'sql',
          url: 'https://example.com/submissions/sql_scripts.sql'
        }
      ]
    }
  },
  {
    id: 'HW004',
    title: 'Binary Search Tree Implementation',
    description: 'Implement a complete Binary Search Tree with insertion, deletion, traversal, and balancing operations. Include unit tests and performance analysis.',
    subject: 'Data Structures',
    teacher: 'Dr. Amit Sharma',
    assignedDate: '2024-01-12',
    dueDate: '2024-01-25',
    priority: 'normal',
    status: 'graded',
    totalMarks: 60,
    obtainedMarks: 55,
    grade: 'A',
    feedback: 'Good implementation with correct algorithms. Could improve code documentation.',
    submission: {
      submittedAt: '2024-01-24T14:30:00Z',
      content: 'BST implementation with all required operations and comprehensive tests.',
      attachments: [
        {
          id: 'SUB003',
          name: 'bst_implementation.zip',
          type: 'zip',
          url: 'https://example.com/submissions/bst_implementation.zip'
        }
      ]
    }
  },
  {
    id: 'HW005',
    title: 'Literature Review: Deep Learning',
    description: 'Write a comprehensive literature review on recent advances in deep learning. Include at least 10 research papers, analysis of methodologies, and future research directions.',
    subject: 'Machine Learning',
    teacher: 'Dr. Rajesh Kumar',
    assignedDate: '2024-01-10',
    dueDate: '2024-02-15',
    priority: 'urgent',
    status: 'overdue',
    totalMarks: 120
  }
];
