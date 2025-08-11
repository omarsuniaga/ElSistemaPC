import { ref, computed, watch } from 'vue'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  isToday as isDateToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasAttendance: boolean
  attendanceStatus?: 'complete' | 'partial' | 'scheduled' | 'none'
}

export function useEnhancedCalendar() {
  // Estado reactivo
  const currentMonth = ref<Date>(new Date())
  const selectedDate = ref<Date | null>(new Date())
  const loading = ref<boolean>(false)

  // Computed properties
  const currentMonthFormatted = computed<string>(() => {
    return format(currentMonth.value, 'MMMM yyyy', { locale: es })
  })

  const calendarDays = computed<CalendarDay[]>(() => {
    const start = startOfWeek(startOfMonth(currentMonth.value))
    const end = endOfWeek(endOfMonth(currentMonth.value))
    
    return eachDayOfInterval({ start, end }).map(date => ({
      date,
      isCurrentMonth: date.getMonth() === currentMonth.value.getMonth(),
      isToday: isDateToday(date),
      isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
      hasAttendance: hasAttendanceForDate(date),
      attendanceStatus: getDayStatus(date)
    }))
  })

  // Métodos
  const goToPreviousMonth = (): void => {
    currentMonth.value = subMonths(currentMonth.value, 1)
  }

  const goToNextMonth = (): void => {
    currentMonth.value = addMonths(currentMonth.value, 1)
  }

  const goToToday = (): void => {
    currentMonth.value = new Date()
    selectDate(new Date())
  }

  const selectDate = (date: Date): void => {
    selectedDate.value = date
  }

  // Funciones de utilidad
  const hasAttendanceForDate = (date: Date): boolean => {
    // Implementar lógica real de verificación de asistencia
    return Math.random() > 0.5 // Simulación
  }

  const getDayStatus = (date: Date): CalendarDay['attendanceStatus'] => {
    const statuses: Array<CalendarDay['attendanceStatus']> = 
      ['complete', 'partial', 'scheduled', 'none']
    return statuses[Math.floor(Math.random() * statuses.length)] || 'none'
  }

  // Watchers
  watch(selectedDate, (newDate) => {
    if (newDate && newDate.getMonth() !== currentMonth.value.getMonth()) {
      currentMonth.value = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        1
      )
    }
  })

  return {
    // Estado
    currentMonth,
    selectedDate,
    loading,
    
    // Computed
    currentMonthFormatted,
    calendarDays,
    
    // Métodos
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate
  }
}
