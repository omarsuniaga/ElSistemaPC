<template>
  <div
    class="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-600"
  >
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div :class="iconContainerClasses" class="p-2 rounded-lg">
          <component :is="iconComponent" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-lg text-gray-900 dark:text-white">{{ title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ description }}</p>
        </div>
      </div>

      <div class="text-right">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ count }}</div>
        <div class="text-sm text-green-600 dark:text-green-400 flex items-center">
          <ArrowTrendingUpIcon class="w-3 h-3 mr-1" />
          +{{ recent }} esta semana
        </div>
      </div>
    </div>
    <div class="flex items-center justify-between">
      <RouterLink
        :to="route"
        class="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors group"
      >
        <span>Ver Todos</span>
        <ArrowRightIcon class="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
      </RouterLink>

      <div class="flex items-center space-x-2">
        <button
          :class="createButtonClasses"
          class="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
          @click="$emit('action', 'create')"
        >
          <PlusIcon class="w-3 h-3 mr-1" />
          Crear
        </button>
        <button
          class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
          @click="$emit('action', 'export')"
        >
          <DocumentArrowDownIcon class="w-3 h-3 mr-1" />
          Exportar
        </button>
      </div>
    </div>

    <!-- Slot para acciones adicionales -->
    <slot name="extra-actions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  CogIcon,
  // Common icons that might be used
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  title: string
  description: string
  icon: string
  count: number
  recent: number
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo' | 'pink' | 'gray'
  route: string
}

const props = defineProps<Props>();

const emit = defineEmits<{
  action: [action: string]
}>();

// Icon mapping for commonly used icons
const iconMap: Record<string, any> = {
  CogIcon,
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  UserIcon,
  CalendarIcon,
};

const iconComponent = computed(() => {
  return iconMap[props.icon] || CogIcon;
});

const iconContainerClasses = computed(() => {
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400',
    pink: 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400',
    gray: 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400',
  };
  return colorMap[props.color] || colorMap.blue;
});

const createButtonClasses = computed(() => {
  const colorMap = {
    blue: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400',
    green:
      'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400',
    purple:
      'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400',
    yellow:
      'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400',
    indigo:
      'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400',
    pink: 'bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-800 text-pink-600 dark:text-pink-400',
    gray: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400',
  };
  return colorMap[props.color] || colorMap.green;
});
</script>
