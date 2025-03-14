import { format, parseISO, isValid, parse } from 'date-fns'
import { es } from 'date-fns/locale'

// En src/utils/dateUtils.ts
export const getDayOfWeek = (date: Date): string => {
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long',
    timeZone: 'America/Caracas' // Ajusta según tu zona horaria
  }).replace(/^\w/, c => c.toUpperCase());
};

export function formatDate(date: Date | string, formatStr: string = 'PPP') {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) {
      throw new Error('Fecha inválida')
    }
    return format(dateObj, formatStr, { locale: es })
  } catch (error) {
    console.error('Error formateando fecha:', error)
    return 'Fecha inválida'
  }
}

export function getDayName(date: Date | string) {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) {
      throw new Error('Fecha inválida')
    }
    return format(dateObj, 'EEEE', { locale: es })
  } catch (error) {
    console.error('Error obteniendo nombre del día:', error)
    return 'Día inválido'
  }
}

export function getCurrentDate(formatStr: string = 'yyyy-MM-dd') {
  return format(new Date(), formatStr)
}

export function isValidDate(dateString: string) {
  const parsedDate = parseISO(dateString)
  return isValid(parsedDate)
}

export function parseDate(dateString: string, formatStr: string = 'yyyy-MM-dd') {
  try {
    if (!dateString) return null
    const parsedDate = parse(dateString, formatStr, new Date())
    return isValid(parsedDate) ? parsedDate : null
  } catch {
    return null
  }
}

// Mapeo de días de la semana (0 = domingo, 1 = lunes, etc.)
export const dayNumberToName = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado'
}

export const dayNameToNumber = {
  'domingo': 0,
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6
}

// Función para obtener el número del día (0-6) de una fecha
export function getDayNumber(date: Date | string): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj.getDay()
}

// Función para validar la coherencia entre fecha y día
export function validateDateDayCoherence(date: string, expectedDayName: string): boolean {
  try {
    const dateObj = parseISO(date)
    const actualDayName = format(dateObj, 'EEEE', { locale: es }).toLowerCase()
    return actualDayName === expectedDayName.toLowerCase()
  } catch {
    return false
  }
}