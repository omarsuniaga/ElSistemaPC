import { defineStore } from 'pinia'
import type { 
  ScheduleAssignment, 
  ScheduleMetrics, 
  ScheduleCreationRequest,
  ScheduleUpdateRequest,
  ScheduleState
} from '../types/schedule'
import * as scheduleService from '../service/schedules'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { useStudentsStore } from '../../Students/store/students'
import { useClassesStore } from '../../Classes/store/classes'


export const useScheduleStore = defineStore('schedule', {
  state: (): ScheduleState => ({
    schedules: [],
    rooms: [],
    metrics: null,
    loading: false,
    error: null,
    lastSync: null
  }),

  getters: {
    getAllSchedules: (state) => state.schedules,
    
    getScheduleById: (state) => (id: string) => 
      state.schedules.find(schedule => schedule.id === id),
    
    getSchedulesByTeacher: (state) => (teacherId: string) =>
      state.schedules.filter(schedule => schedule.scheduleDay.teacherId === teacherId),
    
    getSchedulesByClass: (state) => (classId: string) =>
      state.schedules.filter(schedule => schedule.scheduleDay.classId === classId),
    
    getSchedulesByStudent: (state) => (studentId: string) =>
      state.schedules.filter(schedule => 
        schedule.scheduleDay.studentIds.includes(studentId)
      ),
    
    getSchedulesByRoom: (state) => (roomId: string) =>
      state.schedules.filter(schedule => schedule.scheduleDay.roomId === roomId),
    
    getTeacherMetrics: (state) => (teacherId: string) =>
      state.metrics?.teacherMetrics.find(metric => metric.teacherId === teacherId),
    
    getClassMetrics: (state) => (classId: string) =>
      state.metrics?.classMetrics.find(metric => metric.classId === classId),
    
    getRoomUtilization: (state) => (roomId: string) =>
      state.metrics?.roomUtilization.find(metric => metric.roomId === roomId),
    
    getGlobalMetrics: (state) => state.metrics?.globalMetrics
  },

  actions: {
    async fetchAllSchedules() {
      this.loading = true
      try {
        const result = await scheduleService.getAllSchedulesFirebase()
        if (result.success && result.data) {
          this.schedules = result.data
          this.lastSync = new Date()
          
          // Also refresh metrics
          await this.calculateMetrics()
        }
        return this.schedules
      } catch (error: any) {
        console.error('Error fetching schedules:', error)
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchScheduleById(id: string) {
      this.loading = true
      try {
        const response = await scheduleService.getScheduleById(id)
        if (response.success && response.data) {
          const populatedSchedule = await this.populateScheduleData(response.data)
          const index = this.schedules.findIndex(s => s.id === id)
          if (index !== -1) {
            this.schedules[index] = populatedSchedule[0]
          } else {
            this.schedules.push(populatedSchedule[0])
          }
        } else {
          throw new Error(response.error || 'Schedule not found')
        }
      } catch (error: any) {
        console.error('Error in fetchScheduleById:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async createSchedule(request: ScheduleCreationRequest) {
      this.loading = true
      try {
        // Verificar conflictos antes de crear
        const conflicts = await scheduleService.getScheduleConflicts(request)
        if (conflicts.length > 0) {
          throw new Error(
            'Conflictos detectados:\n' + 
            conflicts.map(c => c.description).join('\n')
          )
        }

        const response = await scheduleService.createSchedule(request)
        if (response.success && response.data) {
          const populatedSchedule = await this.populateScheduleData(response.data)
          this.schedules.push(populatedSchedule[0])
          await this.calculateMetrics()
        } else {
          throw new Error(response.error || 'Error creating schedule')
        }
      } catch (error: any) {
        console.error('Error in createSchedule:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSchedule(request: ScheduleUpdateRequest) {
      this.loading = true
      try {
        const response = await scheduleService.updateSchedule(request)
        if (response.success && response.data) {
          const populatedSchedule = await this.populateScheduleData(response.data)
          const index = this.schedules.findIndex(s => s.id === request.scheduleId)
          if (index !== -1) {
            this.schedules[index] = populatedSchedule[0]
          }
          await this.calculateMetrics()
        } else {
          throw new Error(response.error || 'Error updating schedule')
        }
      } catch (error: any) {
        console.error('Error in updateSchedule:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteSchedule(id: string) {
      this.loading = true
      try {
        const response = await scheduleService.deleteSchedule(id)
        if (response.success) {
          this.schedules = this.schedules.filter(s => s.id !== id)
          await this.calculateMetrics()
        } else {
          throw new Error(response.error || 'Error deleting schedule')
        }
      } catch (error: any) {
        console.error('Error in deleteSchedule:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Helpers
    async populateScheduleData(schedules: ScheduleAssignment[]) {
      const teachersStore = useTeachersStore()
      const studentsStore = useStudentsStore()
      const classesStore = useClassesStore()

      // Asegurarse de que los stores estén cargados
      await Promise.all([
        teachersStore.fetchTeachers(),
        studentsStore.fetchStudents(),
        classesStore.fetchClasses()
      ])

      return Promise.all(schedules.map(async schedule => {
        const teacher = teachersStore.getTeacherById(schedule.scheduleDay.teacherId)
        const classData = classesStore.classes.find(c => c.id === schedule.scheduleDay.classId)
        const students = schedule.scheduleDay.studentIds
          .map(id => studentsStore.getStudentById(id))
          .filter(s => s) // filter out undefined

        return {
          ...schedule,
          teacher: teacher || {},
          class: classData || {},
          students: students || []
        }
      }))
    },

    async calculateMetrics() {
      if (!this.schedules.length) return

      const metrics: ScheduleMetrics = {
        teacherMetrics: [],
        classMetrics: [],
        roomUtilization: [],
        globalMetrics: {
          totalActiveClasses: 0,
          totalActiveTeachers: 0,
          totalEnrolledStudents: 0,
          averageClassSize: 0,
          roomUtilizationRate: 0
        }
      }

      // Calcular métricas por profesor
      const teacherMap = new Map()
      this.schedules.forEach(schedule => {
        // Handle both flat and nested structures
        const teacherId = schedule.scheduleDay?.teacherId || schedule.teacherId
        const timeSlot = schedule.scheduleDay?.timeSlot || {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          duration: calculateDuration(schedule.startTime, schedule.endTime)
        }
        const studentIds = schedule.scheduleDay?.studentIds || schedule.studentIds || []
        const dayOfWeek = schedule.scheduleDay?.dayOfWeek || schedule.dayOfWeek

        if (!teacherId) {
          console.warn('Schedule missing teacherId:', schedule)
          return
        }

        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            weeklyHours: 0,
            totalClasses: 0,
            totalStudents: 0,
            classesPerDay: {}
          })
        }
        
        const teacherStats = teacherMap.get(teacherId)
        teacherStats.weeklyHours += timeSlot.duration / 60
        teacherStats.totalClasses++
        teacherStats.totalStudents += studentIds.length
        teacherStats.classesPerDay[dayOfWeek] =
          (teacherStats.classesPerDay[dayOfWeek] || 0) + 1
      })

      metrics.teacherMetrics = Array.from(teacherMap.entries()).map(([teacherId, stats]) => ({
        teacherId,
        ...stats
      }))

      // Calcular métricas por clase
      const classMap = new Map()
      this.schedules.forEach(schedule => {
        const classId = schedule.scheduleDay?.classId || schedule.classId
        const studentIds = schedule.scheduleDay?.studentIds || schedule.studentIds || []

        if (!classId) {
          console.warn('Schedule missing classId:', schedule)
          return
        }

        if (!classMap.has(classId)) {
          classMap.set(classId, {
            enrolledStudents: 0,
            averageAttendance: 0,
            scheduleConflicts: 0
          })
        }
        const classStats = classMap.get(classId)
        classStats.enrolledStudents = Math.max(
          classStats.enrolledStudents,
          studentIds.length
        )
      })

      metrics.classMetrics = Array.from(classMap.entries()).map(([classId, stats]) => ({
        classId,
        ...stats
      }))

      // Calcular métricas por salón
      const roomMap = new Map()
      this.schedules.forEach(schedule => {
        const roomId = schedule.scheduleDay?.roomId || schedule.roomId
        const timeSlot = schedule.scheduleDay?.timeSlot || {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          duration: calculateDuration(schedule.startTime, schedule.endTime)
        }

        if (!roomId) {
          console.warn('Schedule missing roomId:', schedule)
          return
        }

        if (!roomMap.has(roomId)) {
          roomMap.set(roomId, {
            usageHours: 0,
            utilizationRate: 0
          })
        }
        const roomStats = roomMap.get(roomId)
        roomStats.usageHours += timeSlot.duration / 60
      })

      metrics.roomUtilization = Array.from(roomMap.entries()).map(([roomId, stats]) => ({
        roomId,
        ...stats,
        utilizationRate: (stats.usageHours / (40 * 4)) * 100 // Asumiendo 40 horas por semana
      }))

      // Calcular métricas globales
      metrics.globalMetrics = {
        totalActiveClasses: classMap.size,
        totalActiveTeachers: teacherMap.size,
        totalEnrolledStudents: Array.from(classMap.values())
          .reduce((total, stats) => total + stats.enrolledStudents, 0),
        averageClassSize: metrics.classMetrics.reduce((sum, metric) => 
          sum + metric.enrolledStudents, 0) / metrics.classMetrics.length || 0,
        roomUtilizationRate: metrics.roomUtilization.reduce((sum, metric) =>
          sum + metric.utilizationRate, 0) / metrics.roomUtilization.length || 0
      }

      this.metrics = metrics
    },

    // Método para forzar una sincronización
    async forceSync() {
      await this.fetchAllSchedules()
    }
  }
})

// Helper function to calculate duration between two time strings (HH:mm)
function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  
  return endTotalMinutes - startTotalMinutes
}