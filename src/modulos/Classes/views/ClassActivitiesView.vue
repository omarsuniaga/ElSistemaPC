<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div
      class="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <ChatBubbleLeftRightIcon class="h-6 w-6 text-blue-500" />
            Observaciones de Clases
          </h2>
          <button
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            :disabled="isLoading"
            @click="loadActivities"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {{ isLoading ? "Actualizando..." : "Actualizar" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="max-w-7xl mx-auto">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex justify-center items-center h-40">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="text-center p-8 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="groupedByClass.length === 0" class="text-center py-12">
          <ChatBubbleLeftRightIcon class="h-12 w-12 mx-auto text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            No hay observaciones registradas
          </h3>
          <p class="mt-2 text-gray-500 dark:text-gray-400">
            Las observaciones que agregues en tus clases aparecerán aquí.
          </p>
        </div>

        <!-- Content state -->
        <div v-else class="space-y-4">
          <div
            v-for="group in groupedByClass"
            :key="group.classId"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <!-- Class header -->
            <button
              class="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              @click="expanded = expanded === group.classId ? null : group.classId"
            >
              <div class="flex items-center gap-3">
                <div class="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-2">
                  <UserGroupIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div class="text-left">
                  <h3 class="font-medium text-gray-900 dark:text-gray-100">
                    {{ group.className }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ group.activities.length }} observaciones
                  </p>
                </div>
              </div>
              <component
                :is="expanded === group.classId ? ChevronUpIcon : ChevronDownIcon"
                class="h-5 w-5 text-gray-400"
              />
            </button>

            <!-- Activities list -->
            <div
              v-show="expanded === group.classId"
              class="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700"
            >
              <div
                v-for="activity in group.activities"
                :key="activity.id"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <!-- Activity header -->
                <div class="flex justify-between items-start mb-2">
                  <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <CalendarIcon class="h-4 w-4" />
                    {{ formatDateForDisplay(activity.timestamp) }}
                  </div>
                  <div
                    v-if="activity.presentCount !== undefined && activity.totalCount !== undefined"
                    :class="
                      getAttendanceColor(
                        getAttendanceRate(activity.presentCount, activity.totalCount)
                      )
                    "
                    class="text-sm font-medium"
                  >
                    {{ activity.presentCount }}/{{ activity.totalCount }} presentes
                  </div>
                </div>
                <!-- Activity content -->
                <div class="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                  {{ activity.content }}
                </div>
                <!-- Activity footer -->
                <div v-if="activity.author" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Registrado por: {{ activity.author }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useClassesStore } from '../store/classes';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useAuthStore } from '../../../stores/auth';
import { format } from 'date-fns';

import {
  ChevronDownIcon,
  ChevronUpIcon,
  UserGroupIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore();
const classesStore = useClassesStore();
const attendanceStore = useAttendanceStore();
const isLoading = ref(false);
const error = ref<string | null>(null);

// Estructura para las actividades
interface Activity {
  id: string
  type: string
  class: string
  content: string
  timestamp: string
  presentCount?: number
  totalCount?: number
  author?: string
}

// Estructura para agrupar actividades por clase
interface ClassGroup {
  classId: string
  className: string
  activities: Activity[]
}

const groupedByClass = ref<ClassGroup[]>([]);
const expanded = ref<string | null>(null);

const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return 'Sin fecha';

  try {
    // Intentar convertir a fecha si es posible
    let date;

    // Handle Firebase timestamp format
    if (typeof dateStr === 'object' && 'seconds' in dateStr) {
      date = new Date(dateStr.seconds * 1000);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return dateStr; // Si no se puede convertir, devolver como está
    }

    return format(date, 'dd/MM/yyyy HH:mm');
  } catch {
    return dateStr;
  }
};

// Función mejorada para normalizar fechas para comparación
const normalizeDateForSort = (dateStr: string) => {
  if (!dateStr) return 0;

  try {
    // Normalizar formato de fecha para comparación
    let timestamp;

    if (typeof dateStr === 'object' && 'seconds' in dateStr) {
      timestamp = dateStr.seconds * 1000;
    } else {
      timestamp = new Date(dateStr).getTime();
    }

    return isNaN(timestamp) ? 0 : timestamp;
  } catch {
    return 0;
  }
};

const getAttendanceRate = (present: number, total: number) => {
  if (!total) return 0;
  return Math.round((present / total) * 100);
};

const getAttendanceColor = (rate: number) => {
  if (rate >= 80) return 'text-green-600 dark:text-green-400';
  if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

async function loadActivities() {
  isLoading.value = true;
  error.value = null;
  try {
    const teacherId = authStore.user?.uid;
    if (!teacherId) {
      throw new Error('No hay usuario autenticado');
    }

    // Primero obtener las clases del profesor
    await classesStore.fetchClasses();
    const teacherClasses = classesStore.classes.filter((c) => c.teacherId === teacherId);
    const teacherClassIds = teacherClasses.map((c) => c.id);

    if (teacherClassIds.length === 0) {
      console.log('No se encontraron clases para este profesor');
      groupedByClass.value = [];
      return;
    }

    let allObservations = [];
    try {
      // Obtener todas las observaciones sin especificar classId
      // allObservations = await observationActions.fetchAllObservationsForTeacher(teacherId);
      // Instead of directly calling observationActions, dispatch an action through the store
      await attendanceStore.fetchAllObservationsForTeacher(teacherId);
      allObservations = attendanceStore.observationsHistory; // Assuming observationsHistory is populated by the action
    } catch (err) {
      console.error('Error al obtener observaciones:', err);
      // Continuar con array vacío si hay un error
      allObservations = [];
    }

    // Filtrar y agrupar observaciones solo de las clases del profesor
    const grouped = allObservations.reduce((acc: Record<string, ClassGroup>, obs: any) => {
      // Solo procesar si la observación pertenece a una clase del profesor
      if (!obs.classId || !teacherClassIds.includes(obs.classId)) {
        return acc;
      }

      // Obtener la información de la clase
      const classInfo = teacherClasses.find((c) => c.id === obs.classId);
      if (!acc[obs.classId]) {
        acc[obs.classId] = {
          classId: obs.classId,
          className: classInfo?.name || 'Clase sin nombre',
          activities: [],
        };
      }

      // Asegurarse de que todos los campos necesarios existen
      acc[obs.classId].activities.push({
        id: obs.id || String(Date.now() + Math.random()),
        type: 'observation',
        class: acc[obs.classId].className,
        content:
          typeof obs.text === 'string'
            ? obs.text
            : obs.text && typeof obs.text.formattedText === 'string'
              ? obs.text.formattedText
              : obs.observacion || '(Sin contenido)',
        timestamp:
          obs.date ||
          (obs.createdAt
            ? typeof obs.createdAt === 'string'
              ? obs.createdAt
              : new Date(obs.createdAt.seconds * 1000).toISOString()
            : new Date().toISOString()),
        author: obs.author || 'Profesor',
      });
      return acc;
    }, {});

    // Ordenar las clases por la fecha más reciente de sus observaciones
    groupedByClass.value = Object.values(grouped)
      .map((group: ClassGroup) => ({
        ...group,
        activities: group.activities.sort(
          (a, b) => normalizeDateForSort(b.timestamp) - normalizeDateForSort(a.timestamp),
        ),
      }))
      .sort((a, b) => {
        const aTime = a.activities[0] ? normalizeDateForSort(a.activities[0].timestamp) : 0;
        const bTime = b.activities[0] ? normalizeDateForSort(b.activities[0].timestamp) : 0;
        return bTime - aTime; // Ordenar descendente (más reciente primero)
      });
  } catch (error) {
    console.error('Error al cargar las actividades:', error);
    error.value = error instanceof Error ? error.message : 'Error al cargar las actividades';
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadActivities);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
