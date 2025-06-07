<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ClassObservation } from '../types/attendance';
import { useAttendanceStore } from '../store/attendance';

const props = defineProps<{
  classId: string;
  date?: string;
}>();

const attendanceStore = useAttendanceStore();
const observations = ref<ClassObservation[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const typeLabels = {
  general: 'General',
  comportamiento: 'Comportamiento',
  logro: 'Logro',
  contenido: 'Contenido',
  dinamica: 'Dinámica de Clase'
};

const priorityColors = {
  alta: 'bg-red-100 text-red-800',
  media: 'bg-yellow-100 text-yellow-800',
  baja: 'bg-green-100 text-green-800'
};

const loadObservations = async () => {
  try {
    loading.value = true;
    error.value = null;
    observations.value = await attendanceStore.getClassObservations(props.classId, props.date);
  } catch (err) {
    error.value = 'Error al cargar las observaciones';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadObservations);

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<template>
  <div class="space-y-4">
    <!-- Estado de carga -->
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Cargando observaciones...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 p-4 rounded-md">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Lista de observaciones -->
    <div v-else-if="observations.length > 0" class="space-y-4">
      <div v-for="observation in observations" :key="observation.id" class="bg-white rounded-lg shadow p-4">
        <!-- Encabezado -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full" :class="priorityColors[observation.priority]">
              {{ typeLabels[observation.type] }}
            </span>
            <span v-if="observation.requiresFollowUp" class="ml-2 inline-block px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              Requiere seguimiento
            </span>
          </div>
          <span class="text-sm text-gray-500">{{ formatDate(observation.date) }}</span>
        </div>

        <!-- Contenido -->
        <div class="space-y-3">
          <!-- Texto principal -->
          <p v-if="observation.content.text" class="text-gray-700">
            {{ observation.content.text }}
          </p>

          <!-- Viñetas -->
          <ul v-if="observation.content.bulletPoints?.length" class="list-disc list-inside space-y-1">
            <li v-for="(point, index) in observation.content.bulletPoints" :key="index" class="text-gray-700">
              {{ point }}
            </li>
          </ul>

          <!-- Obras trabajadas -->
          <div v-if="observation.content.works?.length" class="space-y-2">
            <h4 class="font-medium text-gray-900">Obras Trabajadas:</h4>
            <div v-for="(work, index) in observation.content.works" :key="index" class="pl-4 border-l-2 border-gray-200">
              <p class="font-medium">{{ work.title }}</p>
              <p v-if="work.composer" class="text-sm text-gray-600">Compositor: {{ work.composer }}</p>
              <p v-if="work.notes" class="text-sm text-gray-600 mt-1">{{ work.notes }}</p>
            </div>
          </div>

          <!-- Dinámicas de clase -->
          <div v-if="observation.content.classDynamics?.length" class="space-y-2">
            <h4 class="font-medium text-gray-900">Dinámicas de Clase:</h4>
            <div v-for="(dynamic, index) in observation.content.classDynamics" :key="index" class="pl-4 border-l-2 border-gray-200">
              <p class="font-medium">{{ dynamic.type }}</p>
              <p class="text-sm text-gray-600">{{ dynamic.description }}</p>
              <p v-if="dynamic.effectiveness" class="text-sm text-gray-600">
                Efectividad: {{ dynamic.effectiveness }}
              </p>
            </div>
          </div>
        </div>

        <!-- Pie de observación -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-500">
            Observación creada por {{ observation.author }}
          </p>
        </div>
      </div>
    </div>

    <!-- Sin observaciones -->
    <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
      <p class="text-gray-600">No hay observaciones para mostrar</p>
    </div>
  </div>
</template> 