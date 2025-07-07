import { linearRegression, linearRegressionLine } from 'simple-statistics'
import type { InstrumentEvaluation, WeeklyEvaluation, MusicalWork } from '../types/heatmap'

export interface PredictionResult {
  estimatedCompletionDate: string
  confidenceLevel: number
  riskFactors: RiskFactor[]
  recommendations: Recommendation[]
  trendAnalysis: TrendAnalysis
}

export interface RiskFactor {
  type: 'progress' | 'quality' | 'time' | 'attendance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  probability: number
  impact: string
  mitigation: string[]
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'practice' | 'scheduling' | 'resources' | 'technique'
  title: string
  description: string
  expectedImpact: string
  effort: 'low' | 'medium' | 'high'
  timeline: string
}

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable'
  rate: number
  confidence: number
  dataPoints: Array<{ date: string; value: number }>
}

class PredictiveAnalyticsService {
  predictWorkCompletion(
    work: MusicalWork,
    evaluations: InstrumentEvaluation[],
    weeklyEvaluations: WeeklyEvaluation[]
  ): PredictionResult {
    const trendAnalysis = this.analyzeTrend(evaluations)
    const riskFactors = this.identifyRiskFactors(work, evaluations, weeklyEvaluations)
    const recommendations = this.generateRecommendations(work, evaluations, riskFactors)
    
    const { estimatedDate, confidence } = this.calculateCompletionDate(work, trendAnalysis)

    return {
      estimatedCompletionDate: estimatedDate,
      confidenceLevel: confidence,
      riskFactors,
      recommendations,
      trendAnalysis
    }
  }

  private analyzeTrend(evaluations: InstrumentEvaluation[]): TrendAnalysis {
    if (evaluations.length < 3) {
      return {
        direction: 'stable',
        rate: 0,
        confidence: 0.1,
        dataPoints: []
      }
    }

    // Sort evaluations by date
    const sortedEvaluations = evaluations.sort((a, b) => 
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    )

    // Calculate average scores for each evaluation
    const dataPoints = sortedEvaluations.map((eval, index) => {
      const avgScore = (eval.afinacion + eval.articulacion + eval.ritmo + 
                      eval.cohesion + eval.dinamica + eval.memorizacion) / 6
      return {
        date: eval.updatedAt,
        value: avgScore,
        x: index,
        y: avgScore
      }
    })

    // Perform linear regression
    const regressionData = dataPoints.map((point, index) => [index, point.value])
    const regression = linearRegression(regressionData)
    const regressionLine = linearRegressionLine(regression)

    // Calculate trend direction and rate
    const slope = regression.m
    const direction = slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable'
    const rate = Math.abs(slope) * 100 // Convert to percentage

    // Calculate confidence based on R-squared
    const predictions = dataPoints.map((_, index) => regressionLine(index))
    const actualValues = dataPoints.map(point => point.value)
    const rSquared = this.calculateRSquared(actualValues, predictions)

    return {
      direction,
      rate,
      confidence: Math.max(0.1, Math.min(1, rSquared)),
      dataPoints: dataPoints.map(point => ({ date: point.date, value: point.value }))
    }
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length
    
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0)
    const residualSumSquares = actual.reduce((sum, val, index) => 
      sum + Math.pow(val - predicted[index], 2), 0)
    
    return 1 - (residualSumSquares / totalSumSquares)
  }

  private identifyRiskFactors(
    work: MusicalWork,
    evaluations: InstrumentEvaluation[],
    weeklyEvaluations: WeeklyEvaluation[]
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = []

    // Time-based risk
    if (work.endDate) {
      const daysRemaining = Math.ceil(
        (new Date(work.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysRemaining < 30) {
        riskFactors.push({
          type: 'time',
          severity: daysRemaining < 14 ? 'critical' : 'high',
          description: `Solo quedan ${daysRemaining} días hasta la fecha objetivo`,
          probability: 0.8,
          impact: 'Posible retraso en la presentación',
          mitigation: [
            'Incrementar frecuencia de ensayos',
            'Priorizar secciones más difíciles',
            'Considerar ensayos adicionales'
          ]
        })
      }
    }

    // Quality-based risks
    const recentEvaluations = evaluations.slice(-10) // Last 10 evaluations
    const avgScores = this.calculateAverageScores(recentEvaluations)

    Object.entries(avgScores).forEach(([criterion, score]) => {
      if (score < 2.5) {
        riskFactors.push({
          type: 'quality',
          severity: score < 2 ? 'critical' : 'high',
          description: `${this.getCriterionLabel(criterion)} por debajo del estándar (${score.toFixed(1)}/5)`,
          probability: 0.7,
          impact: `Calidad comprometida en ${this.getCriterionLabel(criterion)}`,
          mitigation: this.getCriterionMitigation(criterion)
        })
      }
    })

    // Progress-based risks
    const progressTrend = this.analyzeTrend(evaluations)
    if (progressTrend.direction === 'declining' && progressTrend.confidence > 0.6) {
      riskFactors.push({
        type: 'progress',
        severity: progressTrend.rate > 10 ? 'high' : 'medium',
        description: `Tendencia descendente en el progreso (${progressTrend.rate.toFixed(1)}% de declive)`,
        probability: progressTrend.confidence,
        impact: 'Retraso en objetivos de aprendizaje',
        mitigation: [
          'Revisar metodología de enseñanza',
          'Incrementar práctica individual',
          'Identificar obstáculos específicos'
        ]
      })
    }

    return riskFactors
  }

  private generateRecommendations(
    work: MusicalWork,
    evaluations: InstrumentEvaluation[],
    riskFactors: RiskFactor[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Time-based recommendations
    const timeRisks = riskFactors.filter(rf => rf.type === 'time')
    if (timeRisks.length > 0) {
      recommendations.push({
        priority: 'urgent',
        category: 'scheduling',
        title: 'Intensificar Cronograma de Ensayos',
        description: 'Aumentar la frecuencia y duración de los ensayos para cumplir con la fecha objetivo',
        expectedImpact: 'Acelerar el progreso en 25-30%',
        effort: 'high',
        timeline: 'Inmediato'
      })
    }

    // Quality-based recommendations
    const qualityRisks = riskFactors.filter(rf => rf.type === 'quality')
    qualityRisks.forEach(risk => {
      if (risk.description.includes('Afinación')) {
        recommendations.push({
          priority: 'high',
          category: 'technique',
          title: 'Programa Intensivo de Afinación',
          description: 'Implementar ejercicios diarios de afinación y uso obligatorio de afinadores',
          expectedImpact: 'Mejora del 40% en precisión tonal',
          effort: 'medium',
          timeline: '2-3 semanas'
        })
      }
    })

    // Progress-based recommendations
    const progressRisks = riskFactors.filter(rf => rf.type === 'progress')
    if (progressRisks.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'practice',
        title: 'Reestructurar Metodología de Práctica',
        description: 'Implementar técnicas de práctica más efectivas y seguimiento individualizado',
        expectedImpact: 'Reversión de tendencia negativa en 2-4 semanas',
        effort: 'medium',
        timeline: '1-2 semanas'
      })
    }

    // General optimization recommendations
    const avgScores = this.calculateAverageScores(evaluations.slice(-20))
    const lowestCriterion = Object.entries(avgScores).reduce((min, [key, value]) => 
      value < min.value ? { key, value } : min, { key: '', value: 5 }
    )

    if (lowestCriterion.value < 4) {
      recommendations.push({
        priority: 'medium',
        category: 'technique',
        title: `Enfoque Específico en ${this.getCriterionLabel(lowestCriterion.key)}`,
        description: `Dedicar tiempo adicional a mejorar ${this.getCriterionLabel(lowestCriterion.key)} mediante ejercicios especializados`,
        expectedImpact: `Mejora del 20-30% en ${this.getCriterionLabel(lowestCriterion.key)}`,
        effort: 'low',
        timeline: '3-4 semanas'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  private calculateCompletionDate(work: MusicalWork, trendAnalysis: TrendAnalysis): { estimatedDate: string; confidence: number } {
    if (!work.endDate) {
      return {
        estimatedDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: 0.1
      }
    }

    const targetDate = new Date(work.endDate)
    const currentProgress = this.estimateCurrentProgress(trendAnalysis)
    
    // If progress is good and trend is positive, likely to meet deadline
    if (currentProgress > 0.7 && trendAnalysis.direction === 'improving') {
      return {
        estimatedDate: work.endDate,
        confidence: Math.min(0.9, trendAnalysis.confidence + 0.2)
      }
    }

    // Calculate estimated completion based on current rate
    const progressRate = trendAnalysis.rate / 100 // Convert percentage to decimal
    const remainingProgress = 1 - currentProgress
    const estimatedDaysToComplete = remainingProgress / (progressRate / 7) // Assuming weekly progress rate

    const estimatedDate = new Date(Date.now() + estimatedDaysToComplete * 24 * 60 * 60 * 1000)
    
    return {
      estimatedDate: estimatedDate.toISOString(),
      confidence: trendAnalysis.confidence
    }
  }

  private estimateCurrentProgress(trendAnalysis: TrendAnalysis): number {
    if (trendAnalysis.dataPoints.length === 0) return 0.1
    
    const latestScore = trendAnalysis.dataPoints[trendAnalysis.dataPoints.length - 1].value
    return Math.min(1, Math.max(0, latestScore / 5)) // Normalize to 0-1 scale
  }

  private calculateAverageScores(evaluations: InstrumentEvaluation[]): Record<string, number> {
    if (evaluations.length === 0) {
      return {
        afinacion: 0,
        articulacion: 0,
        ritmo: 0,
        cohesion: 0,
        dinamica: 0,
        memorizacion: 0
      }
    }

    const criteria = ['afinacion', 'articulacion', 'ritmo', 'cohesion', 'dinamica', 'memorizacion']
    const averages: Record<string, number> = {}

    criteria.forEach(criterion => {
      const scores = evaluations.map(e => e[criterion]).filter(score => score > 0)
      averages[criterion] = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
    })

    return averages
  }

  private getCriterionLabel(criterion: string): string {
    const labels = {
      afinacion: 'Afinación',
      articulacion: 'Articulación',
      ritmo: 'Ritmo',
      cohesion: 'Cohesión',
      dinamica: 'Dinámica',
      memorizacion: 'Memorización'
    }
    return labels[criterion] || criterion
  }

  private getCriterionMitigation(criterion: string): string[] {
    const mitigations = {
      afinacion: [
        'Usar afinadores digitales en todos los ensayos',
        'Practicar escalas y arpegios diariamente',
        'Implementar ejercicios de entonación'
      ],
      articulacion: [
        'Practicar ejercicios de staccato y legato',
        'Trabajar con metrónomo',
        'Estudiar diferentes tipos de articulación'
      ],
      ritmo: [
        'Usar metrónomo en todas las prácticas',
        'Practicar subdivisiones rítmicas',
        'Trabajar con diferentes tempos'
      ],
      cohesion: [
        'Incrementar ensayos seccionales',
        'Practicar escucha activa',
        'Trabajar entradas y cortes juntos'
      ],
      dinamica: [
        'Practicar crescendos y diminuendos',
        'Estudiar indicaciones dinámicas',
        'Trabajar contrastes extremos'
      ],
      memorizacion: [
        'Memorizar por secciones pequeñas',
        'Practicar sin partitura gradualmente',
        'Usar análisis armónico como ayuda'
      ]
    }
    return mitigations[criterion] || ['Práctica adicional recomendada']
  }

  // Machine Learning-inspired pattern recognition
  detectPatterns(evaluations: InstrumentEvaluation[]): Array<{
    pattern: string
    description: string
    confidence: number
    actionable: boolean
  }> {
    const patterns = []

    // Weekly performance pattern
    const weeklyPattern = this.analyzeWeeklyPattern(evaluations)
    if (weeklyPattern.confidence > 0.6) {
      patterns.push(weeklyPattern)
    }

    // Instrument difficulty correlation
    const difficultyPattern = this.analyzeDifficultyCorrelation(evaluations)
    if (difficultyPattern.confidence > 0.5) {
      patterns.push(difficultyPattern)
    }

    return patterns
  }

  private analyzeWeeklyPattern(evaluations: InstrumentEvaluation[]): any {
    // Analyze if there are consistent patterns by day of week
    const dayScores: Record<number, number[]> = {}
    
    evaluations.forEach(eval => {
      const dayOfWeek = new Date(eval.updatedAt).getDay()
      const avgScore = (eval.afinacion + eval.articulacion + eval.ritmo + eval.cohesion + eval.dinamica + eval.memorizacion) / 6
      
      if (!dayScores[dayOfWeek]) dayScores[dayOfWeek] = []
      dayScores[dayOfWeek].push(avgScore)
    })

    // Find the day with consistently highest/lowest scores
    const dayAverages = Object.entries(dayScores).map(([day, scores]) => ({
      day: parseInt(day),
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      count: scores.length
    })).filter(item => item.count >= 3) // Only consider days with enough data

    if (dayAverages.length < 3) {
      return { confidence: 0 }
    }

    const bestDay = dayAverages.reduce((best, current) => 
      current.average > best.average ? current : best
    )
    const worstDay = dayAverages.reduce((worst, current) => 
      current.average < worst.average ? current : worst
    )

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    
    return {
      pattern: 'weekly_performance',
      description: `Mejor rendimiento los ${dayNames[bestDay.day]}, menor rendimiento los ${dayNames[worstDay.day]}`,
      confidence: Math.min(0.9, (bestDay.average - worstDay.average) / 2),
      actionable: true
    }
  }

  private analyzeDifficultyCorrelation(evaluations: InstrumentEvaluation[]): any {
    // This would require instrument difficulty data
    // For now, return a placeholder pattern
    return {
      pattern: 'difficulty_correlation',
      description: 'Instrumentos de mayor dificultad muestran progreso más lento',
      confidence: 0.3,
      actionable: true
    }
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService()
export default predictiveAnalyticsService