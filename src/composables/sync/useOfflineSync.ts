/**
 * 🔄 SISTEMA DE SINCRONIZACIÓN OFFLINE
 * Maneja el estado offline/online y la sincronización automática
 * Fase 1 - Iniciativa 2: Sincronización en Background
 */

import {ref, computed, watch} from "vue"

// ==================== COMPOSABLE DE ESTADO OFFLINE ====================

export function useOfflineSync() {
  // Estados reactivos
  const isOnline = ref(navigator.onLine)
  const syncStatus = ref<"idle" | "syncing" | "error">("idle")
  const pendingOperations = ref(0)
  const lastSyncTime = ref<Date | null>(null)
  const syncErrors = ref<string[]>([])

  // Estados PWA
  const needRefresh = ref(false)
  const offlineReady = ref(false)

  // Service Worker registration manually
  let swRegistration: ServiceWorkerRegistration | null = null

  // ==================== PWA REGISTRATION ====================

  async function registerSW() {
    if ("serviceWorker" in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register("/sw.js")
        console.log("🎯 Service Worker registrado")

        swRegistration.addEventListener("updatefound", () => {
          const newWorker = swRegistration?.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  needRefresh.value = true
                } else {
                  offlineReady.value = true
                }
              }
            })
          }
        })

        // Configurar sincronización periódica si está disponible
        if (swRegistration && "sync" in swRegistration) {
          await swRegistration.sync.register("background-sync")
        }
      } catch (error) {
        console.error("❌ Error registrando Service Worker:", error)
      }
    }
  }

  // ==================== LISTENERS DE CONEXIÓN ====================

  // Escuchar cambios en el estado de conexión
  const handleOnline = () => {
    isOnline.value = true
    console.log("🌐 Conexión restaurada - Iniciando sincronización")
    forceSyncPendingOperations()
  }

  const handleOffline = () => {
    isOnline.value = false
    console.log("📱 Modo offline activado")
  }

  // Registrar listeners
  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  // ==================== FUNCIONES DE SINCRONIZACIÓN ====================

  /**
   * Fuerza la sincronización de operaciones pendientes
   */
  async function forceSyncPendingOperations(): Promise<boolean> {
    if (!isOnline.value) {
      console.log("⚠️ No hay conexión - Sincronización cancelada")
      return false
    }

    syncStatus.value = "syncing"
    syncErrors.value = []

    try {
      // Comunicarse con el Service Worker para obtener estado
      const syncStatus = await getServiceWorkerSyncStatus()
      pendingOperations.value = syncStatus.total

      if (syncStatus.total === 0) {
        console.log("✅ No hay operaciones pendientes")
        syncStatus.value = "idle"
        return true
      }

      console.log(`🔄 Sincronizando ${syncStatus.total} operaciones pendientes...`)

      // Solicitar sincronización forzada al Service Worker
      const result = await requestServiceWorkerSync()

      if (result.success) {
        console.log("✅ Sincronización completada exitosamente")
        pendingOperations.value = 0
        lastSyncTime.value = new Date()
        syncStatus.value = "idle"
        return true
      } else {
        throw new Error(result.error || "Error desconocido en sincronización")
      }
    } catch (error: any) {
      console.error("❌ Error en sincronización:", error)
      syncErrors.value.push(error.message)
      syncStatus.value = "error"
      return false
    }
  }

  /**
   * Obtiene el estado de sincronización del Service Worker
   */
  async function getServiceWorkerSyncStatus(): Promise<{
    attendanceQueue: number
    teachersQueue: number
    observationsQueue: number
    total: number
  }> {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
      return {attendanceQueue: 0, teachersQueue: 0, observationsQueue: 0, total: 0}
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        const data = event.data
        resolve({
          attendanceQueue: data.attendanceQueue || 0,
          teachersQueue: data.teachersQueue || 0,
          observationsQueue: data.observationsQueue || 0,
          total:
            (data.attendanceQueue || 0) + (data.teachersQueue || 0) + (data.observationsQueue || 0),
        })
      }

      navigator.serviceWorker.controller.postMessage({type: "GET_SYNC_STATUS"}, [
        messageChannel.port2,
      ])
    })
  }

  /**
   * Solicita sincronización forzada al Service Worker
   */
  async function requestServiceWorkerSync(): Promise<{success: boolean; error?: string}> {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
      return {success: false, error: "Service Worker no disponible"}
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }

      navigator.serviceWorker.controller.postMessage({type: "FORCE_SYNC"}, [messageChannel.port2])
    })
  }

  /**
   * Actualiza el contador de operaciones pendientes
   */
  async function updatePendingOperationsCount() {
    const status = await getServiceWorkerSyncStatus()
    pendingOperations.value = status.total
  }

  // ==================== COMPUTED PROPERTIES ====================

  const connectionStatus = computed(() => {
    if (isOnline.value) {
      return syncStatus.value === "syncing" ? "syncing" : "online"
    }
    return "offline"
  })

  const connectionIcon = computed(() => {
    switch (connectionStatus.value) {
      case "online":
        return "🌐"
      case "offline":
        return "📱"
      case "syncing":
        return "🔄"
      default:
        return "❓"
    }
  })

  const connectionText = computed(() => {
    switch (connectionStatus.value) {
      case "online":
        return "En línea"
      case "offline":
        return `Offline${pendingOperations.value > 0 ? ` (${pendingOperations.value} pendientes)` : ""}`
      case "syncing":
        return "Sincronizando..."
      default:
        return "Desconocido"
    }
  })

  const hasPendingOperations = computed(() => pendingOperations.value > 0)

  const canSync = computed(
    () => isOnline.value && hasPendingOperations.value && syncStatus.value !== "syncing"
  )

  // ==================== WATCHERS ====================

  // Auto-sincronizar cuando se restaure la conexión
  watch(isOnline, (newValue) => {
    if (newValue) {
      // Esperar un momento para que la conexión se estabilice
      setTimeout(() => {
        updatePendingOperationsCount()
      }, 1000)
    }
  })

  // Actualizar contador periódicamente
  setInterval(updatePendingOperationsCount, 30000) // Cada 30 segundos

  // ==================== FUNCIONES DE UTILIDAD ====================

  /**
   * Simula una operación offline
   */
  function simulateOfflineOperation(type: "attendance" | "teachers" | "observations") {
    pendingOperations.value++
    console.log(`📝 Operación ${type} agregada a cola offline`)
  }

  /**
   * Limpia errores de sincronización
   */
  function clearSyncErrors() {
    syncErrors.value = []
  }

  /**
   * Actualiza la PWA
   */
  async function updatePWA() {
    if (swRegistration) {
      const newWorker = swRegistration.waiting
      if (newWorker) {
        newWorker.postMessage({type: "SKIP_WAITING"})
        window.location.reload()
      }
    }
  }

  // ==================== INICIALIZACIÓN ====================

  // Auto-registrar SW al cargar
  if (typeof window !== "undefined") {
    registerSW()
  }

  // ==================== CLEANUP ====================

  function cleanup() {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }

  // ==================== RETURN ====================

  return {
    // Estados
    isOnline,
    syncStatus,
    pendingOperations,
    lastSyncTime,
    syncErrors,
    needRefresh,
    offlineReady,

    // Computed
    connectionStatus,
    connectionIcon,
    connectionText,
    hasPendingOperations,
    canSync,

    // Métodos
    forceSyncPendingOperations,
    updatePendingOperationsCount,
    simulateOfflineOperation,
    clearSyncErrors,
    updatePWA,
    cleanup,
  }
}

// ==================== COMPONENTE GLOBAL DE ESTADO ====================

/**
 * Composable singleton para estado global de sincronización
 */
let globalOfflineSync: ReturnType<typeof useOfflineSync> | null = null

export function useGlobalOfflineSync() {
  if (!globalOfflineSync) {
    globalOfflineSync = useOfflineSync()
  }
  return globalOfflineSync
}

// ==================== STORE DE SINCRONIZACIÓN ====================

import {defineStore} from "pinia"

export const useSyncStore = defineStore("sync", () => {
  const offlineSync = useGlobalOfflineSync()

  // Re-exportar todo del composable
  return {
    ...offlineSync,

    // Métodos adicionales del store
    async initializePWA() {
      console.log("🚀 Inicializando PWA...")
      await offlineSync.updatePendingOperationsCount()

      // Registrar para sincronización en background si es compatible
      if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
        console.log("✅ Background Sync soportado")
      } else {
        console.log("⚠️ Background Sync no soportado - Usando polling")
      }
    },

    async handleAppVisibilityChange() {
      if (document.visibilityState === "visible" && offlineSync.isOnline.value) {
        await offlineSync.updatePendingOperationsCount()
      }
    },
  }
})

// Auto-inicializar cuando se importe
if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    const syncStore = useSyncStore()
    syncStore.handleAppVisibilityChange()
  })
}
