/**
 * 📅 SERVICIO DE CALENDARIO DE ASISTENCIAS
 * Arquitectura limpia con responsabilidades bien definidas
 */

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type {
  DayOfWeek,
  SpanishDayName,
  ClassItem,
  DayClassItem,
  DayClassesResult,
  ClassFilterParams,
  ClassTimeSlot
} from '../types/calendar.types'

/**
 * Mapeo de días JavaScript a nombres en español
 */
const DAY_NAMES: Record<DayOfWeek, SpanishDayName> = {
  0: 'domingo',
  1: 'lunes', 
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado'
}

/**
 * Mapeo de nombres en español a números JavaScript
 */
const SPANISH_DAY_TO_NUMBER: Record<string, DayOfWeek> = {
  'domingo': 0, 'Domingo': 0,
  'lunes': 1, 'Lunes': 1,
  'martes': 2, 'Martes': 2,
  'miércoles': 3, 'Miércoles': 3, 'miercoles': 3, 'Miercoles': 3,
  'jueves': 4, 'Jueves': 4,
  'viernes': 5, 'Viernes': 5,
  'sábado': 6, 'Sábado': 6, 'sabado': 6, 'Sabado': 6
}

export class CalendarService {
  /**
   * 🗓️ Convierte una fecha a día de la semana JavaScript estándar
   * @param dateString - Fecha en formato YYYY-MM-DD
   * @returns Número del día (0=domingo, 1=lunes, etc.)
   */
  static getDayOfWeek(dateString: string): DayOfWeek {
    try {
      const date = parseISO(dateString)
      return date.getDay() as DayOfWeek
    } catch (error) {
      console.error('[CalendarService] Error parsing date:', dateString, error)
      throw new Error(`Invalid date format: ${dateString}`)
    }
  }

  /**
   * 📅 Obtiene el nombre del día en español
   * @param dateString - Fecha en formato YYYY-MM-DD
   * @returns Nombre del día en español
   */
  static getDayName(dateString: string): SpanishDayName {
    const dayNumber = this.getDayOfWeek(dateString)
    return DAY_NAMES[dayNumber]
  }

  /**
   * 🔍 Verifica si una clase está programada para un día específico
   * @param classItem - Objeto de la clase
   * @param targetDay - Día objetivo (0=domingo, 1=lunes, etc.)
   * @returns true si la clase está programada para ese día
   */
  static isClassScheduledForDay(classItem: ClassItem, targetDay: DayOfWeek): boolean {
    if (!classItem.schedule?.slots || !Array.isArray(classItem.schedule.slots)) {
      return false
    }

    return classItem.schedule.slots.some((slot: ClassTimeSlot) => {
      const slotDayNumber = SPANISH_DAY_TO_NUMBER[slot.day.toLowerCase()]
      return slotDayNumber === targetDay
    })
  }

  /**
   * 👨‍🏫 Verifica si un maestro es el principal de una clase
   * @param classItem - Objeto de la clase
   * @param teacherId - ID del maestro
   * @returns true si es el maestro principal
   */
  static isPrimaryTeacher(classItem: ClassItem, teacherId: string): boolean {
    return classItem.teacherId === teacherId
  }

  /**
   * 🤝 Verifica si un maestro es colaborador en una clase
   * @param classItem - Objeto de la clase
   * @param teacherId - ID del maestro
   * @returns true si es colaborador
   */
  static isCollaboratingTeacher(classItem: ClassItem, teacherId: string): boolean {
    if (!classItem.teachers || !Array.isArray(classItem.teachers)) {
      return false
    }

    return classItem.teachers.some(teacher => {
      if (typeof teacher === 'string') {
        return teacher === teacherId
      }
      return teacher.teacherId === teacherId
    })
  }

  /**
   * 🔐 Obtiene los permisos de un maestro colaborador
   * @param classItem - Objeto de la clase
   * @param teacherId - ID del maestro
   * @returns Permisos del maestro o undefined si no es colaborador
   */
  static getTeacherPermissions(classItem: ClassItem, teacherId: string) {
    if (!classItem.teachers || !Array.isArray(classItem.teachers)) {
      return undefined
    }

    const teacher = classItem.teachers.find(t => 
      typeof t === 'object' && t.teacherId === teacherId
    )

    return typeof teacher === 'object' ? teacher.permissions : undefined
  }

  /**
   * 🎯 Filtra clases para un maestro en un día específico
   * @param allClasses - Array de todas las clases
   * @param params - Parámetros de filtrado
   * @returns Clases filtradas para el día
   */
  static async getClassesForDay(
    allClasses: ClassItem[], 
    params: ClassFilterParams
  ): Promise<DayClassesResult> {
    const { date, teacherId, includeSharedClasses = true } = params
    
    try {
      const dayOfWeek = this.getDayOfWeek(date)
      const dayName = this.getDayName(date)
      
      console.log(`[CalendarService] Filtering classes for ${date} (${dayName}, day ${dayOfWeek})`)
      console.log(`[CalendarService] Teacher: ${teacherId}`)
      console.log(`[CalendarService] Total classes to check: ${allClasses.length}`)

      const filteredClasses: DayClassItem[] = []

      for (const classItem of allClasses) {
        // Verificar si la clase está programada para este día
        const isScheduledForDay = this.isClassScheduledForDay(classItem, dayOfWeek)
        
        if (!isScheduledForDay) {
          continue
        }

        // Verificar rol del maestro
        const isPrimary = this.isPrimaryTeacher(classItem, teacherId)
        const isCollaborator = includeSharedClasses && this.isCollaboratingTeacher(classItem, teacherId)

        if (!isPrimary && !isCollaborator) {
          continue
        }

        // Obtener permisos
        const permissions = this.getTeacherPermissions(classItem, teacherId)
        const canTakeAttendance = isPrimary || (permissions?.canTakeAttendance !== false)

        // Crear objeto de clase para el día
        const dayClass: DayClassItem = {
          ...classItem,
          userRole: isPrimary ? 'primary' : 'collaborator',
          canTakeAttendance,
          hasAttendanceRecord: false, // Se actualizará con datos reales
          attendanceId: undefined
        }

        filteredClasses.push(dayClass)

        console.log(`[CalendarService] ✅ Added class: ${classItem.name} (role: ${dayClass.userRole})`)
      }

      const result: DayClassesResult = {
        date,
        dayOfWeek,
        dayName,
        classes: filteredClasses,
        totalClasses: filteredClasses.length,
        classesWithAttendance: 0, // Se calculará con datos reales
        classesPending: filteredClasses.length
      }

      console.log(`[CalendarService] ✅ Filter complete: ${result.totalClasses} classes found`)
      
      return result

    } catch (error) {
      console.error('[CalendarService] Error filtering classes:', error)
      throw new Error(`Failed to filter classes for ${date}: ${error}`)
    }
  }

  /**
   * 📊 Valida el formato de fecha
   * @param dateString - Fecha a validar
   * @returns true si el formato es válido
   */
  static isValidDateFormat(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    return dateRegex.test(dateString)
  }

  /**
   * 🎨 Formatea una fecha para mostrar
   * @param dateString - Fecha en formato YYYY-MM-DD
   * @param formatStr - Formato deseado
   * @returns Fecha formateada
   */
  static formatDate(dateString: string, formatStr: string = 'EEEE, d MMMM yyyy'): string {
    try {
      const date = parseISO(dateString)
      return format(date, formatStr, { locale: es })
    } catch (error) {
      console.error('[CalendarService] Error formatting date:', error)
      return dateString
    }
  }

  /**
   * 🔍 Debug: Imprime información detallada de filtrado
   * @param classItem - Clase a analizar
   * @param targetDay - Día objetivo
   * @param teacherId - ID del maestro
   */
  static debugClassFilter(classItem: ClassItem, targetDay: DayOfWeek, teacherId: string): void {
    console.group(`[CalendarService] Debug: ${classItem.name}`)
    
    console.log('📋 Class info:', {
      id: classItem.id,
      name: classItem.name,
      primaryTeacher: classItem.teacherId,
      collaborators: classItem.teachers?.length || 0
    })

    console.log('🗓️ Schedule:', {
      slots: classItem.schedule?.slots?.length || 0,
      days: classItem.schedule?.slots?.map(s => s.day) || []
    })

    const isScheduled = this.isClassScheduledForDay(classItem, targetDay)
    const isPrimary = this.isPrimaryTeacher(classItem, teacherId)
    const isCollaborator = this.isCollaboratingTeacher(classItem, teacherId)

    console.log('✅ Checks:', {
      targetDay,
      dayName: DAY_NAMES[targetDay],
      isScheduledForDay: isScheduled,
      isPrimaryTeacher: isPrimary,
      isCollaboratingTeacher: isCollaborator,
      shouldInclude: isScheduled && (isPrimary || isCollaborator)
    })

    console.groupEnd()
  }
}
