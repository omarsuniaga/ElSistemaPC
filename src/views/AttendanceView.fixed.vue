<script setup lang="ts">
// Augment the Window interface for jsPDF and jspdf (if loaded via CDN)
declare global {
  interface Window {
    jsPDF: any; // You might want to install @types/jspdf for better typing
    jspdf: any; // For jspdf-autotable plugin
  }
}

import '@vuepic/vue-datepicker/dist/main.css'
import { ref, computed, onMounted, watch } from 'vue'
import { 
  parseISO, 
  format, 
} from 'date-fns'
import { es } from 'date-fns/locale'

// Componentes importados
import AttendanceHeader from '../modulos/Attendance/components/AttendanceHeader.vue'
import AttendanceList from '../modulos/Attendance/components/AttendanceList.vue'
import AttendanceReportModal from '../modulos/Attendance/components/AttendanceReportModal.vue'
import AttendanceObservation from '../modulos/Attendance/components/AttendanceObservation.vue'
import AttendanceAnalytics from '../modulos/Attendance/components/AttendanceAnalytics.vue'
import AttendanceTrends from '../modulos/Attendance/components/AttendanceTrends.vue'
import AttendanceExportModal from '../modulos/Attendance/components/AttendanceExportModal.vue'
import Calendar from '../components/Calendar.vue'
import DateClassSelector from '../modulos/Classes/components/DateClassSelector.vue'
import JustifiedAbsenceModal from '../components/JustifiedAbsenceModal.vue'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import EmergencyClassModal from '../modulos/Attendance/components/EmergencyClassModal.vue'
import type { Student } from '../modulos/Students/types/student'
import { generateAttendancePDF } from '../utils/pdf/pdf-export' 
import { sendWebhook, sendToMake } from '../utils/webhook'
import { useConfigStore } from '../stores/config'

// Router
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

// Stores
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useClassesStore } from '../modulos/Classes/store/classes'
import { useEmergencyClassStore } from '../modulos/Attendance/store/emergencyClass'
import { getCurrentDate } from '../utils/dateUtils'
import type { SelectedStudent } from '../modulos/Students/types/student'
import type { AttendanceFiltersType } from '../modulos/Attendance/types/attendance'
// Agregar importación del store de auth
import { useAuthStore } from '../stores/auth'


// Agregar esto después de las otras declaraciones de stores
const authStore = useAuthStore()
const configStore = useConfigStore()

// Define an interface for the attendance records structure
interface AttendanceRecord {
  [studentId: string]: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | string;
}

  // Modificar la función de verificación para fechas disponibles
const availableClassDates = computed(() => {
  if (!selectedClass.value) return []
  
  // Obtener el ID del maestro actual
  const currentTeacherId = authStore.user?.uid
  
  // Solo obtener días programados para clases
  const scheduledDays = attendanceStore.getClassScheduleDays(selectedClass.value)
  
  // Filtrar días por maestro actual
  return scheduledDays.filter(day => {
    const classesForDay = classesStore.getClassesByDayAndTeacherId(day, currentTeacherId || '')
    return classesForDay && classesForDay.length > 0
  })
})
const markedDates = computed(() => attendanceStore.getMarkedDatesForCalendar);
// Props para recibir fecha y clase desde la URL
const props = defineProps({
  date: String,
  classId: String
})

// Estado global (stores)
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const emergencyClassStore = useEmergencyClassStore()

// Estados de vista y UI
const filteredStudents = ref<any[]>([])
const view = ref<'calendar' | 'class-select' | 'attendance-form'>('calendar')
const selectedDate = ref(getCurrentDate())
const currentMonth = ref(new Date())
const selectedClass = ref('')
// Utilizamos computed para derivar el nombre de la clase desde el store
const selectedClassName = computed(() => {
  const cls = classesStore.classes.find(c => c.id === selectedClass.value || c.name === selectedClass.value)
  return cls ? cls.name : selectedClass.value
})
const isLoading = ref(true)
const error = ref<string | null>(null)
const loadingMessage = ref<string>('')

// Referencia para el correo del destinatario
const recipientEmail = ref(authStore.user?.email || '')

// Estados para modales y mensajes
const showAnalytics = ref(false)
const showTrends = ref(false)
const showReportModal = ref(false)
const showExportModal = ref(false)
const showObservationsModal = ref(false)
const selectedStudentForObs = ref<SelectedStudent | null>(null)
const showJustifiedAbsenceModal = ref(false)
const selectedStudentForJustification = ref<SelectedStudent | null>(null)
const showCalendarModal = ref(false)
const showEmergencyClassModal = ref(false)
const warningMessage = ref('')
const errorMessage = ref('')

// Report filters
const reportFilters = ref<AttendanceFiltersType>({
  instrument: '',
  level: '',
  teacherId: '',
  startDate: '', // Add default value
  endDate: ''    // Add default value
})

// Control para evitar bucles reactivos
const isUpdating = ref(false)

// Toast (mensajes emergentes)
const showMessage = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg
  messageType.value = type
  showMessage.value = true
  setTimeout(() => { showMessage.value = false }, 3000)
}

// Computed para contar observaciones (si existen)
const getObservationsCount = computed(() => {
  return attendanceStore.currentAttendanceDoc?.data.observations ? 1 : 0
})

// Computed para mostrar la fecha seleccionada formateada en el título
const formattedSelectedDate = computed(() => {
  return format(parseISO(selectedDate.value), "d 'de' MMMM yyyy", { locale: es })
})

// Helper para navegar a la URL de detalle de asistencia
const navigateToAttendanceDetailUrl = (date: string, classId: string) => {
  const formattedDate = date.replace(/-/g, '')
  // Update URL without causing navigation
  const url = `/attendance/${formattedDate}/${classId}`
  window.history.replaceState(
    { date: formattedDate, classId },
    '',
    url
  )
}
// Seleccionar fecha (ya sea desde el calendario o Datepicker)
const selectDate = async (date: string | { date: string }) => {
  if (isUpdating.value) return
  isUpdating.value = true
  console.log("Selected date:", date)
  try {
    if (typeof date === 'string') {
      selectedDate.value = date
    } else if (date && typeof date === 'object' && 'date' in date) {
      selectedDate.value = date.date
    }
    if (selectedClass.value) {
      navigateToAttendanceDetailUrl(selectedDate.value, selectedClass.value)
      await loadAttendanceData(selectedClass.value)
    } else {
      view.value = 'class-select'
    }
  } catch (err) {
    console.error('Error al seleccionar fecha:', err)
  } finally {
    setTimeout(() => { isUpdating.value = false }, 0)
  }
}

// Manejo de la selección desde el modal del calendario
const handleCalendarSelect = (date: string) => {
  if (typeof date === 'string') {
    selectedDate.value = date
  } else if (date && typeof date === 'object' && 'date' in date) {
    selectedDate.value = date.date
  }

  // cerrar modal
  showCalendarModal.value = false
}

// Función para confirmar la fecha seleccionada en el modal
const confirmDateSelection = () => {
  selectDate(selectedDate.value)
  showCalendarModal.value = false
}

// Manejar cambio de mes en el calendario
const handleMonthChange = (newMonth: Date) => {
  currentMonth.value = newMonth
  attendanceStore.fetchAttendanceRecords({
    classId: selectedClass.value || 'all',
    startDate: newMonth,
    endDate: new Date()
  })
}

// Actualización de fecha desde DateClassSelector
const handleDateChange = async (newDate: string) => {
  if (isUpdating.value) return
  isUpdating.value = true
  try {
    selectedDate.value = newDate
    if (!attendanceStore.validateAttendanceDate(selectedDate.value)) {
      warningMessage.value = "No se puede registrar asistencia para fechas futuras"
      return
    }
    if (selectedClass.value) {
      // Update URL without causing navigation
      navigateToAttendanceDetailUrl(selectedDate.value, selectedClass.value)
      await loadAttendanceData(selectedClass.value)
    }
  } finally {
    setTimeout(() => { isUpdating.value = false }, 0)
  }
}

// Actualizar la fecha sin entrar en ciclo reactivo
const handleSelectedDateUpdate = (date: string) => {
  if (isUpdating.value) return
  isUpdating.value = true
  setTimeout(() => {
    selectedDate.value = date
    isUpdating.value = false
  }, 0)
}

// Función para actualizar la vista actual
const updateView = (newView: 'calendar' | 'class-select' | 'attendance-form') => {
  // Animar el cambio de vista
  view.value = newView;
  // Desactivar siempre el modal al cambiar de vista
  showCalendarModal.value = false;
  
  // Actualizar la URL si es necesario (sin navegación)
  if (newView === 'calendar') {
    window.history.replaceState(
      { view: 'calendar' },
      '',
      '/attendance/calendar'
    );
  } else if (newView === 'class-select' && selectedDate.value) {
    // No cambiamos la URL, solo el estado
  } else if (newView === 'attendance-form' && selectedDate.value && selectedClass.value) {
    navigateToAttendanceDetailUrl(selectedDate.value, selectedClass.value);
  }
}

// Cargar datos de asistencia para una clase
const loadAttendanceData = async (className: string) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos de asistencia...'
    attendanceStore.attendanceRecords = {}
    attendanceStore.selectedClass = className
    attendanceStore.selectedDate = selectedDate.value
    await attendanceStore.fetchAttendanceDocument(selectedDate.value, className)
    const students = studentsStore.getStudentsByClass(className)
    filteredStudents.value = students
    students.forEach(student => {
      if (!attendanceStore.attendanceRecords[student.id]) {
        attendanceStore.attendanceRecords[student.id] = 'Ausente'
      }
    })
    await attendanceStore.updateAnalytics()
  } catch (err) {
    console.error('Error al cargar asistencia:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Seleccionar una clase y cargar sus estudiantes
const selectClass = async (className: string) => {
  try {
    selectedClass.value = className
    attendanceStore.selectedClass = className
    let students = studentsStore.getStudentsByClass(className)
    if (!students.length) {
      // Búsqueda alternativa si no se encuentran con el método por defecto
      students = studentsStore.students.filter(s =>
        (s.clase && (Array.isArray(s.clase) ? s.clase.includes(className) : s.clase === className)) ||
        (s.grupo && (Array.isArray(s.grupo) ? s.grupo.includes(className) : s.grupo === className))
      )
    }
    filteredStudents.value = students
    
    // Update URL without causing navigation
    navigateToAttendanceDetailUrl(selectedDate.value, className)
    
    // First set view to attendance form, then load data
    view.value = 'attendance-form'
    
    // Load attendance data after view change
    await loadAttendanceData(className)
  } catch (error) {
    console.error('Error al seleccionar clase:', error)
    errorMessage.value = 'Error al cargar los estudiantes de la clase'
  }
}

// Verificar si la fecha está en el horario programado de la clase
const isDateInClassSchedule = (date: string, classId: string): boolean => {
  try {
    const scheduledDays = attendanceStore.getClassScheduleDays(classId)
    if (!scheduledDays || scheduledDays.length === 0) return false
    const dayName = format(parseISO(date), 'EEEE', { locale: es }).toLowerCase()
    return scheduledDays.includes(dayName)
  } catch (error) {
    console.error('Error al verificar horario de clase:', error)
    return false
  }
}

// Resto de funciones del componente...
// [Se omitieron para brevedad, pero deben mantenerse todas las funciones originales]

// Carga inicial de datos
const fetchInitialData = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos iniciales...'
    
    // Cerrar todos los modales para asegurar una experiencia limpia
    closeAllModals()
    
    console.log('Iniciando carga de datos iniciales...');
    
    // Cargar todos los documentos de asistencia (sin filtros de fecha)
    // Esto es esencial para que el calendario pueda marcar todas las fechas con actividades
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAttendanceDocuments() // Carga todos los documentos
    ])
    
    // Verificar si estamos navegando desde el menú principal de asistencia
    // Las rutas /attendance/calendar o /teacher/attendance/calendar indican navegación desde el menú
    if (route.path.endsWith('/attendance/calendar')) {
      // Si viene desde el menú principal, siempre mostrar el calendario
      view.value = 'calendar'
      selectedDate.value = getCurrentDate()
      selectedClass.value = ''
    }
    // Si hay parámetros específicos en la URL, cargar el detalle de asistencia
    else if (props.date && props.classId) {
      const dateStr = props.date
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`
        : dateStr
      selectedDate.value = formattedDate
      selectedClass.value = props.classId
      attendanceStore.selectedDate = formattedDate
      attendanceStore.selectedClass = props.classId
      await selectClass(props.classId)
    } else if (route.query.class) {
      selectedClass.value = route.query.class as string
      attendanceStore.selectedClass = selectedClass.value
      await loadAttendanceData(selectedClass.value)
      view.value = 'attendance-form'
    }
    error.value = null
  } catch (err) {
    error.value = 'Error al cargar los datos iniciales'
    console.error('Error al cargar datos iniciales:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Función para cerrar todos los modales
const closeAllModals = () => {
  showAnalytics.value = false
  showTrends.value = false
  showReportModal.value = false
  showExportModal.value = false
  showObservationsModal.value = false
  showJustifiedAbsenceModal.value = false
  showCalendarModal.value = false
  showEmergencyClassModal.value = false
}

onMounted(async () => {
  window.addEventListener('popstate', handlePopState);
  await configStore.fetchConfigs()
  await fetchInitialData()
})

// Manejo de la navegación del historial
const handlePopState = (event: PopStateEvent) => {
  if (event.state) {
    // If there's state data from our history.pushState
    if (event.state.date && event.state.classId) {
      const dateStr = event.state.date;
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`
        : dateStr;
      
      // Update local state based on browser history
      selectedDate.value = formattedDate;
      selectedClass.value = event.state.classId;
      
      // Load the appropriate view
      if (selectedClass.value) {
        view.value = 'attendance-form';
        loadAttendanceData(selectedClass.value);
      } else {
        view.value = 'calendar';
      }
    }
  }
};

// Actualizar datos si cambian los parámetros de la URL o la ruta completa
watch(() => [route.params.date, route.params.classId, route.path], async ([newDate, newClassId, path]) => {
  // Si la ruta termina con /calendar, siempre mostrar la vista de calendario
  // Asegurarse de que path es un string antes de usar endsWith
  if (typeof path === 'string' && (path.endsWith('/attendance/calendar') || path.endsWith('/teacher/attendance/calendar'))) {
    view.value = 'calendar'
    selectedDate.value = getCurrentDate()
    selectedClass.value = ''
    closeAllModals()
    return
  }
  
  // Si hay parámetros de URL específicos, cargar el detalle de asistencia
  if (newDate && newClassId) {
    const dateStr = newDate as string
    const formattedDate = dateStr.length === 8
      ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`
      : dateStr
    selectedDate.value = formattedDate
    selectedClass.value = newClassId as string
    attendanceStore.selectedDate = formattedDate
    attendanceStore.selectedClass = newClassId as string
    await selectClass(newClassId as string)
  }
})

// Computed property to filter classes with attendance records for selected date
const classesWithRecordsForSelectedDate = computed(() => {
  return attendanceStore.attendanceDocuments
    .filter(doc => doc.fecha === selectedDate.value)
    .map(doc => doc.classId);
});

// Ensure we refresh attendance docs when date changes
watch(() => selectedDate.value, async (newDate) => {
  if (newDate) {
    console.log("AttendanceView: Fecha seleccionada cambiada a:", newDate);
    // En lugar de volver a cargar todos los documentos (lo que podría ser costoso),
    // solo actualizamos los filtros locales si ya tenemos documentos cargados
    if (attendanceStore.attendanceDocuments.length === 0) {
      console.log("AttendanceView: Cargando documentos de asistencia para la fecha:", newDate);
      await attendanceStore.fetchAttendanceDocuments();
    }
  }
}, { immediate: true });

// Watch especial para monitorear cambios en los documentos de asistencia
// Este watch se activará cuando se añadan/eliminen/modifiquen documentos
watch(() => attendanceStore.attendanceDocuments.length, (newLength) => {
  console.log(`AttendanceView: Cambio detectado en documentos de asistencia. Nuevo total: ${newLength}`);
  // No necesitamos hacer nada explícitamente aquí, 
  // ya que la computed property markedDates se recalculará automáticamente
});

const dayNumber = ref(1); // Ejemplo: día 1 del mes
const teacherId = ref(authStore.user?.uid || ''); // ID del maestro actual

const relevantClasses = computed(() => {
  // Defensive check to prevent errors
  if (!classesStore.getClassesByDayAndTeacherId) {
    console.error('getClassesByDayAndTeacherId method not found in classesStore - check imports');
    return [];
  }
  return classesStore.getClassesByDayAndTeacherId(dayNumber.value, teacherId.value);
});
</script>

<template>
  <div class="p-2 sm:p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-w-full overflow-x-hidden">
    <!-- Toast Messages -->
    <div v-if="showMessage" class="fixed top-4 right-20 z-50 p-3 sm:p-4 rounded-lg shadow-lg text-white transition-all duration-300 text-sm sm:text-base max-w-[90vw] sm:max-w-md" :class="messageType === 'success' ? 'bg-green-500' : 'bg-red-500'">
      {{ message }}
    </div>
    
    <!-- Botones adicionales -->
    <div class="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
      <button @click="toggleAnalytics" class="btn text-xs sm:text-sm" :class="showAnalytics ? 'btn-primary' : 'btn-secondary'">
        <i class="fas fa-chart-pie mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Análisis</span>
        <span class="xs:hidden">A</span>
      </button>
      <button @click="toggleTrends" class="btn text-xs sm:text-sm" :class="showTrends ? 'btn-primary' : 'btn-secondary'">
        <i class="fas fa-chart-line mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Tendencias</span>
        <span class="xs:hidden">T</span>
      </button>
      <button @click="openReportModal" class="btn btn-secondary text-xs sm:text-sm">
        <i class="fas fa-file-alt mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Informe</span>
        <span class="xs:hidden">I</span>
      </button>      
      <button @click="openExportModal" class="btn btn-secondary text-xs sm:text-sm">
        <i class="fas fa-file-export mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Exportar</span>
        <span class="xs:hidden">E</span>
      </button>
      <button @click="exportCurrentClassAttendanceToPDF" class="btn btn-secondary text-xs sm:text-sm">
        <i class="fas fa-file-pdf mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Exportar PDF</span>
        <span class="xs:hidden">PDF</span>
      </button>
    </div>
    
    <!-- Campo para ingresar el correo del destinatario -->
    <div class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 class="font-semibold text-sm sm:text-base mb-2">Enviar reporte por correo electrónico</h3>
      <div class="flex flex-col sm:flex-row gap-3 items-center">
        <div class="w-full sm:w-2/3">
          <label for="recipientEmail" class="block text-sm font-medium mb-1">Correo del destinatario:</label>
          <input 
            id="recipientEmail" 
            v-model="recipientEmail" 
            type="email" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-900"
            placeholder="Ingrese el correo electrónico"
          />
        </div>
        <button @click="sendAttendanceEmail" class="btn btn-primary text-xs sm:text-sm mt-2 sm:mt-5 w-full sm:w-auto">
          <i class="fas fa-envelope mr-1 sm:mr-2"></i>
          <span>Enviar Reporte</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col justify-center items-center py-6 sm:py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div class="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary-600"></div>
      <span v-if="loadingMessage" class="mt-3 text-sm sm:text-base text-center">{{ loadingMessage }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 sm:p-4 rounded-lg mb-4 text-sm sm:text-base">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {{ error }}
        </div>
        <button @click="fetchInitialData" class="btn btn-sm btn-error">Reintentar</button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-3 sm:space-y-5">
      <!-- Panel de Analytics -->
      <AttendanceAnalytics v-if="showAnalytics" class="mb-3 sm:mb-4" />

      <!-- Panel de Tendencias -->
      <AttendanceTrends v-if="showTrends" class="mb-3 sm:mb-4" />
      
      <!-- Vista principal según estado -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6 overflow-hidden">
        <Transition name="fade" mode="out-in">
          <!-- Vista de Calendario -->
          <div v-if="view === 'calendar'" key="calendar-view" class="max-w-3xl mx-auto">
            <h2 class="text-lg font-semibold mb-3 text-center sm:text-left">Seleccionar Fecha</h2>
            <Calendar 
              :selected-date="selectedDate" 
              :current-month="currentMonth"
              :marked-dates="markedDates" 
              @select="selectDate"
              @month-change="handleMonthChange"
              class="max-w-full overflow-x-auto"
            />
          </div>
          
          <!-- Vista de Selección de Clase -->
          <div v-else-if="view === 'class-select'" key="class-select-view" class="max-w-3xl mx-auto">
            <div class="flex justify-between items-center mb-3">
              <h2 class="text-lg font-semibold">Seleccionar Clase</h2>
              <button @click="updateView('calendar')" class="btn btn-secondary btn-sm">
                Volver
              </button>
            </div>
            <DateClassSelector 
              v-model="selectedClass" 
              v-model:selectedDate="selectedDate" 
              :dayFilter="true"
              :isLoading="isLoading"
              :classesWithRecords="classesWithRecordsForSelectedDate"
              :marked-dates="markedDates"
              @continue="() => selectClass(selectedClass)"
              @class-selected="selectClass"
              @date-change="handleDateChange"
              @update:selectedDate="handleSelectedDateUpdate"
              class="max-w-full"
              @back="updateView('calendar')"
            />
          </div>

          <!-- Vista de Lista de Asistencia -->
          <div v-else-if="view === 'attendance-form'" key="attendance-form-view" class="space-y-3 sm:space-y-4">
            <div class="flex justify-between items-center mb-2">
              <h2 class="text-base sm:text-lg font-semibold">Lista de Asistencia</h2>
              <!-- mostrar la fecha seleccionada -->              <span class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {{ selectedDate ? format(parseISO(selectedDate), 'dd/MM/yyyy') : 'Fecha no seleccionada' }}
              </span>
              <button @click="updateView('class-select')" class="btn btn-secondary btn-sm">
                Volver
              </button>
            </div>
            <div class="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-2 mb-3 sm:mb-4">
              <div v-if="attendanceStore.getObservations" class="flex items-center justify-center sm:justify-start w-full sm:w-auto mt-2 sm:mt-0">
                <span class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic mr-2">
                  Esta clase tiene observaciones
                </span>
                <button @click="handleOpenObservation(null)" class="btn btn-xs sm:btn-sm btn-info">
                  Ver/Editar
                </button>
              </div>
            </div>
            
            <AttendanceList 
              :students="studentsStore.getStudentsByClass(selectedClass)" 
              :attendanceRecords="attendanceStore.attendanceRecords"
              :selectedClassName="selectedClassName"
              :isDisabled="!attendanceStore.validateAttendanceDate(selectedDate)"
              :currentDate="selectedDate"
              :availableDates="availableClassDates"
              :observationsCount="getObservationsCount"
              @update-status="handleUpdateStatus"            
              @open-justification="handleOpenJustification"
              @open-observation="handleOpenObservation"
              @open-export="() => handleOpenExport(true)"
              @class-changed="selectClass"
              @date-changed="handleDateChange"
              class="overflow-x-auto"
            />
          </div>
        </Transition>
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
    <AttendanceObservation 
      v-if="showObservationsModal" 
      :modelValue="showObservationsModal"
      :studentId="selectedStudentForObs?.id"
      :studentName="selectedStudentForObs ? `${selectedStudentForObs.nombre} ${selectedStudentForObs.apellido}` : ''"
      :classId="selectedClass"
      :className="selectedClassName || selectedClass"
      :attendanceId="selectedDate"
      :attendanceDate="selectedDate"
      @update:modelValue="showObservationsModal = $event"
      @observation="handleObservationAdded"
    />
    <JustifiedAbsenceModal 
      v-if="showJustifiedAbsenceModal" 
      :student="selectedStudentForJustification"
      @close="showJustifiedAbsenceModal = false"
      @save="handleJustificationSave"
    />  
    <!-- Modal de calendario personalizado que usa directamente Calendar.vue -->
    <div v-if="showCalendarModal" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="absolute inset-0 bg-black/50" @click="showCalendarModal = false"></div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-10">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Seleccionar Fecha</h3>
          <button @click="showCalendarModal = false" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <Calendar 
            :selected-date="selectedDate" 
            :current-month="currentMonth"
            :marked-dates="markedDates" 
            @select="handleCalendarSelect"
            @month-change="handleMonthChange"
            class="max-w-full overflow-x-auto"
          />
        </div>
      </div>
    </div>
    <EmergencyClassModal
      v-if="showEmergencyClassModal"
      v-model="showEmergencyClassModal"
      :classId="selectedClass"
      :className="selectedClassName || selectedClass"
      :date="selectedDate"
      @submitted="handleEmergencyClassSubmitted"
      @cancel="handleEmergencyClassCancelled"
    />
  </div>
</template>

<style scoped>
/* Transiciones para las vistas */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-to, .fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
