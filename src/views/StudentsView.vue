<template>
  <div class="py-2">
    <div class="flex justify-between items-center mb-2">
      <h1 class="text-2xl font-bold">Alumnos</h1>
      <button
        class="btn flex items-center gap-2 min-w-[140px] justify-center"
        :class="{
          'btn-outline': sortOrder === 'none',
          'btn-secondary': sortOrder !== 'none',
        }"
        @click="toggleSort"
      >
        <span v-if="sortOrder === 'none'" />
        <span v-else-if="sortOrder === 'asc'" />
        <span v-else />
        <svg
          v-if="sortOrder === 'asc'"
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        <svg
          v-else-if="sortOrder === 'desc'"
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      </button>
    </div>

    <!-- Search Bar -->
    <div class="relative mb-2">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar alumnos..."
        class="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4"
    >
      {{ error }}
      <button class="ml-2 text-sm underline hover:no-underline" @click="reloadStudents">
        Reintentar
      </button>
    </div>

    <!-- Students List (WhatsApp/Telegram Style) -->
    <div
      v-else-if="sortedStudents.length > 0"
      class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
    >
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li
          v-for="student in sortedStudents"
          :key="student.id"
          class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          @click="openStudentDrawer(student)"
        >
          <div class="px-2 py-1 flex items-start space-x-1">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <img
                :src="
                  student.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nombre}`
                "
                :alt="`${student.nombre} ${student.apellido}`"
                class="h-12 w-12 rounded-full"
              />
            </div>

            <!-- Student Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ student.nombre }} {{ student.apellido }}
                </p>
                <div class="flex items-center">
                  <!-- Three dots menu button -->
                  <div class="relative">
                    <button
                      class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      @click="toggleMenu($event, student.id)"
                    >
                      <EllipsisVerticalIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>

                    <!-- Dropdown menu -->
                    <div
                      v-if="activeMenu === student.id"
                      class="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
                    >
                      <div class="py-1">
                        <button
                          class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          @click="handleEditFromMenu($event, student.id)"
                        >
                          Editar
                        </button>
                        <button
                          class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          @click="handleDeleteFromMenu($event, student.id)"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Instrument -->
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ student.instrumento || "Sin instrumento asignado" }}
              </p>
            </div>
            <!-- No action buttons here as per new requirements -->
          </div>
        </li>
      </ul>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
      No hay alumnos registrados
    </div>

    <!-- Student Drawer -->
    <StudentDrawer
      :show="showStudentDrawer"
      :student="selectedStudent || undefined"
      :student-analytics="selectedStudentAnalytics || undefined"
      @close="showStudentDrawer = false"
      @edit="handleEdit"
      @view-profile="handleViewProfile"
      @manage-documents="handleManageDocuments"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-if="showDeleteModal"
      :show="showDeleteModal"
      title="Eliminar Alumno"
      message="¿Estás seguro que deseas eliminar este alumno? Esta acción no se puede deshacer."
      :is-loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- Floating Action Button for adding new student -->
    <button
      class="fixed bottom-24 right-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center z-10 transition-all duration-200 hover:scale-105"
      title="Añadir Alumno"
      @click="router.push({name: 'NewStudent'})"
    >
      <PlusCircleIcon class="w-12 h-12" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { useAnalyticsStore } from '../modulos/Analytics/store/analytics';
import { PlusCircleIcon, MagnifyingGlassIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline';
import ConfirmModal from '../components/ConfirmModal.vue';
import StudentDrawer from '../modulos/Students/components/StudentDrawer.vue';
// import BaseCard from '../components/BaseCard.vue'

// Student interface definition
interface Student {
  id: string
  nombre: string
  apellido: string
  instrumento?: string
  grupo?: string[]
  fecInscripcion?: string
  avatar?: string
  edad?: number | string
  nac?: string
  sexo?: string
  tlf?: string
  email?: string
  direccion?: string
  observaciones?: string
  pagos?: any[]
  asistencias?: any[]
  activo?: boolean
  nivel?: string
  // Added missing properties based on StudentDrawer component requirements
  madre?: string
  padre?: string
  tlf_madre?: string
  tlf_padre?: string
  tutor?: string
  tlf_tutor?: string
  horario?: string
  duracion?: string
}

const router = useRouter();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const analyticsStore = useAnalyticsStore();

const isLoading = ref(true);
const showDeleteModal = ref(false);
const studentToDelete = ref<string | null>(null);
const error = ref<string | null>(null);
const isDeleting = ref(false);
const searchQuery = ref('');
const showStudentDrawer = ref(false);
const selectedStudent = ref<Student | null>(null);
const activeMenu = ref<string | null>(null);
// Change initialization to get from localStorage
const sortOrder = ref<'none' | 'asc' | 'desc'>(
  (localStorage.getItem('students-sort-order') as 'none' | 'asc' | 'desc') || 'none',
);

console.log('[StudentsView] Initializing: sortOrder from localStorage:', sortOrder.value);
console.log(
  '[StudentsView] Initializing: studentsStore.students count:',
  studentsStore.students.length,
);

// Function to toggle sorting order
const toggleSort = () => {
  if (sortOrder.value === 'none') sortOrder.value = 'asc';
  else if (sortOrder.value === 'asc') sortOrder.value = 'desc';
  else sortOrder.value = 'none';

  // Save to localStorage when changed
  localStorage.setItem('students-sort-order', sortOrder.value);
};

// Computed property para ordenar estudiantes por apellido y filtrar por búsqueda
const sortedStudents = computed(() => {
  console.log(
    '[StudentsView] sortedStudents computed: studentsStore.students count:',
    studentsStore.students.length,
  );
  console.log('[StudentsView] sortedStudents computed: searchQuery:', searchQuery.value);
  console.log('[StudentsView] sortedStudents computed: sortOrder:', sortOrder.value);

  let filtered = [...studentsStore.students];

  // Aplicar filtro de búsqueda si hay texto
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((student) => {
      const instrumentoStr = student.instrumento ? String(student.instrumento).toLowerCase() : '';
      const grupos = Array.isArray(student.grupo)
        ? student.grupo.map((g) => String(g).toLowerCase())
        : [];

      return (
        student.nombre?.toLowerCase().includes(query) ||
        student.apellido?.toLowerCase().includes(query) ||
        instrumentoStr.includes(query) ||
        grupos.some((g) => g.includes(query))
      );
    });
  }

  // Apply sorting based on sortOrder
  if (sortOrder.value === 'asc') {
    return filtered.sort((a, b) => {
      const fullNameA = `${a.nombre} ${a.apellido}`.toLowerCase();
      const fullNameB = `${b.nombre} ${b.apellido}`.toLowerCase();
      return fullNameA.localeCompare(fullNameB);
    });
  } else if (sortOrder.value === 'desc') {
    return filtered.sort((a, b) => {
      const fullNameA = `${a.nombre} ${a.apellido}`.toLowerCase();
      const fullNameB = `${b.nombre} ${b.apellido}`.toLowerCase();
      return fullNameB.localeCompare(fullNameA);
    });
  }

  // If no sort order specified, return unsorted
  console.log('[StudentsView] sortedStudents computed: final filtered count:', filtered.length);
  return filtered;
});

// Función para abrir el drawer con los detalles del estudiante
// This function is defined with proper typing later in the file

// Función para mostrar/ocultar el menú de opciones
const toggleMenu = (event: Event, studentId: string): void => {
  event.stopPropagation(); // Evitar que se abra el drawer
  activeMenu.value = activeMenu.value === studentId ? null : studentId;
};

// Function to handle edit action from dropdown menu
const handleEditFromMenu = (event: Event, id: string): void => {
  event.stopPropagation();
  router.push(`/students/edit/id:${id}`);
};

// Function to handle delete action from dropdown menu
const handleDeleteFromMenu = (event: Event, id: string): void => {
  event.stopPropagation();
  studentToDelete.value = id;
  showDeleteModal.value = true;
};

onMounted(async () => {
  console.log('[StudentsView] onMounted: Start');
  isLoading.value = true; // Ensure loading is true at the start
  error.value = null; // Reset error
  try {
    console.log(
      '[StudentsView] onMounted: Before fetchStudents. Current students count:',
      studentsStore.students.length,
    );
    await studentsStore.fetchStudents();
    console.log(
      '[StudentsView] onMounted: After fetchStudents. New students count:',
      studentsStore.students.length,
    );
  } catch (err: any) {
    console.error('[StudentsView] onMounted: Error fetching students:', err);
    error.value = err.message || 'Error al cargar los estudiantes';
  } finally {
    isLoading.value = false;
    console.log('[StudentsView] onMounted: End. isLoading:', isLoading.value);
  }
});

// Function to edit a student from drawer
const handleEdit = (id: string): void => {
  router.push({ name: 'StudentEdit', params: { id } });
};

// Function to view student profile from drawer
const handleViewProfile = (id: string): void => {
  router.push({ name: 'StudentProfile', params: { id } });
};

// Function to manage student documents from drawer
const handleManageDocuments = (id: string): void => {
  router.push({ name: 'StudentProfile', params: { id } });
};

// Function to delete a student
const handleDelete = (id: string): void => {
  if (!id) return;
  studentToDelete.value = id;
  showDeleteModal.value = true;
};
// Define error interface for better type safety
interface ApiError {
  message: string
  code?: number
  details?: unknown
}

// Crear objeto que contiene datos de análisis simulados para cualquier estudiante
const getStudentAnalyticsData = (studentId: string) => {
  // Datos predeterminados para rendimiento y asistencia
  const defaultPerformance = Math.floor(Math.random() * 30) + 70; // Valor aleatorio entre 70-100
  const defaultAttendance = Math.floor(Math.random() * 20) + 80; // Valor aleatorio entre 80-100

  return {
    performance: defaultPerformance,
    attendance: defaultAttendance,
    lastAccess: '3 días atrás',
    riskFactors:
      defaultPerformance < 75
        ? [
          'Bajo rendimiento en evaluaciones recientes',
          'No ha completado las tareas de la última clase',
          'Asistencia irregular',
        ]
        : [],
    recommendedActions:
      defaultPerformance < 75
        ? [
          'Programar sesión de refuerzo',
          'Contactar al tutor o representante',
          'Adaptar material de estudio a su ritmo de aprendizaje',
        ]
        : [],
  };
};

// Interface for student analytics data
interface StudentAnalytics {
  performance: number
  attendance: number
  lastAccess: string
  riskFactors: string[]
  recommendedActions: string[]
}

// Define el objeto de análisis del estudiante seleccionado
const selectedStudentAnalytics = ref<StudentAnalytics | null>(null);

// Modificar la función openStudentDrawer para incluir datos de análisis
const openStudentDrawer = (student: Student): void => {
  selectedStudent.value = student;
  // Generar datos de análisis para este estudiante
  selectedStudentAnalytics.value = getStudentAnalyticsData(student.id);
  showStudentDrawer.value = true;
};

const confirmDelete = async () => {
  if (!studentToDelete.value) return;

  isDeleting.value = true;
  try {
    await studentsStore.deleteStudent(studentToDelete.value);
    error.value = null;
  } catch (err: any) {
    error.value = err.message || 'Error al eliminar al estudiante';
  } finally {
    showDeleteModal.value = false;
    studentToDelete.value = null;
    isDeleting.value = false;
  }
};

// Función para recargar la lista de estudiantes
const reloadStudents = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await studentsStore.fetchStudents();
  } catch (err: any) {
    console.error('❌ Error al recargar estudiantes:', err);
    error.value = err.message || 'Error al recargar la lista de estudiantes';
  } finally {
    isLoading.value = false;
  }
};

// Watch for sortOrder changes to save to localStorage
watch(sortOrder, (newValue) => {
  console.log('[StudentsView] watch: sortOrder changed to:', newValue);
  localStorage.setItem('students-sort-order', newValue);
});

watch(
  () => studentsStore.students,
  (newStudents) => {
    console.log(
      '[StudentsView] watch: studentsStore.students changed. New count:',
      newStudents.length,
    );
  },
  { deep: true },
);

watch(searchQuery, (newQuery) => {
  console.log('[StudentsView] watch: searchQuery changed to:', newQuery);
});
</script>
