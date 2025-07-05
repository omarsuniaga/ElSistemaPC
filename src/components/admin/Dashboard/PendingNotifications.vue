<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
    <!-- Header con acceso al panel completo -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Notificaciones</h3>
      <div class="flex items-center space-x-2">
        <!-- Contador de notificaciones no leídas -->
        <div
          v-if="adminNotifications.unreadCount > 0"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        >
          {{ adminNotifications.unreadCount }} nuevas
        </div>

        <!-- Botón para abrir panel completo -->
        <button
          class="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
          @click="goToNotificationsPanel"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-5 5v-5zM21 7l-5-5v5h5z"
            />
          </svg>
          Ver Todas
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>

    <!-- Notificaciones Administrativas Recientes -->
    <div v-if="adminNotifications.recent.length > 0" class="mb-4">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Actividad Reciente</h4>
      <div class="space-y-2 max-h-40 overflow-y-auto">
        <div
          v-for="notification in adminNotifications.recent"
          :key="notification.id"
          :class="[
            'p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
            getNotificationStyle(notification),
          ]"
          @click="markAsReadAndShowDetails(notification)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center">
                <span class="text-sm mr-2">{{ getNotificationIcon(notification.type) }}</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ notification.title }}
                </p>
                <span
                  v-if="!notification.read"
                  class="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"
                />
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {{ notification.message }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {{ formatNotificationTime(notification.timestamp) }}
              </p>
            </div>
            <div class="ml-2 flex-shrink-0">
              <span
                :class="[
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getUrgencyStyle(notification.urgency),
                ]"
              >
                {{ notification.urgency }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notificaciones de Asistencia Legacy -->
    <div
      v-if="
        pending.absent.length === 0 &&
        pending.late.length === 0 &&
        adminNotifications.recent.length === 0
      "
      class="text-center py-4"
    >
      <div class="text-gray-400 dark:text-gray-500 mb-2">
        <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 21l-5-5 5-5m-12.728 0L6 21l-5-5 5-5"
          />
        </svg>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">No hay notificaciones pendientes.</p>
    </div>

    <div v-if="pending.absent.length > 0 || pending.late.length > 0" class="space-y-3">
      <!-- Absent Notifications -->
      <div
        v-if="pending.absent.length > 0"
        class="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg flex items-center justify-between"
      >
        <div>
          <div class="flex items-center">
            <p class="font-medium text-red-800 dark:text-red-200">
              {{ pending.absent.length }} Ausencias
            </p>
            <div class="relative group ml-2">
              <svg
                class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-pointer"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div
                class="absolute bottom-full mb-2 w-64 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
              >
                Estudiantes ausentes hoy que aún no han sido notificados.
              </div>
            </div>
          </div>
          <p class="text-xs text-red-600 dark:text-red-400">Listos para notificar</p>
        </div>
        <button
          :disabled="notifying.absent"
          :class="{'opacity-50 cursor-not-allowed': notifying.absent}"
          class="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
          @click="handleNotify('absent')"
        >
          <span v-if="notifying.absent">Enviando...</span>
          <span v-else>Notificar</span>
        </button>
      </div>

      <!-- Late Notifications -->
      <div
        v-if="pending.late.length > 0"
        class="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg flex items-center justify-between"
      >
        <div>
          <div class="flex items-center">
            <p class="font-medium text-yellow-800 dark:text-yellow-200">
              {{ pending.late.length }} Tardanzas
            </p>
            <div class="relative group ml-2">
              <svg
                class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-pointer"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div
                class="absolute bottom-full mb-2 w-64 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
              >
                Estudiantes con tardanza hoy que aún no han sido notificados.
              </div>
            </div>
          </div>
          <p class="text-xs text-yellow-600 dark:text-yellow-400">Listos para notificar</p>
        </div>
        <button
          :disabled="notifying.late"
          :class="{'opacity-50 cursor-not-allowed': notifying.late}"
          class="px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
          @click="handleNotify('late')"
        >
          <span v-if="notifying.late">Enviando...</span>
          <span v-else>Notificar</span>
        </button>
      </div>
    </div>

    <!-- Acceso rápido al panel completo -->
    <div
      v-if="adminNotifications.recent.length > 0"
      class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"
    >
      <button
        class="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors"
        @click="goToNotificationsPanel"
      >
        Ver panel completo de notificaciones →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from "vue"
import {useRouter} from "vue-router"
import {db} from "../../../firebase"
import {collection, query, where, getDocs} from "firebase/firestore"
import {
  notifyUnexcusedAbsences,
  notifyLateStudents,
} from "../../../services/attendanceNotifications"
import {useAdminNotifications} from "../../../composables/useAdminNotifications"

defineOptions({name: "PendingNotifications"})

const router = useRouter()
const loading = ref(true)
const notifying = ref({absent: false, late: false})
const pending = ref({
  absent: [] as string[],
  late: [] as string[],
})

// Usar el composable de notificaciones administrativas
const {state: notificationState, markAsRead, filteredNotifications} = useAdminNotifications()

// Computed para notificaciones administrativas
const adminNotifications = computed(() => ({
  unreadCount: notificationState.unreadCount,
  recent: filteredNotifications.value.slice(0, 3), // Solo mostrar las 3 más recientes
}))

// Funciones de utilidad para notificaciones administrativas
const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    teacher_login: "👨‍🏫",
    attendance_report: "📊",
    student_observation: "📝",
    system_notification: "⚙️",
  }
  return icons[type] || "📢"
}

const getNotificationStyle = (notification: any): string => {
  if (!notification.read) {
    return "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
  }
  return "border-gray-200 dark:border-gray-600"
}

const getUrgencyStyle = (urgency: string): string => {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }
  return styles[urgency] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
}

const formatNotificationTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return "Ahora"
  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours} h`

  return timestamp.toLocaleDateString()
}

// Navegación al panel completo
const goToNotificationsPanel = () => {
  router.push("/admin/notifications")
}

// Marcar como leída y mostrar detalles
const markAsReadAndShowDetails = async (notification: any) => {
  if (!notification.read) {
    await markAsRead(notification.id)
  }
  // Opcional: Mostrar modal con detalles o navegar al panel completo
  goToNotificationsPanel()
}

// Funciones legacy para notificaciones de asistencia
const fetchPendingNotifications = async () => {
  loading.value = true
  try {
    const todayStr = new Date().toISOString().split("T")[0]
    const attendanceQuery = query(collection(db, "attendance"), where("date", "==", todayStr))
    const snapshot = await getDocs(attendanceQuery)

    const absentIds = new Set<string>()
    const lateIds = new Set<string>()

    snapshot.forEach((doc) => {
      const data = doc.data()
      ;(data.ausentes || []).forEach((id: string) => absentIds.add(id))
      ;(data.tardes || []).forEach((id: string) => lateIds.add(id))
    })

    // Here you would ideally cross-reference with notification_history
    // to see who has NOT been notified yet. For simplicity, we assume none have.
    pending.value.absent = Array.from(absentIds)
    pending.value.late = Array.from(lateIds)
  } catch (error) {
    console.error("Error fetching pending notifications:", error)
  } finally {
    loading.value = false
  }
}

const handleNotify = async (type: "absent" | "late") => {
  if (type === "absent") {
    notifying.value.absent = true
    await notifyUnexcusedAbsences(pending.value.absent)
    pending.value.absent = [] // Clear after notifying
    notifying.value.absent = false
  } else if (type === "late") {
    notifying.value.late = true
    await notifyLateStudents(pending.value.late)
    pending.value.late = [] // Clear after notifying
    notifying.value.late = false
  }
  // Optionally, add a toast notification for success
}

onMounted(() => {
  fetchPendingNotifications()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
