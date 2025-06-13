<script setup lang="ts">
import TopAbsenteesByRange from '@/components/TopAbsenteesByRange.vue';
import { inject, computed, type Ref } from 'vue';

// Obtener el teacherId del componente padre
const currentTeacherId = inject<Ref<string>>('currentTeacherId');

// Crear un computed para obtener el valor del ref
const teacherId = computed(() => currentTeacherId?.value || '');
</script>

<template>  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <h2 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Top Ausentes por Rango de Fechas</h2>    <!-- Componente para mostrar ausentes filtrados por maestro -->
    <TopAbsenteesByRange 
      :limit="10" 
      :teacherId="teacherId"
      class="mt-4" 
    />
    <!-- Note: The "Nueva Clase" button from the original Schedule tab is removed here -->
  </div>
</template>

<style scoped>
/* Add any specific styles for the absentees section here */
</style>