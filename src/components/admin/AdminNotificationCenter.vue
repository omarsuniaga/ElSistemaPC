<template>
  <div class="admin-notification-center">
    <div class="header">
      <h2 class="title">Notificaciones del Sistema</h2>
      <div class="actions">
        <button class="refresh-btn" :disabled="isLoading" @click="fetchNotifications">
          <RefreshIcon class="h-4 w-4" :class="{'animate-spin': isLoading}" />
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner" />
      <p>Cargando notificaciones...</p>
    </div>

    <div v-else>
      <div class="notification-filters">
        <button
          :class="{active: activeFilter === 'all'}"
          class="filter-btn"
          @click="activeFilter = 'all'"
        >
          Todas
        </button>
        <button
          :class="{active: activeFilter === 'unread'}"
          class="filter-btn"
          @click="activeFilter = 'unread'"
        >
          No leídas
          <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
        </button>
        <button
          :class="{active: activeFilter === 'absences'}"
          class="filter-btn"
          @click="activeFilter = 'absences'"
        >
          Ausencias
        </button>
      </div>

      <div v-if="filteredNotifications.length === 0" class="empty-state">
        <BellIcon class="h-12 w-12 opacity-50" />
        <p>No hay notificaciones para mostrar</p>
      </div>

      <div v-else class="notifications-list">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="notification-card"
          :class="{
            unread: !notification.read,
            'error-type': notification.type === 'error',
            'warning-type': notification.type === 'warning',
            'info-type': notification.type === 'info',
            'success-type': notification.type === 'success',
          }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <component :is="getNotificationIcon(notification.type)" class="h-6 w-6" />
          </div>
          <div class="notification-content">
            <h3 class="notification-title">{{ notification.title }}</h3>
            <p class="notification-message">{{ notification.message }}</p>
            <div v-if="isAbsenceNotification(notification)" class="notification-details">
              <span class="detail-label">Estudiante:</span>
              <span class="detail-value">{{
                safeGet(notification, "details.studentName", "N/A")
              }}</span>
              <span class="detail-label">Instrumento:</span>
              <span class="detail-value">{{
                safeGet(notification, "details.instrument", "N/A")
              }}</span>
              <span class="detail-label">Severidad:</span>
              <span
                class="severity-badge"
                :class="getSeverityClass(safeGet(notification, 'details.severity'))"
              >
                {{ (safeGet(notification, "details.severity", "info") || "info").toUpperCase() }}
              </span>
            </div>
            <p class="notification-time">{{ formatNotificationTime(notification.createdAt) }}</p>
          </div>
          <button
            v-if="!notification.read"
            class="mark-read-btn"
            title="Marcar como leída"
            @click.stop="markAsRead(notification.id)"
          >
            <CheckIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useNotificationsStore, type Notification} from "../../stores/notifications"
import {formatDistance} from "date-fns"
import {es} from "date-fns/locale"
import {useRouter} from "vue-router"
import {safeGet, safeArrayLength} from "../../utils/safeAccess"
import {useAdminErrorHandling} from "../../composables/useAdminErrorHandling"

const notificationsStore = useNotificationsStore()
const router = useRouter()
const activeFilter = ref("all")
const {handleError, logError} = useAdminErrorHandling()

// Computed properties
const isLoading = computed(() => notificationsStore.isLoading)
const unreadCount = computed(() => notificationsStore.unreadCount)

const filteredNotifications = computed(() => {
  let notifications = [...notificationsStore.notifications]

  // Apply filters
  if (activeFilter.value === "unread") {
    notifications = notifications.filter((n) => !safeGet(n, "read", false))
  } else if (activeFilter.value === "absences") {
    notifications = notifications.filter(
      (n) =>
        safeGet(n, "title", "").includes("Alerta de Inasistencias") ||
        (safeGet(n, "details") && safeGet(n, "details.studentId"))
    )
  }

  return notifications
})

// Methods
const fetchNotifications = async () => {
  await notificationsStore.fetchNotifications()
}

const markAsRead = async (notificationId: string) => {
  await notificationsStore.markAsRead(notificationId)
}

const handleNotificationClick = (notification: Notification) => {
  // If not read, mark as read
  if (!notification.read && notification.id) {
    markAsRead(notification.id)
  }

  // If it has a link, navigate to it
  if (notification.link) {
    router.push(notification.link)
  }
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "error":
      return XCircleIcon
    case "success":
      return CheckCircleIcon
    case "warning":
      return ExclamationTriangleIcon
    case "info":
    default:
      return InformationCircleIcon
  }
}

const formatNotificationTime = (createdAt: any) => {
  if (!createdAt) return ""

  const date =
    createdAt instanceof Date
      ? createdAt
      : typeof createdAt === "string"
        ? new Date(createdAt)
        : createdAt.toDate
          ? createdAt.toDate()
          : new Date()

  return formatDistance(date, new Date(), {addSuffix: true, locale: es})
}

const isAbsenceNotification = (notification: Notification) => {
  return (
    safeGet(notification, "title", "").includes("Alerta de Inasistencias") ||
    (safeGet(notification, "details") && safeGet(notification, "details.studentId"))
  )
}

const getSeverityClass = (severity: string) => {
  const severityLower = (severity || "").toLowerCase()
  switch (severityLower) {
    case "alta":
      return "severity-high"
    case "media":
      return "severity-medium"
    case "baja":
      return "severity-low"
    default:
      return "severity-medium"
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.admin-notification-center {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: #f3f4f6;
  color: #4b5563;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: #e5e7eb;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.notification-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #4b5563;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn:hover {
  background-color: #e5e7eb;
}

.filter-btn.active {
  background-color: #2563eb;
  color: white;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  margin-left: 0.5rem;
  border-radius: 9999px;
  background-color: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
  text-align: center;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
  border-left: 4px solid transparent;
}

.notification-card:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.notification-card.unread {
  background-color: #f9fafb;
}

.notification-card.error-type {
  border-left-color: #ef4444;
}

.notification-card.warning-type {
  border-left-color: #f59e0b;
}

.notification-card.info-type {
  border-left-color: #3b82f6;
}

.notification-card.success-type {
  border-left-color: #10b981;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
}

.error-type .notification-icon {
  color: #ef4444;
  background-color: #fee2e2;
}

.warning-type .notification-icon {
  color: #f59e0b;
  background-color: #fef3c7;
}

.info-type .notification-icon {
  color: #3b82f6;
  background-color: #dbeafe;
}

.success-type .notification-icon {
  color: #10b981;
  background-color: #d1fae5;
}

.notification-content {
  overflow: hidden;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.notification-message {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.notification-details {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  font-size: 0.75rem;
}

.detail-label {
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  color: #1f2937;
}

.severity-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.7rem;
}

.severity-high {
  background-color: #fee2e2;
  color: #dc2626;
}

.severity-medium {
  background-color: #fef3c7;
  color: #d97706;
}

.severity-low {
  background-color: #dbeafe;
  color: #2563eb;
}

.notification-time {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.mark-read-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: #f3f4f6;
  color: #4b5563;
  transition: all 0.2s;
}

.mark-read-btn:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}
</style>
