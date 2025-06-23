<template>
  <div class="schedule-stats bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Clases mostradas: <span class="font-semibold text-gray-900 dark:text-white">{{ visibleClasses }}</span>
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Rango horario: <span class="font-semibold text-gray-900 dark:text-white">{{ timeRange }}</span>
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Modo de vista: <span class="font-semibold text-gray-900 dark:text-white">{{ viewModeText }}</span>
          </span>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          @click="resetFilters"
          class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
        >
          Resetear filtros
        </button>
        <button
          @click="showAllDay"
          class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline"
        >
          Mostrar todo el día
        </button>
      </div>
    </div>
    
    <!-- Períodos activos -->
    <div class="mt-3 flex flex-wrap gap-2">
      <span 
        v-if="config.esTemprano"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      >
        🌅 Mañana (7am-2pm)
      </span>
      <span 
        v-if="config.esTarde"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      >
        ☀️ Tarde (2pm-7pm)
      </span>
      <span 
        v-if="config.esNoche"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
      >
        🌙 Noche (7pm-11pm)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getActiveTimeRange, type AppConfig } from '../service/appConfig';

interface Props {
  config: AppConfig;
  visibleClasses: number;
  onResetFilters: () => void;
  onShowAllDay: () => void;
}

const props = defineProps<Props>();

const timeRange = computed(() => {
  const { start, end } = getActiveTimeRange(props.config);
  const startAmPm = start >= 12 ? 'PM' : 'AM';
  const endAmPm = end >= 12 ? 'PM' : 'AM';
  const startHour = start % 12 || 12;
  const endHour = end % 12 || 12;
  
  return `${startHour}:00 ${startAmPm} - ${endHour}:00 ${endAmPm}`;
});

const viewModeText = computed(() => {
  return props.config.viewMode === 'standard' ? 'Estándar' : 'Con solapamiento';
});

const resetFilters = () => {
  props.onResetFilters();
};

const showAllDay = () => {
  props.onShowAllDay();
};
</script>

<style scoped>
.schedule-stats {
  font-family: 'Inter', sans-serif;
}
</style>
