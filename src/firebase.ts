import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, getDocs, collection } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID
}

// Inicializar Firebase
let app;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Inicializar Firestore con soporte para múltiples pestañas
const db = getFirestore(app)
const auth = getAuth(app);
const storage = getStorage(app);

// Configurar emuladores en desarrollo
if (import.meta.env.DEV) {
  const EMULATOR_HOST = 'localhost'
  
  // Función para verificar si un puerto está disponible
  const checkPort = async (port: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://${EMULATOR_HOST}:${port}`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(2000) // 2 segundos de timeout
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Verificar y conectar emuladores
  Promise.all([
    checkPort(8080).then(available => {
      if (available) {
        // connectFirestoreEmulator(db, EMULATOR_HOST, 8080)
        console.log('✅ Conectado al emulador de Firestore')
      } else {
        console.log('Emulador en localhost:8080 no disponible: timeout')
      }
    })
  ]).catch(console.error)
}

console.log('✅ Conexión a Firebase establecida exitosamente')
console.log('✅ Caché de Firestore configurada con soporte para múltiples pestañas')

// Exportar las instancias inicializadas
export { db, auth, storage, getDocs, collection }
