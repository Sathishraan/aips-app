export interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'academic' | 'administrative' | 'personal';
}

export const messagesData: Message[] = [
  {
    id: 'MSG001',
    sender: 'Dr. Rajesh Kumar',
    senderAvatar: 'https://i.pravatar.cc/300?img=10',
    subject: 'Assignment Submission Reminder',
    content: 'Please submit your machine learning assignment by tomorrow evening.',
    timestamp: '2024-01-15T10:30:00Z',
    isRead: false,
    priority: 'high',
    category: 'academic'
  },
  {
    id: 'MSG002',
    sender: 'Prof. Priya Singh',
    senderAvatar: 'https://i.pravatar.cc/300?img=20',
    subject: 'Class Schedule Update',
    content: 'Web development class tomorrow is rescheduled to 2:00 PM.',
    timestamp: '2024-01-14T15:45:00Z',
    isRead: true,
    priority: 'medium',
    category: 'academic'
  },
  {
    id: 'MSG003',
    sender: 'Admin Office',
    senderAvatar: 'https://i.pravatar.cc/300?img=30',
    subject: 'Fee Payment Due',
    content: 'Your semester fees are due by January 25th. Please make the payment.',
    timestamp: '2024-01-13T09:00:00Z',
    isRead: true,
    priority: 'high',
    category: 'administrative'
  }
];
