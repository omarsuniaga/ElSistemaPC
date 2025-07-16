// Script para probar el módulo de clases compartidas con datos reales de Firestore
// Ejecutar en la consola del navegador después de navegar a la sección de clases

window.realFirestoreTest = async () => {
  console.log('🔥 === PRUEBA CON DATOS REALES DE FIRESTORE ===');

  // Intentar acceder al Firebase/Firestore del proyecto
  try {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined' && typeof window.firebase === 'undefined') {
      console.log('⚠️  Firebase no está disponible en el scope global');
      console.log('💡 Intentando acceder via Vue app...');

      // Intentar via Vue app
      const app = document.querySelector('#app')?.__vue_app__;
      if (app && app.config.globalProperties.$firebase) {
        console.log('✅ Firebase encontrado via Vue app');
      }
    }

    // Buscar datos en el contexto de la aplicación
    const vueApp = document.querySelector('#app')?.__vue_app__;
    let firestoreData = null;

    if (vueApp) {
      // Intentar acceder al store de Pinia
      const pinia = vueApp.config.globalProperties.$pinia;
      if (pinia && pinia._s) {
        console.log('📦 Stores de Pinia encontrados:', Object.keys(pinia._s));

        // Buscar el store de clases
        const classesStore = Object.values(pinia._s).find(
          (store) => store.$id === 'classes' || store.classes || store.fetchClasses,
        );

        if (classesStore) {
          console.log('🎯 Store de clases encontrado');
          firestoreData = classesStore.classes || classesStore.$state?.classes;

          if (firestoreData && Array.isArray(firestoreData)) {
            console.log(`📊 ${firestoreData.length} clases encontradas en el store`);
          } else {
            console.log('🔄 Intentando cargar datos...');
            if (classesStore.fetchClasses) {
              await classesStore.fetchClasses();
              firestoreData = classesStore.classes || classesStore.$state?.classes;
            }
          }
        }
      }
    }

    // Si no encontramos datos, usar los que ya están en localStorage como fallback
    if (!firestoreData || !Array.isArray(firestoreData)) {
      console.log('📦 Usando datos de localStorage como fallback');
      const localData = localStorage.getItem('classes-data') || localStorage.getItem('test-classes');
      if (localData) {
        firestoreData = JSON.parse(localData);
      }
    }

    if (!firestoreData || !Array.isArray(firestoreData)) {
      console.log('❌ No se pudieron obtener datos de clases');
      return;
    }

    // Analizar la estructura de las clases
    console.log(`\n📋 ANÁLISIS DE ${firestoreData.length} CLASES:`);

    const classAnalysis = firestoreData.map((cls, index) => {
      const analysis = {
        index: index + 1,
        id: cls.id,
        name: cls.name,
        teacherId: cls.teacherId,
        teachers: cls.teachers,
        sharedWith: cls.sharedWith, // Para comparar
        isSharedByTeachers: cls.teachers && Array.isArray(cls.teachers) && cls.teachers.length > 0,
        isSharedBySharedWith:
          cls.sharedWith && Array.isArray(cls.sharedWith) && cls.sharedWith.length > 0,
        teachersCount: cls.teachers ? (Array.isArray(cls.teachers) ? cls.teachers.length : 0) : 0,
      };

      console.log(`\n${analysis.index}. "${analysis.name}"`);
      console.log(`   ID: ${analysis.id}`);
      console.log(`   teacherId: ${analysis.teacherId || 'undefined'}`);
      console.log(
        `   teachers: ${analysis.teachers ? JSON.stringify(analysis.teachers) : 'undefined'}`,
      );
      console.log(
        `   sharedWith: ${analysis.sharedWith ? JSON.stringify(analysis.sharedWith) : 'undefined'}`,
      );
      console.log(`   ✅ Compartida (teachers): ${analysis.isSharedByTeachers ? 'SÍ' : 'NO'}`);
      console.log(`   🔹 Compartida (sharedWith): ${analysis.isSharedBySharedWith ? 'SÍ' : 'NO'}`);

      return analysis;
    });

    // Resumen
    const sharedByTeachers = classAnalysis.filter((c) => c.isSharedByTeachers);
    const sharedBySharedWith = classAnalysis.filter((c) => c.isSharedBySharedWith);

    console.log('\n📊 RESUMEN:');
    console.log(`   Total clases: ${classAnalysis.length}`);
    console.log(`   Compartidas (teachers): ${sharedByTeachers.length}`);
    console.log(`   Compartidas (sharedWith): ${sharedBySharedWith.length}`);

    if (sharedByTeachers.length > 0) {
      console.log('\n✅ CLASES COMPARTIDAS (usando teachers):');
      sharedByTeachers.forEach((cls) => {
        console.log(`   - ${cls.name} → ${cls.teachersCount} maestros`);
      });
    }

    if (sharedBySharedWith.length > 0) {
      console.log('\n🔹 CLASES COMPARTIDAS (usando sharedWith - antigua estructura):');
      sharedBySharedWith.forEach((cls) => {
        console.log(`   - ${cls.name}`);
      });
    }

    // Verificar la UI
    console.log('\n🎨 VERIFICACIÓN DE UI:');

    // Buscar el tab de clases compartidas
    const sharedTab =
      document.querySelector('button:has([class*="ShareIcon"])') ||
      document.querySelector('button[data-testid="shared-classes-tab"]') ||
      Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Compartidas') || btn.textContent?.includes('Shared'),
      );

    if (sharedTab) {
      console.log('🎯 Tab de clases compartidas encontrado');

      // Verificar si hay un contador
      const counter = sharedTab.querySelector('[class*="bg-purple"]');
      if (counter) {
        console.log(`   Contador mostrado: ${counter.textContent}`);
      } else {
        console.log('   Sin contador visible');
      }

      // Simular click para verificar contenido
      console.log('🖱️  Haciendo click en el tab...');
      sharedTab.click();

      // Esperar y verificar contenido
      setTimeout(() => {
        const sharedList =
          document.querySelector('[data-testid="shared-classes-list"]') ||
          document.querySelector('.shared-classes-container');

        if (sharedList) {
          console.log('✅ Lista de clases compartidas visible');

          const items = sharedList.querySelectorAll(
            '[data-testid="shared-class-item"], .shared-class-item',
          );
          console.log(`   Items mostrados: ${items.length}`);

          if (items.length !== sharedByTeachers.length) {
            console.log(
              `⚠️  DISCREPANCIA: Se esperaban ${sharedByTeachers.length} items, se muestran ${items.length}`,
            );
          }
        } else {
          console.log('❌ Lista de clases compartidas no visible');
        }
      }, 1000);
    } else {
      console.log('❌ Tab de clases compartidas no encontrado');
    }

    return {
      totalClasses: classAnalysis.length,
      sharedClasses: sharedByTeachers,
      legacySharedClasses: sharedBySharedWith,
      rawData: firestoreData,
    };
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
};

// Función para forzar la actualización de datos
window.forceDataRefresh = async () => {
  console.log('🔄 Forzando actualización de datos...');

  try {
    const vueApp = document.querySelector('#app')?.__vue_app__;
    if (vueApp && vueApp.config.globalProperties.$pinia) {
      const stores = Object.values(vueApp.config.globalProperties.$pinia._s);

      // Buscar y refrescar stores relevantes
      for (const store of stores) {
        if (store.fetchClasses && typeof store.fetchClasses === 'function') {
          console.log('📥 Refrescando store de clases...');
          await store.fetchClasses();
        }
        if (store.fetchTeachers && typeof store.fetchTeachers === 'function') {
          console.log('👨‍🏫 Refrescando store de maestros...');
          await store.fetchTeachers();
        }
      }

      console.log('✅ Datos actualizados');

      // Re-ejecutar análisis
      setTimeout(() => {
        window.realFirestoreTest();
      }, 500);
    } else {
      console.log('❌ No se pudo acceder a los stores');
    }
  } catch (error) {
    console.error('❌ Error refrescando datos:', error);
  }
};

console.log('🔥 Scripts de prueba Firestore cargados:');
console.log('- realFirestoreTest() - Analizar datos reales de Firestore');
console.log('- forceDataRefresh() - Forzar actualización de datos');
