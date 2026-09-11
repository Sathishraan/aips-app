/** Currently selected student for parent Switch User (module-level, used by API layer). */

export type SelectedStudentIds = {
  studentId: string | null;
  studentNumber: string | null;
};

let selected: SelectedStudentIds = {
  studentId: null,
  studentNumber: null,
};

export const setSelectedStudentIds = (next: SelectedStudentIds) => {
  selected = {
    studentId: next.studentId ? String(next.studentId) : null,
    studentNumber: next.studentNumber ? String(next.studentNumber) : null,
  };
};

export const getSelectedStudentIds = (): SelectedStudentIds => selected;

export const getSelectedStudentId = (): string | null =>
  selected.studentId || selected.studentNumber || null;

export const clearSelectedStudentIds = () => {
  selected = { studentId: null, studentNumber: null };
};
