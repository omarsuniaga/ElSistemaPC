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
  subMonths
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useAttendanceStore } from '../store'
import { useClassesStore } from '../../Classes/store/classes'

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasAttendanceRecords: boolean
}

export interface DayStats {
  totalClasses: number
  completedAttendances: number
  pendingAttendances: number
}

export interface MonthStats {
  totalCompleted: number
  totalPending: number
  completionPercentage: number
}

export function useCalendar(teacherId?: string) {
  const attendanceStore = useAttendanceStore()
  const classesStore = useClassesStore()

  // Estado reactivo
  const currentDate = ref(new Date())
  const selectedDate = ref<Date | null>(null)
  const view = ref<'month' | 'week'>('month')
  const loading = ref(false)

  // Computed properties
  const currentMonthYear = computed(() => {
    return format(currentDate.value, 'MMMM yyyy', { locale: es })
      .replace(/^\w/, (c) => c.toUpperCase())
  })

  const calendarDays = computed((): CalendarDay[] => {
    const monthStart = startOfMonth(currentDate.value)
    const monthEnd = endOfMonth(currentDate.value)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    })

    return days.map(date => ({
      date,
      isCurrentMonth: date.getMonth() === currentDate.value.getMonth(),
      isToday: isDateToday(date),
      isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
      hasAttendanceRecords: hasAttendanceForDate(date)
    }))
  })

  const dayStats = computed((): DayStats => {
    if (!selectedDate.value) {
      return {
        totalClasses: 0,
        completedAttendances: 0,
        pendingAttendances: 0
      }
    }

    const dateString = format(selectedDate.value, 'yyyy-MM-dd')
    const classesForDay = getClassesForDate(selectedDate.value)
    const attendanceRecords = attendanceStore.getRecordsByDate(dateString)

    const totalClasses = classesForDay.length
    const completedAttendances = attendanceRecords.filter(record => 
      record.data && (
        (record.data.presentes && record.data.presentes.length > 0) ||
        (record.data.ausentes && record.data.ausentes.length > 0) ||
        (record.data.tarde && record.data.tarde.length > 0) ||
        (record.data.justificacion && record.data.justificacion.length > 0)
      )
    ).length

    return {
      totalClasses,
      completedAttendances,
      pendingAttendances: totalClasses - completedAttendances
    }
  })

  const monthStats = computed((): MonthStats => {
    const monthStart = startOfMonth(currentDate.value)
    const monthEnd = endOfMonth(currentDate.value)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    let totalCompleted = 0
    let totalPending = 0

    daysInMonth.forEach(date => {
      const dateString = format(date, 'yyyy-MM-dd')
      const classesForDay = getClassesForDate(date)
      const attendanceRecords = attendanceStore.getRecordsByDate(dateString)

      const completed = attendanceRecords.filter(record => 
        record.data && (
          (record.data.presentes && record.data.presentes.length > 0) ||
          (record.data.ausentes && record.data.ausentes.length > 0) ||
          (record.data.tarde && record.data.tarde.length > 0) ||
          (record.data.justificacion && record.data.justificacion.length > 0)
        )
      ).length

      totalCompleted += completed
      totalPending += classesForDay.length - completed
    })

    const total = totalCompleted + totalPending
    const completionPercentage = total > 0 ? (totalCompleted / total) * 100 : 0

    return {
      totalCompleted,
      totalPending,
      completionPercentage
    }
  })

  // Métodos
  const hasAttendanceForDate = (date: Date): boolean => {
    const dateString = format(date, 'yyyy-MM-dd')
    const records = attendanceStore.getRecordsByDate(dateString)
    return records.length > 0
  }

  const getClassesForDate = (date: Date) => {
    const dayOfWeek = date.getDay()
    const dateString = format(date, 'yyyy-MM-dd')
    
    // Obtener clases programadas para este día de la semana
    const scheduledClasses = classesStore.classes.filter(classItem => {
      if (!classItem.schedule?.slots) return false
      
      return classItem.schedule.slots.some(slot => {
        const slotDay = slot.dayOfWeek
        return slotDay === dayOfWeek
      })
    })

    // Obtener clases emergentes para esta fecha específica
    const emergencyClasses = classesStore.classes.filter(classItem => 
      classItem.emergencyDate === dateString
    )

    return [...scheduledClasses, ...emergencyClasses]
  }

  const navigateToMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      currentDate.value = subMonths(currentDate.value, 1)
    } else {
      currentDate.value = addMonths(currentDate.value, 1)
    }
  }

  const goToToday = () => {
    currentDate.value = new Date()
    selectedDate.value = new Date()
  }

  const selectDate = (date: Date) => {
    selectedDate.value = date
  }

  const changeView = (newView: 'month' | 'week') => {
    view.value = newView
  }

  // Inicialización
  const initialize = async () => {
    loading.value = true
    try {
      // Cargar datos necesarios
      await Promise.all([
        attendanceStore.fetchAttendanceRecords(),
        classesStore.fetchClasses()
      ])
    } catch (error) {
      console.error('Error inicializando calendario:', error)
    } finally {
      loading.value = false
    }
  }

  // Watchers
  watch(currentDate, () => {
    // Recargar datos cuando cambie el mes
    initialize()
  })

  return {
    // Estado
    currentDate,
    selectedDate,
    view,
    loading,
    
    // Computed
    currentMonthYear,
    calendarDays,
    dayStats,
    monthStats,
    
    // Métodos
    navigateToMonth,
    goToToday,
    selectDate,
    changeView,
    getClassesForDate,
    hasAttendanceForDate,
    initialize
  }
}
