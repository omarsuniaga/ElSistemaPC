import {defineStore} from "pinia"
import {ref, computed} from "vue"
import type {
  StudentPerformance,
  PerformanceWeights,
  PerformanceFilters,
  PerformanceSummary,
} from "../types/performance"
import {DEFAULT_WEIGHTS} from "../types/performance"
import {PerformanceAnalysisService} from "../services/performanceAnalysis"
import {useFirestore} from "../../../composables/useFirestore"

export const usePerformanceStore = defineStore("performance", () => {
  const {getCollection, getDocument} = useFirestore()

  // State
  const students = ref<Map<string, StudentPerformance>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const globalWeights = ref<PerformanceWeights>(DEFAULT_WEIGHTS)
  const lastUpdated = ref<string | null>(null)
  const filters = ref<PerformanceFilters>({
    classification: [],
    course: [],
    minAttendance: 0,
    minScore: 0,
    dateRange: {start: "", end: ""},
  })

  // Getters
  const getStudentPerformance = computed(() => {
    return (studentId: string) => students.value.get(studentId)
  })

  const getAllStudents = computed(() => {
    return Array.from(students.value.values())
  })

  const filteredStudents = computed(() => {
    let filtered = getAllStudents.value

    if (filters.value.classification.length > 0) {
      filtered = filtered.filter((s) => filters.value.classification.includes(s.classification))
    }

    if (filters.value.minAttendance > 0) {
      filtered = filtered.filter(
        (s) => s.attendanceMetrics.attendanceRate >= filters.value.minAttendance
      )
    }

    if (filters.value.minScore > 0) {
      filtered = filtered.filter((s) => s.overallScore >= filters.value.minScore)
    }

    return filtered
  })

  const topPerformers = computed(() => {
    return getAllStudents.value.sort((a, b) => b.overallScore - a.overallScore).slice(0, 10)
  })

  const studentsNeedingAttention = computed(() => {
    return getAllStudents.value.filter(
      (s) =>
        s.classification === "Preocupante" ||
        s.attendanceMetrics.attendanceRate < 70 ||
        s.overallScore < 60
    )
  })

  const performanceSummary = computed((): PerformanceSummary => {
    const total = getAllStudents.value.length
    if (total === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        averageAttendance: 0,
        classifications: {
          Excelente: 0,
          "Muy bueno": 0,
          Bueno: 0,
          Regular: 0,
          "Necesita mejora": 0,
          Preocupante: 0,
        },
        trends: {improving: 0, stable: 0, declining: 0},
      }
    }

    const studentsArray = getAllStudents.value
    const averageScore = studentsArray.reduce((sum, s) => sum + s.overallScore, 0) / total
    const averageAttendance =
      studentsArray.reduce((sum, s) => sum + s.attendanceMetrics.attendanceRate, 0) / total

    const classifications = studentsArray.reduce(
      (acc, s) => {
        acc[s.classification] = (acc[s.classification] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const trends = studentsArray.reduce(
      (acc, s) => {
        const trend = s.trends.overall
        if (trend > 5) acc.improving++
        else if (trend < -5) acc.declining++
        else acc.stable++
        return acc
      },
      {improving: 0, stable: 0, declining: 0}
    )

    return {
      totalStudents: total,
      averageScore: Math.round(averageScore),
      averageAttendance: Math.round(averageAttendance),
      classifications: {
        Excelente: classifications["Excelente"] || 0,
        "Muy bueno": classifications["Muy bueno"] || 0,
        Bueno: classifications["Bueno"] || 0,
        Regular: classifications["Regular"] || 0,
        "Necesita mejora": classifications["Necesita mejora"] || 0,
        Preocupante: classifications["Preocupante"] || 0,
      },
      trends,
    }
  })

  // Actions
  const fetchStudentPerformance = async (studentId: string, forceRefresh = false) => {
    // Si ya tenemos los datos y no es refresh forzado, retornar
    if (students.value.has(studentId) && !forceRefresh) {
      return students.value.get(studentId)
    }

    loading.value = true
    error.value = null

    try {
      // Obtener datos del estudiante
      const studentDoc = await getDocument("users", studentId)
      if (!studentDoc.exists()) {
        throw new Error("Estudiante no encontrado")
      }

      const studentData = studentDoc.data()

      // Obtener todos los datos necesarios en paralelo
      const [attendanceQuery, montajesQuery, observationsQuery, workMetricsQuery] =
        await Promise.all([
          getCollection("attendance", [{field: "studentId", operator: "==", value: studentId}]),
          getCollection("montajes", [
            {field: "participantes", operator: "array-contains", value: studentId},
          ]),
          getCollection("teacherObservations", [
            {field: "studentId", operator: "==", value: studentId},
          ]),
          getCollection("workMetrics", [{field: "studentId", operator: "==", value: studentId}]),
        ])

      const attendanceRecords = attendanceQuery.docs.map((doc) => doc.data())
      const montajes = montajesQuery.docs.map((doc) => doc.data())
      const observations = observationsQuery.docs.map((doc) => doc.data())
      const workData = workMetricsQuery.docs.map((doc) => doc.data())

      // Calcular métricas
      const attendanceMetrics =
        PerformanceAnalysisService.calculateAttendanceMetrics(attendanceRecords)
      const repertoireMetrics = PerformanceAnalysisService.calculateRepertoireMetrics(montajes)
      const workMetrics = PerformanceAnalysisService.calculateWorkMetrics(workData)
      const teacherObservations =
        PerformanceAnalysisService.processTeacherObservations(observations)

      const overallPerformance = PerformanceAnalysisService.calculateOverallPerformance(
        attendanceMetrics,
        repertoireMetrics,
        workMetrics,
        teacherObservations,
        globalWeights.value
      )

      const trends = PerformanceAnalysisService.calculateTrends(
        attendanceRecords,
        montajes,
        observations
      )

      const performance: StudentPerformance = {
        studentId,
        studentName: studentData.displayName || `${studentData.nombres} ${studentData.apellidos}`,
        lastUpdated: new Date().toISOString(),
        attendanceMetrics,
        repertoireMetrics,
        workMetrics,
        teacherObservations,
        overallScore: overallPerformance.score,
        classification: overallPerformance.classification,
        trends,
        recommendations: PerformanceAnalysisService.generateRecommendations(
          attendanceMetrics,
          repertoireMetrics,
          workMetrics,
          teacherObservations
        ),
      }

      // Guardar en el store
      students.value.set(studentId, performance)
      lastUpdated.value = new Date().toISOString()

      return performance
    } catch (err) {
      console.error("Error fetching student performance:", err)
      error.value = err instanceof Error ? err.message : "Error desconocido"
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMultipleStudents = async (studentIds: string[]) => {
    loading.value = true
    error.value = null

    try {
      const promises = studentIds.map((id) => fetchStudentPerformance(id))
      await Promise.all(promises)
    } catch (err) {
      console.error("Error fetching multiple students:", err)
      error.value = err instanceof Error ? err.message : "Error desconocido"
    } finally {
      loading.value = false
    }
  }

  const fetchAllStudents = async () => {
    loading.value = true
    error.value = null

    try {
      // Obtener todos los estudiantes
      const studentsQuery = await getCollection("users", [
        {field: "role", operator: "==", value: "student"},
      ])

      const studentIds = studentsQuery.docs.map((doc) => doc.id)
      await fetchMultipleStudents(studentIds)
    } catch (err) {
      console.error("Error fetching all students:", err)
      error.value = err instanceof Error ? err.message : "Error desconocido"
    } finally {
      loading.value = false
    }
  }

  const updateGlobalWeights = (newWeights: Partial<PerformanceWeights>) => {
    globalWeights.value = {...globalWeights.value, ...newWeights}

    // Recalcular todas las puntuaciones con los nuevos pesos
    students.value.forEach((performance, studentId) => {
      const overallPerformance = PerformanceAnalysisService.calculateOverallPerformance(
        performance.attendanceMetrics,
        performance.repertoireMetrics,
        performance.workMetrics,
        performance.teacherObservations,
        globalWeights.value
      )

      performance.overallScore = overallPerformance.score
      performance.classification = overallPerformance.classification
      performance.lastUpdated = new Date().toISOString()
    })

    lastUpdated.value = new Date().toISOString()
  }

  const updateFilters = (newFilters: Partial<PerformanceFilters>) => {
    filters.value = {...filters.value, ...newFilters}
  }

  const clearCache = () => {
    students.value.clear()
    lastUpdated.value = null
    error.value = null
  }

  const removeStudent = (studentId: string) => {
    students.value.delete(studentId)
  }

  const getPerformanceStats = (studentIds?: string[]) => {
    const targetStudents = studentIds
      ? (studentIds.map((id) => students.value.get(id)).filter(Boolean) as StudentPerformance[])
      : getAllStudents.value

    if (targetStudents.length === 0) return null

    const scores = targetStudents.map((s) => s.overallScore)
    const attendanceRates = targetStudents.map((s) => s.attendanceMetrics.attendanceRate)

    return {
      count: targetStudents.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      averageAttendance: attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length,
      classifications: targetStudents.reduce(
        (acc, s) => {
          acc[s.classification] = (acc[s.classification] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }

  return {
    // State
    students,
    loading,
    error,
    globalWeights,
    lastUpdated,
    filters,

    // Getters
    getStudentPerformance,
    getAllStudents,
    filteredStudents,
    topPerformers,
    studentsNeedingAttention,
    performanceSummary,

    // Actions
    fetchStudentPerformance,
    fetchMultipleStudents,
    fetchAllStudents,
    updateGlobalWeights,
    updateFilters,
    clearCache,
    removeStudent,
    getPerformanceStats,
  }
})
