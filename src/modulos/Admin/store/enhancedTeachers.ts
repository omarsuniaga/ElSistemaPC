import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  advancedTeachersService,
  type TeacherMetrics,
  type TeacherPerformanceAnalysis,
  type TeacherScheduleOptimization,
  type TeacherPayrollReport
} from '../services/advancedTeachersService'

// Filters interface
interface TeacherFilters {
  searchTerm: string
  performanceLevel: string
  hoursRange: { min: number; max: number }
  status: string
  subject: string
}

export const useEnhancedTeachersStore = defineStore('enhancedTeachers', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Data
  const metrics = ref<TeacherMetrics | null>(null)
  const performanceAnalysis = ref<TeacherPerformanceAnalysis[]>([])
  const scheduleOptimizations = ref<TeacherScheduleOptimization[]>([])
  const payrollReports = ref<TeacherPayrollReport[]>([])
  
  // Filters
  const filters = ref<TeacherFilters>({
    searchTerm: '',
    performanceLevel: '',
    hoursRange: { min: 0, max: 50 },
    status: '',
    subject: ''
  })

  // Computed
  const filteredTeachers = computed(() => {
    let filtered = performanceAnalysis.value
    
    if (filters.value.searchTerm) {
      const search = filters.value.searchTerm.toLowerCase()
      filtered = filtered.filter(teacher => 
        teacher.teacherName.toLowerCase().includes(search)
      )
    }
    
    if (filters.value.performanceLevel) {
      filtered = filtered.filter(teacher => 
        teacher.performanceLevel === filters.value.performanceLevel
      )
    }
    
    if (filters.value.hoursRange.min > 0 || filters.value.hoursRange.max < 50) {
      filtered = filtered.filter(teacher => 
        teacher.hoursPerWeek >= filters.value.hoursRange.min &&
        teacher.hoursPerWeek <= filters.value.hoursRange.max
      )
    }
    
    return filtered
  })

  const performanceStats = computed(() => {
    if (performanceAnalysis.value.length === 0) {
      return {
        excellent: 0,
        good: 0,
        average: 0,
        needsImprovement: 0
      }
    }
    
    return {
      excellent: performanceAnalysis.value.filter(t => t.performanceLevel === 'excellent').length,
      good: performanceAnalysis.value.filter(t => t.performanceLevel === 'good').length,
      average: performanceAnalysis.value.filter(t => t.performanceLevel === 'average').length,
      needsImprovement: performanceAnalysis.value.filter(t => t.performanceLevel === 'needs_improvement').length
    }
  })

  const teachersNeedingAttention = computed(() => {
    return performanceAnalysis.value.filter(teacher => 
      teacher.performanceLevel === 'needs_improvement' ||
      teacher.averageAttendance < 0.7 ||
      teacher.studentRetention < 0.6
    )
  })

  const topPerformingTeachers = computed(() => {
    return performanceAnalysis.value
      .filter(teacher => teacher.performanceLevel === 'excellent')
      .sort((a, b) => b.evaluationScore - a.evaluationScore)
      .slice(0, 5)
  })

  // Actions
  const fetchMetrics = async () => {
    loading.value = true
    error.value = null
    
    try {
      metrics.value = await advancedTeachersService.getTeacherMetrics()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching metrics'
      console.error('Error fetching teacher metrics:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPerformanceAnalysis = async () => {
    loading.value = true
    error.value = null
    
    try {
      performanceAnalysis.value = await advancedTeachersService.getTeacherPerformanceAnalysis()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching performance analysis'
      console.error('Error fetching teacher performance analysis:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchScheduleOptimizations = async () => {
    loading.value = true
    error.value = null
    
    try {
      scheduleOptimizations.value = await advancedTeachersService.getScheduleOptimization()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching schedule optimizations'
      console.error('Error fetching schedule optimizations:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPayrollReports = async () => {
    loading.value = true
    error.value = null
    
    try {
      payrollReports.value = await advancedTeachersService.getPayrollReport()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching payroll reports'
      console.error('Error fetching payroll reports:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAllData = async () => {
    await Promise.all([
      fetchMetrics(),
      fetchPerformanceAnalysis(),
      fetchScheduleOptimizations(),
      fetchPayrollReports()
    ])
  }

  const updateFilters = (newFilters: Partial<TeacherFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      searchTerm: '',
      performanceLevel: '',
      hoursRange: { min: 0, max: 50 },
      status: '',
      subject: ''
    }
  }

  const getTeacherById = (teacherId: string) => {
    return performanceAnalysis.value.find(teacher => teacher.teacherId === teacherId)
  }

  const getScheduleOptimizationById = (teacherId: string) => {
    return scheduleOptimizations.value.find(schedule => schedule.teacherId === teacherId)
  }

  const getPayrollReportById = (teacherId: string) => {
    return payrollReports.value.find(payroll => payroll.teacherId === teacherId)
  }

  // Utility functions
  const exportTeachersData = () => {
    const dataToExport = filteredTeachers.value.map(teacher => ({
      'Nombre': teacher.teacherName,
      'Estudiantes': teacher.studentsManaged,
      'Asistencia Promedio': `${(teacher.averageAttendance * 100).toFixed(1)}%`,
      'Retención': `${(teacher.studentRetention * 100).toFixed(1)}%`,
      'Evaluación': teacher.evaluationScore.toFixed(1),
      'Horas/Semana': teacher.hoursPerWeek,
      'Nivel de Desempeño': teacher.performanceLevel,
      'Recomendaciones': teacher.recommendations.join('; ')
    }))

    return dataToExport
  }

  const getPerformanceTrends = () => {
    // This would calculate performance trends over time
    // For now, return mock data structure
    return {
      monthly: [
        { month: 'Ene', average: 4.2 },
        { month: 'Feb', average: 4.3 },
        { month: 'Mar', average: 4.1 },
        { month: 'Abr', average: 4.4 },
        { month: 'May', average: 4.5 },
        { month: 'Jun', average: 4.6 }
      ],
      byPerformanceLevel: [
        { level: 'Excelente', count: performanceStats.value.excellent },
        { level: 'Bueno', count: performanceStats.value.good },
        { level: 'Promedio', count: performanceStats.value.average },
        { level: 'Necesita Mejora', count: performanceStats.value.needsImprovement }
      ]
    }
  }

  return {
    // State
    loading,
    error,
    
    // Data
    metrics,
    performanceAnalysis,
    scheduleOptimizations,
    payrollReports,
    
    // Filters
    filters,
    
    // Computed
    filteredTeachers,
    performanceStats,
    teachersNeedingAttention,
    topPerformingTeachers,
    
    // Actions
    fetchMetrics,
    fetchPerformanceAnalysis,
    fetchScheduleOptimizations,
    fetchPayrollReports,
    fetchAllData,
    updateFilters,
    clearFilters,
    getTeacherById,
    getScheduleOptimizationById,
    getPayrollReportById,
    exportTeachersData,
    getPerformanceTrends
  }
})
