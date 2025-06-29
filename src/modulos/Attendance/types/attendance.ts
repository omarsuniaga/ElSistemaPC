// Interfaces completas para el módulo de asistencia
export type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  fecha: string;
  status: AttendanceStatus;
  justification?: string | {
    reason: string;
    date?: string;
    documentUrl?: string;
  };
  documentUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface StudentAttendanceStatus {
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
  justification?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface AttendanceDocument {
  id: string;
  classId: string;
  fecha: string;
  teacherId: string;
  uid: string;
  createdAt: Date;
  updatedAt: Date;
  data: {
    ausentes: string[];
    presentes: string[];
    tarde: string[];
    justificacion: JustificationData[];
    observación: string[] | string; // Para compatibilidad con versión anterior
    observations?: ClassObservationData[]; // Nuevo array de observaciones estructuradas
    fechaRegistro?: Date; // Para clases emergentes
    maestro?: string; // Para clases emergentes
  };
  // Mapa de studentId a su estado de asistencia
  students?: Record<string, StudentAttendanceStatus>;
  // Campos para clases emergentes
  isEmergencyClass?: boolean;
  emergencyClassId?: string;
  className?: string;
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

export interface EmergencyClass {
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
  selectedStudents: string[];
  startTime?: string;
  endTime?: string;
  instrument?: string;
  classType?: string;
  updatedAt?: string;
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

export interface ClassObservation {
  id: string;
  classId: string;
  date: string;  // Campo necesario para la colección OBSERVACIONES
  fecha?: string; // Mantenemos para compatibilidad con código existente
  type?: 'general' | 'comportamiento' | 'logro' | 'contenido' | 'dinamica';
  content: {
    text: string;
    bulletPoints?: string[];
    taggedStudents?: string[];
    works?: Array<{
      title: string;
      composer?: string;
      notes?: string;
    }>;
    classDynamics?: Array<{
      type: string;
      description: string;
      effectiveness?: 'alta' | 'media' | 'baja';
    }>;
  } | any; // Permitimos contenido flexible para migración
  author?: string;
  authorId: string;  // ID del autor original
  authorName?: string; // Nombre del autor original
  createdAt: Date;
  updatedAt: Date;
  lastModified?: Date; // Fecha de última modificación
  modifiedBy?: string; // ID del usuario que hizo la última modificación
  modifiedByName?: string; // Nombre del usuario que hizo la última modificación
  priority?: 'alta' | 'media' | 'baja';
  requiresFollowUp?: boolean;
  bulletPoints?: string[]; // Para compatibilidad con componentes
  studentId?: string; // Para observaciones específicas de estudiantes
  studentName?: string; // Nombre del estudiante si es específico
  taggedStudentIds?: string[]; // IDs de estudiantes etiquetados
  tags?: string[]; // Otras etiquetas
  text: string; // Contenido principal de texto - ahora obligatorio para OBSERVACIONES
  category?: string; // Categoría general de la observación
  categoryId?: string; // ID de categoría, puede ser el mismo que classId
  images?: string[]; // URLs de imágenes adjuntas
}

export interface JustificationData {
  id: string;
  studentId: string;
  classId: string;
  fecha: string;
  reason: string;
  documentUrl?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  timeLimit: Date;
  
}

export interface StatusChange {
  studentId: number;
  date: string;
  clase: string;
  oldStatus: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | null;
  newStatus: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
  timestamp: string;
}

// Interface para observaciones de clase estructuradas
export interface ClassObservationData {
  id: string;
  content: string | {
    text: string;
    bulletPoints?: string[];
    taggedStudents?: string[];
  };
  text: string; // Campo principal de texto para OBSERVACIONES
  author?: string;
  authorId: string; // ID del autor original
  authorName?: string; // Nombre del autor para mostrar en UI
  timestamp?: Date; // Campo legacy
  createdAt: Date; // Fecha de creación 
  updatedAt?: Date; // Fecha de actualización
  lastModified?: Date; // Última modificación
  modifiedBy?: string; // ID de quien modificó últimamente
  modifiedByName?: string; // Nombre de quien modificó 
  type?: 'contenido' | 'comportamiento' | 'logro' | 'general';
  category?: string; // Categoría de la observación
  categoryId?: string; // ID de la categoría/clase
  status?: string; // Estado de la observación
  tags?: string[]; // Estudiantes etiquetados
  imageUrls?: string[]; // URLs de imágenes adjuntas
  formattedText?: string; // Texto con formato especial
  isEdited?: boolean;
  editedAt?: Date;
  priority?: 'alta' | 'media' | 'baja';
  requiresFollowUp?: boolean;
  bulletPoints?: string[];
  classId?: string; // ID de la clase
  date?: string; // Fecha de la clase en formato YYYY-MM-DD
  studentId?: string;
  studentName?: string;
}