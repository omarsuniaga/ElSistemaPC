<template>
  <div class="attendance-notifications">
    <!-- Header de Notificaciones -->
    <div class="notifications-header">
      <div class="header-content">
        <h3 class="header-title">
          <Icon name="notifications" class="header-icon" />
          Notificaciones de Asistencia
        </h3>
        <div class="notification-stats">
          <div v-if="stats.high > 0" class="stat-badge high">
            <Icon name="warning" />
            {{ stats.high }} Urgentes
          </div>
          <div v-if="stats.medium > 0" class="stat-badge medium">
            <Icon name="info" />
            {{ stats.medium }} Normales
          </div>
          <div v-if="stats.low > 0" class="stat-badge low">
            <Icon name="check-circle" />
            {{ stats.low }} Bajas
          </div>
          <div class="total-count">Total: {{ stats.total }}</div>
        </div>
      </div>

      <!-- Controles -->
      <div class="notification-controls">
        <button
          :disabled="loading"
          class="btn-refresh"
          title="Actualizar notificaciones"
          @click="refreshNotifications"
        >
          <Icon name="refresh" :class="{spinning: loading}" />
        </button>

        <button
          :disabled="notifications.length === 0 || loading"
          class="btn-mark-all"
          title="Marcar todas como leídas"
          @click="markAllAsRead"
        >
          <Icon name="check-all" />
        </button>
      </div>
    </div>

    <!-- Lista de Notificaciones -->
    <div class="notifications-container">
      <div v-if="loading" class="loading-state">
        <Icon name="spinner" class="spinning" />
        <span>Cargando notificaciones...</span>
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <Icon name="check-circle" class="empty-icon" />
        <h4>No hay notificaciones pendientes</h4>
        <p>Todas las notificaciones han sido revisadas</p>
      </div>

      <div v-else class="notifications-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification-card', `urgency-${notification.urgency}`]"
          @click="openNotificationDetails(notification)"
        >
          <!-- Header de la notificación -->
          <div class="notification-header">
            <div class="notification-meta">
              <span class="notification-title">{{ notification.title }}</span>
              <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
            </div>
            <div class="notification-actions">
              <button
                class="btn-mark-read"
                title="Marcar como leída"
                @click.stop="markAsRead(notification.id!)"
              >
                <Icon name="check" />
              </button>
              <div :class="['urgency-indicator', notification.urgency]">
                <Icon
                  :name="getUrgencyIcon(notification.urgency)"
                  :class="['urgency-icon', notification.urgency]"
                />
              </div>
            </div>
          </div>

          <!-- Contenido de la notificación -->
          <div class="notification-content">
            <p class="notification-message">{{ notification.message }}</p>

            <!-- Estadísticas resumidas -->
            <div class="attendance-summary">
              <div class="summary-item presentes">
                <Icon name="user-check" />
                <span>{{ notification.presentes }} Presentes</span>
              </div>
              <div v-if="notification.ausentes > 0" class="summary-item ausentes">
                <Icon name="user-x" />
                <span>{{ notification.ausentes }} Ausentes</span>
              </div>
              <div v-if="notification.tarde > 0" class="summary-item tarde">
                <Icon name="clock" />
                <span>{{ notification.tarde }} Tarde</span>
              </div>
              <div v-if="notification.justificados > 0" class="summary-item justificados">
                <Icon name="user-check-outline" />
                <span>{{ notification.justificados }} Justificados</span>
              </div>
            </div>

            <!-- Información adicional -->
            <div class="notification-details">
              <div class="detail-item">
                <Icon name="user" />
                <span>{{ notification.teacherName }}</span>
              </div>
              <div class="detail-item">
                <Icon name="book" />
                <span>{{ notification.className }}</span>
              </div>
              <div class="detail-item">
                <Icon name="calendar" />
                <span>{{ formatDate(notification.date) }}</span>
              </div>
            </div>
          </div>

          <!-- Acciones rápidas -->
          <div class="notification-footer">
            <button class="btn-view-report" @click.stop="openDailyReport(notification.date)">
              <Icon name="external-link" />
              Ver Reporte Completo
            </button>

            <button
              v-if="notification.ausentes > 0 || notification.tarde > 0"
              class="btn-send-whatsapp"
              @click.stop="sendWhatsAppNotifications(notification)"
            >
              <Icon name="message-circle" />
              Enviar WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalles -->
    <div v-if="selectedNotification" class="notification-modal-overlay" @click="closeDetails">
      <div class="notification-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedNotification.title }}</h3>
          <button class="btn-close" @click="closeDetails">
            <Icon name="x" />
          </button>
        </div>

        <div class="modal-content">
          <div class="notification-full-details">
            <p><strong>Fecha:</strong> {{ formatDate(selectedNotification.date) }}</p>
            <p><strong>Maestro:</strong> {{ selectedNotification.teacherName }}</p>
            <p><strong>Clase:</strong> {{ selectedNotification.className }}</p>
            <p><strong>Registrado:</strong> {{ formatTime(selectedNotification.timestamp) }}</p>

            <div class="detailed-stats">
              <div class="stat-card">
                <h4>Estadísticas de Asistencia</h4>
                <div class="stats-grid">
                  <div class="stat-item presentes">
                    <span class="stat-number">{{ selectedNotification.presentes }}</span>
                    <span class="stat-label">Presentes</span>
                  </div>
                  <div class="stat-item ausentes">
                    <span class="stat-number">{{ selectedNotification.ausentes }}</span>
                    <span class="stat-label">Ausentes</span>
                  </div>
                  <div class="stat-item tarde">
                    <span class="stat-number">{{ selectedNotification.tarde }}</span>
                    <span class="stat-label">Tarde</span>
                  </div>
                  <div class="stat-item justificados">
                    <span class="stat-number">{{ selectedNotification.justificados }}</span>
                    <span class="stat-label">Justificados</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-primary" @click="markAsRead(selectedNotification.id!)">
            Marcar como Leída
          </button>
          <button class="btn-secondary" @click="openDailyReport(selectedNotification.date)">
            Ver Reporte Completo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref, onMounted, onUnmounted} from "vue"
import {useRouter} from "vue-router"
import Icon from "../common/Icon.vue"
import attendanceNotificationSystem, {
  getNotificationStats,
} from "../../services/attendanceNotificationTrigger"

interface AttendanceNotification {
  id?: string
  type: "new_attendance_report"
  title: string
  message: string
  date: string
  teacherId: string
  teacherName: string
  classId: string
  className: string
  totalStudents: number
  presentes: number
  ausentes: number
  tarde: number
  justificados: number
  timestamp: Date
  read: boolean
  urgency: "low" | "medium" | "high"
}

interface NotificationStats {
  total: number
  high: number
  medium: number
  low: number
}

export default defineComponent({
  name: "AttendanceNotifications",
  components: {
    Icon,
  },
  setup() {
    const router = useRouter()
    const notifications = ref<AttendanceNotification[]>([])
    const stats = ref<NotificationStats>({total: 0, high: 0, medium: 0, low: 0})
    const loading = ref(false)
    const selectedNotification = ref<AttendanceNotification | null>(null)
    let unsubscribeWatcher: (() => void) | null = null

    /**
     * Carga las notificaciones no leídas
     */
    const loadNotifications = async () => {
      try {
        loading.value = true
        const [notificationsData, statsData] = await Promise.all([
          attendanceNotificationSystem.getUnreadNotifications(),
          getNotificationStats(),
        ])

        notifications.value = notificationsData
        stats.value = statsData
      } catch (error) {
        console.error("Error cargando notificaciones:", error)
      } finally {
        loading.value = false
      }
    }

    /**
     * Actualiza las notificaciones
     */
    const refreshNotifications = async () => {
      await loadNotifications()
    }

    /**
     * Marca una notificación como leída
     */
    const markAsRead = async (notificationId: string) => {
      try {
        await attendanceNotificationSystem.markAsRead(notificationId)

        // Actualizar localmente
        notifications.value = notifications.value.filter((n) => n.id !== notificationId)

        // Recalcular estadísticas
        const newStats = await getNotificationStats()
        stats.value = newStats

        // Cerrar modal si está abierto
        if (selectedNotification.value?.id === notificationId) {
          selectedNotification.value = null
        }
      } catch (error) {
        console.error("Error marcando notificación como leída:", error)
      }
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    const markAllAsRead = async () => {
      try {
        loading.value = true

        // Marcar todas como leídas
        const markPromises = notifications.value.map((n) =>
          n.id ? attendanceNotificationSystem.markAsRead(n.id) : Promise.resolve()
        )

        await Promise.all(markPromises)

        // Limpiar estado local
        notifications.value = []
        stats.value = {total: 0, high: 0, medium: 0, low: 0}
        selectedNotification.value = null
      } catch (error) {
        console.error("Error marcando todas las notificaciones como leídas:", error)
      } finally {
        loading.value = false
      }
    }

    /**
     * Abre los detalles de una notificación
     */
    const openNotificationDetails = (notification: AttendanceNotification) => {
      selectedNotification.value = notification
    }

    /**
     * Cierra el modal de detalles
     */
    const closeDetails = () => {
      selectedNotification.value = null
    }

    /**
     * Abre el reporte diario completo
     */
    const openDailyReport = (date: string) => {
      router.push(`/admin/asistencia-diaria?fecha=${date}`)
    }

    /**
     * Envía notificaciones por WhatsApp
     */
    const sendWhatsAppNotifications = async (notification: AttendanceNotification) => {
      // Aquí se integrará con el sistema de WhatsApp
      console.log("Enviando notificaciones WhatsApp para:", notification)
      alert(`Enviando notificaciones WhatsApp para ${notification.className}`)
    }

    /**
     * Obtiene el icono según la urgencia
     */
    const getUrgencyIcon = (urgency: string): string => {
      switch (urgency) {
        case "high":
          return "alert-triangle"
        case "medium":
          return "info"
        case "low":
          return "check-circle"
        default:
          return "bell"
      }
    }

    /**
     * Formatea la fecha
     */
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    /**
     * Formatea la hora
     */
    const formatTime = (timestamp: Date): string => {
      return timestamp.toLocaleString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    }

    // Ciclo de vida
    onMounted(async () => {
      await loadNotifications()

      // Iniciar observador de nuevas notificaciones
      unsubscribeWatcher = attendanceNotificationSystem.watchForNewAttendance()

      // Actualizar cada 30 segundos
      const intervalId = setInterval(loadNotifications, 30000)

      // Cleanup interval on unmount
      onUnmounted(() => {
        clearInterval(intervalId)
      })
    })

    onUnmounted(() => {
      if (unsubscribeWatcher) {
        unsubscribeWatcher()
      }
    })

    return {
      notifications,
      stats,
      loading,
      selectedNotification,
      loadNotifications,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      openNotificationDetails,
      closeDetails,
      openDailyReport,
      sendWhatsAppNotifications,
      getUrgencyIcon,
      formatDate,
      formatTime,
    }
  },
})
</script>

<style scoped>
.attendance-notifications {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.header-icon {
  font-size: 1.5rem;
}

.notification-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-badge.high {
  background: rgba(239, 68, 68, 0.2);
  color: #fef2f2;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.stat-badge.medium {
  background: rgba(245, 158, 11, 0.2);
  color: #fffbeb;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.stat-badge.low {
  background: rgba(34, 197, 94, 0.2);
  color: #f0fdf4;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.total-count {
  font-size: 0.875rem;
  opacity: 0.9;
}

.notification-controls {
  display: flex;
  gap: 0.5rem;
}

.btn-refresh,
.btn-mark-all {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover,
.btn-mark-all:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-refresh:disabled,
.btn-mark-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.notifications-container {
  min-height: 200px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #34d399;
}

.notifications-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.notification-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.notification-card.urgency-high {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.notification-card.urgency-medium {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.notification-card.urgency-low {
  border-left-color: #22c55e;
  background: #f0fdf4;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.notification-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification-title {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
}

.notification-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-mark-read {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mark-read:hover {
  background: #e5e7eb;
  color: #374151;
}

.urgency-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
}

.urgency-indicator.high {
  background: #fee2e2;
  color: #dc2626;
}

.urgency-indicator.medium {
  background: #fef3c7;
  color: #d97706;
}

.urgency-indicator.low {
  background: #dcfce7;
  color: #16a34a;
}

.notification-message {
  margin: 0 0 1rem 0;
  color: #374151;
  line-height: 1.5;
}

.attendance-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.summary-item.presentes {
  color: #059669;
}

.summary-item.ausentes {
  color: #dc2626;
}

.summary-item.tarde {
  color: #d97706;
}

.summary-item.justificados {
  color: #6366f1;
}

.notification-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.notification-footer {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.btn-view-report,
.btn-send-whatsapp {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view-report {
  background: #f3f4f6;
  color: #374151;
}

.btn-view-report:hover {
  background: #e5e7eb;
}

.btn-send-whatsapp {
  background: #dcfce7;
  color: #16a34a;
}

.btn-send-whatsapp:hover {
  background: #bbf7d0;
}

/* Modal Styles */
.notification-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.notification-modal {
  background: white;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.btn-close:hover {
  background: #f3f4f6;
}

.modal-content {
  padding: 1.5rem;
}

.notification-full-details {
  line-height: 1.6;
}

.notification-full-details p {
  margin: 0.5rem 0;
}

.detailed-stats {
  margin-top: 1.5rem;
}

.stat-card h4 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.stat-item.presentes {
  background: #f0fdf4;
  color: #16a34a;
}

.stat-item.ausentes {
  background: #fef2f2;
  color: #dc2626;
}

.stat-item.tarde {
  background: #fffbeb;
  color: #d97706;
}

.stat-item.justificados {
  background: #eef2ff;
  color: #6366f1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  display: block;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.8;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .notifications-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .notification-stats {
    align-self: stretch;
  }

  .notification-controls {
    align-self: flex-end;
  }

  .attendance-summary,
  .notification-details {
    flex-direction: column;
    gap: 0.5rem;
  }

  .notification-footer {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
