// Script de análisis de observaciones - Ejecutar en consola de Firebase
// Este script analiza las estructuras existentes sin modificar datos

console.log('🔍 ANALIZADOR DE OBSERVACIONES');
console.log('===============================');

async function analyzeObservations() {
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase no disponible. Ejecuta en consola de Firebase.');
    return;
  }

  const db = firebase.firestore();
  const analysis = {
    asistencias: {
      total: 0,
      withObservations: 0,
      totalObservations: 0,
      structures: new Set(),
      examples: [],
    },
    observaciones: {
      total: 0,
      structures: new Set(),
      examples: [],
    },
    observacionesClase: {
      total: 0,
      structures: new Set(),
      examples: [],
    },
  };

  console.log('📊 Analizando ASISTENCIAS...');

  try {
    // Analizar ASISTENCIAS
    const asistenciasSnapshot = await db.collection('ASISTENCIAS').limit(50).get();
    analysis.asistencias.total = asistenciasSnapshot.size;

    asistenciasSnapshot.forEach((doc) => {
      const data = doc.data();
      const observaciones = data.data?.observación || data.data?.observations || [];

      if (observaciones.length > 0) {
        analysis.asistencias.withObservations++;
        analysis.asistencias.totalObservations += observaciones.length;

        // Analizar estructura
        observaciones.forEach((obs) => {
          const structure = Object.keys(obs).sort().join('|');
          analysis.asistencias.structures.add(structure);

          if (analysis.asistencias.examples.length < 3) {
            analysis.asistencias.examples.push({
              docId: doc.id,
              fecha: data.fecha,
              classId: data.classId,
              observation: obs,
            });
          }
        });
      }
    });

    // Analizar OBSERVACIONES
    console.log('📊 Analizando OBSERVACIONES...');
    const observacionesSnapshot = await db.collection('OBSERVACIONES').limit(20).get();
    analysis.observaciones.total = observacionesSnapshot.size;

    observacionesSnapshot.forEach((doc) => {
      const data = doc.data();
      const structure = Object.keys(data).sort().join('|');
      analysis.observaciones.structures.add(structure);

      if (analysis.observaciones.examples.length < 3) {
        analysis.observaciones.examples.push({
          docId: doc.id,
          data,
        });
      }
    });

    // Analizar OBSERVACIONES_CLASE
    console.log('📊 Analizando OBSERVACIONES_CLASE...');
    const observacionesClaseSnapshot = await db.collection('OBSERVACIONES_CLASE').limit(20).get();
    analysis.observacionesClase.total = observacionesClaseSnapshot.size;

    observacionesClaseSnapshot.forEach((doc) => {
      const data = doc.data();
      const structure = Object.keys(data).sort().join('|');
      analysis.observacionesClase.structures.add(structure);

      if (analysis.observacionesClase.examples.length < 3) {
        analysis.observacionesClase.examples.push({
          docId: doc.id,
          data,
        });
      }
    });

    // Mostrar resultados
    console.log('\n📊 RESULTADOS DEL ANÁLISIS');
    console.log('===========================');

    console.log('\n🗃️  ASISTENCIAS:');
    console.log(`   📄 Total documentos: ${analysis.asistencias.total}`);
    console.log(`   📝 Con observaciones: ${analysis.asistencias.withObservations}`);
    console.log(`   📊 Total observaciones: ${analysis.asistencias.totalObservations}`);
    console.log(`   🏗️  Estructuras encontradas: ${analysis.asistencias.structures.size}`);

    console.log('\n📝 OBSERVACIONES:');
    console.log(`   📄 Total documentos: ${analysis.observaciones.total}`);
    console.log(`   🏗️  Estructuras encontradas: ${analysis.observaciones.structures.size}`);

    console.log('\n🏫 OBSERVACIONES_CLASE:');
    console.log(`   📄 Total documentos: ${analysis.observacionesClase.total}`);
    console.log(`   🏗️  Estructuras encontradas: ${analysis.observacionesClase.structures.size}`);

    // Mostrar estructuras detalladas
    console.log('\n🏗️  ESTRUCTURAS DETALLADAS:');
    console.log('\nASISTENCIAS.data.observación:');
    Array.from(analysis.asistencias.structures).forEach((structure, i) => {
      console.log(`  ${i + 1}. ${structure.replace(/\|/g, ' | ')}`);
    });

    console.log('\nOBSERVACIONES:');
    Array.from(analysis.observaciones.structures).forEach((structure, i) => {
      console.log(`  ${i + 1}. ${structure.replace(/\|/g, ' | ')}`);
    });

    console.log('\nOBSERVACIONES_CLASE:');
    Array.from(analysis.observacionesClase.structures).forEach((structure, i) => {
      console.log(`  ${i + 1}. ${structure.replace(/\|/g, ' | ')}`);
    });

    // Mostrar ejemplos
    console.log('\n📋 EJEMPLOS DE DATOS:');

    if (analysis.asistencias.examples.length > 0) {
      console.log('\nASISTENCIAS.data.observación:');
      analysis.asistencias.examples.forEach((example, i) => {
        console.log(`\n  Ejemplo ${i + 1}:`);
        console.log(`  Doc: ${example.docId}`);
        console.log(`  Fecha: ${example.fecha}`);
        console.log(`  Clase: ${example.classId}`);
        console.log('  Observación:', example.observation);
      });
    }

    if (analysis.observaciones.examples.length > 0) {
      console.log('\nOBSERVACIONES:');
      analysis.observaciones.examples.forEach((example, i) => {
        console.log(`\n  Ejemplo ${i + 1} (${example.docId}):`);
        console.log('  ', example.data);
      });
    }

    if (analysis.observacionesClase.examples.length > 0) {
      console.log('\nOBSERVACIONES_CLASE:');
      analysis.observacionesClase.examples.forEach((example, i) => {
        console.log(`\n  Ejemplo ${i + 1} (${example.docId}):`);
        console.log('  ', example.data);
      });
    }

    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('===================');

    const totalObservations =
      analysis.asistencias.totalObservations +
      analysis.observaciones.total +
      analysis.observacionesClase.total;

    console.log(`📊 Total observaciones encontradas: ${totalObservations}`);

    if (totalObservations > 0) {
      console.log('✅ Se recomienda proceder con la migración');
      console.log('🎯 Estructura unificada propuesta:');
      console.log('   - id: string');
      console.log('   - source: \'ASISTENCIAS\' | \'OBSERVACIONES\' | \'OBSERVACIONES_CLASE\'');
      console.log('   - classId: string');
      console.log('   - text: string');
      console.log('   - author: string');
      console.log('   - authorId: string');
      console.log('   - date: string (YYYY-MM-DD)');
      console.log('   - fecha: string (YYYYMMDD)');
      console.log('   - type: \'general\' | \'positive\' | \'negative\' | \'neutral\'');
      console.log('   - priority: \'baja\' | \'media\' | \'alta\'');
      console.log('   - requiresFollowUp: boolean');
      console.log('   - createdAt: Timestamp');
      console.log('   - updatedAt: Timestamp');
      console.log('   - migratedAt: Timestamp');
    } else {
      console.log('ℹ️  No se encontraron observaciones para migrar');
    }
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  }
}

// Función para verificar colección unificada existente
async function checkUnifiedCollection() {
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase no disponible.');
    return;
  }

  const db = firebase.firestore();

  try {
    const snapshot = await db.collection('OBSERVACIONES_UNIFICADAS').limit(5).get();

    console.log('\n🔍 COLECCIÓN UNIFICADA EXISTENTE:');
    console.log('==================================');
    console.log(`📄 Documentos: ${snapshot.size}`);

    if (snapshot.size > 0) {
      console.log('\n📋 Ejemplos:');
      snapshot.forEach((doc, i) => {
        console.log(`\n${i + 1}. ${doc.id}`);
        const data = doc.data();
        console.log(`   📁 Fuente: ${data.source}`);
        console.log(`   🏫 Clase: ${data.classId}`);
        console.log(`   📝 Texto: ${data.text?.substring(0, 50)}...`);
        console.log(`   👤 Autor: ${data.author}`);
        console.log(`   📅 Fecha: ${data.date}`);
      });
    } else {
      console.log('📭 La colección está vacía o no existe');
    }
  } catch (error) {
    console.log('📭 La colección OBSERVACIONES_UNIFICADAS no existe');
  }
}

// Exponer funciones
window.analyzeObservations = analyzeObservations;
window.checkUnifiedCollection = checkUnifiedCollection;

console.log('\n🚀 FUNCIONES DISPONIBLES:');
console.log('  📊 analyzeObservations() - Analizar estructuras existentes');
console.log('  🔍 checkUnifiedCollection() - Verificar colección unificada');
console.log('\n💡 Ejecuta: analyzeObservations()');
