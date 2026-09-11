export interface Employee {
    // Personal Information
    employeeId: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    email: string | null;
    mobile: string;
    gender: "male" | "female" | "Other" | string;
    dateOfBirth: string; // Format: YYYY-MM-DD
    bloodGroup: string | null;

    // Job Information
    designation: string;
    department: string;
    joiningDate: string;
    qualification: string | null;
    experience: string | null;

    // Address Information
    address: {
        addressLine1: string;
        city: string;
        state: string;
        pincode: string | null;
    };

    bankDetails?: {
        bankName: string;
        accountNo: string;
        ifsc: string;
        holderName: string;
    };

    photo: string | null;
}
