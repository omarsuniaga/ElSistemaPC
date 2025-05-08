<script setup lang="ts">
import { defineProps, defineEmits, type FunctionalComponent } from 'vue';
import { BookOpenIcon, ChartBarSquareIcon, CalendarIcon, ClockIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  activeTab: string;
}>();

const emit = defineEmits(['set-active-tab']);

const tabs: Array<{ name: string; value: string; icon: FunctionalComponent }> = [
  { name: 'Mis Clases', value: 'classes', icon: BookOpenIcon },
  { name: 'Métricas', value: 'overview', icon: ChartBarSquareIcon },
  { name: 'Ausentes', value: 'schedule', icon: CalendarIcon }, // Renamed
  { name: 'Observaciones', value: 'upcoming', icon: ClockIcon }, // Renamed
];

const setActiveTab = (tab: string) => {
  emit('set-active-tab', tab);
};
</script>

<template>
  <header class="dashboard-header bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow mb-4 md:mb-6">
    <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Panel de Control de Maestros</h1>
    <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">Aquí puedes gestionar y visualizar información relevante sobre tus clases y estudiantes.</p>

    <!-- Tabs de navegación -->
    <div class="flex mt-4 md:mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="setActiveTab(tab.value)"
        class="flex-shrink-0 px-3 md:px-4 py-2 font-medium text-xs md:text-sm focus:outline-none whitespace-nowrap"
        :class="{
          'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === tab.value,
          'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== tab.value
        }"
      >
        <div class="flex items-center gap-1">
          <component :is="tab.icon" class="h-3 w-3 md:h-4 md:w-4" />
          {{ tab.name }}
        </div>
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Add any specific styles for the header here if needed */
</style>