<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useClassesStore } from '../store/classes';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useAuthStore } from '../../../stores/auth';
import { date } from 'yup';

const authStore = useAuthStore();
const classesStore = useClassesStore();
const attendanceStore = useAttendanceStore();
const isLoading = ref(false);

// Estructura de actividad según lo solicitado
interface Activity {
  id: string;
  type: string;
  class: string; 
  content: string;
  timestamp: string;
  // Campos adicionales para mostrar información de asistencia
  presentCount?: number;
  totalCount?: number;
}

// Estructura para agrupar actividades por clase
interface ClassGroup {
  classId: string;
  className: string;
  activities: Activity[];
}

const groupedByClass = ref<ClassGroup[]>([]);
const expanded = ref<string | null>(null);

async function loadActivities() {
  isLoading.value = true;
  try {
    // 1. Obtener el uid de la sesión activa
    const teacherId = authStore.user?.uid;
    if (!teacherId) {
      // console.log('No hay usuario autenticado');
      return;
    }

    // 2. Cargar las clases del profesor y los documentos de asistencia
    await classesStore.fetchClasses();
    const res = await attendanceStore.fetchObservationsHistory(teacherId);
    // Transformar el resultado para que coincida con nuestra interfaz ClassGroup[]
    groupedByClass.value = (res || []).map(group => ({
      classId: group.classId,
      className: group.className,
      activities: group.activities.map(activity => ({
        id: activity.id,
        type: 'observation', // Valor por defecto
        class: activity.className,
        content: activity.observacion,
        timestamp: activity.fecha,
        presentCount: activity.presentCount,
        totalCount: activity.totalCount
      }))
    }));
  } catch (error) {
    console.error('Error al cargar las actividades:', error);
  } finally {
    isLoading.value = false;
  }
}


     
    

onMounted(async () => {
  await loadActivities();
});
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h2 class="text-lg font-semibold">Observaciones de Clases</h2>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="isLoading" class="flex justify-center items-center h-40">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else-if="groupedByClass.length === 0" class="text-center text-gray-500 py-12">
        No hay observaciones registradas para tus clases.
      </div>
      
      <div v-else class="space-y-3">
        <div v-for="group in groupedByClass" :key="group.classId" class="border rounded-lg bg-white dark:bg-gray-800 shadow">
          <button
            class="w-full text-left px-4 py-3 flex flex-col focus:outline-none hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
            @click="expanded === group.classId ? expanded = null : expanded = group.classId"
          >
            <div class="flex justify-between items-center">
              <div>
                <div class="font-semibold text-base">{{ group.className }}</div>
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-300">{{ expanded === group.classId ? '▲' : '▼' }}</div>
            </div>
          </button>
          
          <div v-if="expanded === group.classId" class="px-6 pb-4 pt-2 border-t dark:border-gray-700">
            <div v-for="activity in group.activities" :key="activity.id" class="mb-4">
              <div class="flex justify-between items-center mb-1">
                <div class="text-xs text-gray-500">{{ activity.timestamp }}</div>
                <div class="text-xs font-medium">Presentes: {{ activity.presentCount }}/{{ activity.totalCount }}</div>
              </div>
              <div class="text-gray-800 dark:text-gray-100 whitespace-pre-line">{{ activity.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>