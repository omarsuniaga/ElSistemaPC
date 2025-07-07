/**
 * 🔥 FIREBASE INITIALIZER
 * Gestiona la inicialización diferida de Firebase y sus servicios
 * Resuelve problemas de orden de carga y dependencias circulares
 */

import {getApps} from "firebase/app"

interface FirebaseReadyState {
  isReady: boolean
  app: any
  db: any
  auth: any
  storage: any
  functions: any
  error?: string
}

let firebaseReadyState: FirebaseReadyState = {
  isReady: false,
  app: null,
  db: null,
  auth: null,
  storage: null,
  functions: null,
}

const readyCallbacks: Array<(state: FirebaseReadyState) => void> = []

/**
 * Verifica si Firebase está completamente inicializado
 */
export const isFirebaseReady = (): boolean => {
  return firebaseReadyState.isReady && getApps().length > 0
}

/**
 * Obtiene el estado actual de Firebase
 */
export const getFirebaseState = (): FirebaseReadyState => {
  return {...firebaseReadyState}
}

/**
 * Registra un callback para cuando Firebase esté listo
 */
export const onFirebaseReady = (callback: (state: FirebaseReadyState) => void): void => {
  if (firebaseReadyState.isReady) {
    callback(firebaseReadyState)
  } else {
    readyCallbacks.push(callback)
  }
}

/**
 * Espera a que Firebase esté completamente inicializado
 */
export const waitForFirebase = (timeoutMs = 10000): Promise<FirebaseReadyState> => {
  return new Promise((resolve, reject) => {
    if (firebaseReadyState.isReady) {
      resolve(firebaseReadyState)
      return
    }

    const timeout = setTimeout(() => {
      reject(new Error(`Firebase no se inicializó en ${timeoutMs}ms`))
    }, timeoutMs)

    onFirebaseReady((state) => {
      clearTimeout(timeout)
      resolve(state)
    })
  })
}

/**
 * Inicializa Firebase de manera diferida
 */
export const initializeFirebaseServices = async (): Promise<FirebaseReadyState> => {
  try {
    console.log("🔍 [Firebase Initializer] Inicializando servicios...")

    // Intentar importar desde el archivo principal
    let firebaseModule: any
    try {
      firebaseModule = await import("../firebase")
    } catch (mainError) {
      console.warn("⚠️ Intentando fallback con firebase/config...")
      firebaseModule = await import("../firebase/config")
    }

    const {app, db, auth, storage, functions, isFirebaseReady: checkReady} = firebaseModule

    // Verificar que todos los servicios estén disponibles
    if (!app || !db || !auth || !storage || !functions) {
      throw new Error("Algunos servicios de Firebase no están disponibles")
    }

    // Verificar usando la función de verificación si está disponible
    if (checkReady && !checkReady()) {
      throw new Error("Firebase no está completamente listo")
    }

    // Actualizar estado
    firebaseReadyState = {
      isReady: true,
      app,
      db,
      auth,
      storage,
      functions,
    }

    console.log("✅ [Firebase Initializer] Servicios inicializados correctamente")

    // Notificar a todos los callbacks
    readyCallbacks.forEach((callback) => callback(firebaseReadyState))
    readyCallbacks.length = 0 // Limpiar callbacks

    return firebaseReadyState
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("❌ [Firebase Initializer] Error:", errorMessage)

    firebaseReadyState.error = errorMessage
    throw error
  }
}

/**
 * Reinicia el estado de Firebase (útil para testing)
 */
export const resetFirebaseState = (): void => {
  firebaseReadyState = {
    isReady: false,
    app: null,
    db: null,
    auth: null,
    storage: null,
    functions: null,
  }
  readyCallbacks.length = 0
}

// Auto-inicialización diferida
let initPromise: Promise<FirebaseReadyState> | null = null

/**
 * Obtiene la promesa de inicialización (lazy)
 */
export const getFirebaseInitPromise = (): Promise<FirebaseReadyState> => {
  if (!initPromise) {
    initPromise = initializeFirebaseServices()
  }
  return initPromise
}

export default {
  isFirebaseReady,
  getFirebaseState,
  onFirebaseReady,
  waitForFirebase,
  initializeFirebaseServices,
  resetFirebaseState,
  getFirebaseInitPromise,
}
