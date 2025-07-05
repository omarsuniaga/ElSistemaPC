// Store principal para gestión de observaciones unificadas
import {defineStore} from "pinia"
import {ref, computed, readonly, Ref, ComputedRef} from "vue"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit,
  startAfter,
  endBefore,
  Timestamp,
} from "firebase/firestore"
import {db} from "../firebase"

// Tipos de datos
export interface ObservationData {
  id: string
  text: string
  classId: string
  className?: string
  author: string
  authorId: string
  authorName?: string
  date: string
  fecha: string // Formato YYYYMMDD para compatibilidad
  createdAt: string | Timestamp
  updatedAt: string | Timestamp
  source: "MANUAL" | "OBSERVACIONES" | "OBSERVACIONES_CLASE" | "ASISTENCIAS"
  type: "general" | "comportamiento" | "academico" | "asistencia" | "evaluacion"
  priority: "baja" | "media" | "alta" | "critica"
  requiresFollowUp: boolean
  taggedStudents: string[]
  studentName?: string
  content?: {
    text: string
    images?: string[]
    attachments?: string[]
  }
  metadata?: {
    deviceInfo?: string
    location?: string
    duration?: number
  }
}

export interface ObservationFilters {
  classId?: string
  authorId?: string
  teacherId?: string
  dateFrom?: string
  dateTo?: string
  type?: string
  priority?: string
  requiresFollowUp?: boolean
  source?: string
  studentId?: string
}

export interface ObservationStats {
  total: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  byTeacher: Record<string, number>
  byClass: Record<string, number>
  byMonth: Record<string, number>
  avgPerClass: number
  avgPerTeacher: number
  trendsLastMonths: number[]
}

export const useObservationsStore = defineStore("observations", () => {
  // Estado reactivo
  const observations = ref<ObservationData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const itemsPerPage = ref(50)
  const totalItems = ref(0)
  const hasMore = ref(true)
  const lastDoc = ref<any>(null)

  // Filtros activos
  const activeFilters = ref<ObservationFilters>({})

  // Cache para optimización
  const cache = ref<Map<string, {data: ObservationData[]; timestamp: number}>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  // Computed properties
  const filteredObservations = computed(() => {
    if (!activeFilters.value || Object.keys(activeFilters.value).length === 0) {
      return observations.value
    }

    return observations.value.filter((obs) => {
      const filters = activeFilters.value

      if (filters.classId && obs.classId !== filters.classId) return false
      if (filters.authorId && obs.authorId !== filters.authorId) return false
      if (filters.teacherId && obs.authorId !== filters.teacherId) return false
      if (filters.type && obs.type !== filters.type) return false
      if (filters.priority && obs.priority !== filters.priority) return false
      if (filters.source && obs.source !== filters.source) return false
      if (
        filters.requiresFollowUp !== undefined &&
        obs.requiresFollowUp !== filters.requiresFollowUp
      )
        return false

      if (filters.dateFrom) {
        const obsDate = new Date(obs.date)
        const fromDate = new Date(filters.dateFrom)
        if (obsDate < fromDate) return false
      }

      if (filters.dateTo) {
        const obsDate = new Date(obs.date)
        const toDate = new Date(filters.dateTo)
        if (obsDate > toDate) return false
      }

      if (filters.studentId && !obs.taggedStudents.includes(filters.studentId)) return false

      return true
    })
  })

  const observationStats = computed((): ObservationStats => {
    const obs = filteredObservations.value

    const byType: Record<string, number> = {}
    const byPriority: Record<string, number> = {}
    const byTeacher: Record<string, number> = {}
    const byClass: Record<string, number> = {}
    const byMonth: Record<string, number> = {}

    obs.forEach((observation) => {
      // Por tipo
      byType[observation.type] = (byType[observation.type] || 0) + 1

      // Por prioridad
      byPriority[observation.priority] = (byPriority[observation.priority] || 0) + 1

      // Por maestro
      const teacherKey = observation.authorName || observation.author
      byTeacher[teacherKey] = (byTeacher[teacherKey] || 0) + 1

      // Por clase
      const classKey = observation.className || observation.classId
      byClass[classKey] = (byClass[classKey] || 0) + 1

      // Por mes
      const monthKey = observation.date.substring(0, 7) // YYYY-MM
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1
    })

    const uniqueClasses = new Set(obs.map((o) => o.classId)).size
    const uniqueTeachers = new Set(obs.map((o) => o.authorId)).size

    return {
      total: obs.length,
      byType,
      byPriority,
      byTeacher,
      byClass,
      byMonth,
      avgPerClass: uniqueClasses > 0 ? obs.length / uniqueClasses : 0,
      avgPerTeacher: uniqueTeachers > 0 ? obs.length / uniqueTeachers : 0,
      trendsLastMonths: Object.values(byMonth).slice(-6), // Últimos 6 meses
    }
  })

  // Utilidades de cache
  const getCacheKey = (filters: ObservationFilters): string => {
    return JSON.stringify(filters)
  }

  const isValidCache = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION
  }

  // Acciones principales
  const fetchObservations = async (filters: ObservationFilters = {}, useCache = true) => {
    const cacheKey = getCacheKey(filters)

    // Verificar cache
    if (useCache && cache.value.has(cacheKey)) {
      const cached = cache.value.get(cacheKey)!
      if (isValidCache(cached.timestamp)) {
        observations.value = cached.data
        console.log(`[ObservationsStore] Using cached data for filters: ${cacheKey}`)
        return cached.data
      }
    }

    try {
      loading.value = true
      error.value = null

      console.log(`[ObservationsStore] Fetching observations with filters:`, filters)

      let q = query(collection(db, "OBSERVACIONES_UNIFICADAS"))

      // Aplicar filtros
      if (filters.classId) {
        q = query(q, where("classId", "==", filters.classId))
      }

      if (filters.authorId) {
        q = query(q, where("authorId", "==", filters.authorId))
      }

      if (filters.type) {
        q = query(q, where("type", "==", filters.type))
      }

      if (filters.priority) {
        q = query(q, where("priority", "==", filters.priority))
      }

      if (filters.requiresFollowUp !== undefined) {
        q = query(q, where("requiresFollowUp", "==", filters.requiresFollowUp))
      }

      // Paginación
      if (itemsPerPage.value > 0) {
        q = query(q, limit(itemsPerPage.value))
      }

      const querySnapshot = await getDocs(q)
      const fetchedObservations: ObservationData[] = []

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        fetchedObservations.push({
          id: docSnapshot.id,
          ...data,
        } as ObservationData)
      })

      // Ordenar manualmente por fecha (más reciente primero)
      fetchedObservations.sort((a, b) => {
        const dateA = new Date((a.createdAt as string) || a.date)
        const dateB = new Date((b.createdAt as string) || b.date)
        return dateB.getTime() - dateA.getTime()
      })

      // Filtros adicionales que no se pueden hacer en Firestore
      let filtered = fetchedObservations

      if (filters.dateFrom || filters.dateTo) {
        filtered = filtered.filter((obs) => {
          const obsDate = new Date(obs.date)

          if (filters.dateFrom && obsDate < new Date(filters.dateFrom)) {
            return false
          }

          if (filters.dateTo && obsDate > new Date(filters.dateTo)) {
            return false
          }

          return true
        })
      }

      observations.value = filtered
      activeFilters.value = filters
      totalItems.value = filtered.length

      // Guardar en cache
      cache.value.set(cacheKey, {
        data: filtered,
        timestamp: Date.now(),
      })

      console.log(`[ObservationsStore] Fetched ${filtered.length} observations`)
      return filtered
    } catch (err: any) {
      error.value = err.message
      console.error("[ObservationsStore] Error fetching observations:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Crear nueva observación
  const createObservation = async (observationData: Partial<ObservationData>) => {
    try {
      loading.value = true
      error.value = null

      const now = new Date()
      const newObservation: Partial<ObservationData> = {
        ...observationData,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        source: "MANUAL",
        fecha:
          observationData.date?.replace(/-/g, "") ||
          now.toISOString().split("T")[0].replace(/-/g, ""),
        type: observationData.type || "general",
        priority: observationData.priority || "media",
        requiresFollowUp: observationData.requiresFollowUp || false,
        taggedStudents: observationData.taggedStudents || [],
      }

      const docRef = await addDoc(collection(db, "OBSERVACIONES_UNIFICADAS"), newObservation)

      const createdObservation = {
        id: docRef.id,
        ...newObservation,
      } as ObservationData

      // Actualizar estado local
      observations.value.unshift(createdObservation)
      totalItems.value += 1

      // Limpiar cache
      cache.value.clear()

      // Crear notificación para administradores
      try {
        const {createStudentObservationNotification} = await import("@/services/adminNotificationService")
        
        // Determinar tipo de observación basado en la prioridad y tipo
        let observationType: "positive" | "negative" | "neutral" = "neutral"
        if (createdObservation.type === "comportamiento" && createdObservation.priority === "alta") {
          observationType = "negative"
        } else if (createdObservation.type === "academico" && createdObservation.priority === "baja") {
          observationType = "positive"
        } else if (createdObservation.priority === "critica") {
          observationType = "negative"
        }

        await createStudentObservationNotification({
          teacherId: createdObservation.authorId,
          studentId: createdObservation.taggedStudents[0] || "unknown", // Tomar el primer estudiante etiquetado
          observationType,
          observationText: createdObservation.text,
          severity: createdObservation.priority === "critica" ? "high" : createdObservation.priority === "alta" ? "medium" : "low",
        })
      } catch (error) {
        console.warn("No se pudo crear notificación para la observación:", error)
      }

      console.log(`[ObservationsStore] Created observation: ${docRef.id}`)
      return createdObservation
    } catch (err: any) {
      error.value = err.message
      console.error("[ObservationsStore] Error creating observation:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actualizar observación
  const updateObservation = async (id: string, updates: Partial<ObservationData>) => {
    try {
      loading.value = true
      error.value = null

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      await updateDoc(doc(db, "OBSERVACIONES_UNIFICADAS", id), updateData)

      // Actualizar estado local
      const index = observations.value.findIndex((obs) => obs.id === id)
      if (index !== -1) {
        observations.value[index] = {
          ...observations.value[index],
          ...updateData,
        }
      }

      // Limpiar cache
      cache.value.clear()

      console.log(`[ObservationsStore] Updated observation: ${id}`)
      return observations.value[index]
    } catch (err: any) {
      error.value = err.message
      console.error("[ObservationsStore] Error updating observation:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Eliminar observación
  const deleteObservation = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      await deleteDoc(doc(db, "OBSERVACIONES_UNIFICADAS", id))

      // Actualizar estado local
      observations.value = observations.value.filter((obs) => obs.id !== id)
      totalItems.value -= 1

      // Limpiar cache
      cache.value.clear()

      console.log(`[ObservationsStore] Deleted observation: ${id}`)
    } catch (err: any) {
      error.value = err.message
      console.error("[ObservationsStore] Error deleting observation:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Limpiar filtros
  const clearFilters = () => {
    activeFilters.value = {}
  }

  // Limpiar cache
  const clearCache = () => {
    cache.value.clear()
  }

  // Exportar para análisis
  const exportObservationsForAnalysis = (format: "json" | "csv" = "json") => {
    const data = filteredObservations.value.map((obs) => ({
      id: obs.id,
      text: obs.text,
      date: obs.date,
      author: obs.authorName || obs.author,
      class: obs.className || obs.classId,
      type: obs.type,
      priority: obs.priority,
      requiresFollowUp: obs.requiresFollowUp,
      source: obs.source,
      studentCount: obs.taggedStudents.length,
      textLength: obs.text.length,
      createdAt: obs.createdAt,
    }))

    if (format === "csv") {
      const headers = Object.keys(data[0] || {})
      const csv = [
        headers.join(","),
        ...data.map((row) => headers.map((h) => `"${row[h as keyof typeof row]}"`).join(",")),
      ].join("\n")

      return csv
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Devuelve las observaciones de un alumno filtradas por id y rango de fechas
   * @param studentId string
   * @param dateFrom string (YYYY-MM-DD)
   * @param dateTo string (YYYY-MM-DD)
   * @returns ObservationData[]
   */
  function getObservationsByStudentIdAndDateRange(
    studentId: string,
    dateFrom?: string,
    dateTo?: string
  ): ObservationData[] {
    return observations.value.filter((obs) => {
      // El alumno debe estar etiquetado
      if (!Array.isArray(obs.taggedStudents) || !obs.taggedStudents.includes(studentId))
        return false
      // Filtrar por rango de fechas si se especifica
      if (dateFrom) {
        const obsDate = new Date(obs.date)
        const fromDate = new Date(dateFrom)
        if (obsDate < fromDate) return false
      }
      if (dateTo) {
        const obsDate = new Date(obs.date)
        const toDate = new Date(dateTo)
        if (obsDate > toDate) return false
      }
      return true
    })
  }

  return {
    // Estado
    observations: readonly(observations),
    loading: readonly(loading),
    error: readonly(error),
    currentPage: readonly(currentPage),
    totalItems: readonly(totalItems),
    hasMore: readonly(hasMore),
    activeFilters: readonly(activeFilters),

    // Computed
    filteredObservations,
    observationStats,

    // Acciones
    fetchObservations,
    createObservation,
    updateObservation,
    deleteObservation,
    clearFilters,
    clearCache,
    exportObservationsForAnalysis,
    getObservationsByStudentIdAndDateRange,
  }
})
