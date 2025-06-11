// src/modulos/Teachers/types/class.ts
import { AttendanceRecord } from '../../Attendance/types/attendance'
import type { WorkspaceElement } from '../../Workspace/types/workspace'


/**
 * Roles de maestros en una clase
 */
export enum TeacherRole {
  LEAD = 'lead',        // Maestro Encargado (principal)
  ASSISTANT = 'assistant' // Maestro Asistente
}

/**
 * Información de un maestro asignado a una clase
 */
export interface ClassTeacher {
  teacherId: string;
  role: TeacherRole;
  assignedAt: Date;
  assignedBy: string; // ID del usuario que asignó al maestro
  permissions: {
    canTakeAttendance: boolean;
    canAddObservations: boolean;
    canViewAttendanceHistory: boolean;
    canEditClass: boolean;        // Solo para LEAD
    canManageTeachers: boolean;   // Solo para LEAD
  };
}

/**
 * Tipo principal que usaremos en el store.
 * Representa la información normalizada de una clase.
 */
export interface ClassData {
  id: string;
  name: string;
  description?: string;
  level?: string;
  instrument?: string;
  teacherId?: string; // Mantener por compatibilidad (será el lead teacher)
  teachers?: ClassTeacher[]; // Nueva estructura de maestros
  studentIds?: string[];
  // El horario se representa siempre como un objeto con un arreglo de sesiones.
  schedule?: {
    slots: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  };
  classroom?: string;
  contentIds?: string[];
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Representa un registro de calificaciones.
 */
export interface GradeRecord {
  studentId: number;
  indicatorId: number;
  grade: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}



/**
 * Representa registros asociados a la asistencia, calificaciones y demás datos de la clase.
 */
export interface ClassRecord {
  classId: string;
  studentId: string;
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Representa un tema asignado a una clase.
 */
export interface ClassTheme {
  id: string;
  classId: string;
  themeId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Representa un indicador de evaluación para una clase.
 */
export interface ClassIndicator {
  id: string;
  classId: string;
  indicatorId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Representa un contenido asociado a una clase.
 */
export interface ClassContent {
  id: string;
  classId: string;
  contentId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Representa los elementos del espacio de trabajo asociados a una clase.
 */
export interface ClassWorkspace {
  classId: string;
  elements: WorkspaceElement[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Representa el registro de asistencia de una clase para un estudiante.
 */
export interface ClassAttendance {
  classId: string;
  studentId: string;
  attendance: AttendanceRecord[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Representación extendida de una clase para maestros asistentes
 * Incluye información sobre su rol y permisos específicos
 */
export interface TeacherClassView extends ClassData {
  myRole?: TeacherRole;
  myPermissions?: ClassTeacher['permissions'];
  leadTeacher?: {
    id: string;
    name: string;
    email: string;
  };
  assistantTeachers?: {
    id: string;
    name: string;
    email: string;
    assignedAt: Date;
  }[];
}

/**
 * Datos para invitar un maestro asistente a una clase
 */
export interface InviteAssistantData {
  classId: string;
  teacherId: string;
  permissions: {
    canTakeAttendance: boolean;
    canAddObservations: boolean;
    canViewAttendanceHistory: boolean;
  };
  invitedBy: string;
}

/**
 * Respuesta a una invitación de maestro asistente
 */
export interface AssistantInvitationResponse {
  invitationId: string;
  accepted: boolean;
  respondedAt: Date;
}

/* Tipos para operaciones CRUD */

// Para crear una clase, se omite el id (que se genera en la base).
export type ClassCreate = Omit<ClassData, 'id'>;
// Para actualizar una clase, todos los campos son opcionales a partir de ClassCreate.
export type ClassUpdate = Partial<ClassCreate>;
