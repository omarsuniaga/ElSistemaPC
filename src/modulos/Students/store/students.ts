import { defineStore } from 'pinia'

export const useStudentsStore = defineStore('students', {
  state: () => ({
    students: [],
    loading: false,
    error: null
  }),
  getters: {
    getStudentById: (state) => (id) => {
      return state.students.find(student => student.id === id)
    }
  },
  actions: {
    async fetchStudents() {
      this.loading = true
      this.error = null
      try {
        // Implement fetch logic here
        // this.students = await fetchFromDB()
      } catch (error) {
        this.error = error.message || 'Error fetching students'
        console.error('Error fetching students:', error)
      } finally {
        this.loading = false
      }
    }
    // Add other actions as needed
  }
})
