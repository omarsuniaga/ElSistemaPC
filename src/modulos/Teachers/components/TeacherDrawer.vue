<template>
  <!-- Backdrop -->
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity z-[100]"
    @click="$emit('close')"
  />

  <!-- Drawer -->
  <div
    class="fixed inset-y-0 right-0 max-w-full flex z-[100] transform transition-all duration-300 ease-in-out"
    :class="{'translate-x-0': show, 'translate-x-full': !show}"
  >
    <div
      class="relative w-screen max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col h-full"
      @click.stop
    >
      <!-- Header -->
      <div class="flex-shrink-0">
        <div
          class="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700"
        >
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Perfil del Maestro</h2>
          <button
            class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            @click="$emit('close')"
          >
            <span class="sr-only">Cerrar</span>
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Teacher Profile Header -->
        <div class="px-4 py-5 bg-gradient-to-br from-primary-500/10 to-primary-600/10">
          <div class="flex items-center space-x-4">
            <img
              :src="
                teacher?.photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher?.name}`
              "
              :alt="teacher?.name"
              class="h-20 w-20 rounded-full border-4 border-white dark:border-gray-700 shadow-md"
            />
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ teacher?.name }}</h3>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="specialty in teacher?.specialties || []"
                  :key="specialty"
                  class="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-full"
                >
                  {{ specialty }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div
            class="bg-white dark:bg-gray-700/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ schedule?.totalClasses || 0 }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Clases Asignadas</div>
          </div>

          <div
            class="bg-white dark:bg-gray-700/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ formatHours(schedule?.weeklyHours || 0) }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Horas Semanales</div>
          </div>

          <div
            class="bg-white dark:bg-gray-700/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ getTotalStudents() }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Alumnos</div>
          </div>

          <div
            class="bg-white dark:bg-gray-700/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ teacher?.specialties?.length || 0 }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Especialidades</div>
          </div>
        </div>

        <!-- Schedule Section -->
        <div
          class="bg-white dark:bg-gray-700/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden"
        >
          <div
            class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600"
          >
            <h3 class="font-semibold text-gray-900 dark:text-white">Horario de Clases</h3>
          </div>

          <div
            v-if="schedule?.schedule?.length"
            class="divide-y divide-gray-200 dark:divide-gray-600"
          >
            <div
              v-for="(day, index) in schedule.schedule"
              :key="index"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {{ day.className }}
                    <span
                      class="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-full"
                    >
                      {{ day.studentCount }} estudiantes
                    </span>
                  </div>
                  <div
                    class="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2"
                  >
                    <ClockIcon class="w-4 h-4" />
                    {{ day.startTime }} - {{ day.endTime }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ day.dayOfWeek }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Salón {{ day.room || "No asignado" }}
                  </div>
                </div>
              </div>

              <!-- Lista de estudiantes si está disponible -->
              <div
                v-if="day.students?.length"
                class="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600"
              >
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Estudiantes:</div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="student in day.students.slice(0, 3)"
                    :key="student.id"
                    class="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                  >
                    {{ student.name }}
                  </span>
                  <span
                    v-if="day.students.length > 3"
                    class="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5"
                  >
                    +{{ day.students.length - 3 }} más
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400">
            No hay clases asignadas
          </div>
        </div>

        <!-- Weekly Summary Section -->
        <div
          class="bg-white dark:bg-gray-700/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden"
        >
          <div
            class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600"
          >
            <h3 class="font-semibold text-gray-900 dark:text-white">Resumen Semanal</h3>
          </div>
          <div class="p-4">
            <div class="space-y-2">
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600 dark:text-gray-400">Total Horas Semanales:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  formatHours(schedule?.weeklyHours || 0)
                }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600 dark:text-gray-400">Clases por Semana:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  schedule?.totalClasses || 0
                }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600 dark:text-gray-400">Promedio Estudiantes/Clase:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{
                    schedule?.schedule?.length
                      ? Math.round(getTotalStudents() / schedule.schedule.length)
                      : 0
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          class="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          @click="goToTeacherSchedule"
        >
          <CalendarIcon class="w-5 h-5 mr-2" />
          Ver Horario Completo
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
// ../modulos/Teacher/components/TeacherDrawer.vue
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTeachersStore } from '../../../stores/teachers';
import { CalendarIcon, ClockIcon } from '@heroicons/vue/24/outline';
import type { Teacher } from '../../../types/teachers';

interface ScheduleItem {
  className: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  studentCount: number
  students: {
    id: string
    name: string
  }[]
}

interface Schedule {
  totalClasses: number
  weeklyHours: number
  schedule: ScheduleItem[]
}

const props = withDefaults(
  defineProps<{
    show: boolean
    teacher?: Teacher | null
  }>(),
  {
    teacher: null,
  },
);

const emit = defineEmits(['close', 'edit']);
const teachersStore = useTeachersStore();
const router = useRouter();

const schedule = ref<Schedule | null>(null);
const isLoadingSchedule = ref(false);
const scheduleError = ref<string | null>(null);

const loadSchedule = async () => {
  if (!props.teacher?.id) return;

  isLoadingSchedule.value = true;
  scheduleError.value = null;

  try {
    const data = await teachersStore.getTeacherSchedule(props.teacher.id);
    // Convert the returned data to match our Schedule interface
    schedule.value = {
      totalClasses: data.totalClasses,
      weeklyHours: data.weeklyHours,
      schedule: Array.isArray(data.schedule) ? data.schedule : [],
    };
  } catch (error: any) {
    scheduleError.value = error.message;
  } finally {
    isLoadingSchedule.value = false;
  }
};

watch(
  () => props.show,
  (newValue) => {
    if (newValue && props.teacher) {
      loadSchedule();
    }
  },
);

// Función auxiliar para formatear horas
const formatHours = (hours: number) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours % 1) * 60);
  return wholeHours > 0 ? `${wholeHours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;
};

const goToTeacherSchedule = () => {
  if (!props.teacher?.id) return;
  router.push(`/teacher-schedule/${props.teacher.id}`);
  emit('close');
};

// Función para calcular total de estudiantes
const getTotalStudents = () => {
  if (!schedule.value?.schedule) return 0;
  return schedule.value.schedule.reduce(
    (total: number, day: ScheduleItem) => total + (day.studentCount || 0),
    0,
  );
};
</script>
