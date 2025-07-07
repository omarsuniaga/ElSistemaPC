<!--
  📅 NUEVO CALENDARIO DE ASISTENCIAS - COMPONENTE PRINCIPAL
  Arquitectura limpia sin conversiones confusas
-->
<template>
  <div class="new-attendance-calendar">
    <!-- Header del Calendario -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <!-- Título -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Calendario de Asistencias
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Sistema optimizado - {{ formatMonth(currentMonth) }}
          </p>
        </div>

        <!-- Controles de Navegación -->
        <div class="flex items-center space-x-2">
          <button
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="previousMonth"
            aria-label="Mes anterior"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span class="text-sm font-medium text-gray-900 dark:text-white px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            {{ formatMonth(currentMonth) }}
          </span>

          <button
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="nextMonth"
            aria-label="Mes siguiente"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            @click="goToToday"
          >
            Hoy
          </button>
        </div>
      </div>
    </div>

    <!-- Días de la Semana -->
    <div class="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
      <div
        v-for="day in weekDays"
        :key="day"
        class="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
      >
        {{ day }}
      </div>
    </div>

    <!-- Grid del Calendario -->
    <div class="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-gray-600">
      <CalendarDay
        v-for="(date, index) in calendarDays"
        :key="`${date.getTime()}-${index}`"
        :date="date"
        :is-current-month="isSameMonth(date, currentMonth)"
        :is-today="isToday(date)"
        :is-selected="isSelectedDate(date)"
        :teacher-id="teacherId"
        @click="handleDateClick"
      />
    </div>

    <!-- Footer con Leyenda -->
    <div class="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
      <div class="flex flex-wrap gap-4 text-xs">
        <!-- Leyenda de Estados -->
        <div class="flex items-center">
          <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span class="text-gray-600 dark:text-gray-400">Con clases programadas</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span class="text-gray-600 dark:text-gray-400">Asistencias completadas</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span class="text-gray-600 dark:text-gray-400">Asistencias pendientes</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span class="text-gray-600 dark:text-gray-400">Día actual</span>
        </div>
      </div>

      <!-- Debug Info -->
      <div v-if="showDebug" class="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
        <details class="text-xs text-gray-500 dark:text-gray-400">
          <summary class="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            🐛 Debug Info
          </summary>
          <pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">{{ debugInfo }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday as dateFnsIsToday
} from 'date-fns'
import { es } from 'date-fns/locale'
import CalendarDay from './CalendarDay.vue'

// Props
interface Props {
  selectedDate?: string
  teacherId?: string
  showDebug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedDate: '',
  teacherId: '',
  showDebug: false
})

// Emits
const emit = defineEmits<{
  'date-selected': [date: string]
  'month-changed': [month: Date]
}>()

// Estado
const currentMonth = ref(new Date())

// Días de la semana (domingo a sábado)
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Computed
const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentMonth.value)
  const monthEnd = endOfMonth(currentMonth.value)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Domingo = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
})

const debugInfo = computed(() => ({
  selectedDate: props.selectedDate,
  teacherId: props.teacherId,
  currentMonth: format(currentMonth.value, 'yyyy-MM'),
  totalDays: calendarDays.value.length,
  weekStartsOn: 0, // Domingo
  calendarRange: {
    start: format(calendarDays.value[0], 'yyyy-MM-dd'),
    end: format(calendarDays.value[calendarDays.value.length - 1], 'yyyy-MM-dd')
  }
}))

// Methods
const formatMonth = (date: Date): string => {
  return format(date, 'MMMM yyyy', { locale: es })
}

const isToday = (date: Date): boolean => {
  return dateFnsIsToday(date)
}

const isSelectedDate = (date: Date): boolean => {
  if (!props.selectedDate) return false
  
  try {
    const dateStr = format(date, 'yyyy-MM-dd')
    return dateStr === props.selectedDate
  } catch {
    return false
  }
}

const handleDateClick = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd')
  console.log(`[NewAttendanceCalendar] Date clicked: ${dateStr}`)
  emit('date-selected', dateStr)
}

const previousMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1)
  emit('month-changed', currentMonth.value)
}

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1)
  emit('month-changed', currentMonth.value)
}

const goToToday = () => {
  const today = new Date()
  currentMonth.value = startOfMonth(today)
  emit('month-changed', currentMonth.value)
  
  // Seleccionar hoy automáticamente
  const todayStr = format(today, 'yyyy-MM-dd')
  emit('date-selected', todayStr)
}

// Watchers
watch(
  () => props.selectedDate,
  (newDate) => {
    if (newDate) {
      try {
        const date = new Date(newDate)
        if (!isSameMonth(date, currentMonth.value)) {
          currentMonth.value = startOfMonth(date)
          emit('month-changed', currentMonth.value)
        }
      } catch (error) {
        console.warn('[NewAttendanceCalendar] Invalid date format:', newDate)
      }
    }
  }
)

// Lifecycle
onMounted(() => {
  console.log('[NewAttendanceCalendar] Mounted')
  
  // Si hay fecha seleccionada, navegar a ese mes
  if (props.selectedDate) {
    try {
      const selectedDate = new Date(props.selectedDate)
      currentMonth.value = startOfMonth(selectedDate)
    } catch (error) {
      console.warn('[NewAttendanceCalendar] Invalid initial date:', props.selectedDate)
    }
  }
})
</script>

<style scoped>
.new-attendance-calendar {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden;
}

/* Transiciones suaves */
.transition-colors {
  transition: all 0.2s ease-in-out;
}

/* Responsive */
@media (max-width: 640px) {
  .grid-cols-7 {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}
</style>
