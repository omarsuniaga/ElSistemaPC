// Script de diagnóstico para verificar Firebase
// Archivo: firebase-diagnostic.js

import { db, auth, storage, isFirebaseReady } from './src/firebase.js'

console.log('🔍 Diagnóstico de Firebase')
console.log('========================')

console.log('Variables de entorno:')
console.log('- VITE_APP_PROJECT_ID:', import.meta.env.VITE_APP_PROJECT_ID)
console.log('- VITE_APP_API_KEY:', import.meta.env.VITE_APP_API_KEY ? 'Configurado' : 'NO CONFIGURADO')
console.log('- VITE_USE_EMULATORS:', import.meta.env.VITE_USE_EMULATORS)

console.log('\nEstado de servicios:')
console.log('- Firebase App:', typeof app !== 'undefined' ? 'Inicializado' : 'NO INICIALIZADO')
console.log('- Firestore DB:', db ? 'Inicializado' : 'NO INICIALIZADO')
console.log('- Auth:', auth ? 'Inicializado' : 'NO INICIALIZADO')
console.log('- Storage:', storage ? 'Inicializado' : 'NO INICIALIZADO')

console.log('\nEstado general:')
console.log('- Firebase Ready:', isFirebaseReady() ? '✅ SÍ' : '❌ NO')

if (!isFirebaseReady()) {
  console.log('\n❌ PROBLEMA DETECTADO:')
  console.log('Firebase no está completamente inicializado.')
  console.log('Verifica que todas las variables de entorno estén configuradas correctamente.')
}
