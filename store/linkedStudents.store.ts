import { LinkedStudent } from '../types/linkedStudent.type';

type LinkedState = {
  students: LinkedStudent[];
  selectedId: string | null;
  hydrated: boolean;
};

const emptyState: LinkedState = {
  students: [],
  selectedId: null,
  hydrated: true,
};

export const getLinkedStudentsState = () => emptyState;
export const subscribeLinkedStudents = (listener: () => void) => () => {};
export const findLinkedStudent = (ref?: string | null) => null;
export const inferLinkedStudentFromText = (text: string) => null;
export const hydrateLinkedStudents = async (student: any) => {};
export const switchLinkedStudent = async (ref: string) => false;
export const resetLinkedStudents = async () => {};
export const getSelectedStudentId = () => null;
