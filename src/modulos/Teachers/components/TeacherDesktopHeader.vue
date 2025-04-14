<script setup lang="ts">
import {
  BookOpenIcon,
  Squares2X2Icon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline';

defineProps<{ activeTab: string }>();
const emit = defineEmits(['set-active-tab']);

const tabs = [
  { id: 'classes', name: 'Mis Clases', shortName: 'Clases', icon: BookOpenIcon },
  { id: 'notificaciones', name: 'Notificaciones', shortName: 'Notif.', icon: BellIcon },
  { id: 'analitica', name: 'Analítica', shortName: 'Analít.', icon: ChartBarIcon },
  { id: 'dashboard', name: 'Dashboard', shortName: 'Dashboard', icon: Squares2X2Icon }
];
</script>

<template>
  <header class="dashboard-header bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow mb-4 mt-14 md:mt-0">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2 sm:gap-4">
      <div class="flex-1 w-full sm:w-auto">
        <h1 class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
          Panel de Control
        </h1>
      </div>

      <!-- Tabs -->
      <div class="flex flex-row w-full sm:w-auto overflow-x-auto sm:overflow-visible">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="emit('set-active-tab', tab.id)"
          class="flex-1 sm:flex-none px-3 py-2 text-sm font-medium flex items-center justify-center gap-1 focus:outline-none whitespace-nowrap"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === tab.id,
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== tab.id
          }"
        >
          <component :is="tab.icon" class="h-5 w-5 sm:h-4 sm:w-4" />
          <span class="hidden sm:inline">{{ tab.name }}</span>
          <span class="sm:hidden">{{ tab.shortName }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
