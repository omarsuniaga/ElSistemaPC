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
    }
  }
})
