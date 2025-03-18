export type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado'

/**
 * Interfaz para justificación de ausencia
 */
export interface JustificationData {
  id: string; // ID del estudiante
  reason: string; // Causa de la ausencia
  documentURL?: string; // URL de la imagen subida al storage
  timestamp?: Date;
}

/**
 * Nueva estructura para el documento de asistencia
 */
export interface AttendanceDocument {
  fecha: string; // Fecha seleccionada (ej: 2025-03-18)
  classId: string; // Clase seleccionada (ej: teoria-y-solfeo)
  data: {
    presentes: string[]; // Lista de IDs de alumnos presentes
    ausentes: string[]; // Lista de IDs de alumnos ausentes
    tarde: string[]; // Lista de IDs de alumnos con tardanza
    justificacion: JustificationData[]; // Datos de justificaciones
    observations: string; // Observaciones o criterios de la clase
  }
}

// Mantenemos algunas interfaces anteriores por compatibilidad
export interface AttendanceRecord {
  id?: string;
  studentId: string;
  classId: string;
  Fecha: string;
  status: AttendanceStatus;
  justification?: string;
  documentUrl?: string;
  timestamp?: string;
}

export interface AttendanceFilters {
  startDate: string;
  endDate: string;
  class?: string;
  student?: string;
  status?: AttendanceStatus;
  instrument?: string;
  level?: string;
  teacherId?: string;
  studentId?: string;
  orderBy?: 'Fecha' | 'status';
  order?: 'asc' | 'desc';
}

export interface AttendanceFiltersType {
  instrument?: string;
  level?: string;
  teacherId?: string;
  studentId?: string;
}

export interface AttendanceAnalytics {
  totalClasses: number;
  totalStudents: number;
  averageAttendance: number;
  absentStudents: {
    studentId: string;
    absences: number;
    lastAttendance: string;
    attendanceRate: number;
  }[];
  byClass: Record<string, {
    present: number;
    absent: number;
    delayed: number;
    justified: number;
    total: number;
  }>;
}

export interface StatusChange {
  studentId: number
  date: string
  clase: string
  oldStatus: AttendanceStatus | null
  newStatus: AttendanceStatus
  timestamp: string
}
