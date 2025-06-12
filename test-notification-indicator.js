// Script para probar que el indicador de notificaciones se actualiza cuando se invalidan notificaciones
// Ejecutar en la consola del navegador en la página del dashboard de maestros

async function testNotificationIndicatorUpdate() {
  console.log('🧪 Iniciando prueba del indicador de notificaciones...');
  
  // Simular que se marca una notificación como inválida
  const testNotification = {
    id: 'test-invalid-notification',
    type: 'class-invitation',
    title: 'Invitación a clase (PRUEBA)',
    message: 'Esta es una notificación de prueba que será invalidada',
    teacherId: 'current-teacher-id',
    classId: 'non-existent-class-id',
    className: 'Clase que no existe',
    status: 'invalid',
    createdAt: new Date(),
    fromUserId: 'test-user',
    fromUserName: 'Usuario de Prueba'
  };
  
  try {
    // 1. Verificar estado inicial del indicador
    const initialBadge = document.querySelector('.notification-badge, .notification-dot');
    console.log('📊 Estado inicial del badge:', {
      existe: !!initialBadge,
      texto: initialBadge?.textContent,
      clases: initialBadge?.className
    });
    
    // 2. Simular invalidación de notificación
    console.log('❌ Simulando invalidación de notificación...');
    
    // Crear evento personalizado para simular actualización
    const event = new CustomEvent('notification-invalidated', {
      detail: { notificationId: testNotification.id }
    });
    
    window.dispatchEvent(event);
    
    // 3. Esperar un momento para que se actualice el estado reactivo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Verificar estado final del indicador
    const finalBadge = document.querySelector('.notification-badge, .notification-dot');
    console.log('📊 Estado final del badge:', {
      existe: !!finalBadge,
      texto: finalBadge?.textContent,
      clases: finalBadge?.className
    });
    
    // 5. Verificar elementos de la UI relacionados
    const notificationTab = document.querySelector('[data-tab="notifications"]') || 
                           document.querySelector('button[class*="notifications"]');
    
    console.log('🖥️ Estado de la tab de notificaciones:', {
      existe: !!notificationTab,
      clases: notificationTab?.className,
      tieneIndicador: !!(notificationTab?.querySelector('.notification-badge, .notification-dot'))
    });
    
    console.log('✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

function monitorNotificationChanges() {
  console.log('👁️ Iniciando monitoreo de cambios en notificaciones...');
  
  // Observar cambios en el DOM del badge
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.classList?.contains('notification-badge') || 
          mutation.target.classList?.contains('notification-dot')) {
        console.log('🔄 Badge de notificación cambió:', {
          tipo: mutation.type,
          target: mutation.target.className,
          texto: mutation.target.textContent
        });
      }
    });
  });
  
  // Observar todo el documento por cambios
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
  
  console.log('👁️ Monitoreo activo. Usa observer.disconnect() para detener.');
  return observer;
}

// Exportar funciones para uso en consola
window.testNotificationIndicatorUpdate = testNotificationUpdate;
window.monitorNotificationChanges = monitorNotificationChanges;

console.log('🔧 Scripts de prueba de notificaciones cargados.');
console.log('📝 Uso:');
console.log('  - testNotificationIndicatorUpdate(): Prueba la actualización del indicador');
console.log('  - monitorNotificationChanges(): Monitorea cambios en tiempo real');
