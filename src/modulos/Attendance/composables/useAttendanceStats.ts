import { ref, computed, watch } from 'vue'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface StatItem {
  label: string
  value: string | number
  trend?: number
  icon?: string
  color?: string
}

export function useAttendanceStats(currentMonth: any) {
  // Estado para las estadísticas
  const monthStats = ref({
    totalRecords: 0,
    daysWithClasses: 0,
    completionRate: 0,
    uniqueClasses: 0,
    totalStudents: 0,
    averageAttendance: 0
  })

  // Computed properties
  const monthStatsItems = computed<StatItem[]>(() => [
    { 
      label: 'Registros', 
      value: monthStats.value.totalRecords,
      icon: '📝',
      color: 'text-blue-500'
    },
    { 
      label: 'Días con clases', 
      value: monthStats.value.daysWithClasses,
      icon: '📅',
      color: 'text-green-500'
    },
    { 
      label: 'Tasa de finalización', 
      value: `${Math.round(monthStats.value.completionRate)}%`,
      trend: 5, // % de tendencia
      icon: '📊',
      color: 'text-purple-500'
    },
    { 
      label: 'Clases únicas', 
      value: monthStats.value.uniqueClasses,
      icon: '🎼',
      color: 'text-yellow-500'
    },
    { 
      label: 'Estudiantes', 
      value: monthStats.value.totalStudents,
      icon: '👥',
      color: 'text-indigo-500'
    },
    { 
      label: 'Asistencia promedio', 
      value: `${Math.round(monthStats.value.averageAttendance)}%`,
      trend: 2, // % de tendencia
      icon: '✅',
      color: 'text-teal-500'
    }
  ])

  // Cargar estadísticas del mes
  const loadMonthStats = async (month: Date) => {
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Datos simulados - en una aplicación real, esto vendría de una API
      monthStats.value = {
        totalRecords: 42,
        daysWithClasses: 15,
        completionRate: 78.5,
        uniqueClasses: 8,
        totalStudents: 24,
        averageAttendance: 85
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  // Watcher para cargar estadísticas cuando cambia el mes
  watch(currentMonth, (newMonth: Date) => {
    if (newMonth) {
      loadMonthStats(newMonth)
    }
  }, { immediate: true })

  // Función para formatear el mes actual
  const currentMonthFormatted = computed(() => {
    return format(currentMonth.value, 'MMMM yyyy', { locale: es })
  })

  return {
    // Estado
    monthStats,
    
    // Computed
    monthStatsItems,
    currentMonthFormatted,
    
    // Métodos
    loadMonthStats
  }
}
