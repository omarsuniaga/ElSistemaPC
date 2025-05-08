<script setup lang="ts">
import ClassActivitiesView from '@/modulos/Classes/views/ClassActivitiesView.vue'; // Assuming this path is correct
// No props or emits needed based on the provided parent template section
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <h2 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Actividades y Observaciones de Clases</h2>
    <!-- Componente para mostrar actividades/observaciones -->
    <ClassActivitiesView />
    <!-- Note: The action buttons from the original Upcoming Classes list are removed here -->
  </div>
</template>

<style scoped>
/* Add any specific styles for the observations section here */
</style>