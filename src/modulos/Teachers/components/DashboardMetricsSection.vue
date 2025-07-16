<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    <div
      v-for="metric in metrics"
      :key="metric.title"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-transform hover:scale-[1.02]"
    >
      <div class="flex items-center">
        <div :class="`${metric.color} p-3 rounded-lg`">
          <component :is="metric.icon" class="h-5 w-5 md:h-6 md:w-6" />
        </div>
        <div class="ml-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ metric.title }}</p>
          <p class="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            {{ metric.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type FunctionalComponent } from 'vue';
import { UserGroupIcon, ClockIcon, BookOpenIcon, CalendarIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  metrics: Array<{
    title: string
    value: number
    icon: FunctionalComponent
    color: string
  }>
}>();
</script>

<style scoped>
/* Add any specific styles for the metrics section here */
</style>
