<template>
  <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
    <div class="p-4 border-b bg-gray-50">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Detalle de Asistencia por Estudiante</h3>
        <div class="flex items-center space-x-2">
          <!-- Filtros -->
          <div class="flex items-center space-x-2">
            <select v-model="selectedClass" class="text-sm border rounded px-2 py-1">
              <option value="">Todas las clases</option>
              <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                {{ cls.name }}
              </option>
            </select>

            <select v-model="statusFilter" class="text-sm border rounded px-2 py-1">
              <option value="">Todos los estados</option>
              <option value="present">Presentes</option>
              <option value="absent">Ausentes</option>
              <option value="late">Tardanzas</option>
              <option value="justified">Justificados</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Estudiante
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Clase
            </th>
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Asistencias
            </th>
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Ausencias
            </th>
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Tardanzas
            </th>
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              % Asistencia
            </th>
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Última Fecha
            </th>
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="student in filteredStudents"
            :key="`${student.classId}-${student.id}`"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span class="text-sm font-medium text-blue-600">
                      {{ getInitials(student.firstName, student.lastName) }}
                    </span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ student.firstName }} {{ student.lastName }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ student.email || "Sin email" }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ student.className }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {{ student.stats.present }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
              >
                {{ student.stats.absent }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                {{ student.stats.late }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <div class="flex items-center justify-center">
                <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    class="h-2 rounded-full"
                    :class="getAttendanceColor(student.stats.attendanceRate)"
                    :style="{width: `${student.stats.attendanceRate}%`}"
                  />
                </div>
                <span class="text-sm font-medium">{{ student.stats.attendanceRate }}%</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
              {{ formatDate(student.stats.lastAttendanceDate) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button
                class="text-blue-600 hover:text-blue-900 mr-2"
                @click="viewStudentDetail(student)"
              >
                Ver detalle
              </button>
              <button
                class="text-green-600 hover:text-green-900"
                @click="exportStudentData(student)"
              >
                Exportar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div
      v-if="totalPages > 1"
      class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
    >
      <div class="flex-1 flex justify-between sm:hidden">
        <button
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          @click="previousPage"
        >
          Anterior
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          @click="nextPage"
        >
          Siguiente
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Mostrando
            <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
            a
            <span class="font-medium">{{ Math.min(currentPage * pageSize, totalStudents) }}</span>
            de
            <span class="font-medium">{{ totalStudents }}</span>
            estudiantes
          </p>
        </div>
        <div>
          <nav
            class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              @click="previousPage"
            >
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="[
                'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                page === currentPage
                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
              ]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <button
              :disabled="currentPage === totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              @click="nextPage"
            >
              <ChevronRightIcon class="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de detalle del estudiante -->
  <div v-if="selectedStudent" class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75" @click="closeStudentDetail" />
      </div>

      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Detalle de {{ selectedStudent.firstName }} {{ selectedStudent.lastName }}
          </h3>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Asistencias</label>
                <div class="text-2xl font-bold text-green-600">
                  {{ selectedStudent.stats.present }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Ausencias</label>
                <div class="text-2xl font-bold text-red-600">
                  {{ selectedStudent.stats.absent }}
                </div>
              </div>
            </div>

            <div class="border-t pt-4">
              <h4 class="font-medium text-gray-900 mb-2">Historial reciente</h4>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                <div
                  v-for="record in selectedStudent.recentAttendance"
                  :key="record.date"
                  class="flex justify-between text-sm"
                >
                  <span>{{ formatDate(record.date) }}</span>
                  <span :class="getStatusColor(record.status)">{{
                    getStatusText(record.status)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            @click="exportStudentData(selectedStudent)"
          >
            Exportar datos
          </button>
          <button
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            @click="closeStudentDetail"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const props = defineProps({
  attendanceData: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['export-student']);

// Estado reactivo
const selectedClass = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const selectedStudent = ref(null);

// Clases disponibles
const availableClasses = computed(() => {
  return props.attendanceData.map((cls) => ({
    id: cls.classId,
    name: cls.className || 'Clase sin nombre',
  }));
});

// Procesar datos de estudiantes
const processedStudents = computed(() => {
  const students = [];

  props.attendanceData.forEach((classData) => {
    classData.students?.forEach((student) => {
      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        justified: 0,
        total: 0,
        lastAttendanceDate: null,
      };

      const recentAttendance = [];

      student.attendance?.forEach((record) => {
        stats.total++;
        stats[record.status] = (stats[record.status] || 0) + 1;

        if (
          !stats.lastAttendanceDate ||
          new Date(record.date) > new Date(stats.lastAttendanceDate)
        ) {
          stats.lastAttendanceDate = record.date;
        }

        recentAttendance.push(record);
      });

      stats.attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

      // Ordenar por fecha más reciente
      recentAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));

      students.push({
        ...student,
        classId: classData.classId,
        className: classData.className || 'Clase sin nombre',
        stats,
        recentAttendance: recentAttendance.slice(0, 10), // Últimos 10 registros
      });
    });
  });

  return students;
});

// Estudiantes filtrados
const filteredStudents = computed(() => {
  let filtered = processedStudents.value;

  if (selectedClass.value) {
    filtered = filtered.filter((s) => s.classId === selectedClass.value);
  }

  if (statusFilter.value) {
    filtered = filtered.filter((s) => {
      const lastRecord = s.recentAttendance[0];
      return lastRecord?.status === statusFilter.value;
    });
  }

  return filtered;
});

// Paginación
const totalStudents = computed(() => filteredStudents.value.length);
const totalPages = computed(() => Math.ceil(totalStudents.value / pageSize.value));

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredStudents.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// Métodos de paginación
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const goToPage = (page) => {
  currentPage.value = page;
};

// Métodos auxiliares
const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

const getAttendanceColor = (rate) => {
  if (rate >= 90) return 'bg-green-500';
  if (rate >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getStatusColor = (status) => {
  const colors = {
    present: 'text-green-600',
    absent: 'text-red-600',
    late: 'text-yellow-600',
    justified: 'text-blue-600',
  };
  return colors[status] || 'text-gray-600';
};

const getStatusText = (status) => {
  const texts = {
    present: 'Presente',
    absent: 'Ausente',
    late: 'Tardanza',
    justified: 'Justificado',
  };
  return texts[status] || status;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
};

// Acciones
const viewStudentDetail = (student) => {
  selectedStudent.value = student;
};

const closeStudentDetail = () => {
  selectedStudent.value = null;
};

const exportStudentData = (student) => {
  emit('export-student', student);
};
</script>
