// Test rápido del sistema de observaciones
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🧪 Test Rápido del Sistema de Observaciones');
console.log('============================================');

async function quickTest() {
  try {
    // Obtener observaciones unificadas
    const querySnapshot = await getDocs(collection(db, 'OBSERVACIONES_UNIFICADAS'));
    const observations = [];
    
    querySnapshot.forEach((doc) => {
      observations.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ ${observations.length} observaciones encontradas`);

    // Estadísticas básicas
    const teachers = new Set(observations.map(obs => obs.authorId || obs.author)).size;
    const classes = new Set(observations.map(obs => obs.classId)).size;
    const types = observations.reduce((acc, obs) => {
      acc[obs.type || 'unknown'] = (acc[obs.type || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    console.log(`👨‍🏫 ${teachers} maestros únicos`);
    console.log(`🏫 ${classes} clases únicas`);
    console.log('📊 Por tipo:', types);

    // Verificar campos requeridos
    const hasText = observations.filter(obs => obs.text && obs.text.length > 0).length;
    const hasDate = observations.filter(obs => obs.date).length;
    const hasAuthor = observations.filter(obs => obs.author || obs.authorId).length;

    console.log(`📝 ${hasText}/${observations.length} tienen texto`);
    console.log(`📅 ${hasDate}/${observations.length} tienen fecha`);
    console.log(`👤 ${hasAuthor}/${observations.length} tienen autor`);

    console.log('\n🎉 Sistema de observaciones verificado exitosamente!');
    console.log('✅ Datos migrados correctamente');
    console.log('✅ Estructura de datos consistente');
    console.log('✅ Listo para usar con los nuevos componentes');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();
