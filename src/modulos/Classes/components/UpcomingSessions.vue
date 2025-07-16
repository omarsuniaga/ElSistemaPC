<template>
  <div class="upcoming-sessions-card bg-white p-4 rounded-lg shadow">
    <h3 class="text-lg font-semibold mb-3 text-gray-700">Próximas Sesiones</h3>
    <div v-if="sessions && sessions.length > 0" class="space-y-2">
      <div
        v-for="session in sessions"
        :key="session.dateTime"
        class="session-item p-2 bg-gray-50 rounded-md"
      >
        <p class="text-sm text-gray-600">{{ formatSessionTime(session.dateTime) }}</p>
        <p class="text-xs text-gray-500">{{ session.duration }} minutos</p>
      </div>
    </div>
    <div v-else>
      <p class="text-sm text-gray-500">No hay próximas sesiones programadas.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

interface Session {
  dateTime: string | Date // Can be ISO string or Date object
  duration: number
  // Add other relevant session properties if needed
}

const props = defineProps({
  sessions: {
    type: Array as PropType<Session[]>,
    default: () => [],
  },
});

const formatSessionTime = (dateTime: string | Date): string => {
  const date = new Date(dateTime);
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};
</script>

<style scoped>
.upcoming-sessions-card {
  /* Add any specific styling for the card */
}
.session-item:hover {
  background-color: #e9e9e9; /* Slightly darker on hover */
}
</style>
