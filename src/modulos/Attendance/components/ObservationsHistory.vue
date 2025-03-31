<template>
  <div class="observations-history">
    <div v-if="isLoading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="error" class="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md mb-4">
      {{ error }}
    </div>

    <div v-else-if="!observationsHistory.length" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
      <p class="text-gray-500 dark:text-gray-400">No hay observaciones registradas para esta clase.</p>
    </div>

    <div v-else class="space-y-4">
      <h3 class="text-lg font-medium mb-3">Historial de Observaciones</h3>
      
      <div class="observations-timeline">
        <div 
          v-for="observation in observationsHistory" 
          :key="observation.id" 
          class="observation-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="font-medium text-gray-900 dark:text-gray-100">
              {{ formatDate(observation.date) }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatTime(observation.timestamp) }}
            </div>
          </div>
          
          <div class="observation-content text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ observation.text }}
          </div>
          
          <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Por: {{ observation.author }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAttendanceStore } from '../store/attendance';
import type { ClassObservation } from '../types/attendance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Props
const props = defineProps<{
  classId: string;
  date?: string; // Opcional: para filtrar por fecha específica
}>();

// Store y estado
const attendanceStore = useAttendanceStore();
const observationsHistory = ref<ClassObservation[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Cargar historial de observaciones
const loadObservationsHistory = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    let observations: ClassObservation[];
    
    if (props.date) {
      // Si se proporciona una fecha, mostrar solo las observaciones de esa fecha
      observations = await attendanceStore.fetchObservationsByDate(props.classId, props.date);
    } else {
      // De lo contrario, mostrar todo el historial
      observations = await attendanceStore.fetchObservationsHistory(props.classId);
    }
    
    observationsHistory.value = observations;
  } catch (err) {
    error.value = 'Error al cargar el historial de observaciones';
    console.error('Error al cargar historial:', err);
  } finally {
    isLoading.value = false;
  }
};

// Formatear fecha
const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), 'PPP', { locale: es });
  } catch (error) {
    return dateStr;
  }
};

// Formatear hora (desde timestamp)
const formatTime = (timestamp: number) => {
  try {
    return format(new Date(timestamp), 'p', { locale: es });
  } catch (error) {
    return 'Hora desconocida';
  }
};

// Cargar datos cuando el componente se monta
onMounted(loadObservationsHistory);

// Observar cambios en las props para recargar datos
watch(() => [props.classId, props.date], loadObservationsHistory);
</script>

<style scoped>
.observations-timeline {
  position: relative;
}

.observations-timeline:before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 20px;
  width: 2px;
  background-color: #e5e7eb;
  z-index: 0;
}

.observation-item {
  position: relative;
  margin-left: 40px;
}

.observation-item:before {
  content: '';
  position: absolute;
  top: 24px;
  left: -30px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #4f46e5; /* indigo-600 */
  z-index: 1;
}

.observation-content {
  line-height: 1.6;
}

@media (prefers-color-scheme: dark) {
  .observations-timeline:before {
    background-color: #374151;
  }
  
  .observation-item:before {
    background-color: #6366f1; /* indigo-500 */
  }
}
</style>