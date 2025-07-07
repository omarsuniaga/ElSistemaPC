<!--
  📊 TARJETA DE ESTADÍSTICAS - COMPONENTE REUTILIZABLE
  Para mostrar métricas del calendario de asistencias
-->
<template>
  <div 
    class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
    :class="cardClasses"
  >
    <div class="p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div 
            class="text-2xl"
            :class="iconClasses"
          >
            {{ icon }}
          </div>
        </div>
        
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {{ title }}
            </dt>
            <dd class="flex items-baseline">
              <div 
                class="text-2xl font-semibold"
                :class="valueClasses"
              >
                {{ value }}
              </div>
              <div 
                v-if="subtitle"
                class="ml-2 text-sm text-gray-500 dark:text-gray-400"
              >
                {{ subtitle }}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    
    <!-- Progress Bar (opcional) -->
    <div v-if="showProgress" class="bg-gray-50 dark:bg-gray-700 px-5 py-3">
      <div class="text-sm">
        <div 
          class="bg-gray-200 dark:bg-gray-600 rounded-full h-2"
        >
          <div 
            class="h-2 rounded-full transition-all duration-300"
            :class="progressClasses"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{{ progressText }}</span>
          <span>{{ progressPercentage }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ColorType = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  color?: ColorType
  showProgress?: boolean
  progressValue?: number
  progressMax?: number
  progressText?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  showProgress: false,
  progressValue: 0,
  progressMax: 100,
  progressText: ''
})

// Color mappings
const colorConfig = {
  blue: {
    card: 'border-blue-200 dark:border-blue-700',
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-900 dark:text-blue-100',
    progress: 'bg-blue-600'
  },
  green: {
    card: 'border-green-200 dark:border-green-700',
    icon: 'text-green-600 dark:text-green-400',
    value: 'text-green-900 dark:text-green-100',
    progress: 'bg-green-600'
  },
  yellow: {
    card: 'border-yellow-200 dark:border-yellow-700',
    icon: 'text-yellow-600 dark:text-yellow-400',
    value: 'text-yellow-900 dark:text-yellow-100',
    progress: 'bg-yellow-600'
  },
  red: {
    card: 'border-red-200 dark:border-red-700',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-900 dark:text-red-100',
    progress: 'bg-red-600'
  },
  purple: {
    card: 'border-purple-200 dark:border-purple-700',
    icon: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-900 dark:text-purple-100',
    progress: 'bg-purple-600'
  },
  gray: {
    card: 'border-gray-200 dark:border-gray-700',
    icon: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-900 dark:text-gray-100',
    progress: 'bg-gray-600'
  }
}

// Computed
const cardClasses = computed(() => {
  return `border-l-4 ${colorConfig[props.color].card}`
})

const iconClasses = computed(() => {
  return colorConfig[props.color].icon
})

const valueClasses = computed(() => {
  return colorConfig[props.color].value
})

const progressClasses = computed(() => {
  return colorConfig[props.color].progress
})

const progressPercentage = computed(() => {
  if (props.progressMax === 0) return 0
  return Math.round((props.progressValue / props.progressMax) * 100)
})
</script>

<style scoped>
/* Hover effects */
.shadow:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Transition */
.transition-all {
  transition: all 0.3s ease-in-out;
}
</style>
