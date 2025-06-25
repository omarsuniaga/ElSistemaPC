import { ref, computed } from 'vue'
import { format, subDays, subWeeks, subMonths } from 'date-fns'

/**
 * Composable para manejar filtros y rangos de fechas del informe de asistencia
 */
export function useAttendanceFilters() {
  // Estado reactivo
  const from = ref(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const to = ref(format(new Date(), 'yyyy-MM-dd'))

  // Configurar rango de fechas con presets
  const setRange = (type: string) => {
    const now = new Date()
    if (type === 'yesterday') {
      from.value = format(subDays(now, 1), 'yyyy-MM-dd')
      to.value = from.value
    }
    if (type === 'week') from.value = format(subWeeks(now, 1), 'yyyy-MM-dd')
    if (type === 'month') from.value = format(subMonths(now, 1), 'yyyy-MM-dd')
  }

  // Validar rango de fechas
  const validateDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Fechas inválidas')
    }
    
    if (start > end) {
      throw new Error('La fecha inicial debe ser anterior a la fecha final')
    }
    
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    }
  }

  return {
    from,
    to,
    setRange,
    validateDateRange
  }
}
