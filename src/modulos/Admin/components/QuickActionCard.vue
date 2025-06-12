<template>
  <div 
    v-if="hasPermission"
    class="quick-action-card group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg"
    :class="cardClasses"
    @click="handleClick"
  >
    <!-- Gradient Background -->
    <div class="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" :class="gradientClass"></div>
    
    <!-- Content -->
    <div class="relative p-6">
      <!-- Icon -->
      <div class="flex items-center justify-between mb-4">
        <div class="p-3 rounded-lg transition-colors duration-300" :class="iconBgClass">
          <component :is="iconComponent" class="w-6 h-6 transition-colors duration-300" :class="iconClass" />
        </div>
        
        <!-- Action Indicator -->
        <div class="w-2 h-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100" :class="indicatorClass"></div>
      </div>
      
      <!-- Text Content -->
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-opacity-90 transition-colors duration-300">
          {{ title }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 group-hover:text-opacity-80 transition-colors duration-300">
          {{ description }}
        </p>
      </div>
      
      <!-- Hover Arrow -->
      <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
        <ArrowRightIcon class="w-4 h-4" :class="iconClass" />
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 flex items-center justify-center">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-current" :class="iconClass"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRBACStore } from '@/stores/rbacStore'
import {
  UserPlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  CogIcon,
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'

interface Props {
  title: string
  description: string
  icon: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo'
  permission?: { module: string; action: string }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  loading: false
})

const emit = defineEmits<{
  click: []
}>()

const rbacStore = useRBACStore()

// Icon mapping
const iconComponents = {
  UserPlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  CogIcon,
  ChartBarIcon
}

// Computed properties
const hasPermission = computed(() => {
  if (!props.permission) return true
  return rbacStore.hasPermission(props.permission.module, props.permission.action)
})

const iconComponent = computed(() => iconComponents[props.icon as keyof typeof iconComponents] || CogIcon)

const cardClasses = computed(() => ({
  [`hover:border-${props.color}-200 dark:hover:border-${props.color}-600`]: true,
  'transform hover:scale-105': true,
  'cursor-not-allowed opacity-50': props.loading
}))

const gradientClass = computed(() => `bg-gradient-to-br from-${props.color}-500 to-${props.color}-600`)

const iconBgClass = computed(() => `bg-${props.color}-50 dark:bg-${props.color}-900/20 group-hover:bg-${props.color}-100 dark:group-hover:bg-${props.color}-900/30`)

const iconClass = computed(() => `text-${props.color}-600 dark:text-${props.color}-400`)

const indicatorClass = computed(() => `bg-${props.color}-500`)

// Methods
const handleClick = () => {
  if (props.loading || !hasPermission.value) return
  emit('click')
}
</script>

<style scoped>
.quick-action-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-action-card:hover {
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

.dark .group:hover .bg-blue-900\/30 { background-color: rgb(30 58 138 / 0.3); }
.dark .group:hover .bg-green-900\/30 { background-color: rgb(20 83 45 / 0.3); }
.dark .group:hover .bg-purple-900\/30 { background-color: rgb(88 28 135 / 0.3); }
.dark .group:hover .bg-orange-900\/30 { background-color: rgb(154 52 18 / 0.3); }
.dark .group:hover .bg-red-900\/30 { background-color: rgb(153 27 27 / 0.3); }
.dark .group:hover .bg-yellow-900\/30 { background-color: rgb(133 77 14 / 0.3); }
.dark .group:hover .bg-indigo-900\/30 { background-color: rgb(55 48 163 / 0.3); }
</style>
