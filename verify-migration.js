// Script para verificar resultados de la migración
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verificarMigracion() {
  console.log('\n🔍 VERIFICANDO RESULTADOS DE LA MIGRACIÓN');
  console.log('==========================================');

  try {
    const alumnosRef = collection(db, 'ALUMNOS');
    const snapshot = await getDocs(alumnosRef);

    console.log(`📊 Total de documentos en ALUMNOS: ${snapshot.size}`);

    // Mostrar últimos documentos creados/actualizados
    console.log('\n📄 Últimos documentos procesados:');
    let count = 0;
    snapshot.forEach((doc) => {
      if (count < 10) {
        const data = doc.data();
        console.log(`${count + 1}. ${data.nombre || 'Sin nombre'}`);
        console.log(`   📞 Teléfono: ${data.telefono || 'No especificado'}`);
        console.log(`   🎵 Instrumento: ${data.instrumento || 'No especificado'}`);
        console.log(`   👥 Grupos: ${JSON.stringify(data.grupos || {})}`);
        console.log('   ---');
        count++;
      }
    });

    // Estadísticas por instrumento
    console.log('\n📊 ESTADÍSTICAS POR INSTRUMENTO:');
    const instrumentos = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      const instrumento = data.instrumento || 'Sin instrumento';
      instrumentos[instrumento] = (instrumentos[instrumento] || 0) + 1;
    });

    Object.entries(instrumentos)
      .sort(([, a], [, b]) => b - a)
      .forEach(([instrumento, count]) => {
        console.log(`🎵 ${instrumento}: ${count} estudiantes`);
      });

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error durante verificación:', error);
  }
}

verificarMigracion();
