import {parseISO, format} from "date-fns"
import {es} from "date-fns/locale"

/**
 * Utilidades para formatear datos del informe de asistencia
 */

// Formatear fecha completa
export const formatDate = (dateStr: string) => {
  try {
    const date = parseISO(dateStr)
    return format(date, "dd MMM yyyy", {locale: es})
  } catch (e) {
    return dateStr
  }
}

// Formatear fecha corta
export const formatDateShort = (dateStr: string) => {
  try {
    const date = parseISO(dateStr)
    return format(date, "d MMM", {locale: es})
  } catch (e) {
    return dateStr
  }
}

// Obtener símbolo de estado de asistencia
export const getStatusSymbol = (status: string): string => {
  switch (status) {
    case "P":
      return "P"
    case "A":
      return "A"
    case "T":
      return "T"
    case "J":
      return "J"
    default:
      return "-"
  }
}

// Obtener texto de estado
export const getStatusText = (status: string): string => {
  switch (status) {
    case "P":
      return "Presente"
    case "A":
      return "Ausente"
    case "T":
      return "Tarde"
    case "J":
      return "Justificado"
    default:
      return "Sin datos"
  }
}

// Obtener clase CSS para el estado
export const getStatusClass = (status: string): string => {
  switch (status) {
    case "P":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    case "A":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    case "T":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "J":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    default:
      return "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
  }
}

// Obtener nombre del día
export const getDayName = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr)
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    return dayNames[date.getDay()]
  } catch (e) {
    return ""
  }
}

// Formatear observación
export const formatObservationText = (text: string, maxLength = 100): string => {
  if (!text || text.trim() === "") return ""

  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed

  return trimmed.substring(0, maxLength) + "..."
}
