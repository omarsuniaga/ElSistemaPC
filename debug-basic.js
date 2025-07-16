// Script básico de debug
console.log('🔍 Debug básico iniciando...');

// 1. Verificar Node.js
console.log('✅ Node.js versión:', process.version);

// 2. Verificar directorio actual
console.log('📁 Directorio actual:', process.cwd());

// 3. Verificar dotenv
try {
  const dotenv = await import('dotenv');
  dotenv.config();
  console.log('✅ dotenv cargado');

  // 4. Verificar variables básicas
  console.log('🔑 Variables de entorno:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log(
    '- VITE_APP_PROJECT_ID:',
    process.env.VITE_APP_PROJECT_ID ? 'Definida' : 'NO definida',
  );
  console.log('- VITE_APP_API_KEY:', process.env.VITE_APP_API_KEY ? 'Definida' : 'NO definida');
} catch (error) {
  console.error('❌ Error cargando dotenv:', error.message);
}

// 5. Verificar archivos
import fs from 'fs';

console.log('\n📄 Archivos:');
console.log('- .env existe:', fs.existsSync('.env') ? '✅' : '❌');
console.log('- CSV existe:', fs.existsSync('INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv') ? '✅' : '❌');

// 6. Verificar Firebase
try {
  console.log('\n🔥 Verificando Firebase...');
  const { initializeApp } = await import('firebase/app');

  const firebaseConfig = {
    apiKey: process.env.VITE_APP_API_KEY,
    authDomain: process.env.VITE_APP_AUTH_DOMAIN,
    projectId: process.env.VITE_APP_PROJECT_ID,
    storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
    appId: process.env.VITE_APP_APP_ID,
  };

  console.log('🔧 Config Firebase:');
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    console.log(`- ${key}:`, value ? 'Definido' : 'NO definido');
  });

  if (firebaseConfig.projectId) {
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado');

    const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
    const db = getFirestore(app);
    console.log('✅ Firestore conectado');
  } else {
    console.log('❌ No se puede inicializar Firebase - falta PROJECT_ID');
  }
} catch (error) {
  console.error('❌ Error con Firebase:', error.message);
}

console.log('\n🎯 Debug completado');
