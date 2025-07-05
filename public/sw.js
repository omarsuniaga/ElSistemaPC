// Versiones de caché
const APP_VERSION = "1.1.0"
const BUILD_DATE = "2023-10-18"

// Detectar si estamos en desarrollo
const isDevelopment =
  self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1"

// Función para determinar si una URL debe ser cacheada en desarrollo
function shouldCacheInDevelopment(url) {
  if (!isDevelopment) return true

  // No cachear archivos TypeScript, Vue, o módulos en desarrollo
  const devPatterns = [/\.ts$/, /\.vue$/, /\/src\//, /@vite/, /@fs/, /node_modules/]

  return !devPatterns.some((pattern) => pattern.test(url))
}

const CACHE_NAMES = {
  static: `static-cache-v${APP_VERSION}`,
  dynamic: `dynamic-cache-v${APP_VERSION}`,
  assets: `assets-cache-v${APP_VERSION}`,
  documents: `documents-cache-v${APP_VERSION}`,
  api: `api-cache-v${APP_VERSION}`,
}

// Mensajes que el Service Worker puede enviar a los clientes
const SW_MESSAGES = {
  INSTALLED: "sw-installed",
  UPDATED: "sw-updated",
  OFFLINE_READY: "sw-offline-ready",
  ERROR: "sw-error",
  CACHE_UPDATED: "sw-cache-updated",
  SYNC_COMPLETED: "sw-sync-completed",
}

// Recursos estáticos para precarga - solo rutas accesibles directamente en el navegador
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  // Nota: Eliminados '/src/main.ts' y '/src/App.vue' que no son accesibles directamente
]

// API endpoints que deben tratarse de manera especial
const API_ENDPOINTS = [
  {url: /\/api\/attendance/, cache: CACHE_NAMES.api, strategy: "network-first"},
  {url: /\/api\/students/, cache: CACHE_NAMES.api, strategy: "network-first"},
  {url: /\/api\/classes/, cache: CACHE_NAMES.api, strategy: "network-first"},
  // Firebase endpoints
  {url: /firestore\.googleapis\.com/, cache: CACHE_NAMES.api, strategy: "network-first"},
  {url: /identitytoolkit\.googleapis\.com/, cache: null, strategy: "network-only"},
]

// Configuración de límites de caché
const CACHE_LIMITS = {
  [CACHE_NAMES.dynamic]: 50, // Máximo 50 entradas en el caché dinámico
  [CACHE_NAMES.api]: 100, // Máximo 100 entradas en el caché de API
  [CACHE_NAMES.documents]: 20, // Máximo 20 documentos
}

// URL para página offline cuando no hay conexión
const OFFLINE_URL = "/offline.html"

// Cola de sincronización para operaciones fallidas
let syncQueue = []

// Cargar la cola desde IndexedDB si está disponible
const loadSyncQueue = async () => {
  try {
    const db = await openDB()
    const tx = db.transaction("syncQueue", "readonly")
    const store = tx.objectStore("syncQueue")
    syncQueue = await store.getAll()
    console.log("[ServiceWorker] Cola de sincronización cargada:", syncQueue.length, "elementos")
  } catch (error) {
    console.error("[ServiceWorker] Error al cargar cola de sincronización:", error)
    syncQueue = []
  }
}

// Guardar la cola en IndexedDB
const saveSyncQueue = async () => {
  try {
    const db = await openDB()
    const tx = db.transaction("syncQueue", "readwrite")
    const store = tx.objectStore("syncQueue")
    await store.clear()
    for (const item of syncQueue) {
      await store.add(item)
    }
    await tx.complete
    console.log("[ServiceWorker] Cola de sincronización guardada:", syncQueue.length, "elementos")
  } catch (error) {
    console.error("[ServiceWorker] Error al guardar cola de sincronización:", error)
  }
}

// Abrir la base de datos IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("offlineSync", 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", {keyPath: "id", autoIncrement: true})
      }
    }

    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject("Error abriendo IndexedDB")
  })
}

// Asegurarse de que el caché no exceda el límite
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > maxItems) {
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i])
    }
  }
}

// Utilidad para enviar mensajes a todos los clientes
const sendMessageToClients = async (message) => {
  const clients = await self.clients.matchAll({type: "window"})
  clients.forEach((client) => {
    client.postMessage(message)
  })
}

// Install service worker and cache assets
self.addEventListener("install", (event) => {
  console.log(`[ServiceWorker] Installing version ${APP_VERSION} (${BUILD_DATE})`)

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.static),
      caches.open(CACHE_NAMES.dynamic),
      caches.open(CACHE_NAMES.assets),
      caches.open(CACHE_NAMES.documents),
      caches.open(CACHE_NAMES.api),
    ])
      .then(async ([staticCache, dynamicCache, assetsCache, documentsCache, apiCache]) => {
        console.log("[ServiceWorker] Cachés abiertos, procediendo a cachear recursos estáticos")

        // Manejar cada recurso individualmente para evitar fallos en toda la operación
        const cacheStaticAssets = STATIC_ASSETS.map((asset) =>
          staticCache.add(asset).catch((error) => {
            console.warn(`[ServiceWorker] Error al cachear ${asset}:`, error)
            return Promise.resolve() // Continuar a pesar del error
          })
        )

        try {
          await Promise.all(cacheStaticAssets)
          console.log("[ServiceWorker] Todos los recursos estáticos cacheados correctamente")

          // Notificar a los clientes que el SW está listo para uso offline
          await sendMessageToClients({
            type: SW_MESSAGES.INSTALLED,
            payload: {
              version: APP_VERSION,
              buildDate: BUILD_DATE,
              cacheReady: true,
            },
          })

          return true
        } catch (err) {
          console.error("[ServiceWorker] Error al cachear recursos estáticos:", err)

          // Notificar que hay un error pero seguimos funcionando
          await sendMessageToClients({
            type: SW_MESSAGES.ERROR,
            payload: {
              message: "Error al cachear recursos estáticos",
              error: err.message,
            },
          })

          return false
        }
      })
      .catch((error) => {
        console.error("[ServiceWorker] Error durante la instalación:", error)
      })
  )

  // Forzar la activación inmediata
  self.skipWaiting()
})

// Activate service worker and clean old caches
self.addEventListener("activate", (event) => {
  console.log(`[ServiceWorker] Activating version ${APP_VERSION}`)

  event.waitUntil(
    (async () => {
      try {
        // Limpiar caches obsoletas
        const cacheNames = await caches.keys()
        const currentCacheNames = Object.values(CACHE_NAMES)
        const deletedCaches = []

        const cleanupPromises = cacheNames
          .filter((name) => !currentCacheNames.includes(name))
          .map(async (name) => {
            await caches.delete(name)
            deletedCaches.push(name)
            return name
          })

        await Promise.all(cleanupPromises)

        if (deletedCaches.length > 0) {
          console.log("[ServiceWorker] Caches obsoletas eliminadas:", deletedCaches)
        }

        // Tomar el control inmediatamente sin requerir recarga
        await self.clients.claim()

        // Enviar mensaje de actualización a todos los clientes
        await sendMessageToClients({
          type: SW_MESSAGES.UPDATED,
          payload: {
            version: APP_VERSION,
            buildDate: BUILD_DATE,
            oldCachesDeleted: deletedCaches,
            message: `Service Worker v${APP_VERSION} activado y listo`,
          },
        })

        return true
      } catch (error) {
        console.error("[ServiceWorker] Error durante la activación:", error)
        return false
      }
    })()
  )
})

// Variable para simular modo offline (para testing)
let simulateOfflineMode = false

// Mensajería entre SW y clientes
self.addEventListener("message", (event) => {
  const message = event.data

  if (!message || !message.type) {
    return
  }

  console.log("[ServiceWorker] Mensaje recibido:", message.type)

  switch (message.type) {
    case "SIMULATE_OFFLINE":
      simulateOfflineMode = !!message.payload
      console.log(`[ServiceWorker] Modo offline simulado: ${simulateOfflineMode}`)
      break

    case "GET_VERSION":
      event.ports[0].postMessage({
        version: APP_VERSION,
        buildDate: BUILD_DATE,
      })
      break

    case "GET_SYNC_QUEUE":
      event.ports[0].postMessage({
        type: "SYNC_QUEUE_STATE",
        payload: syncQueue,
      })
      break

    case "CLEAR_SYNC_QUEUE":
      syncQueue = []
      saveSyncQueue()
      break
  }
})

// Función para determinar la estrategia de caché para una URL
const getCacheStrategy = (url) => {
  // Verificar endpoints de API especiales
  const apiEndpoint = API_ENDPOINTS.find((endpoint) => endpoint.url.test(url))
  if (apiEndpoint) {
    return {
      cacheName: apiEndpoint.cache,
      strategy: apiEndpoint.strategy,
    }
  }

  // Para assets estáticos
  if (url.match(/\.(css|js|woff2?|ttf|eot|png|jpe?g|gif|svg|ico|webp)$/i)) {
    return {
      cacheName: CACHE_NAMES.assets,
      strategy: "cache-first",
    }
  }

  // Para documentos HTML
  if (url.match(/\/[^.]*$|\.html$/i)) {
    return {
      cacheName: CACHE_NAMES.documents,
      strategy: "network-first",
    }
  }

  // Default
  return {
    cacheName: CACHE_NAMES.dynamic,
    strategy: "stale-while-revalidate",
  }
}

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith("chrome-extension")) {
    return
  }

  // Manejar el modo offline simulado
  if (simulateOfflineMode) {
    console.log("[ServiceWorker] Simulando offline para:", event.request.url)
    if (event.request.headers.get("Accept").includes("text/html")) {
      // Para navegación a páginas, mostrar página offline
      event.respondWith(caches.match(OFFLINE_URL))
      return
    } else {
      // Para otros recursos, intentar desde caché o fallar
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return new Response("", {
            status: 503,
            statusText: "Offline Simulation",
          })
        })
      )
      return
    }
  }

  // URL de la solicitud
  const requestURL = event.request.url

  // Determinar estrategia de caché
  const {cacheName, strategy} = getCacheStrategy(requestURL)

  // Skip Firebase Authentication requests
  if (event.request.url.includes("identitytoolkit.googleapis.com")) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response('{"error": "network_error"}', {
            status: 408,
            headers: {"Content-Type": "application/json"},
          })
      )
    )
    return
  }

  // Navegación principal a HTML - estrategia especial para offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      })
    )
    return
  }

  // Aplicar estrategia según el tipo de solicitud
  switch (strategy) {
    case "network-first":
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            // Clonar la respuesta antes de usarla
            const responseToCache = networkResponse.clone()

            if (cacheName && networkResponse.status === 200) {
              caches.open(cacheName).then((cache) => {
                cache.put(event.request, responseToCache)
              })
            }

            return networkResponse
          })
          .catch(() => {
            // Si la red falla, intentar desde caché
            return caches.match(event.request).then((cachedResponse) => {
              return cachedResponse || caches.match(OFFLINE_URL)
            })
          })
      )
      break

    case "cache-first":
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Devolver desde caché, pero actualizar en segundo plano
            const fetchPromise = fetch(event.request)
              .then((networkResponse) => {
                if (cacheName && networkResponse.status === 200) {
                  caches.open(cacheName).then((cache) => {
                    cache.put(event.request, networkResponse.clone())
                  })
                }
                return networkResponse
              })
              .catch(() => cachedResponse)

            // No esperamos a que termine, actualización en segundo plano
            event.waitUntil(fetchPromise)

            return cachedResponse
          }

          // Si no está en caché, ir a red
          return fetch(event.request).then((response) => {
            // Caché solo las respuestas exitosas
            if (cacheName && response.status === 200) {
              const responseToCache = response.clone()
              caches.open(cacheName).then((cache) => {
                cache.put(event.request, responseToCache)
              })
            }
            return response
          })
        })
      )
      break

    case "network-only":
      event.respondWith(fetch(event.request))
      break

    case "stale-while-revalidate":
    default:
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // En desarrollo, no cachear recursos .ts ni otros archivos de desarrollo
              if (
                cacheName &&
                networkResponse.status === 200 &&
                shouldCacheInDevelopment(event.request.url)
              ) {
                const responseToCache = networkResponse.clone()
                caches
                  .open(cacheName)
                  .then((cache) => {
                    cache.put(event.request, responseToCache).catch((error) => {
                      if (!isDevelopment) {
                        console.warn("[SW] Cache put failed for:", event.request.url, error)
                      }
                    })

                    // Mantener el tamaño del caché bajo control
                    if (CACHE_LIMITS[cacheName]) {
                      trimCache(cacheName, CACHE_LIMITS[cacheName])
                    }
                  })
                  .catch((error) => {
                    if (!isDevelopment) {
                      console.warn("[SW] Cache open failed:", error)
                    }
                  })
              }
              return networkResponse
            })
            .catch((error) => {
              if (!isDevelopment) {
                console.warn("[SW] Network fetch failed for:", event.request.url, error)
              }
              throw error
            })

          return cachedResponse || fetchPromise
        })
      )
  }
})

// Background sync para el guardado offline de asistencia
self.addEventListener("sync", (event) => {
  if (event.tag === "attendance-sync") {
    event.waitUntil(syncAttendance())
  }
})

async function syncAttendance() {
  try {
    // Intentar sincronizar datos de asistencia pendientes
    console.log("[SW] Sincronizando datos de asistencia...")
    // Aquí iría la lógica de sincronización
  } catch (error) {
    console.error("[SW] Error en sincronización:", error)
  }
}
