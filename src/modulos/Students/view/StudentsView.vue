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
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar alumnos..."
        class="input pl-10 w-full"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
      {{ error }}
      <button class="ml-2 text-sm underline hover:no-underline" @click="reloadStudents">
        Reintentar
      </button>
    </div>
    <!-- Grilla de alumnos -->
    <div
      v-else-if="sortedStudents.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <StudentCard
        v-for="student in sortedStudents"
        :key="student.id"
        :student="student"
        :attendance="0"
        @profile="handleViewProfile(student.id)"
        @edit="handleEdit(student.id)"
        @delete="handleDelete(student.id)"
      />
      <!-- Temporarily disabled: @open="openStudentDrawer(student)" -->
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 text-gray-600 dark:text-gray-400">
      No hay alumnos registrados
    </div>

    <!-- Student Drawer - Temporarily commented due to missing import -->
    <!-- 
    <StudentDrawer
      :show="showStudentDrawer"
      :student="selectedStudent || undefined"
      :student-analytics="selectedStudentAnalytics || undefined"
      @close="showStudentDrawer = false"
      @edit="handleEdit"
      @view-profile="handleViewProfile"
      @manage-documents="handleManageDocuments"
    />
    -->

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
      class="fixed bottom-24 right-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center z-10 transition-all duration-200 hover:scale-105"
      title="Añadir Alumno"
      @click="router.push({name: 'StudentNew'})"
    >
      <PlusCircleIcon class="w-12 h-12" />
    </button>
  </div>
</template>

<script setup lang="ts">
// External dependencies
import { PlusCircleIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';

// Components
import ConfirmModal from '../../../components/ConfirmModal.vue';
import StudentCard from '../components/StudentCardSimple.vue';

// Stores
import { useAnalyticsStore } from '../../Analytics/store/analytics';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useStudentsStore } from '../store/students';

// Definición de la interfaz de estudiante
type Instrumento = string | { nombre: string };
type Grupo = string[] | string;

interface IStudent {
  id: string;
  nombre: string;
  apellido: string;
  instrumento?: Instrumento;
  grupo?: Grupo;
  fecInscripcion?: string;
  avatar?: string;
  edad?: number | string;
  nac?: string;
  sexo?: string;
  phone?: string;
  tlf?: string;
  email?: string;
  direccion?: string;
  observaciones?: string;
  pagos?: any[];
  asistencias?: any[];
  activo?: boolean;
  nivel?: string;
  madre?: string;
  padre?: string;
  tlf_madre?: string;
  tlf_padre?: string;
  tutor?: string;
  tlf_tutor?: string;
  horario?: string;
  duracion?: string;
  [key: string]: unknown; // Para permitir propiedades dinámicas
}

const router = useRouter();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const analyticsStore = useAnalyticsStore();
const teachersStore = useTeachersStore();

const isLoading = ref(true);
const showDeleteModal = ref(false);
const studentToDelete = ref<string | null>(null);
const error = ref<string | null>(null);
const isDeleting = ref(false);
const searchQuery = ref('');
const showStudentDrawer = ref(false);
const selectedStudent = ref<IStudent | null>(null);
const activeMenu = ref<string | null>(null);
// Change initialization to get from localStorage
const sortOrder = ref<'none' | 'asc' | 'desc'>(
  (localStorage.getItem('students-sort-order') as 'none' | 'asc' | 'desc') || 'none',
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
const filteredStudents = computed(() => {
  if (!searchQuery.value) return [...studentsStore.students] as IStudent[];
  
  const search = searchQuery.value.toLowerCase();
  const filtered = (studentsStore.students as IStudent[]).filter((student: IStudent) => {
    const instrumentoNombre = typeof student.instrumento === 'string' 
      ? student.instrumento.toLowerCase()
      : (student.instrumento as { nombre?: string })?.nombre?.toLowerCase() || '';
      
    const nombre = String(student.nombre || '').toLowerCase();
    const apellido = String(student.apellido || '').toLowerCase();
    const email = String(student.email || '').toLowerCase();
    const phone = String(student.phone || '').toLowerCase();
    const tlf = String(student.tlf || '').toLowerCase();
    
    return (
      nombre.includes(search) ||
      apellido.includes(search) ||
      email.includes(search) ||
      phone.includes(search) ||
      tlf.includes(search) ||
      instrumentoNombre.includes(search)
    );
  });

  return filtered;
});

const sortedStudents = computed(() => {
  if (sortOrder.value === 'none') return filteredStudents.value;
  
  return [...filteredStudents.value].sort((a, b) => {
    const nameA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase().trim();
    const nameB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase().trim();
    
    if (sortOrder.value === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
});

/*
const handleEditFromMenu = (event: Event, id: string): void => {
  event.stopPropagation();
  router.push({ name: 'StudentEdit', params: { id } });
};

const handleDeleteFromMenu = (event: Event, id: string): void => {
  event.stopPropagation();
  studentToDelete.value = id;
  showDeleteModal.value = true;
};
*/

onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  try {
    await Promise.all([studentsStore.fetchStudents(), teachersStore.fetchTeachers()]);
    // Cargar asistencias del último año para tener datos suficientes
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1); // Cargar del último año
    // Formatear fechas a yyyy-MM-dd
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    console.log(
      `[StudentsView] Cargando asistencias desde ${formatDate(startDate)} hasta ${formatDate(endDate)}`,
    );
    await attendanceStore.fetchAttendanceDocuments(formatDate(startDate), formatDate(endDate));
    console.log(
      '[StudentsView] Documentos de asistencia cargados:',
      attendanceStore.attendanceDocuments?.length || 0,
    );
  } catch (err: any) {
    error.value = err.message || 'Error al cargar los estudiantes';
  } finally {
    isLoading.value = false;
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
// Interface para manejo de errores (usada en el manejo de errores)
interface IApiError {
  message: string;
  code?: number;
  details?: unknown;
}

// Interface para los datos de análisis del estudiante
interface IStudentAnalytics {
  performance: number;
  attendance: number;
  lastAccess: string;
  riskFactors: string[];
  recommendedActions: string[];
}

// Estado para el análisis del estudiante seleccionado
// Estado para el análisis del estudiante seleccionado
const selectedStudentAnalytics = ref<IStudentAnalytics | null>(null);

// Crear objeto que contiene datos de análisis simulados para cualquier estudiante
const getStudentAnalyticsData = (studentId: string): IStudentAnalytics => {
  // Datos predeterminados para rendimiento y asistencia
  const defaultPerformance = Math.floor(Math.random() * 30) + 70; // Valor aleatorio entre 70-100
  const defaultAttendance = Math.floor(Math.random() * 20) + 80; // Valor aleatorio entre 80-100

  return {
    performance: defaultPerformance,
    attendance: defaultAttendance,
    lastAccess: '3 días atrás',
    riskFactors: defaultPerformance < 75 ? [
      'Bajo rendimiento en evaluaciones recientes',
      'No ha completado las tareas de la última clase',
      'Asistencia irregular',
    ] : [],
    recommendedActions: defaultPerformance < 75 ? [
      'Programar sesión de refuerzo',
      'Contactar al tutor o representante',
      'Adaptar material de estudio a su ritmo de aprendizaje',
    ] : [],
  };
};

// Función para abrir el drawer de estudiante con sus datos de análisis
const openStudentDrawer = (student: IStudent): void => {
  selectedStudent.value = student;
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
  localStorage.setItem('students-sort-order', newValue);
});

// Agregar función para calcular el porcentaje de asistencia de un alumno
function getStudentAttendance(studentId: string): number {
  // Buscar asistencias del alumno en attendanceStore.attendanceDocuments
  const records =
    attendanceStore.attendanceDocuments?.flatMap((doc: any) => {
      const status = doc.data.presentes?.includes(studentId)
        ? 'P'
        : doc.data.ausentes?.includes(studentId)
          ? 'A'
          : doc.data.tarde?.includes(studentId)
            ? 'T'
            : doc.data.justificacion?.some((j: any) => j.id === studentId)
              ? 'J'
              : null;
      return status ? [{ status }] : [];
    }) || [];
  if (!records.length) return 0;
  let presentes = 0,
    total = 0;
  records.forEach((a: any) => {
    if (a.status === 'P' || a.status === 'J') presentes++;
    if (a.status) total++;
  });
  return total > 0 ? Math.round((presentes / total) * 100) : 0;
}
</script>
