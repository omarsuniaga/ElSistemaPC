<script setup lang="ts">
import { storeToRefs } from 'pinia'
import '@vuepic/vue-datepicker/dist/main.css'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { 
  eachDayOfInterval, 
  addMonths, 
  isSameDay, 
  parseISO, 
  format, 
  startOfToday, 
  startOfMonth 
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
import CalendarModal from '../modulos/Attendance/components/CalendarModal.vue'
import DateClassSelector from '../modulos/Classes/components/DateClassSelector.vue'
import JustifiedAbsenceModal from '../components/JustifiedAbsenceModal.vue'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import EmergencyClassModal from '../modulos/Attendance/components/EmergencyClassModal.vue'

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
  teacherId: ''
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

// Computed para obtener fechas disponibles (por ejemplo, los días programados de la clase)
const availableClassDates = computed(() => {
  if (!selectedClass.value) return []
  const scheduledDays = attendanceStore.getClassScheduleDays(selectedClass.value)
  // Se asume que classesStore.getClassesByDay existe y filtra las clases según el día
  return scheduledDays.filter(day => {
    const classesForDay = classesStore.getClassesByDay(day)
    return classesForDay && classesForDay.length > 0
  })
})

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
  router.push(`/attendance/${formattedDate}/${classId}`)
}

// Seleccionar fecha (ya sea desde el calendario o Datepicker)
const selectDate = async (date: string | { date: string }) => {
  if (isUpdating.value) return
  isUpdating.value = true
  try {
    if (typeof date === 'string') {
      selectedDate.value = date
    } else if (date && date.date) {
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
  selectDate(date)
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

// Cambiar la vista (calendar, class-select o attendance-form)
const updateView = (newView: 'calendar' | 'class-select' | 'attendance-form') => {
  view.value = newView
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
    navigateToAttendanceDetailUrl(selectedDate.value, className)
    await loadAttendanceData(className)
    view.value = 'attendance-form'
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

// Guardar cambios pendientes en la asistencia
const saveAllAttendanceChanges = async () => {
  try {
    const isRegularSchedule = isDateInClassSchedule(selectedDate.value, selectedClass.value)
    if (!isRegularSchedule) {
      const hasExistingAttendance = await attendanceStore.fetchAttendanceDocument(selectedDate.value, selectedClass.value)
      if (!hasExistingAttendance) {
        const sessionKey = `emergency_shown_${selectedDate.value}_${selectedClass.value}`
        if (!sessionStorage.getItem(sessionKey)) {
          showEmergencyClassModal.value = true
          sessionStorage.setItem(sessionKey, 'true')
          return false
        }
      }
    }
    isLoading.value = true
    loadingMessage.value = 'Guardando asistencia...'
    const attendanceDoc = {
      fecha: selectedDate.value,
      classId: selectedClass.value,
      data: {
        presentes: [] as string[],
        ausentes: [] as string[],
        tarde: [] as string[],
        justificacion: attendanceStore.currentAttendanceDoc?.data.justificacion?.filter(j => 
          attendanceStore.attendanceRecords[j.id] === 'Justificado'
        ) || [],
        observations: attendanceStore.currentAttendanceDoc?.data.observations || ''
      }
    }
    Object.entries(attendanceStore.attendanceRecords).forEach(([studentId, status]) => {
      if (status === 'Presente') {
        attendanceDoc.data.presentes.push(studentId)
      } else if (status === 'Ausente') {
        attendanceDoc.data.ausentes.push(studentId)
      } else if (status === 'Tardanza') {
        attendanceDoc.data.tarde.push(studentId)
      } else if (status === 'Justificado') {
        attendanceDoc.data.tarde.push(studentId)
        const existingJust = attendanceDoc.data.justificacion.find(j => j.id === studentId)
        if (!existingJust) {
          attendanceDoc.data.justificacion.push({ id: studentId, reason: 'Justificación pendiente de detalles' })
        }
      }
    })
    await attendanceStore.saveAttendanceDocument(attendanceDoc)
    await attendanceStore.updateAnalytics()
    showToast('Asistencia guardada correctamente', 'success')
    return true
  } catch (err) {
    error.value = 'Error al guardar la asistencia'
    console.error('Error guardando asistencia:', err)
    showToast('Error al guardar la asistencia', 'error')
    return false
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Manejar observación añadida
const handleObservationAdded = async (observations: string) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Guardando observación...'
    await attendanceStore.updateObservations(selectedDate.value, selectedClass.value, observations)
    showToast('Observación guardada correctamente', 'success')
    showObservationsModal.value = false
  } catch (err) {
    error.value = 'Error al actualizar observaciones'
    console.error('Error actualizando observaciones:', err)
    showToast('Error al guardar la observación', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Abrir modal de observaciones
const handleOpenObservation = (student: any) => {
  selectedStudentForObs.value = student
  showObservationsModal.value = true
}

// Guardar justificación
const handleJustificationSave = async (data: { reason: string, documentUrl?: string, file?: File }) => {
  try {
    if (!selectedStudentForJustification.value) return
    isLoading.value = true
    loadingMessage.value = 'Guardando justificación...'
    const studentId = selectedStudentForJustification.value.id
    attendanceStore.attendanceRecords[studentId] = 'Justificado'
    await attendanceStore.addJustificationToAttendance(
      studentId,
      selectedDate.value,
      selectedClass.value,
      data.reason,
      data.file || null
    )
    showJustifiedAbsenceModal.value = false
    showToast('Justificación guardada correctamente', 'success')
    await loadAttendanceData(selectedClass.value)
  } catch (err) {
    error.value = 'Error al guardar la justificación'
    console.error('Error guardando justificación:', err)
    showToast('Error al guardar la justificación', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Generar informe
const handleGenerateReport = async (filters: AttendanceFiltersType) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Generando informe...'
    reportFilters.value = { ...filters }
    showReportModal.value = false
    showAnalytics.value = true
    await attendanceStore.updateAnalytics()
  } catch (err) {
    error.value = 'Error al generar el informe'
    console.error('Error generando informe:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const toggleAnalytics = () => {
  showAnalytics.value = !showAnalytics.value
  if (showAnalytics.value) showTrends.value = false
}
const toggleTrends = () => {
  showTrends.value = !showTrends.value
  if (showTrends.value) showAnalytics.value = false
}
const openReportModal = () => { showReportModal.value = true }
const openExportModal = () => { showExportModal.value = true }
const createNewAttendance = () => { selectedDate.value = getCurrentDate(); view.value = 'class-select' }
const handleOpenJustification = (student: any) => {
  selectedStudentForJustification.value = student ? { id: student.id, nombre: student.nombre, apellido: student.apellido } : null
  showJustifiedAbsenceModal.value = true
}
const handleOpenExport = () => { showExportModal.value = true }

const handleEmergencyClassSubmitted = async (success: boolean) => {
  if (success) {
    showToast('Clase emergente registrada correctamente. Pendiente de aprobación.', 'success')
    await saveAllAttendanceChanges()
  } else {
    showToast('Error al registrar la clase emergente', 'error')
  }
}
const handleEmergencyClassCancelled = () => { showToast('Registro de clase emergente cancelado', 'success') }

// Manejar actualización de estado de asistencia
const handleUpdateStatus = (studentId: string, status: string) => {
  if (!studentId || !status) return;
  attendanceStore.attendanceRecords[studentId] = status as any; // Cast to AttendanceStatus type
}

const checkExistingAttendance = async (date: string, classId: string): Promise<boolean> => {
 // Este metodo chequea la existencia de la asistencia
  try {
    const existingInMemory = attendanceStore.attendanceDocuments.some(
      doc => doc.fecha === date && doc.classId === classId
    )
    if (existingInMemory) return true
    const docResult = await attendanceStore.fetchAttendanceDocument(date, classId)
    const hasExistingData = docResult && (
      docResult.data.presentes.length > 0 ||
      docResult.data.ausentes.length > 0 ||
      docResult.data.tarde.length > 0
    )
    return !!hasExistingData
  } catch (error) {
    console.error('Error verificando asistencia existente:', error)
    return false
  }
}

// Carga inicial de datos
const fetchInitialData = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos iniciales...'
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAllAttendanceDates()
    ])
    if (props.date && props.classId) {
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

onMounted(async () => {
  await fetchInitialData()
})

// Actualizar datos si cambian los parámetros de la URL
watch(() => [route.params.date, route.params.classId], async ([newDate, newClassId]) => {
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
</script>

<template>
  <div class="p-2 sm:p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-w-full overflow-x-hidden">
    <!-- Toast Messages -->
    <div v-if="showMessage" class="fixed top-4 right-4 z-50 p-3 sm:p-4 rounded-lg shadow-lg text-white transition-all duration-300 text-sm sm:text-base max-w-[90vw] sm:max-w-md" :class="messageType === 'success' ? 'bg-green-500' : 'bg-red-500'">
      {{ message }}
    </div>

    <!-- Header -->
    <AttendanceHeader 
      :selectedDate="selectedDate" 
      :selectedClass="selectedClassName" 
      :view="view" 
      :showAnalytics="showAnalytics"
      @update:view="updateView"  
      @toggle-analytics="toggleAnalytics" 
      @open-report-modal="openReportModal" 
      @open-export-modal="openExportModal"
      @create-new-attendance="createNewAttendance"
      class="mb-3 sm:mb-4"
    />

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
        <!-- Vista de Calendario -->
        <div v-if="view === 'calendar'" class="max-w-3xl mx-auto">
          <h2 class="text-lg font-semibold mb-3 text-center sm:text-left">Seleccionar Fecha</h2>
          <Calendar 
            :selected-date="selectedDate" 
            :current-month="currentMonth"
            :markedDates="attendanceStore.datesWithRecords" 
            @select="selectDate"
            @month-change="handleMonthChange"
            class="max-w-full overflow-x-auto"
          />
        </div>

        <!-- Vista de Selección de Clase -->
        <div v-else-if="view === 'class-select'" class="max-w-3xl mx-auto">
          <h2 class="text-lg font-semibold mb-3 text-center sm:text-left">Seleccionar Clase</h2>
          <DateClassSelector 
            v-model="selectedClass" 
            v-model:selectedDate="selectedDate" 
            :dayFilter="true"
            @continue="() => selectClass(selectedClass)"
            :isLoading="isLoading"
            @date-change="handleDateChange"
            @update:selectedDate="handleSelectedDateUpdate"
            class="max-w-full"
          />
        </div>

        <!-- Vista de Lista de Asistencia -->
        <div v-else-if="view === 'attendance-form'" class="space-y-3 sm:space-y-4">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-center sm:text-left">
            Lista de Asistencia <span class="block sm:inline">{{ formattedSelectedDate }}</span>
          </h2>
          <div class="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-2 mb-3 sm:mb-4">
            <button @click="showCalendarModal = true" class="btn btn-secondary inline-flex items-center w-full sm:w-auto">
              <CalendarDaysIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Cambiar Fecha
            </button>
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
            @open-export="handleOpenExport"
            @class-changed="selectClass"
            @date-changed="handleDateChange"
            class="overflow-x-auto"
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
    <CalendarModal
      v-model="showCalendarModal"
      :initial-date="selectedDate"
      :marked-dates="attendanceStore.getDatesWithRecords"
      @select="handleCalendarSelect"
    />
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
