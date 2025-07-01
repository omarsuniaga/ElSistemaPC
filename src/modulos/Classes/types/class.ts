// src/modulos/Teachers/types/class.ts
import {AttendanceRecord} from '../../Attendance/types/attendance'
import type {WorkspaceElement} from '../../Workspace/types/workspace'

/**
 * Roles de maestros en una clase
 */
export enum TeacherRole {
  LEAD = 'lead', // Maestro Encargado (principal)
  ASSISTANT = 'assistant', // Maestro Asistente
}

/**
 * Información de un maestro asignado a una clase
 */
export interface ClassTeacher {
  teacherId: string
  role: TeacherRole
  assignedAt: Date
  assignedBy: string // ID del usuario que asignó al maestro
  permissions: {
    canTakeAttendance: boolean
    canAddObservations: boolean
    canViewAttendanceHistory: boolean
    canEditClass: boolean
    canManageTeachers: boolean
    canManageStudents: boolean
    canManageSchedule: boolean
  }
}

/**
 * Tipo principal que usaremos en el store.
 * Representa la información normalizada de una clase.
 */
export interface ClassData {
  id: string
  name: string
  description?: string
  level?: string
  instrument?: string
  teacherId?: string // Mantener por compatibilidad (será el lead teacher)
  teachers?: (string | ClassTeacher)[] // Permitir tanto strings como objetos ClassTeacher
  studentIds?: string[]
  // Nuevos campos para clases compartidas
  sharedWith?: string[] // IDs de maestros con los que se comparte
  permissions?: Record<string, string[]> // Permisos por maestro
  capacity?: number // Capacidad máxima de estudiantes
  // El horario se representa siempre como un objeto con un arreglo de sesiones.
  schedule?:
    | {
        slots: {
          day: string
          startTime: string
          endTime: string
        }[]
      }
    | {
        day: string
        startTime: string
        endTime: string
      }
  classroom?: string
  contentIds?: string[]
  status?: 'active' | 'inactive' | 'suspended'
  createdAt?: Date
  updatedAt?: Date
  changeHistory?: { timestamp: Date; changes: string }[]
}

/**
 * Representa un registro de calificaciones.
 */
export interface GradeRecord {
  studentId: number
  indicatorId: number
  grade: number
  comment?: string
  createdAt: string
  updatedAt?: string
}

/**
 * Representa registros asociados a la asistencia, calificaciones y demás datos de la clase.
 */
export interface ClassRecord {
  classId: string
  studentId: string
  attendance: AttendanceRecord[]
  grades: GradeRecord[]
  createdAt: string
  updatedAt?: string
}

/**
 * Representa un tema asignado a una clase.
 */
export interface ClassTheme {
  id: string
  classId: string
  themeId: string
  createdAt: string
  updatedAt?: string
}

/**
 * Representa un indicador de evaluación para una clase.
 */
export interface ClassIndicator {
  id: string
  classId: string
  indicatorId: string
  createdAt: string
  updatedAt?: string
}

/**
 * Representa un contenido asociado a una clase.
 */
export interface ClassContent {
  id: string
  classId: string
  contentId: string
  createdAt: string
  updatedAt?: string
}

/**
 * Representa los elementos del espacio de trabajo asociados a una clase.
 */
export interface ClassWorkspace {
  classId: string
  elements: WorkspaceElement[]
  createdAt: string
  updatedAt?: string
}

/**
 * Representa el registro de asistencia de una clase para un estudiante.
 */
export interface ClassAttendance {
  classId: string
  studentId: string
  attendance: AttendanceRecord[]
  createdAt: string
  updatedAt?: string
}

/**
 * Representación extendida de una clase para maestros asistentes
 * Incluye información sobre su rol y permisos específicos
 */
export interface TeacherClassView extends ClassData {
  myRole?: TeacherRole
  myPermissions?: ClassTeacher['permissions']
  leadTeacher?: {
    id: string
    name: string
    email: string
  }
  assistantTeachers?: {
    id: string
    name: string
    email: string
    assignedAt: Date
  }[]
}

/**
 * Datos para invitar un maestro asistente a una clase
 */
export interface InviteAssistantData {
  classId: string
  teacherId: string
  permissions: {
    canTakeAttendance: boolean
    canAddObservations: boolean
    canViewAttendanceHistory: boolean
  }
  invitedBy: string
}

/**
 * Respuesta a una invitación de maestro asistente
 */
export interface AssistantInvitationResponse {
  invitationId: string
  accepted: boolean
  respondedAt: Date
}

/**
 * Permisos disponibles para maestros en clases compartidas
 */
export type SharedClassPermission = 'read' | 'write' | 'manage'

/**
 * Datos para compartir una clase con otro maestro
 */
export interface ShareClassData {
  classId: string
  teacherId: string
  permissions: SharedClassPermission[]
  sharedBy: string
  sharedAt: Date
}

/**
 * Información de una clase compartida desde la perspectiva del maestro
 */
export interface SharedClassInfo extends ClassData {
  isShared: true
  sharedBy: string
  sharedAt: Date
  myPermissions: SharedClassPermission[]
  isOwner: boolean
}

/**
 * Solicitud para modificar permisos de una clase compartida
 */
export interface UpdateSharedPermissionsData {
  classId: string
  teacherId: string
  permissions: SharedClassPermission[]
  updatedBy: string
}

/**
 * Estadísticas de una clase
 */
export interface ClassStats {
  totalStudents: number
  activeStudents: number
  averageAttendance: number
  totalSessions: number
  completedSessions: number
  sharedWithCount: number
}

/* Tipos para operaciones CRUD */

// Para crear una clase, se omite el id (que se genera en la base).
export type ClassCreate = Omit<ClassData, 'id'>
// Para actualizar una clase, todos los campos son opcionales a partir de ClassCreate.
export type ClassUpdate = Partial<ClassCreate>
