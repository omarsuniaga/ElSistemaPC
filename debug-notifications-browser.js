/**
 * Script para depurar notificaciones en la consola del navegador
 */
console.log('🔔 Debugger de Notificaciones - Iniciado');

// Función para verificar el estado de las notificaciones
window.debugNotifications = function() {
  console.log('📊 === DEBUG NOTIFICACIONES ===');
  
  // Verificar si el composable está disponible
  try {
    const { useGeneralNotifications } = window.Vue || {};
    if (useGeneralNotifications) {
      const { unreadCount, notifications } = useGeneralNotifications();
      console.log('✅ Composable encontrado');
      console.log('📈 unreadCount:', unreadCount.value);
      console.log('📋 notifications:', notifications.value);
    } else {
      console.log('❌ Composable no encontrado en window.Vue');
    }
  } catch (error) {
    console.log('❌ Error accediendo al composable:', error);
  }
  
  // Verificar elementos DOM
  const notificationTab = document.querySelector('[data-tab="notifications"]');
  const notificationBadge = document.querySelector('.notification-badge');
  const notificationDot = document.querySelector('.notification-dot');
  
  console.log('🎯 Elementos DOM:');
  console.log('  - Tab de notificaciones:', !!notificationTab);
  console.log('  - Badge:', !!notificationBadge);
  console.log('  - Dot:', !!notificationDot);
  
  // Mostrar todas las tabs
  const allTabs = document.querySelectorAll('button[class*="flex-shrink-0"]');
  console.log('📑 Tabs encontradas:', allTabs.length);
  allTabs.forEach((tab, index) => {
    console.log(`  ${index + 1}. ${tab.textContent?.trim()}`);
  });
  
  console.log('🔚 === FIN DEBUG ===');
};

// Función para crear notificación de prueba
window.createTestNotification = function() {
  console.log('📝 Creando notificación de prueba...');
  
  // Simular notificación local
  const event = new CustomEvent('test-notification', {
    detail: {
      title: 'Notificación de Prueba',
      message: 'Esta es una notificación para probar el indicador',
      type: 'test',
      status: 'unread'
    }
  });
  
  window.dispatchEvent(event);
  console.log('✅ Evento de notificación de prueba enviado');
};

// Función para forzar mostrar badge
window.forceShowBadge = function() {
  console.log('🔴 Forzando mostrar badge...');
  
  // Buscar tab de notificaciones y agregar badge manualmente
  const notificationTabs = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Notificaciones')
  );
  
  notificationTabs.forEach(tab => {
    const container = tab.querySelector('.flex.items-center.gap-1.relative');
    if (container && !container.querySelector('.test-badge')) {
      const badge = document.createElement('span');
      badge.className = 'absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold test-badge';
      badge.textContent = '3';
      badge.style.animation = 'pulse 2s infinite';
      container.appendChild(badge);
      console.log('✅ Badge de prueba agregado');
    }
  });
};

console.log('🎮 Funciones disponibles:');
console.log('  - window.debugNotifications() - Verificar estado');
console.log('  - window.createTestNotification() - Crear notificación de prueba'); 
console.log('  - window.forceShowBadge() - Forzar mostrar badge');

// Auto-ejecutar debug al cargar
setTimeout(() => {
  window.debugNotifications();
}, 2000);
