/**
 * Utility functions for the Montaje module
 */

import type { DifficultyLevel, InstrumentType, WorkStatus } from '../types'

/**
 * Format date to readable string in Spanish
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format date with time
 */
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date)
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get difficulty label in Spanish
 */
export const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
  const labels: Record<DifficultyLevel, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    professional: 'Profesional'
  }
  return labels[difficulty]
}

/**
 * Get difficulty color class
 */
export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  const colors: Record<DifficultyLevel, string> = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-orange-100 text-orange-800',
    professional: 'bg-red-100 text-red-800'
  }
  return colors[difficulty]
}

/**
 * Get instrument label in Spanish
 */
export const getInstrumentLabel = (instrument: InstrumentType): string => {
  const labels: Record<InstrumentType, string> = {
    violin: 'Violín',
    viola: 'Viola',
    cello: 'Violonchelo',
    bass: 'Contrabajo',
    flute: 'Flauta',
    oboe: 'Oboe',
    clarinet: 'Clarinete',
    bassoon: 'Fagot',
    horn: 'Trompa',
    trumpet: 'Trompeta',
    trombone: 'Trombón',
    tuba: 'Tuba',
    timpani: 'Timbales',
    percussion: 'Percusión',
    piano: 'Piano',
    harp: 'Arpa'
  }
  return labels[instrument]
}

/**
 * Get work status label in Spanish
 */
export const getStatusLabel = (status: WorkStatus): string => {
  const labels: Record<WorkStatus, string> = {
    active: 'Activa',
    inactive: 'Inactiva',
    completed: 'Completada',
    archived: 'Archivada'
  }
  return labels[status]
}

/**
 * Get status color class
 */
export const getStatusColor = (status: WorkStatus): string => {
  const colors: Record<WorkStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-yellow-100 text-yellow-800'
  }
  return colors[status]
}

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Validate URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Format duration in minutes to human readable
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Get score color based on value
 */
export const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  if (score >= 60) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Get score background color
 */
export const getScoreBackgroundColor = (score: number): string => {
  if (score >= 90) return 'bg-green-100'
  if (score >= 80) return 'bg-blue-100'
  if (score >= 70) return 'bg-yellow-100'
  if (score >= 60) return 'bg-orange-100'
  return 'bg-red-100'
}

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

/**
 * Sort array by property
 */
export const sortBy = <T>(array: T[], property: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aValue = a[property]
    const bValue = b[property]
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Group array by property
 */
export const groupBy = <T>(array: T[], property: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const key = String(item[property])
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Calculate average
 */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate color based on string
 */
export const stringToColor = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    'bg-red-100 text-red-800',
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800'
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Export utilities object for easy import
 */
export const montajeUtils = {
  formatDate,
  formatDateTime,
  getDifficultyLabel,
  getDifficultyColor,
  getInstrumentLabel,
  getStatusLabel,
  getStatusColor,
  calculatePercentage,
  generateId,
  debounce,
  isValidUrl,
  formatDuration,
  getScoreColor,
  getScoreBackgroundColor,
  truncateText,
  sortBy,
  groupBy,
  calculateAverage,
  deepClone,
  isEmpty,
  capitalize,
  formatFileSize,
  stringToColor
}
