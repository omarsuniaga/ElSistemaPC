<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
    <div class="px-6 py-5">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Estadísticas del Mes
      </h3>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div 
          v-for="(stat, index) in stats" 
          :key="index"
          class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
        >
          <div class="flex items-center">
            <div 
              class="p-3 rounded-full"
              :class="[stat.color || 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300']"
            >
              <component 
                :is="getIconComponent(stat.icon || 'chart-bar')" 
                class="h-6 w-6" 
                aria-hidden="true" 
              />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {{ stat.label }}
              </p>
              <div class="flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                  {{ stat.value }}
                </p>
                <span 
                  v-if="stat.trend !== undefined"
                  :class="[
                    'ml-2 text-sm font-medium',
                    stat.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  ]"
                >
                  {{ stat.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
                </span>
              </div>
            </div>
          </div>
          
          <!-- Barra de progreso para ciertas métricas -->
          <div 
            v-if="stat.progress !== undefined" 
            class="mt-3"
          >
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                class="h-2 rounded-full" 
                :class="stat.progressColor || 'bg-blue-500'"
                :style="{ width: `${Math.min(stat.progress, 100)}%` }"
              ></div>
            </div>
            <p 
              v-if="stat.progressText" 
              class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right"
            >
              {{ stat.progressText }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Resumen de asistencias por día de la semana -->
      <div class="mt-6">
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Asistencia por día de la semana
        </h4>
        <div class="grid grid-cols-7 gap-2">
          <div 
            v-for="(day, index) in weekDays" 
            :key="index"
            class="text-center"
          >
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ day }}
            </p>
            <div class="h-24 bg-gray-100 dark:bg-gray-700 rounded-md p-2 flex flex-col justify-end">
              <div 
                class="bg-blue-500 rounded-t-sm mx-auto"
                :style="{ 
                  height: `${Math.min(dayStats[index]?.percentage || 0, 100)}%`,
                  width: '60%' 
                }"
              ></div>
              <p class="text-xs mt-1 text-gray-700 dark:text-gray-300">
                {{ dayStats[index]?.count || 0 }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Acciones rápidas -->
      <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Acciones rápidas
          </h4>
          <div class="flex space-x-2">
            <button
              @click="$emit('export-stats')"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <DocumentDownloadIcon class="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </button>
            <button
              @click="$emit('refresh')"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshIcon class="h-3.5 w-3.5 mr-1.5" />
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentDownloadIcon,
  RefreshIcon
} from '@heroicons/vue/outline'

export interface StatItem {
  label: string
  value: string | number
  icon?: string
  color?: string
  trend?: number
  progress?: number
  progressText?: string
  progressColor?: string
}

interface Props {
  stats: StatItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (e: 'export-stats'): void
  (e: 'refresh'): void
}>()

// Días de la semana para el gráfico
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Datos de ejemplo para el gráfico de días
const dayStats = ref([
  { day: 'Dom', count: 5, percentage: 30 },
  { day: 'Lun', count: 15, percentage: 80 },
  { day: 'Mar', count: 12, percentage: 65 },
  { day: 'Mié', count: 10, percentage: 55 },
  { day: 'Jue', count: 14, percentage: 75 },
  { day: 'Vie', count: 8, percentage: 45 },
  { day: 'Sáb', count: 3, percentage: 20 }
])

// Mapeo de iconos a componentes
const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    'chart-bar': ChartBarIcon,
    'user-group': UserGroupIcon,
    'check-circle': CheckCircleIcon,
    'clock': ClockIcon,
    'x-circle': XCircleIcon,
    'document-download': DocumentDownloadIcon,
    'refresh': RefreshIcon
  }
  
  return icons[iconName] || ChartBarIcon
}
</script>

<style scoped>
/* Estilos específicos del componente */
</style>
