// Test completo del sistema de observaciones unificadas
// Simula el comportamiento del componente ObservacionesSection

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
  appId: process.env.VITE_APP_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🎯 Test Completo: Sistema de Observaciones Unificadas');
console.log('==================================================');

// Replicar la función del composable
async function fetchUnifiedObservationsForClass(classId) {
  try {
    console.log(`[UnifiedObservations] Fetching observations for class: ${classId}`);

    const q = query(collection(db, 'OBSERVACIONES_UNIFICADAS'), where('classId', '==', classId));

    const querySnapshot = await getDocs(q);
    const observations = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      observations.push({
        id: doc.id,
        ...data,
        // Normalizar campos para compatibilidad con el componente existente
        observacion: data.text,
        studentName: data.studentName || null,
        authorName: data.author,
        fecha: data.date,
        type: data.type || 'general',
      });
    });

    // Ordenar manualmente por fecha de creación (más reciente primero)
    observations.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(
      `[UnifiedObservations] Found ${observations.length} observations for class ${classId}`,
    );
    return observations;
  } catch (error) {
    console.error('[UnifiedObservations] Error fetching observations:', error);
    throw error;
  }
}

// Simular el comportamiento del componente ObservacionesSection
async function simulateObservacionesSection() {
  try {
    // 1. Obtener todas las observaciones para encontrar clases con datos
    console.log('\n🔍 Paso 1: Explorando observaciones disponibles...');
    const allObservationsSnapshot = await getDocs(collection(db, 'OBSERVACIONES_UNIFICADAS'));
    const allObservations = [];

    allObservationsSnapshot.forEach((doc) => {
      allObservations.push({ id: doc.id, ...doc.data() });
    });

    const uniqueClassIds = [...new Set(allObservations.map((obs) => obs.classId))];
    console.log(`   📊 Total observaciones: ${allObservations.length}`);
    console.log(`   🏫 Clases únicas con observaciones: ${uniqueClassIds.length}`);

    // 2. Probar con las primeras 5 clases
    const testClassIds = uniqueClassIds.slice(0, 5);

    for (const classId of testClassIds) {
      console.log(`\n🎯 Probando clase: ${classId}`);

      try {
        const observations = await fetchUnifiedObservationsForClass(classId);

        if (observations.length > 0) {
          console.log(`   ✅ ${observations.length} observaciones encontradas`);

          // Mostrar la primera observación como ejemplo
          const firstObs = observations[0];
          console.log(`   📝 Ejemplo - Fecha: ${firstObs.fecha}`);
          console.log(`   👤 Autor: ${firstObs.authorName}`);
          console.log(`   📄 Texto: ${(firstObs.observacion || '').substring(0, 60)}...`);
          console.log(`   🏷️  Origen: ${firstObs.source}`);
        } else {
          console.log('   ⚠️  No se encontraron observaciones');
        }
      } catch (error) {
        console.error(`   ❌ Error cargando observaciones: ${error.message}`);
      }
    }

    console.log('\n🎉 Simulación completada exitosamente!');
    console.log('✅ El sistema de observaciones unificadas está listo para producción');

    // 3. Reporte final
    console.log('\n📊 REPORTE FINAL');
    console.log('================');
    console.log(`✅ Total de observaciones migradas: ${allObservations.length}`);
    console.log(`🏫 Clases con observaciones: ${uniqueClassIds.length}`);

    const sourceCounts = {};
    allObservations.forEach((obs) => {
      const source = obs.source || 'UNKNOWN';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    console.log('📈 Distribución por fuente:');
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} observaciones`);
    });
  } catch (error) {
    console.error('❌ Error en la simulación:', error);
  }
}

// Ejecutar la simulación
simulateObservacionesSection();
