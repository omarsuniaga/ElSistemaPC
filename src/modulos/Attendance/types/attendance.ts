import firebase from 'firebase/app';

// Interfaces completas para el módulo de asistencia
export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  Fecha: string;
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
  createdAt: string;
  updatedAt: string;
  justification?: {
    reason: string;
    documentURL?: string;
    approved?: boolean;
  };
}

export interface AttendanceDocument {
  id?: string;
  fecha: string;
  classId: string;
  teacherId: string;
  data: {
    presentes: string[];
    ausentes: string[];
    tarde: string[];
    justificacion: Array<{
      id: string;
      reason: string;
      documentURL?: string;
      approved?: boolean;
    }>;
    observations: string;
  };
  created_at?: firebase.firestore.Timestamp;
  updated_at?: firebase.firestore.Timestamp;
}

export interface AttendanceAnalytics {
  dateRange: string;
  totalClasses: number;
  averageAttendance: number;
  trends: {
    date: string;
    present: number;
    absent: number;
  }[];
  studentPerformance: Array<{
    studentId: string;
    attendanceRate: number;
    lastObservation: string;
  }>;
}

export interface ObservationRecord {
  id?: string;
  classId: string;
  date: string;
  type: 'general' | 'comportamiento' | 'logro';
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AttendanceExportConfig {
  format: 'pdf' | 'csv';
  dateRange: {
    start: string;
    end: string;
  };
  includeObservations: boolean;
  includeJustifications: boolean;
}

export interface AttendanceFilters {
  startDate: string;
  endDate: string;
  class?: string;
  student?: string;
  status?: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
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
  status?: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
  startDate?: string;
  endDate?: string;
}

export interface EmergencyClassStatus {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  date: string;
  createdAt: string;
  reason?: string;
  status: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Ignorada';
  responder?: {
    id: string;
    name: string;
    timestamp: string;
  };
  attendanceDocumentId?: string;
}

export interface FetchAttendanceRecordsParams {
  classId?: string;
  startDate: string | Date;
  endDate?: string | Date;
  studentId?: string;
}

export interface StatusChange {
  studentId: number;
  date: string;
  clase: string;
  oldStatus: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | null;
  newStatus: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
  timestamp: string;
}