<template>
  <div class="recent-activity-list">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!activities || activities.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
      <BellIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">No hay actividad reciente</p>
    </div>

    <!-- Activity List -->
    <div v-else class="space-y-0">
      <div
        v-for="(activity, index) in activities"
        :key="activity.id"
        class="activity-item group relative flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
        :class="{ 'border-b border-gray-100 dark:border-gray-700': index < activities.length - 1 }"
      >
        <!-- Activity Icon -->
        <div class="flex-shrink-0">
          <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200" :class="getActivityIconBg(activity)">
            <component :is="getActivityIcon(activity)" class="w-4 h-4 transition-colors duration-200" :class="getActivityIconColor(activity)" />
          </div>
        </div>

        <!-- Activity Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ activity.description }}
            </p>
            <div class="flex items-center space-x-2 ml-2">
              <!-- Priority Indicator -->
              <div
                v-if="activity.priority"
                class="w-2 h-2 rounded-full"
                :class="getPriorityColor(activity.priority)"
              ></div>
              <!-- Timestamp -->
              <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {{ formatTimeAgo(activity.timestamp) }}
              </span>
            </div>
          </div>
          
          <!-- Activity Details -->
          <div class="mt-1 flex items-center space-x-2">
            <span class="text-xs text-gray-600 dark:text-gray-400">
              {{ activity.user }}
            </span>
            <span class="text-xs text-gray-400 dark:text-gray-500">•</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {{ activity.entity }}
            </span>
          </div>
          
          <!-- Additional Data -->
          <div v-if="activity.metadata" class="mt-2">
            <div class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1 inline-block">
              {{ formatMetadata(activity.metadata) }}
            </div>
          </div>
        </div>

        <!-- Action Menu -->
        <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            @click="showActivityDetails(activity)"
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-200"
            title="Ver detalles"
          >
            <EyeIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore" class="pt-4 border-t border-gray-100 dark:border-gray-700">
      <button
        @click="$emit('loadMore')"
        class="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
        :disabled="loadingMore"
      >
        <span v-if="loadingMore" class="flex items-center justify-center space-x-2">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span>Cargando...</span>
        </span>
        <span v-else>Ver más actividades</span>
      </button>
    </div>

    <!-- Activity Detail Modal -->
    <ActivityDetailModal
      v-if="selectedActivity"
      :activity="selectedActivity"
      @close="selectedActivity = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BellIcon,
  EyeIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import ActivityDetailModal from './ActivityDetailModal.vue'

interface Activity {
  id: string
  type: 'create' | 'update' | 'delete' | 'login' | 'assignment' | 'approval'
  entity: string
  description: string
  user: string
  timestamp: Date
  icon?: string
  color?: string
  priority?: 'low' | 'medium' | 'high'
  metadata?: any
}

interface Props {
  activities: Activity[]
  loading?: boolean
  hasMore?: boolean
  loadingMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hasMore: false,
  loadingMore: false
})

const emit = defineEmits<{
  loadMore: []
  activityClick: [activity: Activity]
}>()

// State
const selectedActivity = ref<Activity | null>(null)

// Icon mapping for different activity types
const activityIcons = {
  create: UserPlusIcon,
  update: PencilIcon,
  delete: TrashIcon,
  login: ArrowRightOnRectangleIcon,
  assignment: UserGroupIcon,
  approval: CheckCircleIcon,
  default: BellIcon
}

// Methods
const getActivityIcon = (activity: Activity) => {
  return activityIcons[activity.type] || activityIcons.default
}

const getActivityIconBg = (activity: Activity) => {
  const colorMap = {
    create: 'bg-green-100 dark:bg-green-900/20',
    update: 'bg-blue-100 dark:bg-blue-900/20',
    delete: 'bg-red-100 dark:bg-red-900/20',
    login: 'bg-purple-100 dark:bg-purple-900/20',
    assignment: 'bg-orange-100 dark:bg-orange-900/20',
    approval: 'bg-green-100 dark:bg-green-900/20',
    default: 'bg-gray-100 dark:bg-gray-700'
  }
  
  return colorMap[activity.type] || colorMap.default
}

const getActivityIconColor = (activity: Activity) => {
  const colorMap = {
    create: 'text-green-600 dark:text-green-400',
    update: 'text-blue-600 dark:text-blue-400',
    delete: 'text-red-600 dark:text-red-400',
    login: 'text-purple-600 dark:text-purple-400',
    assignment: 'text-orange-600 dark:text-orange-400',
    approval: 'text-green-600 dark:text-green-400',
    default: 'text-gray-600 dark:text-gray-400'
  }
  
  return colorMap[activity.type] || colorMap.default
}

const getPriorityColor = (priority: string) => {
  const colorMap = {
    low: 'bg-green-400',
    medium: 'bg-yellow-400',
    high: 'bg-red-400'
  }
  
  return colorMap[priority as keyof typeof colorMap] || 'bg-gray-400'
}

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Ahora'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d`
  }
}

const formatMetadata = (metadata: any): string => {
  if (typeof metadata === 'string') return metadata
  if (typeof metadata === 'object') {
    // Format object metadata as key-value pairs
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }
  return String(metadata)
}

const showActivityDetails = (activity: Activity) => {
  selectedActivity.value = activity
  emit('activityClick', activity)
}
</script>

<style scoped>
.recent-activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  transition: all 0.2s ease;
}

.activity-item:hover {
  transform: translateX(2px);
}

/* Custom scrollbar */
.recent-activity-list::-webkit-scrollbar {
  width: 4px;
}

.recent-activity-list::-webkit-scrollbar-track {
  background: transparent;
}

.recent-activity-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.recent-activity-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark .recent-activity-list::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark .recent-activity-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
