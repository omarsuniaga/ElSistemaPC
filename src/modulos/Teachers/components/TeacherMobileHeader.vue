<template>
  <div class="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 z-40 shadow-md p-1">
    <div class="flex justify-between items-center">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
        {{ currentTitle }}
      </h1>
      <button
        class="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        @click="emit('toggle-menu')"
      >
        <Bars3Icon class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bars3Icon } from '@heroicons/vue/24/outline';

const props = defineProps<{activeTab: string}>();
const emit = defineEmits(['toggle-menu']);

const tabTitles: Record<string, string> = {
  classes: 'Mis Clases',
  notificaciones: 'Notificaciones',
  analitica: 'Analítica',
  dashboard: 'Dashboard',
};

const currentTitle = computed(() => tabTitles[props.activeTab] || 'Panel de Maestros');
</script>
