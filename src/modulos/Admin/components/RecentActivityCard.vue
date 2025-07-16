<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
      <button
        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
      >
        Ver todas
      </button>
    </div>

    <div class="space-y-4 max-h-96 overflow-y-auto">
      <div
        v-for="activity in activities.slice(0, 8)"
        :key="activity.id"
        class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <!-- Icon -->
        <div
          :class="[
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            getActivityColor(activity.type),
          ]"
        >
          <component :is="getActivityIcon(activity.type)" class="w-4 h-4 text-white" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ activity.title }}
            </p>
            <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              {{ formatTime(activity.time) }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
            {{ activity.description }}
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="activities.length === 0" class="text-center py-8">
        <ClockIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400">No hay actividad reciente</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ClockIcon,
  UserPlusIcon,
  AcademicCapIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';

interface Activity {
  id: string
  type: string
  title: string
  description: string
  time: string
  icon?: string
  color?: string
}

interface Props {
  activities: Activity[]
}

defineProps<Props>();

const getActivityIcon = (type: string) => {
  const icons = {
    student_created: UserPlusIcon,
    class_created: AcademicCapIcon,
    system_update: CogIcon,
    error: ExclamationTriangleIcon,
    success: CheckCircleIcon,
    info: InformationCircleIcon,
  };
  return icons[type] || InformationCircleIcon;
};

const getActivityColor = (type: string) => {
  const colors = {
    student_created: 'bg-blue-500',
    class_created: 'bg-purple-500',
    system_update: 'bg-gray-500',
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-blue-500',
  };
  return colors[type] || 'bg-gray-500';
};

const formatTime = (time: string) => {
  if (!time) return '';

  const date = new Date(time);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Ahora';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d`;
  }
};
</script>
