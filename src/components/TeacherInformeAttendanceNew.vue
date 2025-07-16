<template>
  <div
    class="p-4 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow"
  >
    <!-- Header con botón de regreso -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <button
          class="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          @click="goBack"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </button>
        <div>
          <h2 class="text-xl font-bold text-primary-600 dark:text-primary-400">
            Informe de Asistencia - {{ teacherName }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ teacherClasses.length }} clases • {{ totalStudents }} estudiantes
          </p>
        </div>
      </div>

      <!-- Controles de vista -->
      <div class="flex gap-2">
        <button
          :class="
            viewMode === 'cards'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          "
          class="px-3 py-1 text-sm rounded transition-colors"
          @click="viewMode = 'cards'"
        >
          <Squares2X2Icon class="h-4 w-4 inline mr-1" />
          Cards
        </button>
        <button
          :class="
            viewMode === 'list'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          "
          class="px-3 py-1 text-sm rounded transition-colors"
          @click="viewMode = 'list'"
        >
          <ListBulletIcon class="h-4 w-4 inline mr-1" />
          Lista
        </button>
      </div>
    </div>

    <!-- Filtros de fecha -->
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rango de fechas
          </label>
          <div class="flex gap-2">
            <input
              v-model="dateFrom"
              type="date"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span class="flex items-center text-gray-500">a</span>
            <input
              v-model="dateTo"
              type="date"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
            @click="setDefaultDateRange"
          >
            Último mes
          </button>
          <button
            :disabled="loading"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm disabled:opacity-50"
            @click="loadAttendanceData"
          >
            <ArrowPathIcon v-if="loading" class="h-4 w-4 animate-spin inline mr-1" />
            Cargar datos
          </button>
        </div>
      </div>
    </div>

    <!-- Estadísticas generales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircleIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">Presentes</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {{ totalPresentes }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center">
          <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <XCircleIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">Ausentes</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {{ totalAusentes }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <ClockIcon class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">Tardes</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ totalTardes }}</p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <DocumentTextIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">Justificados</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {{ totalJustificados }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de carga -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ArrowPathIcon class="h-8 w-8 animate-spin text-primary-500" />
      <span class="ml-3 text-gray-600 dark:text-gray-400">Cargando datos de asistencia...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- Contenido principal -->
    <div v-else>
      <!-- Vista de Cards -->
      <div v-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="classData in teacherClasses"
          :key="classData.id"
          class="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <!-- Header de la clase -->
          <div
            class="p-4 bg-gray-50 dark:bg-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
            @click="toggleClassExpansion(classData.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <component
                  :is="expandedClasses.has(classData.id) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5 text-gray-500 mr-2"
                />
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {{ classData.name }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ getClassSchedule(classData) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {{ getAttendancePercentage(classData) }}% asistencia
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ getClassStudentsCount(classData) }} estudiantes
                </div>
              </div>
            </div>
          </div>

          <!-- Contenido expandible -->
          <div v-if="expandedClasses.has(classData.id)" class="p-4 space-y-4">
            <!-- Lista de estudiantes -->
            <div
              v-for="student in getClassStudents(classData)"
              :key="student.id"
              class="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
            >
              <div
                class="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 rounded p-2 transition-colors"
                @click="toggleStudentExpansion(classData.id, student.id)"
              >
                <div class="flex items-center">
                  <component
                    :is="
                      expandedStudents.has(`${classData.id}-${student.id}`)
                        ? ChevronDownIcon
                        : ChevronRightIcon
                    "
                    class="h-4 w-4 text-gray-400 mr-2"
                  />
                  <span class="font-medium text-gray-800 dark:text-gray-200">{{
                    student.name
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ getStudentAttendancePercentage(classData.id, student.id) }}% asistencia
                  </span>
                  <button
                    class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Ver observaciones"
                    @click.stop="showObservationsModal(classData.id, student.id)"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Detalle de asistencias del estudiante -->
              <div v-if="expandedStudents.has(`${classData.id}-${student.id}`)" class="mt-3 pl-6">
                <div class="space-y-2">
                  <div
                    v-for="attendance in getStudentAttendances(classData.id, student.id)"
                    :key="attendance.date"
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-gray-600 dark:text-gray-400">
                      {{ formatDate(attendance.date) }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span
                        :class="getStatusClass(attendance.status)"
                        class="px-2 py-1 rounded text-xs font-medium"
                      >
                        {{ getStatusText(attendance.status) }}
                      </span>
                      <span
                        v-if="attendance.justification"
                        class="text-xs text-blue-600 dark:text-blue-400"
                      >
                        {{ attendance.justification }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de Lista -->
      <div v-else class="space-y-4">
        <div
          v-for="classData in teacherClasses"
          :key="classData.id"
          class="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
        >
          <!-- Header de la clase -->
          <div
            class="p-4 bg-gray-50 dark:bg-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
            @click="toggleClassExpansion(classData.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <component
                  :is="expandedClasses.has(classData.id) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5 text-gray-500 mr-3"
                />
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {{ classData.name }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ getClassSchedule(classData) }} •
                    {{ getClassStudentsCount(classData) }} estudiantes
                  </p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {{ getAttendancePercentage(classData) }}%
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">asistencia</div>
              </div>
            </div>
          </div>

          <!-- Contenido expandible -->
          <div v-if="expandedClasses.has(classData.id)" class="p-4">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-600">
                  <th class="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estudiante
                  </th>
                  <th class="text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    % Asistencia
                  </th>
                  <th class="text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Presentes
                  </th>
                  <th class="text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ausentes
                  </th>
                  <th class="text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tardes
                  </th>
                  <th class="text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in getClassStudents(classData)"
                  :key="student.id"
                  class="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <td class="py-3">
                    <div
                      class="flex items-center cursor-pointer"
                      @click="toggleStudentExpansion(classData.id, student.id)"
                    >
                      <component
                        :is="
                          expandedStudents.has(`${classData.id}-${student.id}`)
                            ? ChevronDownIcon
                            : ChevronRightIcon
                        "
                        class="h-4 w-4 text-gray-400 mr-2"
                      />
                      <span class="font-medium text-gray-800 dark:text-gray-200">{{
                        student.name
                      }}</span>
                    </div>
                  </td>
                  <td class="text-center py-3 text-sm text-gray-600 dark:text-gray-400">
                    {{ getStudentAttendancePercentage(classData.id, student.id) }}%
                  </td>
                  <td class="text-center py-3 text-sm text-green-600 dark:text-green-400">
                    {{ getStudentAttendanceCount(classData.id, student.id, "presente") }}
                  </td>
                  <td class="text-center py-3 text-sm text-red-600 dark:text-red-400">
                    {{ getStudentAttendanceCount(classData.id, student.id, "ausente") }}
                  </td>
                  <td class="text-center py-3 text-sm text-yellow-600 dark:text-yellow-400">
                    {{ getStudentAttendanceCount(classData.id, student.id, "tarde") }}
                  </td>
                  <td class="text-center py-3">
                    <button
                      class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Ver observaciones"
                      @click="showObservationsModal(classData.id, student.id)"
                    >
                      <EyeIcon class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Detalle de asistencias expandido -->
            <div v-for="student in getClassStudents(classData)" :key="`detail-${student.id}`">
              <div
                v-if="expandedStudents.has(`${classData.id}-${student.id}`)"
                class="mt-4 p-4 bg-gray-50 dark:bg-gray-600 rounded-lg"
              >
                <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Detalle de asistencias - {{ student.name }}
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div
                    v-for="attendance in getStudentAttendances(classData.id, student.id)"
                    :key="attendance.date"
                    class="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                  >
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {{ formatDate(attendance.date) }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span
                        :class="getStatusClass(attendance.status)"
                        class="px-2 py-1 rounded text-xs font-medium"
                      >
                        {{ getStatusText(attendance.status) }}
                      </span>
                      <span
                        v-if="attendance.justification"
                        class="text-xs text-blue-600 dark:text-blue-400"
                      >
                        {{ attendance.justification }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje cuando no hay datos -->
      <div v-if="teacherClasses.length === 0" class="text-center py-12">
        <AcademicCapIcon class="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p class="text-lg text-gray-500 dark:text-gray-400 mb-2">
          No hay clases asignadas a este maestro
        </p>
        <p class="text-sm text-gray-400 dark:text-gray-500">
          O no hay datos de asistencia en el rango de fechas seleccionado.
        </p>
      </div>
    </div>

    <!-- Modal de observaciones -->
    <div
      v-if="showObservations"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Observaciones - {{ selectedClassName }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="closeObservationsModal"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <div v-if="loadingObservations" class="text-center py-8">
          <ArrowPathIcon class="h-8 w-8 animate-spin text-primary-500 mx-auto" />
          <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando observaciones...</p>
        </div>

        <div v-else-if="classObservations.length === 0" class="text-center py-8">
          <DocumentTextIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">
            No hay observaciones registradas para esta clase
          </p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="observation in classObservations"
            :key="observation.id"
            class="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ observation.authorName || "Profesor" }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(observation.date) }}
                </span>
              </div>
              <span
                v-if="observation.type"
                :class="getObservationTypeClass(observation.type)"
                class="px-2 py-1 text-xs rounded-full"
              >
                {{ getObservationTypeText(observation.type) }}
              </span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {{ getObservationText(observation) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AcademicCapIcon,
} from '@heroicons/vue/24/outline';

// Stores
import { useTeachersStore } from '@/modulos/Teachers/store/teachers';
import { useClassesStore } from '@/modulos/Classes/store/classes';
import { useStudentsStore } from '@/modulos/Students/store/students';
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance';

// Types
interface AttendanceRecord {
  date: string
  status: 'presente' | 'ausente' | 'tarde' | 'justificado'
  justification?: string
}

interface ClassObservation {
  id: string
  date: string
  authorName?: string
  type?: string
  content?: any
  text?: string
}

// Router
const router = useRouter();
const route = useRoute();

// Stores
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();

// Props
const props = defineProps({
  teacherId: {
    type: String,
    default: '',
  },
});

// Estado
const loading = ref(false);
const error = ref('');
const viewMode = ref<'cards' | 'list'>('cards');
const expandedClasses = ref(new Set<string>());
const expandedStudents = ref(new Set<string>());
const showObservations = ref(false);
const loadingObservations = ref(false);
const classObservations = ref<ClassObservation[]>([]);
const selectedClassId = ref('');
const selectedClassName = ref('');

// Fechas
const dateFrom = ref('');
const dateTo = ref('');

// Computed
const teacherId = computed(() => props.teacherId || (route.query.teacherId as string));

const teacherName = computed(() => {
  if (!teacherId.value) return 'Maestro';
  const teacher = teachersStore.getTeacherById(teacherId.value);
  return teacher?.name || 'Maestro';
});

const teacherClasses = computed(() => {
  if (!teacherId.value) return [];
  return classesStore.classes.filter((c) => c.teacherId === teacherId.value);
});

const totalStudents = computed(() => {
  const studentIds = new Set<string>();
  teacherClasses.value.forEach((cls) => {
    if (cls.studentIds) {
      cls.studentIds.forEach((id) => studentIds.add(id));
    }
  });
  return studentIds.size;
});

// Estadísticas generales
const totalPresentes = computed(() => {
  return getTotalAttendanceCount('presente');
});

const totalAusentes = computed(() => {
  return getTotalAttendanceCount('ausente');
});

const totalTardes = computed(() => {
  return getTotalAttendanceCount('tarde');
});

const totalJustificados = computed(() => {
  return getTotalAttendanceCount('justificado');
});

// Métodos
function goBack() {
  router.back();
}

function setDefaultDateRange() {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  dateFrom.value = lastMonth.toISOString().split('T')[0];
  dateTo.value = today.toISOString().split('T')[0];
}

function toggleClassExpansion(classId: string) {
  if (expandedClasses.value.has(classId)) {
    expandedClasses.value.delete(classId);
  } else {
    expandedClasses.value.add(classId);
  }
}

function toggleStudentExpansion(classId: string, studentId: string) {
  const key = `${classId}-${studentId}`;
  if (expandedStudents.value.has(key)) {
    expandedStudents.value.delete(key);
  } else {
    expandedStudents.value.add(key);
  }
}

function getClassSchedule(classData: any): string {
  if (!classData.schedule?.slots) return 'Horario no definido';

  const slots = classData.schedule.slots;
  if (slots.length === 0) return 'Sin horario';

  const firstSlot = slots[0];
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = days[firstSlot.day] || `Día ${firstSlot.day}`;

  return `${dayName} ${firstSlot.startTime} - ${firstSlot.endTime}`;
}

function getClassStudentsCount(classData: any): number {
  return classData.studentIds?.length || 0;
}

function getClassStudents(classData: any) {
  if (!classData.studentIds) return [];
  return studentsStore.students.filter((s) => classData.studentIds.includes(s.id));
}

function getAttendancePercentage(classData: any): number {
  const students = getClassStudents(classData);
  if (students.length === 0) return 0;

  let totalPresentes = 0;
  let totalSessions = 0;

  students.forEach((student) => {
    const attendances = getStudentAttendances(classData.id, student.id);
    totalSessions += attendances.length;
    totalPresentes += attendances.filter((a) => a.status === 'presente').length;
  });

  return totalSessions > 0 ? Math.round((totalPresentes / totalSessions) * 100) : 0;
}

function getStudentAttendancePercentage(classId: string, studentId: string): number {
  const attendances = getStudentAttendances(classId, studentId);
  if (attendances.length === 0) return 0;

  const presentes = attendances.filter((a) => a.status === 'presente').length;
  return Math.round((presentes / attendances.length) * 100);
}

function getStudentAttendanceCount(classId: string, studentId: string, status: string): number {
  const attendances = getStudentAttendances(classId, studentId);
  return attendances.filter((a) => a.status === status).length;
}

function getStudentAttendances(classId: string, studentId: string): AttendanceRecord[] {
  // Aquí deberías obtener las asistencias reales del store
  // Por ahora retornamos datos de ejemplo
  const attendances: AttendanceRecord[] = [];

  // Simular datos de asistencia para el rango de fechas
  if (dateFrom.value && dateTo.value) {
    const startDate = new Date(dateFrom.value);
    const endDate = new Date(dateTo.value);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      attendances.push({
        date: dateStr,
        status: Math.random() > 0.3 ? 'presente' : 'ausente',
        justification: Math.random() > 0.8 ? 'Justificación médica' : undefined,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return attendances;
}

function getTotalAttendanceCount(status: string): number {
  let total = 0;
  teacherClasses.value.forEach((cls) => {
    const students = getClassStudents(cls);
    students.forEach((student) => {
      const attendances = getStudentAttendances(cls.id, student.id);
      total += attendances.filter((a) => a.status === status).length;
    });
  });
  return total;
}

function getStatusClass(status: string): string {
  switch (status) {
  case 'presente':
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  case 'ausente':
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  case 'tarde':
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  case 'justificado':
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  default:
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

function getStatusText(status: string): string {
  switch (status) {
  case 'presente':
    return 'Presente';
  case 'ausente':
    return 'Ausente';
  case 'tarde':
    return 'Tarde';
  case 'justificado':
    return 'Justificado';
  default:
    return status;
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

async function showObservationsModal(classId: string, studentId?: string) {
  selectedClassId.value = classId;
  const classData = classesStore.getClassById(classId);
  selectedClassName.value = classData?.name || 'Clase';

  showObservations.value = true;
  loadingObservations.value = true;

  try {
    // Obtener observaciones de la clase
    const observations = await attendanceStore.fetchObservationsForClass(classId);

    // Filtrar por rango de fechas si está definido
    let filteredObservations = observations;
    if (dateFrom.value && dateTo.value) {
      filteredObservations = observations.filter((obs) => {
        const obsDate = obs.date || obs.fecha;
        return obsDate >= dateFrom.value && obsDate <= dateTo.value;
      });
    }

    classObservations.value = filteredObservations;
  } catch (err) {
    console.error('Error cargando observaciones:', err);
    classObservations.value = [];
  } finally {
    loadingObservations.value = false;
  }
}

function closeObservationsModal() {
  showObservations.value = false;
  classObservations.value = [];
}

function getObservationText(observation: ClassObservation): string {
  if (observation.text) return observation.text;
  if (observation.content?.text) return observation.content.text;
  if (typeof observation.content === 'string') return observation.content;
  return 'Sin contenido';
}

function getObservationTypeClass(type: string): string {
  switch (type) {
  case 'general':
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  case 'comportamiento':
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  case 'academico':
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  case 'asistencia':
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  default:
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

function getObservationTypeText(type: string): string {
  switch (type) {
  case 'general':
    return 'General';
  case 'comportamiento':
    return 'Comportamiento';
  case 'academico':
    return 'Académico';
  case 'asistencia':
    return 'Asistencia';
  default:
    return type;
  }
}

async function loadAttendanceData() {
  if (!teacherId.value) {
    error.value = 'No se ha especificado un maestro';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // Cargar datos necesarios
    await Promise.all([
      teachersStore.fetchTeachers(),
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
    ]);

    // Aquí podrías cargar datos específicos de asistencia si es necesario
    console.log('Datos cargados correctamente');
  } catch (err) {
    console.error('Error cargando datos:', err);
    error.value = 'Error al cargar los datos. Por favor, intenta de nuevo.';
  } finally {
    loading.value = false;
  }
}

// Inicialización
onMounted(async () => {
  // Establecer rango de fechas por defecto
  setDefaultDateRange();

  // Cargar datos iniciales
  await loadAttendanceData();
});
</script>

<style scoped>
/* Transiciones suaves */
.transition-colors {
  transition: all 0.2s ease-in-out;
}

/* Hover effects */
.hover\:shadow-md:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
