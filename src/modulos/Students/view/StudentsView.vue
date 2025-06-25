<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '../store/students'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import { useAnalyticsStore } from '../../Analytics/store/analytics'
import { PlusCircleIcon, MagnifyingGlassIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
import ConfirmModal from '../../../components/ConfirmModal.vue'
import StudentDrawer from '../components/StudentDrawer.vue'
import StudentAvatar from '../components/StudentAvatar.vue'
import StudentCard from '../components/StudentCard.vue'
// import BaseCard from '../../../components/BaseCard.vue'

// Student interface definition
interface Student {
  id: string;
  nombre: string;
  apellido: string;
  instrumento?: string;
  grupo?: string[];
  fecInscripcion?: string;
  avatar?: string;
  edad?: number | string;
  nac?: string;
  sexo?: string;
  tlf?: string;
  email?: string;
  direccion?: string;
  observaciones?: string;
  pagos?: any[];
  asistencias?: any[];
  activo?: boolean;
  nivel?: string;
  // Added missing properties based on StudentDrawer component requirements
  madre?: string;
  padre?: string;
  tlf_madre?: string;
  tlf_padre?: string;
  tutor?: string;
  tlf_tutor?: string;
  horario?: string;
  duracion?: string;
}

const router = useRouter()
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()
const analyticsStore = useAnalyticsStore()

const isLoading = ref(true)
const showDeleteModal = ref(false)
const studentToDelete = ref<string | null>(null)
const error = ref<string | null>(null)
const isDeleting = ref(false)
const searchQuery = ref('')
const showStudentDrawer = ref(false)
const selectedStudent = ref<Student | null>(null)
const activeMenu = ref<string | null>(null)
// Change initialization to get from localStorage
const sortOrder = ref<'none' | 'asc' | 'desc'>(
  localStorage.getItem('students-sort-order') as 'none' | 'asc' | 'desc' || 'none'
)

// Function to toggle sorting order
const toggleSort = () => {
  if (sortOrder.value === 'none') sortOrder.value = 'asc'
  else if (sortOrder.value === 'asc') sortOrder.value = 'desc'
  else sortOrder.value = 'none'
  
  // Save to localStorage when changed
  localStorage.setItem('students-sort-order', sortOrder.value)
}

// Computed property para ordenar estudiantes por apellido y filtrar por búsqueda
const sortedStudents = computed(() => {
  let filtered = [...studentsStore.students]
  
  // Aplicar filtro de búsqueda si hay texto
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(student => 
      student.nombre.toLowerCase().includes(query) ||
      student.apellido.toLowerCase().includes(query) ||
      (student.instrumento && student.instrumento.toLowerCase().includes(query)) ||
      (student.grupo && student.grupo.some(g => g.toLowerCase().includes(query)))
    )
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
  return filtered;
})

// Función para mostrar/ocultar el menú de opciones
const toggleMenu = (event: Event, studentId: string): void => {
  event.stopPropagation() // Evitar que se abra el drawer
  activeMenu.value = activeMenu.value === studentId ? null : studentId
}

// Function to handle edit action from dropdown menu
const handleEditFromMenu = (event: Event, id: string): void => {
  event.stopPropagation()
  router.push({ name: 'StudentEdit', params: { id } })
}

// Function to handle delete action from dropdown menu
const handleDeleteFromMenu = (event: Event, id: string): void => {
  event.stopPropagation()
  studentToDelete.value = id
  showDeleteModal.value = true
}

onMounted(async () => {
  try {
    await studentsStore.fetchStudents()
    // Cargar asistencias del último mes
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - 1)
    // Formatear fechas a yyyy-MM-dd
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    await attendanceStore.fetchAttendanceDocuments(formatDate(startDate), formatDate(endDate))
  } catch (err: any) {
    error.value = err.message || 'Error al cargar los estudiantes'
  } finally {
    isLoading.value = false
  }
})

// Function to edit a student from drawer
const handleEdit = (id: string): void => {
  router.push({ name: 'StudentEdit', params: { id } })
}

// Function to view student profile from drawer
const handleViewProfile = (id: string): void => {
  router.push({ name: 'StudentProfile', params: { id } })
}

// Function to manage student documents from drawer
const handleManageDocuments = (id: string): void => {
  router.push({ name: 'StudentProfile', params: { id } })
}

// Function to delete a student
const handleDelete = (id: string): void => {
  if (!id) return
  studentToDelete.value = id
  showDeleteModal.value = true
}
// Define error interface for better type safety
interface ApiError {
  message: string;
  code?: number;
  details?: unknown;
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
    riskFactors: defaultPerformance < 75 ? [
      'Bajo rendimiento en evaluaciones recientes',
      'No ha completado las tareas de la última clase',
      'Asistencia irregular'
    ] : [],
    recommendedActions: defaultPerformance < 75 ? [
      'Programar sesión de refuerzo',
      'Contactar al tutor o representante',
      'Adaptar material de estudio a su ritmo de aprendizaje'
    ] : []
  };
};

// Interface for student analytics data
interface StudentAnalytics {
  performance: number;
  attendance: number;
  lastAccess: string;
  riskFactors: string[];
  recommendedActions: string[];
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
  if (!studentToDelete.value) return
  
  isDeleting.value = true
  try {
    await studentsStore.deleteStudent(studentToDelete.value)
    error.value = null
  } catch (err: any) {
    error.value = err.message || 'Error al eliminar al estudiante'
  } finally {
    showDeleteModal.value = false
    studentToDelete.value = null
    isDeleting.value = false
  }
}

// Función para recargar la lista de estudiantes
const reloadStudents = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    await studentsStore.fetchStudents()
  } catch (err: any) {
    console.error('❌ Error al recargar estudiantes:', err)
    error.value = err.message || 'Error al recargar la lista de estudiantes'
  } finally {
    isLoading.value = false
  }
}

// Watch for sortOrder changes to save to localStorage
watch(sortOrder, (newValue) => {
  localStorage.setItem('students-sort-order', newValue)
})

// Agregar función para calcular el porcentaje de asistencia de un alumno
function getStudentAttendance(studentId: string): number {
  // Buscar asistencias del alumno en attendanceStore.attendanceDocuments
  const records = attendanceStore.attendanceDocuments?.flatMap((doc: any) => {
    const status =
      doc.data.presentes?.includes(studentId) ? 'P' :
      doc.data.ausentes?.includes(studentId) ? 'A' :
      doc.data.tarde?.includes(studentId) ? 'T' :
      doc.data.justificacion?.some((j: any) => j.id === studentId) ? 'J' : null
    return status ? [{ status }] : []
  }) || []
  if (!records.length) return 0
  let presentes = 0, total = 0
  records.forEach((a: any) => {
    if (a.status === 'P' || a.status === 'J') presentes++
    if (a.status) total++
  })
  return total > 0 ? Math.round((presentes / total) * 100) : 0
}
</script>

<template>
  <div class="py-2">
    <div class="flex justify-between items-center mb-2">
      <h1 class="text-2xl font-bold">Alumnos</h1>
      <button
        @click="toggleSort"
        class="btn flex items-center gap-2 min-w-[140px] justify-center"
        :class="{
          'btn-outline': sortOrder === 'none',
          'btn-secondary': sortOrder !== 'none'
        }"
      >
        <span v-if="sortOrder === 'none'"> </span>
        <span v-else-if="sortOrder === 'asc'"></span>
        <span v-else></span>
        
        <svg v-if="sortOrder === 'asc'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        <svg v-else-if="sortOrder === 'desc'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
    </div>    <!-- Search Bar -->
    <div class="relative mb-2">      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Error State -->
    <div 
      v-else-if="error" 
      class="bg-destructive/10 text-destructive p-4 rounded-lg mb-4"
    >
      {{ error }}
      <button 
        @click="reloadStudents"
        class="ml-2 text-sm underline hover:no-underline"
      >
        Reintentar
      </button>
    </div>    <!-- Grilla de alumnos -->
    <div v-else-if="sortedStudents.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <StudentCard
        v-for="student in sortedStudents"
        :key="student.id"
        :student="student"
        :attendance="0"
        @open="openStudentDrawer(student)"
        @profile="handleViewProfile(student.id)"
      />
    </div>

    <!-- Empty State -->
    <div 
      v-else 
      class="text-center py-12 text-gray-600 dark:text-gray-400"
    >
      No hay alumnos registrados
    </div>

    <!-- Student Drawer -->
    <StudentDrawer
      :show="showStudentDrawer"
      :student="selectedStudent || undefined"
      :studentAnalytics="selectedStudentAnalytics || undefined"
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
      :isLoading="isDeleting"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- Floating Action Button for adding new student -->
    <button
      @click="router.push({ name: 'NewStudent' })"
      class="fixed bottom-24 right-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center z-10 transition-all duration-200 hover:scale-105"
      title="Añadir Alumno"
    >
      <PlusCircleIcon class="w-12 h-12" />
    </button>
  </div>
</template>