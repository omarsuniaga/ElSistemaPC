<template>
  <div class="emergency-classes-section space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Clases Emergentes
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Historial y gestión de clases emergentes creadas
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <!-- Crear nueva clase emergente -->
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Nueva Clase Emergente
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Filtro por fecha -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha desde
          </label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha hasta
          </label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <!-- Filtro por instrumento -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Instrumento
          </label>
          <select
            v-model="filters.instrument"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los instrumentos</option>
            <option v-for="instrument in availableInstruments" :key="instrument" :value="instrument">
              {{ instrument }}
            </option>
          </select>
        </div>

        <!-- Acciones -->
        <div class="flex items-end space-x-2">
          <button
            @click="clearFilters"
            class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Limpiar
          </button>
          <button
            @click="refreshEmergencyClasses"
            :disabled="loading"
            class="px-3 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando clases emergentes...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredEmergencyClasses.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
      <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No hay clases emergentes
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        {{ hasFilters ? 'No se encontraron clases emergentes con los filtros aplicados' : 'Aún no has creado ninguna clase emergente' }}
      </p>
      <button
        v-if="hasFilters"
        @click="clearFilters"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/50"
      >
        Limpiar filtros
      </button>
      <button
        v-else
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md"
      >
        <PlusIcon class="h-4 w-4 mr-2" />
        Crear primera clase emergente
      </button>
    </div>

    <!-- Lista de clases emergentes -->
    <div v-else class="space-y-4">
      <div
        v-for="emergencyClass in filteredEmergencyClasses"
        :key="emergencyClass.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 border-orange-500 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Header de la clase -->
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {{ emergencyClass.className }}
                </h3>
                <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span class="flex items-center">
                    <CalendarIcon class="h-4 w-4 mr-1" />
                    {{ formatDate(emergencyClass.date) }}
                  </span>
                  <span class="flex items-center">
                    <ClockIcon class="h-4 w-4 mr-1" />
                    {{ emergencyClass.startTime }} - {{ emergencyClass.endTime }}
                  </span>
                  <span v-if="emergencyClass.instrument" class="flex items-center">
                    <MusicalNoteIcon class="h-4 w-4 mr-1" />
                    {{ emergencyClass.instrument }}
                  </span>
                </div>
              </div>
              
              <!-- Badge de tipo -->
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                <ExclamationTriangleIcon class="h-3 w-3 mr-1" />
                Emergente
              </span>
            </div>

            <!-- Motivo -->
            <div class="mb-4">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                <strong>Motivo:</strong> {{ emergencyClass.reason }}
              </p>
            </div>

            <!-- Estudiantes -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estudiantes ({{ emergencyClass.selectedStudents?.length || 0 }})
                </span>
                <button
                  @click="toggleStudentsList(emergencyClass.id)"
                  class="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                >
                  {{ expandedClasses.has(emergencyClass.id) ? 'Ocultar' : 'Ver estudiantes' }}
                </button>
              </div>
              
              <!-- Lista de estudiantes expandible -->
              <div v-if="expandedClasses.has(emergencyClass.id)" class="space-y-1">
                <div
                  v-for="studentId in emergencyClass.selectedStudents"
                  :key="studentId"
                  class="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ getStudentName(studentId) }}
                  </span>
                  <!-- Estado de asistencia si está disponible -->
                  <span v-if="getAttendanceStatus(emergencyClass.id, studentId)" 
                        class="text-xs px-2 py-1 rounded"
                        :class="getAttendanceStatusClass(getAttendanceStatus(emergencyClass.id, studentId))">
                    {{ getAttendanceStatus(emergencyClass.id, studentId) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Metadatos -->
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-4">
              <span>Creada el {{ formatDateTime(emergencyClass.createdAt) }}</span>
              <span v-if="emergencyClass.updatedAt && emergencyClass.updatedAt !== emergencyClass.createdAt">
                • Actualizada el {{ formatDateTime(emergencyClass.updatedAt) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex space-x-2">
            <button
              @click="viewAttendance(emergencyClass)"
              class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <ClipboardDocumentCheckIcon class="h-4 w-4 mr-1" />
              Ver Asistencia
            </button>
            
            <button
              @click="editEmergencyClass(emergencyClass)"
              class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <PencilIcon class="h-4 w-4 mr-1" />
              Editar
            </button>
          </div>

          <button
            @click="deleteEmergencyClass(emergencyClass)"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <TrashIcon class="h-4 w-4 mr-1" />
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para crear clase emergente -->
    <EmergencyClassModal
      v-model="showCreateModal"
      :date="selectedDate"
      @submitted="handleEmergencyClassCreated"
      @cancel="showCreateModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '../../Students/store/students'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import { useEmergencyClasses } from '../../../composables/useEmergencyClasses'
import { useToast } from '../../../components/ui/toast/use-toast'
import {
  PlusIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClockIcon,
  MusicalNoteIcon,
  ClipboardDocumentCheckIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import EmergencyClassModal from '../../Attendance/components/EmergencyClassModal.vue'

// Props and emits
interface Props {
  teacherId?: string
}

const props = defineProps<Props>()

// Stores and composables
const router = useRouter()
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()
const { toast } = useToast()
const {
  emergencyClasses,
  fetchEmergencyClasses,
  deleteEmergencyClass: deleteEmergencyClassComposable,
  isLoading,
  error
} = useEmergencyClasses()

// Inject teacherId if not passed as prop
const injectedTeacherId = inject<string>('currentTeacherId')
const currentTeacherId = computed(() => props.teacherId || injectedTeacherId || '')

// Reactive state
const loading = ref(false)
const showCreateModal = ref(false)
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'))
const expandedClasses = ref(new Set<string>())

// Filtros
const filters = ref({
  startDate: '',
  endDate: '',
  instrument: ''
})

// Computed properties
const filteredEmergencyClasses = computed(() => {
  let classes = emergencyClasses.value

  // Filtro por fecha de inicio
  if (filters.value.startDate) {
    classes = classes.filter(c => c.date >= filters.value.startDate)
  }

  // Filtro por fecha final
  if (filters.value.endDate) {
    classes = classes.filter(c => c.date <= filters.value.endDate)
  }

  // Filtro por instrumento
  if (filters.value.instrument) {
    classes = classes.filter(c => c.instrument === filters.value.instrument)
  }

  // Ordenar por fecha más reciente primero
  return classes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const availableInstruments = computed(() => {
  const instruments = [...new Set(emergencyClasses.value
    .map(c => c.instrument)
    .filter(Boolean)
  )]
  return instruments.sort()
})

const hasFilters = computed(() => {
  return filters.value.startDate || filters.value.endDate || filters.value.instrument
})

// Methods
const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return dateStr
  }
}

const formatDateTime = (date: Date | string) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, "d/MM/yyyy 'a las' HH:mm", { locale: es })
  } catch {
    return 'Fecha no disponible'
  }
}

const getStudentName = (studentId: string) => {
  const student = studentsStore.getStudentById(studentId)
  return student ? `${student.nombre} ${student.apellido}` : `Estudiante ${studentId.slice(-6)}`
}

const getAttendanceStatus = (classId: string, studentId: string) => {
  // TODO: Implementar obtención del estado de asistencia desde el store
  return null
}

const getAttendanceStatusClass = (status: string) => {
  const classes = {
    'Presente': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Ausente': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Tardanza': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Justificado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

const toggleStudentsList = (classId: string) => {
  if (expandedClasses.value.has(classId)) {
    expandedClasses.value.delete(classId)
  } else {
    expandedClasses.value.add(classId)
  }
}

const openCreateModal = () => {
  selectedDate.value = format(new Date(), 'yyyy-MM-dd')
  showCreateModal.value = true
}

const viewAttendance = (emergencyClass: any) => {
  // Navegar a la vista de asistencia para esta clase emergente
  router.push({
    name: 'attendance',
    params: {
      date: emergencyClass.date.replace(/-/g, ''),
      classId: emergencyClass.id
    }
  }).catch(err => {
    console.error('Error navigating to attendance:', err)
    toast({
      title: "Error de navegación",
      description: "No se pudo abrir la página de asistencia.",
      variant: "destructive"
    })
  })
}

const editEmergencyClass = (emergencyClass: any) => {
  // TODO: Implementar edición de clase emergente
  toast({
    title: "Función en desarrollo",
    description: "La edición de clases emergentes estará disponible pronto.",
    variant: "default"
  })
}

const deleteEmergencyClass = async (emergencyClass: any) => {
  if (!confirm(`¿Estás seguro de que quieres eliminar la clase emergente "${emergencyClass.className}"?`)) {
    return
  }

  try {
    await deleteEmergencyClassComposable(emergencyClass.id)
    toast({
      title: "Clase eliminada",
      description: "La clase emergente ha sido eliminada correctamente.",
      variant: "default"
    })
    await refreshEmergencyClasses()
  } catch (error) {
    console.error('Error deleting emergency class:', error)
    toast({
      title: "Error",
      description: "No se pudo eliminar la clase emergente.",
      variant: "destructive"
    })
  }
}

const handleEmergencyClassCreated = async (data: any) => {
  console.log('Emergency class created:', data)
  showCreateModal.value = false
  await refreshEmergencyClasses()
  
  toast({
    title: "Clase emergente creada",
    description: `La clase "${data.className}" ha sido creada correctamente.`,
    variant: "default"
  })
}

const refreshEmergencyClasses = async () => {
  if (!currentTeacherId.value) return

  try {
    loading.value = true
    await fetchEmergencyClasses(currentTeacherId.value)
  } catch (error) {
    console.error('Error refreshing emergency classes:', error)
    toast({
      title: "Error",
      description: "No se pudieron cargar las clases emergentes.",
      variant: "destructive"
    })
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    instrument: ''
  }
}

// Watch for teacherId changes
watch(currentTeacherId, async (newTeacherId) => {
  if (newTeacherId) {
    await refreshEmergencyClasses()
  }
}, { immediate: true })

// Initialize
onMounted(async () => {
  if (currentTeacherId.value) {
    await refreshEmergencyClasses()
  }
})
</script>

<style scoped>
.emergency-classes-section {
  max-width: 100%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .emergency-classes-section {
    padding: 1rem;
  }
}
</style>
