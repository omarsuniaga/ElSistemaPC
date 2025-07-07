import {initializeApp, getApps, getApp} from "firebase/app"
import {getFirestore} from "firebase/firestore"
import {getStorage} from "firebase/storage"
import {getAuth} from "firebase/auth"
import {getFunctions} from "firebase/functions"

// Validar variables de entorno antes de crear la configuración
const validateEnvironment = () => {
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
    console.error("❌ [Firebase Config] Variables de entorno faltantes:", missingVars)
    return false
  }

  // Validar formato de API key
  const apiKey = import.meta.env.VITE_APP_API_KEY
  if (!apiKey || !apiKey.startsWith("AIza")) {
    console.error("❌ [Firebase Config] API key inválida - debe comenzar con 'AIza'")
    return false
  }

  return true
}

// Verificar entorno antes de proceder
const isEnvironmentValid = validateEnvironment()

if (!isEnvironmentValid) {
  console.error("❌ [Firebase Config] Entorno no válido, Firebase no se inicializará")
  throw new Error("Firebase environment validation failed")
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID,
}

// Log de configuración (ocultando API key completa por seguridad)
console.log("🔍 [Firebase Config] Configuración Firebase:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: `${firebaseConfig.apiKey.substring(0, 10)}...`,
  hasValidConfig: true,
})

// Inicializar Firebase solo si no existe una instancia
let app: any = null
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  console.log("✅ [Firebase Config] Firebase inicializado correctamente")
} catch (error) {
  console.error("❌ [Firebase Config] Error inicializando Firebase:", error)
  throw error
}

// Exportar instancias de los servicios con manejo de errores
let db: any = null
let storage: any = null
let auth: any = null
let functions: any = null

try {
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
  functions = getFunctions(app)
  
  console.log("✅ [Firebase Config] Servicios Firebase inicializados:", {
    app: !!app,
    db: !!db,
    storage: !!storage,
    auth: !!auth,
    functions: !!functions,
  })
} catch (error) {
  console.error("❌ [Firebase Config] Error inicializando servicios Firebase:", error)
  
  // Si hay error con la API key, mostrar mensaje más específico
  if (error instanceof Error && error.message.includes("auth/invalid-api-key")) {
    console.error(
      "🔑 [Firebase Config] API Key inválida o revocada. Verifica las credenciales en Firebase Console."
    )
    console.error("💡 [Firebase Config] Posibles soluciones:")
    console.error("   1. Verifica que la API Key sea correcta en el archivo .env")
    console.error("   2. Regenera la API Key en Firebase Console")
    console.error("   3. Verifica que el proyecto Firebase esté activo")
  }
  
  throw error
}

export {db, storage, auth, functions}

export default app
