import { defineStore } from 'pinia'
import type { 
  ScheduleAssignment, 
  ScheduleMetrics, 
  ScheduleCreationRequest,
  ScheduleUpdateRequest,
  ScheduleState,
  Schedule
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
          // Ensure result.data matches the Schedule type before assignment
          const validSchedules = result.data.map(schedule => {
            // Type guard to check if schedule has the expected Schedule shape
            if (!('scheduleDay' in schedule)) {
              throw new Error('Invalid schedule data: missing scheduleDay')
            }
            // Validate the schedule object matches Schedule type
            const typedSchedule = schedule as unknown as Schedule
            // Check if scheduleDay exists and has required properties
            if (!typedSchedule || !('scheduleDay' in typedSchedule) || !typedSchedule.scheduleDay) {
              throw new Error('Invalid schedule data: scheduleDay is null or undefined')
            }
            return typedSchedule
          })
          
          // Populate the required fields before assigning to schedules
          this.schedules = validSchedules.map(schedule => ({
            ...schedule,
            class: null, // Will be populated by populateScheduleData
            teacher: null, // Will be populated by populateScheduleData
            students: [], // Will be populated by populateScheduleData
            room: null // Will be populated by populateScheduleData
          }))
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

        const scheduleData: Omit<Schedule, 'id'> = {
          startTime: request.timeSlot.startTime,
          endTime: request.timeSlot.endTime,
          ...request
        };
        const response = await scheduleService.createSchedule(scheduleData)
        if (response && response.id) {
          // Create a complete ScheduleAssignment object with required properties
          const scheduleAssignment: ScheduleAssignment = {
            ...response,
            scheduleDay: response.scheduleDay,
            class: null,
            teacher: null,
            students: [],
            room: null
          }
          const populatedSchedule = await this.populateScheduleData([scheduleAssignment])
          this.schedules.push(populatedSchedule[0])
          await this.calculateMetrics()
        } else {
          throw new Error('Error creating schedule')
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
        const response = await scheduleService.updateSchedule(request.scheduleId, {
          scheduleId: request.scheduleId,
          status: request.status,
          // Remove notes property since it's not defined in ScheduleUpdateRequest type
        })
        if (!response || !response.success) {
          throw new Error('Failed to update schedule')
        }
        const populatedSchedule = await this.populateScheduleData([response.data])
        const index = this.schedules.findIndex(s => s.id === request.scheduleId)
        if (index !== -1) {
          this.schedules[index] = populatedSchedule[0]
        }
        await this.calculateMetrics()
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
        await scheduleService.deleteSchedule(id)
        this.schedules = this.schedules.filter(s => s.id !== id)
        await this.calculateMetrics()
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
      if (!schedules || !schedules.length) return []

      const teachersStore = useTeachersStore()
      const studentsStore = useStudentsStore()
      const classesStore = useClassesStore()

      // Cache frequently accessed data
      const teacherCache = new Map<string, any>()
      const studentCache = new Map<string, any>()
      const classCache = new Map<string, any>()

      // Batch load all required data
      const teacherIds = new Set<string>()
      const studentIds = new Set<string>()
      const classIds = new Set<string>()

      schedules.forEach(schedule => {
        if (schedule.scheduleDay?.teacherId) teacherIds.add(schedule.scheduleDay.teacherId)
        if (schedule.scheduleDay?.classId) classIds.add(schedule.scheduleDay.classId)
        schedule.scheduleDay?.studentIds?.forEach(id => studentIds.add(id))
      })

      await Promise.all([
        teachersStore.fetchTeachers(),
        studentsStore.fetchStudents(),
        classesStore.fetchClasses()
      ])

      // Populate caches
      teachersStore.teachers?.forEach(teacher => teacherCache.set(teacher.id, teacher))
      studentsStore.students?.forEach(student => studentCache.set(student.id, student))
      classesStore.classes?.forEach(class_ => classCache.set(class_.id, class_))

      return schedules.map(schedule => {
        const teacher = schedule.scheduleDay?.teacherId ? teacherCache.get(schedule.scheduleDay.teacherId) : null
        const class_ = schedule.scheduleDay?.classId ? classCache.get(schedule.scheduleDay.classId) : null
        const students = schedule.scheduleDay?.studentIds
          ?.map(id => studentCache.get(id))
          .filter(Boolean) || []

        return {
          ...schedule,
          teacher,
          class: class_,
          students,
          // Add derived data for easier access
          teacherName: teacher?.name,
          className: class_?.name,
          studentNames: students.map(s => s.name)
        }
      })
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
        const teacherId = schedule.scheduleDay?.teacherId || schedule.teacher?.id
        const timeSlot = schedule.scheduleDay?.timeSlot || {
          startTime: schedule.scheduleDay?.timeSlot?.startTime,
          endTime: schedule.scheduleDay?.timeSlot?.endTime,
          duration: calculateDuration(schedule.scheduleDay.timeSlot.startTime, schedule.scheduleDay.timeSlot.endTime)
        }
const studentIds = schedule.scheduleDay?.studentIds || schedule.students?.map(s => s.id) || []
        const dayOfWeek = schedule.scheduleDay?.dayOfWeek

        if (!teacherId) {
          console.warn('Schedule missing teacherId:', schedule)
          return
        }
        
        // Validate teacherId format
        if (typeof teacherId !== 'string' || teacherId.trim() === '') {
          console.warn('Invalid teacherId format:', teacherId)
          return
        }
        
        // Validate time slot
        if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
          console.warn('Schedule missing time values:', schedule)
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
        const classId = schedule.scheduleDay?.classId || schedule.class?.id
        const studentIds = schedule.scheduleDay?.studentIds || schedule.students?.map(s => s.id) || []

        if (!classId) {
          console.warn('Schedule missing classId:', schedule)
          return
        }
        
        // Validate classId format
        if (typeof classId !== 'string' || classId.trim() === '') {
          console.warn('Invalid classId format:', classId)
          return
        }
        
        // Validate student IDs
        if (!Array.isArray(studentIds)) {
          console.warn('Invalid studentIds format:', schedule)
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
const roomId = schedule.scheduleDay?.roomId || schedule.room?.id
        const timeSlot = schedule.scheduleDay?.timeSlot || {
          startTime: schedule.scheduleDay.timeSlot.startTime,
          endTime: schedule.scheduleDay.timeSlot.endTime,
          duration: calculateDuration(schedule.scheduleDay.timeSlot.startTime, schedule.scheduleDay.timeSlot.endTime)
        }

        if (!roomId) {
          console.warn('Schedule missing roomId:', schedule)
          return
        }
        
        // Validate roomId format
        if (typeof roomId !== 'string' || roomId.trim() === '') {
          console.warn('Invalid roomId format:', roomId)
          return
        }
        
        // Validate time slot
        if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
          console.warn('Schedule missing time values:', schedule)
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
  if (!startTime || !endTime) {
    console.warn('Invalid time values:', {startTime, endTime})
    return 0
  }
  
  // Validate time format (HH:mm)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    console.warn('Invalid time format:', {startTime, endTime})
    return 0
  }
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  
  return endTotalMinutes - startTotalMinutes
}