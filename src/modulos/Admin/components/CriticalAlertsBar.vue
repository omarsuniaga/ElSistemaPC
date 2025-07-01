<template>
  <div v-if="criticalAlerts.length > 0" class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            Alertas Críticas ({{ criticalAlerts.length }})
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="alert in visibleAlerts" :key="alert.id">
                {{ alert.message }}
                <span class="text-xs text-red-600 ml-2">
                  {{ formatTime(alert.timestamp) }}
                </span>
              </li>
            </ul>
            <button
              v-if="criticalAlerts.length > maxVisible && !showAll"
              class="text-xs text-red-600 hover:text-red-800 underline mt-1"
              @click="showAll = true"
            >
              Ver {{ criticalAlerts.length - maxVisible }} más...
            </button>
          </div>
        </div>
      </div>
      <div class="flex-shrink-0 flex space-x-2">
        <button
          class="bg-white px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
          @click="refreshAlerts"
        >
          Actualizar
        </button>
        <button
          class="bg-red-600 px-2 py-1 rounded-md text-xs font-medium text-white hover:bg-red-700 transition-colors"
          @click="dismissAll"
        >
          Descartar Todo
        </button>
      </div>
    </div>

    <!-- Alertas individuales expandidas -->
    <div v-if="showDetails" class="mt-4 space-y-3">
      <div
        v-for="alert in criticalAlerts"
        :key="alert.id"
        class="bg-white border border-red-200 rounded-md p-3"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getSeverityClass(alert.severity)"
              >
                {{ getSeverityLabel(alert.severity) }}
              </span>
              <span class="ml-2 text-sm font-medium text-gray-900">
                {{ alert.title }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-600">{{ alert.message }}</p>
            <div class="mt-2 flex items-center text-xs text-gray-500">
              <span>{{ formatDateTime(alert.timestamp) }}</span>
              <span v-if="alert.affectedUsers" class="ml-4">
                Usuarios afectados: {{ alert.affectedUsers }}
              </span>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="text-sm text-red-600 hover:text-red-800 font-medium"
              @click="resolveAlert(alert.id)"
            >
              Resolver
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="alert.actions && alert.actions.length > 0" class="mt-3 flex space-x-2">
          <button
            v-for="action in alert.actions"
            :key="action.id"
            class="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            @click="executeAction(alert.id, action.id)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="mt-3 flex justify-center">
      <button
        class="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
        @click="showDetails = !showDetails"
      >
        <span>{{ showDetails ? "Ocultar" : "Ver" }} detalles</span>
        <svg
          class="ml-1 h-4 w-4 transition-transform"
          :class="{'rotate-180': showDetails}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"

interface AlertAction {
  id: string
  label: string
  type: "primary" | "secondary" | "danger"
}

interface CriticalAlert {
  id: string
  title: string
  message: string
  severity: "critical" | "high" | "medium"
  timestamp: Date
  affectedUsers?: number
  actions?: AlertAction[]
  resolved?: boolean
}

const props = defineProps<{
  alerts?: CriticalAlert[]
  maxVisible?: number
  autoRefresh?: boolean
  refreshInterval?: number
}>()

const emit = defineEmits<{
  alertResolved: [id: string]
  actionExecuted: [alertId: string, actionId: string]
  alertsDismissed: [ids: string[]]
  refreshRequested: []
}>()

const criticalAlerts = ref<CriticalAlert[]>(props.alerts || [])
const showAll = ref(false)
const showDetails = ref(false)
const maxVisible = ref(props.maxVisible || 3)

const visibleAlerts = computed(() => {
  if (showAll.value) return criticalAlerts.value
  return criticalAlerts.value.slice(0, maxVisible.value)
})

const getSeverityClass = (severity: string) => {
  const classes = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
  }
  return classes[severity as keyof typeof classes] || classes.medium
}

const getSeverityLabel = (severity: string) => {
  const labels = {
    critical: "CRÍTICO",
    high: "ALTO",
    medium: "MEDIO",
  }
  return labels[severity as keyof typeof labels] || "MEDIO"
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const resolveAlert = (id: string) => {
  const alertIndex = criticalAlerts.value.findIndex((a) => a.id === id)
  if (alertIndex > -1) {
    criticalAlerts.value.splice(alertIndex, 1)
    emit("alertResolved", id)
  }
}

const executeAction = (alertId: string, actionId: string) => {
  emit("actionExecuted", alertId, actionId)
}

const refreshAlerts = () => {
  emit("refreshRequested")
}

const dismissAll = () => {
  const alertIds = criticalAlerts.value.map((a) => a.id)
  criticalAlerts.value = []
  emit("alertsDismissed", alertIds)
}

const addAlert = (alert: CriticalAlert) => {
  criticalAlerts.value.unshift(alert)
}

const removeAlert = (id: string) => {
  const index = criticalAlerts.value.findIndex((a) => a.id === id)
  if (index > -1) {
    criticalAlerts.value.splice(index, 1)
  }
}

// Simular algunas alertas críticas para demostración
onMounted(() => {
  if (criticalAlerts.value.length === 0) {
    // Ejemplo de alertas
    criticalAlerts.value = [
      {
        id: "1",
        title: "Servidor sobrecargado",
        message: "El servidor principal está operando al 95% de capacidad",
        severity: "critical",
        timestamp: new Date(Date.now() - 300000), // 5 minutos atrás
        affectedUsers: 45,
        actions: [
          {id: "scale", label: "Escalar recursos", type: "primary"},
          {id: "restart", label: "Reiniciar servicio", type: "danger"},
        ],
      },
      {
        id: "2",
        title: "Fallo en backup automático",
        message: "El backup programado de las 02:00 AM falló",
        severity: "high",
        timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
        actions: [
          {id: "retry", label: "Reintentar backup", type: "primary"},
          {id: "manual", label: "Backup manual", type: "secondary"},
        ],
      },
    ]
  }
})

// Auto-refresh if enabled
if (props.autoRefresh) {
  const interval = props.refreshInterval || 30000 // 30 segundos por defecto
  setInterval(() => {
    emit("refreshRequested")
  }, interval)
}

// Exponer métodos para uso externo
defineExpose({
  addAlert,
  removeAlert,
  resolveAlert,
  dismissAll,
})
</script>
