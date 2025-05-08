<template>
  <div v-if="stats" class="bg-white p-6 rounded-lg shadow">
    <h3 class="text-xl font-semibold text-gray-700 mb-4">Estadísticas de la Clase</h3>
    <div class="space-y-3">
      <div>
        <p class="text-sm text-gray-500">Estudiantes Activos</p>
        <p class="text-2xl font-bold text-gray-800">{{ stats.activeStudents ?? 0 }}</p>
      </div>
      <!-- Add more stats as needed -->
      <div>
        <p class="text-sm text-gray-500">Nivel Promedio (Ejemplo)</p>
        <p class="text-2xl font-bold text-gray-800">{{ stats.averageLevel || 'N/A' }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-500">Asistencia Promedio (Ejemplo)</p>
        <p class="text-2xl font-bold text-gray-800">{{ stats.averageAttendance || 'N/A' }}%</p>
      </div>
    </div>
  </div>
  <div v-else class="bg-white p-6 rounded-lg shadow">
    <p class="text-gray-500">Estadísticas no disponibles.</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

interface StatsData {
  activeStudents?: number;
  averageLevel?: string; // Example: Can be more complex
  averageAttendance?: number; // Example
  // Add other relevant stats fields
}

defineProps<{
  stats: StatsData | null;
}>();
</script>

<style scoped>
/* Add any specific styles for the stats card if needed */
</style>
