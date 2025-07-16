<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Clase e Instrumento
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Horario y Estatus
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Profesor
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Estudiantes
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Nivel
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Observaciones
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="classItem in classes" :key="classItem.id">
          <!-- Columna Clase e Instrumento -->
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div>
                <div class="text-sm font-medium text-gray-900">{{ classItem.nombre }}</div>
                <div class="text-sm text-gray-500">{{ classItem.instrumento }}</div>
              </div>
            </div>
          </td>

          <!-- Columna Horario y Estatus -->
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <ClockIcon class="flex-shrink-0 h-5 w-5 text-gray-400" />
              <div class="ml-2">
                <div class="text-sm text-gray-900">
                  {{ classItem.horarioInicio }} - {{ classItem.horarioFin }}
                </div>
                <span
                  :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    statusColor(getScheduleStatus(classItem.horarioInicio, classItem.horarioFin)),
                  ]"
                >
                  {{
                    getScheduleStatus(classItem.horarioInicio, classItem.horarioFin) === "current"
                      ? "En curso"
                      : getScheduleStatus(classItem.horarioInicio, classItem.horarioFin) === "past"
                        ? "Finalizado"
                        : "Programado"
                  }}
                </span>
              </div>
            </div>
          </td>

          <!-- Columna Profesor -->
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ getTeacherName(classItem.teacherId) }}
          </td>

          <!-- Columna Estudiantes -->
          <td class="px-6 py-4 whitespace-nowrap">
            <button
              class="flex items-center text-blue-600 hover:text-blue-900"
              @click="
                () => {
                  selectedClass = classItem
                  showStudentsModal = true
                }
              "
            >
              <UserGroupIcon class="h-5 w-5 mr-1" />
              <span>{{ classItem.alumnos?.length || 0 }}</span>
            </button>
          </td>

          <!-- Columna Nivel -->
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              :class="[
                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                classItem.nivel === 'Avanzado'
                  ? 'bg-purple-100 text-purple-800'
                  : classItem.nivel === 'Intermedio'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800',
              ]"
            >
              {{ classItem.nivel }}
            </span>
          </td>

          <!-- Columna Observaciones -->
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div class="flex items-center">
              <button
                v-if="classItem.observaciones"
                class="flex items-center text-yellow-600 hover:text-yellow-800"
                @click="
                  () => {
                    selectedClass = classItem
                    showObservationsModal = true
                  }
                "
              >
                <ExclamationCircleIcon class="h-5 w-5 mr-1" />
                <span>Ver observaciones</span>
              </button>
              <span v-else>Sin observaciones</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Modal para mostrar estudiantes -->
  <Modal
    :show="showStudentsModal"
    title="Estudiantes de la clase"
    @close="showStudentsModal = false"
  >
    <div class="p-4">
      <h3 class="text-lg font-medium mb-2">{{ selectedClass?.nombre }}</h3>
      <ul class="divide-y divide-gray-200">
        <li v-for="student in getStudents(selectedClass?.alumnos)" :key="student.id" class="py-2">
          {{ student.nombre }} {{ student.apellido }}
        </li>
        <li v-if="!selectedClass?.alumnos?.length" class="py-2 text-gray-500">
          No hay estudiantes inscritos
        </li>
      </ul>
    </div>
  </Modal>

  <!-- Modal para mostrar observaciones -->
  <Modal
    :show="showObservationsModal"
    title="Observaciones de la clase"
    @close="showObservationsModal = false"
  >
    <div class="p-4">
      <h3 class="text-lg font-medium mb-2">{{ selectedClass?.nombre }}</h3>
      <div v-if="selectedClass?.observaciones" class="bg-yellow-50 p-3 rounded-md">
        <p class="text-gray-800">{{ selectedClass?.observaciones }}</p>
      </div>
      <div v-else class="text-gray-500 italic">
        No hay observaciones registradas para esta clase
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useStudentsStore } from '../../Students/store/students';
import {
  UserGroupIcon,
  PencilIcon,
  EyeIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline';
import Modal from '../../../shared/Modal.vue';

const props = defineProps({
  classes: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();

// Estado para modales
const showStudentsModal = ref(false);
const showObservationsModal = ref(false);
const selectedClass = ref(null);

// Obtener nombre del profesor con manejo de errores
const getTeacherName = (teacherId) => {
  try {
    if (!teacherId) return 'Sin profesor asignado';
    if (!teachersStore.teachers?.length) return 'Profesores no cargados';

    const teacher = teachersStore.teachers.find((t) => t.id === teacherId);
    return teacher?.name || 'Profesor no encontrado';
  } catch (error) {
    console.error('Error al obtener profesor:', error);
    return 'Error al cargar profesor';
  }
};

// Obtener estudiantes de una clase con memoización para mejor rendimiento
const getStudents = computed(() => {
  return (studentIds) => {
    if (!studentIds?.length) return [];
    return studentsStore.students.filter((s) => studentIds.includes(s.id));
  };
});

// Determinar estado del horario con TypeScript
type ClassStatus = 'en_proceso' | 'terminado' | 'sin_ejecutar' | 'en_espera'

const getScheduleStatus = (startTime: string, endTime: string): ClassStatus => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Margen de 15 minutos antes para considerar "en espera"
  const waitingThreshold = new Date(start.getTime() - 15 * 60 * 1000);

  if (now > end) return 'terminado';
  if (now >= start && now <= end) return 'en_proceso';
  if (now >= waitingThreshold && now < start) return 'en_espera';
  return 'sin_ejecutar';
};

// Asignar colores Tailwind CSS según estado
const statusColor = (status: ClassStatus): string => {
  switch (status) {
  case 'en_proceso':
    return 'bg-green-100 text-green-800';
  case 'terminado':
    return 'bg-gray-100 text-gray-600';
  case 'sin_ejecutar':
    return 'bg-blue-100 text-blue-800';
  case 'en_espera':
    return 'bg-yellow-100 text-yellow-800';
  default:
    return 'bg-gray-100';
  }
};
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
