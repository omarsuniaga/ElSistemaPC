<!-- 
🗓️ ATTENDANCE CALENDAR
Calendario optimizado con indicadores de actividad del maestro
-->

<script setup lang="ts">
import {ref, computed, watch} from "vue"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns"
import {es} from "date-fns/locale"

// Props
interface CalendarIndicator {
  hasActivity: boolean
  count: number
  status: "completed" | "partial" | "pending" | "no-classes"
}

const props = defineProps<{
  currentMonth: Date
  selectedDate: string
  indicators: Record<string, CalendarIndicator>
  loading?: boolean
}>()

// Emits
const emit = defineEmits<{
  "date-select": [date: string]
  "month-change": [month: Date]
}>()

// 🎯 Estado del calendario
const hoveredDate = ref<string | null>(null)

/**
 * 🗓️ COMPUTED PROPERTIES
 */

// Días del mes con información extendida
const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(props.currentMonth), {weekStartsOn: 1}) // Lunes
  const end = endOfWeek(endOfMonth(props.currentMonth), {weekStartsOn: 1})
  const days = eachDayOfInterval({start, end})

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const indicator = props.indicators[dateStr]
    const isCurrentMonth = isSameMonth(day, props.currentMonth)
    const isSelected = dateStr === props.selectedDate
    const isCurrentDay = isToday(day)

    return {
      date: day,
      dateStr,
      dayNumber: format(day, "d"),
      isCurrentMonth,
      isSelected,
      isToday: isCurrentDay,
      indicator,
      hasActivity: indicator?.hasActivity || false,
      activityCount: indicator?.count || 0,
      status: indicator?.status || "no-classes",
    }
  })
})

// Título del mes
const monthTitle = computed(() => {
  return format(props.currentMonth, "MMMM yyyy", {locale: es}).replace(/^\w/, (c) =>
    c.toUpperCase()
  )
})

// Días de la semana
const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

/**
 * 🎯 MÉTODOS
 */

// Manejar click en fecha
const handleDateClick = (dateStr: string, isCurrentMonth: boolean) => {
  if (!isCurrentMonth) return

  console.log("📅 [AttendanceCalendar] Date clicked:", dateStr)
  emit("date-select", dateStr)
}

// Navegar mes anterior
const previousMonth = () => {
  const newMonth = subMonths(props.currentMonth, 1)
  emit("month-change", newMonth)
}

// Navegar mes siguiente
const nextMonth = () => {
  const newMonth = addMonths(props.currentMonth, 1)
  emit("month-change", newMonth)
}

// Ir a hoy
const goToToday = () => {
  const today = new Date()
  emit("month-change", today)
  emit("date-select", format(today, "yyyy-MM-dd"))
}

// Obtener clases CSS para un día
const getDayClasses = (day: any) => {
  const baseClasses = [
    "relative w-full h-12 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
  ]

  // Estado del mes
  if (!day.isCurrentMonth) {
    baseClasses.push("text-gray-300 dark:text-gray-600 cursor-not-allowed")
    return baseClasses.join(" ")
  }

  // Día actual
  if (day.isToday) {
    baseClasses.push("ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800")
  }

  // Día seleccionado
  if (day.isSelected) {
    baseClasses.push("bg-blue-600 text-white shadow-lg")
  } else {
    // Colores basados en actividad
    if (day.hasActivity) {
      switch (day.status) {
        case "completed":
          baseClasses.push(
            "bg-green-50 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-800/30"
          )
          break
        case "partial":
          baseClasses.push(
            "bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-800/30"
          )
          break
        case "pending":
          baseClasses.push(
            "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-800/30"
          )
          break
      }
    } else {
      baseClasses.push("text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700")
    }
  }

  return baseClasses.join(" ")
}

// Obtener clases CSS para el indicador
const getIndicatorClasses = (day: any) => {
  if (!day.hasActivity) return ""

  const baseClasses = "absolute top-1 right-1 w-2 h-2 rounded-full"

  switch (day.status) {
    case "completed":
      return `${baseClasses} bg-green-500`
    case "partial":
      return `${baseClasses} bg-yellow-500`
    case "pending":
      return `${baseClasses} bg-blue-500`
    default:
      return `${baseClasses} bg-gray-400`
  }
}

// Manejar hover
const handleMouseEnter = (dateStr: string) => {
  hoveredDate.value = dateStr
}

const handleMouseLeave = () => {
  hoveredDate.value = null
}

// Watch para cambios en el mes
watch(
  () => props.currentMonth,
  (newMonth) => {
    console.log("📅 [AttendanceCalendar] Month changed:", format(newMonth, "yyyy-MM"))
  }
)
</script>

<template>
  <div class="w-full">
    <!-- 🎯 HEADER DEL CALENDARIO -->
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
    >
      <!-- Navegación de mes -->
      <div class="flex items-center space-x-4">
        <button
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :disabled="loading"
          @click="previousMonth"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 class="text-lg font-semibold text-gray-900 dark:text-white min-w-[140px] text-center">
          {{ monthTitle }}
        </h2>

        <button
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :disabled="loading"
          @click="nextMonth"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <!-- Botón "Hoy" -->
      <button
        class="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        :disabled="loading"
        @click="goToToday"
      >
        Hoy
      </button>
    </div>

    <!-- 🗓️ CALENDARIO -->
    <div class="p-4">
      <!-- Encabezados de días de la semana -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="day in weekDays"
          :key="day"
          class="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center uppercase tracking-wider"
        >
          {{ day }}
        </div>
      </div>

      <!-- Grid de días -->
      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="day in calendarDays"
          :key="day.dateStr"
          :class="getDayClasses(day)"
          :title="
            day.hasActivity
              ? `${day.activityCount} registro${day.activityCount > 1 ? 's' : ''} de asistencia`
              : day.isCurrentMonth
                ? 'Sin clases registradas'
                : ''
          "
          @click="handleDateClick(day.dateStr, day.isCurrentMonth)"
          @mouseenter="handleMouseEnter(day.dateStr)"
          @mouseleave="handleMouseLeave"
        >
          <!-- Número del día -->
          <span class="relative z-10">{{ day.dayNumber }}</span>

          <!-- Indicador de actividad -->
          <div v-if="day.hasActivity" :class="getIndicatorClasses(day)" />

          <!-- Contador de actividades (para días con múltiples clases) -->
          <div
            v-if="day.hasActivity && day.activityCount > 1"
            class="absolute bottom-1 right-1 w-4 h-4 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs rounded-full flex items-center justify-center font-bold"
          >
            {{ day.activityCount }}
          </div>

          <!-- Hover indicator -->
          <div
            v-if="hoveredDate === day.dateStr && day.isCurrentMonth && !day.isSelected"
            class="absolute inset-0 bg-blue-100 dark:bg-blue-800/30 rounded-lg -z-10"
          />
        </div>
      </div>

      <!-- 📊 LEYENDA -->
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 rounded-full bg-green-500" />
              <span>Completado</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Parcial</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 rounded-full bg-blue-500" />
              <span>Pendiente</span>
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="loading" class="flex items-center space-x-1">
            <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
            <span>Cargando...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animaciones personalizadas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Hover effects mejorados */
.calendar-day {
  position: relative;
  overflow: hidden;
}

.calendar-day::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.calendar-day:hover::before {
  left: 100%;
}
</style>
