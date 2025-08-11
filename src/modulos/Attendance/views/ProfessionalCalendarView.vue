<!--
  📅 CALENDARIO PROFESIONAL CON DATOS REALES
  
  Calendario moderno con arquitectura modular, utilizando composables y componentes reutilizables
  para una mejor mantenibilidad y rendimiento.
-->
<template>
  <div class="professional-calendar-layout">
    <!-- Modal gestor de criterios -->
    <CriteriaManagerModal
      v-if="showCriteriaModal"
      :model-value="showCriteriaModal"
      :criteria="criteriaList"
      @update:modelValue="showCriteriaModal = $event"
      @update:criteria="updateCriteriaList"
    />

    <!-- Contenido principal del calendario -->
    <div class="calendar-main">
      <!-- Encabezado mejorado con navegación y filtros -->
      <EnhancedCalendarHeader
        :current-month-year="currentMonthFormatted"
        :loading="loading"
        @previous-month="goToPreviousMonth"
        @next-month="goToNextMonth"
        @go-to-today="goToToday"
        @refresh="refreshCalendar"
        @export="exportCalendarData"
        @new-class="navigateToNewClass"
        @view-changed="changeView"
        @teacher-changed="filterByTeacher"
        @status-changed="filterByStatus"
      />

      <!-- Estadísticas del mes -->
      <CalendarStats 
        :stats="stats"
        :loading="loading"
        @export-stats="exportStats"
        @refresh="refreshStats"
      />

      <!-- Leyenda de estados -->
      <div class="legend">
        <div class="legend-item">
          <div class="legend-dot complete"></div>
          <span>Completo</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot partial"></div>
          <span>Parcial</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot scheduled"></div>
          <span>Programado</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot none"></div>
          <span>Sin actividad</span>
        </div>
      </div>

      <!-- Cuadrícula del calendario -->
      <div class="calendar-container">
        <!-- Días de la semana -->
        <div class="weekdays-header">
          <div 
            v-for="day in weekDays" 
            :key="day" 
            class="weekday"
          >
            {{ day }}
          </div>
        </div>
        
        <!-- Días del mes -->
        <div class="calendar-grid">
          <template v-for="day in calendarDays" :key="day.date.getTime()">
            <div 
              class="calendar-day"
              :class="[
                { 
                  'current-month': day.isCurrentMonth,
                  'today': day.isToday,
                  'selected': day.isSelected,
                  'has-attendance': day.hasAttendance,
                  'other-month': !day.isCurrentMonth
                },
                getDayClasses(day)
              ]"
              @click="selectDate(day.date)"
            >
              <div class="day-number">
                {{ day.date.getDate() }}
                <span v-if="day.isToday" class="today-badge">Hoy</span>
              </div>
              
              <div 
                v-if="day.hasAttendance" 
                class="day-indicator"
                :class="getDayIndicatorColor(day)"
              ></div>
              
              <div 
                v-if="day.attendanceStatus" 
                class="attendance-status"
                :class="day.attendanceStatus"
                :title="getAttendanceStatusText(day)"
              >
                {{ getAttendanceStatusIcon(day) }}
              </div>
              
              <div class="day-events">
                <template v-if="getClassesForDate(day.date).length > 0">
                  <div 
                    v-for="classItem in getClassesForDate(day.date).slice(0, 2)" 
                    :key="classItem.id"
                    class="event-dot"
                    :class="classItem.status"
                    :title="`${classItem.name} - ${classItem.time}`"
                  ></div>
                </template>
                <div 
                  v-if="getClassesForDate(day.date).length > 2" 
                  class="more-events"
                >
                  +{{ getClassesForDate(day.date).length - 2 }} más
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Panel lateral de clases -->
    <ClassListDrawer
      :is-open="showDrawer"
      :classes="classesForSelectedDate"
      :selected-date="selectedDate"
      @close="closeDrawer"
      @class-selected="goToAttendance"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Componentes
import CriteriaManagerModal from '../components/CriteriaManagerModal.vue'
import EnhancedCalendarHeader from '../components/calendar/EnhancedCalendarHeader.vue'
import CalendarStats from '../components/calendar/CalendarStats.vue'

// Composición
import { useEnhancedCalendar } from '../composables/useEnhancedCalendar'
import { useClassManagement } from '../composables/useClassManagement'
import { useAttendanceStats } from '../composables/useAttendanceStats'

// Tipos
interface CalendarDayType {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasClasses: boolean
  hasAttendanceRecords: boolean
  classCount: number
  attendanceCount: number
  status: 'none' | 'scheduled' | 'partial' | 'complete'
}

// Router
const router = useRouter()

// Días de la semana
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Inicializar composables
const {
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
  selectDate,
  hasClasses
} = useEnhancedCalendar()

const {
  // Estado
  showDrawer,
  classesForSelectedDate,
  
  // Métodos
  closeDrawer,
  loadClassesForSelectedDate
} = useClassManagement(selectedDate)

const {
  // Computed
  monthStatsItems: stats,
  
  // Métodos
  loadMonthStats,
  refreshStats
} = useAttendanceStats(currentMonth)

// Estado para gestor de criterios (implementación local)
const showCriteriaModal = ref(false)
const criteriaList = ref<string[]>(['Participación', 'Comportamiento', 'Atención', 'Académico'])

const updateCriteriaList = (newList: string[]) => {
  criteriaList.value = newList
}

const handleManageCriteria = () => {
  showCriteriaModal.value = true
}

// Cargar datos iniciales
onMounted(() => {
  loadMonthStats(currentMonth.value)
  loadClassesForSelectedDate()
})

// Watchers
watch(selectedDate, (newDate) => {
  if (newDate) {
    loadClassesForSelectedDate()
  }
})

// Métodos del componente
const refreshCalendar = (): void => {
  loading.value = true
  setTimeout(() => {
    loadMonthStats(currentMonth.value)
    loadClassesForSelectedDate()
    loading.value = false
  }, 1000)
}

const exportCalendarData = (): void => {
  console.log('Exportando datos del calendario...')
}

const exportStats = (): void => {
  console.log('Exportando estadísticas...')
}

const navigateToNewClass = (): void => {
  router.push({ name: 'new-class' })
}

const changeView = (view: string): void => {
  console.log('Cambiando a vista:', view)
}

const filterByTeacher = (teacherId: string): void => {
  console.log('Filtrando por profesor:', teacherId)
}

const filterByStatus = (status: string): void => {
  console.log('Filtrando por estado:', status)
}

const goToAttendance = (classItem: any): void => {
  // Navegar a la vista de asistencia para la clase seleccionada
  router.push({
    name: 'class-attendance',
    params: { classId: classItem.id },
    query: { date: selectedDate.value?.toISOString().split('T')[0] }
  })
}
</script>

<style scoped>
/* 🎨 ESTILOS DEL CALENDARIO PROFESIONAL */

.professional-calendar-layout {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6;
}

.calendar-main {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden;
}

/* Contenedor del calendario */
.calendar-container {
  @apply p-4;
}

/* Encabezado de días de la semana */
.weekdays-header {
  @apply grid grid-cols-7 gap-1 mb-2;
}

.weekday {
  @apply text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2;
}

/* Cuadrícula de días */
.calendar-grid {
  @apply grid grid-cols-7 gap-1;
}

/* Estilos para cada día */
.calendar-day {
  @apply min-h-24 p-2 border border-gray-200 dark:border-gray-700 rounded-md 
         transition-colors cursor-pointer flex flex-col;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;
}

.calendar-day.other-month {
  @apply bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500;
}

.calendar-day.today {
  @apply bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800;
}

.calendar-day.selected {
  @apply ring-2 ring-blue-500 dark:ring-blue-400 border-transparent;
}

.calendar-day.has-events {
  @apply bg-green-50 dark:bg-green-900/10;
}

/* Número del día */
.day-number {
  @apply font-medium text-sm mb-1 flex justify-between items-center;
}

.today-badge {
  @apply text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 
         px-2 py-0.5 rounded-full;
}

/* Indicador de día con eventos */
.day-indicator {
  @apply w-2 h-2 rounded-full mx-auto my-1;
}

.day-indicator.status-complete {
  @apply bg-green-500;
}

.day-indicator.status-partial {
  @apply bg-yellow-500;
}

.day-indicator.status-scheduled {
  @apply bg-blue-500;
}

/* Estado de asistencia */
.attendance-status {
  @apply absolute top-1 right-1 text-xs w-5 h-5 flex items-center justify-center 
         rounded-full bg-opacity-90;
}

.attendance-status.complete {
  @apply bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200;
}

.attendance-status.partial {
  @apply bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200;
}

.attendance-status.scheduled {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200;
}

/* Eventos del día */
.day-events {
  @apply mt-auto space-y-1 overflow-hidden;
}

.event-dot {
  @apply w-2 h-2 rounded-full mx-auto;
}

.event-dot.pending {
  @apply bg-yellow-500;
}

.event-dot.completed {
  @apply bg-green-500;
}

.event-dot.missed {
  @apply bg-red-500;
}

.more-events {
  @apply text-xs text-center text-gray-500 dark:text-gray-400 truncate;
}

/* Responsive */
@media (max-width: 640px) {
  .calendar-day {
    min-height: 60px;
    padding: 0.25rem;
    font-size: 0.75rem;
  }
  
  .day-number {
    font-size: 0.75rem;
  }
  
  .today-badge {
    display: none;
  }
  
  .event-dot {
    display: none;
  }
  
  .more-events {
    display: none;
  }
}
</style>
