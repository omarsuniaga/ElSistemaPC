<script setup lang="ts">
import { ref } from 'vue';
import { ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline';

const selectedDate = ref(new Date().toISOString().split('T')[0]);

const emit = defineEmits(['take-attendance']);

const handleTakeAttendance = () => {
  emit('take-attendance', selectedDate.value);
};
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Registro de asistencia</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">Seleccione la fecha para tomar asistencia o ver registros anteriores.</p>
      
      <!-- Fecha y botón de tomar asistencia -->
      <div class="flex flex-wrap gap-2 mb-4">
        <input 
          v-model="selectedDate"
          type="date" 
          class="flex-1 min-w-[200px] p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
        />
        <button 
          @click="handleTakeAttendance"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Tomar asistencia
        </button>
      </div>
      
      <!-- Lista de estudiantes para asistencia -->
      <div class="border border-gray-200 dark:border-gray-700 rounded-md">
        <div class="text-center py-12">
          <ClipboardDocumentCheckIcon class="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p class="text-gray-500 dark:text-gray-400 mb-2">Seleccione una fecha para ver o tomar asistencia</p>
        </div>
      </div>
    </div>
  </div>
</template>