<template>
  <div v-if="summary" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{{ summary.title || 'Resumen de la Clase' }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Instrumento</p>
        <p class="text-lg text-gray-800 dark:text-gray-200">{{ summary.instrument || 'No especificado' }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Nivel</p>
        <p class="text-lg text-gray-800 dark:text-gray-200">{{ summary.level || 'No especificado' }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Profesor</p>
        <p class="text-lg text-gray-800 dark:text-gray-200">{{ summary.teacherName || 'No asignado' }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Horario</p>
        <p class="text-lg text-gray-800 dark:text-gray-200">
          {{ summary.dayOfWeek || 'No especificado' }} {{ summary.startTime ? `a las ${summary.startTime}` : '' }}
        </p>
      </div>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Duración</p>
        <p class="text-lg text-gray-800 dark:text-gray-200">
          {{ summary.durationMinutes ? `${summary.durationMinutes} minutos` : 'No especificada' }}
        </p>
      </div>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Próxima Sesión</p>
        <p class="text-lg text-gray-800 dark:text-gray-200">{{ summary.nextSession || 'No programada' }}</p>
      </div>
    </div>
  </div>
  <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <p class="text-gray-500 dark:text-gray-400">No hay información de resumen disponible.</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

interface ClassSummaryData {
  title?: string;
  instrument?: string;
  level?: string;
  teacherName?: string;
  dayOfWeek?: string;
  startTime?: string;
  durationMinutes?: number;
  nextSession?: string;
  // Add other relevant summary fields here
}

defineProps<{
  summary: ClassSummaryData | null;
}>();
</script>

<style scoped>
/* Transitions for smooth theme switching */
div {
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
