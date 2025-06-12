<template>
  <div class="system-status-widget">
    <!-- Overall Health Score -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white">Estado General</h4>
        <span class="text-sm font-semibold" :class="getHealthScoreColor(healthScore)">
          {{ healthScore }}%
        </span>
      </div>
      
      <!-- Health Score Bar -->
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          class="h-2 rounded-full transition-all duration-500" 
          :class="getHealthScoreBarColor(healthScore)"
          :style="{ width: `${healthScore}%` }"
        ></div>
      </div>
    </div>

    <!-- System Components -->
    <div class="space-y-4">
      <!-- Database Status -->
      <div class="system-component">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 rounded-full" :class="getStatusColor(status.database)"></div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Base de Datos</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ getStatusText(status.database) }}</p>
            </div>
          </div>
          <ServerIcon class="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <!-- Storage Status -->
      <div class="system-component">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 rounded-full" :class="getStatusColor(status.storage)"></div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Almacenamiento</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ getStatusText(status.storage) }}</p>
            </div>
          </div>
          <CloudIcon class="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <!-- Authentication Status -->
      <div class="system-component">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 rounded-full" :class="getStatusColor(status.auth)"></div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Autenticación</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ getStatusText(status.auth) }}</p>
            </div>
          </div>
          <ShieldCheckIcon class="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>

    <!-- System Metrics -->
    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-2 gap-4">
        <!-- System Load -->
        <div class="text-center">
          <div class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ status.systemLoad }}%
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Carga del Sistema</div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
            <div 
              class="h-1 rounded-full transition-all duration-500" 
              :class="getLoadBarColor(status.systemLoad)"
              :style="{ width: `${status.systemLoad}%` }"
            ></div>
          </div>
        </div>

        <!-- Active Connections -->
        <div class="text-center">
          <div class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ status.activeConnections }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Conexiones Activas</div>
          <div class="mt-1">
            <div class="w-2 h-2 rounded-full bg-green-400 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Last Backup -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <ClockIcon class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-400">Último respaldo</span>
        </div>
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatLastBackup(status.lastBackup) }}
        </span>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex space-x-2">
        <button
          @click="refreshStatus"
          class="flex-1 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          :disabled="refreshing"
        >
          <span v-if="refreshing" class="flex items-center justify-center space-x-2">
            <div class="animate-spin rounded-full h-3 w-3 border-2 border-gray-600 border-t-transparent"></div>
            <span>Actualizando...</span>
          </span>
          <span v-else>Actualizar</span>
        </button>
        
        <button
          @click="viewDetails"
          class="flex-1 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
        >
          Ver Detalles
        </button>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="alerts.length > 0" class="mt-4 space-y-2">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="p-3 rounded-lg border-l-4"
        :class="getAlertClasses(alert.type)"
      >
        <div class="flex items-start space-x-2">
          <component :is="getAlertIcon(alert.type)" class="w-4 h-4 mt-0.5" :class="getAlertIconColor(alert.type)" />
          <div class="flex-1">
            <p class="text-sm font-medium" :class="getAlertTextColor(alert.type)">{{ alert.title }}</p>
            <p class="text-xs mt-1" :class="getAlertDescriptionColor(alert.type)">{{ alert.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ServerIcon,
  CloudIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

interface SystemStatus {
  database: 'online' | 'offline' | 'warning'
  storage: 'online' | 'offline' | 'warning'
  auth: 'online' | 'offline' | 'warning'
  lastBackup: Date
  systemLoad: number
  activeConnections: number
}

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  description: string
}

interface Props {
  status: SystemStatus
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  refresh: []
  viewDetails: []
}>()

// State
const refreshing = ref(false)

// Mock alerts - en producción esto vendría del store
const alerts = ref<Alert[]>([
  {
    id: '1',
    type: 'warning',
    title: 'Carga del sistema alta',
    description: 'El sistema está experimentando una carga superior al 80%'
  }
])

// Computed
const healthScore = computed(() => {
  const statuses = [props.status.database, props.status.storage, props.status.auth]
  const onlineCount = statuses.filter(status => status === 'online').length
  const warningCount = statuses.filter(status => status === 'warning').length
  
  // Calculate score: online = 100%, warning = 50%, offline = 0%
  const score = (onlineCount * 100 + warningCount * 50) / (statuses.length * 100) * 100
  return Math.round(score)
})

// Methods
const getStatusColor = (status: string) => {
  const colorMap = {
    online: 'bg-green-400',
    warning: 'bg-yellow-400',
    offline: 'bg-red-400'
  }
  return colorMap[status as keyof typeof colorMap] || 'bg-gray-400'
}

const getStatusText = (status: string) => {
  const textMap = {
    online: 'En línea',
    warning: 'Advertencia',
    offline: 'Fuera de línea'
  }
  return textMap[status as keyof typeof textMap] || 'Desconocido'
}

const getHealthScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600 dark:text-green-400'
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const getHealthScoreBarColor = (score: number) => {
  if (score >= 90) return 'bg-green-500'
  if (score >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getLoadBarColor = (load: number) => {
  if (load >= 80) return 'bg-red-500'
  if (load >= 60) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getAlertClasses = (type: string) => {
  const classMap = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-400'
  }
  return classMap[type as keyof typeof classMap] || 'bg-gray-50 dark:bg-gray-700 border-gray-400'
}

const getAlertIcon = (type: string) => {
  const iconMap = {
    error: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    success: CheckCircleIcon
  }
  return iconMap[type as keyof typeof iconMap] || InformationCircleIcon
}

const getAlertIconColor = (type: string) => {
  const colorMap = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
    success: 'text-green-500'
  }
  return colorMap[type as keyof typeof colorMap] || 'text-gray-500'
}

const getAlertTextColor = (type: string) => {
  const colorMap = {
    error: 'text-red-800 dark:text-red-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    info: 'text-blue-800 dark:text-blue-200',
    success: 'text-green-800 dark:text-green-200'
  }
  return colorMap[type as keyof typeof colorMap] || 'text-gray-800 dark:text-gray-200'
}

const getAlertDescriptionColor = (type: string) => {
  const colorMap = {
    error: 'text-red-600 dark:text-red-300',
    warning: 'text-yellow-600 dark:text-yellow-300',
    info: 'text-blue-600 dark:text-blue-300',
    success: 'text-green-600 dark:text-green-300'
  }
  return colorMap[type as keyof typeof colorMap] || 'text-gray-600 dark:text-gray-300'
}

const formatLastBackup = (date: Date): string => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Hace menos de 1 hora'
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} horas`
  } else {
    const days = Math.floor(diffInHours / 24)
    return `Hace ${days} días`
  }
}

const refreshStatus = async () => {
  refreshing.value = true
  try {
    emit('refresh')
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    refreshing.value = false
  }
}

const viewDetails = () => {
  emit('viewDetails')
}
</script>

<style scoped>
.system-component {
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
}

.system-component:hover {
  background-color: rgb(249 250 251);
}

.dark .system-component:hover {
  background-color: rgb(55 65 81 / 0.5);
}

.system-status-widget {
  height: fit-content;
}

/* Pulse animation for active connections indicator */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
