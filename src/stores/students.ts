import { defineStore } from 'pinia'
import type { Student } from '../types'
import * as studentService from '../services/firestore/students'

export const useStudentsStore = defineStore('students', {
  state: () => ({
    students: [] as Student[],
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    getStudentById: (state) => (id: string) => {
      return state.students.find(student => student.id === id)
    },
    
    getStudentsByClass: (state) => (className: string) => {
      return state.students.filter(student => 
        Array.isArray(student.grupo) && student.grupo.includes(className)
      )
    }
  },

  actions: {
    async fetchStudents() {
      this.isLoading = true
      this.error = null

      try {
        console.log('🔍 Iniciando búsqueda de estudiantes...')
        this.students = await studentService.getStudents()
        console.log(`📝 Se encontraron ${this.students.length} estudiantes`)
        return this.students
      } catch (error: any) {
        console.error('❌ Error al cargar estudiantes:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async addStudent(student: Omit<Student, 'id'>) {
      this.isLoading = true
      this.error = null

      try {
        const newStudent = await studentService.createStudent(student)
        this.students.push(newStudent)
        return newStudent
      } catch (error: any) {
        console.error('❌ Error al añadir estudiante:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateStudent(id: string, student: Partial<Student>) {
      this.isLoading = true
      this.error = null

      try {
        await studentService.updateStudent(id, student)
        const index = this.students.findIndex(s => s.id === id)
        if (index !== -1) {
          this.students[index] = {
            ...this.students[index],
            ...student
          }
        }
        return true
      } catch (error: any) {
        console.error(`❌ Error al actualizar estudiante ${id}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteStudent(id: string) {
      this.isLoading = true
      this.error = null
      
      try {
        await studentService.deleteStudent(id)
        this.students = this.students.filter(student => student.id !== id)
        return true
      } catch (error: any) {
        console.error(`❌ Error al eliminar estudiante ${id}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchStudentGroups() {
      this.isLoading = true
      this.error = null
      try {
        // Objeto para almacenar la cantidad de estudiantes por grupo (tal como vienen)
        const groupCounts: Record<string, number> = {}
    
        // Iterar sobre todos los estudiantes
        this.students.forEach((student) => {
          if (student.grupo && Array.isArray(student.grupo)) {
            student.grupo.forEach((grupo) => {
              groupCounts[grupo] = (groupCounts[grupo] || 0) + 1
            })
          }
        })
        
        console.log('🔍 Original - Grupos de estudiantes encontrados:', groupCounts)
        
        // Función para normalizar el nombre del grupo (remover corchetes, comillas y espacios)
        const normalizeGroupName = (name: string): string => {
          return name.replace(/[\[\]"']/g, '').trim()
        }
        
        // Objeto para almacenar los grupos normalizados
        const normalizedCounts: Record<string, number> = {}
        
        Object.keys(groupCounts).forEach((originalKey) => {
          const key = normalizeGroupName(originalKey)
          normalizedCounts[key] = (normalizedCounts[key] || 0) + groupCounts[originalKey]
        })
        
        console.log('🔍 Normalizado - Grupos de estudiantes encontrados:', normalizedCounts)
        return normalizedCounts
      } catch (error: any) {
        console.error('❌ Error al cargar grupos de estudiantes:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    // buscar alumnos segun la id
    async fetchStudentById(id: string) {
      this.isLoading = true
      this.error = null

      try {
        console.log('🔍 Buscando estudiante por ID:', id)
        const student = await studentService.getStudentById(id)
        console.log('🔍 Estudiante encontrado:', student)
        return student
      } catch (error: any) {
        console.error(`❌ Error al cargar estudiante ${id}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Obtiene estudiantes por un array de IDs
     * @param ids Array de IDs de estudiantes a buscar
     * @returns Array de estudiantes que coinciden con los IDs proporcionados
     */
    fetchStudentsByIds(ids: string[]): Student[] {
      if (!ids || ids.length === 0) return [];
      
      // Filtrar estudiantes que coinciden con los IDs proporcionados
      return this.students.filter(student => ids.includes(student.id));
    },
    

  }
})
