<template>
  <div :class="['rounded-lg p-4 border transition-all duration-200 hover:shadow-md', colorClasses]">
    <div class="flex items-center">
      <component :is="icon" :class="iconClasses" />
      <div class="ml-3">
        <p :class="valueClasses">{{ value }}</p>
        <p :class="labelClasses">{{ label }}</p>
      </div>
    </div>
    <div v-if="trend" class="mt-2 flex items-center text-xs">
      <component
        :is="trend.direction === 'up' ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'"
        :class="['w-3 h-3 mr-1', trend.direction === 'up' ? 'text-green-500' : 'text-red-500']"
      />
      <span :class="trend.direction === 'up' ? 'text-green-600' : 'text-red-600'">
        {{ trend.percentage }}%
      </span>
      <span class="text-gray-500 ml-1">{{ trend.period }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/vue/24/outline';

interface Trend {
  direction: 'up' | 'down'
  percentage: number
  period: string
}

interface Props {
  icon: any
  value: string | number
  label: string
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo'
  trend?: Trend
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
});

const colorClasses = computed(() => {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  };
  return colorMap[props.color];
});

const iconClasses = computed(() => {
  const colorMap = {
    blue: 'w-8 h-8 text-blue-600 dark:text-blue-400',
    green: 'w-8 h-8 text-green-600 dark:text-green-400',
    yellow: 'w-8 h-8 text-yellow-600 dark:text-yellow-400',
    purple: 'w-8 h-8 text-purple-600 dark:text-purple-400',
    red: 'w-8 h-8 text-red-600 dark:text-red-400',
    indigo: 'w-8 h-8 text-indigo-600 dark:text-indigo-400',
  };
  return colorMap[props.color];
});

const valueClasses = computed(() => {
  const colorMap = {
    blue: 'text-lg font-semibold text-blue-900 dark:text-blue-100',
    green: 'text-lg font-semibold text-green-900 dark:text-green-100',
    yellow: 'text-lg font-semibold text-yellow-900 dark:text-yellow-100',
    purple: 'text-lg font-semibold text-purple-900 dark:text-purple-100',
    red: 'text-lg font-semibold text-red-900 dark:text-red-100',
    indigo: 'text-lg font-semibold text-indigo-900 dark:text-indigo-100',
  };
  return colorMap[props.color];
});

const labelClasses = computed(() => {
  const colorMap = {
    blue: 'text-blue-700 dark:text-blue-300 text-sm',
    green: 'text-green-700 dark:text-green-300 text-sm',
    yellow: 'text-yellow-700 dark:text-yellow-300 text-sm',
    purple: 'text-purple-700 dark:text-purple-300 text-sm',
    red: 'text-red-700 dark:text-red-300 text-sm',
    indigo: 'text-indigo-700 dark:text-indigo-300 text-sm',
  };
  return colorMap[props.color];
});
</script>
