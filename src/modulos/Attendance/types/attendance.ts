// src/type/attendance.ts
export interface Attendance {
  id: string; // ID del registro de asistencia
  studentId: string; // ID del estudiante
  classId: string; // ID de la clase
  date: string; // Fecha de la asistencia (ej: 2025-03-18)
  status: AttendanceStatus; // Estado de asistencia
  justification?: JustificationData; // Justificación en caso de ausencia
  createdAt?: Date; // Fecha de creación del registro
  updatedAt?: Date; // Fecha de última actualización del registro
}

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';

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
  };
}

/**
 * Nueva interfaz para las observaciones de clase con historial
 */
export interface ClassObservation {
  id: string;
  classId: string;
  date: string;
  text: string;
  timestamp: number;
  author: string; // ID o nombre del profesor
}

// Mantenemos algunas interfaces anteriores por compatibilidad
export interface AttendanceRecord {
  id?: string;
  studentId: string;
  classId: string;
  Fecha: string;
  status: AttendanceStatus;
  justification?: {
    reason?: string;
    documentUrl?: string;
    timestamp?: Date;
  };
  documentUrl?: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
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
  byClass: Record<
    string,
    {
      present: number;
      absent: number;
      delayed: number;
      justified: number;
      total: number;
    }
  >;
}

export interface StatusChange {
  studentId: number;
  date: string;
  clase: string;
  oldStatus: AttendanceStatus | null;
  newStatus: AttendanceStatus;
  timestamp: string;
}

export type EmergencyClassStatus = 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Ignorada';

export interface EmergencyClass {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  date: string;
  createdAt: string;
  reason?: string;
  status: EmergencyClassStatus;
  responder?: {
    id: string;
    name: string;
    timestamp: string;
  };
  attendanceDocumentId?: string; // Referencia al documento de asistencia relacionado
}
