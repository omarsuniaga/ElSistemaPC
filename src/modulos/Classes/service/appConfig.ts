import {doc, getDoc, setDoc} from "firebase/firestore"
import {db} from "../../../firebase"

const CONFIG_COLLECTION = "CONFIGURACION"
const CONFIG_DOC = "app_config"

export interface AppConfig {
  esTemprano: boolean // 7am a 2pm
  esTarde: boolean // 2pm a 7pm
  esNoche: boolean // 7pm a 11pm
  viewMode?: "standard" | "overlap" // Modo de visualización
}

const defaultConfig: AppConfig = {
  esTemprano: true,
  esTarde: true,
  esNoche: true,
  viewMode: "standard",
}

/**
 * Obtiene la configuración de la aplicación desde Firestore
 */
export const getAppConfig = async (): Promise<AppConfig> => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC)
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      const data = configSnap.data()
      return {
        ...defaultConfig,
        ...data,
      }
    } else {
      // Si no existe el documento, crear uno con la configuración por defecto
      await setAppConfig(defaultConfig)
      return defaultConfig
    }
  } catch (error) {
    console.error("Error al obtener configuración de la app:", error)
    return defaultConfig
  }
}

/**
 * Guarda la configuración de la aplicación en Firestore
 */
export const setAppConfig = async (config: Partial<AppConfig>): Promise<void> => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC)
    await setDoc(configRef, config, {merge: true})
    console.log("Configuración guardada exitosamente")
  } catch (error) {
    console.error("Error al guardar configuración de la app:", error)
    throw error
  }
}

/**
 * Actualiza una propiedad específica de la configuración
 */
export const updateAppConfigProperty = async (
  property: keyof AppConfig,
  value: any
): Promise<void> => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC)
    await setDoc(configRef, {[property]: value}, {merge: true})
    console.log(`Propiedad ${property} actualizada a:`, value)
  } catch (error) {
    console.error(`Error al actualizar propiedad ${property}:`, error)
    throw error
  }
}

/**
 * Obtiene el rango de horas según la configuración activa
 */
export const getActiveTimeRange = (config: AppConfig): {start: number; end: number} => {
  let startHour = 23 // Hora más tardía posible
  let endHour = 7 // Hora más temprana posible

  if (config.esTemprano) {
    startHour = Math.min(startHour, 7) // 7 AM
    endHour = Math.max(endHour, 14) // 2 PM
  }

  if (config.esTarde) {
    startHour = Math.min(startHour, 14) // 2 PM
    endHour = Math.max(endHour, 19) // 7 PM
  }

  if (config.esNoche) {
    startHour = Math.min(startHour, 19) // 7 PM
    endHour = Math.max(endHour, 23) // 11 PM
  }

  // Si no hay ningún período activo, mostrar todo el día
  if (!config.esTemprano && !config.esTarde && !config.esNoche) {
    startHour = 7
    endHour = 23
  }

  return {start: startHour, end: endHour}
}

/**
 * Verifica si una hora está dentro de los períodos activos
 */
export const isHourInActivePeriods = (hour: number, config: AppConfig): boolean => {
  const periods = []

  if (config.esTemprano) {
    periods.push({start: 7, end: 14})
  }

  if (config.esTarde) {
    periods.push({start: 14, end: 19})
  }

  if (config.esNoche) {
    periods.push({start: 19, end: 23})
  }

  // Si no hay períodos activos, mostrar todas las horas
  if (periods.length === 0) {
    return true
  }

  return periods.some((period) => hour >= period.start && hour < period.end)
}
