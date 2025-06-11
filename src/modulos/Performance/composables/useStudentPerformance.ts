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
      if (!studentDoc.exists()) {
        throw new Error('Estudiante no encontrado');
      }
      
      const studentData = studentDoc.data();
      
      // Obtener registros de asistencia
      const attendanceQuery = await getCollection('attendance', [
        { field: 'studentId', operator: '==', value: studentId }
      ]);
      const attendanceRecords = attendanceQuery.docs.map(doc => doc.data());
      
      // Obtener montajes y evaluaciones
      const montajesQuery = await getCollection('montajes', [
        { field: 'participantes', operator: 'array-contains', value: studentId }
      ]);
      const montajes = montajesQuery.docs.map(doc => doc.data());
      
      // Obtener observaciones de maestros
      const observationsQuery = await getCollection('teacherObservations', [
        { field: 'studentId', operator: '==', value: studentId }
      ]);
      const observations = observationsQuery.docs.map(doc => doc.data());
      
      // Obtener métricas de trabajo individual/colectivo
      const workMetricsQuery = await getCollection('workMetrics', [
        { field: 'studentId', operator: '==', value: studentId }
      ]);
      const workData = workMetricsQuery.docs.map(doc => doc.data());
      
      // Calcular métricas usando el servicio
      const attendanceMetrics = PerformanceAnalysisService.calculateAttendanceMetrics(attendanceRecords);
      const repertoireMetrics = PerformanceAnalysisService.calculateRepertoireMetrics(montajes);
      const workMetrics = PerformanceAnalysisService.calculateWorkMetrics(workData);
      const teacherObservations = PerformanceAnalysisService.processTeacherObservations(observations);
      
      // Calcular performance general
      const overallPerformance = PerformanceAnalysisService.calculateOverallPerformance(
        attendanceMetrics,
        repertoireMetrics,
        workMetrics,
        teacherObservations,
        customWeights.value
      );
      
      // Calcular tendencias
      const trends = PerformanceAnalysisService.calculateTrends(
        attendanceRecords,
        montajes,
        observations
      );
      
      performance.value = {
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
        )
      };
      
    } catch (err) {
      console.error('Error fetching performance data:', err);
      error.value = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading.value = false;
    }
  };

  // Métricas computadas para fácil acceso
  const performanceScore = computed(() => performance.value?.overallScore || 0);
  const classification = computed(() => performance.value?.classification || 'Sin datos');
  const attendanceRate = computed(() => performance.value?.attendanceMetrics.attendanceRate || 0);
  const averageRepertoireScore = computed(() => performance.value?.repertoireMetrics.averageScore || 0);
  
  // Indicador de progreso general
  const progressIndicator = computed(() => {
    if (!performance.value) return { level: 'sin-datos', color: 'gray', percentage: 0 };
    
    const score = performance.value.overallScore;
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
    // Recalcular con nuevos pesos
    if (performance.value) {
      const overallPerformance = PerformanceAnalysisService.calculateOverallPerformance(
        performance.value.attendanceMetrics,
        performance.value.repertoireMetrics,
        performance.value.workMetrics,
        performance.value.teacherObservations,
        customWeights.value
      );
      
      performance.value.overallScore = overallPerformance.score;
      performance.value.classification = overallPerformance.classification;
    }
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
