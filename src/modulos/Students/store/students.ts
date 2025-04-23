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
        // Importar dinámicamente para evitar problemas de dependencia circular
        const { getStudentsFirebase } = await import('../service/students')
        this.students = await getStudentsFirebase()
        console.log(`📚 Store: ${this.students.length} estudiantes cargados`)
      } catch (error) {
        this.error = error.message || 'Error fetching students'
        console.error('Error fetching students:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Obtiene los estudiantes pertenecientes a una clase específica.
     * Primero busca en los estudiantes ya cargados que tengan la clase en su array 'grupo'.
     * Luego, si hay una implementación de Firestore disponible, la usa como fallback.
     * @param className Nombre o ID de la clase
     * @returns Lista de estudiantes pertenecientes a la clase
     */
    getStudentsByClass(className) {
      // Verificar si tenemos estudiantes cargados en el store
      if (this.students.length > 0) {
        // Primero buscar estudiantes que tienen esta clase en su array 'grupo'
        const studentsInClass = this.students.filter(student => 
          (student.grupo && Array.isArray(student.grupo) && student.grupo.includes(className)) ||
          (student.clase && (
            (Array.isArray(student.clase) && student.clase.includes(className)) ||
            student.clase === className
          )) ||
          (student.classIds && Array.isArray(student.classIds) && student.classIds.includes(className))
        );
        
        if (studentsInClass.length > 0) {
          return studentsInClass;
        }
      }

      // Como fallback, si no se encuentra nada, devolver un array vacío
      // La vista puede tener su propia lógica de fallback
      return [];
    }
    // Add other actions as needed
  }
})
