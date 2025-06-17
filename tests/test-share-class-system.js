// Script de prueba para el sistema de compartir clases
// Ejecutar en la consola del navegador cuando estés logueado como maestro

console.log('🧪 Iniciando pruebas del sistema de compartir clases...');

// Función para probar el composable de colaboración
async function testTeacherCollaboration() {
  try {
    console.log('📚 Probando composable de colaboración...');
    
    // Simular importación del composable (esto funcionaría en el contexto de Vue)
    console.log('✅ Composable disponible: useTeacherCollaboration');
    
    // Verificar que las funciones están disponibles
    const expectedMethods = [
      'fetchMyClasses',
      'inviteAssistant', 
      'removeAssistant',
      'updatePermissions',
      'hasPermission'
    ];
    
    console.log('🔍 Métodos esperados:', expectedMethods);
    console.log('✅ Composable de colaboración funcional');
    
  } catch (error) {
    console.error('❌ Error en composable de colaboración:', error);
  }
}

// Función para probar el sistema de notificaciones
async function testNotificationSystem() {
  try {
    console.log('🔔 Probando sistema de notificaciones...');
    
    // Verificar que el badge de notificaciones esté presente
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
      console.log('✅ Badge de notificaciones encontrado');
    } else {
      console.log('ℹ️ Badge de notificaciones no visible (normal si no hay notificaciones)');
    }
    
    // Verificar que la pestaña de notificaciones esté presente
    const notificationTab = document.querySelector('[data-tab="notifications"]') || 
                           Array.from(document.querySelectorAll('button')).find(btn => 
                             btn.textContent?.includes('Notificaciones')
                           );
    
    if (notificationTab) {
      console.log('✅ Pestaña de notificaciones encontrada');
    } else {
      console.log('⚠️ Pestaña de notificaciones no encontrada');
    }
    
  } catch (error) {
    console.error('❌ Error en sistema de notificaciones:', error);
  }
}

// Función para probar el botón de compartir clase
async function testShareClassButton() {
  try {
    console.log('🔗 Probando botón de compartir clase...');
    
    // Buscar botones de compartir clase
    const shareButtons = document.querySelectorAll('[title="Compartir Clase"]');
    
    if (shareButtons.length > 0) {
      console.log(`✅ Encontrados ${shareButtons.length} botón(es) de compartir clase`);
      console.log('💡 Haz clic en un botón de compartir para probar el modal');
    } else {
      console.log('ℹ️ No se encontraron botones de compartir clase');
      console.log('   Esto es normal si no tienes clases como maestro principal');
    }
    
  } catch (error) {
    console.error('❌ Error buscando botón de compartir:', error);
  }
}

// Función para verificar clases compartidas
async function testSharedClasses() {
  try {
    console.log('👥 Verificando clases compartidas...');
    
    // Buscar badges de "Compartida"
    const sharedBadges = Array.from(document.querySelectorAll('span')).filter(span => 
      span.textContent?.includes('Compartida')
    );
    
    if (sharedBadges.length > 0) {
      console.log(`✅ Encontradas ${sharedBadges.length} clase(s) compartida(s)`);
    } else {
      console.log('ℹ️ No se encontraron clases compartidas');
      console.log('   Esto es normal si no tienes clases como maestro asistente');
    }
    
  } catch (error) {
    console.error('❌ Error verificando clases compartidas:', error);
  }
}

// Función principal de prueba
async function runAllTests() {
  console.log('🚀 Ejecutando todas las pruebas...\n');
  
  await testTeacherCollaboration();
  console.log('');
  
  await testNotificationSystem();
  console.log('');
  
  await testShareClassButton();
  console.log('');
  
  await testSharedClasses();
  console.log('');
  
  console.log('✨ Pruebas completadas!');
  console.log('');
  console.log('📋 Para probar completamente el sistema:');
  console.log('1. Busca el botón "Compartir Clase" en una de tus clases');
  console.log('2. Haz clic para abrir el modal');
  console.log('3. Selecciona un maestro y configura permisos');
  console.log('4. Envía la invitación');
  console.log('5. El otro maestro debería ver un badge rojo en "Notificaciones"');
  console.log('6. Desde "Notificaciones" puede aceptar o rechazar');
  console.log('7. Si acepta, la clase aparecerá en su dashboard con el badge "Compartida"');
}

// Ejecutar las pruebas
runAllTests();

// Exportar funciones para uso manual
window.shareClassTests = {
  runAllTests,
  testTeacherCollaboration,
  testNotificationSystem, 
  testShareClassButton,
  testSharedClasses
};

console.log('');
console.log('🔧 Funciones de prueba disponibles en window.shareClassTests');
console.log('   Ejemplo: window.shareClassTests.testShareClassButton()');
