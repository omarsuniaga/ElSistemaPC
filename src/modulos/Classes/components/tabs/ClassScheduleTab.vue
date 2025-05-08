<template>
  <div class="class-schedule-tab p-4">
    <h3 class="text-xl font-semibold mb-4 text-gray-800">Horario de la Clase</h3>
    <div v-if="classData && classData.schedule && classData.schedule.slots && classData.schedule.slots.length > 0">
      <ul class="space-y-3">
        <li v-for="(slot, index) in classData.schedule.slots" :key="index" class="p-3 bg-gray-50 rounded-md shadow-sm">
          <p class="font-medium text-gray-700">{{ formatDateTime(slot.dateTime) }}</p>
          <p class="text-sm text-gray-600">Duración: {{ slot.duration }} minutos</p>
          <!-- Add more slot details if available, e.g., status, location -->
        </li>
      </ul>
    </div>
    <div v-else-if="classData">
      <p class="text-gray-500">No hay un horario definido para esta clase.</p>
       <p class="text-sm text-gray-600 mt-2">Información general del horario:</p>
      <ul class="list-disc pl-5 mt-1 text-sm text-gray-600">
        <li>Día: {{ classData.dayOfWeek || 'No especificado' }}</li>
        <li>Hora de inicio: {{ classData.startTime || 'No especificada' }}</li>
      </ul>
    </div>
    <div v-else>
      <p class="text-gray-500">No hay información de horario disponible.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, PropType } from 'vue';
import type { ClassData, ScheduleSlot } from '../../types/class'; // Adjust path as necessary

const props = defineProps({
  classData: {
    type: Object as PropType<ClassData | null>,
    default: null
  }
});

const formatDateTime = (dateTime: string | Date): string => {
  if (!dateTime) return 'Fecha no especificada';
  const date = new Date(dateTime);
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.class-schedule-tab {
  /* Add any specific styling for this tab */
}
</style>
