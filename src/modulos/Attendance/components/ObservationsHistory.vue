<template>
  <div class="observations-history">
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
    </div>
    
    <div v-else-if="!observations.length" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No hay observaciones registradas para esta clase.</p>
    </div>
    
    <div v-else class="space-y-4">
      <div v-for="(observation, index) in sortedObservations" :key="index" 
           class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <div class="flex justify-between items-start mb-2">
          <div class="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
            {{ observation.author || 'Usuario desconocido' }}
            <span v-if="observation.author === 'Sistema'" class="text-xs text-gray-500">(sistema)</span>
          </div>
          <div class="flex flex-col items-end">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDateTime(observation.createdAt) }}
            </div>
            <div v-if="date && observation.date && observation.date !== date" 
                 class="text-xs text-amber-500 mt-1">
              Fecha diferente: {{ formatDate(observation.date) }}
            </div>
          </div>
        </div>
        <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ observation.text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAttendanceStore } from '../store/attendance';

interface Observation {
  text: string;
  createdAt: string;
  author?: string;
  id?: string;
  classId?: string;
  date?: string;
}

const props = defineProps<{
  classId: string;
  date?: string;
}>();

const attendanceStore = useAttendanceStore();
const observations = ref<Observation[]>([]);
const loading = ref(true);

// Sort observations by date, most recent first
const sortedObservations = computed(() => {
  return [...observations.value].sort((a, b) => {
    // Safety check for both dates
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

// Format date and time for display
const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'Fecha desconocida';
  
  try {
    const date = parseISO(dateString);
    if (!isNaN(date.getTime())) {
      return format(date, "d 'de' MMMM yyyy, HH:mm", { locale: es });
    }
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || 'Fecha desconocida';
  }
};

// Format just the date portion
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Fecha desconocida';
  
  try {
    const date = parseISO(dateString);
    if (!isNaN(date.getTime())) {
      return format(date, "d 'de' MMMM yyyy", { locale: es });
    }
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Fetch observations for the class
const fetchObservations = async () => {
  loading.value = true;
  try {
    observations.value = await attendanceStore.getObservationsHistory(props.classId, props.date);
  } catch (error) {
    console.error('Error fetching observations:', error);
    observations.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch for changes in props to refetch data
watch(() => [props.classId, props.date], fetchObservations);

onMounted(fetchObservations);
</script>