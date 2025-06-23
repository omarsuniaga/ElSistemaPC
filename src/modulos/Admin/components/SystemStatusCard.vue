<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Estado del Sistema</h3>
      <div :class="[
        'px-3 py-1 rounded-full text-xs font-medium',
        statusColors[status.status]
      ]">
        {{ status.message }}
      </div>
    </div>
    
    <!-- System Health -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Salud del Sistema</span>
        <span class="text-sm font-bold text-gray-900 dark:text-white">{{ status.health }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          :class="[
            'h-2 rounded-full transition-all duration-500',
            status.health >= 90 ? 'bg-green-500' :
            status.health >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          ]"
          :style="{ width: status.health + '%' }"
        ></div>
      </div>
    </div>
    
    <!-- Services Status -->
    <div class="space-y-3 mb-6">
      <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400">Servicios</h4>
      <div class="grid grid-cols-2 gap-3">
        <div 
          v-for="(serviceStatus, service) in status.services" 
          :key="service"
          class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
        >
          <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">{{ service }}</span>
          <div class="flex items-center space-x-1">
            <div :class="[
              'w-2 h-2 rounded-full',
              serviceStatus === 'online' ? 'bg-green-400' : 'bg-red-400'
            ]"></div>
            <span :class="[
              'text-xs font-medium',
              serviceStatus === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            ]">
              {{ serviceStatus === 'online' ? 'En línea' : 'Fuera de línea' }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- System Info -->
    <div class="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-2">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Tiempo activo</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ status.uptime }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Último respaldo</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ formatDate(status.lastBackup) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SystemStatus {
  status: 'excellent' | 'warning' | 'critical'
  color: string
  message: string
  health: number
  services: {
    [key: string]: 'online' | 'offline'
  }
  uptime: string
  lastBackup: Date
}

interface Props {
  status: SystemStatus
}

defineProps<Props>()

const statusColors = {
  excellent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

const formatDate = (date: Date) => {
  if (!date) return 'N/A'
  
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} min`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `Hace ${hours} hr${hours > 1 ? 's' : ''}`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `Hace ${days} día${days > 1 ? 's' : ''}`
  }
}
</script>
