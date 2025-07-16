<template>
  <div class="group relative">
    <!-- Main Card -->
    <div
      :class="[
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6',
        'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600',
        'transition-all duration-300 ease-in-out transform hover:-translate-y-1',
      ]"
    >
      <!-- Header Section -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center space-x-4">
          <!-- Icon Container -->
          <div
            :class="[
              'flex items-center justify-center w-12 h-12 rounded-xl',
              'ring-2 ring-opacity-20 transition-all duration-200',
              iconBackgroundClass,
              iconRingClass,
            ]"
          >
            <component :is="iconComponent" :class="['w-6 h-6', iconColorClass]" />
          </div>

          <!-- Title and Description -->
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ title }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ description }}
            </p>
          </div>
        </div>

        <!-- Status Indicator -->
        <div v-if="status" :class="['px-2 py-1 rounded-full text-xs font-medium', statusClasses]">
          {{ status }}
        </div>
      </div>

      <!-- Metrics Section -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {{ formatCount(count) }}
          </div>
          <div class="flex items-center text-sm">
            <component :is="trendIcon" :class="['w-4 h-4 mr-1', trendColorClass]" />
            <span :class="trendColorClass"> {{ trendDirection }}{{ recent }} </span>
            <span class="text-gray-500 dark:text-gray-400 ml-1">esta semana</span>
          </div>
        </div>

        <!-- Progress Ring (opcional) -->
        <div v-if="progress !== undefined" class="relative">
          <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              class="text-gray-200 dark:text-gray-700"
              stroke="currentColor"
              stroke-width="3"
              fill="none"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              :class="progressColorClass"
              stroke="currentColor"
              stroke-width="3"
              fill="none"
              :stroke-dasharray="`${progress}, 100`"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {{ Math.round(progress || 0) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Actions Section -->
      <div
        class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700"
      >
        <RouterLink
          :to="route"
          class="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors group"
        >
          <span>{{ viewAllText }}</span>
          <ArrowRightIcon class="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </RouterLink>

        <div class="flex items-center space-x-2">
          <ActionButton
            v-for="action in actions"
            :key="action.id"
            :icon="action.icon"
            :label="action.label"
            :variant="action.variant || 'secondary'"
            :size="'sm'"
            @click="$emit('action', action.id)"
          />
        </div>
      </div>

      <!-- Extra Actions Slot -->
      <div
        v-if="$slots['extra-actions']"
        class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
      >
        <slot name="extra-actions" />
      </div>
    </div>

    <!-- Hover Effect Overlay -->
    <div
      class="absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
      :class="gradientClass"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as HeroIcons from '@heroicons/vue/24/outline';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline';
import ActionButton from './ActionButton.vue';

interface ActionItem {
  id: string
  label: string
  icon: any
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

interface Props {
  title: string
  description: string
  icon: string
  count: number
  recent: number
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo' | 'pink' | 'gray'
  route: string
  status?: string
  progress?: number
  trend?: 'up' | 'down' | 'neutral'
  viewAllText?: string
  actions?: ActionItem[]
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  trend: 'neutral',
  viewAllText: 'Ver Todos',
  actions: () => [
    { id: 'create', label: 'Crear', icon: 'PlusIcon', variant: 'success' },
    { id: 'export', label: 'Exportar', icon: 'DocumentArrowDownIcon', variant: 'secondary' },
  ],
});

const emit = defineEmits<{
  action: [actionId: string]
}>();

const iconComponent = computed(() => {
  return (HeroIcons as any)[props.icon] || HeroIcons.CogIcon;
});

const colorClasses = computed(() => {
  const colorMap = {
    blue: {
      background: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-200 dark:ring-blue-800',
      gradient: 'from-blue-500 to-blue-600',
      progress: 'text-blue-500',
    },
    green: {
      background: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      ring: 'ring-green-200 dark:ring-green-800',
      gradient: 'from-green-500 to-green-600',
      progress: 'text-green-500',
    },
    purple: {
      background: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      ring: 'ring-purple-200 dark:ring-purple-800',
      gradient: 'from-purple-500 to-purple-600',
      progress: 'text-purple-500',
    },
    yellow: {
      background: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      ring: 'ring-yellow-200 dark:ring-yellow-800',
      gradient: 'from-yellow-500 to-yellow-600',
      progress: 'text-yellow-500',
    },
    red: {
      background: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      ring: 'ring-red-200 dark:ring-red-800',
      gradient: 'from-red-500 to-red-600',
      progress: 'text-red-500',
    },
    indigo: {
      background: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'text-indigo-600 dark:text-indigo-400',
      ring: 'ring-indigo-200 dark:ring-indigo-800',
      gradient: 'from-indigo-500 to-indigo-600',
      progress: 'text-indigo-500',
    },
    pink: {
      background: 'bg-pink-50 dark:bg-pink-900/20',
      icon: 'text-pink-600 dark:text-pink-400',
      ring: 'ring-pink-200 dark:ring-pink-800',
      gradient: 'from-pink-500 to-pink-600',
      progress: 'text-pink-500',
    },
    gray: {
      background: 'bg-gray-50 dark:bg-gray-900/20',
      icon: 'text-gray-600 dark:text-gray-400',
      ring: 'ring-gray-200 dark:ring-gray-800',
      gradient: 'from-gray-500 to-gray-600',
      progress: 'text-gray-500',
    },
  };
  return colorMap[props.color];
});

const iconBackgroundClass = computed(() => colorClasses.value.background);
const iconColorClass = computed(() => colorClasses.value.icon);
const iconRingClass = computed(() => colorClasses.value.ring);
const gradientClass = computed(() => colorClasses.value.gradient);
const progressColorClass = computed(() => colorClasses.value.progress);

const statusClasses = computed(() => {
  if (!props.status) return '';

  const statusMap: {[key: string]: string} = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  return statusMap[props.status.toLowerCase()] || statusMap.active;
});

const trendIcon = computed(() => {
  switch (props.trend) {
  case 'up':
    return ArrowTrendingUpIcon;
  case 'down':
    return ArrowTrendingDownIcon;
  default:
    return MinusIcon;
  }
});

const trendColorClass = computed(() => {
  switch (props.trend) {
  case 'up':
    return 'text-green-600 dark:text-green-400';
  case 'down':
    return 'text-red-600 dark:text-red-400';
  default:
    return 'text-gray-500 dark:text-gray-400';
  }
});

const trendDirection = computed(() => {
  switch (props.trend) {
  case 'up':
    return '+';
  case 'down':
    return '-';
  default:
    return '';
  }
});

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};
</script>
