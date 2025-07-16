// Modelo unificado para gestión de observaciones en El Sistema PC

/**
 * Enum para los diferentes tipos de observaciones que pueden existir en el sistema
 */
export enum ObservationType {
  // Tipos generales
  GENERAL = 'general',

  // Tipos de comportamiento
  BEHAVIOR = 'comportamiento',
  ACHIEVEMENT = 'logro',

  // Tipos de clase
  CONTENT = 'contenido',
  DYNAMICS = 'dinamica',
  PERFORMANCE = 'performance',
  PROGRESS = 'progreso',
  TECHNIQUE = 'tecnica',

  // Otros
  OTHER = 'otro',
}

/**
 * Estado de una observación
 */
export enum ObservationStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived',
  PENDING_FOLLOWUP = 'pending_followup',
}

/**
 * Categorías principales de observaciones para agruparlas
 */
export enum ObservationCategory {
  GENERAL = 'general',
  ATTENDANCE = 'attendance', // Relacionada a asistencia
  CLASS = 'class', // Relacionada a una clase específica
  STUDENT = 'student', // Relacionada a un estudiante específico
  TEACHER = 'teacher', // Relacionada a un profesor
  PERFORMANCE = 'performance', // Relacionada a una presentación
}

/**
 * Niveles de prioridad para las observaciones
 */
export type ObservationPriority = 'alta' | 'media' | 'baja'

/**
 * Estructura para archivos adjuntos a una observación
 */
export interface ObservationAttachment {
  url: string
  type: string // 'image', 'document', 'audio', etc.
  name: string
  size?: number
  createdAt: Date
}

/**
 * Modelo principal unificado para todas las observaciones
 */
export interface Observation {
  // Identificación
  id: string

  // Contenido principal
  content: {
    text: string
    bulletPoints?: string[]
    taggedStudents?: string[]
    works?: Array<{
      title: string
      composer?: string
      notes?: string
    }>
    classDynamics?: Array<{
      type: string
      description: string
      effectiveness?: ObservationPriority
    }>
    formattedText?: string // Texto con formato especial
  }

  // Metadatos de creación
  author: string // ID del autor (normalmente teacherId)
  authorName?: string // Nombre del autor para visualización
  createdAt: Date
  updatedAt?: Date

  // Clasificación
  type: ObservationType
  category: ObservationCategory
  priority?: ObservationPriority

  // Referencias (pueden ser opcionales dependiendo de la categoría)
  classId?: string
  className?: string // Para facilitar visualización
  studentId?: string
  studentName?: string // Para facilitar visualización
  attendanceId?: string
  teacherId?: string
  date: string // Fecha a la que se refiere la observación (puede ser diferente a createdAt)

  // Estado y seguimiento
  status: ObservationStatus
  requiresFollowUp: boolean
  followUpDate?: Date
  resolvedBy?: string
  resolvedAt?: Date

  // Adjuntos
  attachments?: ObservationAttachment[]
  imageUrls?: string[]
  documentUrl?: string
}

/**
 * Interfaz para crear una nueva observación (sin campos autogenerados)
 */
export interface ObservationCreateInput {
  content: {
    text: string
    bulletPoints?: string[]
    taggedStudents?: string[]
    works?: Array<{
      title: string
      composer?: string
      notes?: string
    }>
    classDynamics?: Array<{
      type: string
      description: string
      effectiveness?: ObservationPriority
    }>
  }
  author: string
  type: ObservationType
  category: ObservationCategory
  priority?: ObservationPriority
  classId?: string
  studentId?: string
  attendanceId?: string
  teacherId?: string
  date: string
  requiresFollowUp: boolean
  attachments?: ObservationAttachment[]
}

export interface ClassObservationData {
  id: string
  classId: string
  fecha: string
  type: 'general' | 'comportamiento' | 'logro' | 'contenido' | 'dinamica'
  content: {
    text: string
    bulletPoints?: string[]
    taggedStudents?: string[]
    works?: Array<{
      title: string
      composer?: string
      notes?: string
    }>
    classDynamics?: Array<{
      type: string
      description: string
      effectiveness?: 'alta' | 'media' | 'baja'
    }>
  }
  author: string
  createdAt: Date
  updatedAt?: Date
  priority: 'alta' | 'media' | 'baja'
  requiresFollowUp: boolean
}

/**
 * Interfaz para actualizar una observación existente
 */
export interface ObservationUpdateInput {
  id: string
  content?: {
    text?: string
    bulletPoints?: string[]
    taggedStudents?: string[]
    works?: Array<{
      title: string
      composer?: string
      notes?: string
    }>
    classDynamics?: Array<{
      type: string
      description: string
      effectiveness?: ObservationPriority
    }>
  }
  type?: ObservationType
  priority?: ObservationPriority
  status?: ObservationStatus
  requiresFollowUp?: boolean
  followUpDate?: Date
  attachments?: ObservationAttachment[]
}

/**
 * Interfaz para filtrar observaciones
 */
export interface ObservationFilters {
  category?: ObservationCategory
  type?: ObservationType
  classId?: string
  studentId?: string
  teacherId?: string
  attendanceId?: string
  startDate?: string
  endDate?: string
  status?: ObservationStatus
  priority?: ObservationPriority
  requiresFollowUp?: boolean
}

/**
 * Interfaces de compatibilidad con modelos anteriores
 * Estas interfaces se mantienen temporalmente para asegurar compatibilidad
 * con el código existente mientras se completa la migración
 */

// Compatibilidad con el modelo anterior de observations
export interface LegacyObservation {
  id: string
  studentId: string
  teacherId: string
  date: Date
  content: string
  category: ObservationType
  status: ObservationStatus
  createdAt: Date
  updatedAt?: Date
}

// Compatibilidad con ObservationRecord de attendance.ts
export interface LegacyObservationRecord {
  id?: string
  classId: string
  date: string
  type: 'general' | 'comportamiento' | 'logro'
  content: string
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

// Compatibilidad con ClassObservation de attendance.ts
export interface LegacyClassObservation {
  id: string
  classId: string
  fecha: string
  type: 'general' | 'comportamiento' | 'logro' | 'contenido' | 'dinamica'
  content: {
    text: string
    bulletPoints?: string[]
    taggedStudents?: string[]
    works?: Array<{
      title: string
      composer?: string
      notes?: string
    }>
    classDynamics?: Array<{
      type: string
      description: string
      effectiveness?: 'alta' | 'media' | 'baja'
    }>
  }
  author: string
  createdAt: Date
  updatedAt?: Date
  priority: 'alta' | 'media' | 'baja'
  requiresFollowUp: boolean
}

/**
 * Funciones auxiliares para conversión entre modelos
 */

/**
 * Convierte una observación heredada al nuevo formato unificado
 */
export function convertLegacyObservationToNew(legacy: LegacyObservation): Observation {
  return {
    id: legacy.id,
    content: {
      text: legacy.content,
    },
    author: legacy.teacherId,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    type: legacy.category as unknown as ObservationType, // Convertir entre enums
    category: ObservationCategory.STUDENT,
    priority: 'media',
    studentId: legacy.studentId,
    teacherId: legacy.teacherId,
    date: legacy.date.toISOString().split('T')[0],
    status: legacy.status as unknown as ObservationStatus,
    requiresFollowUp: false,
  };
}

/**
 * Convierte una ClassObservation heredada al nuevo formato unificado
 */
export function convertLegacyClassObservationToNew(legacy: LegacyClassObservation): Observation {
  return {
    id: legacy.id,
    content: {
      text: legacy.content.text,
      bulletPoints: legacy.content.bulletPoints,
      taggedStudents: legacy.content.taggedStudents,
      works: legacy.content.works,
      classDynamics: legacy.content.classDynamics,
    },
    author: legacy.author,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    type: legacy.type as ObservationType,
    category: ObservationCategory.CLASS,
    priority: legacy.priority as ObservationPriority,
    classId: legacy.classId,
    date: legacy.fecha,
    status: legacy.requiresFollowUp ? ObservationStatus.PENDING_FOLLOWUP : ObservationStatus.ACTIVE,
    requiresFollowUp: legacy.requiresFollowUp,
  };
}
