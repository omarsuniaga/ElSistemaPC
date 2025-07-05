/**
 * 🎯 SERVICIO CENTRAL DE OPERACIONES OFFLINE
 * Integra Service Worker, IndexedDB y estado de sincronización
 * Fase 1 - Iniciativa 4: Integración Completa PWA
 */

import {ref, computed, watch} from "vue"
import {useOfflineDB, type MusicAcademyDB} from "@/composables/data/useOfflineDB"
import {useGlobalOfflineSync} from "@/composables/sync/useOfflineSync"
import {useNotifications} from "@/composables/ui/useNotifications"

// ==================== TIPOS ====================

interface OfflineOperation {
  id: string
  type: "attendance" | "teachers" | "observations"
  operation: "create" | "update" | "delete"
  data: any
  timestamp: number
  synced: boolean
}

interface SyncStats {
  total: number
  pending: number
  synced: number
  errors: number
}

// ==================== COMPOSABLE PRINCIPAL ====================

export function useOfflineService() {
  // Composables
  const offlineDB = useOfflineDB()
  const offlineSync = useGlobalOfflineSync()
  
  // Lazy initialization of notifications to avoid Pinia dependency issues
  let notifications: ReturnType<typeof useNotifications> | null = null
  const getNotifications = () => {
    if (!notifications) {
      try {
        notifications = useNotifications()
      } catch (error) {
        console.debug("🔔 Notifications not available yet:", error)
        return {showNotification: () => ""}
      }
    }
    return notifications
  }

  // Estado
  const isInitialized = ref(false)
  const isOnline = computed(() => offlineSync.isOnline)
  const syncStats = ref<SyncStats>({
    total: 0,
    pending: 0,
    synced: 0,
    errors: 0,
  })

  // ==================== INICIALIZACIÓN ====================

  async function initialize() {
    if (isInitialized.value) return

    try {
      // Inicializar base de datos offline
      await offlineDB.initialize()

      // Actualizar estadísticas iniciales
      await updateSyncStats()

      // Configurar watchers
      setupWatchers()

      isInitialized.value = true
      console.log("✅ Servicio offline inicializado")

      // Notificar si hay operaciones pendientes
      if (syncStats.value.pending > 0) {
        getNotifications().showNotification(
          `Hay ${syncStats.value.pending} operaciones pendientes de sincronización`,
          "info"
        )
      }
    } catch (error) {
      console.error("❌ Error inicializando servicio offline:", error)
      throw error
    }
  }

  function setupWatchers() {
    // Auto-sincronizar cuando se restaure la conexión
    watch(isOnline, async (online) => {
      if (online && syncStats.value.pending > 0) {
        console.log("🌐 Conexión restaurada - Iniciando auto-sincronización")
        await syncPendingOperations()
      }
    })

    // Actualizar estadísticas cuando cambien las operaciones pendientes
    watch(() => offlineSync.pendingOperations, updateSyncStats)
  }

  // ==================== OPERACIONES DE ASISTENCIA ====================

  async function saveAttendanceOffline(attendanceData: {
    id?: string
    studentId: string
    classId: string
    date: string
    status: "present" | "absent" | "late"
  }) {
    const db = offlineDB.getDatabase()
    if (!db) throw new Error("Base de datos no inicializada")

    const id =
      attendanceData.id || `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const attendance = {
      id,
      studentId: attendanceData.studentId,
      classId: attendanceData.classId,
      date: attendanceData.date,
      status: attendanceData.status,
      synced: isOnline.value, // Solo marcar como sincronizado si estamos online
    }

    await db.saveAttendance(attendance)
    await updateSyncStats()

    console.log(`📝 Asistencia guardada offline: ${id}`)

    if (!isOnline.value) {
      getNotifications().showNotification("Asistencia guardada offline. Se sincronizará cuando haya conexión.", "info")
    }

    return attendance
  }

  async function getAttendanceOffline(filters?: {
    studentId?: string
    classId?: string
    date?: string
  }) {
    const db = offlineDB.getDatabase()
    if (!db) return []

    if (filters?.studentId) {
      return await db.getAttendanceByStudent(filters.studentId)
    }
    if (filters?.classId) {
      return await db.getAttendanceByClass(filters.classId)
    }
    if (filters?.date) {
      return await db.getAttendanceByDate(filters.date)
    }

    // Si no hay filtros, devolver datos no sincronizados
    return await db.getUnsyncedAttendance()
  }

  // ==================== OPERACIONES DE PROFESORES ====================

  async function saveTeacherOffline(teacherData: {
    id?: string
    name: string
    email: string
    phone: string
    subjects: string[]
    isActive?: boolean
  }) {
    const db = offlineDB.getDatabase()
    if (!db) throw new Error("Base de datos no inicializada")

    const id = teacherData.id || `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const teacher = {
      id,
      name: teacherData.name,
      email: teacherData.email,
      phone: teacherData.phone,
      subjects: teacherData.subjects,
      isActive: teacherData.isActive ?? true,
      synced: isOnline.value,
    }

    await db.saveTeacher(teacher)
    await updateSyncStats()

    console.log(`👨‍🏫 Profesor guardado offline: ${id}`)

    if (!isOnline.value) {
      getNotifications().showNotification("Profesor guardado offline. Se sincronizará cuando haya conexión.", "info")
    }

    return teacher
  }

  async function getTeachersOffline(activeOnly = false) {
    const db = offlineDB.getDatabase()
    if (!db) return []

    if (activeOnly) {
      return await db.getActiveTeachers()
    }
    return await db.getAllTeachers()
  }

  // ==================== OPERACIONES DE OBSERVACIONES ====================

  async function saveObservationOffline(observationData: {
    id?: string
    studentId: string
    teacherId: string
    classId: string
    content: string
    type: "positive" | "negative" | "neutral"
    date: string
  }) {
    const db = offlineDB.getDatabase()
    if (!db) throw new Error("Base de datos no inicializada")

    const id =
      observationData.id || `observation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const observation = {
      id,
      studentId: observationData.studentId,
      teacherId: observationData.teacherId,
      classId: observationData.classId,
      content: observationData.content,
      type: observationData.type,
      date: observationData.date,
      synced: isOnline.value,
    }

    await db.saveObservation(observation)
    await updateSyncStats()

    console.log(`📋 Observación guardada offline: ${id}`)

    if (!isOnline.value) {
      getNotifications().showNotification(
        "Observación guardada offline. Se sincronizará cuando haya conexión.",
        "info"
      )
    }

    return observation
  }

  async function getObservationsOffline(filters?: {studentId?: string; teacherId?: string}) {
    const db = offlineDB.getDatabase()
    if (!db) return []

    if (filters?.studentId) {
      return await db.getObservationsByStudent(filters.studentId)
    }
    if (filters?.teacherId) {
      return await db.getObservationsByTeacher(filters.teacherId)
    }

    return await db.getUnsyncedObservations()
  }

  // ==================== SINCRONIZACIÓN ====================

  async function syncPendingOperations(): Promise<boolean> {
    if (!isOnline.value) {
      console.log("⚠️ No hay conexión - Sincronización cancelada")
      return false
    }

    try {
      // Verificar que la base de datos esté inicializada
      if (!offlineDB.isInitialized.value) {
        console.log("📋 Inicializando base de datos antes de sincronizar...")
        await offlineDB.initialize()
      }

      const db = offlineDB.getDatabase()
      if (!db) throw new Error("No se pudo inicializar la base de datos")

      console.log("🔄 Iniciando sincronización de operaciones pendientes...")

      // Obtener operaciones pendientes
      const [unsyncedAttendance, unsyncedTeachers, unsyncedObservations] = await Promise.all([
        db.getUnsyncedAttendance(),
        db.getUnsyncedTeachers(),
        db.getUnsyncedObservations(),
      ])

      let syncedCount = 0
      let errorCount = 0

      // Sincronizar asistencias
      for (const attendance of unsyncedAttendance) {
        try {
          await syncAttendanceToFirebase(attendance)
          await db.markAttendanceAsSynced(attendance.id)
          syncedCount++
        } catch (error) {
          console.error(`Error sincronizando asistencia ${attendance.id}:`, error)
          errorCount++
        }
      }

      // Sincronizar profesores
      for (const teacher of unsyncedTeachers) {
        try {
          await syncTeacherToFirebase(teacher)
          await db.markTeacherAsSynced(teacher.id)
          syncedCount++
        } catch (error) {
          console.error(`Error sincronizando profesor ${teacher.id}:`, error)
          errorCount++
        }
      }

      // Sincronizar observaciones
      for (const observation of unsyncedObservations) {
        try {
          await syncObservationToFirebase(observation)
          await db.markObservationAsSynced(observation.id)
          syncedCount++
        } catch (error) {
          console.error(`Error sincronizando observación ${observation.id}:`, error)
          errorCount++
        }
      }

      await updateSyncStats()

      if (syncedCount > 0) {
        getNotifications().showNotification(`✅ ${syncedCount} operaciones sincronizadas exitosamente`, "success")
      }

      if (errorCount > 0) {
        getNotifications().showNotification(`⚠️ ${errorCount} operaciones con errores de sincronización`, "warning")
      }

      console.log(`✅ Sincronización completada: ${syncedCount} exitosas, ${errorCount} errores`)
      return errorCount === 0
    } catch (error) {
      console.error("❌ Error en sincronización:", error)
      getNotifications().showNotification("Error durante la sincronización", "error")
      return false
    }
  }

  // ==================== FUNCIONES DE SINCRONIZACIÓN CON FIREBASE ====================

  async function syncAttendanceToFirebase(attendance: MusicAcademyDB["attendance"]["value"]) {
    // Esta función se conectará con el servicio Firebase real
    // Por ahora es un placeholder que simula la operación
    console.log("🔄 Sincronizando asistencia con Firebase:", attendance.id)

    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Aquí iría la lógica real de Firebase
    // await attendanceService.save(attendance)
  }

  async function syncTeacherToFirebase(teacher: MusicAcademyDB["teachers"]["value"]) {
    console.log("🔄 Sincronizando profesor con Firebase:", teacher.id)
    await new Promise((resolve) => setTimeout(resolve, 500))
    // await teacherService.save(teacher)
  }

  async function syncObservationToFirebase(observation: MusicAcademyDB["observations"]["value"]) {
    console.log("🔄 Sincronizando observación con Firebase:", observation.id)
    await new Promise((resolve) => setTimeout(resolve, 500))
    // await observationService.save(observation)
  }

  // ==================== ESTADÍSTICAS Y UTILIDADES ====================

  async function updateSyncStats() {
    try {
      const storageInfo = await offlineDB.updateStorageInfo()

      // Calcular estadísticas de sincronización
      const db = offlineDB.getDatabase()
      if (!db) return

      const [unsyncedAttendance, unsyncedTeachers, unsyncedObservations] = await Promise.all([
        db.getUnsyncedAttendance(),
        db.getUnsyncedTeachers(),
        db.getUnsyncedObservations(),
      ])

      const pending =
        unsyncedAttendance.length + unsyncedTeachers.length + unsyncedObservations.length
      const total = offlineDB.storageInfo.value.totalSize
      const synced = total - pending

      syncStats.value = {
        total,
        pending,
        synced,
        errors: offlineSync.syncErrors.value.length,
      }
    } catch (error) {
      console.error("Error actualizando estadísticas:", error)
    }
  }

  async function clearAllOfflineData() {
    try {
      await offlineDB.clearAllData()
      await updateSyncStats()
      getNotifications().showNotification("Todos los datos offline han sido eliminados", "info")
    } catch (error) {
      console.error("Error limpiando datos offline:", error)
      getNotifications().showNotification("Error al limpiar datos offline", "error")
    }
  }

  async function getDetailedStorageInfo() {
    return {
      ...offlineDB.storageInfo.value,
      syncStats: syncStats.value,
      isOnline: isOnline.value,
      lastSync: offlineSync.lastSyncTime,
    }
  }

  // ==================== RETURN ====================

  return {
    // Estado
    isInitialized,
    isOnline,
    syncStats,
    storageInfo: computed(() => offlineDB.storageInfo.value),

    // Inicialización
    initialize,

    // Operaciones de datos
    saveAttendanceOffline,
    getAttendanceOffline,
    saveTeacherOffline,
    getTeachersOffline,
    saveObservationOffline,
    getObservationsOffline,

    // Sincronización
    syncPendingOperations,

    // Utilidades
    updateSyncStats,
    clearAllOfflineData,
    getDetailedStorageInfo,
  }
}

// ==================== STORE PINIA ====================

import {defineStore} from "pinia"

export const useOfflineStore = defineStore("offline", () => {
  const offlineService = useOfflineService()

  return {
    ...offlineService,

    // Métodos adicionales específicos del store
    async autoInitialize() {
      if (!offlineService.isInitialized.value) {
        await offlineService.initialize()
      }
    },

    async handleAppOffline() {
      console.log("📱 App en modo offline - Activando persistencia local")
      // Lógica adicional para manejo offline
    },

    async handleAppOnline() {
      console.log("🌐 App online - Iniciando sincronización automática")
      await offlineService.syncPendingOperations()
    },
  }
})
