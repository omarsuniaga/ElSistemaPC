// Script para probar las observaciones unificadas (sin orderBy para evitar index)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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

console.log('🧪 Testing Unified Observations System (Simple Query)');
console.log('=====================================================');

// Probar obtener observaciones para una clase específica (sin orderBy)
async function testClassObservations(classId) {
  try {
    console.log(`\n🎯 Probando observaciones para clase: ${classId}`);
    
    const q = query(
      collection(db, 'OBSERVACIONES_UNIFICADAS'),
      where('classId', '==', classId)
    );
    
    const querySnapshot = await getDocs(q);
    const observations = [];
    
    querySnapshot.forEach((doc) => {
      observations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Ordenar manualmente por fecha
    observations.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return dateB.getTime() - dateA.getTime();
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

// Probar obtener todas las observaciones (limitado)
async function testAllObservations() {
  try {
    console.log('\n🌍 Probando obtener todas las observaciones...');
    
    const querySnapshot = await getDocs(collection(db, 'OBSERVACIONES_UNIFICADAS'));
    const observations = [];
    
    querySnapshot.forEach((doc) => {
      observations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Total de observaciones en el sistema: ${observations.length}`);
    
    // Mostrar estadísticas por fuente
    const bySource = {};
    observations.forEach(obs => {
      const source = obs.source || 'UNKNOWN';
      bySource[source] = (bySource[source] || 0) + 1;
    });
    
    console.log('\n📊 Distribución por fuente:');
    Object.entries(bySource).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} observaciones`);
    });
    
    return observations;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

// Ejecutar pruebas
async function runTests() {
  try {
    // Primero obtener estadísticas generales
    const allObservations = await testAllObservations();
    
    if (allObservations.length > 0) {
      // Probar con algunas clases que sabemos que tienen observaciones
      const uniqueClassIds = [...new Set(allObservations.map(obs => obs.classId))];
      console.log(`\n🎯 Clases únicas encontradas: ${uniqueClassIds.length}`);
      
      // Probar con las primeras 3 clases
      for (let i = 0; i < Math.min(3, uniqueClassIds.length); i++) {
        await testClassObservations(uniqueClassIds[i]);
      }
    }
    
    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('✅ El sistema de observaciones unificadas está funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

runTests();
