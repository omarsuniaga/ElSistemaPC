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

// Router
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

// Props para recibir fecha y clase desde la URL
const props = defineProps({
  date: String,
  classId: String
})

// Stores
import { useAttendanceStore } from '../stores/attendance'
import { useStudentsStore } from '../stores/students'
import { useClassesStore } from '../stores/classes'
import { useInstrumentoStore } from '../stores/instrumento'
import { getCurrentDate } from '../utils/dateUtils'
import type { SelectedStudent } from '../types/student'
import type { TeacherData } from '../types/teachers'
import type { AttendanceFiltersType } from '../types/attendance'

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

// Lista de estudiantes filtrados
const filteredStudents = ref<any[]>([])
const errorMessage = ref('')
const warningMessage = ref('')
const selectedClassName = ref('')

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
const reportFilters = ref<AttendanceFiltersType>({
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

// Computed para determinar si la fecha seleccionada es válida para editar
const isDateEditable = computed(() => {
  return attendanceStore.validateAttendanceDate(selectedDate.value);
});

// Método para navegar a la URL con formato /attendance/YYYYMMDD/class-id
const navigateToAttendanceDetailUrl = (date: string, classId: string) => {
  // Formatear la fecha eliminando guiones para URL
  const formattedDate = date.replace(/-/g, '')
  router.push(`/attendance/${formattedDate}/${classId}`)
}

// Función para cargar datos iniciales y verificar si hay una fecha y clase en la URL
async function fetchInitialData() {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos iniciales...'
    
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      instrumentoStore.fetchInstrumentos()
    ])
    
    // Verificar si tenemos fecha y clase en los props (de la URL)
    if (props.date && props.classId) {
      // Formatear la fecha a formato YYYY-MM-DD (si viene como YYYYMMDD)
      const dateStr = props.date
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
        : dateStr
      
      selectedDate.value = formattedDate
      selectedClass.value = props.classId
      
      // También actualizar en el store
      attendanceStore.selectedDate = formattedDate
      attendanceStore.selectedClass = props.classId
      
      await selectClass(props.classId)
    }
    // Si no tenemos fecha/clase en la URL pero sí en el query
    else if (route.query.class) {
      selectedClass.value = route.query.class as string
      attendanceStore.selectedClass = selectedClass.value
      
      await loadAttendanceData(selectedClass.value)
      view.value = 'attendance-form'
    }
    
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

// Función para cargar datos de asistencia para una clase específica
const loadAttendanceData = async (className: string) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos de asistencia...'
    
    // Limpiar registros de asistencia previos
    attendanceStore.attendanceRecords = {}
    
    // Actualizar contexto en el store
    attendanceStore.selectedClass = className
    attendanceStore.selectedDate = selectedDate.value
    
    // Cargar el documento de asistencia
    await attendanceStore.fetchAttendanceDocument(selectedDate.value, className)
    
    // Ahora, cargar los registros de asistencia
    await attendanceStore.fetchAttendanceByClassAndDate(className, selectedDate.value)
    
    // Inicializar todos los estudiantes que no tienen estado con estado 'Ausente'
    const studentIds = classesStore.getStudentIdsByClass(className);
    studentIds.forEach(studentId => {
      if (!attendanceStore.attendanceRecords[studentId]) {
        attendanceStore.attendanceRecords[studentId] = 'Ausente';
      }
    });
    
    // Actualizar analytics después de cargar los datos
    await attendanceStore.updateAnalytics()
    
    return true
  } catch (err) {
    console.error('Error loading attendance data:', err)
    return false
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Función para seleccionar una clase y cargar sus estudiantes
const selectClass = async (className: string) => {
  try {
    console.log('Seleccionando clase:', className);
    selectedClass.value = className;
    attendanceStore.selectedClass = className;
    
    // Obtener IDs de estudiantes de la clase seleccionada
    const studentIds = classesStore.getStudentIdsByClass(className);
    console.log('IDs de estudiantes encontrados:', studentIds);
    
    // Obtener los datos completos de los estudiantes usando fetchStudentsByIds
    const studentsData = studentsStore.fetchStudentsByIds(studentIds);
    
    // Almacenar los estudiantes filtrados
    filteredStudents.value = studentsData;
    
    console.log('Estudiantes encontrados:', filteredStudents.value);
    
    // También actualizar el nombre de la clase seleccionada
    const classObj = classesStore.classes.find(c => c.id === className || c.name === className)
    selectedClassName.value = classObj?.name || className
    
    // Actualizar la URL con la nueva estructura /attendance/fecha/clase
    const formattedDate = selectedDate.value.replace(/-/g, '')
    await router.push(`/attendance/${formattedDate}/${className}`);
    
    // Cargar datos de asistencia para la clase seleccionada
    const success = await loadAttendanceData(className);
    
    if (success) {
      // Cambiar a la vista de formulario de asistencia
      view.value = 'attendance-form';
    }
  } catch (error) {
    console.error('Error al seleccionar clase:', error);
    errorMessage.value = 'Error al cargar los estudiantes de la clase';
  }
}

// Iniciar carga de datos al montar el componente
onMounted(fetchInitialData)

// Observar cambios en los parámetros de URL
watch(
  () => [route.params.date, route.params.classId],
  async ([newDate, newClassId]) => {
    if (newDate && newClassId) {
      // Formatear la fecha de YYYYMMDD a YYYY-MM-DD
      const dateStr = newDate as string
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
        : dateStr
      
      // Actualizar los estados locales
      selectedDate.value = formattedDate
      selectedClass.value = newClassId as string
      
      // También actualizar en el store
      attendanceStore.selectedDate = formattedDate
      attendanceStore.selectedClass = newClassId as string
      
      // Si hay un cambio real en la clase o fecha, cargar los datos
      await selectClass(newClassId as string)
    }
  }
)

// Mantener un registro local de cambios de asistencia
const pendingAttendanceChanges = ref<{studentId: string, status: AttendanceStatus}[]>([])

// Event handlers
const handleUpdateStatus = async (studentId: string, status: AttendanceStatus | 'save') => {
  console.log('Actualizando estado de asistencia:', studentId, status)
  
  // No permitir cambios si la fecha es futura
  if (!attendanceStore.validateAttendanceDate(selectedDate.value)) {
    warningMessage.value = "No se puede modificar asistencia para fechas futuras";
    return;
  }
  
  if (status === 'save') {
    await saveAllAttendanceChanges();
    return;
  }
  
  // Actualizar el estado de asistencia localmente
  attendanceStore.attendanceRecords[studentId] = status;
  
  // Añadir a la lista de cambios pendientes
  const existingChange = pendingAttendanceChanges.value.findIndex(c => c.studentId === studentId);
  if (existingChange !== -1) {
    pendingAttendanceChanges.value[existingChange].status = status;
  } else {
    pendingAttendanceChanges.value.push({ studentId, status });
  }
};

// Función para guardar todos los cambios pendientes
const saveAllAttendanceChanges = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Guardando asistencia...'
    
    // Crear el documento de asistencia que se guardará
    const attendanceDoc = {
      fecha: selectedDate.value,
      classId: selectedClass.value,
      data: {
        presentes: [] as string[],
        ausentes: [] as string[],
        tarde: [] as string[],
        justificacion: attendanceStore.currentAttendanceDoc?.data.justificacion || [],
        observations: attendanceStore.currentAttendanceDoc?.data.observations || ''
      }
    };
    
    // Clasificar estudiantes según su estado de asistencia
    Object.entries(attendanceStore.attendanceRecords).forEach(([studentId, status]) => {
      if (status === 'Presente') {
        attendanceDoc.data.presentes.push(studentId);
      } else if (status === 'Ausente') {
        attendanceDoc.data.ausentes.push(studentId);
      } else if (status === 'Tardanza' || status === 'Justificado') {
        attendanceDoc.data.tarde.push(studentId);
      }
    });
    
    // Guardar el documento
    await attendanceStore.saveAttendanceDocument(attendanceDoc);
    
    // Limpiar los cambios pendientes
    pendingAttendanceChanges.value = [];
    
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

const handleObservationAdded = async (observations: string) => {
  try {
    // Guardar las observaciones
    await attendanceStore.updateObservations(selectedDate.value, selectedClass.value, observations);
    showObservationsModal.value = false;
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
    
    // Usar el método del store para guardar la justificación
    await attendanceStore.addJustificationToAttendance(
      selectedStudentForJustification.value.id,
      selectedDate.value,
      selectedClass.value,
      data.reason,
      data.file || null
    )
    
    showJustifiedAbsenceModal.value = false
    
    // Recargar los datos para reflejar los cambios
    await loadAttendanceData(selectedClass.value);
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

// Event handlers para abrir modales
const handleOpenJustification = (student: any) => {
  selectedStudentForJustification.value = student ? { id: student.id, nombre: student.nombre, apellido: student.apellido } : null
  showJustifiedAbsenceModal.value = true
}

const handleOpenObservation = (student: any) => {
  selectedStudentForObs.value = student
  showObservationsModal.value = true
}

const handleOpenExport = () => {
  showExportModal.value = true
}

// Función para manejar la selección de fecha
const handleDateChange = async (newDate: string) => {
  selectedDate.value = newDate;
  
  // Si la fecha es futura, mostrar advertencia
  if (!attendanceStore.validateAttendanceDate(selectedDate.value)) {
    warningMessage.value = "No se puede registrar asistencia para fechas futuras";
    return;
  }
  
  // Si hay una clase seleccionada, actualizar la URL y cargar los datos
  if (selectedClass.value) {
    const formattedDate = newDate.replace(/-/g, '');
    await router.push(`/attendance/${formattedDate}/${selectedClass.value}`);
    await loadAttendanceData(selectedClass.value);
  }
};
</script>

<template>
  <div class="p-2 sm:p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Header -->
    <AttendanceHeader 
      :selectedDate="selectedDate" 
      :selectedClass="selectedClassName"
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
            :isLoading="isLoading"
            @date-change="handleDateChange"
          />
        </div>

        <!-- Vista de Lista de Asistencia -->
        <div v-else-if="view === 'attendance-form'" class="space-y-4 sm:space-y-6">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Lista de Asistencia</h2>
          <!-- Mensaje de advertencia para fechas futuras -->
          <div v-if="!isDateEditable" class="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg mb-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span class="text-yellow-800 dark:text-yellow-300">
                {{ warningMessage || "No se puede registrar asistencia para fechas futuras" }}
              </span>
            </div>
          </div>
          <!-- Lista de asistencia con botones deshabilitados para fechas futuras -->
          <AttendanceList 
            :students="filteredStudents" 
            :attendanceRecords="attendanceStore.attendanceRecords"
            :selectedClassName="selectedClassName"
            :isDisabled="!isDateEditable"
            @update-status="handleUpdateStatus"
            @open-justification="handleOpenJustification"
            @open-observation="handleOpenObservation"
            @open-export="handleOpenExport"
            @class-changed="selectClass"
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