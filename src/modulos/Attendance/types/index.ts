// Tipos de asistencia
export type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | string

// Interfaces para horarios y slots
export interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

// Interfaces para documentos y registros
export interface AttendanceRecord {
  id?: string
  date: string
  classId: string
  status: AttendanceStatus
  studentId: string
  justification?: {
    reason: string
    date: string
  }
}

export interface AttendanceDocument {
  id?: string
  fecha: string
  classId: string
  data: {
    presentes: string[]
    ausentes: string[]
    tarde: string[]
    justificacion?: Array<{
      id: string
      reason: string
      date: string
    }>
  }
  observations?: string[]
}

// Interfaces para análisis y estadísticas
export interface AbsentStudent {
  studentId: string
  absences: number
  lastAttendance: string
}

export interface ClassStats {
  present: number
  absent: number
  delayed: number
  justified: number
  total: number
}

export interface AttendanceAnalytics {
  totalClasses: number
  totalStudents: number
  averageAttendance: number
  absentStudents: AbsentStudent[]
  byClass: Record<string, ClassStats>
}

// Interfaces para parámetros de búsqueda
export interface FetchAttendanceRecordsParams {
  classId?: string
  date?: string
  studentId?: string
  status?: AttendanceStatus
}

export interface FetchItemsOptions {
  classId?: string
  studentId?: string
  date?: string
  startDate?: string
  endDate?: string
  status?: AttendanceStatus
  refresh?: boolean
}

// Interfaces para reportes
export interface AttendanceReport {
  parameters: {
    startDate: string
    endDate: string
    classId?: string
    className?: string
    studentId?: string
    studentName?: string
  }
  summary: {
    totalClassInstancesInScope: number
    totalAttendanceRecords: number
    presentCount: number
    absentCount: number
    tardyCount: number
    justifiedTardyCount: number
    overallAttendanceRate: number
  }
  details: Array<{
    date: string
    studentId: string
    studentName?: string
    classId: string
    className?: string
    status: AttendanceStatus
    justification?: string
  }>
}
