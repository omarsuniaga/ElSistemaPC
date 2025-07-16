// Test de conectividad de Firebase
// Este archivo verifica que Firebase esté funcionando correctamente

console.log('🔍 Verificando Firebase...');

// Verificar variables de entorno
const envVars = {
  'VITE_APP_PROJECT_ID': import.meta.env.VITE_APP_PROJECT_ID,
  'VITE_APP_API_KEY': import.meta.env.VITE_APP_API_KEY ? '✓ Configurado' : '❌ Faltante',
  'VITE_USE_EMULATORS': import.meta.env.VITE_USE_EMULATORS,
};

console.log('📋 Variables de entorno:', envVars);

// Importar Firebase después de verificar variables
import { db, auth, storage, isFirebaseReady } from '../src/firebase.js';

// Verificar servicios
setTimeout(() => {
  console.log('🔧 Estado de servicios Firebase:');
  console.log('- Firebase Ready:', isFirebaseReady() ? '✅' : '❌');
  console.log('- Firestore DB:', db ? '✅ Conectado' : '❌ No disponible');
  console.log('- Auth:', auth ? '✅ Conectado' : '❌ No disponible');
  console.log('- Storage:', storage ? '✅ Conectado' : '❌ No disponible');
  
  if (isFirebaseReady()) {
    console.log('🎉 Firebase está funcionando correctamente!');
  } else {
    console.log('⚠️ Hay problemas con la configuración de Firebase');
  }
}, 1000);
