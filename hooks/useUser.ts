import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getData, updateData, uploadData, getAuthenticatedUrl } from '../api/generic.api';
import { getAuthToken } from '../api/base';
import { getSelectedStudentId } from '../api/selectedStudent';
import { updateActiveAccountProfile } from '../store/savedAccounts.store';
import { Student } from '../types/student.type';
import { Employee } from '../types/employee.type';
import { Admin } from '../types/admin.type';

// Define a union type for the user
export type UserType = Student | Employee | Admin;

// Helper type guards to narrow down the user type
export const isStudent = (user: any): user is Student => {
  return user && (user as Student).studentId !== undefined;
};

export const isEmployee = (user: any): user is Employee => {
  return user && (user as Employee).employeeId !== undefined;
};

export const isAdmin = (user: any): user is Admin => {
  return user && (user as Admin).role !== undefined;
};

export const isPrincipal = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  const designation = (user.designation || '').toString().toLowerCase();
  const userType = (user.userType || user.user_type || '').toString().toLowerCase();
  const username = (user.username || user.name || '').toString().toLowerCase();
  const name = (user.firstName ? `${user.firstName} ${user.lastName}` : user.name || '').toString().toLowerCase();
  
  return (
    role.includes('principal') ||
    designation.includes('principal') ||
    userType.includes('principal') ||
    role === 'super admin' ||
    role === '1' ||
    username.includes('principal') ||
    name.includes('principal')
  );
};


// Transform API response (snake_case) to Student interface (camelCase)
const mapApiResponseToStudent = (data: any): Student => {
  return {
    // Enrollment Information
    studentId: data.stud_id || '',
    studentNumber: data.stud_no || '',
    admissionNumber: data.admission_no || '',
    admissionType: data.admission_type?.toUpperCase() || 'NEW',
    admissionDate: data.stud_admission_date || '',
    academicYear: data.stud_academic_year || '',
    studentStatus: data.stud_status === '1' ? 'Active' : 'Inactive',

    // Personal Information
    firstName: data.stud_firstname || '',
    lastName: data.stud_lastname || '',
    gender: data.stud_gender || '',
    dateOfBirth: data.stud_dob || '',
    bloodGroup: data.stud_bloodgroup || null,
    birthPlace: data.stud_birth_place || null,
    nationality: data.stud_nationality || '',
    citizenship: data.stud_citizenship || '',
    motherTongue: data.stud_language || '',
    religion: data.stud_religion || '',
    caste: data.stud_caste || '',
    subCaste: data.stud_subcaste || null,
    studentImage: data.stud_photo ? getAuthenticatedUrl(data.stud_photo) : null,

    // Academic Information
    class: data.stud_class || '',
    section: data.stud_section || '',
    classJoinedOn: data.class_joined_on || null,
    group: data.group || data.stud_grouplist || '',
    emisNumber: data.stud_emis_no || data.student_emis_num || '',
    studentExamNumber: data.student_exam_no || null,
    promotedStatus: data.promoted_status || '',

    // Contact Information
    primaryMobile: data.stud_phoneno_first || '',
    secondaryMobile: data.stud_phone_second || '',
    email: data.stud_email || null,

    // Address Information
    currentAddress: {
      addressLine1: data.stud_address_first || '',
      area: data.stud_area || null,
      city: data.stud_city || '',
      state: data.stud_state || '',
      pincode: data.stud_pincode || null,
    },
    permanentAddress: {
      addressLine1: data.stud_address_second || '',
      area: data.stud_per_area || null,
      city: data.stud_per_city || '',
      state: data.stud_per_state || '',
      pincode: data.stud_per_pincode || null,
    },

    // Parents Information
    father: {
      name: data.father_name || '',
      qualification: data.father_qualification || '',
      occupation: data.father_occupation || '',
      income: parseFloat(data.father_income) || 0,
      mobile: data.father_mobileno || '',
      email: data.father_emailid || null,
    },
    mother: {
      name: data.mother_name || '',
      qualification: data.mother_qualification || '',
      occupation: data.mother_occupation || '',
      income: parseFloat(data.mother_income) || 0,
      mobile: data.mother_mobileno || '',
      email: data.mother_emailid || null,
    },
  };
};

const mapApiResponseToEmployee = (data: any): Employee => {
  const isPrinc = (data.emp_designation || data.designation || '').toString().toLowerCase().includes('principal') ||
                  (data.role || '').toString().toLowerCase().includes('principal');
  return {
    employeeId: data.emp_id || '',
    employeeNo: data.emp_no || data.employee_work_id || '',
    firstName: data.emp_name || '',
    lastName: data.emp_lastname || '',
    email: data.emp_prf_email || data.emp_email || null,
    mobile: data.emp_mobile || '',
    gender: data.emp_gender || '',
    dateOfBirth: data.emp_dob || '',
    bloodGroup: data.emp_bloodgroup || null,
    designation: isPrinc ? 'Principal' : (data.emp_designation || ''),
    department: data.emp_department || '',
    joiningDate: data.emp_joining_date || '',
    qualification: data.emp_qualification || null,
    experience: data.experience_outside || data.experience_ourschool || null,
    address: {
      addressLine1: data.emp_permenant_address || '',
      city: data.emp_permenant_city || '',
      state: data.emp_permenant_state || '',
      pincode: data.emp_permenant_pincode || null,
    },
    bankDetails: {
      bankName: data.bank_name || '',
      accountNo: data.bank_ac_no || '',
      ifsc: data.ifsc_code || '',
      holderName: data.acc_holder_name || '',
    },
    photo: (data.emp_photo || data.photo) ? getAuthenticatedUrl(data.emp_photo || data.photo) : null,
  };
};

const mapApiResponseToAdmin = (data: any): Admin => {
  const isPrinc = (data.role || '').toString().toLowerCase().includes('principal') ||
                  (data.designation || '').toString().toLowerCase().includes('principal') ||
                  (data.username || '').toString().toLowerCase().includes('principal') ||
                  (data.name || '').toString().toLowerCase().includes('principal') ||
                  data.role === '1' || data.is_principal;
  return {
    adminId: data.admin_id || '',
    name: data.username || data.name || (isPrinc ? 'Principal' : 'Admin'),
    email: data.email || '',
    mobile: data.mobile || '',
    role: (isPrinc ? 'Principal' : (data.role === '1' ? 'Super Admin' : 'Admin')) as Admin['role'],
    photo: data.photo ? getAuthenticatedUrl(data.photo) : null
  }
}

export const useUser = () => {
  const queryClient = useQueryClient();
  const profileUrl = 'api/user/details';
  const updatePhotoUrl = 'api/profile/update/photo';
  const token = getAuthToken();
  const selectedId = getSelectedStudentId();

  const userQuery = useQuery({
    queryKey: ['userProfile', token, selectedId],
    queryFn: async () => {
      if (!token) return null;
      const rawData = await getData<any>(profileUrl);
      if (typeof rawData === 'string' && rawData.includes('<!DOCTYPE html>')) {
        throw new Error('Invalid server HTML response');
      }
      const userData = rawData?.data || rawData;
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data received');
      }

      if (userData.stud_id) {
        return {
          ...mapApiResponseToStudent(userData),
          stud_id: userData.stud_id,
          stud_no: userData.stud_no,
          user_id: userData.user_id || userData.id,
          mapId: userData.mapId || userData.map_id,
          id: userData.id || userData.user_id,
          username: userData.username || userData.user_name,
        };
      } else if (userData.emp_id) {
        return {
          ...mapApiResponseToEmployee(userData),
          emp_id: userData.emp_id,
          emp_no: userData.emp_no || userData.employee_work_id,
          employee_work_id: userData.employee_work_id,
          user_id: userData.user_id || userData.id,
          mapId: userData.mapId || userData.map_id,
          id: userData.id || userData.user_id,
          username: userData.username || userData.user_name,
        };
      } else if (userData.admin_id || userData.role) {
        return {
          ...mapApiResponseToAdmin(userData),
          admin_id: userData.admin_id,
          user_id: userData.user_id || userData.id,
          mapId: userData.mapId || userData.map_id,
          id: userData.id || userData.user_id,
          username: userData.username || userData.user_name,
        };
      }
      return null;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (userQuery.data) {
      const u = userQuery.data;
      let name = '';
      let photo: string | null = null;
      let role = '';
      let studentId: string | undefined = undefined;

      if (isStudent(u)) {
        name = `${u.firstName} ${u.lastName}`.trim();
        photo = u.studentImage;
        role = `Student ${u.class ? `(${u.class} ${u.section})` : ''}`.trim();
        studentId = u.studentId;
      } else if (isEmployee(u)) {
        name = `${u.firstName} ${u.lastName}`.trim();
        photo = u.photo;
        role = u.designation || 'Staff';
      } else if (isAdmin(u)) {
        name = u.name;
        photo = u.photo;
        role = u.role;
      }

      if (name) {
        updateActiveAccountProfile({ name, photo, role, studentId });
      }
    }
  }, [
    userQuery.data
      ? `${(userQuery.data as any).studentId || (userQuery.data as any).employeeId || (userQuery.data as any).adminId || ''}_${(userQuery.data as any).firstName || (userQuery.data as any).name || ''}_${(userQuery.data as any).studentImage || (userQuery.data as any).photo || ''}`
      : null
  ]);

  const updateProfileImageMutation = useMutation({
    mutationFn: ({
      image,
    }: {
      image: {
        uri: string;
        type: string;
        name: string;
      };
    }) => {
      const formData = new FormData();

      // MUST match backend: getFile('profile_image')
      formData.append('profile_image', image as any);

      return uploadData<any>(updatePhotoUrl, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });


  return {
    user: userQuery.data || null,
    isLoading: userQuery.isLoading,
    isPending: userQuery.isPending,
    isFetching: userQuery.isFetching,
    status: userQuery.status,
    error: userQuery.error,

    updateProfileImage: updateProfileImageMutation.mutate,
    isUpdatingImage: updateProfileImageMutation.isPending,
    updateImageError: updateProfileImageMutation.error,

    refetch: userQuery.refetch,

    // Type guards aliases for convenience
    isStudent: (user: any) => isStudent(user),
    isEmployee: (user: any) => isEmployee(user),
    isAdmin: (user: any) => isAdmin(user),
    isPrincipal: (user: any) => isPrincipal(user),
  };
};

// Backwards compatibility alias if needed, but better to update consumers
export const useStudent = useUser;