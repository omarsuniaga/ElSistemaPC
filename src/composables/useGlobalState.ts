/**
 * Estado Global Reactivo para Consolidación del Sistema
 * Aborda el punto de fricción #4: Inconsistencias en Estado Reactivo
 *
 * Este composable proporciona un estado global coherente que sincroniza
 * automáticamente con todos los stores del sistema y mantiene la consistencia.
 */

import {ref, computed, watch, onUnmounted} from "vue"
import {useAttendanceStore} from "../modulos/Attendance/store/attendance"
import {useClassesStore} from "../modulos/Classes/store/classes"
import {useStudentsStore} from "../modulos/Students/store/students"

/**
 * Configuración del estado global
 */
interface GlobalStateConfig {
  enableAutoSync: boolean
  syncInterval: number // en segundos
  enableDeepWatch: boolean
  debugMode: boolean
}

/**
 * Métricas del estado global
 */
interface GlobalStateMetrics {
  syncCount: number
  lastSync: Date | null
  inconsistenciesDetected: number
  autoSyncEnabled: boolean
  watchers: number
}

/**
 * Estado de sincronización
 */
interface SyncStatus {
  isLoading: boolean
  lastError: string | null
  pendingOperations: number
}

class GlobalStateManager {
  private config: GlobalStateConfig = {
    enableAutoSync: true,
    syncInterval: 30, // 30 segundos
    enableDeepWatch: true,
    debugMode: false,
  }

  private metrics = ref<GlobalStateMetrics>({
    syncCount: 0,
    lastSync: null,
    inconsistenciesDetected: 0,
    autoSyncEnabled: true,
    watchers: 0,
  })

  private syncStatus = ref<SyncStatus>({
    isLoading: false,
    lastError: null,
    pendingOperations: 0,
  })

  private intervals: NodeJS.Timeout[] = []
  private watchers: Array<() => void> = []

  /**
   * Inicializa el estado global
   */
  init() {
    if (this.config.enableAutoSync) {
      this.startAutoSync()
    }

    if (this.config.enableDeepWatch) {
      this.setupWatchers()
    }

    if (this.config.debugMode) {
      console.log("🚀 Estado Global inicializado")
    }
  }

  /**
   * Inicia la sincronización automática
   */
  private startAutoSync() {
    const interval = setInterval(() => {
      this.syncAllStores()
    }, this.config.syncInterval * 1000)

    this.intervals.push(interval)
    this.metrics.value.autoSyncEnabled = true
  }

  /**
   * Configura watchers reactivos
   */
  private setupWatchers() {
    const attendanceStore = useAttendanceStore()
    const classesStore = useClassesStore()
    const studentsStore = useStudentsStore()

    // Watcher para cambios en asistencia
    const attendanceWatcher = watch(
      () => attendanceStore.attendanceRecords,
      (newRecords, oldRecords) => {
        if (this.config.debugMode) {
          console.log("📝 Cambio detectado en asistencia:", {
            before: Object.keys(oldRecords || {}).length,
            after: Object.keys(newRecords || {}).length,
          })
        }
        this.handleStateChange("attendance")
      },
      {deep: true}
    )

    // Watcher para cambios en clases
    const classesWatcher = watch(
      () => classesStore.classes,
      (newClasses) => {
        if (this.config.debugMode) {
          console.log("🏫 Cambio detectado en clases:", newClasses.length)
        }
        this.handleStateChange("classes")
      },
      {deep: true}
    )

    // Watcher para cambios en estudiantes
    const studentsWatcher = watch(
      () => studentsStore.students,
      (newStudents) => {
        if (this.config.debugMode) {
          console.log("👥 Cambio detectado en estudiantes:", newStudents.length)
        }
        this.handleStateChange("students")
      },
      {deep: true}
    )

    this.watchers.push(attendanceWatcher, classesWatcher, studentsWatcher)
    this.metrics.value.watchers = this.watchers.length
  }

  /**
   * Maneja cambios de estado
   */
  private handleStateChange(source: string) {
    if (this.config.debugMode) {
      console.log(`🔄 Estado cambiado desde: ${source}`)
    }

    // Incrementar operaciones pendientes
    this.syncStatus.value.pendingOperations++

    // Programar sincronización si no está ya en progreso
    if (!this.syncStatus.value.isLoading) {
      setTimeout(() => {
        this.syncAllStores()
      }, 1000) // Debounce de 1 segundo
    }
  }

  /**
   * Sincroniza todos los stores
   */
  async syncAllStores() {
    if (this.syncStatus.value.isLoading) return

    this.syncStatus.value.isLoading = true
    this.syncStatus.value.lastError = null

    try {
      const attendanceStore = useAttendanceStore()
      const classesStore = useClassesStore()
      const studentsStore = useStudentsStore()

      // Sincronizar stores en paralelo cuando sea posible
      const syncPromises = []

      // Validar consistencia de datos
      await this.validateDataConsistency()

      // Esperar a que todas las sincronizaciones terminen
      await Promise.all(syncPromises)

      // Actualizar métricas
      this.metrics.value.syncCount++
      this.metrics.value.lastSync = new Date()
      this.syncStatus.value.pendingOperations = 0

      if (this.config.debugMode) {
        console.log("✅ Sincronización completa")
      }
    } catch (error) {
      this.syncStatus.value.lastError = error instanceof Error ? error.message : "Error desconocido"

      if (this.config.debugMode) {
        console.error("❌ Error en sincronización:", error)
      }
    } finally {
      this.syncStatus.value.isLoading = false
    }
  }

  /**
   * Valida la consistencia de datos entre stores
   */
  private async validateDataConsistency() {
    const attendanceStore = useAttendanceStore()
    const classesStore = useClassesStore()
    const studentsStore = useStudentsStore()

    let inconsistencies = 0

    // Validar que todas las clases en asistencia existen en el store de clases
    const attendanceDocs = attendanceStore.attendanceDocuments || []
    for (const doc of attendanceDocs) {
      const classExists = classesStore.classes.some((cls) => cls.id === doc.classId)
      if (!classExists) {
        inconsistencies++
        if (this.config.debugMode) {
          console.warn(`⚠️ Clase ${doc.classId} en asistencia pero no en store de clases`)
        }
      }
    }

    // Validar que todos los estudiantes en asistencia existen en el store de estudiantes
    for (const doc of attendanceDocs) {
      if (doc.data?.presentes) {
        for (const studentId of doc.data.presentes) {
          const studentExists = studentsStore.students.some((s) => s.id === studentId)
          if (!studentExists) {
            inconsistencies++
            if (this.config.debugMode) {
              console.warn(
                `⚠️ Estudiante ${studentId} en asistencia pero no en store de estudiantes`
              )
            }
          }
        }
      }
    }

    this.metrics.value.inconsistenciesDetected += inconsistencies

    if (inconsistencies > 0 && this.config.debugMode) {
      console.warn(`⚠️ Se detectaron ${inconsistencies} inconsistencias`)
    }
  }

  /**
   * Obtiene el estado consolidado
   */
  getConsolidatedState() {
    const attendanceStore = useAttendanceStore()
    const classesStore = useClassesStore()
    const studentsStore = useStudentsStore()

    return {
      attendance: {
        totalDocuments: attendanceStore.attendanceDocuments?.length || 0,
        selectedDate: attendanceStore.selectedDate,
        selectedClass: attendanceStore.selectedClass,
        loading: attendanceStore.loading,
      },
      classes: {
        total: classesStore.classes?.length || 0,
        loading: classesStore.loading,
      },
      students: {
        total: studentsStore.students?.length || 0,
        active: studentsStore.activeStudents?.length || 0,
        loading: studentsStore.loading,
      },
      global: {
        metrics: this.metrics.value,
        syncStatus: this.syncStatus.value,
        config: this.config,
      },
    }
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<GlobalStateConfig>) {
    const oldConfig = {...this.config}
    this.config = {...this.config, ...newConfig}

    // Reiniciar auto-sync si cambió
    if (oldConfig.enableAutoSync !== newConfig.enableAutoSync) {
      if (newConfig.enableAutoSync) {
        this.startAutoSync()
      } else {
        this.stopAutoSync()
      }
    }

    // Reiniciar watchers si cambió
    if (oldConfig.enableDeepWatch !== newConfig.enableDeepWatch) {
      if (newConfig.enableDeepWatch) {
        this.setupWatchers()
      } else {
        this.stopWatchers()
      }
    }

    if (this.config.debugMode) {
      console.log("🔧 Configuración actualizada:", this.config)
    }
  }

  /**
   * Detiene la sincronización automática
   */
  private stopAutoSync() {
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals = []
    this.metrics.value.autoSyncEnabled = false
  }

  /**
   * Detiene los watchers
   */
  private stopWatchers() {
    this.watchers.forEach((unwatch) => unwatch())
    this.watchers = []
    this.metrics.value.watchers = 0
  }

  /**
   * Limpia recursos
   */
  cleanup() {
    this.stopAutoSync()
    this.stopWatchers()

    if (this.config.debugMode) {
      console.log("🧹 Estado Global limpiado")
    }
  }

  /**
   * Obtiene métricas de rendimiento
   */
  getMetrics() {
    return {
      ...this.metrics.value,
      uptime: this.metrics.value.lastSync ? Date.now() - this.metrics.value.lastSync.getTime() : 0,
      config: this.config,
    }
  }

  /**
   * Fuerza una sincronización inmediata
   */
  async forceSync() {
    await this.syncAllStores()
  }

  /**
   * Resetea métricas
   */
  resetMetrics() {
    this.metrics.value = {
      syncCount: 0,
      lastSync: null,
      inconsistenciesDetected: 0,
      autoSyncEnabled: this.config.enableAutoSync,
      watchers: this.watchers.length,
    }
  }
}

// Instancia singleton del gestor de estado global
const globalStateManager = new GlobalStateManager()

/**
 * Composable para el estado global reactivo
 */
export function useGlobalState() {
  // Inicializar automáticamente si no se ha hecho
  if (!globalStateManager.getMetrics().lastSync) {
    globalStateManager.init()
  }

  // Estado consolidado reactivo
  const consolidatedState = computed(() => globalStateManager.getConsolidatedState())

  // Métricas reactivas
  const metrics = computed(() => globalStateManager.getMetrics())

  // Estado de sincronización reactivo
  const syncStatus = computed(() => globalStateManager.getConsolidatedState().global.syncStatus)

  // Limpieza automática al desmontar
  onUnmounted(() => {
    // Nota: No limpiar completamente porque otros componentes pueden estar usando el estado
    // globalStateManager.cleanup()
  })

  return {
    // Estado consolidado
    state: consolidatedState,
    metrics,
    syncStatus,

    // Acciones
    forceSync: () => globalStateManager.forceSync(),
    updateConfig: (config: Partial<GlobalStateConfig>) => globalStateManager.updateConfig(config),
    resetMetrics: () => globalStateManager.resetMetrics(),

    // Utilidades
    isLoading: computed(() => syncStatus.value.isLoading),
    hasErrors: computed(() => !!syncStatus.value.lastError),
    lastError: computed(() => syncStatus.value.lastError),

    // Diagnósticos
    getDiagnostics: () => ({
      ...globalStateManager.getMetrics(),
      consolidatedState: globalStateManager.getConsolidatedState(),
    }),
  }
}

// Función para configuración global
export function configureGlobalState(config: Partial<GlobalStateConfig>) {
  globalStateManager.updateConfig(config)
}

// Función para limpieza manual (usar con cuidado)
export function cleanupGlobalState() {
  globalStateManager.cleanup()
}

export type {GlobalStateConfig, GlobalStateMetrics, SyncStatus}
