// src/modulos/Teachers/types/class.ts
import { AttendanceRecord } from '../../Attendance/types/attendance'
import type { WorkspaceElement } from '../../Workspace/types/workspace'


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
  teacherId?: string;
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

/* Tipos para operaciones CRUD */

// Para crear una clase, se omite el id (que se genera en la base).
export type ClassCreate = Omit<ClassData, 'id'>;
// Para actualizar una clase, todos los campos son opcionales a partir de ClassCreate.
export type ClassUpdate = Partial<ClassCreate>;
