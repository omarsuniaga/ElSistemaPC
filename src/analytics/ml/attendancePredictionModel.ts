/**
 * 🧠 MODELO DE PREDICCIÓN DE ASISTENCIA
 * Sistema de Machine Learning para predecir patrones de asistencia
 */

import {AttendanceRecord} from "@/types/attendance"
import {Student} from "@/types/students"
import {useAttendanceStore} from "@/modulos/Attendance/store/attendance"
import {useClassesStore} from "@/modulos/Classes/store/classes"

export interface PredictionInput {
  studentId: string
  classId: string
  date: Date
  dayOfWeek: number
  month: number
  seasonality: "vacation" | "school" | "holidays"
  previousAttendanceRate: number
  avgClassSize: number
  teacherId: string
  timeSlot: string
}

export interface AttendancePrediction {
  studentId: string
  classId: string
  predictedDate: Date
  attendanceProbability: number
  confidence: number
  factors: PredictionFactor[]
  risk: "low" | "medium" | "high"
  recommendations: string[]
}

export interface PredictionFactor {
  factor: string
  impact: number
  description: string
}

export class AttendancePredictionModel {
  private trainingData: AttendanceRecord[] = []
  private modelWeights: ModelWeights = {
    dayOfWeek: 0.15,
    timeSlot: 0.12,
    previousRate: 0.35,
    seasonality: 0.18,
    classSize: 0.08,
    teacher: 0.12,
  }

  /**
   * 🎯 Entrena el modelo con datos históricos
   */
  async trainModel(attendanceHistory: AttendanceRecord[]): Promise<void> {
    console.log("🧠 Entrenando modelo de predicción de asistencia...")

    this.trainingData = attendanceHistory

    // Análisis de patrones por día de la semana
    const dayPatterns = this.analyzeDayPatterns(attendanceHistory)

    // Análisis de patrones estacionales
    const seasonalPatterns = this.analyzeSeasonalPatterns(attendanceHistory)

    // Análisis de patrones por maestro
    const teacherPatterns = this.analyzeTeacherPatterns(attendanceHistory)

    // Actualizar pesos del modelo basado en análisis
    this.updateModelWeights(dayPatterns, seasonalPatterns, teacherPatterns)

    console.log("✅ Modelo entrenado exitosamente")
    console.log("📊 Pesos del modelo:", this.modelWeights)
  }

  /**
   * 🔮 Predice la probabilidad de asistencia
   */
  predictAttendance(input: PredictionInput): AttendancePrediction {
    const factors: PredictionFactor[] = []
    let probability = 0.5 // Base probability

    // Factor: Día de la semana
    const dayFactor = this.getDayOfWeekFactor(input.dayOfWeek)
    probability += dayFactor * this.modelWeights.dayOfWeek
    factors.push({
      factor: "Día de la semana",
      impact: dayFactor,
      description: this.getDayDescription(input.dayOfWeek, dayFactor),
    })

    // Factor: Historial de asistencia
    const historyFactor = this.getHistoryFactor(input.previousAttendanceRate)
    probability += historyFactor * this.modelWeights.previousRate
    factors.push({
      factor: "Historial de asistencia",
      impact: historyFactor,
      description: `Tasa previa: ${(input.previousAttendanceRate * 100).toFixed(1)}%`,
    })

    // Factor: Estacionalidad
    const seasonFactor = this.getSeasonalityFactor(input.seasonality, input.month)
    probability += seasonFactor * this.modelWeights.seasonality
    factors.push({
      factor: "Estacionalidad",
      impact: seasonFactor,
      description: this.getSeasonDescription(input.seasonality),
    })

    // Factor: Horario de clase
    const timeFactor = this.getTimeSlotFactor(input.timeSlot)
    probability += timeFactor * this.modelWeights.timeSlot
    factors.push({
      factor: "Horario de clase",
      impact: timeFactor,
      description: `Horario: ${input.timeSlot}`,
    })

    // Factor: Tamaño de clase
    const sizeFactor = this.getClassSizeFactor(input.avgClassSize)
    probability += sizeFactor * this.modelWeights.classSize
    factors.push({
      factor: "Tamaño de clase",
      impact: sizeFactor,
      description: `Promedio: ${input.avgClassSize} estudiantes`,
    })

    // Normalizar probabilidad
    probability = Math.max(0, Math.min(1, probability))

    const confidence = this.calculateConfidence(factors)
    const risk = this.calculateRisk(probability)
    const recommendations = this.generateRecommendations(probability, factors)

    return {
      studentId: input.studentId,
      classId: input.classId,
      predictedDate: input.date,
      attendanceProbability: probability,
      confidence,
      factors,
      risk,
      recommendations,
    }
  }

  /**
   * 🎯 Predice patrones para múltiples estudiantes
   */
  async predictBulkAttendance(
    students: Student[],
    classId: string,
    dates: Date[]
  ): Promise<AttendancePrediction[]> {
    const predictions: AttendancePrediction[] = []

    for (const student of students) {
      for (const date of dates) {
        const input: PredictionInput = {
          studentId: student.id,
          classId,
          date,
          dayOfWeek: date.getDay(),
          month: date.getMonth(),
          seasonality: this.getSeason(date),
          previousAttendanceRate: await this.getStudentAttendanceRate(student.id),
          avgClassSize: await this.getAverageClassSize(classId),
          teacherId: await this.getClassTeacher(classId),
          timeSlot: await this.getClassTimeSlot(classId),
        }

        predictions.push(this.predictAttendance(input))
      }
    }

    return predictions
  }

  /**
   * 📊 Analiza patrones por día de la semana
   */
  private analyzeDayPatterns(data: AttendanceRecord[]): Record<number, number> {
    const patterns: Record<number, number[]> = {}

    data.forEach((record) => {
      const day = new Date(record.date).getDay()
      if (!patterns[day]) patterns[day] = []
      patterns[day].push(record.isPresent ? 1 : 0)
    })

    const dayRates: Record<number, number> = {}
    Object.keys(patterns).forEach((day) => {
      const dayNum = parseInt(day)
      const rates = patterns[dayNum]
      dayRates[dayNum] = rates.reduce((a, b) => a + b, 0) / rates.length
    })

    return dayRates
  }

  /**
   * 🌟 Analiza patrones estacionales
   */
  private analyzeSeasonalPatterns(data: AttendanceRecord[]): Record<string, number> {
    const patterns: Record<string, number[]> = {
      vacation: [],
      school: [],
      holidays: [],
    }

    data.forEach((record) => {
      const season = this.getSeason(new Date(record.date))
      patterns[season].push(record.isPresent ? 1 : 0)
    })

    const seasonRates: Record<string, number> = {}
    Object.keys(patterns).forEach((season) => {
      const rates = patterns[season]
      if (rates.length > 0) {
        seasonRates[season] = rates.reduce((a, b) => a + b, 0) / rates.length
      }
    })

    return seasonRates
  }

  /**
   * 👨‍🏫 Analiza patrones por maestro
   */
  private analyzeTeacherPatterns(data: AttendanceRecord[]): Record<string, number> {
    // Implementación similar para análisis por maestro
    return {}
  }

  /**
   * ⚖️ Actualiza pesos del modelo
   */
  private updateModelWeights(
    dayPatterns: Record<number, number>,
    seasonalPatterns: Record<string, number>,
    teacherPatterns: Record<string, number>
  ): void {
    // Lógica para ajustar pesos basado en la varianza de los patrones
    const dayVariance = this.calculateVariance(Object.values(dayPatterns))
    const seasonVariance = this.calculateVariance(Object.values(seasonalPatterns))

    // Ajustar pesos basado en la importancia de cada factor
    if (dayVariance > 0.1) {
      this.modelWeights.dayOfWeek *= 1.2
    }
    if (seasonVariance > 0.15) {
      this.modelWeights.seasonality *= 1.3
    }

    // Normalizar pesos
    const totalWeight = Object.values(this.modelWeights).reduce((a, b) => a + b, 0)
    Object.keys(this.modelWeights).forEach((key) => {
      this.modelWeights[key as keyof ModelWeights] /= totalWeight
    })
  }

  /**
   * 📈 Calcula factor del día de la semana
   */
  private getDayOfWeekFactor(dayOfWeek: number): number {
    // Lunes a Viernes tienden a tener mejor asistencia
    const dayFactors = {
      0: -0.2, // Domingo
      1: 0.1, // Lunes
      2: 0.15, // Martes
      3: 0.2, // Miércoles
      4: 0.15, // Jueves
      5: 0.1, // Viernes
      6: -0.1, // Sábado
    }
    return dayFactors[dayOfWeek as keyof typeof dayFactors] || 0
  }

  /**
   * 📚 Calcula factor de historial
   */
  private getHistoryFactor(previousRate: number): number {
    // El historial previo es un fuerte predictor
    return (previousRate - 0.5) * 0.8
  }

  /**
   * 🌤️ Calcula factor estacional
   */
  private getSeasonalityFactor(seasonality: string, month: number): number {
    const factors = {
      school: 0.1,
      vacation: -0.3,
      holidays: -0.2,
    }
    return factors[seasonality as keyof typeof factors] || 0
  }

  /**
   * ⏰ Calcula factor de horario
   */
  private getTimeSlotFactor(timeSlot: string): number {
    const hour = parseInt(timeSlot.split(":")[0])

    // Mejores horarios entre 9 AM y 6 PM
    if (hour >= 9 && hour <= 18) {
      return 0.1
    } else if (hour < 8 || hour > 20) {
      return -0.2
    }
    return 0
  }

  /**
   * 👥 Calcula factor de tamaño de clase
   */
  private getClassSizeFactor(avgSize: number): number {
    // Clases de tamaño óptimo (8-15 estudiantes)
    if (avgSize >= 8 && avgSize <= 15) {
      return 0.05
    } else if (avgSize < 5) {
      return -0.1
    } else if (avgSize > 20) {
      return -0.15
    }
    return 0
  }

  /**
   * 🎯 Calcula nivel de confianza
   */
  private calculateConfidence(factors: PredictionFactor[]): number {
    const avgImpact = factors.reduce((sum, f) => sum + Math.abs(f.impact), 0) / factors.length
    return Math.min(0.95, 0.6 + avgImpact * 2)
  }

  /**
   * ⚠️ Calcula nivel de riesgo
   */
  private calculateRisk(probability: number): "low" | "medium" | "high" {
    if (probability >= 0.8) return "low"
    if (probability >= 0.5) return "medium"
    return "high"
  }

  /**
   * 💡 Genera recomendaciones
   */
  private generateRecommendations(probability: number, factors: PredictionFactor[]): string[] {
    const recommendations: string[] = []

    if (probability < 0.3) {
      recommendations.push("🚨 Riesgo alto de ausencia - contactar al estudiante")
      recommendations.push("📞 Enviar recordatorio personalizado")
    } else if (probability < 0.6) {
      recommendations.push("⚠️ Riesgo medio - enviar recordatorio preventivo")
    }

    // Recomendaciones específicas basadas en factores
    factors.forEach((factor) => {
      if (factor.impact < -0.1) {
        switch (factor.factor) {
          case "Día de la semana":
            recommendations.push("📅 Considerar cambio de horario a días con mejor asistencia")
            break
          case "Estacionalidad":
            recommendations.push(
              "🌟 Planificar actividades especiales para período de baja asistencia"
            )
            break
          case "Horario de clase":
            recommendations.push("⏰ Evaluar cambio a horario con mejor asistencia")
            break
        }
      }
    })

    return recommendations
  }

  /**
   * 🌅 Determina la estación/período
   */
  private getSeason(date: Date): "vacation" | "school" | "holidays" {
    const month = date.getMonth()

    // Vacaciones de verano (diciembre, enero, febrero)
    if (month === 11 || month === 0 || month === 1) {
      return "vacation"
    }

    // Feriados (julio, semana santa variable)
    if (month === 6) {
      return "holidays"
    }

    return "school"
  }

  /**
   * 📊 Calcula varianza de un conjunto de datos
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return variance
  }

  /**
   * 📝 Obtiene descripción del día
   */
  private getDayDescription(dayOfWeek: number, factor: number): string {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const impact = factor > 0 ? "positivo" : "negativo"
    return `${days[dayOfWeek]} tiene impacto ${impact} en asistencia`
  }

  /**
   * 🌤️ Obtiene descripción estacional
   */
  private getSeasonDescription(seasonality: string): string {
    const descriptions = {
      school: "Período escolar - asistencia típicamente estable",
      vacation: "Período de vacaciones - asistencia generalmente menor",
      holidays: "Período de feriados - asistencia variable",
    }
    return descriptions[seasonality as keyof typeof descriptions] || "Período no identificado"
  }

  // Métodos auxiliares para obtener datos
  private async getStudentAttendanceRate(studentId: string): Promise<number> {
    const attendanceStore = useAttendanceStore()
    // Usamos un rango de los últimos 90 días para calcular un historial relevante.
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 90)

    const records = await attendanceStore.getStudentAttendanceByDateRange(
      studentId,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    )

    if (records.length === 0) {
      return 0.75 // Retornar una tasa neutral si no hay historial
    }

    const presentCount = records.filter(
      (r) => r.status === "Presente" || r.status === "Tardanza"
    ).length
    return presentCount / records.length
  }

  private async getAverageClassSize(classId: string): Promise<number> {
    const classesStore = useClassesStore()
    const classData = classesStore.getClassById(classId)

    if (!classData || !classData.studentIds) {
      return 12 // Retornar un tamaño promedio si no se encuentra la clase
    }

    return classData.studentIds.length
  }

  private async getClassTeacher(classId: string): Promise<string> {
    const classesStore = useClassesStore()
    const classData = classesStore.getClassById(classId)

    return classData?.teacherId || "unknown-teacher"
  }

  private async getClassTimeSlot(classId: string): Promise<string> {
    const classesStore = useClassesStore()
    const classData = classesStore.getClassById(classId)

    if (classData?.schedule && Array.isArray(classData.schedule) && classData.schedule.length > 0) {
      // Devolvemos el horario del primer slot como representativo
      return classData.schedule[0].startTime || "14:00"
    }

    return "14:00" // Placeholder si no hay horario definido
  }
}

interface ModelWeights {
  dayOfWeek: number
  timeSlot: number
  previousRate: number
  seasonality: number
  classSize: number
  teacher: number
}

// Export singleton instance
export const attendancePredictionModel = new AttendancePredictionModel()
