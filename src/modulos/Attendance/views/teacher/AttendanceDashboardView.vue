<!--
🎯 ATTENDANCE DASHBOARD VIEW - NUEVA ARQUITECTURA
Vista del calendario para el flujo de asistencia del maestro
Contiene AttendanceCalendar.vue y ClassesModal.vue
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAttendanceOptimized } from '../../composables/useAttendanceOptimized'
import { useAttendanceStore } from '../../store/attendance'
import { useAuthStore } from '../../../../stores/auth'

// Componentes optimizados
import AttendanceCalendar from '../../components/dashboard/AttendanceCalendar.vue'
import DailyClassSummary from '../../components/dashboard/DailyClassSummary.vue'
import AttendanceStatsOverview from '../../components/dashboard/AttendanceStatsOverview.vue'
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel.vue'
import EmergencyClassModal from '../../components/EmergencyClassModal.vue'
import ClassesModal from '../../components/ClassesModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()

// Composables optimizados
const {
  loading,
  loadCalendarData,
  hasActivityOnDate,
  getActivityCountForDate,
  getTeacherClassesForDate,
  preloadCriticalData,
} = useAttendanceOptimized()

// 🎯 Estado del dashboard
const currentMonth = ref(new Date())
const selectedDay = ref<string>(format(new Date(), 'yyyy-MM-dd'))
const classesForSelectedDay = ref<any[]>([])
const isLoadingDailyClasses = ref(false)
const showQuickActions = ref(true)

// 📊 Estadísticas del mes actual
const monthlyStats = ref({
  totalClassesToday: 0,
  completedToday: 0,
  pendingToday: 0,
  weeklyAttendanceRate: 0,
  totalStudentsToday: 0,
})

// 🎨 Estado de la UI
const sidebarExpanded = ref(true)

/**
 * 🚀 COMPUTED PROPERTIES OPTIMIZADAS
 */

// Información del maestro actual
const currentTeacher = computed(() => ({
  name: authStore.user?.email || 'Maestro',
  id: authStore.user?.uid,
  avatar: null, // TODO: Add avatar support to auth store
}))

// Fecha formateada para mostrar
const formattedSelectedDate = computed(() => {
  if (!selectedDay.value) return ''

  const date = parseISO(selectedDay.value)
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).replace(/^\w/, (c) =>
    c.toUpperCase()
  )
})

// Estado del día seleccionado
const selectedDayStatus = computed(() => {
  const hasActivity = hasActivityOnDate(selectedDay.value)

  if (!hasActivity) return { type: 'no-classes', color: 'gray', text: 'Sin clases programadas' }

  const total = classesForSelectedDay.value.length
  const completed = classesForSelectedDay.value.filter((c: any) => c.hasAttendance).length

  if (completed === total && total > 0) {
    return {
      type: 'complete',
      color: 'green',
      text: `${total} clase${total > 1 ? 's' : ''} completada${total > 1 ? 's' : ''}`,
    }
  } else if (completed > 0) {
    return { type: 'partial', color: 'yellow', text: `${completed}/${total} clases completadas` }
  } else {
    return {
      type: 'pending',
      color: 'blue',
      text: `${total} clase${total > 1 ? 's' : ''} pendiente${total > 1 ? 's' : ''}`,
    }
  }
})

// Indicadores de calendario para el mes actual
const calendarIndicators = computed(() => {
  const start = startOfMonth(currentMonth.value)
  const end = endOfMonth(currentMonth.value)
  const days = eachDayOfInterval({ start, end })

  const indicators = days.reduce(
    (acc, day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const hasActivity = hasActivityOnDate(dateStr)
      const activityCount = getActivityCountForDate(dateStr)

      if (hasActivity) {
        acc[dateStr] = {
          hasActivity: true,
          count: activityCount,
          status: 'completed', // TODO: calcular estado real basado en clases completadas vs pendientes
        }
      }

      return acc
    },
    {} as Record<string, any>
  )

  // Debug log para ver los indicadores generados
  console.log('📊 [AttendanceDashboard] Calendar indicators computed:', {
    totalDays: days.length,
    activeDays: Object.keys(indicators).length,
    indicators,
    attendanceDocuments: attendanceStore.attendanceDocuments.length,
  })

  return indicators
})

/**
 * 🔄 MÉTODOS PRINCIPALES
 */

// Cargar clases para el día seleccionado
const loadClassesForSelectedDay = async (date: string) => {
  if (!date || !currentTeacher.value.id) return

  isLoadingDailyClasses.value = true

  try {
    console.log('📅 [AttendanceDashboard] Loading classes for date:', date)

    // Obtener clases del maestro para la fecha
    const result = await getTeacherClassesForDate(date)

    // Combinar clases registradas y pendientes con formato adecuado para el modal
    const allClasses = [
      ...result.registered.map((cls: any) => ({
        ...cls,
        hasAttendance: true,
        attendanceStatus: true,
        isScheduledClass: true,
        schedule: cls.schedule || {
          slots: cls.time
            ? [
                {
                  id: `${cls.id}-slot`,
                  startTime: cls.time.split(' - ')[0] || '00:00',
                  endTime: cls.time.split(' - ')[1] || '23:59',
                },
              ]
            : [],
        },
      })),
      ...result.pending.map((cls: any) => ({
        ...cls,
        hasAttendance: false,
        attendanceStatus: false,
        isScheduledClass: true,
        schedule: cls.schedule || {
          slots: cls.time
            ? [
                {
                  id: `${cls.id}-slot`,
                  startTime: cls.time.split(' - ')[0] || '00:00',
                  endTime: cls.time.split(' - ')[1] || '23:59',
                },
              ]
            : [],
        },
      })),
    ]

    classesForSelectedDay.value = allClasses

    // Actualizar estadísticas del día
    monthlyStats.value.totalClassesToday = allClasses.length
    monthlyStats.value.completedToday = result.registered.length
    monthlyStats.value.pendingToday = result.pending.length
    monthlyStats.value.totalStudentsToday = allClasses.reduce(
      (total, cls) => total + (cls.studentIds?.length || cls.students || 0),
      0
    )

    console.log('📊 [AttendanceDashboard] Classes loaded:', {
      total: allClasses.length,
      completed: result.registered.length,
      pending: result.pending.length,
      allClasses,
      classesForSelectedDay: classesForSelectedDay.value,
    })
  } catch (err) {
    console.error('❌ [AttendanceDashboard] Error loading classes for day:', err)
  } finally {
    isLoadingDailyClasses.value = false
  }
}

// Manejar selección de fecha en el calendario
const handleDateSelect = async (date: string) => {
  console.log('📅 [AttendanceDashboard] Date selected:', date)
  selectedDay.value = date
  await loadClassesForSelectedDay(date)
}

// Manejar apertura del modal de clases (nuevo evento específico del calendario)
const handleOpenClassesModal = async (date: string) => {
  console.log("📅 [AttendanceDashboard] Opening classes modal for date:", date)
  
  // Asegurar que tenemos los datos del día cargados
  if (selectedDay.value !== date) {
    selectedDay.value = date
    await loadClassesForSelectedDay(date)
  }
  
  // Abrir modal con las clases del día
  if (classesForSelectedDay.value.length > 0) {
    modalDate.value = date
    classesForModal.value = classesForSelectedDay.value
    showClassesModal.value = true
    console.log(
      "📋 [AttendanceDashboard] Classes modal opened with",
      classesForSelectedDay.value.length,
      "classes"
    )
  } else {
    console.log("📅 [AttendanceDashboard] No classes found for date:", date)
    // Aún abrir el modal para mostrar opción de crear clase emergente
    modalDate.value = date
    classesForModal.value = []
    showClassesModal.value = true
  }
}

// Navegar a tomar asistencia para una clase específica
const navigateToAttendance = (classId: string) => {
  console.log('🎯 [AttendanceDashboard] Navigating to attendance for class:', classId)

  // Convertir fecha de YYYY-MM-DD a YYYYMMDD para la URL
  const dateForUrl = selectedDay.value.replace(/-/g, '')
  
  console.log('🎯 [AttendanceDashboard] Date conversion:', {
    originalDate: selectedDay.value,
    urlDate: dateForUrl,
    classId,
  })

  // **NUEVA ARQUITECTURA**: Navegar a la nueva ruta TeacherAttendanceForm
  router.push({
    name: 'TeacherAttendanceForm',
    params: {
      date: dateForUrl,
      classId,
    },
    query: {
      return: 'dashboard',
    },
  })
}

// Cargar datos del mes actual
const loadMonthData = async (month: Date) => {
  const start = format(startOfMonth(month), 'yyyy-MM-dd')
  const end = format(endOfMonth(month), 'yyyy-MM-dd')

  console.log('📅 [AttendanceDashboard] Loading month data:', { start, end })

  await loadCalendarData(start, end)
}

// Manejar cambio de mes en el calendario
const handleMonthChange = async (newMonth: Date) => {
  currentMonth.value = newMonth
  await loadMonthData(newMonth)
}

// Acción rápida: marcar todas las clases del día como completadas
const quickCompleteAllClasses = async () => {
  console.log('⚡ [AttendanceDashboard] Quick complete all classes for:', selectedDay.value)

  // TODO: Implementar lógica para marcar todas las clases como "presente" automáticamente
  // Este será un flujo optimizado para días regulares
}

// Estado para el modal de clase emergente
const showEmergencyClassModal = ref(false)

// Estado para el modal de clases del día
const showClassesModal = ref(false)
const modalDate = ref('')
const classesForModal = ref<any[]>([])

// Acción rápida: crear clase emergente
const createEmergencyClass = () => {
  console.log('🚨 [AttendanceDashboard] Creating emergency class for:', selectedDay.value)
  
  // Mostrar el modal de clase emergente
  showEmergencyClassModal.value = true
}

// Handlers para el modal de clase emergente
const handleEmergencyClassSubmitted = (data: any) => {
  console.log('✅ [AttendanceDashboard] Emergency class created successfully:', data)
  showEmergencyClassModal.value = false
  
  // TODO: Actualizar la vista o mostrar mensaje de éxito
  // Opcional: refrescar los datos del día seleccionado
}

const handleEmergencyClassCancel = () => {
  console.log('❌ [AttendanceDashboard] Emergency class creation cancelled')
  showEmergencyClassModal.value = false
}

// Handlers para el modal de clases del día
const handleClassesModalClose = () => {
  showClassesModal.value = false
  modalDate.value = ''
  classesForModal.value = []
}

const handleClassSelection = (classId: string) => {
  console.log('🎯 [AttendanceDashboard] Class selected from modal:', classId)
  
  // Cerrar el modal
  handleClassesModalClose()
  
  // Navegar a la vista de asistencia
  navigateToAttendance(classId)
}

const handleCreateEmergencyFromModal = () => {
  // Cerrar el modal de clases
  handleClassesModalClose()
  
  // Abrir el modal de clase emergente
  createEmergencyClass()
}

// Función para revisar clases en lote
const handleBatchReview = () => {
  console.log('📋 [AttendanceDashboard] Batch review for day:', selectedDay.value)
  
  const classesOfDay = classesForSelectedDay.value
  if (classesOfDay.length === 0) {
    console.log('❌ [AttendanceDashboard] No classes to review for selected day')
    return
  }
  
  // Crear modal de selección de clases o navegar a vista especial
  console.log(`📋 [AttendanceDashboard] Reviewing ${classesOfDay.length} classes for batch attendance`)
  
  // Por ahora, abrir la primera clase pendiente
  const pendingClasses = classesOfDay.filter((cls) => !cls.hasAttendance)
  if (pendingClasses.length > 0) {
    navigateToAttendance(pendingClasses[0].id)
  } else {
    console.log('✅ [AttendanceDashboard] All classes for this day already have attendance taken')
  }
}

// Alternar vista del sidebar
const toggleSidebar = () => {
  sidebarExpanded.value = !sidebarExpanded.value
}

/**
 * 🎬 WATCHERS Y LIFECYCLE
 */

// Watch para cambios en el día seleccionado
watch(selectedDay, (newDate) => {
  if (newDate) {
    loadClassesForSelectedDay(newDate)
  }
})

// Watch para cambios en los documentos de asistencia (para actualizar indicadores)
watch(
  () => attendanceStore.attendanceDocuments.length,
  (newLength) => {
    console.log('📄 [AttendanceDashboard] Attendance documents changed:', {
      count: newLength,
      documents: attendanceStore.attendanceDocuments.map((doc) => ({
        id: doc.id,
        fecha: doc.fecha,
        teacherId: doc.teacherId,
        classId: doc.classId,
      })),
    })
  }
)

// Inicialización del dashboard
onMounted(async () => {
  console.log('🚀 [AttendanceDashboard] Initializing Teacher Attendance Dashboard')

  // Asegurar que tenemos un maestro autenticado
  if (!currentTeacher.value.id) {
    console.warn('⚠️ [AttendanceDashboard] No authenticated teacher found')
    return
  }

  try {
    // 1. Precargar datos críticos
    await preloadCriticalData()

    // 2. Cargar documentos de asistencia para el período actual
    const start = format(startOfMonth(currentMonth.value), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth.value), 'yyyy-MM-dd')
    
    console.log('📄 [AttendanceDashboard] Loading attendance documents for:', { start, end })
    await attendanceStore.fetchAttendanceDocuments(start, end)

    // 3. Cargar datos del calendario
    await loadMonthData(currentMonth.value)

    // 4. Cargar clases para hoy
    await loadClassesForSelectedDay(selectedDay.value)

    console.log('✅ [AttendanceDashboard] Dashboard initialized successfully')
    console.log('📊 [AttendanceDashboard] Calendar indicators:', calendarIndicators.value)
  } catch (err) {
    console.error('❌ [AttendanceDashboard] Error initializing dashboard:', err)
  }
})

// Exponer métodos para testing
defineExpose({
  handleDateSelect,
  navigateToAttendance,
  loadClassesForSelectedDay,
  quickCompleteAllClasses,
  createEmergencyClass,
  handleClassSelection,
  handleClassesModalClose,
  handleCreateEmergencyFromModal,
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 🎯 HEADER PRINCIPAL -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Información del maestro y navegación -->
          <div class="flex items-center space-x-4">
            <!-- Avatar del maestro -->
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {{ currentTeacher.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                  Centro de Asistencia
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Bienvenido, {{ currentTeacher.name }}
                </p>
              </div>
            </div>
          </div>

          <!-- Controles de vista y acciones -->
          <div class="flex items-center space-x-4">
            <!-- Selector de vista -->
            <div class="hidden md:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm">
                Calendario
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 🏗️ LAYOUT PRINCIPAL - DOS COLUMNAS -->
    <div class="flex flex-1">
      <!-- 📅 COLUMNA PRINCIPAL (70%) - CALENDARIO -->
      <main :class="['flex-1 transition-all duration-300', sidebarExpanded ? 'lg:mr-80' : 'lg:mr-16']">
        <div class="p-6">
          <!-- Estadísticas del día actual -->
          <AttendanceStatsOverview
            :stats="monthlyStats"
            :selected-date="selectedDay"
            :is-loading="isLoadingDailyClasses"
            class="mb-6"
          />

          <!-- Calendario principal -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AttendanceCalendar
              :current-month="currentMonth"
              :selected-date="selectedDay"
              :indicators="calendarIndicators"
              :loading="loading"
              @date-select="handleDateSelect"
              @month-change="handleMonthChange"
              @open-classes-modal="handleOpenClassesModal"
            />
          </div>
        </div>
      </main>

      <!-- 📋 COLUMNA DERECHA (30%) - PANEL DINÁMICO -->
      <aside
        :class="[
          'fixed right-0 top-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 flex flex-col',
          sidebarExpanded ? 'w-80 translate-x-0' : 'w-16 translate-x-0',
          'lg:relative lg:translate-x-0',
        ]"
      >
        <!-- Header del sidebar con mejor diseño -->
        <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div class="flex items-center justify-between">
            <!-- Título del panel -->
            <div v-show="sidebarExpanded" class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Panel de Actividades
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formattedSelectedDate }}
                </p>
              </div>
            </div>

            <!-- Botón de colapsar/expandir mejorado -->
            <div class="flex items-center space-x-1">
              <!-- Indicadores rápidos cuando está colapsado -->
              <div v-show="!sidebarExpanded" class="flex items-center space-x-1">
                <!-- Indicador de clases pendientes -->
                <div
                  v-if="monthlyStats.pendingToday > 0"
                  class="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                  :title="`${monthlyStats.pendingToday} clases pendientes`"
                >
                  {{ monthlyStats.pendingToday }}
                </div>
                <!-- Indicador de clases completadas -->
                <div
                  v-if="monthlyStats.completedToday > 0"
                  class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                  :title="`${monthlyStats.completedToday} clases completadas`"
                >
                  {{ monthlyStats.completedToday }}
                </div>
              </div>

              <!-- Botón toggle mejorado -->
              <button
                :title="sidebarExpanded ? 'Ocultar panel' : 'Mostrar panel'"
                class="toggle-button group p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                @click="toggleSidebar"
              >
                <svg
                  class="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                  :class="{ 'rotate-180': !sidebarExpanded }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Contenido del sidebar con scroll optimizado -->
        <div class="flex-1 overflow-hidden">
          <!-- Contenido expandido con scroll suave -->
          <div v-show="sidebarExpanded" class="h-full overflow-y-auto custom-scrollbar">
            <div class="p-4 space-y-6">
              <!-- Estado del día mejorado -->
              <div class="space-y-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Estado del Día
                </h3>
                <div
                  :class="[
                    'px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-200 hover:shadow-md',
                    selectedDayStatus.color === 'green'
                      ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-400 dark:border-green-800'
                      : selectedDayStatus.color === 'yellow'
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:text-yellow-400 dark:border-yellow-800'
                        : selectedDayStatus.color === 'blue'
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-400 dark:border-blue-800'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200 dark:from-gray-800/20 dark:to-gray-700/20 dark:text-gray-400 dark:border-gray-700',
                  ]"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      :class="[
                        'w-3 h-3 rounded-full animate-pulse',
                        selectedDayStatus.color === 'green'
                          ? 'bg-green-500'
                          : selectedDayStatus.color === 'yellow'
                            ? 'bg-yellow-500'
                            : selectedDayStatus.color === 'blue'
                              ? 'bg-blue-500'
                              : 'bg-gray-400',
                      ]"
                    />
                    <span>{{ selectedDayStatus.text }}</span>
                  </div>
                  <!-- Progreso visual -->
                  <div class="text-xs opacity-75">
                    {{ monthlyStats.completedToday }}/{{ monthlyStats.totalClassesToday }}
                  </div>
                </div>
              </div>

              <!-- Resumen rápido de estadísticas -->
              <div class="space-y-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Resumen Rápido
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <!-- Clases completadas -->
                  <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-sm transition-shadow">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                      {{ monthlyStats.completedToday }}
                    </div>
                    <div class="text-xs text-green-700 dark:text-green-300 font-medium">
                      Completadas
                    </div>
                  </div>
                  <!-- Clases pendientes -->
                  <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:shadow-sm transition-shadow">
                    <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {{ monthlyStats.pendingToday }}
                    </div>
                    <div class="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                      Pendientes
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resumen de clases del día -->
              <div class="space-y-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Clases del Día
                </h3>
                <DailyClassSummary
                  :classes="classesForSelectedDay"
                  :selected-date="selectedDay"
                  :is-loading="isLoadingDailyClasses"
                  @select-class="navigateToAttendance"
                  @create-emergency="createEmergencyClass"
                  @batch-review="handleBatchReview"
                />
              </div>

              <!-- Panel de acciones rápidas -->
              <div v-show="showQuickActions && classesForSelectedDay.length > 0" class="space-y-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Acciones Rápidas
                </h3>
                <QuickActionsPanel
                  :classes="classesForSelectedDay"
                  :selected-date="selectedDay"
                  @quick-complete-all="quickCompleteAllClasses"
                  @create-emergency="createEmergencyClass"
                />
              </div>
            </div>
          </div>

          <!-- Contenido colapsado mejorado -->
          <div v-show="!sidebarExpanded" class="h-full flex flex-col items-center justify-start pt-6 space-y-4">
            <!-- Indicadores compactos -->
            <div class="space-y-3">
              <!-- Indicador de clases pendientes -->
              <div
                v-if="monthlyStats.pendingToday > 0"
                class="collapse-indicator w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                :title="`${monthlyStats.pendingToday} clases pendientes`"
                @click="toggleSidebar"
              >
                <div class="text-center">
                  <div class="text-lg font-bold">{{ monthlyStats.pendingToday }}</div>
                  <div class="text-xs opacity-90">Pend</div>
                </div>
              </div>

              <!-- Indicador de clases completadas -->
              <div
                v-if="monthlyStats.completedToday > 0"
                class="collapse-indicator w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                :title="`${monthlyStats.completedToday} clases completadas`"
                @click="toggleSidebar"
              >
                <div class="text-center">
                  <div class="text-lg font-bold">{{ monthlyStats.completedToday }}</div>
                  <div class="text-xs opacity-90">Done</div>
                </div>
              </div>

              <!-- Indicador de total de estudiantes -->
              <div
                v-if="monthlyStats.totalStudentsToday > 0"
                class="collapse-indicator w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                :title="`${monthlyStats.totalStudentsToday} estudiantes hoy`"
                @click="toggleSidebar"
              >
                <div class="text-center">
                  <div class="text-lg font-bold">{{ monthlyStats.totalStudentsToday }}</div>
                  <div class="text-xs opacity-90">Est</div>
                </div>
              </div>
            </div>

            <!-- Botón de ayuda rápida -->
            <div class="mt-auto mb-4">
              <button
                class="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 pulse-hint"
                title="Expandir panel para más opciones"
                @click="toggleSidebar"
              >
                <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 🚀 OVERLAY PARA MÓVIL -->
    <div v-show="sidebarExpanded" class="fixed inset-0 bg-black bg-opacity-25 z-20 lg:hidden" @click="toggleSidebar" />

    <!-- 🚨 MODAL DE CLASE EMERGENTE -->
    <EmergencyClassModal
      v-model="showEmergencyClassModal"
      :date="selectedDay"
      @submitted="handleEmergencyClassSubmitted"
      @cancel="handleEmergencyClassCancel"
    />

    <!-- 📋 MODAL DE CLASES DEL DÍA -->
    <ClassesModal
      :is-open="showClassesModal"
      :date="modalDate"
      :classes="classesForModal"
      @close="handleClassesModalClose"
      @select-class="handleClassSelection"
      @create-emergency-class="handleCreateEmergencyFromModal"
    />
  </div>
</template>

<style scoped>
/* Animaciones personalizadas para el dashboard */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Efectos de hover mejorados */
.hover-lift {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Scroll personalizado para el sidebar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e0 100%);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #cbd5e0 0%, #a0aec0 100%);
}

/* Dark mode scrollbar */
.dark .custom-scrollbar {
  scrollbar-color: #4a5568 transparent;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #4a5568 0%, #2d3748 100%);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
}

/* Animaciones suaves para los indicadores del sidebar colapsado */
.collapse-indicator {
  transform: scale(0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-indicator:hover {
  transform: scale(1.05);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Transiciones suaves para el colapso del sidebar */
.sidebar-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mejoras para el botón de toggle */
.toggle-button {
  position: relative;
  overflow: hidden;
}

.toggle-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition:
    width 0.3s ease,
    height 0.3s ease;
}

.toggle-button:hover::before {
  width: 40px;
  height: 40px;
}

/* Indicador de pulsación para ayuda */
.pulse-hint {
  animation: gentle-pulse 3s ease-in-out infinite 2s;
}

@keyframes gentle-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}
</style>
