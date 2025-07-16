<template>
  <div>
    <!-- Welcome message -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-white">El Sistema Punta Cana</h1>
      <p class="text-gray-600 dark:text-gray-300 mt-2">
        Gestiona tus clases, estudiantes y contenidos en un solo lugar.
      </p>
    </div>

    <!-- Show access requests only for admin/director -->
    <slot name="access-requests" />

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Dashboard</h2>
      <button
        class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        :title="showAnalytics ? 'Ocultar Análisis' : 'Ver Análisis'"
        @click="$emit('toggle-analytics')"
      >
        <ChartBarIcon class="w-5 h-5" />
        <ArrowTopRightOnSquareIcon class="w-5 h-5 sm:hidden" />
        <span class="hidden sm:inline">{{
          showAnalytics ? "Ocultar Análisis" : "Ver Análisis"
        }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChartBarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';

defineProps<{
  showAnalytics: boolean
}>();

defineEmits<{
  (e: 'toggle-analytics'): void
}>();
</script>
