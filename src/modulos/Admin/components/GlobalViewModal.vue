<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <GlobeAltIcon class="w-6 h-6 mr-2 text-purple-500" />
            Vista Global del Sistema
          </h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Monitoreo completo de todos los módulos del sistema
        </p>
      </div>
      
      <div class="p-6">
        <!-- System Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-2xl font-bold">{{ systemStats.totalUsers }}</div>
                <div class="text-sm opacity-90">Total Usuarios</div>
              </div>
              <UsersIcon class="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-2xl font-bold">{{ systemStats.activeClasses }}</div>
                <div class="text-sm opacity-90">Clases Activas</div>
              </div>
              <AcademicCapIcon class="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-2xl font-bold">{{ systemStats.dailyAttendance }}%</div>
                <div class="text-sm opacity-90">Asistencia Hoy</div>
              </div>
              <ClipboardDocumentCheckIcon class="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-2xl font-bold">{{ systemStats.systemHealth }}%</div>
                <div class="text-sm opacity-90">Estado Sistema</div>
              </div>
              <CpuChipIcon class="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>

        <!-- Real-time Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <ClockIcon class="w-5 h-5 mr-2 text-blue-500" />
              Actividad en Tiempo Real
            </h3>
            <div class="space-y-3 max-h-64 overflow-y-auto">
              <div
                v-for="activity in realtimeActivities"
                :key="activity.id"
                class="flex items-center space-x-3 p-2 bg-white dark:bg-gray-600 rounded"
              >
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ activity.action }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ activity.user }} - {{ activity.time }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-orange-500" />
              Alertas del Sistema
            </h3>
            <div class="space-y-3 max-h-64 overflow-y-auto">
              <div
                v-for="alert in systemAlerts"
                :key="alert.id"
                class="flex items-center space-x-3 p-2 border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900 rounded"
              >
                <ExclamationTriangleIcon class="w-4 h-4 text-orange-500" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-orange-800 dark:text-orange-200">{{ alert.title }}</p>
                  <p class="text-xs text-orange-600 dark:text-orange-300">{{ alert.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Module Status -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="module in moduleStatus"
            :key="module.name"
            class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-gray-900 dark:text-white">{{ module.name }}</h4>
              <div
                :class="[
                  'w-3 h-3 rounded-full',
                  module.status === 'healthy' ? 'bg-green-500' : 
                  module.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                ]"
              ></div>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Usuarios Activos:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ module.activeUsers }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Operaciones/min:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ module.operations }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Respuesta:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ module.responseTime }}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  XMarkIcon, 
  GlobeAltIcon,
  UsersIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CpuChipIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  close: []
}>()

const systemStats = ref({
  totalUsers: 150,
  activeClasses: 12,
  dailyAttendance: 87,
  systemHealth: 98
})

const realtimeActivities = ref([
  {
    id: 1,
    action: 'Usuario Juan Pérez inició sesión',
    user: 'Sistema',
    time: 'Ahora'
  },
  {
    id: 2,
    action: 'Nueva clase de Piano creada',
    user: 'Admin',
    time: '2 min'
  },
  {
    id: 3,
    action: 'Asistencia tomada en Guitarra Básica',
    user: 'Prof. María',
    time: '5 min'
  }
])

const systemAlerts = ref([
  {
    id: 1,
    title: 'Espacio de almacenamiento',
    description: 'Usando 85% del espacio disponible'
  },
  {
    id: 2,
    title: 'Backup programado',
    description: 'Próximo backup en 2 horas'
  }
])

const moduleStatus = ref([
  {
    name: 'Autenticación',
    status: 'healthy',
    activeUsers: 45,
    operations: 120,
    responseTime: 45
  },
  {
    name: 'Gestión de Clases',
    status: 'healthy',
    activeUsers: 28,
    operations: 89,
    responseTime: 67
  },
  {
    name: 'Reportes',
    status: 'warning',
    activeUsers: 12,
    operations: 34,
    responseTime: 156
  },
  {
    name: 'Notificaciones',
    status: 'healthy',
    activeUsers: 67,
    operations: 203,
    responseTime: 23
  },
  {
    name: 'Base de Datos',
    status: 'healthy',
    activeUsers: 89,
    operations: 445,
    responseTime: 34
  },
  {
    name: 'Storage',
    status: 'warning',
    activeUsers: 15,
    operations: 67,
    responseTime: 89
  }
])

let intervalId: NodeJS.Timeout

onMounted(() => {
  // Simulate real-time updates
  intervalId = setInterval(() => {
    // Update stats randomly for demo
    systemStats.value.dailyAttendance = Math.floor(Math.random() * 10) + 85
    systemStats.value.systemHealth = Math.floor(Math.random() * 5) + 95
    
    // Add new activity
    const activities = [
      'Nuevo estudiante registrado',
      'Clase finalizada',
      'Reporte generado',
      'Usuario conectado',
      'Observación agregada'
    ]
    
    realtimeActivities.value.unshift({
      id: Date.now(),
      action: activities[Math.floor(Math.random() * activities.length)],
      user: 'Sistema',
      time: 'Ahora'
    })
    
    // Keep only last 10 activities
    if (realtimeActivities.value.length > 10) {
      realtimeActivities.value = realtimeActivities.value.slice(0, 10)
    }
  }, 5000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>
