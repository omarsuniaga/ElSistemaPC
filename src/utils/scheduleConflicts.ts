// src/utils/scheduleConflicts.ts

export interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

export interface ScheduleConflict {
  type: "student" | "teacher" | "classroom"
  conflictingEntity: {
    id: string
    name: string
    className?: string
  }
  conflictingSlot: TimeSlot
  severity: "error" | "warning"
  message: string
}

export interface ScheduleValidationResult {
  hasConflicts: boolean
  conflicts: ScheduleConflict[]
  warnings: ScheduleConflict[]
}

/**
 * Convierte una hora en formato HH:MM a minutos desde medianoche
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Convierte minutos desde medianoche a formato HH:MM
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

/**
 * Verifica si dos franjas horarias se superponen
 */
export function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // Deben ser el mismo día
  if (slot1.day !== slot2.day) return false

  const start1 = timeToMinutes(slot1.startTime)
  const end1 = timeToMinutes(slot1.endTime)
  const start2 = timeToMinutes(slot2.startTime)
  const end2 = timeToMinutes(slot2.endTime)

  // Verificar superposición
  return start1 < end2 && start2 < end1
}

/**
 * Calcula el tiempo de superposición entre dos franjas horarias en minutos
 */
export function getOverlapMinutes(slot1: TimeSlot, slot2: TimeSlot): number {
  if (!timeSlotsOverlap(slot1, slot2)) return 0

  const start1 = timeToMinutes(slot1.startTime)
  const end1 = timeToMinutes(slot1.endTime)
  const start2 = timeToMinutes(slot2.startTime)
  const end2 = timeToMinutes(slot2.endTime)

  const overlapStart = Math.max(start1, start2)
  const overlapEnd = Math.min(end1, end2)

  return overlapEnd - overlapStart
}

/**
 * Formatea la información de un conflicto para mostrar al usuario
 */
export function formatConflictMessage(conflict: ScheduleConflict): string {
  const {type, conflictingEntity, conflictingSlot} = conflict

  const timeRange = `${conflictingSlot.startTime} - ${conflictingSlot.endTime}`
  const day = conflictingSlot.day
  switch (type) {
    case "student":
      return `⚠️ CONFLICTO DE ESTUDIANTE: ${conflictingEntity.name} ya está inscrito en "${conflictingEntity.className}" los ${day} de ${timeRange}. Ningún alumno puede estar en más de una clase simultáneamente.`
    case "teacher":
      return `⚠️ CONFLICTO DE PROFESOR: ${conflictingEntity.name} ya tiene clase "${conflictingEntity.className}" los ${day} de ${timeRange}`
    case "classroom":
      return `⚠️ CONFLICTO DE AULA: ${conflictingEntity.name} ya está ocupada por "${conflictingEntity.className}" los ${day} de ${timeRange}`
    default:
      return `⚠️ Conflicto de horario detectado los ${day} de ${timeRange}`
  }
}

/**
 * Verifica si un horario de clase tiene al menos X minutos de separación con otro
 */
export function hasMinimumSeparation(
  slot1: TimeSlot,
  slot2: TimeSlot,
  minimumMinutes: number = 15
): boolean {
  if (slot1.day !== slot2.day) return true

  const end1 = timeToMinutes(slot1.endTime)
  const start2 = timeToMinutes(slot2.startTime)
  const end2 = timeToMinutes(slot2.endTime)
  const start1 = timeToMinutes(slot1.startTime)

  // Verificar separación entre el final de una clase y el inicio de otra
  const separation1 = Math.abs(start2 - end1)
  const separation2 = Math.abs(start1 - end2)

  return Math.min(separation1, separation2) >= minimumMinutes
}

/**
 * Sugiere horarios alternativos cuando hay conflictos
 */
export function suggestAlternativeSlots(
  originalSlot: TimeSlot,
  conflicts: TimeSlot[],
  workingHours: {start: string; end: string} = {start: "08:00", end: "20:00"}
): TimeSlot[] {
  const suggestions: TimeSlot[] = []
  const duration = timeToMinutes(originalSlot.endTime) - timeToMinutes(originalSlot.startTime)

  const workStart = timeToMinutes(workingHours.start)
  const workEnd = timeToMinutes(workingHours.end)

  // Generar slots cada 30 minutos dentro del horario laboral
  for (let start = workStart; start + duration <= workEnd; start += 30) {
    const newSlot: TimeSlot = {
      day: originalSlot.day,
      startTime: minutesToTime(start),
      endTime: minutesToTime(start + duration),
    }

    // Verificar que no tenga conflictos
    const hasConflict = conflicts.some((conflict) => timeSlotsOverlap(newSlot, conflict))

    if (!hasConflict) {
      suggestions.push(newSlot)
    }
  }

  return suggestions.slice(0, 5) // Limitar a 5 sugerencias
}
