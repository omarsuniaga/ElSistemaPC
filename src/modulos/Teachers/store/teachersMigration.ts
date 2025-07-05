/**
 * Servicio de Migración de Stores de Maestros
 * Facilita la transición gradual desde los stores duplicados hacia un store unificado
 */

import {computed} from "vue"

// Importar los stores existentes
import {useTeachersStore as useOriginalTeachersStore} from "../store/teachers"
import {useAdminTeachersStore as useOriginalAdminTeachersStore} from "../../Admin/store/teachers"

/**
 * Configuración de migración
 */
interface MigrationConfig {
  preferAdminStore: boolean
  enableCompatibilityMode: boolean
  logOperations: boolean
}

class TeacherStoreMigrationService {
  private config: MigrationConfig = {
    preferAdminStore: false,
    enableCompatibilityMode: true,
    logOperations: false,
  }

  /**
   * Obtiene el store principal según configuración
   */
  getPrimaryStore() {
    if (this.config.preferAdminStore) {
      return useOriginalAdminTeachersStore()
    }
    return useOriginalTeachersStore()
  }

  /**
   * Obtiene el store secundario
   */
  getSecondaryStore() {
    if (this.config.preferAdminStore) {
      return useOriginalTeachersStore()
    }
    return useOriginalAdminTeachersStore()
  }

  /**
   * Sincroniza datos entre stores
   */
  async syncStores() {
    try {
      const primaryStore = this.getPrimaryStore()

      // Fetch data from primary store
      await primaryStore.fetchTeachers()

      if (this.config.logOperations) {
        console.log("✅ Stores sincronizados")
      }
    } catch (error) {
      console.error("Error sincronizando stores:", error)
    }
  }

  /**
   * Obtiene métricas de uso de ambos stores
   */
  getUsageMetrics() {
    return {
      primaryStoreType: this.config.preferAdminStore ? "admin" : "standard",
      compatibilityMode: this.config.enableCompatibilityMode,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Actualiza configuración de migración
   */
  updateConfig(newConfig: Partial<MigrationConfig>) {
    this.config = {...this.config, ...newConfig}

    if (this.config.logOperations) {
      console.log("🔧 Configuración de migración actualizada:", this.config)
    }
  }
}

// Instancia singleton del servicio de migración
const migrationService = new TeacherStoreMigrationService()

/**
 * Store proxy que unifica el acceso a los stores de maestros
 */
export function useUnifiedTeachersStore() {
  const primaryStore = migrationService.getPrimaryStore()

  // Estado reactivo que combina ambos stores
  const combinedTeachers = computed(() => {
    try {
      return primaryStore.teachers || []
    } catch (error) {
      console.error("Error accediendo al store de maestros:", error)
      return []
    }
  })

  // Proxy de métodos principales
  const fetchTeachers = async () => {
    try {
      await primaryStore.fetchTeachers()
      await migrationService.syncStores()
    } catch (error) {
      console.error("Error fetching teachers:", error)
      throw error
    }
  }

  const addTeacher = async (teacherData: any) => {
    try {
      const result = await primaryStore.addTeacher(teacherData)
      await migrationService.syncStores()
      return result
    } catch (error) {
      console.error("Error adding teacher:", error)
      throw error
    }
  }

  const updateTeacher = async (id: string, updates: any) => {
    try {
      const result = await primaryStore.updateTeacher(id, updates)
      await migrationService.syncStores()
      return result
    } catch (error) {
      console.error("Error updating teacher:", error)
      throw error
    }
  }

  const deleteTeacher = async (id: string) => {
    try {
      const result = await primaryStore.deleteTeacher(id)
      await migrationService.syncStores()
      return result
    } catch (error) {
      console.error("Error deleting teacher:", error)
      throw error
    }
  }

  // Getters compatibles
  const teachers = computed(() => combinedTeachers.value)
  const items = computed(() => combinedTeachers.value)
  const activeTeachers = computed(() =>
    combinedTeachers.value.filter(
      (teacher: any) => teacher.status === "activo" || teacher.status === "active"
    )
  )

  const loading = computed(() => primaryStore.loading)
  const error = computed(() => primaryStore.error)

  const getTeacherById = (id: string) => {
    return combinedTeachers.value.find((teacher: any) => teacher.id === id)
  }

  const getTeacherByName = (name: string) => {
    return combinedTeachers.value.find((teacher: any) =>
      (teacher.name || "").toLowerCase().includes(name.toLowerCase())
    )
  }

  // Funciones de configuración y diagnóstico
  const getMigrationInfo = () => migrationService.getUsageMetrics()

  const configureMigration = (config: Partial<MigrationConfig>) => {
    migrationService.updateConfig(config)
  }

  // Funciones de compatibilidad
  const fetchItems = fetchTeachers
  const addItem = addTeacher
  const updateItem = updateTeacher
  const deleteItem = deleteTeacher

  return {
    // Estado
    teachers,
    items,
    activeTeachers,
    loading,
    error,

    // Getters
    getTeacherById,
    getTeacherByName,

    // Acciones
    fetchTeachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,

    // Compatibilidad
    fetchItems,
    addItem,
    updateItem,
    deleteItem,

    // Migración
    getMigrationInfo,
    configureMigration,
    syncStores: () => migrationService.syncStores(),
  }
}

// Alias para migración gradual
export const useTeachersStore = useUnifiedTeachersStore
export const useAdminTeachersStore = useUnifiedTeachersStore

export {migrationService}

export type {MigrationConfig}
