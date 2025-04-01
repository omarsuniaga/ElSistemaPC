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

// Definición de tipos internos para métricas (opcional, para mejorar el tipeo)
type TeacherStats = {
  weeklyHours: number;
  totalClasses: number;
  totalStudents: number;
  classesPerDay: Record<string, number>;
}

type ClassStats = {
  enrolledStudents: number;
  averageAttendance: number;
  scheduleConflicts: number;
}

type RoomStats = {
  usageHours: number;
  utilizationRate: number;
}

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
    /**
     * fetchAllSchedules: Recupera todos los horarios desde Firebase.
     * Filtra aquellos objetos que no tengan la propiedad scheduleDay y asigna los horarios válidos.
     * Actualiza las métricas y la fecha de última sincronización.
     */
    async fetchAllSchedules() {
      this.loading = true
      try {
        const result = await scheduleService.getAllSchedulesFirebase()
        if (result.success && result.data) {
          // Filtrar solo los horarios que tienen scheduleDay definido
          const validSchedules = result.data.filter((schedule: any) => {
            if (!schedule.scheduleDay) {
              console.warn('Horario inválido detectado (falta scheduleDay):', schedule)
              return false
            }
            
            // Validar estructura básica de scheduleDay
            if (!schedule.scheduleDay.dayOfWeek || !schedule.scheduleDay.timeSlot || 
                !schedule.scheduleDay.timeSlot.startTime || !schedule.scheduleDay.timeSlot.endTime) {
              console.warn('Estructura de scheduleDay inválida:', schedule)
              return false
            }
            
            return true
          }).map((schedule: any) => schedule as Schedule)

          // Asignar propiedades adicionales que se poblarán después (por ejemplo, datos de clase, profesor, estudiantes y salón)
          this.schedules = validSchedules.map(schedule => ({
            ...schedule,
            class: null,   // Se poblará con populateScheduleData
            teacher: null, // Se poblará con populateScheduleData
            students: [],  // Se poblará con populateScheduleData
            room: null     // Se poblará con populateScheduleData
          }))
          this.lastSync = new Date()
          
          // Recalcular métricas basadas en los horarios válidos
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

    /**
     * fetchScheduleById: Recupera un horario específico por ID y lo actualiza o agrega al estado.
     */
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

    /**
     * createSchedule: Crea un nuevo horario a partir de los datos del request.
     * Verifica conflictos antes de crear el horario.
     */
    // En schedule.ts (store de schedules)
// En schedule.ts (store de schedules)
async createSchedule(request: ScheduleCreationRequest) {
  this.loading = true;
  try {
    // Llama al servicio que crea el schedule
    const response = await scheduleService.createSchedule(request);
    if (response.success && response.data) {
      // Se puede poblar la información extra si fuera necesario
      this.schedules.push(response.data[0]); // Suponiendo que response.data es un array
      await this.calculateMetrics();
      return response.data;
    } else {
      throw new Error(response.error || 'Error creating schedule');
    }
  } catch (error: any) {
    console.error('Error in createSchedule:', error);
    this.error = error.message;
    throw error;
  } finally {
    this.loading = false;
  }
},

    /**
     * updateSchedule: Actualiza un horario existente.
     * Se espera que request contenga scheduleId y los campos a actualizar.
     */
    async updateSchedule(request: ScheduleUpdateRequest) {
      this.loading = true
      try {
        const response = await scheduleService.updateSchedule(request.scheduleId, {
          scheduleId: request.scheduleId,
          status: request.status,
          // Otras propiedades a actualizar se pueden agregar aquí
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

    /**
     * deleteSchedule: Elimina un horario a partir de su ID.
     */
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

    /**
     * populateScheduleData: Enriquecer un arreglo de horarios (ScheduleAssignment)
     * agregando datos de profesores, estudiantes, clases y salón.
     * Retorna un arreglo de horarios con datos derivados (por ejemplo, teacherName, className, studentNames).
     */
    async populateScheduleData(schedules: ScheduleAssignment[]): Promise<ScheduleAssignment[]> {
      if (!schedules || !schedules.length) return []

      const teachersStore = useTeachersStore()
      const studentsStore = useStudentsStore()
      const classesStore = useClassesStore()

      // Caches para evitar búsquedas repetidas
      const teacherCache = new Map<string, any>()
      const studentCache = new Map<string, any>()
      const classCache = new Map<string, any>()

      // Recopilar todos los IDs necesarios
      const teacherIds = new Set<string>()
      const studentIds = new Set<string>()
      const classIds = new Set<string>()

      schedules.forEach(schedule => {
        if (schedule.scheduleDay?.teacherId) teacherIds.add(schedule.scheduleDay.teacherId)
        if (schedule.scheduleDay?.classId) classIds.add(schedule.scheduleDay.classId)
        schedule.scheduleDay?.studentIds?.forEach(id => studentIds.add(id))
      })

      // Cargar datos en paralelo
      await Promise.all([
        teachersStore.fetchTeachers(),
        studentsStore.fetchStudents(),
        classesStore.fetchClasses()
      ])

      // Poblar las caches
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
          // Datos derivados para facilitar el acceso
          teacherName: teacher?.name,
          className: class_?.name,
          studentNames: students.map((s: any) => s.name)
        }
      })
    },

    /**
     * calculateMetrics: Calcula las métricas basadas en los horarios almacenados.
     * Se calculan estadísticas por profesor, clase, salón y globales.
     */
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

      // --- Cálculo de métricas por profesor ---
      const teacherMap = new Map<string, TeacherStats>()
      this.schedules.forEach(schedule => {
        // Soporta estructuras anidadas o con datos poblados
        const teacherId: string | undefined = schedule.scheduleDay?.teacherId || schedule.teacher?.id
        const timeSlot = schedule.scheduleDay?.timeSlot
        const studentIds: string[] = schedule.scheduleDay?.studentIds || (schedule.students ? schedule.students.map((s: any) => s.id) : [])
        const dayOfWeek = schedule.scheduleDay?.dayOfWeek

        if (!teacherId) {
          console.warn('Schedule missing teacherId:', schedule)
          return
        }
        
        if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
          console.warn('Schedule missing time values:', schedule)
          return
        }

        const duration = calculateDuration(timeSlot.startTime, timeSlot.endTime)
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            weeklyHours: 0,
            totalClasses: 0,
            totalStudents: 0,
            classesPerDay: {}
          })
        }
        const teacherStats = teacherMap.get(teacherId)!
        teacherStats.weeklyHours += duration / 60
        teacherStats.totalClasses++
        teacherStats.totalStudents += studentIds.length
        if (dayOfWeek) {
          teacherStats.classesPerDay[dayOfWeek] = (teacherStats.classesPerDay[dayOfWeek] || 0) + 1
        }
      })

      metrics.teacherMetrics = Array.from(teacherMap.entries()).map(([teacherId, stats]) => ({
        teacherId,
        ...stats
      }))

      // --- Cálculo de métricas por clase ---
      const classMap = new Map<string, ClassStats>()
      this.schedules.forEach(schedule => {
        const classId: string | undefined = schedule.scheduleDay?.classId || schedule.class?.id
        const studentIds: string[] = schedule.scheduleDay?.studentIds || (schedule.students ? schedule.students.map((s: any) => s.id) : [])

        if (!classId) {
          console.warn('Schedule missing classId:', schedule)
          return
        }
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
        const classStats = classMap.get(classId)!
        classStats.enrolledStudents = Math.max(classStats.enrolledStudents, studentIds.length)
      })

      metrics.classMetrics = Array.from(classMap.entries()).map(([classId, stats]) => ({
        classId,
        ...stats
      }))

      // --- Cálculo de métricas por salón ---
      const roomMap = new Map<string, RoomStats>()
      this.schedules.forEach(schedule => {
        const roomId: string | undefined = schedule.scheduleDay?.roomId || schedule.room?.id
        const timeSlot = schedule.scheduleDay?.timeSlot
        if (!roomId) {
          console.warn('Schedule missing roomId:', schedule)
          return
        }
        if (typeof roomId !== 'string' || roomId.trim() === '') {
          console.warn('Invalid roomId format:', roomId)
          return
        }
        if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
          console.warn('Schedule missing time values:', schedule)
          return
        }
        const duration = calculateDuration(timeSlot.startTime, timeSlot.endTime)
        if (!roomMap.has(roomId)) {
          roomMap.set(roomId, {
            usageHours: 0,
            utilizationRate: 0
          })
        }
        const roomStats = roomMap.get(roomId)!
        roomStats.usageHours += duration / 60
      })

      metrics.roomUtilization = Array.from(roomMap.entries()).map(([roomId, stats]) => ({
        roomId,
        ...stats,
        utilizationRate: (stats.usageHours / (40 * 4)) * 100 // Asumiendo 40 horas por semana durante 4 semanas
      }))

      // --- Cálculo de métricas globales ---
      metrics.globalMetrics = {
        totalActiveClasses: classMap.size,
        totalActiveTeachers: teacherMap.size,
        totalEnrolledStudents: Array.from(classMap.values()).reduce((total, stats) => total + stats.enrolledStudents, 0),
        averageClassSize: metrics.classMetrics.reduce((sum, metric) => sum + metric.enrolledStudents, 0) / (metrics.classMetrics.length || 1),
        roomUtilizationRate: metrics.roomUtilization.reduce((sum, metric) => sum + metric.utilizationRate, 0) / (metrics.roomUtilization.length || 1)
      }

      this.metrics = metrics
    },

    /**
     * forceSync: Forzar una sincronización de los horarios.
     */
    async forceSync() {
      await this.fetchAllSchedules()
    }
  }
})

/**
 * calculateDuration: Calcula la duración en minutos entre dos horas (formato "HH:mm").
 * Realiza validaciones del formato de tiempo.
 */
function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    console.warn('Invalid time values:', { startTime, endTime })
    return 0
  }
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    console.warn('Invalid time format:', { startTime, endTime })
    return 0
  }
  
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  
  return endTotalMinutes - startTotalMinutes
}
