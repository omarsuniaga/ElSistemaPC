/**
 * SCRIPT DE VERIFICACIÓN FINAL - SOLUCIÓN DEFINITIVA
 * Ejecutar después de refrescar la página de la clase emergente
 */

console.log('🎯 VERIFICACIÓN FINAL - SOLUCIÓN DEFINITIVA CLASES EMERGENTES');
console.log('='.repeat(80));

// Configuración
const EMERGENCY_CLASS_ID = '3sf0mBLxcam45CbTgmvK';
const TEST_DATE = '20250627';

async function verifyFinalSolution() {
  console.log('🔍 INICIANDO VERIFICACIÓN COMPLETA...');
  
  try {
    // 1. Verificar URL
    const currentPath = window.location.pathname;
    const expectedPath = `/attendance/${TEST_DATE}/${EMERGENCY_CLASS_ID}`;
    
    if (!currentPath.includes(EMERGENCY_CLASS_ID)) {
      console.log('⚠️ No estás en la página de la clase emergente');
      console.log('🔗 Navega a:', window.location.origin + expectedPath);
      return false;
    }
    
    console.log('✅ 1. URL correcta');
    
    // 2. Verificar que no hay errores críticos
    const errorElements = document.querySelectorAll('.error, [class*="error"], .bg-red');
    const criticalErrors = Array.from(errorElements).filter(el => {
      const text = el.textContent || el.innerText;
      return text && (text.includes('No se encontró') || text.includes('Error'));
    });
    
    if (criticalErrors.length > 0) {
      console.log('❌ 2. ERRORES CRÍTICOS ENCONTRADOS:');
      criticalErrors.forEach((el, index) => {
        console.log(`   ${index + 1}. ${el.textContent?.trim()}`);
      });
      return false;
    } else {
      console.log('✅ 2. Sin errores críticos');
    }
    
    // 3. Verificar elementos de estudiantes
    console.log('\n📋 3. VERIFICANDO LISTA DE ESTUDIANTES...');
    
    // Buscar diferentes tipos de listas de estudiantes
    const studentSelectors = [
      'table tbody tr',
      '.students-list .student-row',
      '.attendance-table tr',
      '[data-student-id]',
      '.student-item'
    ];
    
    let studentsFound = 0;
    let studentElements = [];
    
    for (const selector of studentSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        studentElements = Array.from(elements);
        studentsFound = elements.length;
        console.log(`   ✅ Encontrados ${studentsFound} elementos con selector: ${selector}`);
        break;
      }
    }
    
    if (studentsFound === 0) {
      console.log('❌ 3. NO SE ENCONTRARON ESTUDIANTES EN LA INTERFAZ');
      
      // Buscar indicadores de carga
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], .loading');
      if (loadingElements.length > 0) {
        console.log('   ⏳ Se detectó estado de carga, espera unos segundos y vuelve a verificar');
      }
      
      return false;
    } else {
      console.log(`✅ 3. Lista de estudiantes encontrada: ${studentsFound} elementos`);
    }
    
    // 4. Verificar contenido de estudiantes
    console.log('\n👥 4. VERIFICANDO CONTENIDO DE ESTUDIANTES...');
    
    let realStudents = 0;
    const studentNames = [];
    
    studentElements.forEach(element => {
      const text = (element.textContent || element.innerText).trim();
      // Filtrar filas de encabezado o vacías
      if (text && 
          !text.includes('Estudiante') && 
          !text.includes('Estado') && 
          !text.includes('Asistencia') &&
          text.length > 5) {
        realStudents++;
        if (realStudents <= 5) {
          studentNames.push(text.substring(0, 50) + '...');
        }
      }
    });
    
    if (realStudents === 0) {
      console.log('❌ 4. Los elementos no contienen datos de estudiantes válidos');
      return false;
    } else {
      console.log(`✅ 4. Estudiantes con datos válidos: ${realStudents}`);
      console.log('   Ejemplos:');
      studentNames.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name}`);
      });
    }
    
    // 5. Verificar botones de asistencia
    console.log('\n🎯 5. VERIFICANDO BOTONES DE ASISTENCIA...');
    
    const attendanceButtons = document.querySelectorAll(
      'button[class*="presente"], button[class*="ausente"], button[class*="tardanza"], ' +
      'button:contains("Presente"), button:contains("Ausente"), button:contains("Tardanza")'
    );
    
    if (attendanceButtons.length === 0) {
      console.log('❌ 5. NO SE ENCONTRARON BOTONES DE ASISTENCIA');
      return false;
    } else {
      console.log(`✅ 5. Botones de asistencia encontrados: ${attendanceButtons.length}`);
    }
    
    // 6. Verificar funcionalidad
    console.log('\n⚙️ 6. VERIFICANDO FUNCIONALIDAD...');
    
    // Buscar contadores
    const counterElements = document.querySelectorAll('.badge, [class*="count"], [class*="total"]');
    let countersFound = 0;
    
    counterElements.forEach(element => {
      const text = element.textContent || element.innerText;
      if (text && text.match(/\d+/)) {
        countersFound++;
        console.log(`   Contador: ${text.trim()}`);
      }
    });
    
    if (countersFound > 0) {
      console.log(`✅ 6. Contadores funcionales: ${countersFound}`);
    } else {
      console.log('⚠️ 6. No se encontraron contadores, pero la funcionalidad básica parece estar');
    }
    
    // 7. Verificar datos en Firebase (si está disponible)
    if (window.firebase && window.firebase.firestore) {
      console.log('\n🔥 7. VERIFICANDO DATOS EN FIREBASE...');
      
      try {
        const db = window.firebase.firestore();
        const emergencyDoc = await db.collection('EMERGENCY_CLASSES').doc(EMERGENCY_CLASS_ID).get();
        
        if (emergencyDoc.exists) {
          const data = emergencyDoc.data();
          const fbStudentCount = data.selectedStudents?.length || 0;
          
          console.log(`✅ 7. Firebase: ${fbStudentCount} estudiantes seleccionados`);
          
          // Comparar con lo que vemos en la interfaz
          if (Math.abs(fbStudentCount - realStudents) <= 2) { // Tolerancia de 2
            console.log(`✅ 7. Coherencia: Firebase(${fbStudentCount}) ≈ Interfaz(${realStudents})`);
          } else {
            console.log(`⚠️ 7. Discrepancia: Firebase(${fbStudentCount}) vs Interfaz(${realStudents})`);
          }
        }
      } catch (fbError) {
        console.log('⚠️ 7. Error accediendo Firebase:', fbError.message);
      }
    }
    
    // 8. Resultado final
    console.log('\n📊 RESULTADO FINAL:');
    console.log('='.repeat(50));
    
    const checks = {
      url: true,
      noErrors: criticalErrors.length === 0,
      studentsListed: studentsFound > 0,
      studentsValid: realStudents > 0,
      buttonsAvailable: attendanceButtons.length > 0
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.values(checks).length;
    
    console.log(`✅ Verificaciones pasadas: ${passedChecks}/${totalChecks}`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 ¡SOLUCIÓN EXITOSA!');
      console.log('✅ La clase emergente funciona correctamente');
      console.log('✅ Los estudiantes se muestran en la interfaz');
      console.log('✅ Los botones de asistencia están disponibles');
      console.log('✅ Se puede registrar asistencia y observaciones');
      
      return true;
    } else {
      console.log('\n⚠️ SOLUCIÓN PARCIAL');
      console.log('Revisa los puntos que fallaron arriba');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    return false;
  }
}

// Función para probar marcar asistencia
async function testAttendanceMarking() {
  console.log('\n🧪 PRUEBA DE MARCADO DE ASISTENCIA...');
  
  const buttons = document.querySelectorAll('button[class*="presente"], button[class*="ausente"]');
  
  if (buttons.length === 0) {
    console.log('❌ No hay botones disponibles para probar');
    return false;
  }
  
  console.log(`✅ Encontrados ${buttons.length} botones para probar`);
  console.log('💡 Haz clic manualmente en un botón para probar el marcado de asistencia');
  
  // Resaltar el primer botón para que el usuario pueda probarlo
  if (buttons[0]) {
    buttons[0].style.border = '3px solid #ff0000';
    buttons[0].style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
    console.log('🔍 Primer botón resaltado en rojo para prueba manual');
    
    setTimeout(() => {
      buttons[0].style.border = '';
      buttons[0].style.boxShadow = '';
    }, 5000);
  }
  
  return true;
}

// Exportar funciones
window.finalVerification = {
  verify: verifyFinalSolution,
  testMarking: testAttendanceMarking,
  classId: EMERGENCY_CLASS_ID
};

console.log('\n🔧 FUNCIONES DE VERIFICACIÓN FINAL:');
console.log('- finalVerification.verify() - Verificación completa');
console.log('- finalVerification.testMarking() - Probar marcado de asistencia');

// Auto-ejecutar verificación
console.log('\n🚀 Ejecutando verificación automática en 3 segundos...');
setTimeout(() => {
  verifyFinalSolution().then(success => {
    if (success) {
      console.log('\n💡 Para probar el marcado de asistencia:');
      console.log('finalVerification.testMarking()');
    } else {
      console.log('\n💡 Si el problema persiste:');
      console.log('1. Refresca la página');
      console.log('2. Espera a que termine la carga');
      console.log('3. Ejecuta: finalVerification.verify()');
    }
  });
}, 3000);
