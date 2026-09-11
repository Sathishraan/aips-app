export const useLinkedStudents = () => {
  return {
    students: [],
    selected: null,
    selectedId: null,
    canSwitch: false,
    hydrated: true,
    selectedName: '',
    switchTo: async () => false,
  };
};
