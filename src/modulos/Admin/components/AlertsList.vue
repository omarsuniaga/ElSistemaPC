<template>
  <div class="space-y-3">
    <div
      v-for="alert in alerts"
      :key="alert.id"
      class="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
      :class="alertClasses(alert.type)"
    >
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <component :is="getAlertIcon(alert.type)" class="w-5 h-5" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">{{ alert.title }}</p>
          <p class="text-sm opacity-90 mt-1">{{ alert.description }}</p>
          <p class="text-xs opacity-70 mt-2">{{ alert.time }}</p>
        </div>
      </div>
      
      <button
        @click="$emit('dismiss', alert.id)"
        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>
    
    <div v-if="alerts.length === 0" class="text-center py-6">
      <div class="text-gray-400 dark:text-gray-500">
        <CheckCircleIcon class="w-12 h-12 mx-auto mb-2" />
        <p>No hay alertas</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

interface Alert {
  id: number
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  description: string
  time: string
}

interface Props {
  alerts: Alert[]
}

defineProps<Props>()

const emit = defineEmits<{
  dismiss: [alertId: number]
}>()

const alertClasses = (type: string) => {
  const classes = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200'
  }
  
  return classes[type as keyof typeof classes] || classes.info
}

const getAlertIcon = (type: string) => {
  const icons = {
    warning: ExclamationTriangleIcon,
    error: ExclamationCircleIcon,
    info: InformationCircleIcon,
    success: CheckCircleIcon
  }
  
  return icons[type as keyof typeof icons] || InformationCircleIcon
}
</script>
