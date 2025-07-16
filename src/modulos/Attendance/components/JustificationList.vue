<template>
  <div class="space-y-4">
    <!-- Estado de carga -->
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      <p class="mt-2 text-gray-600">Cargando justificaciones...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 p-4 rounded-md">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Lista de justificaciones -->
    <div v-else-if="justifications.length > 0" class="space-y-4">
      <div
        v-for="justification in justifications"
        :key="justification.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <!-- Encabezado -->
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center space-x-2">
            <span
              class="inline-block px-2 py-1 text-xs font-semibold rounded-full"
              :class="statusColors[justification.approvalStatus]"
            >
              {{ statusLabels[justification.approvalStatus] }}
            </span>
            <span
              v-if="isExpired(justification.timeLimit)"
              class="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800"
            >
              Expirada
            </span>
          </div>
          <span class="text-sm text-gray-500">{{ formatDate(justification.date) }}</span>
        </div>

        <!-- Contenido -->
        <div class="space-y-3">
          <!-- Razón -->
          <p class="text-gray-700">
            {{ justification.reason }}
          </p>

          <!-- Documento -->
          <div v-if="justification.documentUrl" class="flex items-center space-x-2">
            <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                clip-rule="evenodd"
              />
            </svg>
            <a
              :href="justification.documentUrl"
              target="_blank"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver documento
            </a>
          </div>
        </div>

        <!-- Pie de justificación -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-500">
            Límite para justificar: {{ formatDate(justification.timeLimit) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Sin justificaciones -->
    <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
      <p class="text-gray-600">No hay justificaciones para mostrar</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { JustificationData } from '../types/attendance';
import { useAttendanceStore } from '../store/attendance';

const props = defineProps<{
  studentId: string
  classId?: string
  date?: string
}>();

const attendanceStore = useAttendanceStore();
const justifications = ref<JustificationData[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const statusLabels = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const loadJustifications = async () => {
  try {
    loading.value = true;
    error.value = null;
    justifications.value = await attendanceStore.fetchJustifications(
      props.studentId,
      props.classId,
      props.date,
    );
  } catch (err) {
    error.value = 'Error al cargar las justificaciones';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadJustifications);

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const isExpired = (timeLimit: string) => {
  return new Date(timeLimit) < new Date();
};
</script>
