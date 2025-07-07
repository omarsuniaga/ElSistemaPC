/**
 * 📅 COMPOSABLE PARA MANEJO DEL CALENDARIO DE ASISTENCIAS
 * Lógica reactiva reutilizable con Vue 3 Composition API
 */

import { ref, computed, watch, readonly } from "vue"
import { CalendarService } from '../services/CalendarService'
import { useClassesStore } from '../../Classes/store/classes'
import { useAttendanceStore } from '../store/attendance'
import { useAuthStore } from '../../../stores/auth'
import type { 
  DayClassesResult, 
  DayClassItem, 
  CalendarState,
  ClassFilterParams 
} from '../types/calendar.types'

/**
 * Composable principal para el calendario de asistencias
 */
export function useAttendanceCalendar() {
  // 🏪 Stores
  const classesStore = useClassesStore()
  const attendanceStore = useAttendanceStore()
  const authStore = useAuthStore()

  // 📊 Estado reactivo
  const state = ref<CalendarState>({
    selectedDate: null,
    currentMonth: new Date(),
    loading: false,
    error: null
  })

  // 📅 Resultado de clases del día seleccionado
  const dayResult = ref<DayClassesResult | null>(null)

  // 👨‍🏫 ID del maestro actual
  const teacherId = computed(() => authStore.user?.uid || '')

  // 🔄 Estado de carga
  const isLoading = computed(() => state.value.loading)

  // ❌ Error actual
  const error = computed(() => state.value.error)

  // 📋 Clases del día actual
  const dayClasses = computed(() => dayResult.value?.classes || [])

  // 📊 Estadísticas del día
  const dayStats = computed(() => ({
    total: dayResult.value?.totalClasses || 0,
    withAttendance: dayResult.value?.classesWithAttendance || 0,
    pending: dayResult.value?.classesPending || 0
  }))

  /**
   * 🔄 Carga clases para una fecha específica
   */
  const loadClassesForDate = async (dateString: string) => {
    if (!teacherId.value) {
      console.warn('[useAttendanceCalendar] No teacher ID available')
      return
    }

    try {
      state.value.loading = true
      state.value.error = null

      console.log(`[useAttendanceCalendar] Loading classes for ${dateString}`)

      // Asegurar que tenemos las clases cargadas
      if (classesStore.classes.length === 0) {
        await classesStore.fetchClasses()
      }

      // Filtrar clases usando el servicio
      const filterParams: ClassFilterParams = {
        date: dateString,
        teacherId: teacherId.value,
        includeSharedClasses: true,
        includeAttendanceRecords: true
      }

      const result = await CalendarService.getClassesForDay(
        classesStore.classes,
        filterParams
      )

      // Enriquecer con datos de asistencia
      await enrichWithAttendanceData(result, dateString)

      dayResult.value = result
      state.value.selectedDate = dateString

      console.log(`[useAttendanceCalendar] ✅ Loaded ${result.totalClasses} classes`)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading classes'
      state.value.error = errorMessage
      console.error('[useAttendanceCalendar] Error:', err)
    } finally {
      state.value.loading = false
    }
  }

  /**
   * 📊 Enriquece el resultado con datos de asistencia
   */
  const enrichWithAttendanceData = async (result: DayClassesResult, dateString: string) => {
    try {
      // Cargar registros de asistencia para la fecha
      const attendanceRecords = await attendanceStore.getAttendanceByDate(dateString)
      
      let classesWithAttendance = 0

      // Actualizar cada clase con su estado de asistencia
      result.classes.forEach((classItem: DayClassItem) => {
        const attendanceRecord = attendanceRecords.find(record => 
          record.classId === classItem.id && record.teacherId === teacherId.value
        )

        if (attendanceRecord) {
          classItem.hasAttendanceRecord = true
          classItem.attendanceId = attendanceRecord.id
          classesWithAttendance++
        }
      })

      // Actualizar estadísticas
      result.classesWithAttendance = classesWithAttendance
      result.classesPending = result.totalClasses - classesWithAttendance

    } catch (error) {
      console.warn('[useAttendanceCalendar] Warning: Could not load attendance data:', error)
    }
  }

  /**
   * 📅 Selecciona una fecha
   */
  const selectDate = async (dateString: string) => {
    if (!CalendarService.isValidDateFormat(dateString)) {
      throw new Error(`Invalid date format: ${dateString}`)
    }

    await loadClassesForDate(dateString)
  }

  /**
   * 🔄 Recarga las clases de la fecha actual
   */
  const refreshCurrentDate = async () => {
    if (state.value.selectedDate) {
      await loadClassesForDate(state.value.selectedDate)
    }
  }

  /**
   * 🗓️ Cambia el mes actual
   */
  const changeMonth = (newMonth: Date) => {
    state.value.currentMonth = newMonth
  }

  /**
   * 🧹 Limpia el estado
   */
  const clearState = () => {
    state.value.selectedDate = null
    state.value.error = null
    dayResult.value = null
  }

  /**
   * 🔍 Obtiene una clase específica por ID
   */
  const getClassById = (classId: string): DayClassItem | undefined => {
    return dayClasses.value.find(cls => cls.id === classId)
  }

  /**
   * 📋 Filtra clases por criterio
   */
  const filterClasses = (predicate: (cls: DayClassItem) => boolean): DayClassItem[] => {
    return dayClasses.value.filter(predicate)
  }

  // 👀 Watchers para reactividad
  watch(
    () => teacherId.value,
    (newTeacherId, oldTeacherId) => {
      if (newTeacherId && newTeacherId !== oldTeacherId) {
        // Si cambia el maestro, limpiar y recargar
        clearState()
      }
    }
  )

  return {
    // Estado
    selectedDate: computed(() => state.value.selectedDate),
    currentMonth: computed(() => state.value.currentMonth),
    isLoading,
    error,
    teacherId,
    
    // Datos computados
    dayClasses,
    dayStats,
    
    // Métodos
    selectDate,
    loadClassesForDate,
    refreshCurrentDate,
    changeMonth,
    clearState,
    getClassById,
    filterClasses
  }
}

/**
 * 🎯 Composable específico para validación de clases
 */
export function useClassValidation() {
  /**
   * Valida si una clase debería aparecer en un día específico
   */
  const validateClassForDay = (classItem: any, dateString: string): boolean => {
    try {
      const dayOfWeek = CalendarService.getDayOfWeek(dateString)
      return CalendarService.isClassScheduledForDay(classItem, dayOfWeek)
    } catch (error) {
      console.error('[useClassValidation] Validation error:', error)
      return false
    }
  }

  /**
   * Debug de una clase específica
   */
  const debugClass = (classItem: any, dateString: string, teacherId: string) => {
    const dayOfWeek = CalendarService.getDayOfWeek(dateString)
    CalendarService.debugClassFilter(classItem, dayOfWeek, teacherId)
  }

  return {
    validateClassForDay,
    debugClass
  }
}
