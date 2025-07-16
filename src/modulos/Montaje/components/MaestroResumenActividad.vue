<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      📊 Resumen de Actividad
    </h3>
    <div class="space-y-4">
      <div
        class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
      >
        <span class="text-blue-900 dark:text-blue-200 font-medium">Obras Trabajadas Hoy</span>
        <span class="text-blue-700 dark:text-blue-300 font-bold">{{
          actividadHoy.obrasTrabajas
        }}</span>
      </div>
      <div
        class="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
      >
        <span class="text-green-900 dark:text-green-200 font-medium"
          >Compases Completados</span
        >
        <span class="text-green-700 dark:text-green-300 font-bold">{{
          actividadHoy.compasesCompletados
        }}</span>
      </div>
      <div
        class="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
      >
        <span class="text-purple-900 dark:text-purple-200 font-medium">Tiempo Dedicado</span>
        <span class="text-purple-700 dark:text-purple-300 font-bold"
          >{{ actividadHoy.tiempoDedicado }}h</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

interface ActividadHoy {
  obrasTrabajas: number;
  compasesCompletados: number;
  tiempoDedicado: number;
}

defineProps({
  actividadHoy: {
    type: Object as PropType<ActividadHoy>,
    required: true,
  },
});
</script>
