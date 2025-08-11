<template>
  <div class="class-observation-input bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
        <span class="text-xl mr-2">📝</span>
        Observaciones de clase
      </h3>
      <button
        @click="$emit('manage-criteria')"
        class="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 py-1 px-3 rounded-md transition-colors flex items-center"
      >
        <span class="mr-1">⚙️</span> Gestionar Criterios
      </button>
    </div>

    <div class="mb-3">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Criterios de evaluación disponibles:
      </p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(criterion, index) in criteria"
          :key="index"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        >
          {{ criterion }}
        </span>
        <span
          v-if="!criteria || criteria.length === 0"
          class="text-sm text-gray-500 dark:text-gray-400 italic"
        >
          No hay criterios definidos
        </span>
      </div>
    </div>

    <div class="mt-3 text-right">
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-md text-sm transition-colors"
        @click="openObservationForm"
      >
        <span class="mr-1">+</span> Nueva Observación
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  criteria: string[];
}>();

const emit = defineEmits<{
  (e: 'manage-criteria'): void;
}>();

function openObservationForm() {
  // Esta función podría abrir un modal para agregar una nueva observación
  // Por ahora solo mostramos un mensaje en consola
  console.log('Abrir formulario de observación');
}
</script>

<style scoped>
.class-observation-input {
  transition: all 0.3s ease;
}

.class-observation-input:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>