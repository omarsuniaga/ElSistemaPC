import { defineStore } from 'pinia';

export const useStudentsStore = defineStore('students', {
  state: () => ({
    studentsList: [],
    selectedStudent: null,
    loading: false,
    error: null,
    filters: {
      instrument: '',
      level: ''
    }
  }),
  actions: {
    async fetchStudents() {
      this.loading = true;
      try {
        // API call implementation
      } catch (error) {
        this.error = error;
      } finally {
        this.loading = false;
      }
    },
    setFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters };
    }
  },
  getters: {
    filteredStudents: (state) => {
      return state.studentsList.filter(student => {
        return (
          student.instrument.includes(state.filters.instrument) &&
          student.level.includes(state.filters.level)
        );
      });
    }
  }
});