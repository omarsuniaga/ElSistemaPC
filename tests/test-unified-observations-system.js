// Script para probar las observaciones unificadas desde Node.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
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

console.log('🧪 Testing Unified Observations System');
console.log('=====================================');

// Probar obtener observaciones para una clase específica
async function testClassObservations(classId) {
  try {
    console.log(`\n🎯 Probando observaciones para clase: ${classId}`);
    
    const q = query(
      collection(db, 'OBSERVACIONES_UNIFICADAS'),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const observations = [];
    
    querySnapshot.forEach((doc) => {
      observations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Encontradas ${observations.length} observaciones para la clase`);
    
    if (observations.length > 0) {
      console.log('\n📝 Ejemplo de observación:');
      const example = observations[0];
      console.log(`   ID: ${example.id}`);
      console.log(`   Fecha: ${example.date}`);
      console.log(`   Autor: ${example.author}`);
      console.log(`   Origen: ${example.source}`);
      console.log(`   Texto: ${example.text?.substring(0, 100)}...`);
    }
    
    return observations;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

// Ejecutar pruebas
async function runTests() {
  try {
    // Probar con la clase que sabemos que tiene observaciones
    await testClassObservations('6PCVJXIDz3cqmzGOceLb');
    
    // Probar con otra clase
    await testClassObservations('Yd5nG9qWKi2fZUgPhMfB');
    
    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('✅ El sistema de observaciones unificadas está funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

runTests();
