/**
 * SCRIPT DE VERIFICACIÓN FINAL - CLASES EMERGENTES
 * Ejecutar en la consola del navegador para verificar que todo funciona
 */

console.log('🎯 VERIFICACIÓN FINAL - SISTEMA DE CLASES EMERGENTES');
console.log('=' .repeat(70));

// Configuración de la prueba
const EMERGENCY_CLASS_ID = '3sf0mBLxcam45CbTgmvK';
const TEST_DATE = '20250627';
const EXPECTED_URL = `/attendance/${TEST_DATE}/${EMERGENCY_CLASS_ID}`;

// Función principal de verificación
async function verifyEmergencyClassSystem() {
  console.log('🔍 Iniciando verificación completa del sistema...');
  
  try {
    // 1. Verificar URL actual
    console.log('\n1️⃣ VERIFICACIÓN DE NAVEGACIÓN');
    const currentPath = window.location.pathname;
    const expectedPath = EXPECTED_URL;
    
    console.log('📍 URL actual:', currentPath);
    console.log('🎯 URL esperada:', expectedPath);
    
    if (currentPath !== expectedPath) {
      console.log('⚠️ No estás en la página correcta.');
      console.log('🔗 Navega a:', window.location.origin + expectedPath);
      return false;
    }
    console.log('✅ URL correcta');
    
    // 2. Verificar elementos de interfaz
    console.log('\n2️⃣ VERIFICACIÓN DE INTERFAZ');
    
    // Buscar título de la clase
    const titleElements = document.querySelectorAll('h1, h2, h3, .class-title, [class*="titulo"]');
    let classNameFound = false;
    
    titleElements.forEach(element => {
      const text = element.textContent || element.innerText;
      if (text && !text.includes(EMERGENCY_CLASS_ID) && text.length > 5) {
        console.log('📋 Título de clase encontrado:', text.trim());
        classNameFound = true;
      }
    });
    
    if (!classNameFound) {
      console.log('❌ No se encontró título de clase o solo muestra ID');
    }
    
    // Buscar lista de estudiantes
    const studentRows = document.querySelectorAll('[class*="student"], tr[data-student-id], .student-row');
    console.log(`👥 Elementos de estudiantes encontrados: ${studentRows.length}`);
    
    if (studentRows.length === 0) {
      console.log('❌ No se encontraron estudiantes en la lista');
      return false;
    } else {
      console.log('✅ Lista de estudiantes presente');
    }
    
    // Verificar botones de asistencia
    const attendanceButtons = document.querySelectorAll('button[class*="presente"], button[class*="ausente"], button[class*="tardanza"]');
    console.log(`🎯 Botones de asistencia encontrados: ${attendanceButtons.length}`);
    
    // 3. Verificar datos en Firebase
    console.log('\n3️⃣ VERIFICACIÓN DE DATOS');
    
    if (window.firebase && window.firebase.firestore) {
      const db = window.firebase.firestore();
      
      try {
        const emergencyDoc = await db.collection('EMERGENCY_CLASSES').doc(EMERGENCY_CLASS_ID).get();
        
        if (emergencyDoc.exists) {
          const data = emergencyDoc.data();
          console.log('✅ Clase emergente encontrada en Firebase');
          console.log('📋 Nombre:', data.className);
          console.log('👥 Estudiantes seleccionados:', data.selectedStudents?.length || 0);
          
          if (data.selectedStudents && data.selectedStudents.length > 0) {
            console.log('📝 IDs de estudiantes:', data.selectedStudents);
            
            // Verificar que los estudiantes existen
            const studentsSnapshot = await db.collection('ALUMNOS')
              .where(window.firebase.firestore.FieldPath.documentId(), 'in', data.selectedStudents.slice(0, 10))
              .get();
            
            console.log(`✅ Estudiantes encontrados en ALUMNOS: ${studentsSnapshot.size}`);
            
            if (studentsSnapshot.size > 0) {
              console.log('👥 Estudiantes válidos:');
              studentsSnapshot.forEach(studentDoc => {
                const studentData = studentDoc.data();
                console.log(`  - ${studentData.nombre} ${studentData.apellido}`);
              });
            }
          } else {
            console.log('❌ No hay estudiantes seleccionados en la clase emergente');
          }
        } else {
          console.log('❌ Clase emergente no encontrada en Firebase');
          return false;
        }
      } catch (firebaseError) {
        console.log('❌ Error al acceder a Firebase:', firebaseError);
        return false;
      }
    } else {
      console.log('⚠️ Firebase no disponible');
    }
    
    // 4. Verificar errores en consola
    console.log('\n4️⃣ VERIFICACIÓN DE ERRORES');
    
    const errorElements = document.querySelectorAll('.error, [class*="error"], .bg-red-500');
    if (errorElements.length > 0) {
      console.log('⚠️ Elementos de error encontrados:');
      errorElements.forEach((element, index) => {
        const text = element.textContent || element.innerText;
        if (text && text.trim()) {
          console.log(`  ${index + 1}. ${text.trim()}`);
        }
      });
    } else {
      console.log('✅ No se encontraron mensajes de error');
    }
    
    // 5. Verificar funcionalidad de asistencia
    console.log('\n5️⃣ VERIFICACIÓN DE FUNCIONALIDAD');
    
    const firstStudentButton = document.querySelector('button[class*="presente"], button[class*="ausente"]');
    if (firstStudentButton) {
      console.log('✅ Botones de asistencia interactivos disponibles');
      console.log('💡 Puedes probar marcar asistencia manualmente');
    } else {
      console.log('❌ No se encontraron botones de asistencia activos');
    }
    
    // 6. Resultado final
    console.log('\n6️⃣ RESULTADO FINAL');
    
    const checks = [
      classNameFound,
      studentRows.length > 0,
      attendanceButtons.length > 0
    ];
    
    const passedChecks = checks.filter(Boolean).length;
    const totalChecks = checks.length;
    
    console.log(`📊 Verificaciones pasadas: ${passedChecks}/${totalChecks}`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 ¡ÉXITO! El sistema de clases emergentes funciona correctamente');
      console.log('✅ Los estudiantes se cargan correctamente');
      console.log('✅ La interfaz de asistencia está funcional');
      return true;
    } else {
      console.log('⚠️ El sistema tiene algunos problemas que necesitan atención');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error durante la verificación:', error);
    return false;
  }
}

// Función para activar debug
function enableDebugMode() {
  window.localStorage.setItem('attendance-debug', 'true');
  console.log('🔧 Modo debug activado');
  console.log('🔄 Refresca la página para ver logs de debug');
}

// Función para navegar a la clase emergente
function navigateToEmergencyClass() {
  const url = window.location.origin + EXPECTED_URL;
  console.log('🧭 Navegando a:', url);
  window.location.href = url;
}

// Función para probar carga de estudiantes específica
async function testStudentLoading() {
  console.log('👥 Probando carga específica de estudiantes...');
  
  if (window.firebase && window.firebase.firestore) {
    try {
      const db = window.firebase.firestore();
      
      // Simular lo que hace el componente
      console.log('🔄 Simulando carga de estudiantes de clase emergente...');
      
      const emergencyDoc = await db.collection('EMERGENCY_CLASSES').doc(EMERGENCY_CLASS_ID).get();
      
      if (emergencyDoc.exists) {
        const data = emergencyDoc.data();
        const studentIds = data.selectedStudents || [];
        
        console.log('📋 IDs de estudiantes obtenidos:', studentIds);
        
        if (studentIds.length > 0) {
          const studentsSnapshot = await db.collection('ALUMNOS')
            .where(window.firebase.firestore.FieldPath.documentId(), 'in', studentIds)
            .get();
          
          console.log('✅ Estudiantes cargados exitosamente:');
          studentsSnapshot.forEach(doc => {
            const student = doc.data();
            console.log(`  - ${doc.id}: ${student.nombre} ${student.apellido}`);
          });
          
          return true;
        }
      }
    } catch (error) {
      console.log('❌ Error en carga de estudiantes:', error);
    }
  }
  
  return false;
}

// Exportar funciones globalmente
window.emergencyClassVerification = {
  verify: verifyEmergencyClassSystem,
  enableDebug: enableDebugMode,
  navigate: navigateToEmergencyClass,
  testStudents: testStudentLoading,
  classId: EMERGENCY_CLASS_ID
};

console.log('\n🔧 FUNCIONES DISPONIBLES:');
console.log('- emergencyClassVerification.verify() - Verificación completa');
console.log('- emergencyClassVerification.enableDebug() - Activar debug');
console.log('- emergencyClassVerification.navigate() - Navegar a clase emergente');
console.log('- emergencyClassVerification.testStudents() - Probar carga de estudiantes');

// Auto-ejecutar si estamos en la página correcta
if (window.location.pathname === EXPECTED_URL) {
  console.log('\n🎯 Página de clase emergente detectada, ejecutando verificación...');
  setTimeout(() => {
    verifyEmergencyClassSystem();
  }, 2000);
} else {
  console.log('\n💡 Para ejecutar la verificación completa:');
  console.log('1. Navega a la clase emergente con: emergencyClassVerification.navigate()');
  console.log('2. O ejecuta manualmente: emergencyClassVerification.verify()');
}
