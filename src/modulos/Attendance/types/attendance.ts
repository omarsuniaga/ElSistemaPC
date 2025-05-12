// src/type/attendance.ts
// Attendance status types
export type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';

/**
 * Justificación de ausencia
 */
export interface JustificationData {
  id: string; // ID del estudiante
  reason: string; // Causa de la ausencia
  documentURL?: string; // URL de la imagen subida al storage
  timestamp?: Date;
}

/**
 * Registro de asistencia
 */
export interface AttendanceRecord {
  id?: string;
  studentId: string;
  classId: string;
  Fecha: string; // Formato: AAAA-MM-DD
  status: AttendanceStatus;
  notes?: string;
  justification?: string | { reason: string };
  documentUrl?: string;
}

/**
 * Nueva estructura para el documento de asistencia
 */
export interface AttendanceDocument {
  id?: string;
  fecha: string; // Fecha en formato AAAA-MM-DD
  classId: string; // Clase seleccionada (ej: teoria-y-solfeo)
  teacherId: string; // ID del maestro que registró la asistencia
  data: {
    presentes: string[]; // Lista de IDs de alumnos presentes
    ausentes: string[]; // Lista de IDs de alumnos ausentes
    tarde: string[]; // Lista de IDs de alumnos con tardanza o justificados
    justificacion: JustificationData[]; // Datos de justificaciones
    observations: string; // Observaciones o criterios de la clase
  };
}

/**
 * Estructura para observaciones de clase con historial
 */
export interface ClassObservation {
  id: string;
  classId: string;
  date: string;
  text: string;
  timestamp: number;
  author: string;
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
  classId?: string;
  status?: AttendanceStatus;
  // Define el tipo para los filtros de asistencia
  startDate?: string; // Fecha de inicio para el rango de reporte
  endDate?: string;   // Fecha de fin para el rango de reporte

// Define el tipo para un documento de asistencia individual
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

export interface FetchAttendanceRecordsParams {
  classId?: string;
  startDate: string | Date;
  endDate?: string | Date;
  studentId?: string;
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