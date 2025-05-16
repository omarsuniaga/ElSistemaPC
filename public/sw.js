// Versiones de caché
const APP_VERSION = '1.0.0';
const CACHE_NAMES = {
  static: `static-cache-v${APP_VERSION}`,
  dynamic: `dynamic-cache-v${APP_VERSION}`,
  assets: `assets-cache-v${APP_VERSION}`,
  documents: `documents-cache-v${APP_VERSION}`,
  api: `api-cache-v${APP_VERSION}`
};

// Recursos estáticos para precarga - solo rutas accesibles directamente en el navegador
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
  // Nota: Eliminados '/src/main.ts' y '/src/App.vue' que no son accesibles directamente
];

// API endpoints que deben tratarse de manera especial
const API_ENDPOINTS = [
  { url: /\/api\/attendance/, cache: CACHE_NAMES.api, strategy: 'network-first' },
  { url: /\/api\/students/, cache: CACHE_NAMES.api, strategy: 'network-first' },
  { url: /\/api\/classes/, cache: CACHE_NAMES.api, strategy: 'network-first' },
  // Firebase endpoints
  { url: /firestore\.googleapis\.com/, cache: CACHE_NAMES.api, strategy: 'network-first' },
  { url: /identitytoolkit\.googleapis\.com/, cache: null, strategy: 'network-only' }
];

// Configuración de límites de caché
const CACHE_LIMITS = {
  [CACHE_NAMES.dynamic]: 50,  // Máximo 50 entradas en el caché dinámico
  [CACHE_NAMES.api]: 100,     // Máximo 100 entradas en el caché de API
  [CACHE_NAMES.documents]: 20 // Máximo 20 documentos
};

// URL para página offline cuando no hay conexión
const OFFLINE_URL = '/offline.html';

// Cola de sincronización para operaciones fallidas
let syncQueue = [];

// Cargar la cola desde IndexedDB si está disponible
const loadSyncQueue = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    syncQueue = await store.getAll();
    console.log('[ServiceWorker] Cola de sincronización cargada:', syncQueue.length, 'elementos');
  } catch (error) {
    console.error('[ServiceWorker] Error al cargar cola de sincronización:', error);
    syncQueue = [];
  }
};

// Guardar la cola en IndexedDB
const saveSyncQueue = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    await store.clear();
    for (const item of syncQueue) {
      await store.add(item);
    }
    await tx.complete;
    console.log('[ServiceWorker] Cola de sincronización guardada:', syncQueue.length, 'elementos');
  } catch (error) {
    console.error('[ServiceWorker] Error al guardar cola de sincronización:', error);
  }
};

// Abrir la base de datos IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offlineSync', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject('Error abriendo IndexedDB');
  });
};

// Asegurarse de que el caché no exceda el límite
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
};

// Install service worker and cache assets
self.addEventListener('install', event => {
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.static),
      caches.open(CACHE_NAMES.dynamic),
      caches.open(CACHE_NAMES.assets),
      caches.open(CACHE_NAMES.documents),
      caches.open(CACHE_NAMES.api)
    ]).then(([staticCache, dynamicCache, assetsCache, documentsCache, apiCache]) => {
      console.log('[ServiceWorker] Cachés abiertos, procediendo a cachear recursos estáticos');
      
      // Manejar cada recurso individualmente para evitar fallos en toda la operación
      const cacheStaticAssets = STATIC_ASSETS.map(asset => 
        staticCache.add(asset).catch(error => {
          console.warn(`[ServiceWorker] Error al cachear ${asset}:`, error);
          return Promise.resolve(); // Continuar a pesar del error
        })
      );
      
      return Promise.all([
        Promise.all(cacheStaticAssets),
        Promise.resolve(), // No cachear nada en dynamic cache
        Promise.resolve(), // No cachear nada en assets cache
        Promise.resolve(), // No cachear nada en documents cache
        Promise.resolve()  // No cachear nada en API cache
      ]);
    }).catch(error => {
      console.error('[ServiceWorker] Error durante la instalación:', error);
    })
  );
  
  // Forzar la activación inmediata
  self.skipWaiting();
});

// Activate service worker and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      const currentCacheNames = Object.values(CACHE_NAMES);
      return Promise.all(
        cacheNames
          .filter(name => !currentCacheNames.includes(name))
          .map(name => caches.delete(name))
      );
    })
  );
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension')) {
    return;
  }

  // Skip Firebase Authentication requests
  if (event.request.url.includes('identitytoolkit.googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('{"error": "network_error"}', {
          status: 408,
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(response => {
            // Don't cache if not a success response
            if (!response || response.status !== 200) {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            // Determinar el caché apropiado según el tipo de solicitud
            let cacheToUse = CACHE_NAMES.dynamic; // Por defecto usar caché dinámico
            
            // Comprobar si la solicitud coincide con algún endpoint de API
            for (const endpoint of API_ENDPOINTS) {
              if (endpoint.cache && endpoint.url.test(event.request.url)) {
                cacheToUse = endpoint.cache;
                break;
              }
            }
            
            caches.open(cacheToUse)
              .then(cache => {
                cache.put(event.request, responseToCache);
                // Limitar el tamaño del caché si es necesario
                if (CACHE_LIMITS[cacheToUse]) {
                  trimCache(cacheToUse, CACHE_LIMITS[cacheToUse]);
                }
              });

            return response;
          })
          .catch(() => {
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});