<template>
  <div class="header-section bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Panel de Maestro - Montaje
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-1">
          Gestión de obras y seguimiento de progreso
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Toggle de tema oscuro/claro -->
        <button
          class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          :title="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          @click="$emit('toggleDarkMode')"
        >
          <SunIcon v-if="isDarkMode" class="w-5 h-5 text-yellow-500" />
          <MoonIcon v-else class="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <!-- Indicador de supervisión del director -->
        <div v-if="directorReviewed" class="flex items-center space-x-2">
          <div class="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-sm text-green-700 dark:text-green-400 font-medium">Revisado por Director</span>
        </div>

        <!-- Botón de asistencia diaria -->
        <button
          class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          :disabled="!asistenciaPendiente"
          @click="$emit('irAAsistencia')"
        >
          📅 Asistencia Diaria
          <span v-if="asistenciaPendiente" class="bg-red-500 ring-2 ring-white dark:ring-gray-800 rounded-full w-3 h-3 -mr-1 -mt-4"></span>
        </button>

        <!-- Indicador de progreso semanal -->
        <div class="text-right">
          <div class="text-sm text-gray-600 dark:text-gray-400">Progreso Semanal</div>
          <div class="text-lg font-bold text-green-600 dark:text-green-400">
            {{ progresoSemanalPorcentaje }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline';

defineProps({
  isDarkMode: {
    type: Boolean,
    required: true,
  },
  directorReviewed: {
    type: Boolean,
    default: false,
  },
  asistenciaPendiente: {
    type: Boolean,
    default: false,
  },
  progresoSemanalPorcentaje: {
    type: Number,
    default: 0,
  },
});

defineEmits(['toggleDarkMode', 'irAAsistencia']);
</script>

<style scoped>
/* Animaciones para el progreso */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
