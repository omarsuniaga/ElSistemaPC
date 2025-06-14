<template>
  <div class="class-history-tab p-4">
    <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Historial de Observaciones</h3>
    
    <div v-if="classData && classData.history && classData.history.length > 0">
      <ul class="space-y-4">
        <li v-for="(entry, index) in classData.history" :key="index" class="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
          <div class="bg-blue-50 dark:bg-gray-600 px-4 py-2 flex justify-between items-center">
            <span class="text-sm font-medium text-blue-600 dark:text-blue-300">{{ formatDate(entry.date) }}</span>
            <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 py-1 px-2 rounded-full">{{ entry.type || 'Observación' }}</span>
          </div>
          
          <div class="p-4">
            <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">{{ entry.event }}</h4>
            
            <div v-if="entry.details" class="text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-line">{{ entry.details }}</div>
            
            <div v-if="entry.observer" class="mt-3 text-right">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Registrado por: <span class="font-medium">{{ entry.observer }}</span>
              </span>
            </div>
          </div>
        </li>
      </ul>
    </div>
    
    <div v-else-if="!loadingHistory && classData" class="text-center py-8">
      <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p class="mt-2 text-gray-500 dark:text-gray-400">No hay historial de observaciones disponible para esta clase.</p>
      <button 
        class="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md dark:bg-blue-600 dark:hover:bg-blue-700"
        @click="$emit('add-observation')"
      >
        Añadir Observación
      </button>
    </div>
    
    <div v-else-if="loadingHistory" class="text-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando historial...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, PropType } from 'vue';
import type { ClassData } from '../../types/class'; // Adjust path as necessary

// Define observation history entry interface
interface ClassHistoryEntry {
  date: string | Date;
  event: string;
  details?: string;
  type?: string;
  observer?: string;
}

const props = defineProps({
  classData: {
    type: Object as PropType<ClassData | null>,
    default: null
  }
});

const loadingHistory = ref(false);

const emit = defineEmits(['add-observation']);

const formatDate = (dateString: string | Date): string => {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
/* Transitions for smooth theme switching */
div {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Ensure pre-formatted text displays properly */
.whitespace-pre-line {
  white-space: pre-line;
}

/* Hover effect for observation entries */
li {
  transition: transform 0.2s ease-in-out;
}
li:hover {
  transform: translateY(-2px);
}
</style>
