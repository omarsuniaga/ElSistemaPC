<template>
  <div class="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <div
          :class="[
            `bg-${color}-100 dark:bg-${color}-900`,
            `text-${color}-600 dark:text-${color}-400`,
          ]"
          class="p-1.5 rounded"
        >
          <component :is="iconComponent" class="w-4 h-4" />
        </div>
        <h4 class="font-medium text-gray-900 dark:text-white text-sm">{{ title }}</h4>
      </div>

      <div class="flex items-center space-x-1">
        <span class="text-lg font-bold text-gray-900 dark:text-white">{{ value }}</span>
        <span
          :class="[
            trend.startsWith('+')
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400',
          ]"
          class="text-xs font-medium"
        >
          {{ trend }}
        </span>
      </div>
    </div>

    <!-- Mini Chart -->
    <div class="h-12 mb-2">
      <div class="flex items-end space-x-1 h-full">
        <div
          v-for="(point, index) in data"
          :key="index"
          :class="[`bg-${color}-400 dark:bg-${color}-500`]"
          class="flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80"
          :style="{height: `${(point / Math.max(...data)) * 100}%`}"
        />
      </div>
    </div>

    <div class="text-xs text-gray-500 dark:text-gray-400">Últimos 7 días</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as HeroIcons from '@heroicons/vue/24/outline';

interface Props {
  title: string
  value: string
  trend: string
  icon: string
  color: string
  data: number[]
}

const props = defineProps<Props>();

const iconComponent = computed(() => {
  return (HeroIcons as any)[props.icon] || HeroIcons.ChartBarIcon;
});
</script>
