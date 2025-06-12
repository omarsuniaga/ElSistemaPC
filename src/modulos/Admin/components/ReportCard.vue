<template>
  <div 
    v-if="hasPermission"
    class="report-card group relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer"
    :class="cardClasses"
    @click="navigateToRoute"
  >
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-5" :class="patternClass"></div>
    
    <!-- Content -->
    <div class="relative p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="p-2 rounded-lg transition-colors duration-300" :class="iconBgClass">
          <component :is="iconComponent" class="w-5 h-5 transition-colors duration-300" :class="iconClass" />
        </div>
        
        <!-- Trend Indicator -->
        <div v-if="trend" class="flex items-center space-x-1">
          <component 
            :is="trendIcon" 
            class="w-3 h-3 transition-colors duration-300" 
            :class="trendClass" 
          />
          <span class="text-xs font-medium transition-colors duration-300" :class="trendClass">
            {{ trend }}
          </span>
        </div>
      </div>
      
      <!-- Title and Description -->
      <div class="mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white group-hover:text-opacity-90 transition-colors duration-300 mb-1">
          {{ title }}
        </h4>
        <p class="text-xs text-gray-600 dark:text-gray-400 group-hover:text-opacity-80 transition-colors duration-300">
          {{ description }}
        </p>
      </div>
      
      <!-- Main Value -->
      <div class="flex items-baseline justify-between mb-3">
        <div class="flex items-baseline space-x-2">
          <span class="text-2xl font-bold transition-colors duration-300" :class="valueClass">
            {{ value }}
          </span>
          <span v-if="unit" class="text-sm text-gray-500 dark:text-gray-400">
            {{ unit }}
          </span>
        </div>
        
        <!-- Quick Action -->
        <button
          v-if="quickAction"
          @click.stop="handleQuickAction"
          class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 opacity-0 group-hover:opacity-100"
          :title="quickAction.tooltip"
        >
          <component :is="quickAction.icon" class="w-4 h-4" />
        </button>
      </div>
      
      <!-- Progress Bar (if applicable) -->
      <div v-if="progress !== undefined" class="mb-3">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            class="h-1.5 rounded-full transition-all duration-500" 
            :class="progressBarClass"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
      
      <!-- Additional Metrics -->
      <div v-if="metrics && metrics.length > 0" class="flex items-center justify-between text-xs">
        <div v-for="metric in metrics" :key="metric.label" class="text-center">
          <div class="font-medium text-gray-900 dark:text-white">{{ metric.value }}</div>
          <div class="text-gray-500 dark:text-gray-400">{{ metric.label }}</div>
        </div>
      </div>
      
      <!-- Footer -->
      <div v-if="lastUpdate" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Última actualización</span>
          <span>{{ formatDate(lastUpdate) }}</span>
        </div>
      </div>
    </div>
    
    <!-- Loading Overlay -->
    <div v-if="loading" class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 flex items-center justify-center">
      <div class="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-current" :class="iconClass"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRBACStore } from '@/stores/rbacStore'
import {
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ArrowDownloadIcon
} from '@heroicons/vue/24/outline'

interface QuickAction {
  icon: any
  tooltip: string
  action: string
}

interface Metric {
  label: string
  value: string | number
}

interface Props {
  title: string
  description: string
  icon: string
  route: string
  value: string | number
  unit?: string
  trend?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo'
  permission?: { module: string; action: string }
  loading?: boolean
  progress?: number
  metrics?: Metric[]
  quickAction?: QuickAction
  lastUpdate?: Date
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  loading: false
})

const emit = defineEmits<{
  quickAction: [action: string]
}>()

const router = useRouter()
const rbacStore = useRBACStore()

// Icon mapping
const iconComponents = {
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  CubeIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowDownloadIcon
}

// Computed properties
const hasPermission = computed(() => {
  if (!props.permission) return true
  return rbacStore.hasPermission(props.permission.module, props.permission.action)
})

const iconComponent = computed(() => iconComponents[props.icon as keyof typeof iconComponents] || ChartBarIcon)

const cardClasses = computed(() => ({
  'transform hover:scale-102 hover:shadow-lg': true,
  'cursor-not-allowed opacity-50': props.loading
}))

const patternClass = computed(() => `bg-gradient-to-br from-${props.color}-500 to-${props.color}-600`)

const iconBgClass = computed(() => `bg-${props.color}-50 dark:bg-${props.color}-900/20 group-hover:bg-${props.color}-100 dark:group-hover:bg-${props.color}-900/30`)

const iconClass = computed(() => `text-${props.color}-600 dark:text-${props.color}-400`)

const valueClass = computed(() => `text-${props.color}-600 dark:text-${props.color}-400`)

const progressBarClass = computed(() => `bg-${props.color}-500`)

const trendIcon = computed(() => {
  if (!props.trend) return null
  const isPositive = props.trend.startsWith('+')
  return isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
})

const trendClass = computed(() => {
  if (!props.trend) return ''
  const isPositive = props.trend.startsWith('+')
  return isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
})

// Methods
const navigateToRoute = async () => {
  if (props.loading || !hasPermission.value) return
  
  try {
    await router.push(props.route)
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

const handleQuickAction = () => {
  if (props.quickAction) {
    emit('quickAction', props.quickAction.action)
  }
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.report-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.report-card:hover {
  transform: translateY(-2px) scale(1.02);
}

/* Color classes for dynamic styling */
.text-blue-600 { color: #2563eb; }
.text-green-600 { color: #16a34a; }
.text-purple-600 { color: #9333ea; }
.text-orange-600 { color: #ea580c; }
.text-red-600 { color: #dc2626; }
.text-yellow-600 { color: #ca8a04; }
.text-indigo-600 { color: #4f46e5; }

.bg-blue-50 { background-color: #eff6ff; }
.bg-green-50 { background-color: #f0fdf4; }
.bg-purple-50 { background-color: #faf5ff; }
.bg-orange-50 { background-color: #fff7ed; }
.bg-red-50 { background-color: #fef2f2; }
.bg-yellow-50 { background-color: #fefce8; }
.bg-indigo-50 { background-color: #eef2ff; }

.hover\:bg-blue-100:hover { background-color: #dbeafe; }
.hover\:bg-green-100:hover { background-color: #dcfce7; }
.hover\:bg-purple-100:hover { background-color: #f3e8ff; }
.hover\:bg-orange-100:hover { background-color: #fed7aa; }
.hover\:bg-red-100:hover { background-color: #fee2e2; }
.hover\:bg-yellow-100:hover { background-color: #fef3c7; }
.hover\:bg-indigo-100:hover { background-color: #e0e7ff; }

.bg-blue-500 { background-color: #3b82f6; }
.bg-green-500 { background-color: #22c55e; }
.bg-purple-500 { background-color: #a855f7; }
.bg-orange-500 { background-color: #f97316; }
.bg-red-500 { background-color: #ef4444; }
.bg-yellow-500 { background-color: #eab308; }
.bg-indigo-500 { background-color: #6366f1; }

/* Dark mode colors */
.dark .text-blue-400 { color: #60a5fa; }
.dark .text-green-400 { color: #4ade80; }
.dark .text-purple-400 { color: #c084fc; }
.dark .text-orange-400 { color: #fb923c; }
.dark .text-red-400 { color: #f87171; }
.dark .text-yellow-400 { color: #facc15; }
.dark .text-indigo-400 { color: #818cf8; }

.dark .bg-blue-900\/20 { background-color: rgb(30 58 138 / 0.2); }
.dark .bg-green-900\/20 { background-color: rgb(20 83 45 / 0.2); }
.dark .bg-purple-900\/20 { background-color: rgb(88 28 135 / 0.2); }
.dark .bg-orange-900\/20 { background-color: rgb(154 52 18 / 0.2); }
.dark .bg-red-900\/20 { background-color: rgb(153 27 27 / 0.2); }
.dark .bg-yellow-900\/20 { background-color: rgb(133 77 14 / 0.2); }
.dark .bg-indigo-900\/20 { background-color: rgb(55 48 163 / 0.2); }

.dark .bg-blue-900\/30 { background-color: rgb(30 58 138 / 0.3); }
.dark .bg-green-900\/30 { background-color: rgb(20 83 45 / 0.3); }
.dark .bg-purple-900\/30 { background-color: rgb(88 28 135 / 0.3); }
.dark .bg-orange-900\/30 { background-color: rgb(154 52 18 / 0.3); }
.dark .bg-red-900\/30 { background-color: rgb(153 27 27 / 0.3); }
.dark .bg-yellow-900\/30 { background-color: rgb(133 77 14 / 0.3); }
.dark .bg-indigo-900\/30 { background-color: rgb(55 48 163 / 0.3); }
</style>
