/**
 * Service Worker Registration
 * Maneja el registro del Service Worker de manera manual
 */

// Solo registrar Service Worker en producción
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

export async function registerServiceWorker() {
  // No registrar SW en desarrollo para evitar conflictos
  if (isDevelopment) {
    console.log('🔧 [SW] Service Worker deshabilitado en desarrollo');
    return;
  }

  if ('serviceWorker' in navigator && isProduction) {
    try {
      console.log('🔄 [SW] Registrando Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('✅ [SW] Service Worker registrado:', registration.scope);

      // Manejar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nueva versión disponible
                console.log('🆕 [SW] Nueva versión disponible');
                showUpdateNotification();
              } else {
                // Primera instalación
                console.log('✨ [SW] Service Worker instalado por primera vez');
                showOfflineReadyNotification();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ [SW] Error registrando Service Worker:', error);
    }
  } else if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ [SW] Service Worker no soportado en este navegador');
  }
}

export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ [SW] Service Worker desregistrado');
      }
    } catch (error) {
      console.error('❌ [SW] Error desregistrando Service Worker:', error);
    }
  }
}

function showUpdateNotification() {
  // Mostrar notificación de actualización disponible
  if (window.confirm('Una nueva versión está disponible. ¿Desea actualizar?')) {
    window.location.reload();
  }
}

function showOfflineReadyNotification() {
  console.log('📱 [SW] La aplicación está lista para funcionar offline');
  
  // Opcional: mostrar toast o notificación
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Academia Musical', {
      body: 'La aplicación está lista para funcionar offline',
      icon: '/icons/icon-192x192.png',
    });
  }
}

// Auto-registro si estamos en producción
if (isProduction) {
  window.addEventListener('load', registerServiceWorker);
}

// En desarrollo, asegurar que no hay SW registrados
if (isDevelopment) {
  unregisterServiceWorker();
}
