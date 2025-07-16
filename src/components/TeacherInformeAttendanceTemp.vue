<template>
  <div
    class="p-4 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow"
  >
    <!-- Vista de selección de maestros -->
    <div v-if="!selectedTeacherId">
      <h2 class="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">
        Informe de Asistencia
      </h2>

      <!-- Filtros de maestros -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar maestro
            </label>
            <div class="relative">
              <MagnifyingGlassIcon
                class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por nombre o especialidad..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="sm:w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Indicador de carga -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <svg
          class="animate-spin h-10 w-10 text-primary-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span class="ml-3">Cargando maestros...</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Grid de maestros -->
      <div v-else>
        <div v-if="filteredTeachers.length === 0" class="text-center py-12">
          <UserGroupIcon class="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p class="text-lg text-gray-500 dark:text-gray-400 mb-2">
            {{
              searchQuery || statusFilter
                ? "No se encontraron maestros con los filtros aplicados"
                : "No hay maestros disponibles"
            }}
          </p>
          <button
            v-if="searchQuery || statusFilter"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            @click="clearFilters"
          >
            Limpiar filtros
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="teacher in filteredTeachers"
            :key="teacher.id"
            class="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6 cursor-pointer hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 group"
            @click="selectTeacher(teacher)"
          >
            <!-- Avatar y nombre -->
            <div class="flex items-center mb-4">
              <div
                class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden mr-4"
              >
                <img
                  v-if="teacher.photoURL"
                  :src="teacher.photoURL"
                  :alt="teacher.name"
                  class="w-full h-full object-cover"
                />
                <UserIcon v-else class="h-8 w-8 text-white" />
              </div>
              <div class="flex-1">
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                >
                  {{ teacher.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ teacher.email }}</p>
              </div>
            </div>

            <!-- Especialidades -->
            <div class="mb-4">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="specialty in teacher.specialties?.slice(0, 3)"
                  :key="specialty"
                  class="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
                >
                  {{ specialty }}
                </span>
                <span
                  v-if="teacher.specialties && teacher.specialties.length > 3"
                  class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-full"
                >
                  +{{ teacher.specialties.length - 3 }} más
                </span>
              </div>
            </div>

            <!-- Estado -->
            <div class="flex items-center justify-between">
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full font-medium',
                  teacher.status === 'activo'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                ]"
              >
                {{ teacher.status === "activo" ? "Activo" : "Inactivo" }}
              </span>

              <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <AcademicCapIcon class="h-4 w-4 mr-1" />
                <span>{{ teacherClassesCount[teacher.id] || 0 }} clases</span>
              </div>
            </div>

            <!-- Botón de acción -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ver Informe de Asistencia
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista del informe detallado (diseño original) -->
    <div v-else>
      <!-- Botón de regreso -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          <button
            class="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="goBackToTeachers"
          >
            <ArrowLeftIcon class="h-5 w-5" />
          </button>
          <h2 class="text-xl font-bold text-primary-600 dark:text-primary-400">
            Informe de Asistencia - {{ selectedTeacherName }}
          </h2>
        </div>
      </div>

      <!-- Admin/Director indicator when viewing other teacher's data -->
      <div
        v-if="isViewingOtherTeacher"
        class="bg-blue-50 border-l-4 border-blue-500 p-4 dark:bg-blue-900/20 dark:border-blue-600 mb-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <InformationCircleIcon class="h-5 w-5 text-blue-500" aria-hidden="true" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              Estás viendo el informe de asistencia de <strong>{{ teacherName }}</strong>
            </p>
          </div>
        </div>
      </div>

      <!-- Controles de fecha -->
      <AttendanceFilters
        v-model:from="from"
        v-model:to="to"
        @set-range="setRange"
        @sync-data="syncAttendanceData"
        @generate-report="fetchReport"
      />

      <!-- Barra de exportación -->
      <AttendanceExportBar
        :loading="exportLoading"
        @download-pdf="handleDownloadPDF"
        @export-csv="handleExportCSV"
        @export-xls="handleExportXLS"
        @debug-store="debugAttendanceStore"
      />

      <!-- Debug Controls (solo en desarrollo) -->
      <div v-if="isDevelopment" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 class="text-sm font-medium text-yellow-800 mb-3">🔧 Controles de Debug</h3>
        <div class="flex gap-2 flex-wrap">
          <button
            class="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded"
            @click="debugFullState"
          >
            Debug Estado Completo
          </button>
          <button
            class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
            @click="debugAllStores"
          >
            Debug Todos los Stores
          </button>
          <button
            class="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
            @click="debugAttendanceStore"
          >
            Debug Asistencia
          </button>
          <button
            class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
            @click="fetchReport"
          >
            Recargar Datos
          </button>
        </div>
        <div class="mt-2 text-xs text-yellow-700">
          <div>📅 Fechas: {{ from }} - {{ to }}</div>
          <div>👤 Profesor ID: {{ currentTeacherId }}</div>
          <div>📊 Clases en reporte: {{ classReports.length }}</div>
          <div>⏳ Cargando: {{ loading }}</div>
          <div v-if="error">❌ Error: {{ error }}</div>
        </div>
      </div>

      <!-- Indicador de carga -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <svg
          class="animate-spin h-10 w-10 text-primary-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span class="ml-3">Generando informe...</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Contenido del informe -->
      <div v-else>
        <!-- Estadísticas generales -->
        <AttendanceStats
          :total-presentes="totalPresentes"
          :total-ausentes="totalAusentes"
          :total-tardes="totalTardes"
          :total-justificados="totalJustificados"
          :average-attendance-percentage="averageAttendancePercentage"
          :best-attendance-day="bestAttendanceDay"
        />

        <!-- Gráficas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Asistencia por Fecha
            </h3>
            <div class="h-64">
              <canvas ref="chartDates" />
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Asistencia por Día de la Semana
            </h3>
            <div class="h-64">
              <canvas ref="chartWeekday" />
            </div>
          </div>
        </div>

        <!-- Controles de vista -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-2">
            <button
              :class="
                viewMode === 'cards'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              "
              class="px-3 py-1 text-sm rounded"
              @click="viewMode = 'cards'"
            >
              Vista Tarjetas
            </button>
            <button
              :class="
                viewMode === 'table'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              "
              class="px-3 py-1 text-sm rounded"
              @click="viewMode = 'table'"
            >
              Vista Tabla
            </button>
          </div>

          <div class="flex gap-2">
            <button
              class="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
              @click="expandAllClasses"
            >
              Expandir Todo
            </button>
            <button
              class="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
              @click="collapseAllClasses"
            >
              Colapsar Todo
            </button>
          </div>
        </div>

        <!-- Contenido del informe -->
        <div
          id="printable-report"
          class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div class="space-y-6">
            <!-- Informes por clase -->
            <div
              v-for="(classData, index) in classReports"
              :key="index"
              class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <!-- Header de la clase -->
              <div
                class="class-header p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                @click="toggleClassExpansion(classData.classId)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <component
                      :is="
                        expandedClasses.has(classData.classId) ? ChevronDownIcon : ChevronRightIcon
                      "
                      class="h-5 w-5 text-gray-500 mr-2"
                    />
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {{ classData.className }}
                    </h3>
                    <span
                      class="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded"
                    >
                      {{ classData.students.length }} estudiantes
                    </span>
                  </div>
                  <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span>{{ calculateAttendancePercentage(classData) }}% asistencia</span>
                  </div>
                </div>
              </div>

              <!-- Contenido expandible -->
              <div v-if="expandedClasses.has(classData.classId)" class="p-4 space-y-4">
                <!-- Vista de tarjetas -->
                <div v-if="viewMode === 'cards'" class="space-y-4">
                  <div
                    v-for="student in classData.students"
                    :key="student.id"
                    class="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="font-medium text-gray-800 dark:text-gray-200">
                        {{ student.name }}
                      </h4>
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        {{
                          calculateStudentAttendancePercentage(student, classData.relevantDates)
                        }}% asistencia
                      </span>
                    </div>

                    <div class="grid grid-cols-7 gap-2">
                      <div v-for="date in classData.relevantDates" :key="date" class="text-center">
                        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {{ getDayName(date) }}
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-300 mb-1">
                          {{ formatDateShort(date) }}
                        </div>
                        <span
                          :class="getStatusClass(student.attendance[date])"
                          class="inline-block px-2 py-1 rounded text-xs font-medium"
                        >
                          {{ getStatusSymbol(student.attendance[date]) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Vista de tabla -->
                <div v-else class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Estudiante
                        </th>
                        <th
                          v-for="date in classData.relevantDates"
                          :key="date"
                          class="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          <div>{{ getDayName(date) }}</div>
                          <div>{{ formatDateShort(date) }}</div>
                        </th>
                        <th
                          class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          % Asistencia
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600"
                    >
                      <tr
                        v-for="student in classData.students"
                        :key="student.id"
                        class="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td
                          class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100"
                        >
                          {{ student.name }}
                        </td>
                        <td
                          v-for="date in classData.relevantDates"
                          :key="date"
                          class="px-2 py-3 whitespace-nowrap text-center"
                        >
                          <span
                            :class="getStatusClass(student.attendance[date])"
                            class="inline-block px-2 py-1 rounded text-xs font-medium"
                          >
                            {{ getStatusSymbol(student.attendance[date]) }}
                          </span>
                        </td>
                        <td
                          class="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100"
                        >
                          {{
                            calculateStudentAttendancePercentage(student, classData.relevantDates)
                          }}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Observaciones de la clase -->
                <div
                  v-if="classData.observations && classData.observations.length > 0"
                  class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <h5 class="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    Observaciones de la Clase
                  </h5>
                  <div class="space-y-2">
                    <div
                      v-for="obs in classData.observations"
                      :key="obs.date"
                      class="text-sm text-yellow-700 dark:text-yellow-200"
                    >
                      <span class="font-medium">{{ formatDate(obs.date) }}:</span> {{ obs.text }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mensaje cuando no hay clases -->
            <div
              v-if="classReports.length === 0"
              class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <UserGroupIcon class="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p class="text-lg text-gray-500 dark:text-gray-400 mb-2">
                No hay datos para mostrar en el rango seleccionado
              </p>
              <p class="text-sm text-gray-400 dark:text-gray-500">
                Intente seleccionar otro rango de fechas o verifique si hay asistencias registradas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
} from '@heroicons/vue/24/outline';

// Componentes modulares
import AttendanceFilters from './reports/attendance/components/AttendanceFilters.vue';
import AttendanceExportBar from './reports/attendance/components/AttendanceExportBar.vue';
import AttendanceStats from './reports/attendance/components/AttendanceStats.vue';

// Composable principal
import { useAttendanceReport } from './reports/attendance/composables/useAttendanceReport';

// Utilidades
import {
  calculateAttendancePercentage,
  calculateStudentAttendancePercentage,
} from './reports/attendance/utils/attendanceCalculations';
import {
  formatDate,
  formatDateShort,
  getStatusSymbol,
  getStatusClass,
  getDayName,
} from './reports/attendance/utils/attendanceFormatters';

// Stores
import { useTeachersStore } from '@/modulos/Teachers/store/teachers';
import { useClassesStore } from '@/modulos/Classes/store/classes';

// Types
interface Teacher {
  id: string
  name: string
  email: string
  photoURL?: string
  specialties?: string[]
  status: string
}

interface ClassItem {
  id: string
  teacherId?: string
}

// Stores
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();

// Estado para selección de maestros
const searchQuery = ref('');
const statusFilter = ref('');
const selectedTeacherId = ref<string | null>(null);

// Computed para maestros
const filteredTeachers = computed(() => {
  let teachers = teachersStore.teachers;

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    teachers = teachers.filter(
      (teacher: Teacher) =>
        teacher.name?.toLowerCase().includes(query) ||
        teacher.email?.toLowerCase().includes(query) ||
        teacher.specialties?.some((specialty: string) => specialty.toLowerCase().includes(query)),
    );
  }

  // Filtrar por estado
  if (statusFilter.value) {
    teachers = teachers.filter((teacher: Teacher) => teacher.status === statusFilter.value);
  }

  return teachers;
});

const selectedTeacherName = computed(() => {
  if (!selectedTeacherId.value) return '';
  const teacher = teachersStore.teachers.find((t: Teacher) => t.id === selectedTeacherId.value);
  return teacher?.name || 'Maestro';
});

const teacherClassesCount = computed(() => {
  const counts: Record<string, number> = {};
  classesStore.classes.forEach((classItem: ClassItem) => {
    if (classItem.teacherId) {
      counts[classItem.teacherId] = (counts[classItem.teacherId] || 0) + 1;
    }
  });
  return counts;
});

// Métodos para selección de maestros
const selectTeacher = (teacher: Teacher) => {
  selectedTeacherId.value = teacher.id;
};

const goBackToTeachers = () => {
  selectedTeacherId.value = null;
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
};

// Props
const props = defineProps({
  teacherId: {
    type: String,
    default: '',
  },
});

// Usar el composable principal solo cuando hay un maestro seleccionado
const {
  // Estado
  loading,
  error,
  expandedClasses,
  viewMode,

  // Datos
  classReports,
  currentTeacherId,
  isViewingOtherTeacher,
  teacherName,

  // Filtros
  from,
  to,
  setRange,

  // Estadísticas
  totalPresentes,
  totalAusentes,
  totalTardes,
  totalJustificados,
  averageAttendancePercentage,
  bestAttendanceDay,

  // Gráficas
  chartDates,
  chartWeekday,

  // Métodos
  fetchReport,
  syncAttendanceData,
  toggleClassExpansion,
  expandAllClasses,
  collapseAllClasses,
  debugAttendanceStore,

  // Exportación
  exportLoading,
  handleDownloadPDF,
  handleExportCSV,
  handleExportXLS,

  // Debug
  debugFullState,
  debugStores,
  debugAllStores,
} = useAttendanceReport({ teacherId: selectedTeacherId.value || props.teacherId });

// Variable para modo desarrollo
const isDevelopment = computed(() => {
  try {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  } catch {
    return false;
  }
});

// Inicialización
onMounted(async () => {
  try {
    // Cargar maestros y clases
    await Promise.all([teachersStore.fetchTeachers(), classesStore.fetchClasses()]);

    // Si no hay maestro seleccionado y hay un teacherId en props, usarlo
    if (!selectedTeacherId.value && props.teacherId) {
      selectedTeacherId.value = props.teacherId;
    }

    // Si hay un maestro seleccionado, cargar el informe
    if (selectedTeacherId.value) {
      await fetchReport();
    }

    console.log('✅ Componente inicializado correctamente');
  } catch (err) {
    console.error('❌ Error al inicializar componente:', err);
  }
});
</script>

<style scoped>
/* Transiciones suaves para el acordeón */
.accordion-content {
  transition: all 0.3s ease-in-out;
}

/* Hover effects mejorados */
.class-header:hover {
  transform: translateY(-1px);
  transition: transform 0.2s ease-in-out;
}

/* Estilos para los badges de estado */
.status-badge {
  transition: all 0.2s ease-in-out;
}

.status-badge:hover {
  transform: scale(1.1);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-container {
    font-size: 0.875rem;
  }
}
</style>
