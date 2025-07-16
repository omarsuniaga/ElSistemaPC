// modulos/Teachers/types/teachers.ts

// Estado de empleo del maestro (se usa exclusivamente el enum)
export enum TeacherStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive',
}

// Interfaz base para registros con timestamps
export interface BaseRecord {
  createdAt?: Date | any // Puede ser Date o el tipo de timestamp de Firestore
  updatedAt?: Date | any
}

export interface WeeklySchedule {
  dayOfWeek: string // Día de la semana (e.g. "Monday")
  startTime: string // Hora de inicio (e.g. "09:00")
  endTime: string // Hora de fin (e.g. "10:00")
  className?: string // Nombre de la clase (opcional)
  classId?: string // ID de la clase (opcional)
  room?: string // Aula (opcional)
}

// Información básica del maestro, unificada y sin duplicidad
export interface Teacher extends BaseRecord {
  uid: string // Firebase UID
  id: string
  name: string
  email: string
  phone?: string
  photoURL?: string // Unificación de 'photo' y 'avatar'
  biography?: string // Unificación de 'bio' y 'biography'
  hireDate?: Date // Fecha de contratación
  status: TeacherStatus // Usamos el enum para mayor consistencia
  specialties: string[] // Especialidades como array de strings
  hourlyRate?: number
  address?: string
  experience?: string
  edad?: string // Edad (si es relevante)
  clases?: string // Información complementaria sobre clases
  schedule?: string // Información complementaria de horarios (opcional)
  statistics?: string // Estadísticas (opcional)
  qualifications?: Qualification[] // Calificaciones o títulos
}

// Calificaciones o títulos educativos
export interface Qualification {
  title: string // Ejemplo: "Bachelor of Music"
  institution: string // Institución
  year: number // Año de obtención
}

// Interfaces para operaciones CRUD:
// TeacherCreate no incluye el campo 'id' ya que se genera en la base.
export type TeacherCreate = Omit<Teacher, 'id'>
// TeacherUpdate utiliza los mismos campos de TeacherCreate, pero todos opcionales.
export type TeacherUpdate = Partial<TeacherCreate>

/* ========= INTERFACES ADICIONALES PARA EL MÓDULO HORARIO ========= */

/**
 * Interfaz para representar el horario de un maestro.
 * Puede utilizarse para "clases por maestro" o para visualizar la agenda.
 */
export interface TeacherSchedule extends BaseRecord {
  id: string
  teacherId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  className: string
  // Otros campos adicionales si es necesario (e.g. room, studentCount)
}

/**
 * Interfaz para representar los instrumentos que imparte el maestro,
 * junto con su nivel.
 */
export interface TeacherInstrument extends BaseRecord {
  id: string
  teacherId: string
  level: string
  // Otros campos específicos para instrumentos pueden agregarse aquí.
}

/**
 * Interfaz para representar la especialidad del maestro, con estadísticas,
 * que podría incluir información como asistencia, promedio de calificaciones, etc.
 */
export interface TeacherSpecialty extends BaseRecord {
  id: string
  teacherId: string
  averageAttendance: number
  averageGrade: number
  lastUpdated: string
  totalStudents: number
}

export interface TeacherData {
  id: string
  uid: string
  name: string
  email: string
  phone: string
  specialties: string[]
  photoURL: string
  status: string
  biography: string
  createdAt: Date
  updatedAt?: Date
  experiencia: string
  address: string
}

/**
 * Interfaz para resumir el horario de un profesor.
 */
export interface TeacherScheduleSummary {
  weeklyHours: number
  totalClasses: number
  schedule: WeeklySchedule
  hasConflicts: boolean
}
