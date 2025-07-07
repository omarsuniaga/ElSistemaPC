🎯 TEACHER ATTENDANCE DASHBOARD
Centro de mando principal para maestros - "Del Registro a la Gestión
del Aula en Tiempo Real"
-->

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useRouter} from "vue-router"
import {format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO} from "date-fns"
import {es} from "date-fns/locale"
import {useAttendanceOptimized} from "../composables/useAttendanceOptimized"
import {useAttendanceStore} from "../store/attendance"
import {useAuthStore} from "../../../stores/auth"

// Componentes optimizados
import AttendanceCalendarOptimized from "../components/AttendanceCalendarOptimized.vue"
import DailyClassSummary from "../components/dashboard/DailyClassSummary.vue"
import AttendanceStatsOverview from "../components/dashboard/AttendanceStatsOverview.vue"
import QuickActionsPanel from "../components/dashboard/QuickActionsPanel.vue"
import DynamicSidePanel from "../components/dashboard/DynamicSidePanel.vue"
import EmergencyClassModal from "../components/EmergencyClassModal.vue"
import ClassesModal from "../components/ClassesModal.vue"

const router = useRouter()
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()

// Composables optimizados
const {
  loadCalendarData,
  hasActivityOnDate,
  getActivityCountForDate,
  getTeacherClassesForDate,
  preloadCriticalData,
} = useAttendanceOptimized()

// 🎯 Estado del dashboard
const currentMonth = ref(new Date())
const selectedDay = ref<string>(format(new Date(), "yyyy-MM-dd"))
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
const selectedView = ref<"calendar" | "list" | "stats">("calendar")

/**
 * 🚀 COMPUTED PROPERTIES OPTIMIZADAS
 */

// Información del maestro actual
const currentTeacher = computed(() => ({
  name: authStore.user?.email || "Maestro",
  id: authStore.user?.uid,
  avatar: null, // TODO: Add avatar support to auth store
}))

// Fecha formateada para mostrar
const formattedSelectedDate = computed(() => {
  if (!selectedDay.value) return ""

  const date = parseISO(selectedDay.value)
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", {locale: es}).replace(/^\w/, (c) =>
    c.toUpperCase()
  )
})

// Estado del día seleccionado
const selectedDayStatus = computed((): {type: string; color: "green" | "yellow" | "blue" | "gray"; text: string} => {
  const hasActivity = hasActivityOnDate(selectedDay.value)

  if (!hasActivity) return {type: "no-classes", color: "gray", text: "Sin clases programadas"}

  const total = classesForSelectedDay.value.length
  const completed = classesForSelectedDay.value.filter((c: any) => c.hasAttendance).length

  if (completed === total && total > 0) {
    return {
      type: "complete",
      color: "green",
      text: `${total} clase${total > 1 ? "s" : ""} completada${total > 1 ? "s" : ""}`,
    }
  } else if (completed > 0) {
    return {type: "partial", color: "yellow", text: `${completed}/${total} clases completadas`}
  } else {
    return {
      type: "pending",
      color: "blue",
      text: `${total} clase${total > 1 ? "s" : ""} pendiente${total > 1 ? "s" : ""}`,
    }
  }
})

// Indicadores de calendario para el mes actual
const calendarIndicators = computed(() => {
  const start = startOfMonth(currentMonth.value)
  const end = endOfMonth(currentMonth.value)
  const days = eachDayOfInterval({start, end})

  const indicators = days.reduce(
    (acc, day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const hasActivity = hasActivityOnDate(dateStr)
      const activityCount = getActivityCountForDate(dateStr)

      if (hasActivity) {
        acc[dateStr] = {
          hasActivity: true,
          count: activityCount,
          status: "completed", // TODO: calcular estado real basado en clases completadas vs pendientes
        }
      }

      return acc
    },
    {} as Record<string, any>
  )

  // Debug log para ver los indicadores generados
  console.log("📊 [Dashboard] Calendar indicators computed:", {
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
    console.log("📅 [Dashboard] Loading classes for date:", date)

    // Obtener clases del maestro para la fecha
    const result = await getTeacherClassesForDate(date)

    // Función para evaluar permisos de asistencia
    const getCanTakeAttendance = (cls: any): boolean => {
      const teacherId = currentTeacher.value.id
      
      // Si es el maestro principal (creador) de la clase, siempre puede tomar asistencia
      if (cls.teacherId === teacherId) {
        return true
      }
      
      // Si es una clase compartida, verificar permisos específicos
      if (cls.isSharedClass && cls.sharedWith) {
        const myPermissions = cls.sharedWith.find((teacher: any) => teacher.teacherId === teacherId)
        return myPermissions?.permissions?.canTakeAttendance === true
      }
      
      // Por defecto, permitir si no hay restricciones específicas
      return true
    }

    // Combinar clases registradas y pendientes con formato adecuado para el modal
    const allClasses = [
      ...result.registered.map((cls: any) => ({
        ...cls,
        hasAttendance: true,
        attendanceStatus: true,
        isScheduledClass: true,
        canTakeAttendance: getCanTakeAttendance(cls), // Evaluar permisos dinámicamente
        schedule: cls.schedule || {
          slots: cls.time
            ? [
                {
                  id: `${cls.id}-slot`,
                  startTime: cls.time.split(" - ")[0] || "00:00",
                  endTime: cls.time.split(" - ")[1] || "23:59",
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
        canTakeAttendance: getCanTakeAttendance(cls), // Evaluar permisos dinámicamente
        schedule: cls.schedule || {
          slots: cls.time
            ? [
                {
                  id: `${cls.id}-slot`,
                  startTime: cls.time.split(" - ")[0] || "00:00",
                  endTime: cls.time.split(" - ")[1] || "23:59",
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

    console.log("📊 [Dashboard] Classes loaded:", {
      total: allClasses.length,
      completed: result.registered.length,
      pending: result.pending.length,
      allClasses,
      classesForSelectedDay: classesForSelectedDay.value,
    })
  } catch (err) {
    console.error("❌ [Dashboard] Error loading classes for day:", err)
  } finally {
    isLoadingDailyClasses.value = false
  }
}

// Manejar selección de fecha en el calendario
const handleDateSelect = async (date: string) => {
  console.log("📅 [Dashboard] Date selected:", date)
  selectedDay.value = date
  await loadClassesForSelectedDay(date)
  
  // Abrir modal con las clases del día
  if (classesForSelectedDay.value.length > 0) {
    modalDate.value = date
    classesForModal.value = classesForSelectedDay.value
    showClassesModal.value = true
  } else {
    console.log("📅 [Dashboard] No classes found for date:", date)
  }
}

// Función de depuración (temporal)
const debugClassData = () => {
  console.log("🔍 [DEBUG] Current state:", {
    selectedDay: selectedDay.value,
    classesForSelectedDay: classesForSelectedDay.value,
    isLoadingDailyClasses: isLoadingDailyClasses.value,
    currentTeacher: currentTeacher.value,
  })
}

// Exponer función de debug globalmente
if (typeof window !== "undefined") {
  ;(window as any).debugClassData = debugClassData
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
  console.log("🎯 [Dashboard] Navigating to attendance for class:", classId)

  // Convertir fecha de YYYY-MM-DD a YYYYMMDD para la URL
  const dateForUrl = selectedDay.value.replace(/-/g, "")
  
  console.log("🎯 [Dashboard] Date conversion:", {
    originalDate: selectedDay.value,
    urlDate: dateForUrl,
    classId,
  })

  // Navegar a la lista de asistencia con el formato de fecha correcto
  router.push({
    name: "AttendanceDetail",
    params: {
      date: dateForUrl,
      classId,
    },
    query: {
      return: "dashboard",
    },
  })
}

// Cargar datos del mes actual
const loadMonthData = async (month: Date) => {
  const start = format(startOfMonth(month), "yyyy-MM-dd")
  const end = format(endOfMonth(month), "yyyy-MM-dd")

  console.log("📅 [Dashboard] Loading month data:", {start, end})

  await loadCalendarData(start, end)
}

// Manejar cambio de mes en el calendario optimizado
const handleMonthChange = async (monthStr: string) => {
  console.log("📅 [AttendanceDashboard] Month changed to:", monthStr)
  
  // El calendario optimizado emite un string "yyyy-MM", lo convertimos a Date
  const [year, month] = monthStr.split("-").map(Number)
  const newMonth = new Date(year, month - 1, 1) // month - 1 porque Date usa índices base 0
  
  currentMonth.value = newMonth
  await loadMonthData(newMonth)
}

// Acción rápida: marcar todas las clases del día como completadas
const quickCompleteAllClasses = async () => {
  console.log("⚡ [Dashboard] Quick complete all classes for:", selectedDay.value)

  // TODO: Implementar lógica para marcar todas las clases como "presente" automáticamente
  // Este será un flujo optimizado para días regulares
}

// Estado para el modal de clase emergente
const showEmergencyClassModal = ref(false)

// Estado para el modal de clases del día
const showClassesModal = ref(false)
const modalDate = ref("")
const classesForModal = ref<any[]>([])

// Acción rápida: crear clase emergente
const createEmergencyClass = () => {
  console.log("🚨 [Dashboard] Creating emergency class for:", selectedDay.value)
  
  // Mostrar el modal de clase emergente
  showEmergencyClassModal.value = true
}

// Handlers para el modal de clase emergente
const handleEmergencyClassSubmitted = (data: any) => {
  console.log("✅ [Dashboard] Emergency class created successfully:", data)
  showEmergencyClassModal.value = false
  
  // TODO: Actualizar la vista o mostrar mensaje de éxito
  // Opcional: refrescar los datos del día seleccionado
}

const handleEmergencyClassCancel = () => {
  console.log("❌ [Dashboard] Emergency class creation cancelled")
  showEmergencyClassModal.value = false
}

// Handlers para el modal de clases del día
const handleClassesModalClose = () => {
  showClassesModal.value = false
  modalDate.value = ""
  classesForModal.value = []
}

const handleClassSelection = (classId: string) => {
  console.log("🎯 [Dashboard] Class selected from modal:", classId)
  
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
  console.log("📋 [Dashboard] Batch review for day:", selectedDay.value)
  
  const classesOfDay = classesForSelectedDay.value
  if (classesOfDay.length === 0) {
    console.log("❌ [Dashboard] No classes to review for selected day")
    return
  }
  
  // Crear modal de selección de clases o navegar a vista especial
  console.log(`📋 [Dashboard] Reviewing ${classesOfDay.length} classes for batch attendance`)
  
  // TODO: Implementar modal de selección de clases o navegar a vista especializada
  // Opción 1: Modal con lista de clases para seleccionar cuáles revisar
  // Opción 2: Navegar a una vista que muestre todas las clases del día en una sola pantalla
  
  // Por ahora, abrir la primera clase pendiente
  const pendingClasses = classesOfDay.filter((cls) => !cls.hasAttendance)
  if (pendingClasses.length > 0) {
    navigateToAttendance(pendingClasses[0].id)
  } else {
    console.log("✅ [Dashboard] All classes for this day already have attendance taken")
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
    console.log("📄 [Dashboard] Attendance documents changed:", {
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
  console.log("🚀 [Dashboard] Initializing Teacher Attendance Dashboard")

  // Asegurar que tenemos un maestro autenticado
  if (!currentTeacher.value.id) {
    console.warn("⚠️ [Dashboard] No authenticated teacher found")
    return
  }

  try {
    // 1. Precargar datos críticos
    await preloadCriticalData()

    // 2. Cargar documentos de asistencia para el período actual
    const start = format(startOfMonth(currentMonth.value), "yyyy-MM-dd")
    const end = format(endOfMonth(currentMonth.value), "yyyy-MM-dd")
    
    console.log("📄 [Dashboard] Loading attendance documents for:", {start, end})
    await attendanceStore.fetchAttendanceDocuments(start, end)

    // 3. Cargar datos del calendario
    await loadMonthData(currentMonth.value)

    // 4. Cargar clases para hoy
    await loadClassesForSelectedDay(selectedDay.value)

    console.log("✅ [Dashboard] Dashboard initialized successfully")
    console.log("📊 [Dashboard] Calendar indicators:", calendarIndicators.value)
  } catch (err) {
    console.error("❌ [Dashboard] Error initializing dashboard:", err)
  }
})

// Exponer métodos para testing
defineExpose({
  handleDateSelect,
  handleOpenClassesModal,
  handleMonthChange,
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
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
    <!-- 🎯 HEADER PRINCIPAL - FIXED HEIGHT -->
    <header
      class="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Información del maestro y navegación -->
          <div class="flex items-center space-x-4">
            <!-- Avatar del maestro -->
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold"
              >
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
              <button
                v-for="view in [
                  {key: 'calendar', label: 'Calendario', icon: 'calendar'},
                  {key: 'list', label: 'Lista', icon: 'list'},
                  {key: 'stats', label: 'Estadísticas', icon: 'chart'},
                ]"
                :key="view.key"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  selectedView === view.key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                ]"
                @click="selectedView = view.key as 'calendar' | 'list' | 'stats'"
              >
                {{ view.label }}
              </button>
            </div>

            <button
              class="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 lg:hidden"
              @click="toggleSidebar"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 🏗️ LAYOUT PRINCIPAL - ADAPTATIVO -->
    <div class="flex flex-1 relative min-h-0 overflow-hidden">
      <!-- 📅 COLUMNA PRINCIPAL - CALENDARIO ADAPTATIVO -->
      <main
        :class="[
          'flex-1 transition-all duration-300 min-w-0 layout-transition',
          // En desktop: ajustar margen según estado del panel
          sidebarExpanded ? 'lg:mr-80' : 'lg:mr-16',
          // En tablet: ajustar margen también
          sidebarExpanded ? 'md:mr-80' : 'md:mr-16',
          // En mobile: overlay cuando el panel está expandido
          'relative',
        ]"
      >
        <!-- Overlay para dar efecto de oscurecimiento cuando el panel está expandido en móvil -->
        <div
          v-show="sidebarExpanded"
          class="absolute inset-0 bg-black bg-opacity-20 z-10 md:hidden transition-opacity duration-300 overlay-blur"
          @click="toggleSidebar"
        />
        
        <!-- Contenido principal -->
        <div class="p-4 md:p-6 h-full overflow-y-auto main-content">
          <!-- Estadísticas del día actual -->
          <AttendanceStatsOverview
            :stats="monthlyStats"
            :selected-date="selectedDay"
            :is-loading="isLoadingDailyClasses"
            class="mb-6"
          />

          <!-- Calendario principal -->
          <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <AttendanceCalendarOptimized
              :selected-date="selectedDay"
              @date-selected="handleDateSelect"
              @month-changed="handleMonthChange"
              @open-classes-modal="handleOpenClassesModal"
            />
          </div>

          <!-- Vista alternativa: Lista o Estadísticas -->
          <div v-show="selectedView !== 'calendar'" class="mt-6">
            <!-- TODO: Implementar vistas de lista y estadísticas -->
            <div
              class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center"
            >
              <p class="text-gray-500 dark:text-gray-400">
                Vista de {{ selectedView }} - Próximamente
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- 📋 COLUMNA DERECHA (30%) - PANEL DINÁMICO -->
      <DynamicSidePanel
        :expanded="sidebarExpanded"
        :title="'Panel de Actividades'"
        :subtitle="formattedSelectedDate"
        :stats="monthlyStats"
        :day-status="selectedDayStatus"
        :show-quick-actions="showQuickActions"
        :has-classes="classesForSelectedDay.length > 0"
        @toggle="toggleSidebar"
      >
        <template #content>
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
        </template>

        <template #quick-actions>
          <QuickActionsPanel
            :classes="classesForSelectedDay"
            :selected-date="selectedDay"
            @quick-complete-all="quickCompleteAllClasses"
            @create-emergency="createEmergencyClass"
          />
        </template>
      </DynamicSidePanel>
    </div>

    <!--  MODAL DE CLASE EMERGENTE -->
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

/* Scroll personalizado para el contenido principal */
.main-content {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e0 100%);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #cbd5e0 0%, #a0aec0 100%);
}

/* Dark mode scrollbar */
.dark .main-content {
  scrollbar-color: #4a5568 transparent;
}

.dark .main-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #4a5568 0%, #2d3748 100%);
}

.dark .main-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
}

/* Transiciones suaves para el layout responsivo */
@media (min-width: 768px) {
  .layout-transition {
    transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Efecto de overlay mejorado */
.overlay-blur {
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
</style>
