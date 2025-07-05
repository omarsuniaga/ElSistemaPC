/**
 * Proxy Unificado para Stores de Maestros
 * Solución pragmática para consolidar stores duplicados
 *
 * Este proxy detecta automáticamente el contexto y redirige a la implementación
 * apropiada, proporcionando una API unificada sin romper código existente.
 */

import {computed, ref} from "vue"
import {useRoute} from "vue-router"

// Detectar el contexto basado en la ruta y otros factores
function detectContext() {
  try {
    const route = useRoute()
    const path = route?.path || ""

    // Contexto administrativo
    if (path.includes("/admin") || path.includes("/director")) {
      return "admin"
    }

    // Contexto de maestro
    if (path.includes("/teacher") || path.includes("/maestro")) {
      return "teacher"
    }

    // Default basado en otros indicadores
    return "default"
  } catch {
    return "default"
  }
}

// Cache para evitar re-importaciones
const storeCache = new Map()

/**
 * Proxy unificado que redirige a la implementación apropiada
 */
export function useUnifiedTeachersStoreProxy() {
  const context = detectContext()
  const cacheKey = `teachers-store-${context}`

  // Usar cache si está disponible
  if (storeCache.has(cacheKey)) {
    return storeCache.get(cacheKey)
  }

  let storeInstance: any

  try {
    if (context === "admin") {
      // Importar dinámicamente el store de admin
      import("../modulos/Admin/store/teachers").then((module) => {
        storeInstance = module.useAdminTeachersStore()
      })
    } else {
      // Importar dinámicamente el store principal
      import("../modulos/Teachers/store/teachers").then((module) => {
        storeInstance = module.useTeachersStore()
      })
    }
  } catch (error) {
    console.warn("Error cargando store de maestros, usando fallback:", error)

    // Fallback al store principal
    import("../modulos/Teachers/store/teachers").then((module) => {
      storeInstance = module.useTeachersStore()
    })
  }

  // Crear wrapper reactivo mientras se carga el store
  const loading = ref(true)
  const teachers = ref([])
  const error = ref(null)

  // Proxy que maneja la carga asíncrona
  const storeProxy = {
    // Estado básico
    teachers: computed(() => storeInstance?.teachers || teachers.value),
    items: computed(() => storeInstance?.items || storeInstance?.teachers || teachers.value),
    loading: computed(() => storeInstance?.loading ?? loading.value),
    error: computed(() => storeInstance?.error ?? error.value),

    // Getters comunes
    activeTeachers: computed(() => {
      const allTeachers = storeInstance?.teachers || storeInstance?.items || teachers.value
      return allTeachers.filter(
        (t: any) => t.status === "activo" || t.status === "active" || t.activo === true
      )
    }),

    getTeacherById: (id: string) => {
      const allTeachers = storeInstance?.teachers || storeInstance?.items || teachers.value
      return allTeachers.find((t: any) => t.id === id)
    },

    getTeacherByName: (name: string) => {
      const allTeachers = storeInstance?.teachers || storeInstance?.items || teachers.value
      return allTeachers.find((t: any) =>
        (t.name || t.nombre || "").toLowerCase().includes(name.toLowerCase())
      )
    },

    // Acciones principales
    fetchTeachers: async () => {
      if (!storeInstance) {
        await new Promise((resolve) => setTimeout(resolve, 100)) // Esperar carga
      }

      if (storeInstance?.fetchTeachers) {
        return await storeInstance.fetchTeachers()
      } else if (storeInstance?.loadTeachers) {
        return await storeInstance.loadTeachers()
      } else {
        console.warn("No se encontró método para cargar maestros")
        return []
      }
    },

    addTeacher: async (data: any) => {
      if (!storeInstance) {
        throw new Error("Store no disponible")
      }

      if (storeInstance?.addTeacher) {
        return await storeInstance.addTeacher(data)
      } else if (storeInstance?.createTeacher) {
        return await storeInstance.createTeacher(data)
      } else {
        throw new Error("Método addTeacher no disponible")
      }
    },

    updateTeacher: async (id: string, updates: any) => {
      if (!storeInstance) {
        throw new Error("Store no disponible")
      }

      if (storeInstance?.updateTeacher) {
        return await storeInstance.updateTeacher(id, updates)
      } else {
        throw new Error("Método updateTeacher no disponible")
      }
    },

    deleteTeacher: async (id: string) => {
      if (!storeInstance) {
        throw new Error("Store no disponible")
      }

      if (storeInstance?.deleteTeacher) {
        return await storeInstance.deleteTeacher(id)
      } else {
        throw new Error("Método deleteTeacher no disponible")
      }
    },

    // Métodos de compatibilidad
    fetchItems() { return this.fetchTeachers() },
    addItem(data: any) { return this.addTeacher(data) },
    updateItem(id: string, updates: any) { return this.updateTeacher(id, updates) },
    deleteItem(id: string) { return this.deleteTeacher(id) },
    },

    // Información de diagnóstico
    _diagnostics: {
      context,
      cacheKey,
      storeType: context === "admin" ? "AdminTeachersStore" : "TeachersStore",
      isLoaded: () => !!storeInstance,
    },
  }

  // Cachear la instancia
  storeCache.set(cacheKey, storeProxy)

  return storeProxy
}

/**
 * Alias principales para migración
 */
export const useTeachersStore = useUnifiedTeachersStoreProxy
export const useAdminTeachersStore = useUnifiedTeachersStoreProxy

/**
 * Función para limpiar cache (útil en desarrollo)
 */
export function clearTeachersStoreCache() {
  storeCache.clear()
  console.log("🧹 Cache de stores de maestros limpiado")
}

/**
 * Función para obtener diagnósticos
 */
export function getTeachersStoreDiagnostics() {
  const diagnostics: any[] = []

  for (const [key, store] of storeCache.entries()) {
    diagnostics.push({
      key,
      ...store._diagnostics,
      isLoaded: store._diagnostics.isLoaded(),
    })
  }

  return {
    totalInstances: storeCache.size,
    instances: diagnostics,
    contexts: Array.from(new Set(diagnostics.map((d) => d.context))),
  }
}
