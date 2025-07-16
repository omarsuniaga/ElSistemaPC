// Monitor de proceso de migración
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function monitorearProgreso() {
  console.log('\n🔍 MONITOREANDO PROCESO DE MIGRACIÓN');
  console.log('=====================================');

  try {
    // Verificar conectividad
    console.log('📡 Verificando conectividad a Firestore...');
    const alumnosRef = collection(db, 'ALUMNOS');
    const snapshot = await getDocs(query(alumnosRef, limit(1)));
    console.log('✅ Conectado a Firestore exitosamente');

    // Contar documentos actuales
    console.log('📊 Contando documentos en colección ALUMNOS...');
    const allDocs = await getDocs(alumnosRef);
    const totalDocs = allDocs.size;
    console.log(`📋 Total de documentos actuales: ${totalDocs}`);

    // Mostrar algunos documentos de ejemplo
    console.log('\n📄 Ejemplos de documentos existentes:');
    let count = 0;
    allDocs.forEach((doc) => {
      if (count < 5) {
        const data = doc.data();
        console.log(
          `  ${count + 1}. ${data.nombre || 'Sin nombre'} - ${data.instrumento || 'Sin instrumento'}`,
        );
        count++;
      }
    });

    // Verificar CSV
    console.log('\n📄 Verificando archivo CSV...');
    if (fs.existsSync('INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv')) {
      const csvContent = fs.readFileSync('INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv', 'utf8');
      const lines = csvContent.split('\n').filter((line) => line.trim());
      console.log(`✅ CSV encontrado con ${lines.length - 1} estudiantes (excluyendo header)`);
    } else {
      console.log('❌ CSV no encontrado');
    }

    // Estado de archivos de migración
    console.log('\n📁 Verificando scripts de migración...');
    const scripts = [
      'scripts/migrate-students-from-csv.js',
      'scripts/backup-alumnos.js',
      'scripts/analyze-csv-data.js',
    ];

    scripts.forEach((script) => {
      if (fs.existsSync(script)) {
        console.log(`✅ ${script} - Disponible`);
      } else {
        console.log(`❌ ${script} - No encontrado`);
      }
    });

    console.log('\n⏰ Monitoreo completado -', new Date().toISOString());
  } catch (error) {
    console.error('❌ Error durante monitoreo:', error.message);
  }
}

monitorearProgreso();
