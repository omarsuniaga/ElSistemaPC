import {ref, onMounted, onUnmounted, getCurrentInstance} from "vue"
import {openDB, DBSchema, IDBPDatabase} from "idb"

interface OfflineDB extends DBSchema {
  pendingChanges: {
    key: string
    value: {
      id: string
      operation: "create" | "update" | "delete"
      collection: string
      data: any
      timestamp: number
      retryCount: number
    }
  }
}

const isOffline = ref(false)
const isSyncing = ref(false)
let db: IDBPDatabase<OfflineDB> | null = null

export function useOffline() {
  const pendingChanges = ref<number>(0)

  const initDB = async () => {
    try {
      db = await openDB<OfflineDB>("offlineDB", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("pendingChanges")) {
            db.createObjectStore("pendingChanges", {keyPath: "id"})
          }
        },
      })
      await updatePendingCount()
    } catch (error) {
      console.error("Error initializing IndexedDB:", error)
    }
  }

  const updatePendingCount = async () => {
    if (!db) return
    const count = await db.count("pendingChanges")
    pendingChanges.value = count
  }

  const queueChange = async (
    operation: "create" | "update" | "delete",
    collection: string,
    data: any
  ) => {
    if (!db) await initDB()
    if (!db) return

    const change = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      collection,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    }
    await db.add("pendingChanges", change)
    await updatePendingCount()
  }

  const processQueue = async () => {
    if (!db || isSyncing.value || isOffline.value) return
    isSyncing.value = true
    try {
      const tx = db.transaction("pendingChanges", "readwrite")
      const store = tx.objectStore("pendingChanges")
      const changes = await store.getAll()
      for (const change of changes) {
        try {
          // Aquí iría la lógica de sincronización con el servidor
          await store.delete(change.id)
        } catch (error) {
          change.retryCount++
          if (change.retryCount < 3) {
            await store.put(change)
          } else {
            console.error(`Failed to process change after 3 retries:`, change)
            await store.delete(change.id)
          }
        }
      }
      await tx.done
      await updatePendingCount()
    } catch (error) {
      console.error("Error processing offline queue:", error)
    } finally {
      isSyncing.value = false
    }
  }

  const setupConnectivityListeners = () => {
    const updateOnlineStatus = () => {
      const wasOffline = isOffline.value
      isOffline.value = !navigator.onLine
      if (wasOffline && !isOffline.value) {
        processQueue()
      }
    }

    // Verificar el estado inicial
    updateOnlineStatus()

    // Configurar los listeners
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Devolver función de limpieza
    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }

  // Función para configurar intervalos de sincronización
  let syncIntervalId: number | null = null

  const setupSyncInterval = () => {
    syncIntervalId = window.setInterval(() => {
      if (!isOffline.value && pendingChanges.value > 0) {
        processQueue()
      }
    }, 60000) as unknown as number // Intentar cada minuto
  }

  // Función para inicializar todo
  const initialize = async () => {
    await initDB()
    const cleanupConnectivity = setupConnectivityListeners()
    setupSyncInterval()

    // Devolver función de limpieza
    return () => {
      cleanupConnectivity()
      if (syncIntervalId !== null) {
        clearInterval(syncIntervalId)
        syncIntervalId = null
      }
      if (db) {
        db.close()
        db = null
      }
    }
  }

  // Usar onMounted y onUnmounted sólo si hay una instancia activa
  if (getCurrentInstance()) {
    onMounted(async () => {
      const cleanup = await initialize()
      onUnmounted(cleanup)
    })
  }

  return {
    isOffline,
    isSyncing,
    pendingChanges,
    queueChange,
    processQueue,
    initialize, // Se exporta initialize para poder usarlo manualmente si es necesario
    closeDB: () => {
      if (db) {
        db.close()
        db = null
      }
      if (syncIntervalId !== null) {
        clearInterval(syncIntervalId)
        syncIntervalId = null
      }
    },
  }
}
