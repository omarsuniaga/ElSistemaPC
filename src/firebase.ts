import {initializeApp, getApps, getApp} from "firebase/app"
import {getAuth, connectAuthEmulator} from "firebase/auth"
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore"
import {
  getStorage,
  connectStorageEmulator,
  uploadBytesResumable,
  getDownloadURL,
  ref,
} from "firebase/storage"
import {getFunctions, connectFunctionsEmulator} from "firebase/functions"

// Validar variables de entorno de Firebase
const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    "VITE_APP_API_KEY",
    "VITE_APP_AUTH_DOMAIN",
    "VITE_APP_PROJECT_ID",
    "VITE_APP_STORAGE_BUCKET",
    "VITE_APP_MESSAGING_SENDER_ID",
    "VITE_APP_APP_ID",
  ]

  const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName])
  
  if (missingVars.length > 0) {
    console.error("❌ Variables de entorno de Firebase faltantes:", missingVars)
    return false
  }
  
  return true
}

// Validar configuración antes de inicializar
const isConfigValid = validateFirebaseConfig()

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID,
  measurementId: import.meta.env.VITE_APP_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_APP_DATABASE_URL,
}

// Inicializar Firebase solo si la configuración es válida
let app: any = null
if (isConfigValid) {
  try {
    // Verificar si ya hay una app inicializada para evitar duplicados
    const existingApps = getApps()
    if (existingApps.length > 0) {
      app = getApp()
      console.log("✅ Firebase ya está inicializado, reutilizando instancia existente")
    } else {
      app = initializeApp(firebaseConfig)
      console.log("✅ Firebase inicializado correctamente")
    }
  } catch (error) {
    console.error("❌ Error inicializando Firebase:", error)
  }
} else {
  console.error("❌ No se puede inicializar Firebase: configuración inválida")
}

// Conectar a emuladores solo en desarrollo y solo si no se ha conectado antes
let emulatorsConnected = false

const connectToEmulators = () => {
  // Evitar conectar múltiples veces
  if (emulatorsConnected) return

  try {
    // Verificar si estamos en desarrollo y usar emuladores
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true") {
      const host = "localhost"
      
      try {
        // Solo conectar si los servicios están disponibles
        if (auth && !auth._delegate?._emulator) {
          connectAuthEmulator(auth, `http://${host}:9099`, {disableWarnings: true})
        }
        
        if (db && !db._delegate?._databaseId?.database?.includes("emulator")) {
          connectFirestoreEmulator(db, host, 8080)
        }
        
        if (storage) {
          connectStorageEmulator(storage, host, 9199)
        }
        
        if (functions) {
          connectFunctionsEmulator(functions, host, 5001)
        }
        
        console.log("✅ Conectado a emuladores de Firebase")
        emulatorsConnected = true
      } catch (emulatorError) {
        console.warn(
          "⚠️ No se pudieron conectar los emuladores, usando servicios de producción:",
          emulatorError
        )
        // Continuar con servicios de producción sin error
      }
    } else {
      console.log("✅ Usando servicios de Firebase en producción")
    }
  } catch (error) {
    console.warn("⚠️ Error configurando emuladores, continuando con producción:", error)
    // No es un error crítico, continuar con servicios de producción
  }
}

// Inicializar servicios con persistencia moderna
let db: any = null
let auth: any = null
let storage: any = null
let functions: any = null

if (app && isConfigValid) {
  try {
    const firestoreSettings = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    }

    // Inicializar Firestore con la configuración de caché persistente
    db = initializeFirestore(app, firestoreSettings)
    auth = getAuth(app)
    storage = getStorage(app)
    functions = getFunctions(app)
    
    console.log("✅ Servicios de Firebase inicializados correctamente")
    
    // Conectar a emuladores si es necesario
    connectToEmulators()
  } catch (error) {
    console.error("❌ Error inicializando servicios de Firebase:", error)
  }
} else {
  console.warn("⚠️ Servicios de Firebase no inicializados: app o configuración inválida")
}

// Bandera para controlar si ya se ha intentado la persistencia
// const persistenceEnabled = true // Ya se configuró con initializeFirestore (eliminado por no usarse)

// Función para verificar si Firebase está correctamente inicializado
const isFirebaseReady = (): boolean => {
  try {
    const ready =
      app !== null &&
      db !== null &&
      auth !== null &&
      storage !== null &&
      functions !== null &&
      isConfigValid
    
    if (!ready) {
      console.debug("🔍 Firebase readiness check:", {
        app: !!app,
        db: !!db,
        auth: !!auth,
        storage: !!storage,
        functions: !!functions,
        configValid: isConfigValid,
      })
    }
    
    return ready
  } catch (error) {
    console.error("❌ Error checking Firebase readiness:", error)
    return false
  }
}

// Función para habilitar la persistencia cuando sea necesario (mantenida por compatibilidad)
const setupPersistence = async () => {
  // Ya no es necesario configurar la persistencia aquí, se hace en la inicialización
  return true
}

// Evitar conectar automáticamente a los emuladores
// Exportar la función para conectar cuando sea seguro hacerlo
export {app, auth, db, storage, functions, setupPersistence, connectToEmulators, isFirebaseReady}

export const uploadFile = async (file: File, path: string, _type: string) => {
  try {
    if (!storage) {
      throw new Error("Storage no está inicializado")
    }
    
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)
    await uploadTask
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
    return {url: downloadURL}
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}
