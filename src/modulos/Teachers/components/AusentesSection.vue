<script setup lang="ts">
import TopAbsenteesByRange from '@/components/TopAbsenteesByRange.vue'; // Assuming this path is correct
// No props or emits needed based on the provided parent template section
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <h2 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Top Ausentes por Rango de Fechas</h2>
    <!-- Componente para mostrar ausentes -->
    <TopAbsenteesByRange :limit="10" class="mt-4" />
    <!-- Note: The "Nueva Clase" button from the original Schedule tab is removed here -->
  </div>
</template>

<style scoped>
/* Add any specific styles for the absentees section here */
</style>