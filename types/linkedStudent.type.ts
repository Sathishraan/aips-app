export interface LinkedStudent {
  studentId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  class: string;
  section: string;
  academicYear: string;
  studentImage: string | null;
  fatherName: string;
  motherName: string;
  fatherMobile: string;
  motherMobile: string;
  primaryMobile: string;
  secondaryMobile: string;
}

export const linkedStudentFullName = (student: LinkedStudent) =>
  `${student.firstName} ${student.lastName}`.trim() || 'Student';
