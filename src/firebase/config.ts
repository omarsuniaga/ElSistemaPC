import {initializeApp, getApps, getApp} from "firebase/app"
import {getFirestore} from "firebase/firestore"
import {getStorage} from "firebase/storage"
import {getAuth} from "firebase/auth"
import {getFunctions} from "firebase/functions"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID,
}

// Verificar que las variables de entorno estén disponibles
console.log("🔍 [Firebase Config] Verificando variables de entorno...")
const requiredEnvVars = [
  "VITE_APP_API_KEY",
  "VITE_APP_AUTH_DOMAIN",
  "VITE_APP_PROJECT_ID",
  "VITE_APP_STORAGE_BUCKET",
  "VITE_APP_MESSAGING_SENDER_ID",
  "VITE_APP_APP_ID",
]

for (const envVar of requiredEnvVars) {
  const value = import.meta.env[envVar]
  if (!value) {
    console.error(`❌ [Firebase Config] Variable de entorno faltante: ${envVar}`)
  } else {
    console.log(`✅ [Firebase Config] ${envVar}: ${value.substring(0, 10)}...`)
  }
}

console.log("🔍 [Firebase Config] Configuración Firebase:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
})

// Inicializar Firebase solo si no existe una instancia
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Exportar instancias de los servicios
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export const functions = getFunctions(app)

console.log("✅ [Firebase Config] Firebase inicializado correctamente")
console.log("📊 [Firebase Config] Servicios disponibles:", {
  app: !!app,
  db: !!db,
  storage: !!storage,
  auth: !!auth,
  functions: !!functions,
})

export default app
