<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <svg
          class="w-5 h-5 mr-2 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        Estudiantes Ausentes
      </h3>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Total: {{ absentees.length }}
        </span>
        <button
          v-if="absentees.length > 0"
          class="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          @click="notifyAll"
        >
          Notificar a Todos
        </button>
      </div>
    </div>

    <!-- Lista de ausentes -->
    <div v-if="absentees.length === 0" class="text-center py-8">
      <svg
        class="w-16 h-16 mx-auto text-green-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">¡Excelente!</h4>
      <p class="text-gray-600 dark:text-gray-400">
        No hay estudiantes ausentes registrados para hoy.
      </p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="absentee in absentees"
        :key="absentee.id"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center"
                >
                  <span class="text-red-600 dark:text-red-400 font-medium text-sm">
                    {{ getInitials(absentee.studentName) }}
                  </span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ absentee.studentName }}
                </h4>
                <div
                  class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1"
                >
                  <span class="flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    {{ absentee.className }}
                  </span>
                  <span class="flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {{ formatTime(absentee.classTime) }}
                  </span>
                  <span class="flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {{ absentee.teacherName }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Información adicional -->
            <div
              v-if="absentee.reason"
              class="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs"
            >
              <span class="font-medium text-yellow-800 dark:text-yellow-200">Motivo:</span>
              <span class="text-yellow-700 dark:text-yellow-300 ml-1">{{ absentee.reason }}</span>
            </div>

            <!-- Historial de ausencias -->
            <div
              v-if="absentee.consecutiveAbsences > 1"
              class="mt-2 text-xs text-red-600 dark:text-red-400"
            >
              ⚠️ {{ absentee.consecutiveAbsences }} ausencias consecutivas
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex items-center space-x-2 ml-4">
            <button
              class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
              title="Contactar"
              @click="contactStudent(absentee)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              class="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
              title="Marcar como justificada"
              @click="markAsJustified(absentee)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button
              class="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900 rounded-lg transition-colors"
              title="Programar seguimiento"
              @click="scheduleFollowUp(absentee)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas resumidas -->
    <div v-if="absentees.length > 0" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
        <div class="text-red-800 dark:text-red-200 text-sm font-medium">Ausencias de Hoy</div>
        <div class="text-red-900 dark:text-red-100 text-lg font-bold">{{ absentees.length }}</div>
      </div>
      <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
        <div class="text-orange-800 dark:text-orange-200 text-sm font-medium">
          Ausencias Consecutivas
        </div>
        <div class="text-orange-900 dark:text-orange-100 text-lg font-bold">
          {{ absentees.filter((a) => a.consecutiveAbsences > 1).length }}
        </div>
      </div>
      <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
        <div class="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
          Requieren Seguimiento
        </div>
        <div class="text-yellow-900 dark:text-yellow-100 text-lg font-bold">
          {{ absentees.filter((a) => a.consecutiveAbsences >= 3).length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Props
interface Absentee {
  id: string
  studentId: string
  studentName: string
  className: string
  classTime: string
  teacherName: string
  reason?: string
  consecutiveAbsences: number
  lastContactDate?: string
  parentPhone?: string
  parentEmail?: string
}

interface Props {
  absentees: Absentee[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
const emit = defineEmits<{
  contact: [absentee: Absentee]
  justify: [absentee: Absentee]
  followUp: [absentee: Absentee]
  notifyAll: [absentees: Absentee[]]
}>();

// Computed
const sortedAbsentees = computed(() => {
  return [...props.absentees].sort((a, b) => {
    // Priorizar por ausencias consecutivas
    if (a.consecutiveAbsences !== b.consecutiveAbsences) {
      return b.consecutiveAbsences - a.consecutiveAbsences;
    }
    // Luego por nombre
    return a.studentName.localeCompare(b.studentName);
  });
});

// Methods
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatTime = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return format(date, 'HH:mm', { locale: es });
  } catch {
    return time;
  }
};

const contactStudent = (absentee: Absentee): void => {
  emit('contact', absentee);
};

const markAsJustified = (absentee: Absentee): void => {
  emit('justify', absentee);
};

const scheduleFollowUp = (absentee: Absentee): void => {
  emit('followUp', absentee);
};

const notifyAll = (): void => {
  emit('notifyAll', props.absentees);
};
</script>
