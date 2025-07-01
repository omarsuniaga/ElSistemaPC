// src/modulos/Classes/helpers/classHelpers.ts

import type {ClassData, SharedClassPermission} from "../types/class"

/**
 * Obtiene el color del badge según el instrumento
 */
export function getInstrumentColor(instrument?: string): string {
  const colors: Record<string, string> = {
    piano: "bg-blue-500",
    guitarra: "bg-green-500",
    violin: "bg-purple-500",
    flauta: "bg-yellow-500",
    bateria: "bg-red-500",
    canto: "bg-pink-500",
    bajo: "bg-indigo-500",
    saxofon: "bg-orange-500",
    trompeta: "bg-cyan-500",
    clarinete: "bg-teal-500",
  }
  return colors[instrument?.toLowerCase() || ""] || "bg-gray-500"
}

/**
 * Obtiene el color del badge con texto según el instrumento
 */
export function getInstrumentBadgeColor(instrument?: string): string {
  const colors: Record<string, string> = {
    piano: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    guitarra: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    violin: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
    flauta: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    bateria: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    canto: "bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200",
    bajo: "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200",
    saxofon: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
    trompeta: "bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200",
    clarinete: "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200",
  }
  return (
    colors[instrument?.toLowerCase() || ""] ||
    "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
  )
}

/**
 * Obtiene el color del badge según el nivel
 */
export function getLevelBadgeColor(level?: string): string {
  const colors: Record<string, string> = {
    principiante: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    intermedio: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    avanzado: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    profesional: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  }
  return (
    colors[level?.toLowerCase() || ""] ||
    "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
  )
}

/**
 * Obtiene el color del badge según el estado
 */
export function getStatusBadgeColor(status?: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    inactive: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    suspended: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  }
  return (
    colors[status?.toLowerCase() || ""] ||
    "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
  )
}

/**
 * Formatea el horario de una clase
 */
export function formatClassSchedule(schedule?: ClassData["schedule"]): string {
  if (!schedule) return "Sin horario"

  // Si es un array de slots
  if ("slots" in schedule && Array.isArray(schedule.slots)) {
    return schedule.slots
      .map((slot) => `${formatDay(slot.day)} ${slot.startTime}-${slot.endTime}`)
      .join(", ")
  }

  // Si es un objeto simple
  if ("day" in schedule && schedule.day && schedule.startTime && schedule.endTime) {
    return `${formatDay(schedule.day)} ${schedule.startTime}-${schedule.endTime}`
  }

  return "Sin horario"
}

/**
 * Formatea el nombre del día
 */
export function formatDay(day: string): string {
  const days: Record<string, string> = {
    monday: "Lun",
    tuesday: "Mar",
    wednesday: "Mié",
    thursday: "Jue",
    friday: "Vie",
    saturday: "Sáb",
    sunday: "Dom",
  }
  return days[day.toLowerCase()] || day
}

/**
 * Formatea el nombre completo del día
 */
export function formatFullDay(day: string): string {
  const days: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  }
  return days[day.toLowerCase()] || day
}

/**
 * Verifica si un maestro tiene permisos específicos en una clase compartida
 */
export function hasPermission(
  classData: ClassData,
  teacherId: string,
  permission: SharedClassPermission
): boolean {
  // Si es el maestro principal, tiene todos los permisos
  if (classData.teacherId === teacherId) return true

  // Verificar permisos específicos
  const teacherPermissions = classData.permissions?.[teacherId]
  if (!teacherPermissions) return false

  return teacherPermissions.includes(permission)
}

/**
 * Verifica si una clase está compartida
 */
export function isSharedClass(classData: ClassData): boolean {
  return !!(classData.sharedWith && classData.sharedWith.length > 0)
}

/**
 * Obtiene el texto descriptivo para los permisos
 */
export function getPermissionText(permissions?: string[]): string {
  if (!permissions || permissions.length === 0) return "Sin permisos"

  if (permissions.includes("manage")) return "Administrador"
  if (permissions.includes("write")) return "Editor"
  if (permissions.includes("read")) return "Solo lectura"

  return "Permisos personalizados"
}

/**
 * Calcula estadísticas básicas de una clase
 */
export function calculateClassStats(classData: ClassData): {
  studentCount: number
  isShared: boolean
  sharedWithCount: number
  hasSchedule: boolean
} {
  return {
    studentCount: classData.studentIds?.length || 0,
    isShared: isSharedClass(classData),
    sharedWithCount: classData.sharedWith?.length || 0,
    hasSchedule: !!classData.schedule,
  }
}

/**
 * Formatea la capacidad de la clase
 */
export function formatCapacity(current: number, max?: number): string {
  if (!max) return `${current} estudiantes`
  return `${current}/${max} estudiantes`
}

/**
 * Verifica si una clase está llena
 */
export function isClassFull(classData: ClassData): boolean {
  if (!classData.capacity) return false
  return (classData.studentIds?.length || 0) >= classData.capacity
}

/**
 * Obtiene el porcentaje de ocupación de la clase
 */
export function getOccupancyPercentage(classData: ClassData): number {
  if (!classData.capacity) return 0
  const current = classData.studentIds?.length || 0
  return Math.round((current / classData.capacity) * 100)
}

/**
 * Filtra clases según los criterios de búsqueda
 */
export function filterClasses(
  classes: ClassData[],
  filters: {
    search?: string
    instrument?: string
    level?: string
    status?: string
    teacherId?: string
  }
): ClassData[] {
  return classes.filter((classItem) => {
    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        classItem.name?.toLowerCase().includes(searchLower) ||
        classItem.description?.toLowerCase().includes(searchLower) ||
        classItem.instrument?.toLowerCase().includes(searchLower) ||
        classItem.level?.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Filtro por instrumento
    if (filters.instrument && classItem.instrument !== filters.instrument) {
      return false
    }

    // Filtro por nivel
    if (filters.level && classItem.level !== filters.level) {
      return false
    }

    // Filtro por estado
    if (filters.status && classItem.status !== filters.status) {
      return false
    }

    // Filtro por maestro
    if (filters.teacherId) {
      const isMainTeacher = classItem.teacherId === filters.teacherId
      const isSharedTeacher = classItem.sharedWith?.includes(filters.teacherId)

      if (!isMainTeacher && !isSharedTeacher) {
        return false
      }
    }

    return true
  })
}

/**
 * Ordena clases según criterio
 */
export function sortClasses(
  classes: ClassData[],
  sortBy: "name" | "instrument" | "level" | "students" | "created",
  order: "asc" | "desc" = "asc"
): ClassData[] {
  return [...classes].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "name":
        comparison = (a.name || "").localeCompare(b.name || "")
        break
      case "instrument":
        comparison = (a.instrument || "").localeCompare(b.instrument || "")
        break
      case "level":
        comparison = (a.level || "").localeCompare(b.level || "")
        break
      case "students":
        comparison = (a.studentIds?.length || 0) - (b.studentIds?.length || 0)
        break
      case "created":
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        comparison = dateA - dateB
        break
    }

    return order === "desc" ? -comparison : comparison
  })
}
