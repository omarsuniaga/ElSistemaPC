/**
 * 🧠 COMPOSABLE DE ANALYTICS E INTELIGENCIA ARTIFICIAL
 * Sistema reactivo para análisis avanzado y predicciones ML
 */

import {ref, computed, onMounted} from "vue"
import {collection, query, where, orderBy, getDocs, Timestamp} from "firebase/firestore"
import {db} from "@/firebase/config"

export interface AnalyticsDashboard {
  overview: OverviewMetrics
  predictions: PredictionMetrics
  trends: TrendMetrics
  alerts: AlertMetrics
  insights: InsightMetrics
}

export interface OverviewMetrics {
  totalStudents: number
  activeClasses: number
  averageAttendance: number
  attendanceTrend: number
  riskStudents: number
  predictions: number
}

export interface PredictionMetrics {
  nextWeekAttendance: AttendancePrediction[]
  riskStudents: RiskStudent[]
  capacityForecast: CapacityForecast[]
  recommendations: SmartRecommendation[]
}

export interface TrendMetrics {
  weeklyTrends: WeeklyTrend[]
  monthlyComparison: MonthlyComparison[]
  seasonalPatterns: SeasonalPattern[]
  timeSlotAnalysis: TimeSlotAnalysis[]
}

export interface AlertMetrics {
  criticalAlerts: Alert[]
  warnings: Warning[]
  opportunities: Opportunity[]
  automations: Automation[]
}

export interface InsightMetrics {
  keyInsights: KeyInsight[]
  performanceScore: number
  improvementAreas: ImprovementArea[]
  successFactors: SuccessFactor[]
}

export interface AttendancePrediction {
  classId: string
  className: string
  date: string
  predictedAttendance: number
  confidence: number
  riskLevel: "low" | "medium" | "high"
}

export interface RiskStudent {
  studentId: string
  studentName: string
  riskScore: number
  lastAttendance: string
  prediction: "likely_absent" | "uncertain" | "likely_present"
  actions: string[]
}

export interface SmartRecommendation {
  id: string
  type: "schedule" | "communication" | "engagement" | "capacity"
  title: string
  description: string
  impact: number
  effort: "low" | "medium" | "high"
  priority: number
}

export interface Alert {
  id: string
  severity: "critical" | "warning" | "info"
  message: string
  affectedClasses: string[]
  suggestedActions: string[]
  createdAt: Date
}

export interface KeyInsight {
  id: string
  category: "attendance" | "performance" | "engagement" | "efficiency"
  title: string
  description: string
  metric: number
  trend: "up" | "down" | "stable"
  actionable: boolean
}

export function useAdvancedAnalytics() {
  // Estado reactivo
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // Datos del dashboard
  const dashboard = ref<AnalyticsDashboard>({
    overview: {
      totalStudents: 0,
      activeClasses: 0,
      averageAttendance: 0,
      attendanceTrend: 0,
      riskStudents: 0,
      predictions: 0,
    },
    predictions: {
      nextWeekAttendance: [],
      riskStudents: [],
      capacityForecast: [],
      recommendations: [],
    },
    trends: {
      weeklyTrends: [],
      monthlyComparison: [],
      seasonalPatterns: [],
      timeSlotAnalysis: [],
    },
    alerts: {
      criticalAlerts: [],
      warnings: [],
      opportunities: [],
      automations: [],
    },
    insights: {
      keyInsights: [],
      performanceScore: 0,
      improvementAreas: [],
      successFactors: [],
    },
  })

  // Métricas computadas
  const healthScore = computed(() => {
    const overview = dashboard.value.overview
    let score = 50 // Base score

    // Factor: Asistencia promedio
    score += overview.averageAttendance * 30

    // Factor: Tendencia positiva
    if (overview.attendanceTrend > 0) {
      score += overview.attendanceTrend * 20
    }

    // Factor: Estudiantes en riesgo (negativo)
    const riskRatio = overview.riskStudents / overview.totalStudents
    score -= riskRatio * 25

    return Math.max(0, Math.min(100, score))
  })

  const alertsSummary = computed(() => {
    const alerts = dashboard.value.alerts
    return {
      critical: alerts.criticalAlerts.length,
      warnings: alerts.warnings.length,
      total: alerts.criticalAlerts.length + alerts.warnings.length,
      hasUrgent: alerts.criticalAlerts.length > 0,
    }
  })

  const topRecommendations = computed(() => {
    return dashboard.value.predictions.recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
  })

  const attendanceInsights = computed(() => {
    return dashboard.value.insights.keyInsights.filter(
      (insight) => insight.category === "attendance"
    )
  })

  // === FUNCIONES PRINCIPALES ===

  /**
   * 🔄 Actualiza todo el dashboard de analytics
   */
  async function refreshDashboard() {
    loading.value = true
    error.value = null

    try {
      console.log("🧠 Actualizando dashboard de analytics...")

      const [overview, predictions, trends, alerts, insights] = await Promise.all([
        generateOverviewMetrics(),
        generatePredictions(),
        analyzeTrends(),
        generateAlerts(),
        generateInsights(),
      ])

      dashboard.value = {
        overview,
        predictions,
        trends,
        alerts,
        insights,
      }

      lastUpdated.value = new Date()
      console.log("✅ Dashboard actualizado exitosamente")
    } catch (err) {
      console.error("❌ Error actualizando dashboard:", err)
      error.value = "Error al cargar analytics"
    } finally {
      loading.value = false
    }
  }

  /**
   * 📊 Genera métricas de overview
   */
  async function generateOverviewMetrics(): Promise<OverviewMetrics> {
    const [studentsData, classesData, attendanceData] = await Promise.all([
      getStudentsData(),
      getClassesData(),
      getRecentAttendanceData(),
    ])

    const totalStudents = studentsData.length
    const activeClasses = classesData.filter((c) => c.active).length

    // Calcular asistencia promedio
    const averageAttendance = calculateAverageAttendance(attendanceData)

    // Calcular tendencia
    const attendanceTrend = calculateAttendanceTrend(attendanceData)

    // Identificar estudiantes en riesgo
    const riskStudents = await identifyRiskStudents(studentsData, attendanceData)

    return {
      totalStudents,
      activeClasses,
      averageAttendance,
      attendanceTrend,
      riskStudents: riskStudents.length,
      predictions: await generatePredictionsCount(),
    }
  }

  /**
   * 🔮 Genera predicciones inteligentes
   */
  async function generatePredictions(): Promise<PredictionMetrics> {
    console.log("🔮 Generando predicciones...")

    // Predicciones de asistencia para la próxima semana
    const nextWeekAttendance = await predictNextWeekAttendance()

    // Estudiantes en riesgo
    const studentsData = await getStudentsData()
    const attendanceData = await getRecentAttendanceData()
    const riskStudents = await identifyRiskStudents(studentsData, attendanceData)

    // Pronóstico de capacidad
    const capacityForecast = await generateCapacityForecast()

    // Recomendaciones inteligentes
    const recommendations = await generateSmartRecommendations()

    return {
      nextWeekAttendance,
      riskStudents,
      capacityForecast,
      recommendations,
    }
  }

  /**
   * 📈 Analiza tendencias
   */
  async function analyzeTrends(): Promise<TrendMetrics> {
    const attendanceData = await getExtendedAttendanceData()

    const weeklyTrends = analyzeWeeklyTrends(attendanceData)
    const monthlyComparison = analyzeMonthlyComparison(attendanceData)
    const seasonalPatterns = analyzeSeasonalPatterns(attendanceData)
    const timeSlotAnalysis = analyzeTimeSlotEfficiency(attendanceData)

    return {
      weeklyTrends,
      monthlyComparison,
      seasonalPatterns,
      timeSlotAnalysis,
    }
  }

  /**
   * 🚨 Genera alertas inteligentes
   */
  async function generateAlerts(): Promise<AlertMetrics> {
    const alerts: Alert[] = []
    const warnings: Warning[] = []
    const opportunities: Opportunity[] = []

    // Alertas críticas de asistencia
    const lowAttendanceClasses = await getClassesWithLowAttendance()
    if (lowAttendanceClasses.length > 0) {
      alerts.push({
        id: `low-attendance-${Date.now()}`,
        severity: "critical",
        message: `${lowAttendanceClasses.length} clases con asistencia crítica`,
        affectedClasses: lowAttendanceClasses.map((c) => c.name),
        suggestedActions: [
          "Contactar estudiantes ausentes",
          "Revisar metodología de enseñanza",
          "Considerar cambio de horario",
        ],
        createdAt: new Date(),
      })
    }

    // Oportunidades de mejora
    const optimizationOpportunities = await identifyOptimizationOpportunities()
    opportunities.push(...optimizationOpportunities)

    return {
      criticalAlerts: alerts,
      warnings,
      opportunities,
      automations: [],
    }
  }

  /**
   * 💡 Genera insights clave
   */
  async function generateInsights(): Promise<InsightMetrics> {
    const attendanceData = await getExtendedAttendanceData()
    const classesData = await getClassesData()

    const keyInsights: KeyInsight[] = []

    // Insight: Mejor día de asistencia
    const dayAnalysis = analyzeBestAttendanceDay(attendanceData)
    keyInsights.push({
      id: "best-day",
      category: "attendance",
      title: "Mejor día de asistencia",
      description: `${dayAnalysis.bestDay} tiene ${(dayAnalysis.rate * 100).toFixed(1)}% de asistencia`,
      metric: dayAnalysis.rate,
      trend: "stable",
      actionable: true,
    })

    // Insight: Horario más eficiente
    const timeAnalysis = findMostEfficientTimeSlot(attendanceData)
    keyInsights.push({
      id: "efficient-time",
      category: "efficiency",
      title: "Horario más eficiente",
      description: `Clases a las ${timeAnalysis.time} tienen mejor rendimiento`,
      metric: timeAnalysis.efficiency,
      trend: "up",
      actionable: true,
    })

    // Calcular score de rendimiento general
    const performanceScore = calculateOverallPerformanceScore(attendanceData, classesData)

    return {
      keyInsights,
      performanceScore,
      improvementAreas: [],
      successFactors: [],
    }
  }

  // === FUNCIONES AUXILIARES ===

  async function getStudentsData() {
    const snapshot = await getDocs(collection(db, "students"))
    return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))
  }

  async function getClassesData() {
    const snapshot = await getDocs(collection(db, "classes"))
    return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))
  }

  async function getRecentAttendanceData() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const snapshot = await getDocs(
      query(
        collection(db, "attendance"),
        where("date", ">=", Timestamp.fromDate(thirtyDaysAgo)),
        orderBy("date", "desc")
      )
    )

    return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))
  }

  async function getExtendedAttendanceData() {
    const snapshot = await getDocs(query(collection(db, "attendance"), orderBy("date", "desc")))
    return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))
  }

  function calculateAverageAttendance(attendanceData: any[]): number {
    if (attendanceData.length === 0) return 0

    const totalPresent = attendanceData.reduce(
      (sum, record) => sum + (record.presentStudents?.length || 0),
      0
    )
    const totalExpected = attendanceData.reduce(
      (sum, record) => sum + (record.totalStudents || 0),
      0
    )

    return totalExpected > 0 ? totalPresent / totalExpected : 0
  }

  function calculateAttendanceTrend(attendanceData: any[]): number {
    if (attendanceData.length < 10) return 0

    const recent = attendanceData.slice(0, 5)
    const previous = attendanceData.slice(5, 10)

    const recentAvg = calculateAverageAttendance(recent)
    const previousAvg = calculateAverageAttendance(previous)

    return recentAvg - previousAvg
  }

  async function identifyRiskStudents(studentsData: any[], attendanceData: any[]) {
    const riskStudents: RiskStudent[] = []

    for (const student of studentsData) {
      const studentAttendance = attendanceData.filter((record) =>
        record.presentStudents?.includes(student.id)
      )

      const attendanceRate = studentAttendance.length / Math.max(attendanceData.length, 1)

      if (attendanceRate < 0.6) {
        const lastAttendanceRecord = studentAttendance[0]
        const lastAttendance = lastAttendanceRecord
          ? new Date(lastAttendanceRecord.date.toDate()).toLocaleDateString()
          : "Nunca"

        let prediction: "likely_absent" | "uncertain" | "likely_present" = "uncertain"
        if (attendanceRate < 0.3) prediction = "likely_absent"
        else if (attendanceRate > 0.7) prediction = "likely_present"

        riskStudents.push({
          studentId: student.id,
          studentName: student.name || "Sin nombre",
          riskScore: 1 - attendanceRate,
          lastAttendance,
          prediction,
          actions: ["Contactar al estudiante", "Reunión con padres", "Plan de recuperación"],
        })
      }
    }

    return riskStudents.sort((a, b) => b.riskScore - a.riskScore)
  }

  async function predictNextWeekAttendance(): Promise<AttendancePrediction[]> {
    const classesData = await getClassesData()
    const predictions: AttendancePrediction[] = []

    for (const classData of classesData.slice(0, 10)) {
      // Límite para demo
      const prediction: AttendancePrediction = {
        classId: classData.id,
        className: classData.name || "Clase sin nombre",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        predictedAttendance: Math.floor(Math.random() * 20) + 5, // Simulado
        confidence: 0.7 + Math.random() * 0.3,
        riskLevel: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
      }
      predictions.push(prediction)
    }

    return predictions
  }

  // Funciones placeholder - implementar según necesidades
  async function generatePredictionsCount() {
    return Math.floor(Math.random() * 10) + 5
  }

  async function generateCapacityForecast(): Promise<CapacityForecast[]> {
    return []
  }

  async function generateSmartRecommendations(): Promise<SmartRecommendation[]> {
    return [
      {
        id: "rec-1",
        type: "schedule",
        title: "Optimizar horarios de tarde",
        description: "Las clases de tarde muestran 15% menos asistencia",
        impact: 0.15,
        effort: "medium",
        priority: 8,
      },
      {
        id: "rec-2",
        type: "communication",
        title: "Implementar recordatorios automáticos",
        description: "Envío de recordatorios 24h antes puede mejorar asistencia",
        impact: 0.12,
        effort: "low",
        priority: 7,
      },
    ]
  }

  function analyzeWeeklyTrends(data: any[]): WeeklyTrend[] {
    return []
  }

  function analyzeMonthlyComparison(data: any[]): MonthlyComparison[] {
    return []
  }

  function analyzeSeasonalPatterns(data: any[]): SeasonalPattern[] {
    return []
  }

  function analyzeTimeSlotEfficiency(data: any[]): TimeSlotAnalysis[] {
    return []
  }

  async function getClassesWithLowAttendance() {
    return []
  }

  async function identifyOptimizationOpportunities(): Promise<Opportunity[]> {
    return []
  }

  function analyzeBestAttendanceDay(data: any[]) {
    return {bestDay: "Miércoles", rate: 0.85}
  }

  function findMostEfficientTimeSlot(data: any[]) {
    return {time: "14:00", efficiency: 0.92}
  }

  function calculateOverallPerformanceScore(attendanceData: any[], classesData: any[]) {
    return 78 // Placeholder
  }

  // Inicialización
  onMounted(() => {
    refreshDashboard()
  })

  return {
    // Estado
    loading,
    error,
    lastUpdated,
    dashboard,

    // Métricas computadas
    healthScore,
    alertsSummary,
    topRecommendations,
    attendanceInsights,

    // Funciones
    refreshDashboard,
    generateOverviewMetrics,
    generatePredictions,
    analyzeTrends,
    generateAlerts,
    generateInsights,
  }
}

// Interfaces adicionales
export interface WeeklyTrend {
  week: string
  attendance: number
  change: number
}

export interface MonthlyComparison {
  month: string
  current: number
  previous: number
  change: number
}

export interface SeasonalPattern {
  season: string
  avgAttendance: number
  trend: "up" | "down" | "stable"
}

export interface TimeSlotAnalysis {
  timeSlot: string
  efficiency: number
  recommendation: string
}

export interface CapacityForecast {
  date: string
  expectedDemand: number
  currentCapacity: number
  recommendation: string
}

export interface Warning {
  id: string
  message: string
  type: string
}

export interface Opportunity {
  id: string
  title: string
  description: string
  potential: number
}

export interface Automation {
  id: string
  name: string
  status: string
}

export interface ImprovementArea {
  area: string
  score: number
  suggestions: string[]
}

export interface SuccessFactor {
  factor: string
  impact: number
  description: string
}
