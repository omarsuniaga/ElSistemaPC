<!-- 
  🚀 VISTA PRINCIPAL DE ASISTENCIA OPTIMIZADA
  Sistema completo con navegación fluida y rendimiento mejorado
-->
<template>
  <div class="attendance-view-optimized min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 🎯 Header principal -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Título y breadcrumb -->
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              Gestión de Asistencia
            </h1>
            <div class="hidden sm:flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span>{{ getCurrentStep() }}</span>
            </div>
          </div>

          <!-- Controles de navegación -->
          <div class="flex items-center space-x-2">
            <!-- Selector de vista -->
            <div class="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              <button
                v-for="viewOption in viewOptions"
                :key="viewOption.key"
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                  currentView === viewOption.key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                ]"
                @click="setCurrentView(viewOption.key)"
              >
                {{ viewOption.label }}
              </button>
            </div>

            <!-- Botón de acciones rápidas -->
            <button
              class="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Acciones rápidas"
              @click="showQuickActions = !showQuickActions"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 📊 Panel de información contextual -->
    <div
      v-if="showContextPanel"
      class="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <svg
              class="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="text-sm">
              <span class="font-medium text-blue-900 dark:text-blue-100">{{
                getContextMessage()
              }}</span>
              <span class="text-blue-700 dark:text-blue-300 ml-2">{{ getContextDetails() }}</span>
            </div>
          </div>
          <button
            class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            @click="showContextPanel = false"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 🎛️ Panel de acciones rápidas -->
    <div
      v-if="showQuickActions"
      class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button
            v-for="action in quickActions"
            :key="action.key"
            :disabled="action.disabled"
            class="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="executeQuickAction(action.key)"
          >
            <component :is="action.icon" class="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" />
            <span class="text-xs text-gray-700 dark:text-gray-300 text-center">{{
              action.label
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 📱 Contenido principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- 📅 Panel lateral (calendario/navegación) -->
        <div class="lg:col-span-1 space-y-4">
          <!-- Calendario optimizado -->
          <AttendanceCalendarOptimized
            v-if="currentView === 'calendar'"
            :selected-date="selectedDate"
            @date-selected="handleDateSelected"
            @month-changed="handleMonthChanged"
          />

          <!-- Navegación rápida -->
          <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 class="font-medium text-gray-900 dark:text-white mb-3">Navegación</h3>
            <div class="space-y-2">
              <button
                class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                @click="setCurrentView('calendar')"
              >
                📅 Seleccionar fecha
              </button>
              <button
                class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                @click="goToToday"
              >
                🗓️ Ir a hoy
              </button>
              <button
                class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                @click="openReportsView"
              >
                📊 Ver reportes
              </button>
            </div>
          </div>

          <!-- Panel de estadísticas rápidas -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 class="font-medium text-gray-900 dark:text-white mb-3">Estadísticas</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Clases hoy:</span>
                <span class="font-medium">{{ todayStats.classes }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Asistencia promedio:</span>
                <span class="font-medium">{{ todayStats.averageAttendance }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Pendientes:</span>
                <span class="font-medium text-yellow-600 dark:text-yellow-400">{{
                  todayStats.pending
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 📋 Panel principal -->
        <div class="lg:col-span-3">
          <!-- Vista de calendario -->
          <div v-if="currentView === 'calendar'" class="space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <svg
                class="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Selecciona una fecha
              </h3>
              <p class="text-gray-500 dark:text-gray-400">
                Elige una fecha del calendario para ver o registrar asistencia
              </p>
            </div>
          </div>

          <!-- Vista de selección de clase -->
          <div v-else-if="currentView === 'class-select'" class="space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-gray-900 dark:text-white">
                  Clases para {{ formatSelectedDate() }}
                </h3>
                <button
                  :disabled="loading"
                  class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="refreshClasses"
                >
                  <svg
                    class="w-4 h-4"
                    :class="loading ? 'animate-spin' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>

              <!-- Lista de clases -->
              <div v-if="availableClasses.length > 0" class="space-y-2">
                <button
                  v-for="classItem in availableClasses"
                  :key="classItem.id"
                  class="w-full p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @click="selectClass(classItem.id)"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="font-medium text-gray-900 dark:text-white">
                        {{ classItem.name }}
                      </h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ classItem.studentCount }} estudiantes • {{ classItem.timeSlot }}
                      </p>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span
                        v-if="classItem.hasAttendance"
                        class="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs"
                      >
                        Registrada
                      </span>
                      <svg
                        class="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Estado vacío -->
              <div v-else class="text-center py-8">
                <svg
                  class="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay clases programadas
                </h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">
                  No se encontraron clases para esta fecha
                </p>
                <button
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  @click="createEmergencyClass"
                >
                  + Crear clase emergente
                </button>
              </div>
            </div>
          </div>

          <!-- Vista de lista de asistencia -->
          <div v-else-if="currentView === 'attendance-list'">
            <AttendanceListOptimized
              :selected-date="selectedDate"
              :selected-class="selectedClass"
              :selected-class-name="selectedClassName"
              :show-debug-info="showDebugInfo"
              @status-updated="handleStatusUpdated"
              @saved="handleSaved"
              @error="handleError"
            />
          </div>

          <!-- Vista de reportes -->
          <div v-else-if="currentView === 'reports'" class="space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Reportes de Asistencia
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  @click="generateDailyReport"
                >
                  <h4 class="font-medium text-gray-900 dark:text-white">Reporte Diario</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Asistencia de todas las clases de hoy
                  </p>
                </button>
                <button
                  class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  @click="generateWeeklyReport"
                >
                  <h4 class="font-medium text-gray-900 dark:text-white">Reporte Semanal</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Resumen de la semana actual
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔄 Loading overlay -->
    <div
      v-if="loading"
      class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div class="flex items-center space-x-3">
          <div
            class="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
          />
          <span class="text-gray-700 dark:text-gray-300">{{ loadingMessage }}</span>
        </div>
      </div>
    </div>

    <!-- 🎉 Toast notifications -->
    <div
      v-if="showToast"
      class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300"
      :class="toastClass"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {format} from "date-fns"
import {es} from "date-fns/locale"
import AttendanceCalendarOptimized from "../components/AttendanceCalendarOptimized.vue"
import AttendanceListOptimized from "../components/AttendanceListOptimized.vue"
import {useAttendanceOptimizedSimple} from "../composables/useAttendanceOptimizedSimple"

// 🎛️ Estado principal
const currentView = ref<"calendar" | "class-select" | "attendance-list" | "reports">("calendar")
const selectedDate = ref("")
const selectedClass = ref("")
const selectedClassName = ref("")
const loading = ref(false)
const loadingMessage = ref("")
const showQuickActions = ref(false)
const showContextPanel = ref(true)
const showDebugInfo = ref(false)

// 🎉 Toast notifications
const showToast = ref(false)
const toastMessage = ref("")
const toastType = ref<"success" | "error" | "warning" | "info">("success")

// 📊 Datos
const availableClasses = ref<any[]>([])
const todayStats = ref({
  classes: 0,
  averageAttendance: 85,
  pending: 0,
})

// 🚀 Composable
const {state, attendanceStore, classesStore} = useAttendanceOptimizedSimple()

/**
 * 🎛️ Configuración de vistas
 */
const viewOptions = [
  {key: "calendar", label: "📅 Calendario"},
  {key: "class-select", label: "📚 Clases"},
  {key: "attendance-list", label: "👥 Asistencia"},
  {key: "reports", label: "📊 Reportes"},
]

const quickActions = [
  {key: "today", label: "Ir a hoy", icon: "CalendarIcon", disabled: false},
  {
    key: "mark-all-present",
    label: "Todos presentes",
    icon: "CheckIcon",
    disabled: !selectedClass.value,
  },
  {key: "export-pdf", label: "Exportar PDF", icon: "DocumentIcon", disabled: !selectedClass.value},
  {key: "send-notifications", label: "Notificar ausentes", icon: "BellIcon", disabled: true},
  {key: "emergency-class", label: "Clase emergente", icon: "PlusIcon", disabled: false},
  {key: "settings", label: "Configuración", icon: "CogIcon", disabled: false},
]

/**
 * 🎯 Computed properties
 */
const toastClass = computed(() => {
  const classes = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }
  return classes[toastType.value]
})

/**
 * 🎨 Funciones de UI
 */
const getCurrentStep = (): string => {
  const steps = {
    calendar: "Paso 1: Seleccionar fecha",
    "class-select": "Paso 2: Elegir clase",
    "attendance-list": "Paso 3: Registrar asistencia",
    reports: "Reportes y análisis",
  }
  return steps[currentView.value] || ""
}

const getContextMessage = (): string => {
  const messages = {
    calendar: "Selecciona una fecha del calendario para comenzar",
    "class-select": `Clases disponibles para ${formatSelectedDate()}`,
    "attendance-list": `Registrando asistencia: ${selectedClassName.value}`,
    reports: "Genera reportes de asistencia",
  }
  return messages[currentView.value] || ""
}

const getContextDetails = (): string => {
  if (currentView.value === "attendance-list") {
    return `${formatSelectedDate()}`
  }
  return ""
}

const formatSelectedDate = (): string => {
  if (!selectedDate.value) return ""
  return format(new Date(selectedDate.value), "d 'de' MMMM, yyyy", {locale: es})
}

/**
 * 🎛️ Navegación entre vistas
 */
const setCurrentView = (view: typeof currentView.value) => {
  currentView.value = view

  // Auto-navegación inteligente
  if (view === "class-select" && !selectedDate.value) {
    currentView.value = "calendar"
    showToast("Primero selecciona una fecha", "warning")
  }

  if (view === "attendance-list" && (!selectedDate.value || !selectedClass.value)) {
    currentView.value = selectedDate.value ? "class-select" : "calendar"
    showToast("Completa los pasos anteriores", "warning")
  }
}

/**
 * 📅 Manejo de fechas
 */
const handleDateSelected = async (date: string) => {
  selectedDate.value = date
  selectedClass.value = ""
  selectedClassName.value = ""

  // Cargar clases para esta fecha
  await loadClassesForDate(date)

  // Auto-navegar si solo hay una clase
  if (availableClasses.value.length === 1) {
    selectClass(availableClasses.value[0].id)
  } else {
    setCurrentView("class-select")
  }
}

const handleMonthChanged = (month: string) => {
  console.log("📅 [AttendanceView] Month changed:", month)
}

const goToToday = () => {
  const today = new Date().toISOString().split("T")[0]
  handleDateSelected(today)
}

/**
 * 📚 Manejo de clases
 */
const loadClassesForDate = async (date: string) => {
  try {
    loading.value = true
    loadingMessage.value = "Cargando clases..."

    // TODO: Implementar carga real de clases
    // Por ahora, datos de prueba
    availableClasses.value = [
      {
        id: "class1",
        name: "Piano Básico",
        studentCount: 8,
        timeSlot: "10:00 - 11:00",
        hasAttendance: false,
      },
      {
        id: "class2",
        name: "Guitarra Intermedio",
        studentCount: 6,
        timeSlot: "14:00 - 15:00",
        hasAttendance: true,
      },
    ]

    console.log("📚 [AttendanceView] Classes loaded for", date)
  } catch (error) {
    console.error("❌ [AttendanceView] Error loading classes:", error)
    showToast("Error al cargar clases", "error")
  } finally {
    loading.value = false
  }
}

const selectClass = (classId: string) => {
  selectedClass.value = classId

  const classData = availableClasses.value.find((c) => c.id === classId)
  selectedClassName.value = classData?.name || ""

  setCurrentView("attendance-list")
}

const refreshClasses = () => {
  if (selectedDate.value) {
    loadClassesForDate(selectedDate.value)
  }
}

/**
 * ⚡ Acciones rápidas
 */
const executeQuickAction = (actionKey: string) => {
  const actions = {
    today: goToToday,
    "mark-all-present": () => showToast("Función próximamente", "info"),
    "export-pdf": () => showToast("Función próximamente", "info"),
    "send-notifications": () => showToast("Función próximamente", "info"),
    "emergency-class": createEmergencyClass,
    settings: () => showToast("Función próximamente", "info"),
  }

  const action = actions[actionKey as keyof typeof actions]
  if (action) {
    action()
  }
}

const createEmergencyClass = () => {
  showToast("Función de clase emergente próximamente", "info")
}

/**
 * 📊 Reportes
 */
const openReportsView = () => {
  setCurrentView("reports")
}

const generateDailyReport = () => {
  showToast("Generando reporte diario...", "info")
}

const generateWeeklyReport = () => {
  showToast("Generando reporte semanal...", "info")
}

/**
 * 🎉 Event handlers
 */
const handleStatusUpdated = (studentId: string, status: string) => {
  console.log("👤 [AttendanceView] Status updated:", studentId, status)
}

const handleSaved = () => {
  showToast("Asistencia guardada exitosamente", "success")
}

const handleError = (error: string) => {
  showToast(error, "error")
}

/**
 * 🎉 Toast system
 */
const showToastMessage = (message: string, type: typeof toastType.value = "success") => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Alias para facilitar uso
const showToast = showToastMessage

/**
 * 🚀 Lifecycle
 */
onMounted(() => {
  // Cargar estadísticas del día
  const today = new Date().toISOString().split("T")[0]
  loadClassesForDate(today).then(() => {
    todayStats.value.classes = availableClasses.value.length
    todayStats.value.pending = availableClasses.value.filter((c) => !c.hasAttendance).length
  })

  // Debug mode en desarrollo
  if (import.meta.env.DEV) {
    showDebugInfo.value = true
  }
})
</script>

<style scoped>
.attendance-view-optimized {
  @apply transition-all duration-200;
}

/* Transiciones suaves */
.transition-colors {
  transition: all 0.2s ease-in-out;
}

/* Animaciones para las cards */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.space-y-4 > * {
  animation: slideIn 0.3s ease-out;
}

/* Responsive grid adjustments */
@media (max-width: 1024px) {
  .grid-cols-1.lg\\:grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
</style>
