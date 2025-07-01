// Composables especializados para gestión de observaciones por roles y funcionalidades
import {computed, ref} from "vue"
import {
  useObservationsStore,
  type ObservationFilters,
  type ObservationData,
} from "../stores/observations"
import {useAuthStore} from "../stores/auth"

/**
 * Composable para maestros - Acceso a sus propias observaciones
 */
export function useTeacherObservations() {
  const observationsStore = useObservationsStore()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filtros específicos para maestro
  const teacherFilters = computed(
    (): ObservationFilters => ({
      authorId: authStore.currentUser?.uid || "",
    })
  )

  // Obtener observaciones del maestro actual
  const fetchMyObservations = async (additionalFilters: Partial<ObservationFilters> = {}) => {
    try {
      loading.value = true
      error.value = null

      const filters = {
        ...teacherFilters.value,
        ...additionalFilters,
      }

      return await observationsStore.fetchObservations(filters)
    } catch (err: any) {
      error.value = err.message
      console.error("[TeacherObservations] Error:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Obtener observaciones por clase (del maestro actual)
  const fetchMyClassObservations = async (classId: string) => {
    return await fetchMyObservations({classId})
  }

  // Obtener observaciones por rango de fechas (del maestro actual)
  const fetchMyObservationsByDateRange = async (dateFrom: string, dateTo: string) => {
    return await fetchMyObservations({dateFrom, dateTo})
  }

  // Crear observación (solo el maestro puede crear sus observaciones)
  const createMyObservation = async (observationData: Partial<ObservationData>) => {
    const data = {
      ...observationData,
      authorId: authStore.currentUser?.uid || "",
      author: authStore.currentUser?.email || "",
      authorName: authStore.currentUser?.displayName || authStore.currentUser?.email || "",
    }

    return await observationsStore.createObservation(data)
  }

  // Actualizar observación (solo si es del maestro actual)
  const updateMyObservation = async (id: string, updates: Partial<ObservationData>) => {
    const observation = observationsStore.observations.find((obs) => obs.id === id)

    if (!observation) {
      throw new Error("Observación no encontrada")
    }

    if (observation.authorId !== authStore.currentUser?.uid) {
      throw new Error("No tienes permisos para actualizar esta observación")
    }

    return await observationsStore.updateObservation(id, updates)
  }

  // Eliminar observación (solo si es del maestro actual)
  const deleteMyObservation = async (id: string) => {
    const observation = observationsStore.observations.find((obs) => obs.id === id)

    if (!observation) {
      throw new Error("Observación no encontrada")
    }

    if (observation.authorId !== authStore.currentUser?.uid) {
      throw new Error("No tienes permisos para eliminar esta observación")
    }

    return await observationsStore.deleteObservation(id)
  }

  // Estadísticas del maestro
  const myObservationStats = computed(() => {
    const myObservations = observationsStore.filteredObservations.filter(
      (obs) => obs.authorId === authStore.currentUser?.uid
    )

    const totalClasses = new Set(myObservations.map((obs) => obs.classId)).size
    const averagePerClass = totalClasses > 0 ? myObservations.length / totalClasses : 0

    return {
      total: myObservations.length,
      totalClasses,
      averagePerClass,
      lastObservation: myObservations[0]?.date || null,
      byType: myObservations.reduce(
        (acc, obs) => {
          acc[obs.type] = (acc[obs.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }
  })

  return {
    loading,
    error,
    myObservationStats,
    fetchMyObservations,
    fetchMyClassObservations,
    fetchMyObservationsByDateRange,
    createMyObservation,
    updateMyObservation,
    deleteMyObservation,
  }
}

/**
 * Composable para administradores - Acceso completo a todas las observaciones
 */
export function useAdminObservations() {
  const observationsStore = useObservationsStore()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Verificar permisos de administrador
  const checkAdminPermissions = () => {
    const userRole = authStore.currentUser?.role
    if (!["admin", "director", "superuser"].includes(userRole || "")) {
      throw new Error("No tienes permisos de administrador")
    }
  }

  // Obtener todas las observaciones con filtros avanzados
  const fetchAllObservations = async (filters: ObservationFilters = {}) => {
    try {
      checkAdminPermissions()
      loading.value = true
      error.value = null

      return await observationsStore.fetchObservations(filters)
    } catch (err: any) {
      error.value = err.message
      console.error("[AdminObservations] Error:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Obtener observaciones por maestro
  const fetchObservationsByTeacher = async (
    teacherId: string,
    additionalFilters: Partial<ObservationFilters> = {}
  ) => {
    checkAdminPermissions()
    return await fetchAllObservations({...additionalFilters, authorId: teacherId})
  }

  // Obtener observaciones por clase
  const fetchObservationsByClass = async (
    classId: string,
    additionalFilters: Partial<ObservationFilters> = {}
  ) => {
    checkAdminPermissions()
    return await fetchAllObservations({...additionalFilters, classId})
  }

  // Obtener observaciones por rango de fechas
  const fetchObservationsByDateRange = async (
    dateFrom: string,
    dateTo: string,
    additionalFilters: Partial<ObservationFilters> = {}
  ) => {
    checkAdminPermissions()
    return await fetchAllObservations({...additionalFilters, dateFrom, dateTo})
  }

  // Obtener observaciones que requieren seguimiento
  const fetchObservationsRequiringFollowUp = async (
    additionalFilters: Partial<ObservationFilters> = {}
  ) => {
    checkAdminPermissions()
    return await fetchAllObservations({...additionalFilters, requiresFollowUp: true})
  }

  // Análisis avanzado de datos
  const generateAdvancedAnalysis = async (filters: ObservationFilters = {}) => {
    try {
      checkAdminPermissions()
      loading.value = true

      const observations = await fetchAllObservations(filters)

      // Análisis de tendencias temporales
      const monthlyTrends = observations.reduce(
        (acc, obs) => {
          const month = obs.date.substring(0, 7) // YYYY-MM
          acc[month] = (acc[month] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      // Análisis por maestro
      const teacherAnalysis = observations.reduce(
        (acc, obs) => {
          const teacher = obs.authorName || obs.author
          if (!acc[teacher]) {
            acc[teacher] = {
              total: 0,
              byType: {} as Record<string, number>,
              byPriority: {} as Record<string, number>,
              classes: new Set(),
              averageTextLength: 0,
              followUpRate: 0,
            }
          }

          acc[teacher].total += 1
          acc[teacher].byType[obs.type] = (acc[teacher].byType[obs.type] || 0) + 1
          acc[teacher].byPriority[obs.priority] = (acc[teacher].byPriority[obs.priority] || 0) + 1
          acc[teacher].classes.add(obs.classId)
          acc[teacher].averageTextLength += obs.text.length
          if (obs.requiresFollowUp) acc[teacher].followUpRate += 1

          return acc
        },
        {} as Record<string, any>
      )

      // Calcular promedios
      Object.keys(teacherAnalysis).forEach((teacher) => {
        const data = teacherAnalysis[teacher]
        data.averageTextLength = data.averageTextLength / data.total
        data.followUpRate = (data.followUpRate / data.total) * 100
        data.classCount = data.classes.size
        delete data.classes // Remover Set para serialización
      })

      // Análisis por clase
      const classAnalysis = observations.reduce(
        (acc, obs) => {
          const classId = obs.classId
          if (!acc[classId]) {
            acc[classId] = {
              total: 0,
              teachers: new Set(),
              byType: {} as Record<string, number>,
              byPriority: {} as Record<string, number>,
              students: new Set(),
            }
          }

          acc[classId].total += 1
          acc[classId].teachers.add(obs.authorId)
          acc[classId].byType[obs.type] = (acc[classId].byType[obs.type] || 0) + 1
          acc[classId].byPriority[obs.priority] = (acc[classId].byPriority[obs.priority] || 0) + 1
          obs.taggedStudents.forEach((student) => acc[classId].students.add(student))

          return acc
        },
        {} as Record<string, any>
      )

      // Convertir Sets a números
      Object.keys(classAnalysis).forEach((classId) => {
        const data = classAnalysis[classId]
        data.teacherCount = data.teachers.size
        data.studentCount = data.students.size
        delete data.teachers
        delete data.students
      })

      // Indicadores clave
      const kpis = {
        totalObservations: observations.length,
        activeTeachers: new Set(observations.map((obs) => obs.authorId)).size,
        activeClasses: new Set(observations.map((obs) => obs.classId)).size,
        followUpRate:
          (observations.filter((obs) => obs.requiresFollowUp).length / observations.length) * 100,
        averageObservationsPerTeacher:
          observations.length / new Set(observations.map((obs) => obs.authorId)).size,
        averageObservationsPerClass:
          observations.length / new Set(observations.map((obs) => obs.classId)).size,
        criticalObservations: observations.filter((obs) => obs.priority === "critica").length,
        recentObservations: observations.filter((obs) => {
          const obsDate = new Date(obs.date)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return obsDate >= weekAgo
        }).length,
      }

      return {
        kpis,
        monthlyTrends,
        teacherAnalysis,
        classAnalysis,
        rawData: observations.map((obs) => ({
          id: obs.id,
          date: obs.date,
          type: obs.type,
          priority: obs.priority,
          textLength: obs.text.length,
          hasFollowUp: obs.requiresFollowUp,
          studentCount: obs.taggedStudents.length,
          teacher: obs.authorName || obs.author,
          class: obs.className || obs.classId,
        })),
      }
    } catch (err: any) {
      error.value = err.message
      console.error("[AdminObservations] Analysis error:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Exportar datos para IA
  const exportForAIAnalysis = async (
    filters: ObservationFilters = {},
    format: "json" | "csv" = "json"
  ) => {
    checkAdminPermissions()
    const observations = await fetchAllObservations(filters)

    const aiData = observations.map((obs) => ({
      text: obs.text,
      type: obs.type,
      priority: obs.priority,
      date: obs.date,
      teacher: obs.authorName || obs.author,
      class: obs.className || obs.classId,
      followUp: obs.requiresFollowUp,
      studentCount: obs.taggedStudents.length,
      textLength: obs.text.length,
      sentiment: null, // Para análisis posterior
      topics: null, // Para análisis posterior
      urgency:
        obs.priority === "critica"
          ? 1
          : obs.priority === "alta"
            ? 0.7
            : obs.priority === "media"
              ? 0.4
              : 0.1,
    }))

    if (format === "csv") {
      const headers = Object.keys(aiData[0] || {})
      const csv = [
        headers.join(","),
        ...aiData.map((row) =>
          headers.map((h) => `"${row[h as keyof typeof row] || ""}"`).join(",")
        ),
      ].join("\n")
      return csv
    }

    return JSON.stringify(aiData, null, 2)
  }

  return {
    loading,
    error,
    fetchAllObservations,
    fetchObservationsByTeacher,
    fetchObservationsByClass,
    fetchObservationsByDateRange,
    fetchObservationsRequiringFollowUp,
    generateAdvancedAnalysis,
    exportForAIAnalysis,
  }
}

/**
 * Composable para análisis y reportes
 */
export function useObservationAnalytics() {
  const observationsStore = useObservationsStore()

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Generar reporte de tendencias
  const generateTrendsReport = async (months: number = 6) => {
    try {
      loading.value = true

      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const observations = await observationsStore.fetchObservations({
        dateFrom: startDate.toISOString().split("T")[0],
        dateTo: endDate.toISOString().split("T")[0],
      })

      // Agrupar por mes
      const monthlyData = observations.reduce(
        (acc, obs) => {
          const month = obs.date.substring(0, 7)
          if (!acc[month]) {
            acc[month] = {
              total: 0,
              byType: {} as Record<string, number>,
              byPriority: {} as Record<string, number>,
              teachers: new Set(),
              classes: new Set(),
            }
          }

          acc[month].total += 1
          acc[month].byType[obs.type] = (acc[month].byType[obs.type] || 0) + 1
          acc[month].byPriority[obs.priority] = (acc[month].byPriority[obs.priority] || 0) + 1
          acc[month].teachers.add(obs.authorId)
          acc[month].classes.add(obs.classId)

          return acc
        },
        {} as Record<string, any>
      )

      // Convertir a array ordenado
      const trends = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]: [string, any]) => ({
          month,
          total: data.total,
          teacherCount: data.teachers.size,
          classCount: data.classes.size,
          byType: data.byType,
          byPriority: data.byPriority,
        }))

      return trends
    } catch (err: any) {
      error.value = err.message
      console.error("[ObservationAnalytics] Trends error:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Generar reporte de maestros más activos
  const generateTeacherActivityReport = async (limit: number = 10) => {
    try {
      loading.value = true

      const observations = await observationsStore.fetchObservations()

      const teacherActivity = observations.reduce(
        (acc, obs) => {
          const teacher = obs.authorName || obs.author
          const teacherId = obs.authorId

          if (!acc[teacherId]) {
            acc[teacherId] = {
              name: teacher,
              total: 0,
              classes: new Set(),
              students: new Set(),
              byType: {} as Record<string, number>,
              avgTextLength: 0,
              followUpRate: 0,
              lastActivity: obs.date,
            }
          }

          acc[teacherId].total += 1
          acc[teacherId].classes.add(obs.classId)
          obs.taggedStudents.forEach((student) => acc[teacherId].students.add(student))
          acc[teacherId].byType[obs.type] = (acc[teacherId].byType[obs.type] || 0) + 1
          acc[teacherId].avgTextLength += obs.text.length
          if (obs.requiresFollowUp) acc[teacherId].followUpRate += 1

          if (obs.date > acc[teacherId].lastActivity) {
            acc[teacherId].lastActivity = obs.date
          }

          return acc
        },
        {} as Record<string, any>
      )

      // Calcular promedios y convertir a array
      const report = Object.entries(teacherActivity)
        .map(([teacherId, data]: [string, any]) => ({
          teacherId,
          name: data.name,
          total: data.total,
          classCount: data.classes.size,
          studentCount: data.students.size,
          avgTextLength: Math.round(data.avgTextLength / data.total),
          followUpRate: Math.round((data.followUpRate / data.total) * 100),
          lastActivity: data.lastActivity,
          byType: data.byType,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)

      return report
    } catch (err: any) {
      error.value = err.message
      console.error("[ObservationAnalytics] Teacher activity error:", err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    generateTrendsReport,
    generateTeacherActivityReport,
  }
}
