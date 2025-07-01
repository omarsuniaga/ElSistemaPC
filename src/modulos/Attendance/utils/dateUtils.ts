// src/utils/dateUtils.ts
import {format, parseISO, isValid, isFuture, eachDayOfInterval, addDays} from "date-fns"
import {es} from "date-fns/locale"
// src/utils/dateUtils.ts

/**
 * Devuelve el nombre del día en minúsculas para una fecha ISO válida.
 * Si la fecha no es válida, retorna cadena vacía.
 */
export function dayName(iso?: unknown): string {
  // Verificar si el valor es undefined, null o no es un string
  if (iso === undefined || iso === null) return ""

  // Verificar si es un string
  if (typeof iso !== "string") return ""

  // Verificar si el string está vacío o solo contiene espacios
  if (!iso.trim()) return ""

  try {
    // Intentar crear una fecha válida sin usar parseISO directamente
    const d = new Date(`${iso}T00:00:00`)
    if (isNaN(d.getTime())) return ""

    // Si llegamos aquí, la fecha es válida
    return format(d, "EEEE", {locale: es}).toLowerCase()
  } catch (error) {
    // Capturar cualquier error que pueda ocurrir durante el procesamiento
    console.error("Error al procesar la fecha:", error)
    return ""
  }
}

/** Devuelve la fecha de hoy en formato YYYY‑MM‑DD local */
export function getCurrentDate(): string {
  return format(new Date(), "yyyy-MM-dd")
}

/** Convierte cualquier string o Date a YYYY‑MM‑DD (lanza error si no es válido) */
export function normalizeDate(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d
  if (!isValid(date)) throw new Error(`Fecha inválida: ${d}`)
  return format(date, "yyyy-MM-dd")
}

/** True si la fecha (string o Date) está en el futuro respecto a hoy */
export function isFutureDate(d: string | Date): boolean {
  const date = typeof d === "string" ? parseISO(d) : d
  return isFuture(date)
}

/** Formatea fecha YYYY‑MM‑DD a «12 de abril 2025» en español */
export function humanDate(iso: string): string {
  return format(parseISO(iso), "d 'de' MMMM yyyy", {locale: es})
}

/** Rango de fechas (YYYY‑MM‑DD) entre start y end, inclusive */
export function range(isoStart: string, isoEnd: string): string[] {
  const [start, end] = [parseISO(isoStart), parseISO(isoEnd)]
  if (!isValid(start) || !isValid(end)) return []
  return eachDayOfInterval({start, end}).map((d) => format(d, "yyyy-MM-dd"))
}

/** Suma N días a una fecha YYYY‑MM‑DD y devuelve el nuevo ISO */
export function addDaysISO(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd")
}
