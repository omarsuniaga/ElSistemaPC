/**
 * Script de conectividad básica para verificar que podemos acceder a Firestore
 */

import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function testBasicConnectivity() {
  console.log('🔍 Probando conectividad básica...\n');

  try {
    // Verificar variables
    const requiredVars = {
      VITE_APP_API_KEY: process.env.VITE_APP_API_KEY,
      VITE_APP_AUTH_DOMAIN: process.env.VITE_APP_AUTH_DOMAIN,
      VITE_APP_PROJECT_ID: process.env.VITE_APP_PROJECT_ID,
      VITE_APP_STORAGE_BUCKET: process.env.VITE_APP_STORAGE_BUCKET,
      VITE_APP_MESSAGING_SENDER_ID: process.env.VITE_APP_MESSAGING_SENDER_ID,
      VITE_APP_APP_ID: process.env.VITE_APP_APP_ID,
    };

    console.log('📋 Verificando variables de entorno:');
    let allVarsPresent = true;

    for (const [name, value] of Object.entries(requiredVars)) {
      if (value) {
        console.log(`✅ ${name}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`❌ ${name}: NO DEFINIDA`);
        allVarsPresent = false;
      }
    }

    if (!allVarsPresent) {
      console.log('\n⚠️ Faltan variables de entorno. Por favor:');
      console.log('1. Copia .env.example a .env');
      console.log('2. Completa las variables con tus datos de Firebase');
      return;
    }

    console.log('\n🔥 Probando conexión a Firebase...');

    // Importar Firebase
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');

    // Configurar Firebase
    const firebaseConfig = {
      apiKey: process.env.VITE_APP_API_KEY,
      authDomain: process.env.VITE_APP_AUTH_DOMAIN,
      projectId: process.env.VITE_APP_PROJECT_ID,
      storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
      appId: process.env.VITE_APP_APP_ID,
    };

    // Inicializar
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('✅ Firebase inicializado correctamente');

    // Probar conexión real
    console.log('📡 Probando conexión a Firestore...');

    const alumnosRef = collection(db, 'alumnos');
    const snapshot = await getDocs(alumnosRef);

    console.log('✅ Conexión exitosa a Firestore');
    console.log(`📊 Estudiantes encontrados: ${snapshot.size}`);

    if (snapshot.size > 0) {
      console.log('\n📝 Ejemplo de datos (primer estudiante):');
      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();
      console.log(`ID: ${firstDoc.id}`);
      console.log('Datos:', JSON.stringify(data, null, 2));
    }

    console.log('\n🎉 ¡Conectividad confirmada! Puedes proceder con la migración.');
  } catch (error) {
    console.error('\n💥 Error de conectividad:', error.message);

    if (error.message.includes('auth')) {
      console.log('\n🔑 Posible problema de autenticación:');
      console.log('- Verifica que las credenciales de Firebase sean correctas');
      console.log('- Verifica que el proyecto exista en Firebase Console');
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      console.log('\n🌐 Posible problema de red:');
      console.log('- Verifica tu conexión a internet');
      console.log('- Verifica que no haya firewalls bloqueando');
    }

    console.log('\n🔍 Información de debug:');
    console.log('- Project ID:', process.env.VITE_APP_PROJECT_ID);
    console.log('- Error completo:', error);
  }
}

testBasicConnectivity();
