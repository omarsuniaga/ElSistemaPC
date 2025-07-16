// 🔍 Test rápido de seguridad
console.log('🔍 [Security Test] Iniciando verificación...');

// Test 1: Verificar que no hay usuario autenticado
import('./src/firebase/config.ts').then(({ auth }) => {
  console.log('🔐 [Security] Firebase Auth User:', auth.currentUser ? 'AUTENTICADO' : 'NO AUTENTICADO');
  
  if (!auth.currentUser) {
    console.log('✅ [Security] CORRECTO: No hay usuario en vista de login');
  } else {
    console.warn('⚠️ [Security] ADVERTENCIA: Usuario autenticado detectado');
  }
});

// Test 2: Verificar estado del auth store
import('./src/stores/auth.ts').then(({ useAuthStore }) => {
  const authStore = useAuthStore();
  console.log('📊 [Security] Auth Store Estado:');
  console.log('  - isLoggedIn:', authStore.isLoggedIn);
  console.log('  - dataInitialized:', authStore.dataInitialized);
  console.log('  - isInitialized:', authStore.isInitialized);
  
  if (!authStore.isLoggedIn && !authStore.dataInitialized) {
    console.log('✅ [Security] CORRECTO: No se cargan datos sin autenticación');
  } else {
    console.warn('⚠️ [Security] Estado inconsistente detectado');
  }
});

// Test 3: Intentar acceso directo a Firestore
import('./src/firebase/config.ts').then(async ({ db }) => {
  const { collection, getDocs } = await import('firebase/firestore');
  
  console.log('🔥 [Security] Probando acceso directo a Firestore...');
  
  try {
    const startTime = Date.now();
    const snapshot = await getDocs(collection(db, 'USERS'));
    const loadTime = Date.now() - startTime;
    
    console.error(`❌ [Security] PELIGRO: Acceso exitoso sin auth (${snapshot.size} docs, ${loadTime}ms)`);
  } catch (error) {
    const loadTime = Date.now() - startTime;
    console.log(`✅ [Security] CORRECTO: Firestore bloqueó acceso (${loadTime}ms)`);
    console.log(`🔒 [Security] Error esperado: ${error.code}`);
  }
});

console.log('✅ [Security Test] Verificación completada - revisar resultados arriba');
