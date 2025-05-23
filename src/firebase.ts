import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator, uploadBytesResumable, getDownloadURL, ref } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID,
  measurementId: import.meta.env.VITE_APP_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_APP_DATABASE_URL
};

// Inicializar Firebase (solo una vez)
const app = initializeApp(firebaseConfig);

// Inicializar servicios con persistencia moderna
const firestoreSettings = {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
};

// Inicializar Firestore con la configuración de caché persistente
const db = initializeFirestore(app, firestoreSettings);
const auth = getAuth(app);
const storage = getStorage(app);

// Bandera para controlar si ya se ha intentado la persistencia
let persistenceEnabled = true; // Ya se configuró con initializeFirestore

// Función para habilitar la persistencia cuando sea necesario (mantenida por compatibilidad)
const setupPersistence = async () => {
  // Ya no es necesario configurar la persistencia aquí, se hace en la inicialización
  return true;
};

// Conectar a emuladores solo en desarrollo y solo si no se ha conectado antes
let emulatorsConnected = false;

const connectToEmulators = () => {
  // Evitar conectar múltiples veces
  if (emulatorsConnected) return;
  
  try {
    // Verificar si estamos en desarrollo y usar emuladores
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
      const host = 'localhost';
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(db, host, 8080);
      connectStorageEmulator(storage, host, 9199);
      console.log('Connected to Firebase emulators');
      emulatorsConnected = true;
    }
  } catch (error) {
    console.error('Failed to connect to Firebase emulators:', error);
  }
};

// Evitar conectar automáticamente a los emuladores
// Exportar la función para conectar cuando sea seguro hacerlo
export { app, auth, db, storage, setupPersistence, connectToEmulators };

export const uploadFile = async (file: File, path: string, type: string) => {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    await uploadTask;
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    return { url: downloadURL };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

