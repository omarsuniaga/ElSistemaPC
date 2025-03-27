import type { Teacher } from '../../Teachers/types/teachers'
import type { Student } from '../../Students/types/student'
import type { Class } from '../../Classes/types/class'

export interface TimeSlot {
  startTime: string
  endTime: string
  duration: number // en minutos
}



export interface ScheduleState {
  schedules: ScheduleAssignment[]
  rooms: Room[]
  metrics: ScheduleMetrics | null
  loading: boolean
  error: string | null
  lastSync: Date | null
}


export interface ScheduleDay {
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'
  timeSlot: TimeSlot
  classId: string
  teacherId: string
  roomId: string
  studentIds: string[]
  capacity: number
  isActive: boolean
}

export interface Room {
  id: string
  name: string
  capacity: number
  description?: string
  isActive: boolean
  equipment?: string[]
}

export interface ScheduleConfiguration {
  academicYear: string
  term: 'Primavera' | 'Verano' | 'Otoño' | 'Invierno'
  startDate: Date
  endDate: Date
  holidayDates: Date[]
  workingDays: string[] // ['Lunes', 'Martes', etc.]
  dailyTimeSlots: TimeSlot[]
}

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
    utilizationRate: number // porcentaje
  }[]
  globalMetrics: {
    totalActiveClasses: number
    totalActiveTeachers: number
    totalEnrolledStudents: number
    averageClassSize: number
    roomUtilizationRate: number
  }
}

// Tipos para las respuestas de la API
export type ScheduleResponse = {
  success: boolean
  data: ScheduleAssignment[] | null
  error?: string
}

export type ScheduleMetricsResponse = {
  success: boolean
  data: ScheduleMetrics | null
  error?: string
}

// Tipos para las solicitudes
export interface ScheduleCreationRequest {
  classId: string
  teacherId: string
  roomId: string
  studentIds: string[]
  dayOfWeek: ScheduleDay['dayOfWeek']
  timeSlot: TimeSlot
}

export interface ScheduleUpdateRequest {
  scheduleId: string
  updates: Partial<Omit<ScheduleAssignment, 'id' | 'createdAt'>>
}

export interface ScheduleDeletionRequest {
  scheduleId: string
}

// interface para Schedule
export interface Schedule {
  id: string
  classId: string
  teacherId: string
  studentIds: string[]
  startTime: string
  endTime: string
  dayOfWeek: ScheduleDay['dayOfWeek']
  roomId: string
  createdAt?: Date
  updatedAt?: Date
  customId?: string
  status?: 'active' | 'cancelled' | 'completed'
}