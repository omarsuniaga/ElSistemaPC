<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      🎯 Observaciones del Director
    </h3>
    <div v-if="observacionesDirector.length > 0" class="space-y-3">
      <div
        v-for="observacion in observacionesDirector"
        :key="observacion.id"
        class="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500 rounded-r-lg"
      >
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium text-amber-900 dark:text-amber-200">
            {{ observacion.obra.titulo }}
          </h4>
          <span class="text-xs text-amber-700 dark:text-amber-300">{{
            formatDate(observacion.fecha)
          }}</span>
        </div>
        <p class="text-amber-800 dark:text-amber-300 text-sm">{{ observacion.contenido }}</p>
        <div v-if="observacion.tipo" class="mt-2">
          <span
            class="px-2 py-1 bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 text-xs rounded-full"
          >
            {{ observacion.tipo }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="text-gray-500 dark:text-gray-400 text-center py-4">
      No hay observaciones del director.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { ObservacionPedagogica } from '../types';

defineProps({
  observacionesDirector: {
    type: Array as PropType<ObservacionPedagogica[]>,
    default: () => [],
  },
  formatDate: {
    type: Function as PropType<(date: Date) => string>,
    required: true,
  },
});
</script>
