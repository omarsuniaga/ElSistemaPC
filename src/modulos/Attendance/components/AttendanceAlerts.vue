<template>
  <div class="attendance-alerts">
    <div v-if="isLoading" class="loading">Cargando alertas...</div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <!-- Alertas de alta prioridad -->
      <div v-if="getHighPriorityAlerts.length > 0" class="high-priority-alerts">
        <h3>Alertas Importantes</h3>
        <div v-for="alert in getHighPriorityAlerts" :key="alert.id" class="alert alert-danger">
          <div class="alert-header">
            <span class="alert-type">{{ getAlertTypeLabel(alert.type) }}</span>
            <span class="alert-date">{{ formatDate(alert.createdAt) }}</span>
          </div>
          <div class="alert-body">
            <p>{{ alert.message }}</p>
            <div v-if="alert.details" class="alert-details">
              <div v-if="alert.type === 'ConsecutiveAbsences'">
                <p>Ausencias consecutivas: {{ alert.details.absences }}</p>
              </div>
              <div v-else-if="alert.type === 'LowAttendance'">
                <p>
                  Tasa de asistencia:
                  {{
                    alert.details && alert.details.attendanceRate != null
                      ? (alert.details.attendanceRate * 100).toFixed(1) + "%"
                      : "N/A"
                  }}
                </p>
              </div>
              <div v-else-if="alert.type === 'LatePattern'">
                <p>Días con retraso: {{ alert.details.lateDays?.length }}</p>
              </div>
            </div>
          </div>
          <div class="alert-actions">
            <button class="btn btn-outline-danger" @click="dismissAlert(alert.id)">
              Descartar
            </button>
            <button class="btn btn-primary" @click="markAsSent(alert.id)">
              Marcar como enviada
            </button>
          </div>
        </div>
      </div>

      <!-- Todas las alertas activas -->
      <div class="active-alerts">
        <h3>Alertas Activas</h3>
        <div v-if="getActiveAlerts.length === 0" class="no-alerts">
          No hay alertas activas en este momento.
        </div>
        <div
          v-for="alert in getActiveAlerts"
          v-else
          :key="alert.id"
          :class="['alert', getAlertClass(alert.priority)]"
        >
          <div class="alert-header">
            <span class="alert-type">{{ getAlertTypeLabel(alert.type) }}</span>
            <span class="alert-priority">{{ alert.priority }}</span>
            <span class="alert-date">{{ formatDate(alert.createdAt) }}</span>
          </div>
          <div class="alert-body">
            <p>{{ alert.message }}</p>
          </div>
          <div class="alert-actions">
            <button class="btn btn-sm btn-outline-secondary" @click="dismissAlert(alert.id)">
              Descartar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAlertsStore } from '../../../stores/alerts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default defineComponent({
  name: 'AttendanceAlerts',

  setup() {
    const alertsStore = useAlertsStore();

    return {
      isLoading: alertsStore.isLoading,
      error: alertsStore.error,
      fetchAlerts: alertsStore.fetchAlerts,
      fetchRules: alertsStore.fetchRules,
      updateAlertStatus: alertsStore.updateAlertStatus,
      getActiveAlerts: alertsStore.getActiveAlerts,
      getHighPriorityAlerts: alertsStore.getHighPriorityAlerts,
    };
  },

  async created() {
    await this.fetchAlerts();
    await this.fetchRules();
  },

  methods: {
    getAlertTypeLabel(type: string): string {
      const labels = {
        ConsecutiveAbsences: 'Ausencias Consecutivas',
        LowAttendance: 'Baja Asistencia',
        LatePattern: 'Patrón de Retrasos',
      };
      return labels[type as keyof typeof labels] || type;
    },

    getAlertClass(priority: string): string {
      const classes = {
        High: 'alert-danger',
        Medium: 'alert-warning',
        Low: 'alert-info',
      };
      return classes[priority as keyof typeof classes] || 'alert-secondary';
    },

    formatDate(date: string): string {
      return format(new Date(date), 'PPP', { locale: es });
    },

    async dismissAlert(alertId: string) {
      try {
        await this.updateAlertStatus(alertId, 'Dismissed');
      } catch (error) {
        console.error('Error al descartar la alerta:', error);
      }
    },

    async markAsSent(alertId: string) {
      try {
        await this.updateAlertStatus(alertId, 'Sent');
      } catch (error) {
        console.error('Error al marcar la alerta como enviada:', error);
      }
    },
  },
});
</script>

<style scoped>
.attendance-alerts {
  padding: 1rem;
}

.high-priority-alerts {
  margin-bottom: 2rem;
}

.alert {
  margin-bottom: 1rem;
  border-radius: 8px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.alert-type {
  font-weight: bold;
}

.alert-date {
  font-size: 0.9em;
  color: #666;
}

.alert-body {
  margin: 1rem 0;
}

.alert-details {
  font-size: 0.9em;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.alert-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn {
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  border: 1px solid #0056b3;
  color: white;
}

.btn-outline-danger {
  background-color: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.btn-outline-secondary {
  background-color: transparent;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.loading,
.error,
.no-alerts {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #dc3545;
}
</style>
