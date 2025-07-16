/**
 * Script de verificación específica para la carga de estudiantes en clases emergentes
 * Ejecutar en la consola del navegador cuando se esté en la página de asistencia
 */

console.log('🎯 SCRIPT DE VERIFICACIÓN - CARGA DE ESTUDIANTES');
console.log('='.repeat(70));

// Configuración
const EMERGENCY_CLASS_ID = '3sf0mBLxcam45CbTgmvK';
const TEST_DATE = '20250627';

async function verifyStudentLoading() {
  console.log('📋 1. VERIFICANDO CARGA DE ESTUDIANTES...');

  try {
    // Verificar que estamos en la página correcta
    const currentPath = window.location.pathname;
    const expectedPath = `/attendance/${TEST_DATE}/${EMERGENCY_CLASS_ID}`;

    if (!currentPath.includes(EMERGENCY_CLASS_ID)) {
      console.log('⚠️ No estás en la página de la clase emergente');
      console.log('🔗 Navega a:', window.location.origin + expectedPath);
      return;
    }

    // Verificar elementos DOM de estudiantes
    console.log('\n📋 2. VERIFICANDO ELEMENTOS DOM...');

    // Buscar tabla de estudiantes
    const studentTable = document.querySelector('table tbody, .students-list, .attendance-table');
    if (studentTable) {
      const studentRows = studentTable.querySelectorAll('tr, .student-row');
      console.log(`✅ Tabla de estudiantes encontrada con ${studentRows.length} filas`);

      // Verificar contenido de las filas
      let studentsFound = 0;
      studentRows.forEach((row, index) => {
        const text = row.textContent || row.innerText;
        if (text && text.trim() && !text.includes('Estudiante') && !text.includes('Estado')) {
          studentsFound++;
          if (studentsFound <= 5) {
            // Mostrar solo los primeros 5
            console.log(`  Estudiante ${studentsFound}: ${text.trim().substring(0, 50)}...`);
          }
        }
      });

      console.log(`📊 Total estudiantes encontrados en DOM: ${studentsFound}`);

      if (studentsFound === 0) {
        console.log('❌ No se encontraron estudiantes en la tabla');
        return false;
      }
    } else {
      console.log('❌ No se encontró tabla de estudiantes');
      return false;
    }

    // Verificar botones de asistencia
    console.log('\n📋 3. VERIFICANDO BOTONES DE ASISTENCIA...');
    const attendanceButtons = document.querySelectorAll(
      'button[class*="presente"], button[class*="ausente"], button[class*="tardanza"]',
    );
    console.log(`🎯 Botones de asistencia encontrados: ${attendanceButtons.length}`);

    // Verificar contadores
    console.log('\n📋 4. VERIFICANDO CONTADORES...');
    const counterElements = document.querySelectorAll('.badge, [class*="count"], [class*="total"]');
    counterElements.forEach((element, index) => {
      const text = element.textContent || element.innerText;
      if (text && text.match(/\d+/)) {
        console.log(`📊 Contador ${index + 1}: ${text.trim()}`);
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Error verificando carga de estudiantes:', error);
    return false;
  }
}

async function verifyFirebaseData() {
  console.log('\n🔥 5. VERIFICANDO DATOS EN FIREBASE...');

  if (!window.firebase || !window.firebase.firestore) {
    console.log('❌ Firebase no disponible');
    return false;
  }

  try {
    const db = window.firebase.firestore();

    // Verificar clase emergente
    const emergencyDoc = await db.collection('EMERGENCY_CLASSES').doc(EMERGENCY_CLASS_ID).get();

    if (!emergencyDoc.exists) {
      console.log('❌ Clase emergente no encontrada en Firebase');
      return false;
    }

    const emergencyData = emergencyDoc.data();
    const studentIds = emergencyData.selectedStudents || [];

    console.log('✅ Clase emergente encontrada');
    console.log(`📋 Nombre: ${emergencyData.className}`);
    console.log(`👥 Estudiantes seleccionados: ${studentIds.length}`);

    if (studentIds.length === 0) {
      console.log('❌ No hay estudiantes seleccionados en la clase emergente');
      return false;
    }

    // Verificar algunos estudiantes en la colección ALUMNOS
    const sampleIds = studentIds.slice(0, 5);
    console.log(`🔍 Verificando existencia de estudiantes (muestra de ${sampleIds.length})...`);

    for (const studentId of sampleIds) {
      const studentDoc = await db.collection('ALUMNOS').doc(studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        console.log(`  ✅ ${studentData.nombre} ${studentData.apellido} (${studentId})`);
      } else {
        console.log(`  ❌ Estudiante ${studentId} no encontrado`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error verificando datos de Firebase:', error);
    return false;
  }
}

async function verifyVueComponent() {
  console.log('\n🖼️ 6. VERIFICANDO COMPONENTE VUE...');

  try {
    // Buscar el componente Vue en el DOM
    const appElement = document.querySelector('#app, [data-v-]');
    if (!appElement) {
      console.log('❌ No se encontró el componente Vue');
      return false;
    }

    // Verificar si hay errores en consola
    console.log('🔍 Buscando errores de Vue en consola...');

    // Activar debug si no está activado
    if (localStorage.getItem('attendance-debug') !== 'true') {
      localStorage.setItem('attendance-debug', 'true');
      console.log('🔧 Debug mode activado. Refresca la página para ver logs detallados.');
    }

    return true;
  } catch (error) {
    console.error('❌ Error verificando componente Vue:', error);
    return false;
  }
}

async function runCompleteVerification() {
  console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA...');
  console.log('='.repeat(70));

  const results = {
    studentLoading: await verifyStudentLoading(),
    firebaseData: await verifyFirebaseData(),
    vueComponent: await verifyVueComponent(),
  };

  console.log('\n📊 RESULTADOS FINALES:');
  console.log('='.repeat(50));
  console.log(`📋 Carga de estudiantes: ${results.studentLoading ? '✅ ÉXITO' : '❌ FALLO'}`);
  console.log(`🔥 Datos Firebase: ${results.firebaseData ? '✅ ÉXITO' : '❌ FALLO'}`);
  console.log(`🖼️ Componente Vue: ${results.vueComponent ? '✅ ÉXITO' : '❌ FALLO'}`);

  const allSuccess = Object.values(results).every(Boolean);

  if (allSuccess) {
    console.log('\n🎉 ¡VERIFICACIÓN EXITOSA!');
    console.log('✅ El sistema está cargando estudiantes correctamente');
  } else {
    console.log('\n⚠️ HAY PROBLEMAS QUE NECESITAN ATENCIÓN');
    console.log('📋 Revisa los detalles arriba para identificar las causas');
  }

  return allSuccess;
}

// Función para simular interacción con botones
async function testAttendanceButtons() {
  console.log('\n🎯 7. PROBANDO BOTONES DE ASISTENCIA...');

  const buttons = document.querySelectorAll('button[class*="presente"], button[class*="ausente"]');

  if (buttons.length === 0) {
    console.log('❌ No se encontraron botones de asistencia');
    return false;
  }

  console.log(`✅ Encontrados ${buttons.length} botones de asistencia`);

  // Probar hacer clic en el primer botón (solo simulación)
  const firstButton = buttons[0];
  if (firstButton) {
    console.log('🖱️ Simulando clic en primer botón...');
    console.log(`Botón: ${firstButton.textContent || firstButton.className}`);
    // No hacer clic real para evitar cambios accidentales
    // firstButton.click();
  }

  return true;
}

// Exportar funciones
window.studentLoadingTest = {
  verifyStudents: verifyStudentLoading,
  verifyFirebase: verifyFirebaseData,
  verifyVue: verifyVueComponent,
  testButtons: testAttendanceButtons,
  runComplete: runCompleteVerification,
  classId: EMERGENCY_CLASS_ID,
};

console.log('\n🔧 FUNCIONES DE VERIFICACIÓN CARGADAS:');
console.log('- studentLoadingTest.verifyStudents()');
console.log('- studentLoadingTest.verifyFirebase()');
console.log('- studentLoadingTest.verifyVue()');
console.log('- studentLoadingTest.testButtons()');
console.log('- studentLoadingTest.runComplete()');

// Auto-ejecutar si estamos en la página correcta
if (window.location.pathname.includes(EMERGENCY_CLASS_ID)) {
  console.log('\n🎯 Clase emergente detectada, ejecutando verificación automática en 2 segundos...');
  setTimeout(() => {
    runCompleteVerification();
  }, 2000);
} else {
  console.log('\n💡 Para ejecutar la verificación:');
  console.log('1. Navega a la clase emergente');
  console.log('2. Ejecuta: studentLoadingTest.runComplete()');
}
