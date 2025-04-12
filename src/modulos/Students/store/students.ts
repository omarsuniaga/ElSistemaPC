import { defineStore } from 'pinia'
import { useScheduleStore } from '../../Schedules/store/schedule'
import type { Student } from "../types/student"
import { getStudentsFirebase, createStudentFirebase, updateStudentFirebase, deleteStudentFirebase } from '../service/students'
import { getAttendanceReport } from '../../Attendance/service/attendance'
import { useClassesStore } from '../../Classes/store/classes'

export const useStudentsStore = defineStore('students', {
  state: () => ({
    students: [] as Student[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null
  }),
  
  getters: {
    items: (state) => state.students,
    
    activeStudents: (state) => {
      return state.students.filter(student => 
        student.activo === true
      )
    },
    
    getStudentByName: (state) => (name: string) => {
      return state.students.find(student => {
        const fullName = `${student.nombre || ''} ${student.apellido || ''}`.trim()
        return fullName.toLowerCase().includes(name.toLowerCase())
      })
    },
    
    getStudentById: (state) => (id: string) => {
      return state.students.find(student => student.id === id)
    },

    getStudentSchedule: (state) => async (studentId: string) => {
      const scheduleStore = useScheduleStore()
      await scheduleStore.fetchAllSchedules()
      
      const studentSchedules = scheduleStore.getSchedulesByStudent(studentId)
      return {
        schedule: studentSchedules.map(schedule => ({
          dayOfWeek: schedule.scheduleDay.dayOfWeek,
          startTime: schedule.scheduleDay.timeSlot.startTime,
          endTime: schedule.scheduleDay.timeSlot.endTime,
          className: schedule.class.name,
          teacherName: schedule.teacher.name,
          room: schedule.room.name
        })),
        totalClasses: studentSchedules.length,
        weeklyHours: studentSchedules.reduce((total, schedule) => 
          total + (schedule.scheduleDay.timeSlot.duration / 60), 0),
        hasConflicts: studentSchedules.some(s => s.conflicts && s.conflicts.length > 0)
      }
    },

    getStudentsByClass: (state) => (classId: string) => {
      if (!classId) return [];
      
      // Primero buscar por studentIds en las clases
      const classesStore = useClassesStore();
      const classData = classesStore.classes.find(c => c.id === classId || c.name === classId);
      
      if (classData?.studentIds?.length) {
        
        // Asegurar que todas las IDs sean strings para la comparación
        const normalizedStudentIds = classData.studentIds.map(id => String(id));
        
        // Buscar estudiantes usando IDs normalizados
        const matchedStudents = state.students.filter(student => 
          normalizedStudentIds.includes(String(student.id))
        );
        
        // Si encontramos estudiantes, retornarlos
        if (matchedStudents.length > 0) {
          return matchedStudents;
        }
      }
      
      // Si no se encuentra por studentIds o no se encontraron estudiantes, buscar en las propiedades del estudiante
      const fallbackStudents = state.students.filter(student => {
        // Verificar si el estudiante tiene la clase asignada en el campo 'clase'
        if (student.clase === classId) return true;
        
        // Verificar en el campo 'grupo' que puede ser un array o un string
        if (student.grupo) {
          if (Array.isArray(student.grupo)) {
            return student.grupo.includes(classId);
          } else if (typeof student.grupo === 'string') {
            return student.grupo === classId;
          }
        }
        
        // Verificar si existe clase y coincide con el classId
        if (student.clase) {
          return student.clase === classId;
        }
        
        return false;
      });
      
      return fallbackStudents;
    },

    getActiveStudents: (state) => {
      return state.students.filter(s => s.activo === true)
    }
  },
  
  actions: {
    async fetchStudents() {
      this.loading = true
      this.error = null
      
      try {
        const students = await getStudentsFirebase()
        this.students = students
        this.lastSync = new Date()
        return this.students
      } catch (error: any) {
        console.error('Error fetching students:', error)
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },
    
    // Función de compatibilidad con el patrón BaseStore
    async fetchItems() {
      return this.fetchStudents()
    },
    
    async addStudent(student: Omit<Student, 'id'>) {
      this.loading = true
      try {
        const newStudent = await createStudentFirebase(student)
        this.students.push(newStudent)
        return newStudent
      } catch (error: any) {
        console.error('Error adding student:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Función de compatibilidad
    async addItem(student: Omit<Student, 'id'>) {
      return this.addStudent(student)
    },
    
    async updateStudent(id: string, updates: Partial<Student>) {
      this.loading = true
      try {
        await updateStudentFirebase(id, updates)
        const index = this.students.findIndex(item => item.id === id)
        if (index !== -1) {
          this.students[index] = { ...this.students[index], ...updates }
        }
        return this.students[index]
      } catch (error: any) {
        console.error('Error updating student:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Función de compatibilidad
    async updateItem(id: string, updates: Partial<Student>) {
      return this.updateStudent(id, updates)
    },
    
    async deleteStudent(id: string) {
      this.loading = true
      try {
        await deleteStudentFirebase(id)
        this.students = this.students.filter(item => item.id !== id)
      } catch (error: any) {
        console.error('Error deleting student:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Función de compatibilidad
    async deleteItem(id: string) {
      return this.deleteStudent(id)
    },
    
    // Método para forzar una sincronización con Firebase
    async forceSync() {
      return this.fetchStudents()
    },

    async assignClass(studentId: string, classId: string) {
      this.loading = true;
      try {
        const student = this.students.find(s => s.id === studentId);
        if (student?.grupo?.includes(classId)) {
          throw new Error('El alumno ya está inscrito en esta clase');
        }
        
        await updateStudentFirebase(studentId, {
          grupo: [...(student?.grupo || []), classId]
        });

        // Update local state
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
          if (!this.students[index].grupo) {
            this.students[index].grupo = [];
          }
          this.students[index].grupo!.push(classId);
        }
      } catch (error: any) {
        console.error('Error assigning class:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getAttendanceReport() {
      try {
        return await getAttendanceReport()
      } catch (error: any) {
        console.error('Error getting attendance report:', error)
        this.error = error.message
        throw error
      }
    }
  }
})
