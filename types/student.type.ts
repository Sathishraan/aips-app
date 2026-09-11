export interface Student {
  // Enrollment Information
  studentId: string;
  studentNumber: string;
  admissionNumber: string;
  admissionType: "NEW" | "TRANSFER" | string;
  admissionDate: string; // Format: YYYY-MM-DD
  academicYear: string; // Format: YYYY-YYYY
  studentStatus: "Active" | "Inactive" | "Suspended" | string;

  // Personal Information
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Other" | string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  bloodGroup: string | null;
  birthPlace: string | null;
  nationality: string;
  citizenship: string;
  motherTongue: string;
  religion: string;
  caste: string;
  subCaste: string | null;
  studentImage: string | null; // URL or base64 encoded image

  // Academic Information
  class: string;
  section: string;
  classJoinedOn: string | null; // Format: YYYY-MM-DD
  group: string;
  emisNumber: string;
  studentExamNumber: string | null;
  promotedStatus: string;

  // Contact Information
  primaryMobile: string;
  secondaryMobile: string;
  email: string | null;

  // Address Information
  currentAddress: {
    addressLine1?: string;
    area: string | null;
    city: string;
    state: string;
    pincode: string | null;
  };
  permanentAddress: {
    addressLine1?: string;
    area: string | null;
    city: string;
    state: string;
    pincode: string | null;
  };

  // Parents Information
  father: {
    name: string;
    qualification: string;
    occupation: string;
    income: number;
    mobile: string;
    email: string | null;
  };
  mother: {
    name: string;
    qualification: string;
    occupation: string;
    income: number;
    mobile: string;
    email: string | null;
  };
}