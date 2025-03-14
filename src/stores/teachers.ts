import { defineStore } from 'pinia'
import type { Teacher } from '../types'
import * as teacherService from '../services/firestore/teachers'
import { useAttendanceStore } from './attendance'

export const useTeachersStore = defineStore('teachers', {
  state: () => ({
    teachers: [] as Teacher[],
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    getTeacherById: (state) => (id: string) => {
      return state.teachers.find(teacher => teacher.id === id)
    }
  },

  actions: {
    async fetchTeachers() {
      this.isLoading = true
      this.error = null

      try {
        console.log('🔍 Iniciando búsqueda de maestros...')
        this.teachers = await teacherService.getTeachers()
        console.log(`📝 Se encontraron ${this.teachers} maestros`)
        return this.teachers
      } catch (error: any) {
        console.error('❌ Error al cargar maestros:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async addTeacher(teacher: Omit<Teacher, 'id'>) {
      this.isLoading = true
      this.error = null

      try {
        const newTeacher = await teacherService.createTeacher(teacher)
        this.teachers.push(newTeacher)
        return newTeacher
      } catch (error: any) {
        console.error('❌ Error al añadir maestro:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateTeacher(id: string, teacher: Partial<Teacher>) {
      this.isLoading = true
      this.error = null

      try {
        await teacherService.updateTeacher(id, teacher)
        console.log('🔄 Actualizando maestro:', teacher);
        
        const index = this.teachers.findIndex(t => t.id === id)
        if (index !== -1) {
          this.teachers[index] = {
            ...this.teachers[index],
            ...teacher
          }
        }
        return true
      } catch (error: any) {
        console.error(`❌ Error al actualizar maestro ${id}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteTeacher(id: string) {
      this.isLoading = true
      this.error = null
      
      try {
        await teacherService.deleteTeacher(id)
        this.teachers = this.teachers.filter(teacher => teacher.id !== id)
        return true
      } catch (error: any) {
        console.error(`❌ Error al eliminar maestro ${id}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Statistics computation methods
    async getClassStudents(className: string) {
      try {
        // const firestoreStore = useFirestoreStore()
        // const students = await firestoreStore.getStudentsByClass(className)
        // return students || []
        return className
      } catch (error) {
        console.error('Error getting class students:', error)
        return []
      }
    },

    getTeacherAttendanceRate(teacherId: string) {
      const attendanceStore = useAttendanceStore()
      const teacher = this.getTeacherById(teacherId)
      if (!teacher) return 0

      let totalAttendance = 0
      let totalClasses = 0

      // Use optional chaining since clases might be undefined
      teacher.clases?.forEach(className => {
        const records = attendanceStore.records.filter(r => r.className === className)
        if (records.length > 0) {
          const presentCount = records.filter(r => r.status === 'Presente' || r.status === 'Justificado').length
          const rate = (presentCount / records.length) * 100
          totalAttendance += rate
          totalClasses++
        }
      })

      return totalClasses > 0 ? Math.round(totalAttendance / totalClasses) : 0
    },

    getTeacherClassesCount(teacherId: string) {
      const attendanceStore = useAttendanceStore()
      const teacher = this.getTeacherById(teacherId)
      if (!teacher) return 0

      let totalClasses = 0

      // Use optional chaining since clases might be undefined
      teacher.clases?.forEach(className => {
        const records = attendanceStore.records.filter(r => r.className === className)
        totalClasses += records.length
      })

      return totalClasses
    },

    getClassAttendance(className: string) {
      const attendanceStore = useAttendanceStore()
      const records = attendanceStore.records.filter(r => r.className === className)
      if (records.length === 0) return 0

      const presentCount = records.filter(r => r.status === 'Presente' || r.status === 'Justificado').length
      return Math.round((presentCount / records.length) * 100)
    }
  }
})
