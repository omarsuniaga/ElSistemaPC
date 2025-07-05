// src/utils/safeAccess.ts
import {warn, error} from "./debug"

/**
 * Utilidades para acceso seguro a propiedades de objetos
 */

/**
 * Accede de forma segura a una propiedad anidada de un objeto
 * @param obj - El objeto a acceder
 * @param path - El path de la propiedad (ej: 'user.profile.name') o índice numérico
 * @param defaultValue - Valor por defecto si no existe
 */
export function safeGet<T = any>(
  obj: any,
  path: string | number,
  defaultValue: T = undefined as T
): T {
  try {
    // Si el objeto es null o undefined, devolver valor por defecto
    if (obj == null) {
      return defaultValue
    }

    // Si es un índice numérico, acceso directo para arrays/objetos
    if (typeof path === "number") {
      return obj[path] !== undefined ? obj[path] : defaultValue
    }

    // Si es un path simple (sin puntos), acceso directo
    if (!path.includes(".")) {
      return obj[path] !== undefined ? obj[path] : defaultValue
    }

    // Para paths anidados
    return (
      path.split(".").reduce((current, key) => {
        return current?.[key]
      }, obj) ?? defaultValue
    )
  } catch (err) {
    // Log error for debugging
    warn("SafeAccess: Error accessing path", {path, error: err})
    return defaultValue
  }
}

/**
 * Verifica si un array es válido y no está vacío
 * @param arr - Array a verificar
 */
export function isValidArray(arr: any): arr is any[] {
  return Array.isArray(arr) && arr.length > 0
}

/**
 * Verifica si un objeto es válido (no null, undefined, o vacío)
 * @param obj - Objeto a verificar
 */
export function isValidObject(obj: any): boolean {
  return obj !== null && obj !== undefined && typeof obj === "object" && !Array.isArray(obj)
}

/**
 * Obtiene la longitud segura de un array
 * @param arr - Array a medir
 * @param defaultLength - Longitud por defecto
 */
export function safeArrayLength(arr: any, defaultLength: number = 0): number {
  return Array.isArray(arr) ? arr.length : defaultLength
}

/**
 * Ejecuta una función de forma segura con try-catch
 * @param fn - Función a ejecutar
 * @param defaultValue - Valor por defecto en caso de error
 * @param errorMessage - Mensaje de error personalizado
 */
export function safeExecute<T>(fn: () => T, defaultValue: T, errorMessage?: string): T {
  try {
    return fn()
  } catch (err) {
    error(errorMessage || "SafeAccess: Error executing function", err)
    return defaultValue
  }
}

/**
 * Valida y filtra un array de forma segura
 * @param arr - Array a filtrar
 * @param filterFn - Función de filtro
 * @param defaultArray - Array por defecto
 */
export function safeFilter<T>(
  arr: any,
  filterFn: (item: T) => boolean,
  defaultArray: T[] = []
): T[] {
  if (!Array.isArray(arr)) {
    warn("SafeAccess: Attempted to filter non-array", {arr})
    return defaultArray
  }

  try {
    return arr.filter(filterFn)
  } catch (err) {
    error("SafeAccess: Error filtering array", err)
    return defaultArray
  }
}

/**
 * Realiza un map de forma segura en un array
 * @param arr - Array a mapear
 * @param mapFn - Función de mapeo
 * @param defaultArray - Array por defecto
 */
export function safeMap<T, R>(
  arr: any,
  mapFn: (item: T, index: number) => R,
  defaultArray: R[] = []
): R[] {
  if (!Array.isArray(arr)) {
    warn("SafeAccess: Attempted to map non-array", {arr})
    return defaultArray
  }

  try {
    return arr.map(mapFn)
  } catch (err) {
    error("SafeAccess: Error mapping array", err)
    return defaultArray
  }
}

/**
 * Encuentra un elemento de forma segura en un array
 * @param arr - Array donde buscar
 * @param findFn - Función de búsqueda
 * @param defaultValue - Valor por defecto
 */
export function safeFind<T>(
  arr: any,
  findFn: (item: T) => boolean,
  defaultValue: T | null = null
): T | null {
  if (!Array.isArray(arr)) {
    warn("SafeAccess: Attempted to find in non-array", {arr})
    return defaultValue
  }

  try {
    return arr.find(findFn) ?? defaultValue
  } catch (err) {
    error("SafeAccess: Error finding in array", err)
    return defaultValue
  }
}

/**
 * Accede de forma segura a propiedades de store
 * @param store - Store de Pinia
 * @param property - Propiedad a acceder
 * @param defaultValue - Valor por defecto
 */
export function safeStoreAccess<T>(store: any, property: string, defaultValue: T): T {
  if (!store || !isValidObject(store)) {
    warn("SafeAccess: Invalid store provided", {store})
    return defaultValue
  }

  return safeGet(store, property, defaultValue)
}

/**
 * Calcula de forma segura operaciones matemáticas
 * @param operation - Función de operación matemática
 * @param defaultValue - Valor por defecto en caso de error
 */
export function safeMath(operation: () => number, defaultValue: number = 0): number {
  try {
    const result = operation()
    return isNaN(result) || !isFinite(result) ? defaultValue : result
  } catch (err) {
    error("SafeAccess: Error in mathematical operation", err)
    return defaultValue
  }
}
