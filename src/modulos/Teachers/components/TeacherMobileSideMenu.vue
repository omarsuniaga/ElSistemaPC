<template>
  <div>
    <!-- Mobile menu overlay -->
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" @click="emit('close-menu')" />

    <!-- Mobile side menu -->
    <div
      class="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 z-50 transform shadow-lg md:hidden p-4 overflow-auto"
    >
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Menú</h2>
        <button
          class="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="emit('close-menu')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="space-y-2">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="w-full text-left p-2 rounded-md flex items-center gap-2"
          :class="
            activeTab === item.id
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          "
          @click="handleItemClick(item.id)"
        >
          <component :is="item.icon" class="h-5 w-5 mr-2" />
          {{ item.name }}
        </button>
      </div>

      <div class="mt-6 pt-4 border-t">
        <p class="text-sm text-gray-500 dark:text-gray-400">El Sistema Punta Cana</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BookOpenIcon, Squares2X2Icon, ChartBarIcon, BellIcon } from '@heroicons/vue/24/outline';

defineProps<{activeTab: string}>();
const emit = defineEmits(['set-active-tab', 'close-menu']);

const menuItems = [
  { id: 'classes', name: 'Mis Clases', icon: BookOpenIcon },
  { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
  { id: 'analytics', name: 'Analítica', icon: ChartBarIcon },
  { id: 'dashboard', name: 'Dashboard', icon: Squares2X2Icon },
];

const handleItemClick = (tabId: string) => {
  emit('set-active-tab', tabId);
  emit('close-menu');
};
</script>
