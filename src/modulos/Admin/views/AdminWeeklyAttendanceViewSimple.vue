<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            📊 Asistencia Semanal Interactiva
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Vista de asistencias con funcionalidad clickeable
          </p>
        </div>
        <button
          @click="goBack"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          ← Volver
        </button>
      </div>
    </div>

    <!-- Instructions -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <h3 class="text-blue-900 dark:text-blue-300 font-medium mb-2">
        💡 Instrucciones de uso:
      </h3>
      <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
        <li>• Pasa el mouse sobre las celdas para ver información adicional</li>
        <li>• Haz click en las celdas para ver la lista de estudiantes</li>
        <li>• P=Presente, A=Ausente, T=Tarde, J=Justificado</li>
      </ul>
    </div>

    <!-- Enhanced Attendance Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <AttendanceWeeklyTable />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import AttendanceWeeklyTable from '../../../components/AttendanceWeeklyTable.vue';

const router = useRouter();

const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
/* Simple styling */
.transition-colors {
  transition: background-color 0.2s ease;
}
</style>