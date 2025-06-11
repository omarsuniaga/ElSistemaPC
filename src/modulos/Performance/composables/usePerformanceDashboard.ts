import { ref, computed } from 'vue';
import { useFirestore } from '../../../composables/useFirestore';
import { PerformanceAnalysisService } from '../services/performanceAnalysis';
import type { StudentPerformance, PerformanceFilters, PerformanceSummary } from '../types/performance';

export function usePerformanceDashboard() {
  const { getCollection } = useFirestore();
  
  const loading = ref(false);
  const error = ref<string | null>(null);
  const students = ref<StudentPerformance[]>([]);
  const filters = ref<PerformanceFilters>({
    classification: [],
    course: [],
    minAttendance: 0,
    minScore: 0,
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Obtener datos de rendimiento de múltiples estudiantes
  const fetchStudentsPerformance = async (studentIds?: string[]) => {
    loading.value = true;
    error.value = null;
    
    try {
      let studentsQuery;
      
      if (studentIds && studentIds.length > 0) {
        // Obtener estudiantes específicos
        studentsQuery = await getCollection('users', [
          { field: 'uid', operator: 'in', value: studentIds },
          { field: 'role', operator: '==', value: 'student' }
        ]);
      } else {
        // Obtener todos los estudiantes
        studentsQuery = await getCollection('users', [
          { field: 'role', operator: '==', value: 'student' }
        ]);
      }
      
      const studentsData = studentsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const performancePromises = studentsData.map(async (student) => {
        try {
          // Obtener datos de asistencia
          const attendanceQuery = await getCollection('attendance', [
            { field: 'studentId', operator: '==', value: student.id }
          ]);
          const attendanceRecords = attendanceQuery.docs.map(doc => doc.data());
          
          // Obtener montajes
          const montajesQuery = await getCollection('montajes', [
            { field: 'participantes', operator: 'array-contains', value: student.id }
          ]);
          const montajes = montajesQuery.docs.map(doc => doc.data());
          
          // Obtener observaciones
          const observationsQuery = await getCollection('teacherObservations', [
            { field: 'studentId', operator: '==', value: student.id }
          ]);
          const observations = observationsQuery.docs.map(doc => doc.data());
          
          // Obtener métricas de trabajo
          const workMetricsQuery = await getCollection('workMetrics', [
            { field: 'studentId', operator: '==', value: student.id }
          ]);
          const workData = workMetricsQuery.docs.map(doc => doc.data());
          
          // Calcular métricas
          const attendanceMetrics = PerformanceAnalysisService.calculateAttendanceMetrics(attendanceRecords);
          const repertoireMetrics = PerformanceAnalysisService.calculateRepertoireMetrics(montajes);
          const workMetrics = PerformanceAnalysisService.calculateWorkMetrics(workData);
          const teacherObservations = PerformanceAnalysisService.processTeacherObservations(observations);
          
          const overallPerformance = PerformanceAnalysisService.calculateOverallPerformance(
            attendanceMetrics,
            repertoireMetrics,
            workMetrics,
            teacherObservations
          );
          
          const trends = PerformanceAnalysisService.calculateTrends(
            attendanceRecords,
            montajes,
            observations
          );
          
          return {
            studentId: student.id,
            studentName: student.displayName || `${student.nombres} ${student.apellidos}`,
            lastUpdated: new Date().toISOString(),
            attendanceMetrics,
            repertoireMetrics,
            workMetrics,
            teacherObservations,
            overallScore: overallPerformance.score,
            classification: overallPerformance.classification,
            trends,
            recommendations: []
          } as StudentPerformance;
          
        } catch (studentError) {
          console.error(`Error processing student ${student.id}:`, studentError);
          return null;
        }
      });
      
      const performanceResults = await Promise.all(performancePromises);
      students.value = performanceResults.filter(p => p !== null) as StudentPerformance[];
      
    } catch (err) {
      console.error('Error fetching students performance:', err);
      error.value = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading.value = false;
    }
  };

  // Estudiantes filtrados
  const filteredStudents = computed(() => {
    let filtered = [...students.value];
    
    // Filtrar por clasificación
    if (filters.value.classification.length > 0) {
      filtered = filtered.filter(s => filters.value.classification.includes(s.classification));
    }
    
    // Filtrar por asistencia mínima
    if (filters.value.minAttendance > 0) {
      filtered = filtered.filter(s => s.attendanceMetrics.attendanceRate >= filters.value.minAttendance);
    }
    
    // Filtrar por puntuación mínima
    if (filters.value.minScore > 0) {
      filtered = filtered.filter(s => s.overallScore >= filters.value.minScore);
    }
    
    return filtered;
  });

  // Top performers
  const topPerformers = computed(() => {
    return [...students.value]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10);
  });

  // Estudiantes que necesitan atención
  const studentsNeedingAttention = computed(() => {
    return students.value.filter(s => 
      s.classification === 'Preocupante' || 
      s.attendanceMetrics.attendanceRate < 70 ||
      s.overallScore < 60
    );
  });

  // Resumen general
  const summary = computed((): PerformanceSummary => {
    const total = students.value.length;
    if (total === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        averageAttendance: 0,
        classifications: {
          'Excelente': 0,
          'Muy bueno': 0,
          'Bueno': 0,
          'Regular': 0,
          'Necesita mejora': 0,
          'Preocupante': 0
        },
        trends: {
          improving: 0,
          stable: 0,
          declining: 0
        }
      };
    }
    
    const averageScore = students.value.reduce((sum, s) => sum + s.overallScore, 0) / total;
    const averageAttendance = students.value.reduce((sum, s) => sum + s.attendanceMetrics.attendanceRate, 0) / total;
    
    const classifications = students.value.reduce((acc, s) => {
      acc[s.classification] = (acc[s.classification] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const trends = students.value.reduce((acc, s) => {
      const trend = s.trends.overall;
      if (trend > 5) acc.improving++;
      else if (trend < -5) acc.declining++;
      else acc.stable++;
      return acc;
    }, { improving: 0, stable: 0, declining: 0 });
    
    return {
      totalStudents: total,
      averageScore: Math.round(averageScore),
      averageAttendance: Math.round(averageAttendance),
      classifications: {
        'Excelente': classifications['Excelente'] || 0,
        'Muy bueno': classifications['Muy bueno'] || 0,
        'Bueno': classifications['Bueno'] || 0,
        'Regular': classifications['Regular'] || 0,
        'Necesita mejora': classifications['Necesita mejora'] || 0,
        'Preocupante': classifications['Preocupante'] || 0
      },
      trends
    };
  });

  // Actualizar filtros
  const updateFilters = (newFilters: Partial<PerformanceFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  // Exportar datos
  const exportData = () => {
    const dataToExport = filteredStudents.value.map(student => ({
      'Nombre': student.studentName,
      'Puntuación General': student.overallScore,
      'Clasificación': student.classification,
      'Asistencia (%)': student.attendanceMetrics.attendanceRate,
      'Puntualidad (%)': student.attendanceMetrics.punctuality,
      'Promedio Montajes': student.repertoireMetrics.averageScore,
      'Trabajo Individual': student.workMetrics.individualWork.practiceHours,
      'Trabajo Colectivo': student.workMetrics.collectiveWork.teamworkScore,
      'Comentarios Positivos': student.teacherObservations.positiveComments.length,
      'Tendencia': student.trends.overall > 5 ? 'Mejorando' : student.trends.overall < -5 ? 'Declinando' : 'Estable'
    }));
    
    return dataToExport;
  };

  return {
    // State
    loading,
    error,
    students,
    filters,
    
    // Computed
    filteredStudents,
    topPerformers,
    studentsNeedingAttention,
    summary,
    
    // Methods
    fetchStudentsPerformance,
    updateFilters,
    exportData,
    refresh: fetchStudentsPerformance
  };
}
