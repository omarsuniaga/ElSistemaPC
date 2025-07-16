<template>
  <div
    class="plan-section bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-6 mx-6 mt-6 rounded-r-lg"
  >
    <h2 class="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
      📋 Plan de Acción - Semana {{ currentWeek }}
    </h2>
    <div v-if="planSemanal" class="space-y-3">
      <p class="text-blue-800 dark:text-blue-300">{{ planSemanal.descripcion }}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 class="font-medium text-gray-900 dark:text-white mb-2">Obras Asignadas</h3>
          <ul class="space-y-1">
            <li
              v-for="obra in planSemanal.obrasAsignadas"
              :key="obra.id"
              class="text-sm text-gray-700 dark:text-gray-300"
            >
              • {{ obra.titulo }}
            </li>
          </ul>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 class="font-medium text-gray-900 dark:text-white mb-2">Objetivos</h3>
          <ul class="space-y-1">
            <li
              v-for="objetivo in planSemanal.objetivos"
              :key="objetivo"
              class="text-sm text-gray-700 dark:text-gray-300"
            >
              • {{ objetivo }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else class="text-blue-700 dark:text-blue-300">
      No hay plan de acción asignado para esta semana.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { PlanAccion } from '../types';

defineProps({
  currentWeek: {
    type: Number,
    required: true,
  },
  planSemanal: {
    type: Object as PropType<PlanAccion | null>,
    default: null,
  },
});
</script>
