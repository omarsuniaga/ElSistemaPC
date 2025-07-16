<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      ⏭️ Próximas Tareas
    </h3>
    <div v-if="proximasTareas.length > 0" class="space-y-2">
      <div
        v-for="tarea in proximasTareas"
        :key="tarea.id"
        class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">{{ tarea.titulo }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-300">{{ tarea.descripcion }}</p>
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{
            formatDate(tarea.fechaLimite)
          }}</span>
        </div>
      </div>
    </div>
    <div v-else class="text-gray-500 dark:text-gray-400 text-center py-4">
      No hay tareas pendientes.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaLimite: Date;
}

defineProps({
  proximasTareas: {
    type: Array as PropType<Tarea[]>,
    default: () => [],
  },
  formatDate: {
    type: Function as PropType<(date: Date) => string>,
    required: true,
  },
});
</script>
