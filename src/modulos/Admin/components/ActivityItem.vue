<template>
  <div class="activity-item flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200">
    <!-- Icon -->
    <div class="flex-shrink-0">
      <div :class="iconColorClass" class="w-8 h-8 rounded-full flex items-center justify-center">
        <component :is="iconComponent" class="w-4 h-4 text-white" />
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ activity.title }}
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {{ activity.description }}
          </p>
        </div>
        
        <!-- Timestamp -->
        <div class="flex-shrink-0 ml-2">
          <time class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatTimestamp(activity.timestamp) }}
          </time>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  UserPlusIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon, // Changed from UserCheckIcon
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

interface Props {
  activity: Activity;
}

const props = defineProps<Props>();

// Icon mapping
const iconComponent = computed(() => {
  const icons = {
    'user-plus': UserPlusIcon,
    'check': CheckCircleIcon,
    'currency': CurrencyDollarIcon,
    'user-check': CheckBadgeIcon, // Changed from UserCheckIcon
    'warning': ExclamationTriangleIcon,
    'info': InformationCircleIcon,
  };
  return icons[props.activity.icon as keyof typeof icons] || InformationCircleIcon;
});

// Color mapping
const iconColorClass = computed(() => {
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };
  return colors[props.activity.color as keyof typeof colors] || 'bg-gray-500';
});

// Format timestamp
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  
  return timestamp.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
};
</script>

<style scoped>
.activity-item {
  position: relative;
}

.activity-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background-color: #3b82f6;
  transition: height 0.2s ease;
  border-radius: 2px;
}

.activity-item:hover::before {
  height: 60%;
}

/* Smooth animations */
.activity-item {
  transition: all 0.2s ease;
}

.activity-item:hover {
  transform: translateX(4px);
}
</style>