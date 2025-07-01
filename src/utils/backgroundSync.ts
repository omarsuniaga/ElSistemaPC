// src/utils/backgroundSync.ts
import {CacheManager} from "./cacheManager"

/**
 * Interfaz para operaciones pendientes
 */
interface PendingOperation {
  id: string
  type: "create" | "update" | "delete"
  collection: string
  data: any
  timestamp: number
  retries: number
}

/**
 * Opciones para el proceso de sincronización
 */
interface SyncOptions {
  maxRetries: number
  retryDelay: number
  batchSize: number
}

// Clave para almacenar operaciones pendientes
const PENDING_OPS_KEY = "pending_operations"

// Configuración por defecto
const DEFAULT_OPTIONS: SyncOptions = {
  maxRetries: 5,
  retryDelay: 5000, // 5 segundos
  batchSize: 10,
}

/**
 * Servicio para manejar sincronización en segundo plano
 */
export class BackgroundSync {
  private static isProcessing = false
  private static syncWorker: Worker | null = null
  private static options: SyncOptions = DEFAULT_OPTIONS

  /**
   * Inicializar el servicio de sincronización
   */
  static init(options: Partial<SyncOptions> = {}): void {
    this.options = {...DEFAULT_OPTIONS, ...options}
    this.setupConnectionListeners()

    // Cargar el web worker si es posible
    try {
      // En una aplicación real, crearíamos un worker real
      // this.syncWorker = new Worker(new URL('./syncWorker.ts', import.meta.url));
      console.log("[Sync] Inicializado servicio de sincronización")
    } catch (error) {
      console.warn("[Sync] No se pudo inicializar el worker:", error)
    }

    // Intentar sincronizar al iniciar
    this.attemptSync()
  }

  /**
   * Añadir una operación pendiente
   */
  static addPendingOperation(
    type: "create" | "update" | "delete",
    collection: string,
    data: any
  ): string {
    const operations = this.getPendingOperations()

    const newOperation: PendingOperation = {
      id: crypto.randomUUID(),
      type,
      collection,
      data,
      timestamp: Date.now(),
      retries: 0,
    }

    operations.push(newOperation)
    this.savePendingOperations(operations)

    console.log(`[Sync] Operación pendiente añadida: ${type} en ${collection}`)
    this.attemptSync()

    return newOperation.id
  }

  /**
   * Obtener todas las operaciones pendientes
   */
  static getPendingOperations(): PendingOperation[] {
    const stored = localStorage.getItem(PENDING_OPS_KEY)
    if (!stored) return []

    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error("[Sync] Error al parsear operaciones pendientes:", error)
      return []
    }
  }

  /**
   * Guardar operaciones pendientes
   */
  private static savePendingOperations(operations: PendingOperation[]): void {
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(operations))
  }

  /**
   * Intentar sincronizar operaciones pendientes
   */
  static async attemptSync(): Promise<void> {
    // Evitar sincronizaciones simultáneas
    if (this.isProcessing) {
      console.log("[Sync] Ya hay un proceso de sincronización en curso")
      return
    }

    // Verificar conexión
    if (!navigator.onLine) {
      console.log("[Sync] Sin conexión, sincronización pospuesta")
      return
    }

    const operations = this.getPendingOperations()
    if (operations.length === 0) {
      console.log("[Sync] No hay operaciones pendientes para sincronizar")
      return
    }

    console.log(`[Sync] Iniciando sincronización de ${operations.length} operaciones pendientes`)
    this.isProcessing = true

    try {
      // En una implementación real, esto utilizaría el web worker
      // o procesaría en batches para no bloquear la UI
      await this.processBatch(operations.slice(0, this.options.batchSize))

      // Recalcular operaciones pendientes después del proceso
      const remainingOps = this.getPendingOperations()
      if (remainingOps.length > 0) {
        console.log(`[Sync] Quedan ${remainingOps.length} operaciones por sincronizar`)
        setTimeout(() => this.attemptSync(), 1000)
      } else {
        console.log("[Sync] Sincronización completada")
        // Invalidar caché después de sincronizar cambios
        CacheManager.invalidateCache()
      }
    } catch (error) {
      console.error("[Sync] Error durante la sincronización:", error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Procesar un lote de operaciones pendientes
   */
  private static async processBatch(batch: PendingOperation[]): Promise<void> {
    // Simulamos que estamos procesando el lote
    // En una implementación real, esto enviaría las operaciones a Firebase
    console.log(`[Sync] Procesando lote de ${batch.length} operaciones`)

    // Procesamiento de opera iones en paralelo con límite
    const results = await Promise.allSettled(
      batch.map((operation) => this.processOperation(operation))
    )

    // Actualizar lista de operaciones pendientes
    const allOperations = this.getPendingOperations()

    const remainingOperations = allOperations.filter((op) => {
      const processedOp = batch.find((b) => b.id === op.id)

      // Si la operación no estaba en este lote, mantenerla
      if (!processedOp) return true

      // Verificar el resultado de la operación
      const index = batch.indexOf(processedOp)
      const result = results[index]

      if (result.status === "fulfilled") {
        // Operación exitosa, no mantener
        return false
      } else {
        // Actualizar conteo de reintentos
        op.retries += 1
        // Mantener solo si no excede máximo de reintentos
        return op.retries < this.options.maxRetries
      }
    })

    // Guardar operaciones restantes
    this.savePendingOperations(remainingOperations)

    // Número de operaciones sincronizadas
    const syncedCount = allOperations.length - remainingOperations.length
    if (syncedCount > 0) {
      console.log(`[Sync] ${syncedCount} operaciones sincronizadas correctamente`)
    }
  }

  /**
   * Procesar una operación individual
   */
  private static async processOperation(operation: PendingOperation): Promise<void> {
    // En una implementación real, esto realmente ejecutaría la operación en Firestore
    console.log(`[Sync] Procesando operación: ${operation.type} en ${operation.collection}`)

    // Simulamos que el 90% de las operaciones son exitosas
    const isSuccessful = Math.random() > 0.1

    if (isSuccessful) {
      console.log(`[Sync] Operación ${operation.id} completada exitosamente`)
      return Promise.resolve()
    } else {
      console.warn(`[Sync] Operación ${operation.id} falló (intento ${operation.retries + 1})`)
      return Promise.reject(new Error("Error simulado"))
    }
  }

  /**
   * Configurar escuchas para cambios en el estado de conexión
   */
  private static setupConnectionListeners(): void {
    window.addEventListener("online", () => {
      console.log("[Sync] Conexión recuperada, iniciando sincronización")
      this.attemptSync()
    })

    window.addEventListener("offline", () => {
      console.log("[Sync] Conexión perdida, modo offline activado")
    })
  }

  /**
   * Verificar si una colección tiene cambios pendientes
   */
  static hasCollectionPendingChanges(collection: string): boolean {
    const operations = this.getPendingOperations()
    return operations.some((op) => op.collection === collection)
  }
}
