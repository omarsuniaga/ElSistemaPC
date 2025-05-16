// src/registerServiceWorker.ts
import { useOfflineMode } from './utils/offlineMode';

// Registro del service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado con éxito:', registration.scope);
        
        // Inicializar modo offline después de registrar el service worker
        if (typeof useOfflineMode === 'function') {
          useOfflineMode();
        }
        
        // Escuchar actualizaciones del service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('Error al registrar el Service Worker:', error);
      }
    });

    // Verificar actualizaciones cada hora
    setInterval(() => {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.update();
        }
      });
    }, 3600000); // 1 hora
    
    // Escuchar mensajes del service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        console.log('Sincronización completada:', event.data.detail);
        showSyncNotification(event.data.detail);
      }
    });
  } else {
    console.warn('Service Worker no está soportado en este navegador');
  }
}

// Mostrar notificación de actualización disponible
function showUpdateNotification() {
  // Verificar si el navegador soporta notificaciones
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Actualización disponible', {
        body: 'Hay una nueva versión disponible. Haz clic aquí para actualizar.',
        icon: '/icons/icon-192x192.png'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
  
  // Alternativa: mostrar una alerta en la aplicación
  const event = new CustomEvent('app-update-available');
  window.dispatchEvent(event);
}

// Mostrar notificación de sincronización completada
function showSyncNotification(detail: any) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Sincronización completada', {
      body: `Se han sincronizado ${detail.count} cambios.`,
      icon: '/icons/icon-192x192.png'
    });
  }
  
  // Disparar evento para que lo escuchen los componentes
  const event = new CustomEvent('sync-complete', { detail });
  window.dispatchEvent(event);
}

// Para uso directo desde otros archivos
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.update();
      }
    });
  }
}

// Verificar el estado offline 
export function isOffline(): boolean {
  return !navigator.onLine;
}
