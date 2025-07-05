/**
 * 💾 SISTEMA DE PERSISTENCIA LOCAL
 * Manejo de IndexedDB para datos offline
 * Fase 1 - Iniciativa 3: Almacenamiento Local Avanzado
 */

import {openDB, type DBSchema, type IDBPDatabase} from "idb"

// ==================== ESQUEMA DE BASE DE DATOS ====================

interface MusicAcademyDB extends DBSchema {
  attendance: {
    key: string
    value: {
      id: string
      studentId: string
      classId: string
      date: string
      status: "present" | "absent" | "late"
      timestamp: number
      synced: boolean
      lastModified: number
    }
    indexes: {
      "by-student": string
      "by-class": string
      "by-date": string
      "by-synced": number // Usar número: 0=false, 1=true para IndexedDB
    }
  }

  teachers: {
    key: string
    value: {
      id: string
      name: string
      email: string
      phone: string
      subjects: string[]
      isActive: boolean
      timestamp: number
      synced: boolean
      lastModified: number
    }
    indexes: {
      "by-active": number // Usar número: 0=false, 1=true para IndexedDB
      "by-synced": number // Usar número: 0=false, 1=true para IndexedDB
    }
  }

  observations: {
    key: string
    value: {
      id: string
      studentId: string
      teacherId: string
      classId: string
      content: string
      type: "positive" | "negative" | "neutral"
      date: string
      timestamp: number
      synced: boolean
      lastModified: number
    }
    indexes: {
      "by-student": string
      "by-teacher": string
      "by-class": string
      "by-type": string
      "by-synced": boolean
    }
  }

  syncQueue: {
    key: string
    value: {
      id: string
      type: "attendance" | "teachers" | "observations"
      operation: "create" | "update" | "delete"
      data: any
      timestamp: number
      retries: number
      lastError?: string
    }
    indexes: {
      "by-type": string
      "by-timestamp": number
    }
  }

  appSettings: {
    key: string
    value: {
      key: string
      value: any
      timestamp: number
    }
  }
}

// ==================== CLASE PRINCIPAL DE BASE DE DATOS ====================

class OfflineDatabase {
  private db: IDBPDatabase<MusicAcademyDB> | null = null
  private readonly version = 1
  private readonly dbName = "MusicAcademyOfflineDB"

  /**
   * Inicializa la base de datos
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDB<MusicAcademyDB>(this.dbName, this.version, {
        upgrade(db) {
          // Store de asistencias
          if (!db.objectStoreNames.contains("attendance")) {
            const attendanceStore = db.createObjectStore("attendance", {keyPath: "id"})
            attendanceStore.createIndex("by-student", "studentId", {unique: false})
            attendanceStore.createIndex("by-class", "classId", {unique: false})
            attendanceStore.createIndex("by-date", "date", {unique: false})
            attendanceStore.createIndex("by-synced", "synced", {unique: false})
          }

          // Store de profesores
          if (!db.objectStoreNames.contains("teachers")) {
            const teachersStore = db.createObjectStore("teachers", {keyPath: "id"})
            teachersStore.createIndex("by-active", "isActive", {unique: false})
            teachersStore.createIndex("by-synced", "synced", {unique: false})
          }

          // Store de observaciones
          if (!db.objectStoreNames.contains("observations")) {
            const observationsStore = db.createObjectStore("observations", {keyPath: "id"})
            observationsStore.createIndex("by-student", "studentId", {unique: false})
            observationsStore.createIndex("by-teacher", "teacherId", {unique: false})
            observationsStore.createIndex("by-class", "classId", {unique: false})
            observationsStore.createIndex("by-type", "type", {unique: false})
            observationsStore.createIndex("by-synced", "synced", {unique: false})
          }

          // Store de cola de sincronización
          if (!db.objectStoreNames.contains("syncQueue")) {
            const syncStore = db.createObjectStore("syncQueue", {keyPath: "id"})
            syncStore.createIndex("by-type", "type", {unique: false})
            syncStore.createIndex("by-timestamp", "timestamp", {unique: false})
          }

          // Store de configuraciones
          if (!db.objectStoreNames.contains("appSettings")) {
            db.createObjectStore("appSettings", {keyPath: "key"})
          }
        },
      })

      console.log("✅ Base de datos offline inicializada")
    } catch (error) {
      console.error("❌ Error inicializando base de datos offline:", error)
      throw error
    }
  }

  /**
   * Verifica si la base de datos está lista
   */
  private ensureDatabase(): IDBPDatabase<MusicAcademyDB> {
    if (!this.db) {
      throw new Error("Base de datos no inicializada. Ejecuta initialize() primero.")
    }
    return this.db
  }

  /**
   * Obtiene la instancia de la base de datos
   * La inicializa si no está disponible
   */
  async getDatabase(): Promise<IDBPDatabase<MusicAcademyDB> | null> {
    if (!this.db) {
      try {
        await this.initialize()
      } catch (error) {
        console.error("Error inicializando base de datos:", error)
        return null
      }
    }
    return this.db
  }

  /**
   * Verifica si la base de datos está inicializada
   */
  isInitialized(): boolean {
    return this.db !== null
  }

  // ==================== OPERACIONES DE ASISTENCIA ====================

  async saveAttendance(
    attendance: Omit<MusicAcademyDB["attendance"]["value"], "timestamp" | "lastModified">
  ): Promise<void> {
    const db = this.ensureDatabase()
    const now = Date.now()

    const record: MusicAcademyDB["attendance"]["value"] = {
      ...attendance,
      timestamp: now,
      lastModified: now,
    }

    await db.put("attendance", record)

    // Agregar a cola de sincronización si no está sincronizado
    if (!attendance.synced) {
      await this.addToSyncQueue("attendance", "create", record)
    }
  }

  async getAttendanceByStudent(
    studentId: string
  ): Promise<MusicAcademyDB["attendance"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAllFromIndex("attendance", "by-student", studentId)
  }

  async getAttendanceByClass(classId: string): Promise<MusicAcademyDB["attendance"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAllFromIndex("attendance", "by-class", classId)
  }

  async getAttendanceByDate(date: string): Promise<MusicAcademyDB["attendance"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAllFromIndex("attendance", "by-date", date)
  }

  async getUnsyncedAttendance(): Promise<MusicAcademyDB["attendance"]["value"][]> {
    const db = this.ensureDatabase()
    // Usar 0 para false en IndexedDB (boolean keys no son válidos)
    return await db.getAllFromIndex("attendance", "by-synced", 0)
  }

  async markAttendanceAsSynced(id: string): Promise<void> {
    const db = this.ensureDatabase()
    const record = await db.get("attendance", id)
    if (record) {
      record.synced = true
      record.lastModified = Date.now()
      await db.put("attendance", record)
    }
  }

  // ==================== OPERACIONES DE PROFESORES ====================

  async saveTeacher(
    teacher: Omit<MusicAcademyDB["teachers"]["value"], "timestamp" | "lastModified">
  ): Promise<void> {
    const db = this.ensureDatabase()
    const now = Date.now()

    const record: MusicAcademyDB["teachers"]["value"] = {
      ...teacher,
      timestamp: now,
      lastModified: now,
    }

    await db.put("teachers", record)

    if (!teacher.synced) {
      await this.addToSyncQueue("teachers", "create", record)
    }
  }

  async getAllTeachers(): Promise<MusicAcademyDB["teachers"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAll("teachers")
  }

  async getActiveTeachers(): Promise<MusicAcademyDB["teachers"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAllFromIndex("teachers", "by-active", true)
  }

  async getUnsyncedTeachers(): Promise<MusicAcademyDB["teachers"]["value"][]> {
    const db = this.ensureDatabase()
    // Usar 0 para false en IndexedDB (boolean keys no son válidos)
    return await db.getAllFromIndex("teachers", "by-synced", 0)
  }

  async markTeacherAsSynced(id: string): Promise<void> {
    const db = this.ensureDatabase()
    const record = await db.get("teachers", id)
    if (record) {
      record.synced = true
      record.lastModified = Date.now()
      await db.put("teachers", record)
    }
  }

  // ==================== OPERACIONES DE OBSERVACIONES ====================

  async saveObservation(
    observation: Omit<MusicAcademyDB["observations"]["value"], "timestamp" | "lastModified">
  ): Promise<void> {
    const db = this.ensureDatabase()
    const now = Date.now()

    const record: MusicAcademyDB["observations"]["value"] = {
      ...observation,
      timestamp: now,
      lastModified: now,
    }

    await db.put("observations", record)

    if (!observation.synced) {
      await this.addToSyncQueue("observations", "create", record)
    }
  }

  async getObservationsByStudent(
    studentId: string
  ): Promise<MusicAcademyDB["observations"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAllFromIndex("observations", "by-student", studentId)
  }

  async getObservationsByTeacher(
    teacherId: string
  ): Promise<MusicAcademyDB["observations"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAllFromIndex("observations", "by-teacher", teacherId)
  }

  async getUnsyncedObservations(): Promise<MusicAcademyDB["observations"]["value"][]> {
    const db = this.ensureDatabase()
    // Usar 0 para false en IndexedDB (boolean keys no son válidos)
    return await db.getAllFromIndex("observations", "by-synced", 0)
  }

  async markObservationAsSynced(id: string): Promise<void> {
    const db = this.ensureDatabase()
    const record = await db.get("observations", id)
    if (record) {
      record.synced = true
      record.lastModified = Date.now()
      await db.put("observations", record)
    }
  }

  // ==================== COLA DE SINCRONIZACIÓN ====================

  async addToSyncQueue(
    type: "attendance" | "teachers" | "observations",
    operation: "create" | "update" | "delete",
    data: any
  ): Promise<void> {
    const db = this.ensureDatabase()

    const queueItem: MusicAcademyDB["syncQueue"]["value"] = {
      id: `${type}_${operation}_${data.id || Date.now()}`,
      type,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
    }

    await db.put("syncQueue", queueItem)
  }

  async getSyncQueue(): Promise<MusicAcademyDB["syncQueue"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAll("syncQueue")
  }

  async getSyncQueueByType(
    type: "attendance" | "teachers" | "observations"
  ): Promise<MusicAcademyDB["syncQueue"]["value"][]> {
    const db = this.ensureDatabase()
    return await db.getAllFromIndex("syncQueue", "by-type", type)
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = this.ensureDatabase()
    await db.delete("syncQueue", id)
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<MusicAcademyDB["syncQueue"]["value"]>
  ): Promise<void> {
    const db = this.ensureDatabase()
    const item = await db.get("syncQueue", id)
    if (item) {
      const updatedItem = {...item, ...updates}
      await db.put("syncQueue", updatedItem)
    }
  }

  async clearSyncQueue(): Promise<void> {
    const db = this.ensureDatabase()
    await db.clear("syncQueue")
  }

  // ==================== CONFIGURACIONES ====================

  async setSetting(key: string, value: any): Promise<void> {
    const db = this.ensureDatabase()

    const setting: MusicAcademyDB["appSettings"]["value"] = {
      key,
      value,
      timestamp: Date.now(),
    }

    await db.put("appSettings", setting)
  }

  async getSetting(key: string): Promise<any> {
    const db = this.ensureDatabase()
    const setting = await db.get("appSettings", key)
    return setting?.value
  }

  async deleteSetting(key: string): Promise<void> {
    const db = this.ensureDatabase()
    await db.delete("appSettings", key)
  }

  // ==================== UTILIDADES ====================

  async getStorageInfo(): Promise<{
    attendance: number
    teachers: number
    observations: number
    syncQueue: number
    totalSize: number
  }> {
    const db = this.ensureDatabase()

    const [attendance, teachers, observations, syncQueue] = await Promise.all([
      db.count("attendance"),
      db.count("teachers"),
      db.count("observations"),
      db.count("syncQueue"),
    ])

    return {
      attendance,
      teachers,
      observations,
      syncQueue,
      totalSize: attendance + teachers + observations + syncQueue,
    }
  }

  async clearAllData(): Promise<void> {
    const db = this.ensureDatabase()

    await Promise.all([
      db.clear("attendance"),
      db.clear("teachers"),
      db.clear("observations"),
      db.clear("syncQueue"),
      db.clear("appSettings"),
    ])

    console.log("🗑️ Todos los datos offline han sido eliminados")
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// ==================== INSTANCIA SINGLETON ====================

let dbInstance: OfflineDatabase | null = null

export async function getOfflineDB(): Promise<OfflineDatabase> {
  if (!dbInstance) {
    dbInstance = new OfflineDatabase()
    await dbInstance.initialize()
  }
  return dbInstance
}

// ==================== COMPOSABLE PARA VUE ====================

import {ref, computed} from "vue"

export function useOfflineDB() {
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const storageInfo = ref({
    attendance: 0,
    teachers: 0,
    observations: 0,
    syncQueue: 0,
    totalSize: 0,
  })

  let db: OfflineDatabase | null = null

  const totalRecords = computed(() => storageInfo.value.totalSize)
  const hasData = computed(() => totalRecords.value > 0)
  const pendingSync = computed(() => storageInfo.value.syncQueue)

  async function initialize() {
    if (isInitialized.value) return db

    isLoading.value = true
    error.value = null

    try {
      db = await getOfflineDB()
      isInitialized.value = true
      await updateStorageInfo()
      console.log("✅ Composable de base de datos offline inicializado")
      return db
    } catch (err: any) {
      error.value = err.message
      console.error("❌ Error inicializando composable de base de datos:", err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateStorageInfo() {
    if (!db) return

    try {
      const info = await db.getStorageInfo()
      storageInfo.value = info
    } catch (err) {
      console.error("Error actualizando información de almacenamiento:", err)
    }
  }

  async function clearAllData() {
    if (!db) return

    try {
      await db.clearAllData()
      await updateStorageInfo()
    } catch (err) {
      console.error("Error limpiando datos:", err)
      throw err
    }
  }

  return {
    // Estado
    isInitialized,
    isLoading,
    error,
    storageInfo,

    // Computed
    totalRecords,
    hasData,
    pendingSync,

    // Métodos
    initialize,
    updateStorageInfo,
    clearAllData,

    // Acceso directo a la base de datos
    getDatabase: () => db,
  }
}

// ==================== EXPORTACIONES TIPO ====================

export type {MusicAcademyDB}
export {OfflineDatabase}
