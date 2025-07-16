<!-- 
  🚀 LISTA DE ASISTENCIA OPTIMIZADA
  Componente de alto rendimiento con actualizaciones reactivas y cache inteligente
-->
<template>
  <div class="attendance-list-optimized">
    <!-- 📊 Header con estadísticas en tiempo real -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Lista de Asistencia {{ selectedClassName ? `- ${selectedClassName}` : "" }}
        </h3>

        <!-- Indicador de estado -->
        <div class="flex items-center space-x-2">
          <div v-if="state.loading" class="flex items-center text-blue-600 dark:text-blue-400">
            <div
              class="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"
            />
            <span class="text-sm">Cargando...</span>
          </div>

          <div
            v-else-if="state.pendingUpdates.size > 0"
            class="flex items-center text-amber-600 dark:text-amber-400"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="text-sm">{{ state.pendingUpdates.size }} actualizaciones pendientes</span>
          </div>

          <div v-else class="flex items-center text-green-600 dark:text-green-400">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span class="text-sm">Sincronizado</span>
          </div>
        </div>
      </div>

      <!-- 📈 Estadísticas rápidas -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ stats.presente }}
          </div>
          <div class="text-sm text-green-700 dark:text-green-300">Presentes</div>
        </div>

        <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ stats.ausente }}
          </div>
          <div class="text-sm text-red-700 dark:text-red-300">Ausentes</div>
        </div>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {{ stats.tardanza }}
          </div>
          <div class="text-sm text-yellow-700 dark:text-yellow-300">Tardanzas</div>
        </div>

        <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ stats.attendanceRate.toFixed(1) }}%
          </div>
          <div class="text-sm text-blue-700 dark:text-blue-300">Asistencia</div>
        </div>
      </div>
    </div>

    <!-- ⚠️ Error State -->
    <div
      v-if="state.error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
    >
      <div class="flex items-center">
        <svg
          class="w-5 h-5 text-red-500 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-red-700 dark:text-red-300">{{ state.error }}</span>
        <button
          class="ml-auto px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          @click="retryLoad"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- 👥 Lista de estudiantes -->
    <div
      v-if="students.length > 0"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
    >
      <div class="max-h-96 overflow-y-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Estudiante
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
            <tr
              v-for="student in students"
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <!-- 👤 Info del estudiante -->
              <td class="px-4 py-3">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    :class="getStudentAvatarColor(student.id)"
                  >
                    {{ getStudentInitials(student) }}
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ student.nombre }} {{ student.apellido }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ student.email || "Sin email" }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- 📊 Estado actual -->
              <td class="px-4 py-3 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusColor(currentRecords[student.id] || 'Ausente')"
                >
                  {{ getStatusText(currentRecords[student.id] || "Ausente") }}
                </span>

                <!-- Indicador de actualización pendiente -->
                <div
                  v-if="isUpdating(student.id)"
                  class="mt-1 text-xs text-amber-600 dark:text-amber-400"
                >
                  <div class="animate-pulse">Actualizando...</div>
                </div>
              </td>

              <!-- 🎛️ Controles de estado -->
              <td class="px-4 py-3">
                <div class="flex justify-center space-x-1">
                  <!-- Presente -->
                  <button
                    :disabled="isUpdating(student.id)"
                    class="p-2 rounded-full transition-colors hover:scale-110 transform"
                    :class="
                      currentRecords[student.id] === 'Presente'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/20'
                    "
                    title="Marcar como presente"
                    @click="updateStatus(student.id, 'Presente')"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>

                  <!-- Tardanza -->
                  <button
                    :disabled="isUpdating(student.id)"
                    class="p-2 rounded-full transition-colors hover:scale-110 transform"
                    :class="
                      currentRecords[student.id] === 'Tardanza'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                    "
                    title="Marcar como tardanza"
                    @click="updateStatus(student.id, 'Tardanza')"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>

                  <!-- Ausente -->
                  <button
                    :disabled="isUpdating(student.id)"
                    class="p-2 rounded-full transition-colors hover:scale-110 transform"
                    :class="
                      currentRecords[student.id] === 'Ausente'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20'
                    "
                    title="Marcar como ausente"
                    @click="updateStatus(student.id, 'Ausente')"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  <!-- Justificado -->
                  <button
                    :disabled="isUpdating(student.id)"
                    class="p-2 rounded-full transition-colors hover:scale-110 transform"
                    :class="
                      currentRecords[student.id] === 'Justificado'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                    "
                    title="Marcar como justificado"
                    @click="updateStatus(student.id, 'Justificado')"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 📭 Estado vacío -->
    <div
      v-else-if="!state.loading"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center"
    >
      <svg
        class="w-12 h-12 text-gray-400 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No hay estudiantes en esta clase
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        Parece que esta clase no tiene estudiantes asignados.
      </p>
    </div>

    <!-- 🎛️ Controles rápidos -->
    <div v-if="students.length > 0" class="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Acciones Rápidas</h4>
      <div class="flex flex-wrap gap-2">
        <button
          :disabled="state.loading"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
          @click="markAllPresent"
        >
          ✓ Todos Presentes
        </button>

        <button
          :disabled="state.loading"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
          @click="clearAll"
        >
          🔄 Limpiar Todo
        </button>

        <button
          :disabled="state.loading || state.pendingUpdates.size === 0"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          @click="saveChanges"
        >
          💾 Guardar Cambios
        </button>
      </div>
    </div>

    <!-- 🐛 Debug info (solo en desarrollo) -->
    <div v-if="showDebugInfo" class="mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-xs">
      <strong>Debug Info:</strong><br />
      Cache size: {{ cacheInfo.size }}<br />
      Pending updates: {{ cacheInfo.pendingUpdates }}<br />
      Students loaded: {{ students.length }}<br />
      Selected date: {{ selectedDate }}<br />
      Selected class: {{ selectedClass }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAttendanceOptimizedSimple } from '../composables/useAttendanceOptimizedSimple';
import type { AttendanceStatus } from '../types/attendance';

// Props
const props = defineProps<{
  selectedDate: string
  selectedClass: string
  selectedClassName?: string
  showDebugInfo?: boolean
}>();

// Emits
const emit = defineEmits<{
  'status-updated': [studentId: string, status: AttendanceStatus]
  saved: []
  error: [error: string]
}>();

// 🚀 Composable optimizado
const {
  state,
  currentRecords,
  stats,
  cacheInfo,
  loadAttendance,
  updateStudentStatus,
  saveAttendanceDocument,
  getClassStudents,
  isUpdating,
} = useAttendanceOptimizedSimple();

// 👥 Estudiantes de la clase
const students = ref<any[]>([]);

/**
 * 🎨 Funciones de UI
 */
const getStatusColor = (status: AttendanceStatus) => {
  const colors = {
    Presente: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    Ausente: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    Tardanza: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    Justificado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  };
  return colors[status] || colors.Ausente;
};

const getStatusText = (status: AttendanceStatus) => {
  const texts = {
    Presente: 'Presente',
    Ausente: 'Ausente',
    Tardanza: 'Tardanza',
    Justificado: 'Justificado',
  };
  return texts[status] || 'Ausente';
};

const getStudentAvatarColor = (studentId: string) => {
  const colors = [
    'bg-red-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
  ];
  const index = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

const getStudentInitials = (student: any) => {
  const first = student.nombre?.charAt(0) || '';
  const last = student.apellido?.charAt(0) || '';
  return (first + last).toUpperCase();
};

/**
 * ⚡ Acciones principales
 */
const updateStatus = async (studentId: string, status: AttendanceStatus) => {
  try {
    await updateStudentStatus(studentId, status, props.selectedDate, props.selectedClass);
    emit('status-updated', studentId, status);
  } catch (error) {
    console.error('Error updating status:', error);
    emit('error', 'Error al actualizar estado');
  }
};

const markAllPresent = async () => {
  try {
    for (const student of students.value) {
      await updateStudentStatus(student.id, 'Presente', props.selectedDate, props.selectedClass);
    }
  } catch (error) {
    console.error('Error marking all present:', error);
    emit('error', 'Error al marcar todos presentes');
  }
};

const clearAll = async () => {
  try {
    for (const student of students.value) {
      await updateStudentStatus(student.id, 'Ausente', props.selectedDate, props.selectedClass);
    }
  } catch (error) {
    console.error('Error clearing all:', error);
    emit('error', 'Error al limpiar asistencia');
  }
};

const saveChanges = async () => {
  try {
    await saveAttendanceDocument(props.selectedDate, props.selectedClass);
    emit('saved');
  } catch (error) {
    console.error('Error saving changes:', error);
    emit('error', 'Error al guardar cambios');
  }
};

const retryLoad = async () => {
  state.error = null;
  await loadData();
};

/**
 * 🔄 Carga de datos
 */
const loadData = async () => {
  if (!props.selectedDate || !props.selectedClass) return;

  try {
    // Cargar estudiantes
    students.value = await getClassStudents(props.selectedClass);

    // Cargar asistencia
    await loadAttendance(props.selectedDate, props.selectedClass);

    console.log('✅ [AttendanceListOptimized] Data loaded successfully');
  } catch (error) {
    console.error('❌ [AttendanceListOptimized] Error loading data:', error);
    state.error = 'Error al cargar datos';
  }
};

// 👀 Watchers
watch(
  () => [props.selectedDate, props.selectedClass],
  () => loadData(),
  { immediate: true },
);

// 🚀 Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.attendance-list-optimized {
  @apply space-y-4;
}

/* Animaciones suaves */
.transition-colors {
  transition: all 0.2s ease-in-out;
}

.hover\:scale-110:hover {
  transform: scale(1.1);
}

/* Scroll personalizado */
.max-h-96::-webkit-scrollbar {
  width: 6px;
}

.max-h-96::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.max-h-96::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
