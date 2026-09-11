import { isAdmin, isEmployee, isPrincipal, isStudent, useUser } from './useUser';
import {
  BrandColors,
  HeaderGradient,
  getHeaderGradient,
  getRoleColors,
} from '../theme/appTheme';

export const isStaffSession = (user: any) => {
  if (!user || isStudent(user)) return false;
  return isEmployee(user) || isPrincipal(user) || isAdmin(user);
};

export const useRoleColors = (): BrandColors & {
  isStaff: boolean;
  headerGradient: HeaderGradient;
  headerStart: { x: number; y: number };
  headerEnd: { x: number; y: number };
} => {
  const { user } = useUser();
  const isStaff = isStaffSession(user);
  return {
    ...getRoleColors(isStaff),
    isStaff,
    headerGradient: getHeaderGradient(isStaff),
    headerStart: { x: 0, y: 0 },
    headerEnd: isStaff ? { x: 0, y: 1 } : { x: 1, y: 1 },
  };
};
