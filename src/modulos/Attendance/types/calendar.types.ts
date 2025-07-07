/**
 * 📅 TIPOS PARA EL NUEVO SISTEMA DE CALENDARIO DE ASISTENCIAS
 * Arquitectura limpia con contratos bien definidos
 */

/**
 * Días de la semana en formato estándar JavaScript
 * domingo=0, lunes=1, martes=2, miércoles=3, jueves=4, viernes=5, sábado=6
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Nombres de días en español (como se guardan en la base de datos)
 */
export type SpanishDayName = 
  | 'domingo' | 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado'
  | 'Domingo' | 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'

/**
 * Slot de horario para una clase
 */
export interface ClassTimeSlot {
  day: SpanishDayName
  startTime: string
  endTime: string
}

/**
 * Horario completo de una clase
 */
export interface ClassSchedule {
  slots: ClassTimeSlot[]
}

/**
 * Información del maestro en una clase
 */
export interface ClassTeacher {
  teacherId: string
  permissions?: {
    canTakeAttendance?: boolean
    canEditClass?: boolean
  }
}

/**
 * Estructura completa de una clase
 */
export interface ClassItem {
  id: string
  name: string
  teacherId: string // Maestro principal
  teachers?: (string | ClassTeacher)[] // Maestros colaboradores
  schedule: ClassSchedule
  students?: string[]
  location?: string
  description?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Clase filtrada para un día específico
 */
export interface DayClassItem extends ClassItem {
  // Información adicional para el contexto del día
  userRole: 'primary' | 'collaborator'
  canTakeAttendance: boolean
  hasAttendanceRecord: boolean
  attendanceId?: string
}

/**
 * Resultado del filtrado de clases por día
 */
export interface DayClassesResult {
  date: string
  dayOfWeek: DayOfWeek
  dayName: SpanishDayName
  classes: DayClassItem[]
  totalClasses: number
  classesWithAttendance: number
  classesPending: number
}

/**
 * Parámetros para filtrar clases
 */
export interface ClassFilterParams {
  date: string
  teacherId: string
  includeSharedClasses?: boolean
  includeAttendanceRecords?: boolean
}

/**
 * Estado del calendario
 */
export interface CalendarState {
  selectedDate: string | null
  currentMonth: Date
  loading: boolean
  error: string | null
}

/**
 * Eventos del calendario
 */
export interface CalendarEvents {
  'date-selected': [date: string]
  'month-changed': [month: Date]
  'classes-loaded': [result: DayClassesResult]
  'error': [error: string]
}

/**
 * Props del componente de calendario
 */
export interface CalendarProps {
  selectedDate?: string
  teacherId?: string
  readonly?: boolean
}

/**
 * Props del modal de clases
 */
export interface ClassesModalProps {
  isOpen: boolean
  date: string
  classes: DayClassItem[]
  loading?: boolean
}

/**
 * Configuración del servicio de calendario
 */
export interface CalendarServiceConfig {
  timezone?: string
  locale?: string
  dateFormat?: string
}
