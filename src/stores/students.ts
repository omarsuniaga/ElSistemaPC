import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import type { Student } from '../types'
import * as studentService from '../services/firestore/students'

export const useStudentsStore = defineStore('students', {
  state: () => ({
    students: [] as Student[],
    isLoading: false,
    error: null as string | null
  }),

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
      this.isLoading = true;
      this.error = null;

      try {
        // Verificar que el id sea un string
        if (typeof id !== 'string') {
          throw new Error('El ID debe ser un string');
        }

        // Verificar que student tenga la estructura correcta
        if (student && typeof student.grupo !== 'undefined' && !Array.isArray(student.grupo)) {
          throw new Error('La propiedad grupo debe ser un array');
        }

        await studentService.updateStudent(id, student);
        const index = this.students.findIndex(s => s.id === id);
        if (index !== -1) {
          this.students[index] = {
            ...this.students[index],
            ...student
          };
        }
        return true;
      } catch (error: any) {
        console.error(`❌ Error al actualizar estudiante ${id}:`, error);
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
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

    getStudentsByClass(className: string): Student[] {
      // Primero intentamos buscar por la propiedad 'clase'
      const studentsByClase = this.students.filter(student => student.clase === className);
      if (studentsByClase.length > 0) {
        return studentsByClase;
      }
      
      // Si no encontramos estudiantes, buscamos por la propiedad 'grupo'
      return this.students.filter(student => 
        student.grupo && 
        Array.isArray(student.grupo) && 
        student.grupo.includes(className)
      );
    }
  }
})
