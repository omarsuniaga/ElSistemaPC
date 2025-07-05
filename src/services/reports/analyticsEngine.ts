// src/services/reports/analyticsEngine.ts
import {format, subDays, startOfWeek, endOfWeek, eachDayOfInterval} from "date-fns"
import {es} from "date-fns/locale"

export interface AnalyticsData {
  studentId: string
  studentName: string
  className: string
  teacherName: string
  date: Date
  status: "presente" | "ausente" | "tardanza" | "justificada"
  arrivalTime?: string
  notificationsSent: number
  escalationLevel: number
}

export interface PatternAnalysis {
  type: "absence_pattern" | "lateness_pattern" | "class_pattern" | "temporal_pattern"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  affectedStudents: string[]
  affectedClasses: string[]
  recommendations: string[]
  confidence: number
}

export interface TrendAnalysis {
  metric: string
  direction: "improving" | "stable" | "declining"
  magnitude: number
  timeframe: string
  significance: "low" | "medium" | "high"
  projectedValue: number
  confidence: number
}

export interface PredictiveInsight {
  type: "risk_prediction" | "dropout_risk" | "performance_forecast"
  targetStudents: string[]
  probability: number
  timeframe: string
  factors: string[]
  preventiveActions: string[]
}

export interface BenchmarkData {
  metric: string
  currentValue: number
  benchmarkValue: number
  percentile: number
  status: "above" | "at" | "below"
  improvement: number
}

export class AnalyticsEngine {
  private data: AnalyticsData[]
  private patterns: PatternAnalysis[]
  private trends: TrendAnalysis[]
  private insights: PredictiveInsight[]

  constructor() {
    this.data = []
    this.patterns = []
    this.trends = []
    this.insights = []
  }

  /**
   * Inicializa el motor con datos de asistencia
   */
  initializeWithData(attendanceData: AnalyticsData[]): void {
    this.data = attendanceData.sort((a, b) => a.date.getTime() - b.date.getTime())
    this.analyzePatterns()
    this.analyzeTrends()
    this.generatePredictiveInsights()
  }

  /**
   * Analiza patrones de comportamiento en los datos
   */
  private analyzePatterns(): void {
    this.patterns = []

    // Patrón de ausencias frecuentes
    this.detectAbsencePatterns()

    // Patrón de tardanzas habituales
    this.detectLatenessPatterns()

    // Patrones por clase
    this.detectClassPatterns()

    // Patrones temporales (días específicos, horarios)
    this.detectTemporalPatterns()
  }

  /**
   * Detecta patrones de ausencias
   */
  private detectAbsencePatterns(): void {
    const studentAbsences = this.groupByStudent()

    Object.entries(studentAbsences).forEach(([studentId, records]) => {
      const absenceCount = records.filter((r) => r.status === "ausente").length
      const totalClasses = records.length
      const absenceRate = absenceCount / totalClasses

      if (absenceRate > 0.3) {
        // Más del 30% de ausencias
        const consecutiveAbsences = this.findConsecutiveAbsences(records)

        this.patterns.push({
          type: "absence_pattern",
          severity: absenceRate > 0.5 ? "critical" : "high",
          description: `${records[0].studentName} tiene un patrón de ausencias frecuentes (${(absenceRate * 100).toFixed(1)}%)`,
          affectedStudents: [studentId],
          affectedClasses: [...new Set(records.map((r) => r.className))],
          recommendations: this.generateAbsenceRecommendations(absenceRate, consecutiveAbsences),
          confidence: Math.min(absenceRate * 2, 0.95),
        })
      }
    })
  }

  /**
   * Detecta patrones de tardanzas
   */
  private detectLatenessPatterns(): void {
    const studentData = this.groupByStudent()

    Object.entries(studentData).forEach(([studentId, records]) => {
      const attendedClasses = records.filter(
        (r) => r.status === "presente" || r.status === "tardanza"
      )
      const lateArrivals = records.filter((r) => r.status === "tardanza")
      const latenessRate = lateArrivals.length / attendedClasses.length

      if (latenessRate > 0.2 && attendedClasses.length > 5) {
        // Más del 20% llega tarde
        // Analizar patrones de días de la semana
        const dayPattern = this.analyzeDayPattern(lateArrivals)

        this.patterns.push({
          type: "lateness_pattern",
          severity: latenessRate > 0.4 ? "high" : "medium",
          description: `${records[0].studentName} muestra un patrón de tardanzas recurrentes (${(latenessRate * 100).toFixed(1)}%)`,
          affectedStudents: [studentId],
          affectedClasses: [...new Set(records.map((r) => r.className))],
          recommendations: this.generateLatenessRecommendations(dayPattern),
          confidence: Math.min(latenessRate * 1.5, 0.9),
        })
      }
    })
  }

  /**
   * Detecta patrones por clase
   */
  private detectClassPatterns(): void {
    const classData = this.groupByClass()

    Object.entries(classData).forEach(([className, records]) => {
      const totalStudents = new Set(records.map((r) => r.studentId)).size
      const absenceRate = records.filter((r) => r.status === "ausente").length / records.length
      const latenessRate = records.filter((r) => r.status === "tardanza").length / records.length

      if (absenceRate > 0.25 || latenessRate > 0.3) {
        this.patterns.push({
          type: "class_pattern",
          severity: absenceRate > 0.4 ? "critical" : "high",
          description: `La clase ${className} muestra patrones problemáticos de asistencia`,
          affectedStudents: [...new Set(records.map((r) => r.studentId))],
          affectedClasses: [className],
          recommendations: this.generateClassRecommendations(
            absenceRate,
            latenessRate,
            totalStudents
          ),
          confidence: 0.8,
        })
      }
    })
  }

  /**
   * Detecta patrones temporales
   */
  private detectTemporalPatterns(): void {
    // Análisis por día de la semana
    const dayAnalysis = this.analyzeDayOfWeekPatterns()

    dayAnalysis.forEach((pattern) => {
      if (pattern.significance === "high") {
        this.patterns.push({
          type: "temporal_pattern",
          severity: "medium",
          description: pattern.description,
          affectedStudents: pattern.affectedStudents,
          affectedClasses: pattern.affectedClasses,
          recommendations: pattern.recommendations,
          confidence: pattern.confidence,
        })
      }
    })
  }

  /**
   * Analiza tendencias temporales
   */
  private analyzeTrends(): void {
    this.trends = []

    // Tendencia de asistencia general
    this.analyzeTrend("attendance_rate", "Tasa de Asistencia")

    // Tendencia de puntualidad
    this.analyzeTrend("punctuality_rate", "Tasa de Puntualidad")

    // Tendencia de notificaciones
    this.analyzeTrend("notification_effectiveness", "Efectividad de Notificaciones")

    // Tendencia de escalaciones
    this.analyzeTrend("escalation_frequency", "Frecuencia de Escalaciones")
  }

  /**
   * Analiza una tendencia específica
   */
  private analyzeTrend(metricType: string, metricName: string): void {
    const weeklyData = this.aggregateByWeek(metricType)

    if (weeklyData.length < 3) return // Necesitamos al menos 3 semanas de datos

    const trend = this.calculateTrendDirection(weeklyData)
    const magnitude = this.calculateTrendMagnitude(weeklyData)
    const significance = this.calculateTrendSignificance(weeklyData)

    this.trends.push({
      metric: metricName,
      direction: trend.direction,
      magnitude,
      timeframe: `${weeklyData.length} semanas`,
      significance,
      projectedValue: trend.projectedValue,
      confidence: trend.confidence,
    })
  }

  /**
   * Genera insights predictivos
   */
  private generatePredictiveInsights(): void {
    this.insights = []

    // Predicción de riesgo de abandono
    this.predictDropoutRisk()

    // Predicción de rendimiento futuro
    this.predictPerformanceTrends()

    // Predicción de efectividad de intervenciones
    this.predictInterventionEffectiveness()
  }

  /**
   * Predice riesgo de abandono
   */
  private predictDropoutRisk(): void {
    const riskFactors = this.calculateRiskFactors()

    Object.entries(riskFactors).forEach(([studentId, factors]) => {
      const riskScore = this.calculateRiskScore(factors)

      if (riskScore > 0.7) {
        const student = this.data.find((r) => r.studentId === studentId)

        this.insights.push({
          type: "dropout_risk",
          targetStudents: [studentId],
          probability: riskScore,
          timeframe: "próximas 4 semanas",
          factors: this.identifyPrimaryFactors(factors),
          preventiveActions: this.generatePreventiveActions(factors),
        })
      }
    })
  }

  /**
   * Métodos auxiliares para análisis
   */
  private groupByStudent(): Record<string, AnalyticsData[]> {
    return this.data.reduce(
      (acc, record) => {
        if (!acc[record.studentId]) {
          acc[record.studentId] = []
        }
        acc[record.studentId].push(record)
        return acc
      },
      {} as Record<string, AnalyticsData[]>
    )
  }

  private groupByClass(): Record<string, AnalyticsData[]> {
    return this.data.reduce(
      (acc, record) => {
        if (!acc[record.className]) {
          acc[record.className] = []
        }
        acc[record.className].push(record)
        return acc
      },
      {} as Record<string, AnalyticsData[]>
    )
  }

  private findConsecutiveAbsences(records: AnalyticsData[]): number {
    const sortedRecords = records.sort((a, b) => a.date.getTime() - b.date.getTime())
    let maxConsecutive = 0
    let current = 0

    sortedRecords.forEach((record) => {
      if (record.status === "ausente") {
        current++
        maxConsecutive = Math.max(maxConsecutive, current)
      } else {
        current = 0
      }
    })

    return maxConsecutive
  }

  private analyzeDayPattern(records: AnalyticsData[]): Record<string, number> {
    const dayCount = records.reduce(
      (acc, record) => {
        const day = format(record.date, "EEEE", {locale: es})
        acc[day] = (acc[day] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return dayCount
  }

  private analyzeDayOfWeekPatterns(): any[] {
    const dayData = this.data.reduce(
      (acc, record) => {
        const day = format(record.date, "EEEE", {locale: es})
        if (!acc[day]) {
          acc[day] = {total: 0, absent: 0, late: 0}
        }
        acc[day].total++
        if (record.status === "ausente") acc[day].absent++
        if (record.status === "tardanza") acc[day].late++
        return acc
      },
      {} as Record<string, any>
    )

    return Object.entries(dayData).map(([day, stats]) => ({
      day,
      absenceRate: stats.absent / stats.total,
      latenessRate: stats.late / stats.total,
      significance: this.calculateDaySignificance(stats),
      description: `Los ${day}s muestran patrones específicos de asistencia`,
      affectedStudents: [],
      affectedClasses: [],
      recommendations: [`Revisar horarios y actividades para los ${day}s`],
      confidence: 0.7,
    }))
  }

  private aggregateByWeek(metricType: string): number[] {
    const weeks: Record<string, any> = {}

    this.data.forEach((record) => {
      const weekStart = format(startOfWeek(record.date), "yyyy-MM-dd")
      if (!weeks[weekStart]) {
        weeks[weekStart] = {total: 0, present: 0, late: 0, notifications: 0}
      }

      weeks[weekStart].total++
      if (record.status === "presente" || record.status === "tardanza") {
        weeks[weekStart].present++
      }
      if (record.status === "presente") {
        weeks[weekStart].late++
      }
      weeks[weekStart].notifications += record.notificationsSent
    })

    return Object.values(weeks).map((week) => {
      switch (metricType) {
        case "attendance_rate":
          return week.present / week.total
        case "punctuality_rate":
          return week.late / week.present
        case "notification_effectiveness":
          return week.present / (week.notifications || 1)
        default:
          return 0
      }
    })
  }

  private calculateTrendDirection(data: number[]): {
    direction: "improving" | "stable" | "declining"
    projectedValue: number
    confidence: number
  } {
    const linearRegression = this.simpleLinearRegression(data)
    const slope = linearRegression.slope

    let direction: "improving" | "stable" | "declining"
    if (Math.abs(slope) < 0.01) {
      direction = "stable"
    } else if (slope > 0) {
      direction = "improving"
    } else {
      direction = "declining"
    }

    return {
      direction,
      projectedValue: linearRegression.predict(data.length),
      confidence: linearRegression.rSquared,
    }
  }

  private simpleLinearRegression(data: number[]): {
    slope: number
    intercept: number
    rSquared: number
    predict: (x: number) => number
  } {
    const n = data.length
    const sumX = data.reduce((sum, _, i) => sum + i, 0)
    const sumY = data.reduce((sum, y) => sum + y, 0)
    const sumXY = data.reduce((sum, y, i) => sum + i * y, 0)
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calcular R²
    const yMean = sumY / n
    const totalSumSquares = data.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
    const residualSumSquares = data.reduce((sum, y, i) => {
      const predicted = slope * i + intercept
      return sum + Math.pow(y - predicted, 2)
    }, 0)
    const rSquared = 1 - residualSumSquares / totalSumSquares

    return {
      slope,
      intercept,
      rSquared: Math.max(0, Math.min(1, rSquared)),
      predict: (x: number) => slope * x + intercept,
    }
  }

  private calculateTrendMagnitude(data: number[]): number {
    const first = data[0]
    const last = data[data.length - 1]
    return Math.abs(last - first) / first
  }

  private calculateTrendSignificance(data: number[]): "low" | "medium" | "high" {
    const magnitude = this.calculateTrendMagnitude(data)
    const regression = this.simpleLinearRegression(data)

    if (magnitude > 0.2 && regression.rSquared > 0.7) return "high"
    if (magnitude > 0.1 && regression.rSquared > 0.5) return "medium"
    return "low"
  }

  private calculateDaySignificance(stats: any): "low" | "medium" | "high" {
    const absenceRate = stats.absent / stats.total
    const latenessRate = stats.late / stats.total

    if (absenceRate > 0.3 || latenessRate > 0.4) return "high"
    if (absenceRate > 0.2 || latenessRate > 0.3) return "medium"
    return "low"
  }

  private calculateRiskFactors(): Record<string, any> {
    const studentData = this.groupByStudent()
    const riskFactors: Record<string, any> = {}

    Object.entries(studentData).forEach(([studentId, records]) => {
      const recent = records.slice(-10) // Últimos 10 registros
      const absenceRate = records.filter((r) => r.status === "ausente").length / records.length
      const latenessRate = records.filter((r) => r.status === "tardanza").length / records.length
      const escalationLevel = Math.max(...records.map((r) => r.escalationLevel))
      const consecutiveAbsences = this.findConsecutiveAbsences(recent)

      riskFactors[studentId] = {
        absenceRate,
        latenessRate,
        escalationLevel,
        consecutiveAbsences,
        totalClasses: records.length,
        recentTrend: this.calculateRecentTrend(recent),
      }
    })

    return riskFactors
  }

  private calculateRiskScore(factors: any): number {
    let score = 0

    // Peso por tasa de ausencias
    score += factors.absenceRate * 0.4

    // Peso por tardanzas
    score += factors.latenessRate * 0.2

    // Peso por nivel de escalación
    score += (factors.escalationLevel / 4) * 0.2

    // Peso por ausencias consecutivas
    score += Math.min(factors.consecutiveAbsences / 5, 1) * 0.15

    // Peso por tendencia reciente
    if (factors.recentTrend === "declining") score += 0.15
    else if (factors.recentTrend === "improving") score -= 0.05

    return Math.max(0, Math.min(1, score))
  }

  private calculateRecentTrend(records: AnalyticsData[]): "improving" | "stable" | "declining" {
    if (records.length < 5) return "stable"

    const attendanceData = records.map((r) =>
      r.status === "presente" || r.status === "tardanza" ? 1 : 0
    )
    const trend = this.calculateTrendDirection(attendanceData)

    return trend.direction
  }

  private identifyPrimaryFactors(factors: any): string[] {
    const primaryFactors = []

    if (factors.absenceRate > 0.3) primaryFactors.push("Alta tasa de ausencias")
    if (factors.latenessRate > 0.2) primaryFactors.push("Tardanzas frecuentes")
    if (factors.escalationLevel >= 3) primaryFactors.push("Nivel de escalación alto")
    if (factors.consecutiveAbsences >= 3) primaryFactors.push("Ausencias consecutivas")
    if (factors.recentTrend === "declining") primaryFactors.push("Tendencia descendente reciente")

    return primaryFactors
  }

  /**
   * Métodos de generación de recomendaciones
   */
  private generateAbsenceRecommendations(
    absenceRate: number,
    consecutiveAbsences: number
  ): string[] {
    const recommendations = []

    if (absenceRate > 0.5) {
      recommendations.push("Reunión urgente con padres/tutores")
      recommendations.push("Evaluación de circunstancias familiares")
    }

    if (consecutiveAbsences >= 3) {
      recommendations.push("Contacto inmediato con la familia")
      recommendations.push("Plan de reintegración personalizado")
    }

    recommendations.push("Seguimiento semanal de asistencia")
    recommendations.push("Apoyo psicopedagógico si es necesario")

    return recommendations
  }

  private generateLatenessRecommendations(dayPattern: Record<string, number>): string[] {
    const recommendations = []
    const mostProblematicDay = Object.entries(dayPattern).sort((a, b) => b[1] - a[1])[0]

    recommendations.push(
      `Revisar horarios de transporte, especialmente para los ${mostProblematicDay[0]}`
    )
    recommendations.push("Establecer recordatorios preventivos")
    recommendations.push("Evaluar rutinas matutinas familiares")
    recommendations.push("Considerar flexibilidad de horarios si es apropiado")

    return recommendations
  }

  private generateClassRecommendations(
    absenceRate: number,
    latenessRate: number,
    totalStudents: number
  ): string[] {
    const recommendations = []

    if (absenceRate > 0.3) {
      recommendations.push("Revisar metodología y contenido de la clase")
      recommendations.push("Encuesta de satisfacción a estudiantes y padres")
      recommendations.push("Capacitación adicional para el profesor")
    }

    if (latenessRate > 0.3) {
      recommendations.push("Revisar horarios de la clase")
      recommendations.push("Mejorar sistema de recordatorios")
    }

    recommendations.push("Implementar actividades de engagement")
    recommendations.push("Seguimiento individualizado por estudiante")

    return recommendations
  }

  private generatePreventiveActions(factors: any): string[] {
    const actions = []

    if (factors.absenceRate > 0.4) {
      actions.push("Implementar plan de seguimiento intensivo")
      actions.push("Asignar mentor estudiantil")
    }

    if (factors.escalationLevel >= 3) {
      actions.push("Intervención familiar inmediata")
      actions.push("Evaluación de necesidades especiales")
    }

    actions.push("Establecer metas de asistencia específicas")
    actions.push("Programa de incentivos personalizados")
    actions.push("Seguimiento bisemanal de progreso")

    return actions
  }

  private predictPerformanceTrends(): void {
    // Implementar predicción de tendencias de rendimiento
  }

  private predictInterventionEffectiveness(): void {
    // Implementar predicción de efectividad de intervenciones
  }

  /**
   * Métodos públicos para acceso a resultados
   */
  getPatterns(): PatternAnalysis[] {
    return this.patterns
  }

  getTrends(): TrendAnalysis[] {
    return this.trends
  }

  getPredictiveInsights(): PredictiveInsight[] {
    return this.insights
  }

  /**
   * Genera benchmarks comparativos
   */
  generateBenchmarks(
    currentData: AnalyticsData[],
    benchmarkData?: AnalyticsData[]
  ): BenchmarkData[] {
    const benchmarks: BenchmarkData[] = []

    // Benchmark de asistencia general
    const currentAttendanceRate = this.calculateAttendanceRate(currentData)
    const benchmarkAttendanceRate = benchmarkData
      ? this.calculateAttendanceRate(benchmarkData)
      : 0.92 // Benchmark estándar de la industria

    benchmarks.push({
      metric: "Tasa de Asistencia",
      currentValue: currentAttendanceRate,
      benchmarkValue: benchmarkAttendanceRate,
      percentile: this.calculatePercentile(currentAttendanceRate, benchmarkAttendanceRate),
      status: currentAttendanceRate >= benchmarkAttendanceRate ? "above" : "below",
      improvement:
        ((currentAttendanceRate - benchmarkAttendanceRate) / benchmarkAttendanceRate) * 100,
    })

    // Más benchmarks...

    return benchmarks
  }

  private calculateAttendanceRate(data: AnalyticsData[]): number {
    const attended = data.filter((r) => r.status === "presente" || r.status === "tardanza").length
    return attended / data.length
  }

  private calculatePercentile(current: number, benchmark: number): number {
    return Math.round((current / benchmark) * 100)
  }
}

// Instancia singleton
export const analyticsEngine = new AnalyticsEngine()
