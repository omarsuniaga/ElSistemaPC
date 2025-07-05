// Verificación rápida del sistema de notificaciones
// Ejecutar en la consola del navegador

console.log('🔧 Verificando sistema de notificaciones...');

// Importar el sistema 
import('./src/services/attendanceNotificationManager.js')
  .then((module) => {
    console.log('✅ Módulo de notificaciones importado correctamente');
    
    // Verificar funciones disponibles
    const notificationSystem = module.default;
    console.log('📋 Funciones disponibles:', Object.keys(notificationSystem));
    
    // Verificar estado del sistema
    const status = notificationSystem.getStatus();
    console.log('📊 Estado del sistema:', status);
    
    // Verificar salud del sistema
    const health = notificationSystem.healthCheck();
    console.log('🏥 Salud del sistema:', health ? '✅ Saludable' : '⚠️ Con problemas');
    
  })
  .catch((error) => {
    console.error('❌ Error importando módulo de notificaciones:', error);
  });

// También verificar Firebase directamente
import('./src/firebase.js')
  .then((firebase) => {
    console.log('🔥 Firebase importado correctamente');
    console.log('📊 Firebase Ready:', firebase.isFirebaseReady());
  })
  .catch((error) => {
    console.error('❌ Error importando Firebase:', error);
  });
