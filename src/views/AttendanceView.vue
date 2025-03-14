<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { AttendanceStatus, Student } from '../types'

// Componentes importados
import AttendanceHeader from '../components/AttendanceHeader.vue'
import AttendanceFilters from '../components/AttendanceFilters.vue'
import AttendanceList from '../components/AttendanceList.vue'
import AttendanceReportModal from '../components/AttendanceReportModal.vue'
import AttendanceObservation from '../components/AttendanceObservation.vue'
import AttendanceAnalytics from '../components/AttendanceAnalytics.vue'
import AttendanceTrends from '../components/AttendanceTrends.vue'
import Calendar from '../components/Calendar.vue'
import DateClassSelector from '../components/DateClassSelector.vue'
import JustifiedAbsenceModal from '../components/JustifiedAbsenceModal.vue'
import AttendanceExportModal from '../components/AttendanceExportModal.vue'

// Stores
import { useAttendanceStore } from '../stores/attendance'
import { useStudentsStore } from '../stores/students'
import { useClassesStore } from '../stores/classes'
import { useInstrumentoStore } from '../stores/instrumento'
import { getCurrentDate } from '../utils/dateUtils'

// Interfaces
interface TeacherData {
  id: string;
  uid?: string;
  name: string;
  edad?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  clases?: string[];
  schedule?: string[];
  statistics?: string[];
  avatar?: string;
  photoURL?: string;
  address?: string;
  experiencia?: string;
  biography?: string;
  status?: 'activo' | 'inactivo' | 'pendiente';
  createdAt?: any;
  updatedAt?: any;
}

interface SelectedStudent {
  id: string;
  nombre: string;
  apellido: string;
}

interface AttendanceFilters {
  instrument: string;
  level: string;
  teacherId: string;
}

const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const instrumentoStore = useInstrumentoStore()

// Estados globales y de vista
const view = ref<'calendar' | 'class-select' | 'attendance-form'>('calendar')
const selectedDate = ref(getCurrentDate())
const selectedClass = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const loadingMessage = ref<string>('')

// Modales y estados UI
const showAnalytics = ref(false)
const showTrends = ref(false)
const showReportModal = ref(false)
const showExportModal = ref(false)
const showObservationsModal = ref(false)
const selectedStudentForObs = ref<SelectedStudent | null>(null)
const showJustifiedAbsenceModal = ref(false)
const selectedStudentForJustification = ref<SelectedStudent | null>(null)

// Computed property para obtener profesores
const teachers = computed<TeacherData[]>(() => {
  return studentsStore.students
    .filter(student => !!student.isTeacher) // Use optional field
    .map(teacher => ({
      id: teacher.id,
      name: `${teacher.nombre} ${teacher.apellido}`
    }))
})

// Filtros para informes
const reportFilters = ref<AttendanceFilters>({
  instrument: '',
  level: '',
  teacherId: ''
})

// Funciones principales
const selectDate = (date: string) => {
  selectedDate.value = date
  attendanceStore.selectedDate = date
  view.value = 'class-select'
}

async function fetchInitialData() {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos iniciales...'
    
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      instrumentoStore.fetchInstrumentos()
    ])
    
    // Establecer estado inicial
    isLoading.value = false
    error.value = null
  } catch (err) {
    error.value = 'Error al cargar los datos iniciales'
    console.error('Error loading initial data:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const selectClass = async (className: string) => {
  if (!className) {
    error.value = "Por favor selecciona una clase"
    return
  }
  
  try {
    selectedClass.value = className
    attendanceStore.selectedClass = className
    
    isLoading.value = true
    loadingMessage.value = 'Cargando datos de asistencia...'
    
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAttendance()
    ])

    // Inicializar todos los estudiantes con estado 'Ausente' por defecto
    const studentsInClass = studentsStore.getStudentsByClass(className)
    studentsInClass.forEach(student => {
      if (!attendanceStore.attendanceRecords[student.id]) {
        attendanceStore.attendanceRecords[student.id] = 'Ausente'
      }
    })

    // Actualizar analytics después de cargar los datos
    await attendanceStore.updateAnalytics()
    
    // Cambiar a la vista de formulario de asistencia
    view.value = 'attendance-form'
  } catch (err) {
    error.value = 'Error al cargar los datos iniciales'
    console.error('Error loading initial data:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

onMounted(fetchInitialData)
watch(reportFilters, () => {
  // Reiniciar paginación o actualizar vista de reporte
}, { deep: true })

// Mantener un registro local de cambios de asistencia
const pendingAttendanceChanges = ref<{studentId: string, status: AttendanceStatus}[]>([])

// Event handlers
const handleUpdateStatus = (studentId: string, status: AttendanceStatus | 'save') => {
  // Si el status es 'save', guardar todos los cambios pendientes
  if (status === 'save') {
    saveAllAttendanceChanges()
    return
  }
  
  // Actualizar el estado local sin mostrar mensaje de carga
  attendanceStore.attendanceRecords[studentId] = status
  
  // Registrar el cambio para guardarlo más tarde
  const existingIndex = pendingAttendanceChanges.value.findIndex(change => change.studentId === studentId)
  if (existingIndex >= 0) {
    pendingAttendanceChanges.value[existingIndex].status = status as AttendanceStatus
  } else {
    pendingAttendanceChanges.value.push({
      studentId,
      status: status as AttendanceStatus
    })
  }
}

// Función para guardar todos los cambios pendientes
const saveAllAttendanceChanges = async () => {
  if (pendingAttendanceChanges.value.length === 0) return
  
  try {
    isLoading.value = true
    loadingMessage.value = 'Guardando asistencia...'
    
    // Guardar cada cambio pendiente
    for (const change of pendingAttendanceChanges.value) {
      await attendanceStore.updateAttendance({
        studentId: change.studentId,
        classId: selectedClass.value,
        Fecha: selectedDate.value,
        status: change.status
      })
    }
    
    // Limpiar los cambios pendientes
    pendingAttendanceChanges.value = []
    
    // Actualizar analytics después de guardar todos los cambios
    await attendanceStore.updateAnalytics()
  } catch (err) {
    error.value = 'Error al guardar la asistencia'
    console.error('Error saving attendance:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const handleObservationAdded = async () => {
  try {
    // Recargar datos después de agregar la observación
    await attendanceStore.fetchAttendance()
    showObservationsModal.value = false
  } catch (err) {
    error.value = 'Error al actualizar las observaciones'
    console.error('Error updating observations:', err)
  }
}

const handleJustificationSave = async (data: { reason: string, documentUrl?: string, file?: File }) => {
  try {
    if (!selectedStudentForJustification.value) return
    
    isLoading.value = true
    loadingMessage.value = 'Guardando justificación...'
    
    // Use the new method that properly handles file uploads and justifications
    await attendanceStore.updateAttendanceWithJustification(
      selectedStudentForJustification.value.id,
      selectedDate.value,
      selectedClass.value,
      data.reason,
      data.file || null
    )
    
    showJustifiedAbsenceModal.value = false
    await attendanceStore.updateAnalytics()
  } catch (err) {
    error.value = 'Error al guardar la justificación'
    console.error('Error saving justification:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const handleGenerateReport = async (filters: typeof reportFilters.value) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Generando informe...'
    
    // Actualizar filtros locales
    reportFilters.value = { ...filters }
    
    // Cerrar modal de reporte
    showReportModal.value = false
    
    // Mostrar panel de analytics con los nuevos filtros
    showAnalytics.value = true
    
    // Actualizar analytics con los nuevos filtros
    await attendanceStore.updateAnalytics()
  } catch (err) {
    error.value = 'Error al generar el informe'
    console.error('Error generating report:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const toggleAnalytics = () => {
  showAnalytics.value = !showAnalytics.value
  if (showAnalytics.value) {
    showTrends.value = false
  }
}

const toggleTrends = () => {
  showTrends.value = !showTrends.value
  if (showTrends.value) {
    showAnalytics.value = false
  }
}

const openReportModal = () => {
  showReportModal.value = true
}

const openExportModal = () => {
  showExportModal.value = true
}

const createNewAttendance = () => {
  selectedDate.value = getCurrentDate()
  view.value = 'class-select'
}
</script>

<template>
  <div class="p-2 sm:p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Header -->
    <AttendanceHeader 
      :selectedDate="selectedDate" 
      :selectedClass="selectedClass"
      :view="view"
      :showAnalytics="showAnalytics"
      @change-view="view = $event"
      @toggle-analytics="toggleAnalytics" 
      @open-report-modal="openReportModal" 
      @open-export-modal="openExportModal"
      @create-new-attendance="createNewAttendance"
      class="mb-4"
    />

    <!-- Botones adicionales -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button 
        @click="toggleAnalytics" 
        class="btn" 
        :class="showAnalytics ? 'btn-primary' : 'btn-secondary'"
      >
        <i class="fas fa-chart-pie mr-2"></i>
        Análisis
      </button>
      
      <button 
        @click="toggleTrends" 
        class="btn" 
        :class="showTrends ? 'btn-primary' : 'btn-secondary'"
      >
        <i class="fas fa-chart-line mr-2"></i>
        Tendencias Temporales
      </button>
      
      <button @click="openReportModal" class="btn btn-secondary">
        <i class="fas fa-file-alt mr-2"></i>
        Generar Informe
      </button>
      
      <button @click="openExportModal" class="btn btn-secondary">
        <i class="fas fa-file-export mr-2"></i>
        Exportar
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-8 sm:py-12">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
      <span v-if="loadingMessage" class="ml-3 text-sm sm:text-base">{{ loadingMessage }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 sm:p-4 rounded-lg mb-4 text-sm sm:text-base">
      {{ error }}
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-4 sm:space-y-6">
      <!-- Panel de Analytics -->
      <AttendanceAnalytics v-if="showAnalytics" class="mb-4" />
      
      <!-- Panel de Tendencias -->
      <AttendanceTrends v-if="showTrends" class="mb-4" />

      <!-- Vista principal según el estado -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
        <!-- Vista de Calendario -->
        <div v-if="view === 'calendar'" class="max-w-3xl mx-auto">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Seleccionar Fecha</h2>
          <Calendar 
            :selected-date="selectedDate" 
            :marked-dates="attendanceStore.getDatesWithRecords" 
            @select="selectDate"
          />
        </div>

        <!-- Vista de Selección de Clase -->
        <div v-else-if="view === 'class-select'" class="max-w-3xl mx-auto">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Seleccionar Clase</h2>
          <DateClassSelector 
            v-model="selectedClass" 
            v-model:selectedDate="selectedDate" 
            :dayFilter="true"
            @continue="() => selectClass(selectedClass)"
          />
        </div>

        <!-- Vista de Lista de Asistencia -->
        <div v-else-if="view === 'attendance-form'" class="space-y-4 sm:space-y-6">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Lista de Asistencia</h2>
          <AttendanceList 
            :students="studentsStore.getStudentsByClass(selectedClass)" 
            :attendanceRecords="attendanceStore.attendanceRecords"
            @update-status="handleUpdateStatus"
            @open-justification="student => {
              selectedStudentForJustification = student ? { id: student.id, nombre: student.nombre, apellido: student.apellido } : null
              showJustifiedAbsenceModal = true
            }"
          />
        </div>
      </div>
    </div>

    <!-- Modales -->
    <AttendanceReportModal 
      v-if="showReportModal" 
      v-model="showReportModal"
      :classes="classesStore.classes"
      @close="showReportModal = false"
      @generate-report="handleGenerateReport"
    />

    <AttendanceObservation 
      v-if="showObservationsModal" 
      :modelValue="showObservationsModal"
      :studentId="selectedStudentForObs?.id || ''"
      :studentName="(selectedStudentForObs?.nombre + ' ' + selectedStudentForObs?.apellido) || ''"
      :classId="selectedClass"
      :className="selectedClass"
      :attendanceId="selectedDate"
      :attendanceDate="selectedDate"
      @update:modelValue="showObservationsModal = $event"
      @observation-added="handleObservationAdded"
    />

    <JustifiedAbsenceModal 
      v-if="showJustifiedAbsenceModal" 
      :student="selectedStudentForJustification"
      @close="showJustifiedAbsenceModal = false"
      @save="handleJustificationSave"
    />

    <AttendanceExportModal 
      v-if="showExportModal" 
      :modelValue="showExportModal"
      :date="selectedDate"
      :className="selectedClass"
      :students="studentsStore.getStudentsByClass(selectedClass)"
      :attendanceRecords="attendanceStore.attendanceRecords"
      @update:modelValue="showExportModal = $event"
      @close="showExportModal = false"
    />
  </div>
</template>