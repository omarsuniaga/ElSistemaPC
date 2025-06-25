import { ref, computed, watch } from 'vue';
import { useFirestore } from '../../../composables/useFirestore';
import { PerformanceAnalysisService } from '../services/performanceAnalysis';
import type { StudentPerformance, PerformanceWeights } from '../types/performance';
import { DEFAULT_WEIGHTS } from '../types/performance';

export function useStudentPerformance(studentId: string) {
  const { getCollection, getDocument } = useFirestore();
  
  const loading = ref(false);
  const error = ref<string | null>(null);
  const performance = ref<StudentPerformance | null>(null);
  const customWeights = ref<PerformanceWeights>(DEFAULT_WEIGHTS);
  // Obtener datos de rendimiento del estudiante
  const fetchPerformanceData = async () => {
    if (!studentId) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      // Obtener datos del estudiante
      const studentDoc = await getDocument('users', studentId);
      if (!studentDoc) {
        throw new Error('Estudiante no encontrado');
      }
      
      const studentData = studentDoc;
      
      // Por ahora, crear datos predeterminados para evitar errores
      // TODO: Implementar obtención real de datos cuando las colecciones estén disponibles
      const defaultAttendanceMetrics = {
        totalClasses: 20,
        attendedClasses: 18,
        punctuality: 90,
        attendanceRate: 90,
        consistencyScore: 85
      };
      
      const defaultRepertoireMetrics = {
        totalMontajes: 3,
        completedMontajes: 2,
        averageScore: 82,
        technicalProficiency: 80,
        musicalExpression: 85,
        stagePresence: 78
      };
      
      const defaultWorkMetrics = {
        individualWork: {
          practiceHours: 10,
          selfAssessment: 80,
          improvementRate: 15,
          consistentPractice: true
        },
        collectiveWork: {
          teamworkScore: 85,
          collaborationRating: 88,
          leadershipQualities: 75,
          ensembleSkills: 82
        }
      };
      
      const defaultTeacherObservations = {
        positiveComments: [],
        behaviorRatings: [],
        skillDevelopment: [],
        monthlyProgress: []
      };
      
      const defaultTrends = {
        direction: 'mejorando' as const,
        changeRate: 5,
        consistency: 80
      };

      performance.value = {
        studentId,
        studentName: studentData.displayName || studentData.nombre || `${studentData.nombres || ''} ${studentData.apellidos || studentData.apellido || ''}`.trim() || 'Estudiante',
        calculatedAt: new Date().toISOString(),
        attendance: defaultAttendanceMetrics,
        repertoire: defaultRepertoireMetrics,
        work: defaultWorkMetrics,
        observations: defaultTeacherObservations,
        scores: {
          attendanceScore: 85,
          repertoireScore: 82,
          workScore: 80,
          behaviorScore: 88,
          progressScore: 83,
          overallScore: 84
        },
        classification: 'bueno',
        rank: 0,
        percentile: 75,
        trends: defaultTrends
      };
      
    } catch (err) {
      console.error('Error fetching performance data:', err);
      
      // Manejo más específico de errores
      if (err instanceof Error) {
        if (err.message.includes('no encontrado')) {
          error.value = 'El estudiante no se encuentra en el sistema';
        } else if (err.message.includes('permission')) {
          error.value = 'No tiene permisos para acceder a estos datos';
        } else {
          error.value = `Error al cargar datos: ${err.message}`;
        }
      } else {
        error.value = 'Error desconocido al cargar datos de rendimiento';
      }
    } finally {
      loading.value = false;
    }
  };

  // Métricas computadas para fácil acceso
  const performanceScore = computed(() => performance.value?.scores.overallScore || 0);
  const classification = computed(() => performance.value?.classification || 'Sin datos');
  const attendanceRate = computed(() => performance.value?.attendance.attendanceRate || 0);
  const averageRepertoireScore = computed(() => performance.value?.repertoire.averageScore || 0);
  
  // Indicador de progreso general
  const progressIndicator = computed(() => {
    if (!performance.value) return { level: 'sin-datos', color: 'gray', percentage: 0 };
    
    const score = performance.value.scores.overallScore;
    if (score >= 90) return { level: 'excelente', color: 'green', percentage: score };
    if (score >= 80) return { level: 'bueno', color: 'blue', percentage: score };
    if (score >= 70) return { level: 'regular', color: 'yellow', percentage: score };
    if (score >= 60) return { level: 'necesita-mejora', color: 'orange', percentage: score };
    return { level: 'preocupante', color: 'red', percentage: score };
  });

  // Actualizar datos automáticamente cuando cambia el studentId
  watch(() => studentId, fetchPerformanceData, { immediate: true });

  // Función para actualizar pesos personalizados
  const updateWeights = (newWeights: Partial<PerformanceWeights>) => {
    customWeights.value = { ...customWeights.value, ...newWeights };
    // TODO: Recalcular con nuevos pesos cuando se implemente el servicio completo
    console.log('Weights updated:', customWeights.value);
  };

  return {
    // State
    loading,
    error,
    performance,
    customWeights,
    
    // Computed
    performanceScore,
    classification,
    attendanceRate,
    averageRepertoireScore,
    progressIndicator,
    
    // Methods
    fetchPerformanceData,
    updateWeights,
    refresh: fetchPerformanceData
  };
}
