/**
 * Script de prueba FINAL para la nueva implementación de clases emergentes
 * Compatible con las funciones auxiliares de normalización
 */

console.log('🎯 SCRIPT DE PRUEBA - IMPLEMENTACIÓN MEJORADA CLASES EMERGENTES');
console.log('=' .repeat(70));

// Configuración
const EMERGENCY_CLASS_ID = '3sf0mBLxcam45CbTgmvK';
const TEST_DATE = '20250627';

async function testNormalizedEmergencyClass() {
  console.log('🔧 1. PROBANDO NORMALIZACIÓN DE CLASE EMERGENTE...');
  
  try {
    // Verificar que estamos en la página correcta
    const currentPath = window.location.pathname;
    if (!currentPath.includes(EMERGENCY_CLASS_ID)) {
      console.log('⚠️ No estás en la página de la clase emergente');
      console.log('🔗 Navega a:', `${window.location.origin}/attendance/${TEST_DATE}/${EMERGENCY_CLASS_ID}`);
      return false;
    }
    
    // Verificar si Firebase está disponible
    if (!window.firebase || !window.firebase.firestore) {
      console.log('❌ Firebase no disponible');
      return false;
    }
    
    const db = window.firebase.firestore();
    
    // 1. Probar la normalización directamente
    console.log('\n📋 2. PROBANDO NORMALIZACIÓN DIRECTA...');
    
    const emergencyDoc = await db.collection('EMERGENCY_CLASSES').doc(EMERGENCY_CLASS_ID).get();
    
    if (!emergencyDoc.exists) {
      console.log('❌ Clase emergente no encontrada en Firebase');
      return false;
    }
    
    const emergencyData = emergencyDoc.data();
    console.log('✅ Datos originales de clase emergente:', {
      className: emergencyData.className,
      teacherId: emergencyData.teacherId,
      studentsCount: emergencyData.selectedStudents?.length || 0,
      date: emergencyData.date
    });
    
    // Simular la normalización
    const normalizedData = {
      id: EMERGENCY_CLASS_ID,
      name: emergencyData.className || 'Clase Emergente',
      teacherId: emergencyData.teacherId,
      studentIds: emergencyData.selectedStudents || [],
      isEmergencyClass: true,
      date: emergencyData.date,
      schedule: emergencyData.schedule || 'Horario no especificado',
      description: emergencyData.description || 'Clase emergente creada por el maestro'
    };
    
    console.log('✅ Datos normalizados:', normalizedData);
    
    // 2. Verificar que los estudiantes existen
    console.log('\n👥 3. VERIFICANDO ESTUDIANTES...');
    
    if (normalizedData.studentIds.length === 0) {
      console.log('❌ No hay estudiantes en la clase emergente');
      return false;
    }
    
    console.log(`📊 Total estudiantes en clase emergente: ${normalizedData.studentIds.length}`);
    
    // Verificar algunos estudiantes en ALUMNOS
    const sampleIds = normalizedData.studentIds.slice(0, 5);
    console.log(`🔍 Verificando existencia de estudiantes (muestra de ${sampleIds.length})...`);
    
    let existingStudents = 0;
    for (const studentId of sampleIds) {
      const studentDoc = await db.collection('ALUMNOS').doc(studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        console.log(`  ✅ ${studentData.nombre} ${studentData.apellido} (${studentId})`);
        existingStudents++;
      } else {
        console.log(`  ❌ Estudiante ${studentId} no encontrado en ALUMNOS`);
      }
    }
    
    const successRate = (existingStudents / sampleIds.length) * 100;
    console.log(`📊 Tasa de éxito: ${successRate}% (${existingStudents}/${sampleIds.length})`);
    
    return successRate >= 80; // Considerar éxito si al menos 80% de estudiantes existen
    
  } catch (error) {
    console.error('❌ Error probando normalización:', error);
    return false;
  }
}

async function testComponentIntegration() {
  console.log('\n🖼️ 4. PROBANDO INTEGRACIÓN CON COMPONENTE...');
  
  try {
    // Activar debug mode
    localStorage.setItem('attendance-debug', 'true');
    console.log('🔧 Debug mode activado');
    
    // Buscar elementos en el DOM
    console.log('\n📋 5. VERIFICANDO ELEMENTOS DOM...');
    
    // Buscar indicadores de carga
    const loadingElements = document.querySelectorAll('[class*="loading"], .spinner');
    console.log(`⏳ Elementos de carga: ${loadingElements.length}`);
    
    // Buscar tabla de estudiantes
    const studentTable = document.querySelector('table tbody, .students-list, .attendance-table');
    if (studentTable) {
      const studentRows = studentTable.querySelectorAll('tr, .student-row');
      console.log(`📊 Filas de estudiantes encontradas: ${studentRows.length}`);
      
      // Contar estudiantes reales (excluyendo headers)
      let realStudents = 0;
      studentRows.forEach(row => {
        const text = row.textContent || row.innerText;
        if (text && text.trim() && !text.includes('Estudiante') && !text.includes('Estado') && !text.includes('Acciones')) {
          realStudents++;
        }
      });
      
      console.log(`👥 Estudiantes reales en tabla: ${realStudents}`);
      
      if (realStudents === 0) {
        console.log('⚠️ No se encontraron estudiantes en la tabla');
        
        // Buscar mensajes de error
        const errorElements = document.querySelectorAll('.error, [class*="error"], .bg-red');
        if (errorElements.length > 0) {
          console.log('❌ Mensajes de error encontrados:');
          errorElements.forEach((element, index) => {
            const text = element.textContent || element.innerText;
            if (text && text.trim()) {
              console.log(`  ${index + 1}. ${text.trim()}`);
            }
          });
        }
        
        return false;
      }
      
      return realStudents > 0;
      
    } else {
      console.log('❌ No se encontró tabla de estudiantes');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error probando integración de componente:', error);
    return false;
  }
}

async function testAttendanceButtons() {
  console.log('\n🎯 6. PROBANDO BOTONES DE ASISTENCIA...');
  
  try {
    const attendanceButtons = document.querySelectorAll('button[class*="presente"], button[class*="ausente"], button[class*="tardanza"]');
    console.log(`🎯 Botones de asistencia encontrados: ${attendanceButtons.length}`);
    
    if (attendanceButtons.length === 0) {
      console.log('❌ No se encontraron botones de asistencia');
      return false;
    }
    
    // Verificar que los botones están habilitados
    let enabledButtons = 0;
    attendanceButtons.forEach(button => {
      if (!button.disabled) {
        enabledButtons++;
      }
    });
    
    console.log(`✅ Botones habilitados: ${enabledButtons}/${attendanceButtons.length}`);
    
    return enabledButtons > 0;
    
  } catch (error) {
    console.error('❌ Error probando botones de asistencia:', error);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 INICIANDO PRUEBA COMPLETA DE LA NUEVA IMPLEMENTACIÓN...');
  console.log('='.repeat(70));
  
  const results = {
    normalization: await testNormalizedEmergencyClass(),
    componentIntegration: await testComponentIntegration(),
    attendanceButtons: await testAttendanceButtons()
  };
  
  console.log('\n📊 RESULTADOS FINALES:');
  console.log('='.repeat(50));
  console.log(`🔧 Normalización de datos: ${results.normalization ? '✅ ÉXITO' : '❌ FALLO'}`);
  console.log(`🖼️ Integración componente: ${results.componentIntegration ? '✅ ÉXITO' : '❌ FALLO'}`);
  console.log(`🎯 Botones de asistencia: ${results.attendanceButtons ? '✅ ÉXITO' : '❌ FALLO'}`);
  
  const allSuccess = Object.values(results).every(Boolean);
  
  if (allSuccess) {
    console.log('\n🎉 ¡PRUEBA EXITOSA!');
    console.log('✅ La nueva implementación funciona correctamente');
    console.log('✅ Los estudiantes se cargan correctamente');
    console.log('✅ La interfaz está operativa');
  } else {
    console.log('\n⚠️ HAY PROBLEMAS QUE NECESITAN ATENCIÓN');
    
    if (!results.normalization) {
      console.log('🔧 PROBLEMA: La normalización de datos falló');
      console.log('  - Verifica que la clase emergente existe en Firebase');
      console.log('  - Verifica que tiene estudiantes asignados');
      console.log('  - Verifica que los estudiantes existen en ALUMNOS');
    }
    
    if (!results.componentIntegration) {
      console.log('🖼️ PROBLEMA: La integración del componente falló');
      console.log('  - Verifica que el componente se está cargando');
      console.log('  - Revisa la consola para errores de Vue');
      console.log('  - Verifica que las funciones auxiliares están funcionando');
    }
    
    if (!results.attendanceButtons) {
      console.log('🎯 PROBLEMA: Los botones de asistencia no funcionan');
      console.log('  - Verifica que los estudiantes se cargan correctamente');
      console.log('  - Revisa los permisos del usuario');
      console.log('  - Verifica que no hay errores de JavaScript');
    }
  }
  
  console.log('\n💡 PRÓXIMOS PASOS:');
  if (allSuccess) {
    console.log('✅ El sistema está listo para usar');
    console.log('✅ Puedes proceder a marcar asistencia');
  } else {
    console.log('🔄 Refresca la página y ejecuta el test de nuevo');
    console.log('🔍 Revisa la consola para mensajes de debug detallados');
    console.log('📋 Ejecuta las funciones de test individuales para más información');
  }
  
  return allSuccess;
}

// Función para debuggear problemas específicos
async function debugSpecificIssues() {
  console.log('\n🔍 DEBUGGING ESPECÍFICO...');
  
  try {
    // 1. Verificar stores de Vue
    console.log('\n📦 VERIFICANDO STORES...');
    
    if (window.Vue && window.Vue.version) {
      console.log(`✅ Vue version: ${window.Vue.version}`);
    }
    
    // 2. Verificar funciones globales
    console.log('\n🔧 VERIFICANDO FUNCIONES...');
    
    if (typeof window.normalizeEmergencyClassData === 'function') {
      console.log('✅ normalizeEmergencyClassData disponible');
    } else {
      console.log('❌ normalizeEmergencyClassData no disponible');
    }
    
    if (typeof window.getClassStudents === 'function') {
      console.log('✅ getClassStudents disponible');
    } else {
      console.log('❌ getClassStudents no disponible');
    }
    
  } catch (error) {
    console.error('❌ Error en debugging específico:', error);
  }
}

// Exportar funciones
window.emergencyClassTestNew = {
  testNormalization: testNormalizedEmergencyClass,
  testComponent: testComponentIntegration,
  testButtons: testAttendanceButtons,
  runComplete: runCompleteTest,
  debug: debugSpecificIssues,
  classId: EMERGENCY_CLASS_ID
};

console.log('\n🔧 FUNCIONES DE PRUEBA NUEVAS CARGADAS:');
console.log('- emergencyClassTestNew.testNormalization()');
console.log('- emergencyClassTestNew.testComponent()');
console.log('- emergencyClassTestNew.testButtons()');
console.log('- emergencyClassTestNew.runComplete()');
console.log('- emergencyClassTestNew.debug()');

// Auto-ejecutar si estamos en la página correcta
if (window.location.pathname.includes(EMERGENCY_CLASS_ID)) {
  console.log('\n🎯 Clase emergente detectada, ejecutando prueba completa en 3 segundos...');
  setTimeout(() => {
    runCompleteTest();
  }, 3000);
} else {
  console.log('\n💡 Para ejecutar la prueba completa:');
  console.log('1. Navega a la clase emergente');
  console.log('2. Ejecuta: emergencyClassTestNew.runComplete()');
}
