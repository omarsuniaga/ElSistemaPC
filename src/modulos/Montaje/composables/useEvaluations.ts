import { ref, computed } from 'vue';
import { evaluationService } from '../services/EvaluationService';
import type { InstrumentEvaluation, WeeklyEvaluation } from '../types/heatmap';

export function useEvaluations() {
  const instrumentEvaluations = ref<InstrumentEvaluation[]>([]);
  const weeklyEvaluations = ref<WeeklyEvaluation[]>([]);
  const recentEvaluations = ref<InstrumentEvaluation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Save a single instrument evaluation
  const saveInstrumentEvaluation = async (evaluation: Partial<InstrumentEvaluation>): Promise<string> => {
    loading.value = true;
    error.value = null;
    
    try {
      const id = await evaluationService.saveInstrumentEvaluation(evaluation);
      
      // Update local state
      const newEvaluation = { id, ...evaluation } as InstrumentEvaluation;
      instrumentEvaluations.value.unshift(newEvaluation);
      
      return id;
    } catch (err) {
      error.value = 'Error al guardar la evaluación';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Save multiple evaluations in batch
  const saveBatchEvaluations = async (evaluations: Partial<InstrumentEvaluation>[]): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      await evaluationService.saveBatchEvaluations(evaluations);
      
      // Update local state if needed
      // This would require knowing which work/instruments we're dealing with
    } catch (err) {
      error.value = 'Error al guardar las evaluaciones en lote';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Load evaluations for a specific instrument
  const loadInstrumentEvaluations = async (workId: string, instrumentId: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const evaluations = await evaluationService.getInstrumentEvaluations(workId, instrumentId);
      instrumentEvaluations.value = evaluations;
    } catch (err) {
      error.value = 'Error al cargar las evaluaciones del instrumento';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  // Load all evaluations for a work
  const loadWorkEvaluations = async (workId: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const evaluations = await evaluationService.getWorkEvaluations(workId);
      instrumentEvaluations.value = evaluations;
    } catch (err) {
      error.value = 'Error al cargar las evaluaciones de la obra';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  // Load recent evaluations
  const loadRecentEvaluations = async (limit: number = 10): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const evaluations = await evaluationService.getRecentEvaluations(limit);
      recentEvaluations.value = evaluations;
    } catch (err) {
      error.value = 'Error al cargar las evaluaciones recientes';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  // Weekly evaluations
  const saveWeeklyEvaluation = async (evaluation: Partial<WeeklyEvaluation>): Promise<string> => {
    loading.value = true;
    error.value = null;
    
    try {
      const id = await evaluationService.saveWeeklyEvaluation(evaluation);
      
      // Update local state
      const newEvaluation = { id, ...evaluation } as WeeklyEvaluation;
      weeklyEvaluations.value.unshift(newEvaluation);
      
      return id;
    } catch (err) {
      error.value = 'Error al guardar la evaluación semanal';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Load weekly evaluations for a work
  const loadWeeklyEvaluations = async (workId: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const evaluations = await evaluationService.getWeeklyEvaluations(workId);
      weeklyEvaluations.value = evaluations;
    } catch (err) {
      error.value = 'Error al cargar las evaluaciones semanales';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  // Calculate average scores for an instrument
  const getAverageScores = (instrumentId: string, workId: string): Record<string, number> => {
    const evals = instrumentEvaluations.value.filter(e => 
      e.instrumentId === instrumentId && e.workId === workId,
    );
    
    return evaluationService.calculateAverageScores(evals);
  };

  // Calculate overall score for an evaluation
  const getOverallScore = (evaluation: InstrumentEvaluation | Record<string, number>): number => {
    return evaluationService.calculateOverallScore(evaluation);
  };

  return {
    instrumentEvaluations: computed(() => instrumentEvaluations.value),
    weeklyEvaluations: computed(() => weeklyEvaluations.value),
    recentEvaluations: computed(() => recentEvaluations.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    saveInstrumentEvaluation,
    saveBatchEvaluations,
    loadInstrumentEvaluations,
    loadWorkEvaluations,
    loadRecentEvaluations,
    saveWeeklyEvaluation,
    loadWeeklyEvaluations,
    getAverageScores,
    getOverallScore,
  };
}