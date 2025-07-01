// src/registerServiceWorker.ts
import {useOfflineMode} from "./utils/offlineMode"

// Interfaz para mensajes del Service Worker
interface ServiceWorkerMessage {
  type: string
  payload?: any
}

// Constantes para tipos de mensajes
const SW_MESSAGES = {
  INSTALLED: "sw-installed",
  UPDATED: "sw-updated",
  OFFLINE_READY: "sw-offline-ready",
  ERROR: "sw-error",
  CACHE_UPDATED: "sw-cache-updated",
  SYNC_COMPLETED: "sw-sync-completed",
}

// Estado del Service Worker
let swRegistration: ServiceWorkerRegistration | null = null
let swVersion: string | null = null

// Registro del service worker
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        swRegistration = registration
        console.log("Service Worker registrado con éxito:", registration.scope)

        // Exponer registro para herramientas de debug
        if (typeof window !== "undefined") {
          ;(window as any).__swRegistration = registration
        }

        // Inicializar modo offline después de registrar el service worker
        if (typeof useOfflineMode === "function") {
          useOfflineMode()
        }

        // Escuchar actualizaciones del service worker
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              console.log(`Service Worker estado: ${newWorker.state}`)

              if (newWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // Hay una nueva versión disponible
                  showUpdateNotification()
                } else {
                  // Primera instalación
                  console.log("Service Worker instalado por primera vez")
                  showFirstInstallMessage()
                }
              }
            })
          }
        })

        // Verificar la versión del Service Worker
        checkServiceWorkerVersion()
      } catch (error) {
        console.error("Error al registrar el Service Worker:", error)
      }
    })

    // Verificar actualizaciones cada hora
    setInterval(() => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.update()
        }
      })
    }, 3600000) // 1 hora

    // Escuchar mensajes del service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      const message = event.data as ServiceWorkerMessage

      if (!message || !message.type) return

      console.log(`Mensaje del Service Worker: ${message.type}`, message.payload)

      switch (message.type) {
        case SW_MESSAGES.SYNC_COMPLETED:
        case "SYNC_COMPLETE": // Mantener compatibilidad con el formato antiguo
          showSyncNotification(message.payload || event.data.detail)
          break

        case SW_MESSAGES.UPDATED:
          showUpdateNotification(message.payload)
          break

        case SW_MESSAGES.OFFLINE_READY:
          // Notificar que la app está lista para uso offline
          const offlineReadyEvent = new CustomEvent("pwa-offline-ready", {
            detail: message.payload,
          })
          window.dispatchEvent(offlineReadyEvent)
          break

        case SW_MESSAGES.ERROR:
          console.error("Error en Service Worker:", message.payload)
          break
      }
    })
  } else {
    console.warn("Service Worker no está soportado en este navegador")
  }
}

// Mostrar notificación de actualización disponible
function showUpdateNotification(payload?: any) {
  // Obtener la versión si está disponible
  const version = payload?.version || "nueva versión"

  // Verificar si el navegador soporta notificaciones
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("Actualización disponible", {
        body: `Hay una ${version} disponible. Haz clic aquí para actualizar.`,
        icon: "/icons/icon-192x192.png",
      })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission()
    }
  }

  // Alternativa: mostrar una alerta en la aplicación
  const event = new CustomEvent("app-update-available", {detail: payload})
  window.dispatchEvent(event)
}

// Mostrar notificación de sincronización completada
function showSyncNotification(detail: any) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Sincronización completada", {
      body: `Se han sincronizado ${detail.count} cambios.`,
      icon: "/icons/icon-192x192.png",
    })
  }

  // Disparar evento para que lo escuchen los componentes
  const event = new CustomEvent("sync-complete", {detail})
  window.dispatchEvent(event)
}

// Para uso directo desde otros archivos
export function checkForUpdates(): Promise<boolean> {
  return new Promise((resolve) => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        if (registrations.length === 0) {
          resolve(false)
          return
        }

        // Actualizar todos los registros y esperar
        try {
          await Promise.all(registrations.map((registration) => registration.update()))
          console.log("Verificación de actualizaciones completada")
          resolve(true)
        } catch (error) {
          console.error("Error al buscar actualizaciones:", error)
          resolve(false)
        }
      })
    } else {
      resolve(false)
    }
  })
}

// Verificar el estado offline
export function isOffline(): boolean {
  return !navigator.onLine
}

// Obtener la versión actual del Service Worker
async function checkServiceWorkerVersion() {
  if (!swRegistration || !navigator.serviceWorker.controller) {
    return null
  }

  try {
    // Crear un MessageChannel para recibir la respuesta
    const messageChannel = new MessageChannel()

    // Crear una promesa para esperar la respuesta
    const versionPromise = new Promise<string>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.version) {
          resolve(event.data.version)
        } else {
          resolve("desconocida")
        }
      }
    })

    // Enviar mensaje al Service Worker
    navigator.serviceWorker.controller.postMessage(
      {
        type: "GET_VERSION",
      },
      [messageChannel.port2]
    )

    // Esperar respuesta con timeout
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("desconocida"), 1000)
    })

    // Usar la primera respuesta que llegue
    swVersion = await Promise.race([versionPromise, timeoutPromise])
    console.log(`Versión del Service Worker: ${swVersion}`)

    // Exponer la versión
    if (typeof window !== "undefined") {
      ;(window as any).__swVersion = swVersion
    }

    return swVersion
  } catch (err) {
    console.error("Error al obtener versión del SW:", err)
    return null
  }
}

// Mostrar mensaje de primera instalación
function showFirstInstallMessage() {
  console.log("🚀 Aplicación lista para uso offline")

  // Disparar evento para componentes
  const event = new CustomEvent("pwa-first-install")
  window.dispatchEvent(event)

  // Mostrar notificación si está permitido
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Aplicación lista para uso offline", {
      body: "Ahora puedes usar la aplicación incluso sin conexión a internet.",
      icon: "/icons/icon-192x192.png",
    })
  }
}

// Obtener el registro del Service Worker
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration
}

// Forzar la actualización del Service Worker
export async function forceServiceWorkerUpdate(): Promise<boolean> {
  if (!swRegistration) return false

  try {
    await swRegistration.update()
    return true
  } catch (err) {
    console.error("Error al forzar actualización del SW:", err)
    return false
  }
}
