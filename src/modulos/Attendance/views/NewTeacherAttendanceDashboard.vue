<!--
  🎯 NUEVO DASHBOARD DE ASISTENCIAS PARA MAESTROS
  Arquitectura limpia con el nuevo sistema de calendario
-->
<template>
  <div class="new-teacher-attendance-dashboard">
    <!-- Header Principal -->
    <div class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                📅 Calendario de Asistencias
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Sistema optimizado y limpio para gestión de asistencias
              </p>
            </div>
            
            <!-- Indicador de Estado -->
            <div class="flex items-center space-x-4">
              <div v-if="teacherId" class="text-sm text-gray-600 dark:text-gray-400">
                👨‍🏫 Maestro: {{ teacherId.substring(0, 8) }}...
              </div>
              
              <!-- Badge del nuevo sistema -->
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Nuevo Sistema
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Panel Principal del Calendario -->
        <div class="lg:col-span-3">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatsCard
              title="Clases de Hoy"
              :value="dayStats?.total || 0"
              :subtitle="`${dayStats?.pending || 0} pendientes`"
              icon="📚"
              color="blue"
            />
            <StatsCard
              title="Asistencias Tomadas"
              :value="dayStats?.withAttendance || 0"
              :subtitle="`${(dayStats?.total || 0) - (dayStats?.withAttendance || 0)} restantes`"
              icon="✅"
              color="green"
            />
            <StatsCard
              title="Fecha Seleccionada"
              :value="formattedSelectedDate"
              subtitle="Haz clic en una fecha"
              icon="📅"
              color="purple"
            />
          </div>

          <!-- Nuevo Calendario -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <NewAttendanceCalendar
              :selected-date="selectedDate"
              :teacher-id="teacherId"
              @date-selected="handleDateSelected"
              @month-changed="handleMonthChanged"
            />
          </div>
        </div>

        <!-- Panel Lateral -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Información del Día -->
          <div v-if="selectedDate" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información del Día
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ formattedSelectedDate }}</span>
              </div>
              
              <div class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ dayStats.total }} clases programadas</span>
              </div>
              
              <div class="flex items-center">
                <svg class="w-5 h-5 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ dayStats.pending }} pendientes</span>
              </div>
            </div>

            <!-- Botón de acción rápida -->
            <button
              v-if="dayStats.total > 0"
              class="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              @click="openClassesModal"
            >
              Ver Clases del Día
            </button>
          </div>

          <!-- Accesos Rápidos -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Accesos Rápidos
            </h3>
            
            <div class="space-y-2">
              <button
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                @click="goToToday"
              >
                📅 Ir a Hoy
              </button>
              
              <button
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                @click="refreshData"
              >
                🔄 Actualizar Datos
              </button>
              
              <button
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                @click="openOldCalendar"
              >
                🔙 Calendario Anterior
              </button>
            </div>
          </div>

          <!-- Debug Info (solo en desarrollo) -->
          <div v-if="isDevelopment" class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">
              🐛 Debug Info
            </h4>
            <pre class="text-xs text-yellow-700 dark:text-yellow-300 overflow-x-auto">{{ debugInfo }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Clases -->
    <NewClassesDayModal
      :is-open="showClassesModal"
      :date="selectedDate || ''"
      :classes="dayClasses"
      :loading="isLoading"
      @close="handleCloseModal"
      @take-attendance="handleTakeAttendance"
      @view-attendance="handleViewAttendance"
      @edit-class="handleEditClass"
      @refresh="handleRefreshClasses"
    />

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <div class="flex items-center space-x-3">
          <div class="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span class="text-gray-700 dark:text-gray-300">Cargando calendario...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAttendanceCalendarSimple as useAttendanceCalendar } from '../composables/useAttendanceCalendarSimple'
import { CalendarService } from '../services/CalendarService'
import NewAttendanceCalendar from '../components/NewAttendanceCalendar.vue'
import NewClassesDayModal from '../components/NewClassesDayModal.vue'
import StatsCard from '../components/StatsCard.vue'

// Props
interface Props {
  mode?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'new-calendar'
})

// Router
const router = useRouter()

const {
  selectedDate,
  dayClasses,
  dayStats,
  teacherId,
  isLoading,
  error,
  selectDate,
  refreshCurrentDate,
  validateClassForDay,
  debugClass
} = useAttendanceCalendar()
const showClassesModal = ref(false)
const isDevelopment = ref(process.env.NODE_ENV === 'development')

// Computed
const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return "Ninguna fecha seleccionada"
  
  try {
    // Evitar problemas de zona horaria parseando manualmente
    const [year, month, day] = selectedDate.value.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month es 0-indexed
    
    console.log(`[formattedSelectedDate] Input: ${selectedDate.value}`)
    console.log(`[formattedSelectedDate] Parsed: ${year}-${month}-${day}`)
    console.log(`[formattedSelectedDate] Date object:`, date)
    console.log(`[formattedSelectedDate] Day of week:`, date.getDay())
    
    const formatted = date.toLocaleDateString("es-ES", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })
    
    console.log(`[formattedSelectedDate] Formatted: ${formatted}`)
    
    return formatted
  } catch (error) {
    console.error('[formattedSelectedDate] Error:', error)
    return selectedDate.value
  }
})

const debugInfo = computed(() => ({
  selectedDate: selectedDate.value,
  teacherId: teacherId.value,
  dayClasses: dayClasses.value?.length || 0,
  dayStats: dayStats.value || {},
  isLoading: isLoading.value,
  error: error.value || null,
}))

// Methods
const handleDateSelected = async (date: string) => {
  console.log(`[NewTeacherAttendanceDashboard] Date selected: ${date}`)
  
  try {
    await selectDate(date)
    console.log(
      `[NewTeacherAttendanceDashboard] ✅ Classes loaded for ${date}:`,
      dayClasses.value?.length || 0
    )
  } catch (err) {
    console.error("[NewTeacherAttendanceDashboard] Error loading classes:", err)
  }
}

const handleMonthChanged = (month: Date) => {
  console.log(`[NewTeacherAttendanceDashboard] Month changed:`, month)
}

const openClassesModal = () => {
  if ((dayClasses.value?.length || 0) > 0) {
    showClassesModal.value = true
  }
}

const handleCloseModal = () => {
  showClassesModal.value = false
}

const handleTakeAttendance = (classId: string) => {
  console.log(`[NewTeacherAttendanceDashboard] Take attendance for class:`, classId)
  // TODO: Navegar a formulario de asistencia
  router.push(`/teacher/attendance/${selectedDate.value}/${classId}`)
}

const handleViewAttendance = (classId: string) => {
  console.log(`[NewTeacherAttendanceDashboard] View attendance for class:`, classId)
  // TODO: Navegar a vista de asistencia
  router.push(`/attendance/${selectedDate.value}/${classId}`)
}

const handleEditClass = (classId: string) => {
  console.log(`[NewTeacherAttendanceDashboard] Edit class:`, classId)
  // TODO: Navegar a edición de clase
}

const handleRefreshClasses = async () => {
  await refreshCurrentDate()
}

const goToToday = async () => {
  const today = format(new Date(), 'yyyy-MM-dd')
  await handleDateSelected(today)
}

const refreshData = async () => {
  await refreshCurrentDate()
}

const openOldCalendar = () => {
  router.push('/teacher/attendance/calendar')
}

// Lifecycle
onMounted(async () => {
  console.log(`[NewTeacherAttendanceDashboard] Mounted with mode: ${props.mode}`)
  
  // Cargar día actual por defecto
  await goToToday()
})
</script>

<style scoped>
.new-teacher-attendance-dashboard {
  min-height: 100vh;
  background-color: #f9fafb;
}

.dark .new-teacher-attendance-dashboard {
  background-color: #111827;
}

/* Animaciones */
.transition-colors {
  transition: all 0.2s ease-in-out;
}

/* Grid responsive */
@media (max-width: 1024px) {
  .grid.lg\\:grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
</style>
