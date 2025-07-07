import { ref, computed } from 'vue'
import type { InstrumentEvaluation, WeeklyEvaluation } from '../types/heatmap'

const instrumentEvaluations = ref<InstrumentEvaluation[]>([])
const weeklyEvaluations = ref<WeeklyEvaluation[]>([])
const loading = ref(false)

export function useMontajeEvaluations() {
  const saveInstrumentEvaluation = async (evaluation: Omit<InstrumentEvaluation, 'createdAt' | 'updatedAt'>): Promise<string> => {
    loading.value = true
    
    try {
      const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newEvaluation: InstrumentEvaluation = {
        ...evaluation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      instrumentEvaluations.value.push(newEvaluation)
      
      // Save to storage
      await saveToStorage('instrument_evaluations', instrumentEvaluations.value)
      
      return evaluationId
    } finally {
      loading.value = false
    }
  }

  const saveWeeklyEvaluation = async (evaluation: Omit<WeeklyEvaluation, 'createdAt' | 'updatedAt'>): Promise<string> => {
    loading.value = true
    
    try {
      const evaluationId = evaluation.id || `weekly_eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newEvaluation: WeeklyEvaluation = {
        ...evaluation,
        id: evaluationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Update existing or add new
      const existingIndex = weeklyEvaluations.value.findIndex(e => e.id === evaluationId)
      if (existingIndex !== -1) {
        weeklyEvaluations.value[existingIndex] = newEvaluation
      } else {
        weeklyEvaluations.value.push(newEvaluation)
      }
      
      // Save to storage
      await saveToStorage('weekly_evaluations', weeklyEvaluations.value)
      
      return evaluationId
    } finally {
      loading.value = false
    }
  }

  const loadEvaluations = async (workId: string) => {
    loading.value = true
    
    try {
      // Load instrument evaluations
      const savedInstrumentEvals = localStorage.getItem('montaje_instrument_evaluations')
      if (savedInstrumentEvals) {
        const allEvals = JSON.parse(savedInstrumentEvals)
        instrumentEvaluations.value = allEvals.filter((e: InstrumentEvaluation) => e.workId === workId)
      }
      
      // Load weekly evaluations
      const savedWeeklyEvals = localStorage.getItem('montaje_weekly_evaluations')
      if (savedWeeklyEvals) {
        const allEvals = JSON.parse(savedWeeklyEvals)
        weeklyEvaluations.value = allEvals.filter((e: WeeklyEvaluation) => e.workId === workId)
      }
    } finally {
      loading.value = false
    }
  }

  const getInstrumentEvaluations = (instrumentId: string, workId: string) => {
    return instrumentEvaluations.value.filter(e => 
      e.instrumentId === instrumentId && e.workId === workId
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  const getWeeklyEvaluations = (workId: string) => {
    return weeklyEvaluations.value.filter(e => e.workId === workId)
      .sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
  }

  const getAverageScores = (instrumentId: string, workId: string) => {
    const evals = getInstrumentEvaluations(instrumentId, workId)
    if (evals.length === 0) return null
    
    const criteria = ['afinacion', 'articulacion', 'ritmo', 'cohesion', 'dinamica', 'memorizacion']
    const averages: Record<string, number> = {}
    
    criteria.forEach(criterion => {
      const scores = evals.map(e => (e as any)[criterion]).filter(score => score > 0)
      averages[criterion] = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
    })
    
    return averages
  }

  const getProgressTrend = (instrumentId: string, workId: string, weeks: number = 4) => {
    const evals = getInstrumentEvaluations(instrumentId, workId)
      .slice(0, weeks)
      .reverse() // Oldest first for trend calculation
    
    if (evals.length < 2) return 0
    
    // Calculate overall score for each evaluation
    const scores = evals.map(evaluation => {
      const criteria = ['afinacion', 'articulacion', 'ritmo', 'cohesion', 'dinamica', 'memorizacion']
      const validScores = criteria.map(c => (evaluation as any)[c]).filter(s => s > 0)
      return validScores.length > 0 ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length : 0
    })
    
    // Simple linear trend calculation
    const firstScore = scores[0]
    const lastScore = scores[scores.length - 1]
    
    return lastScore - firstScore
  }

  const saveToStorage = async (key: string, data: any) => {
    try {
      localStorage.setItem(`montaje_${key}`, JSON.stringify(data))
      // TODO: Save to backend/Firebase
    } catch (error) {
      console.error(`Error saving ${key}:`, error)
    }
  }

  return {
    instrumentEvaluations: computed(() => instrumentEvaluations.value),
    weeklyEvaluations: computed(() => weeklyEvaluations.value),
    loading: computed(() => loading.value),
    saveInstrumentEvaluation,
    saveWeeklyEvaluation,
    loadEvaluations,
    getInstrumentEvaluations,
    getWeeklyEvaluations,
    getAverageScores,
    getProgressTrend
  }
}