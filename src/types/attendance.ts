export type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado'

export interface JustificationData {
  type: 'medical' | 'family' | 'academic' | 'other' | ''
  description: string
  documentName?: string
  documentUrl?: string
  timestamp: Date
}

export interface Attendance {
  studentId: string;
  classId: string;
  Fecha: string;
  status: AttendanceStatus;
  justification?: JustificationData;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id?: string
  studentId: string
  classId: string
  Fecha: string
  status: AttendanceStatus
  justification?: JustificationData
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceFilters {
  startDate: string
  endDate: string
  class?: string
  student?: string
  status?: AttendanceStatus
  instrument?: string
  level?: string
  teacherId?: string
}

export interface AttendanceAnalytics {
  totalClasses: number
  totalStudents: number
  averageAttendance: number
  absentStudents: {
    studentId: string
    absences: number
    lastAttendance: string
    attendanceRate: number
  }[]
  byClass: Record<string, {
    present: number
    absent: number
    delayed: number
    justified: number
    total: number
  }>
}

export interface StatusChange {
  studentId: number
  date: string
  clase: string
  oldStatus: AttendanceStatus | null
  newStatus: AttendanceStatus
  timestamp: string
}
