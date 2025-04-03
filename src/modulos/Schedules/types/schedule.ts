// /types/schedules.ts

// Importamos los tipos necesarios de otros módulos
import type { Teacher } from '../../Teachers/types/teachers'
import type { Student } from '../../Students/types/student'
import type { Class } from '../../Classes/types/class'

/**
 * TimeSlot: Representa un intervalo de tiempo con hora de inicio, fin y duración (en minutos)
 */
export interface TimeSlot {
  startTime: string
  endTime: string
  duration: number // en minutos
}

/**
 * ScheduleDay: Define la programación de un día para una clase.
 * Incluye la información del día de la semana, el intervalo de tiempo (TimeSlot)
 * y las referencias a la clase, profesor, salón y estudiantes.
 */
export interface ScheduleDay {
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'
  timeSlot: TimeSlot
  classId: string
  teacherId: string
  roomId: string
  studentIds: string[]
  capacity: number      // Capacidad máxima del grupo para ese día
  isActive: boolean     // Indica si el horario está activo
}

/**
 * Room: Representa un salón o aula.
 * Incluye su identificador, nombre, capacidad, descripción, estado y lista de equipos (opcional).
 */
export interface Room {
  id: string
  name: string
  capacity: number
  description?: string
  isActive: boolean
  equipment?: string[]
}

/**
 * ScheduleConfiguration: Configuración general para la programación de horarios.
 * Define el año académico, término, fechas de inicio y fin, días festivos, días laborales y los intervalos diarios.
 */
export interface ScheduleConfiguration {
  academicYear: string
  term: 'Primavera' | 'Verano' | 'Otoño' | 'Invierno'
  startDate: Date
  endDate: Date
  holidayDates: Date[]
  workingDays: string[]      // Ejemplo: ['Lunes', 'Martes', ...]
  dailyTimeSlots: TimeSlot[]
}

/**
 * ScheduleAssignment: Representa la asignación de un horario a una clase.
 * Incluye el día de programación (ScheduleDay), y los datos completos de la clase, profesor, estudiantes y salón.
 * Además, incluye metadatos de creación, actualización y el estado actual.
 */
export interface ScheduleAssignment {
  id: string
  scheduleDay: ScheduleDay
  class: Class
  teacher: Teacher
  students: Student[]
  room: Room
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'cancelled' | 'completed'
  conflicts?: {
    type: 'teacher' | 'room' | 'student'
    description: string
  }[]
}

/**
 * ScheduleMetrics: Define las métricas obtenidas a partir de los horarios.
 * Contiene estadísticas desglosadas por profesor, clase y salón, así como métricas globales.
 */
export interface ScheduleMetrics {
  teacherMetrics: {
    teacherId: string
    weeklyHours: number
    totalClasses: number
    totalStudents: number
    classesPerDay: Record<string, number>
  }[]
  classMetrics: {
    classId: string
    enrolledStudents: number
    averageAttendance: number
    scheduleConflicts: number
  }[]
  roomUtilization: {
    roomId: string
    usageHours: number
    utilizationRate: number // en porcentaje
  }[]
  globalMetrics: {
    totalActiveClasses: number
    totalActiveTeachers: number
    totalEnrolledStudents: number
    averageClassSize: number
    roomUtilizationRate: number
  }
}

/**
 * ScheduleState: Representa el estado del módulo de horarios en el store.
 * Incluye la lista de horarios, salones, métricas, indicadores de carga, error y la fecha de última sincronización.
 */
export interface ScheduleState {
  schedules: ScheduleAssignment[]
  rooms: Room[]
  metrics: ScheduleMetrics | null
  loading: boolean
  error: string | null
  lastSync: Date | null
}

/**
 * ScheduleResponse: Tipo de respuesta para las solicitudes de horarios a la API.
 */
export type ScheduleResponse = {
  success: boolean
  data: ScheduleAssignment[] | null
  error?: string
}

/**
 * ScheduleMetricsResponse: Tipo de respuesta para las solicitudes de métricas de horarios.
 */
export type ScheduleMetricsResponse = {
  success: boolean
  data: ScheduleMetrics | null
  error?: string
}

/**
 * ScheduleCreationRequest: Representa la solicitud para crear un nuevo horario.
 */
export interface ScheduleCreationRequest {
  classId: string
  teacherId: string
  roomId: string
  studentIds: string[]
  dayOfWeek: ScheduleDay['dayOfWeek']
  timeSlot: TimeSlot
}

/**
 * ScheduleUpdateRequest: Representa la solicitud para actualizar un horario existente.
 * Se envía el ID del horario a actualizar y un objeto con las propiedades a modificar (excepto id y createdAt).
 */
export interface ScheduleUpdateRequest {
  scheduleId: string
  updates: Partial<Omit<ScheduleAssignment, 'id' | 'createdAt'>>
}

/**
 * ScheduleDeletionRequest: Representa la solicitud para eliminar un horario.
 */
export interface ScheduleDeletionRequest {
  scheduleId: string
}

/**
 * LegacySchedule: Representa el formato anterior de horarios para migración
 */
export interface LegacySchedule {
  id: string
  dayOfWeek?: string
  startTime?: string
  endTime?: string
  classId?: string
  teacherId?: string
  roomId?: string
  classroom?: string
  studentIds?: string[]
  capacity?: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  status?: 'active' | 'cancelled' | 'completed'
}

/**
 * Schedule: Representa un horario en un formato simplificado, útil para ciertos procesos o transformaciones.
 * Extiende LegacySchedule para incluir compatibilidad con el formato anterior.
 */
export interface Schedule extends LegacySchedule {
  scheduleDay?: ScheduleDay
}
