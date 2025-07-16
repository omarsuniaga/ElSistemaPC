/**
 * 🔄 SERVICE WORKER AVANZADO PARA PWA OFFLINE-FIRST
 * Implementa estrategias de cache inteligentes y sincronización en background
 * Fase 1 - Iniciativa 1: Configuración del Service Worker
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSync } from 'workbox-background-sync';
import { Queue } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Declarar el tipo de self para TypeScript
declare const self: ServiceWorkerGlobalScope;

// ==================== CONFIGURACIÓN INICIAL ====================

// Precachear archivos del build
precacheAndRoute(self.__WB_MANIFEST);

// Limpiar caches obsoletos
cleanupOutdatedCaches();

// ==================== ESTRATEGIAS DE CACHE ====================

// 🎯 Cache First: App Shell (Activos estáticos)
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'app-shell-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
      }),
    ],
  }),
);

// 🖼️ Cache First: Imágenes
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

// 📱 Network First: Páginas HTML
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
      }),
    ],
  }),
);

// ==================== FIREBASE CACHE STRATEGIES ====================

// 🔥 Firestore: Stale While Revalidate para datos frecuentes
registerRoute(
  ({ url }) => url.origin === 'https://firestore.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'firestore-data-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24, // 24 horas
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

// 🔐 Firebase Auth: Network First con timeout corto
registerRoute(
  ({ url }) => url.origin === 'https://identitytoolkit.googleapis.com',
  new NetworkFirst({
    cacheName: 'firebase-auth-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 5, // 5 minutos
      }),
    ],
  }),
);

// ==================== BACKGROUND SYNC ====================

// 📝 Cola para sincronización de asistencia
const attendanceQueue = new Queue('attendance-sync', {
  onSync: async ({ queue }) => {
    console.log('🔄 Sincronizando registros de asistencia...');

    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        // Reenviar la request original
        await fetch(entry.request.clone());
        console.log('✅ Registro de asistencia sincronizado');
      } catch (error) {
        console.error('❌ Error sincronizando asistencia:', error);
        // Volver a poner en cola para reintentar
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// 👥 Cola para sincronización de datos de maestros
const teachersQueue = new Queue('teachers-sync', {
  onSync: async ({ queue }) => {
    console.log('🔄 Sincronizando datos de maestros...');

    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        console.log('✅ Datos de maestros sincronizados');
      } catch (error) {
        console.error('❌ Error sincronizando maestros:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// 📚 Cola para sincronización de observaciones
const observationsQueue = new Queue('observations-sync', {
  onSync: async ({ queue }) => {
    console.log('🔄 Sincronizando observaciones...');

    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        console.log('✅ Observaciones sincronizadas');
      } catch (error) {
        console.error('❌ Error sincronizando observaciones:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// ==================== INTERCEPTAR REQUESTS PARA SYNC ====================

// Interceptar requests POST/PUT/DELETE para Firebase
registerRoute(
  ({ url, request }) =>
    url.origin === 'https://firestore.googleapis.com' &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
  async ({ request }) => {
    try {
      // Intentar enviar inmediatamente
      const response = await fetch(request.clone());
      return response;
    } catch (error) {
      console.log('📱 Sin conexión - Agregando a cola de sincronización');

      // Determinar qué cola usar basado en la URL
      const url = new URL(request.url);

      if (url.pathname.includes('ASISTENCIA')) {
        await attendanceQueue.pushRequest({ request });
      } else if (url.pathname.includes('MAESTROS')) {
        await teachersQueue.pushRequest({ request });
      } else if (url.pathname.includes('OBSERVACIONES')) {
        await observationsQueue.pushRequest({ request });
      }

      // Retornar una respuesta offline
      return new Response(
        JSON.stringify({
          success: true,
          offline: true,
          message: 'Guardado offline - Se sincronizará cuando tengas conexión',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
  'POST',
);

// ==================== CACHE INTELIGENTE PARA API ====================

// Cache para endpoints específicos de la aplicación
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60, // 1 hora
      }),
    ],
  }),
);

// ==================== PÁGINA OFFLINE ====================

// Registrar ruta para página offline
const offlineRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'pages-v1',
    networkTimeoutSeconds: 3,
  }),
);

registerRoute(offlineRoute);

// ==================== EVENTOS DEL SERVICE WORKER ====================

// Evento de instalación
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker instalado');
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
  event.waitUntil(self.clients.claim());
});

// Evento de mensaje para comunicación con la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_SYNC_STATUS') {
    // Enviar estado de sincronización al cliente
    event.ports[0].postMessage({
      attendanceQueue: attendanceQueue.size,
      teachersQueue: teachersQueue.size,
      observationsQueue: observationsQueue.size,
    });
  }

  if (event.data && event.data.type === 'FORCE_SYNC') {
    // Forzar sincronización manual
    Promise.all([
      attendanceQueue.replayRequests(),
      teachersQueue.replayRequests(),
      observationsQueue.replayRequests(),
    ])
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});

// ==================== NOTIFICACIONES ====================

// Manejar notificaciones push (futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        action: data.action || 'open',
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir App',
        },
        {
          action: 'close',
          title: 'Cerrar',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title || 'Academia Musical', options));
  }
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';

    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Buscar si ya hay una ventana abierta
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Abrir nueva ventana si no hay ninguna
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
    );
  }
});

console.log('🎯 Service Worker PWA Offline-First configurado exitosamente!');
