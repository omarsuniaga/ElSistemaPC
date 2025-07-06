import {db, storage, auth, functions} from "./config"
import {getApp} from "firebase/app"

// Re-exportar instancias de Firebase
export {db, storage, auth, functions}
export {default as app} from "./config"

/**
 * Verifica si Firebase está correctamente inicializado y listo para usar
 */
export function isFirebaseReady(): boolean {
  try {
    // Verificar que la aplicación de Firebase esté inicializada
    const app = getApp()
    
    // Verificar que las instancias de servicio estén disponibles
    if (!db || !auth || !storage || !functions) {
      console.warn("❌ Una o más instancias de Firebase no están disponibles")
      return false
    }

    // Verificar configuración básica
    if (!app.options.projectId) {
      console.warn("❌ Project ID de Firebase no está configurado")
      return false
    }

    return true
  } catch (error) {
    console.warn("❌ Firebase no está inicializado:", error)
    return false
  }
}
