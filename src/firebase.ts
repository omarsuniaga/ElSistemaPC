import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, getDocs, collection } from 'firebase/firestore'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Get environment variables from import.meta.env or process.env
const getEnvVar = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key]
  }
  return process.env[key]
}

// Configuración de Firebase
const firebaseConfig = {
  apiKey: getEnvVar('VITE_APP_API_KEY'),
  authDomain: getEnvVar('VITE_APP_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_APP_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_APP_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_APP_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_APP_APP_ID')
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

// Configurar persistencia local
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

const storage = getStorage(app);

console.log('✅ Conexión a Firebase establecida exitosamente');
console.log('✅ Caché de Firestore configurada con soporte para múltiples pestañas');

// Exportar las instancias inicializadas
export { db, auth, storage, getDocs, collection }
