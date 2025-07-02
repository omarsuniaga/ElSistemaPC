<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
        <ChartBarIcon class="w-6 h-6 mr-2 text-blue-500" />
        Monitoreo Diario Completo
      </h3>
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span class="text-sm text-green-600 dark:text-green-400">En vivo</span>
        </div>
        <button
          :disabled="isRefreshing"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Actualizar datos"
          @click="refreshData"
        >
          <ArrowPathIcon :class="['w-4 h-4', {'animate-spin': isRefreshing}]" />
        </button>
        <RouterLink
          to="/admin/monitoring"
          class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          Vista Completa
          <ArrowRightIcon class="w-4 h-4 ml-1" />
        </RouterLink>
      </div>
    </div>
    <!-- Estadísticas principales -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Presentes Hoy -->
      <div
        class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
      >
        <div class="flex items-center">
          <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
            <CheckIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-green-600 dark:text-green-400">
              {{ stats.present }}
            </p>
            <p class="text-xs text-green-600 dark:text-green-400">Presentes Hoy</p>
          </div>
        </div>
      </div>

      <!-- Ausentes Hoy -->
      <div
        class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800"
      >
        <div class="flex items-center">
          <div class="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
            <UserMinusIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-red-600 dark:text-red-400">{{ stats.absent }}</p>
            <p class="text-xs text-red-600 dark:text-red-400">Ausentes Hoy</p>
          </div>
        </div>
      </div>

      <!-- Clases Activas -->
      <div
        class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
      >
        <div class="flex items-center">
          <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
            <AcademicCapIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {{ stats.activeClasses }}
            </p>
            <p class="text-xs text-blue-600 dark:text-blue-400">Clases Activas</p>
          </div>
        </div>
      </div>

      <!-- Eficiencia -->
      <div
        class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
      >
        <div class="flex items-center">
          <div class="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
            <TrophyIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {{ stats.efficiency }}%
            </p>
            <p class="text-xs text-purple-600 dark:text-purple-400">Eficiencia</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico de asistencia por hora -->
    <div class="mb-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asistencia por Hora</h4>
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="flex items-end justify-between h-32 space-x-2">
          <div
            v-for="(hour, index) in hourlyAttendance"
            :key="index"
            class="flex flex-col items-center flex-1"
          >
            <div
              class="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-full transition-all duration-500 hover:opacity-80"
              :style="{height: `${(hour.attendance / maxHourlyAttendance) * 100}%`}"
              :title="`${hour.time}: ${hour.attendance} estudiantes`"
            />
            <span class="text-xs text-gray-600 dark:text-gray-400 mt-2">{{ hour.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas y notificaciones -->
    <div class="mb-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-orange-500" />
        Alertas del Día
      </h4>
      <div class="space-y-3">
        <div
          v-for="alert in dailyAlerts"
          :key="alert.id"
          class="p-4 rounded-lg border-l-4 shadow-sm"
          :class="{
            'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600':
              alert.type === 'error',
            'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600':
              alert.type === 'warning',
            'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600':
              alert.type === 'info',
            'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600':
              alert.type === 'success',
          }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center">
                <ExclamationTriangleIcon
                  v-if="alert.type === 'warning'"
                  class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2"
                />
                <ExclamationCircleIcon
                  v-else-if="alert.type === 'error'"
                  class="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
                />
                <CheckCircleIcon
                  v-else-if="alert.type === 'success'"
                  class="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                />
                <ClockIcon v-else class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h5
                  class="font-medium"
                  :class="{
                    'text-red-800 dark:text-red-200': alert.type === 'error',
                    'text-yellow-800 dark:text-yellow-200': alert.type === 'warning',
                    'text-blue-800 dark:text-blue-200': alert.type === 'info',
                    'text-green-800 dark:text-green-200': alert.type === 'success',
                  }"
                >
                  {{ alert.title }}
                </h5>
              </div>
              <p
                class="mt-1 text-sm"
                :class="{
                  'text-red-700 dark:text-red-300': alert.type === 'error',
                  'text-yellow-700 dark:text-yellow-300': alert.type === 'warning',
                  'text-blue-700 dark:text-blue-300': alert.type === 'info',
                  'text-green-700 dark:text-green-300': alert.type === 'success',
                }"
              >
                {{ alert.message }}
              </p>
              <div v-if="alert.actions" class="mt-2 flex space-x-2">
                <button
                  v-for="action in alert.actions"
                  :key="action.id"
                  class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="{
                    'bg-red-600 hover:bg-red-700 text-white': alert.type === 'error',
                    'bg-yellow-600 hover:bg-yellow-700 text-white': alert.type === 'warning',
                    'bg-blue-600 hover:bg-blue-700 text-white': alert.type === 'info',
                    'bg-green-600 hover:bg-green-700 text-white': alert.type === 'success',
                  }"
                  @click="handleAlertAction(alert.id, action.id)"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
            <button
              class="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="dismissAlert(alert.id)"
            >
              ✕
            </button>
          </div>
        </div>
        <div
          v-if="dailyAlerts.length === 0"
          class="text-center py-4 text-gray-500 dark:text-gray-400"
        >
          <CheckCircleIcon class="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p>No hay alertas para hoy. ¡Todo marcha bien!</p>
        </div>
      </div>
    </div>

    <!-- Resumen de actividades -->
    <div class="mb-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <ClockIcon class="w-5 h-5 mr-2 text-purple-500" />
        Actividades de Hoy
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Registros de Asistencia -->
        <div
          class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                <ClipboardDocumentCheckIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="ml-3">
                <h5 class="font-medium text-blue-900 dark:text-blue-100">
                  Registros de Asistencia
                </h5>
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ activitySummary.attendanceRecords }}
                </p>
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-blue-700 dark:text-blue-300">Recientes:</p>
            <div class="space-y-1">
              <p
                v-for="item in activitySummary.recentAttendance"
                :key="item"
                class="text-xs text-blue-600 dark:text-blue-400"
              >
                • {{ item }}
              </p>
            </div>
          </div>
        </div>

        <!-- Nuevos Estudiantes -->
        <div
          class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="bg-green-100 dark:bg-green-900/40 p-2 rounded-full">
                <UserPlusIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div class="ml-3">
                <h5 class="font-medium text-green-900 dark:text-green-100">Nuevos Estudiantes</h5>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ activitySummary.newStudents }}
                </p>
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-green-700 dark:text-green-300">Recientes:</p>
            <div class="space-y-1">
              <p
                v-for="item in activitySummary.recentStudents"
                :key="item"
                class="text-xs text-green-600 dark:text-green-400"
              >
                • {{ item }}
              </p>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div
          class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-full">
                <ExclamationCircleIcon class="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div class="ml-3">
                <h5 class="font-medium text-orange-900 dark:text-orange-100">Observaciones</h5>
                <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {{ activitySummary.observations }}
                </p>
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-orange-700 dark:text-orange-300">Recientes:</p>
            <div class="space-y-1">
              <p
                v-for="item in activitySummary.recentObservations"
                :key="item"
                class="text-xs text-orange-600 dark:text-orange-400"
              >
                • {{ item }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Próximas actividades -->
    <div>
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <CalendarIcon class="w-5 h-5 mr-2 text-indigo-500" />
        Próximas Actividades
      </h4>
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="space-y-3">
          <div
            v-for="activity in upcomingActivities"
            :key="activity.id"
            class="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 rounded-full bg-indigo-500" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ activity.title }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ activity.description }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ activity.time }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ activity.type }}</p>
            </div>
          </div>
          <div
            v-if="upcomingActivities.length === 0"
            class="text-center py-4 text-gray-500 dark:text-gray-400"
          >
            <CalendarIcon class="w-8 h-8 mx-auto mb-2" />
            <p>No hay actividades programadas próximamente</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted} from "vue"
import {
  ChartBarIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  CheckIcon,
  UserMinusIcon,
  AcademicCapIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  UserPlusIcon,
  ExclamationCircleIcon,
  CalendarIcon,
} from "@heroicons/vue/24/outline"

// Stores
import {useAdminStudentsStore} from "../store/adminStudents"
import {useClassesStore} from "../../Classes/store/classes"

const studentsStore = useAdminStudentsStore()
const classesStore = useClassesStore()

// State
const isRefreshing = ref(false)
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null)

// Computed stats
const stats = computed(() => {
  const totalStudents = studentsStore.studentStats.total
  // TODO: Obtener el número real de estudiantes presentes hoy del store de asistencia
  const present = Math.floor(totalStudents * 0.87) // Estimación hasta tener datos reales
  const absent = totalStudents - present
  const activeClasses = classesStore.classes.filter((c) => c.status === "active").length
  const efficiency = totalStudents > 0 ? Math.floor((present / totalStudents) * 100) : 0

  return {
    present,
    absent,
    activeClasses,
    efficiency,
    presentPercentage: efficiency,
    absentPercentage: totalStudents > 0 ? Math.floor((absent / totalStudents) * 100) : 0,
    classesPercentage: Math.min(
      100,
      Math.floor((activeClasses / Math.max(1, Math.ceil(totalStudents / 8))) * 100)
    ),
    efficiencyPercentage: efficiency,
    presentTrend: "N/A", // TODO: Obtener tendencia real
    absentTrend: "N/A", // TODO: Obtener tendencia real
    classesTrend: "N/A", // TODO: Obtener tendencia real
    efficiencyTrend: "N/A", // TODO: Obtener tendencia real
  }
})

// Horarios de asistencia por hora
const hourlyAttendance = computed(() => {
  // TODO: Obtener datos reales de asistencia por hora del store o API
  return []
})

const maxHourlyAttendance = computed(() => {
  return Math.max(...hourlyAttendance.value.map((h) => h.attendance))
})

// Alertas diarias
const dailyAlerts = computed(() => {
  const alerts = []

  if (stats.value.absentPercentage > 20) {
    alerts.push({
      id: "high-absence",
      type: "warning",
      title: "Alto Índice de Ausencias",
      description: `${stats.value.absentPercentage}% de ausencias hoy`,
      priority: "high",
      action: "view_absences",
    })
  }

  if (stats.value.activeClasses < 5 && stats.value.present > 30) {
    alerts.push({
      id: "low-classes",
      type: "info",
      title: "Pocas Clases Activas",
      description: `Solo ${stats.value.activeClasses} clases para ${stats.value.present} estudiantes`,
      priority: "medium",
      action: "schedule_classes",
    })
  }

  if (stats.value.efficiency > 95) {
    alerts.push({
      id: "excellent-performance",
      type: "success",
      title: "Rendimiento Excelente",
      description: `${stats.value.efficiency}% de eficiencia hoy`,
      priority: "low",
      action: "view_report",
    })
  }

  return alerts
})

// Resumen de actividades
const activitySummary = computed(() => {
  const newStudentsToday = studentsStore.students.filter((student) => {
    const enrollmentDate = new Date(student.enrollmentDate)
    const today = new Date()
    return enrollmentDate.toDateString() === today.toDateString()
  }).length

  return {
    attendanceRecords: 0, // TODO: Obtener el número real de registros de asistencia
    newStudents: newStudentsToday,
    observations: 0, // TODO: Obtener el número real de observaciones
    recentAttendance: [], // TODO: Obtener registros de asistencia recientes
    recentStudents: [], // TODO: Obtener nombres de estudiantes recientes
    recentObservations: [], // TODO: Obtener observaciones recientes
  }
})

// Próximas actividades
const upcomingActivities = computed(() => {
  // TODO: Obtener actividades próximas reales del sistema (ej. eventos, clases, recordatorios)
  return []
})

// Methods
const refreshData = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([studentsStore.loadStudents(), classesStore.fetchClasses()])
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 1000)
  }
}

const handleAlertAction = (alert: any, action: string) => {
  console.log("Alert action:", alert, action)
}

const dismissAlert = (alertId: string) => {
  console.log("Dismiss alert:", alertId)
}

const handleActivityClick = (activity: any) => {
  console.log("Activity clicked:", activity)
}

// Auto-refresh
const startAutoRefresh = () => {
  autoRefreshInterval.value = setInterval(() => {
    refreshData()
  }, 30000)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = null
  }
}

onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
/* Animaciones para las estadísticas */
.animate-count {
  animation: countUp 0.5s ease-out;
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
