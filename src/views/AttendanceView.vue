<template>
  <div class="p-2 sm:p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-w-full overflow-x-hidden">
    <!-- Toast Messages -->
    <div v-if="showMessage" class="fixed top-4 right-20 z-50 p-3 sm:p-4 rounded-lg shadow-lg text-white transition-all duration-300 text-sm sm:text-base max-w-[90vw] sm:max-w-md" :class="messageType === 'success' ? 'bg-green-500' : 'bg-red-500'">
      {{ message }}
    </div>


    
    <!-- Campo para ingresar el correo del destinatario -->
    <!-- <div class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
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
    </div> -->

    <!-- vamos a colocar una breve descripcion de lo que debe hacer el usuario -->
    <div class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 class="font-semibold text-sm sm:text-base mb-2">Gestión de Asistencia</h3>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
        Aquí puedes gestionar la asistencia de tus clases, ver estadísticas y generar reportes. 
        Selecciona una fecha en el calendario para comenzar.
      </p>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
        Las fechas con un Punto Azul indican que hay clases registradas.
      </p>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
        Aquellas que no tengan puntos, significa que no hay clases registradas para esa fecha.
      </p>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
        Presiona una fecha y luego escoge la clase que vas a registrar asistencia.
      </p>
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
    <div class="space-y-3 sm:space-y-5">
      <!-- Panel de Analytics -->
      <AttendanceAnalytics v-if="showAnalytics" class="mb-3 sm:mb-4" />

      <!-- Panel de Tendencias -->
      <AttendanceTrends v-if="showTrends" class="mb-3 sm:mb-4" />

      <!-- Vista principal según estado -->
      <!-- Modal que muestra las clases disponibles para la fecha seleccionada -->
      <ClassesModal
        :is-open="showClassesModal"
        :date="modalDate"
        :classes="classesForDate"
        @close="showClassesModal = false"
        @select-class="handleClassSelect"
        @create-emergency-class="handleCreateEmergencyClass"
      />
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6 overflow-hidden">
        <!-- Vista de Calendario -->
        <div v-if="view === 'calendar'" class="max-w-3xl mx-auto">
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
        <div v-else-if="view === 'class-select'" class="max-w-3xl mx-auto">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-lg font-semibold">Seleccionar Clase</h2>
          </div>
          <DateClassSelector 
            v-model="selectedClass" 
            v-model:selectedDate="selectedDate" 
            :dayFilter="true"
            :isLoading="isLoading"
            :classesWithRecords="classesWithRecordsForSelectedDate"
            :marked-dates="simpleMarkedDates"
            @continue="() => selectClass(selectedClass)"
            @date-change="handleDateChange"
            @update:selectedDate="handleSelectedDateUpdate"
            class="max-w-full"
            @back="updateView('calendar')"
          />
        </div>

        <!-- Vista de Lista de Asistencia -->
        <div v-else-if="view === 'attendance-form'" class="space-y-3 sm:space-y-4">
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-base sm:text-lg font-semibold">Lista de Asistencia</h2>
            <!-- mostrar la fecha seleccionada -->
            <span class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {{ selectedDate ? format(parseISO(selectedDate), 'dd/MM/yyyy') : 'Fecha no seleccionada' }}
            </span>
            <div class="flex gap-2">
              <button @click="forceReloadAttendanceData" class="btn btn-info btn-sm" title="Recargar datos de asistencia">
                🔄 Recargar
              </button>
              <button @click="updateView('class-select')" class="btn btn-secondary btn-sm">
                Volver
              </button>
            </div>
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
            <!-- Botones de control de datos -->
            <div class="flex gap-2 flex-wrap justify-center sm:justify-end">
              <button @click="forceReloadAttendanceData" class="btn btn-warning btn-xs sm:btn-sm" :disabled="isLoading" title="Recargar datos de asistencia">
                <i class="fas fa-sync-alt mr-1"></i>
                <span class="hidden sm:inline">Recargar</span>
                <span class="sm:hidden">R</span>
              </button>
              <button @click="runAttendanceDebug" class="btn btn-info btn-xs sm:btn-sm" :disabled="isLoading" title="Ejecutar debugging del sistema">
                <i class="fas fa-bug mr-1"></i>
                <span class="hidden sm:inline">Debug</span>
                <span class="sm:hidden">D</span>
              </button>
            </div>
          </div>

          <AttendanceList 
            v-if="view === 'attendance-form' && selectedClassName"
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
            @navigate-to-calendar="navigateToCalendar"
            @navigate-to-class-selector="navigateToClassSelector"
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
      v-model="showObservationsModal"
      :isVisible="showObservationsModal"
      :studentId="selectedStudentForObs?.id"
      :studentName="selectedStudentForObs ? `${selectedStudentForObs.nombre} ${selectedStudentForObs.apellido}` : ''"
      :classId="selectedClass"
      :className="selectedClassName || selectedClass" 
      :attendanceDate="selectedDate"
      :initialObservation="observationToEdit"
      :classObservationMode="!selectedStudentForObs"
      :teacherPermissions="availableClasses.find(cls => cls.id === selectedClass)?.teacherPermissions || null"
      @observation-saved="handleObservationAdded"
      @close="showObservationsModal = false"
    />
    <JustifiedAbsenceModal 
      :show="true" 
      :student="selectedStudentForJustification" 
      :initialJustification="initialJustificationText"
      @close="showJustificationModal = false"
      @save="handleSaveJustification"
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
            @close="showCalendarModal = false"
            @navigate-to-calendar="navigateToCalendar"
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

<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter, useRoute } from 'vue-router'

// Stores
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useClassesStore } from '../modulos/Classes/store/classes'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'

// Tipos
import { TeacherRole } from '../modulos/Classes/types/class'

// Componentes
import AttendanceList from '../modulos/Attendance/components/AttendanceList.vue'
import AttendanceReportModal from '../modulos/Attendance/components/AttendanceReportModal.vue'
import AttendanceObservation from '../modulos/Attendance/components/AttendanceObservation.vue'
import AttendanceAnalytics from '../modulos/Attendance/components/AttendanceAnalytics.vue'
import AttendanceTrends from '../modulos/Attendance/components/AttendanceTrends.vue'
import AttendanceExportModal from '../modulos/Attendance/components/AttendanceExportModal.vue'
import Calendar from '../components/Calendar.vue'
import DateClassSelector from '../modulos/Classes/components/DateClassSelector.vue'
import JustifiedAbsenceModal from '../components/JustifiedAbsenceModal.vue'
import EmergencyClassModal from '../modulos/Attendance/components/EmergencyClassModal.vue'
import ClassesModal from '../modulos/Attendance/components/ClassesModal.vue'

const showJustifiedAbsenceModal = ref(false)
// Router
const router = useRouter()
const route = useRoute()

// Utils
import { getCurrentDate } from '../utils/dateUtils'
import { generateAttendancePDF } from '../utils/pdf/pdf-export'
import { sendToMake } from '../utils/webhook'

// Types
import type { SelectedStudent } from '../modulos/Students/types/student'
import type { AttendanceFiltersType, AttendanceDocument, AttendanceStatus, ClassObservation } from '../modulos/Attendance/types/attendance'

// Initialize stores
const authStore = useAuthStore()
const configStore = useConfigStore()
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()

// Props
const props = defineProps<{
  date?: string
  classId?: string
}>()

// ============= REACTIVE STATE =============
const view = ref<'calendar' | 'class-select' | 'attendance-form'>('calendar')
const selectedDate = ref(getCurrentDate())
const currentMonth = ref(new Date())
const selectedClass = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const loadingMessage = ref('')

// Modal states
const showObservationsModal = ref(false)
const showObservationAlert = ref(false)
const selectedStudentForObs = ref<SelectedStudent | null>(null)
const showJustificationModal = ref(false)
const selectedStudentForJustification = ref<SelectedStudent | null>(null)
const initialJustificationText = ref<string>('')
const showReportModal = ref(false)
const showExportModal = ref(false)
const showAnalytics = ref(false)
const showTrends = ref(false)
const showCalendarModal = ref(false)
const showEmergencyClassModal = ref(false)
const currentObservationText = ref<string>('')
const observationToEdit = ref<ClassObservation | null>(null);

// Emergency class data
const emergencyClassInfo = ref<any>(null)
const isLoadingEmergencyClass = ref(false)

// Messages
const showMessage = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const recipientEmail = ref(authStore.user?.email || '')

// Report filters
const reportFilters = ref<AttendanceFiltersType>({
  instrument: '',
  level: '',
  teacherId: '',
  startDate: '',
  endDate: ''
})

// Control flag to prevent reactive loops
const isUpdating = ref(false)

// Selected date information
const selectedDateInfo = ref<{
  hasRegistrations: boolean
  registeredClasses: string[]
  unregisteredClasses: string[]
}>({
  hasRegistrations: false,
  registeredClasses: [],
  unregisteredClasses: []
})

// Modal state
const showClassesModal = ref<boolean>(false)
const modalDate = ref<string>('')
const classesForDate = ref<any[]>([])

// ============= COMPUTED PROPERTIES =============
// Calendar marks for dates with attendance records
const markedDates = computed(() => {
  return attendanceStore.datesWithRecords.map(date => ({
    date,
    type: 'attendance',
    count: attendanceStore.getRegisteredClassesForDate(date).length,
    userId: authStore.user?.uid || ''
  }))
})

// Load emergency class data if needed
const loadEmergencyClassInfo = async () => {
  if (!selectedClass.value) return
  
  try {
    isLoadingEmergencyClass.value = true
    const isEmergency = await attendanceStore.isEmergencyClass(selectedClass.value)
    
    if (isEmergency) {
      emergencyClassInfo.value = await attendanceStore.getClassInfo(selectedClass.value, selectedDate.value)
    } else {
      emergencyClassInfo.value = null
    }
  } catch (error) {
    console.error('Error loading emergency class info:', error)
    emergencyClassInfo.value = null
  } finally {
    isLoadingEmergencyClass.value = false
  }
}

// Selected class name - now handles both regular and emergency classes
const selectedClassName = computed(() => {
  if (isLoadingEmergencyClass.value) return 'Cargando...'
  
  // If it's an emergency class and we have the data
  if (emergencyClassInfo.value) {
    return emergencyClassInfo.value.nombreMateria || 'Clase de Emergencia'
  }
  
  if (!selectedClass.value) return ''
  
  // Look for regular classes
  const regularClass = classesStore.classes.find(c => c.id === selectedClass.value || c.name === selectedClass.value)
  if (regularClass) {
    const name = regularClass.name
    console.log('[AttendanceView] selectedClassName computed (regular):', name)
    return name
  }
  
  // If not found in regular classes, it might be an emergency class ID
  console.log('[AttendanceView] selectedClassName computed (emergency ID):', selectedClass.value)
  return `Clase ID: ${selectedClass.value}`
})

// Classes with records for selected date
const classesWithRecordsForSelectedDate = computed(() => {
  const classIds = attendanceStore.getRegisteredClassesForDate(selectedDate.value)
  return classIds.map(classId => ({
    classId,
    date: selectedDate.value
  }))
})

// Simple marked dates for DateClassSelector (string[])
const simpleMarkedDates = computed(() => {
  return attendanceStore.datesWithRecords
})

// Available classes (computed from classesForDate)
const availableClasses = computed(() => {
  return classesForDate.value || []
})

// Available class dates based on schedule
const availableClassDates = computed(() => {
  if (!selectedClass.value) return []
  
  const currentTeacherId = authStore.user?.uid
  const classInfo = classesStore.getClassById(selectedClass.value)
  
  let scheduledDays: (string | number)[] = []
  if (classInfo?.schedule?.slots) {
    const days = classInfo.schedule.slots.map(slot => slot.day)
    scheduledDays = [...new Set(days)]
  }
  
  if (!currentTeacherId || scheduledDays.length === 0) return []
  
  return scheduledDays.filter(day => {
    const classesForDay = classesStore.getClassesByDayAndTeacherId(day, currentTeacherId)
    return classesForDay && classesForDay.length > 0
  })
})

// Observations count
const getObservationsCount = computed(() => {
  return attendanceStore.currentAttendanceDoc?.data.observación ? 1 : 0
})

// ============= TOAST NOTIFICATIONS =============
const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg
  messageType.value = type
  showMessage.value = true
  setTimeout(() => { showMessage.value = false }, 3000)
}

// ============= DATE AND CLASS MANAGEMENT =============
// Update view while preserving state
const updateView = (newView: 'calendar' | 'class-select' | 'attendance-form') => {
  view.value = newView
  error.value = null
  
  if (newView === 'calendar') {
    selectedClass.value = ''
  }
}

// Navigate back to calendar from any view
const navigateToCalendar = () => {
  updateView('calendar')
}

const navigateToClassSelector = () => {
  if (!selectedDate.value) {
    selectedDate.value = getCurrentDate()
  }
  // En vez de ir directamente al selector de clases, ahora mostramos el modal
  selectDate(selectedDate.value)
}

// Select date with proper state management
const selectDate = async (date: string | { date: string } | { date: string, [key: string]: any }) => {
  console.log('Selecting date:', date)
  try {
    if (isUpdating.value) return
    isUpdating.value = true
    
    let dateStr: string
    
    if (typeof date === 'string') {
      dateStr = date
    } else if (date && typeof date === 'object' && 'date' in date) {
      dateStr = date.date
    } else {
      throw new Error('Invalid date format')
    }
    
    selectedDate.value = dateStr
    modalDate.value = dateStr
    
    console.log(`[AttendanceView] Fecha seleccionada: ${dateStr}`)
    
    // Update selected date info
    await updateSelectedDateInfo(dateStr)
    
    // Fetch classes for the selected date
    await fetchClassesForDate(dateStr)
    
    console.log(`[AttendanceView] Clases encontradas para ${dateStr}:`, classesForDate.value.length)
    
    // IMPORTANTE: Mostrar el modal con las clases disponibles
    showClassesModal.value = true
  } catch (err) {
    console.error('Error selecting date:', err)
    showToast('Error al seleccionar fecha', 'error')
  } finally {
    isUpdating.value = false
  }
}

// Fetch classes for the selected date
const fetchClassesForDate = async (dateStr: string) => {
  // Esta función se encarga de obtener las clases para la fecha seleccionada
  // Incluye clases programadas, clases compartidas, y clases con asistencia registrada
  try {
    const date = parseISO(dateStr)
    const dayOfWeek = format(date, 'EEEE', { locale: es })
    
    const teacherId = authStore.user?.uid
    if (!teacherId) {
      console.error('No hay un usuario logueado con uid')
      return []
    }
    
    console.log(`[AttendanceView] Buscando clases para el maestro ${teacherId} en la fecha ${dateStr} (${dayOfWeek})`)
    console.log(`[AttendanceView] Total de clases en el store:`, classesStore.classes.length)
    console.log(`[AttendanceView] Clases con maestros:`, classesStore.classes.filter(c => c.teachers?.length > 0).length)
    
    // 1. Obtener clases programadas donde el maestro es el encargado principal
    const scheduledClasses = classesStore.getClassesByDayAndTeacherId(dayOfWeek, teacherId) || []
    console.log(`[AttendanceView] Clases programadas como encargado para ${dayOfWeek}:`, scheduledClasses.length)
    
    // 2. Obtener clases compartidas donde el maestro es asistente
    const sharedClasses = classesStore.classes.filter(cls => {
      // Verificar si el maestro es asistente en esta clase
      const isAssistant = cls.teachers?.some(teacher => 
        teacher.teacherId === teacherId && teacher.role === TeacherRole.ASSISTANT
      )
      
      if (!isAssistant) return false
      
      // Verificar si la clase está programada para este día
      if (!cls.schedule?.slots || !Array.isArray(cls.schedule.slots)) {
        console.log(`[AttendanceView] Clase compartida ${cls.name} no tiene schedule.slots válido`)
        return false
      }
      
      const hasSlotForDay = cls.schedule.slots.some(slot => {
        const slotDay = slot.day?.toLowerCase()?.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const currentDay = dayOfWeek.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        console.log(`[AttendanceView] Comparando días - Slot: '${slotDay}' vs Actual: '${currentDay}' (${slotDay === currentDay})`)
        return slotDay === currentDay
      })
      
      if (hasSlotForDay) {
        console.log(`[AttendanceView] ✅ Clase compartida ${cls.name} coincide con el día ${dayOfWeek}`)
      } else {
        console.log(`[AttendanceView] ❌ Clase compartida ${cls.name} NO coincide con el día ${dayOfWeek}`)
      }
      
      return hasSlotForDay
    })
    console.log(`[AttendanceView] Clases compartidas como asistente para ${dayOfWeek}:`, sharedClasses.length)
    console.log(`[AttendanceView] Detalles de clases compartidas:`, sharedClasses.map(c => ({
      id: c.id,
      name: c.name,
      teachers: c.teachers,
      schedule: c.schedule
    })))
    
    // 3. Obtener clases que tienen asistencia registrada para esta fecha específica
    const attendanceRecords = attendanceStore.attendanceDocuments.filter(record => 
      record.fecha === dateStr && record.teacherId === teacherId
    )
    console.log(`[AttendanceView] Registros de asistencia para ${dateStr}:`, attendanceRecords.length)
    console.log(`[AttendanceView] Detalles de registros de asistencia:`, attendanceRecords.map(r => ({
      classId: r.classId,
      fecha: r.fecha,
      teacherId: r.teacherId
    })))
    
    // 4. IMPORTANTE: También buscar clases por nombre si classId no coincide
    const attendanceRecordsByName = attendanceStore.attendanceDocuments.filter(record => {
      if (record.fecha === dateStr && record.teacherId === teacherId) {
        // Si ya está en attendanceRecords por classId, no duplicar
        const alreadyIncluded = attendanceRecords.some(ar => ar.classId === record.classId)
        if (!alreadyIncluded) {
          // Buscar la clase en el store para verificar que existe
          const classInfo = classesStore.classes.find(c => c.id === record.classId)
          return !!classInfo
        }
      }
      return false
    })
    console.log(`[AttendanceView] Registros adicionales por nombre para ${dateStr}:`, attendanceRecordsByName.length)
    
    // Combinar ambos arrays de registros
    const allAttendanceRecords = [...attendanceRecords, ...attendanceRecordsByName]
    console.log(`[AttendanceView] Total de registros de asistencia (combinados): ${allAttendanceRecords.length}`)
    
    // 5. Crear un mapa para evitar duplicados y combinar información
    const classMap = new Map()
    
    // Procesar clases programadas (encargado principal)
    for (const cls of scheduledClasses) {
      const hasAttendance = attendanceStore.isClassRegistered(dateStr, cls.id)
      
      classMap.set(cls.id, {
        ...cls,
        isScheduled: true,
        hasAttendance: hasAttendance,
        type: 'scheduled', // Tipo: clase programada
        myRole: 'LEAD', // Rol del maestro en esta clase
        registered: hasAttendance,
        status: hasAttendance ? 'Registrada' : 'Pendiente'
      })
    }
    
    // Procesar clases compartidas (asistente)
    for (const cls of sharedClasses) {
      const hasAttendance = attendanceStore.isClassRegistered(dateStr, cls.id)
      
      // Obtener permisos del maestro asistente
      const myTeacherData = cls.teachers?.find(t => t.teacherId === teacherId)
      const canTakeAttendance = myTeacherData?.permissions?.canTakeAttendance || false
      
      console.log(`[AttendanceView] Procesando clase compartida ${cls.name}:`, {
        hasAttendance,
        myTeacherData,
        canTakeAttendance
      })
      
      classMap.set(cls.id, {
        ...cls,
        isScheduled: true,
        hasAttendance: hasAttendance,
        type: 'shared', // Tipo: clase compartida
        myRole: 'ASSISTANT', // Rol del maestro en esta clase
        myPermissions: myTeacherData?.permissions,
        canTakeAttendance,
        registered: hasAttendance,
        status: hasAttendance ? 'Registrada' : 'Compartida'
      })
    }
    
    // Procesar clases con asistencia registrada (pueden ser clases extra o de recuperación)
    for (const record of allAttendanceRecords) {
      console.log(`[AttendanceView] Procesando registro de asistencia:`, {
        classId: record.classId,
        fecha: record.fecha
      })
      
      const existingClass = classMap.get(record.classId)
      
      if (existingClass) {
        // Ya existe en las programadas/compartidas, actualizar info
        console.log(`[AttendanceView] Clase ${record.classId} ya existe en el mapa, actualizando...`)
        existingClass.hasAttendance = true
        existingClass.registered = true
        existingClass.status = existingClass.type === 'shared' ? 'Registrada (Compartida)' : 'Registrada'
        existingClass.attendanceRecord = record
      } else {
        // Clase no programada pero con asistencia (clase extra/recuperación)
        console.log(`[AttendanceView] Clase ${record.classId} NO existe en el mapa, buscando información...`)
        
        // Intentar obtener información de la clase desde el store
        let classInfo = classesStore.classes.find(c => c.id === record.classId)
        
        if (classInfo) {
          console.log(`[AttendanceView] ✅ Información de clase encontrada para ${record.classId}, agregando al mapa`)
          classMap.set(record.classId, {
            ...classInfo,
            isScheduled: false,
            hasAttendance: true,
            type: 'recorded', // Tipo: clase con asistencia registrada
            myRole: 'LEAD', // Asumir que es encargado si registró asistencia
            registered: true,
            status: 'Registrada (Extra)',
            attendanceRecord: record
          })
        } else {
          // Clase no encontrada en el store, crear entrada básica
          console.log(`[AttendanceView] ❌ Clase no encontrada en store, creando entrada básica para ${record.classId}`)
          classMap.set(record.classId, {
            id: record.classId,
            name: `Clase ${record.classId}`,
            isScheduled: false,
            hasAttendance: true,
            type: 'recorded',
            myRole: 'LEAD',
            registered: true,
            status: 'Registrada (Extra)',
            attendanceRecord: record,
            studentIds: []
          })
        }
      }
    }
    
    // 4.5. Obtener clases emergentes para esta fecha
    const emergencyClasses = await attendanceStore.getEmergencyClassesForDate(dateStr, teacherId)
    console.log(`[AttendanceView] Clases emergentes para ${dateStr}:`, emergencyClasses.length)
    
    // Procesar clases emergentes
    for (const emergencyClass of emergencyClasses) {
      console.log(`[AttendanceView] Procesando clase emergente:`, {
        id: emergencyClass.id,
        name: emergencyClass.name,
        teacherId: emergencyClass.teacherId
      })
      
      // Agregar clase emergente al mapa si no existe ya
      if (!classMap.has(emergencyClass.id)) {
        classMap.set(emergencyClass.id, {
          id: emergencyClass.id,
          name: emergencyClass.name,
          isScheduled: false,
          hasAttendance: true,
          type: 'emergency', // Tipo: clase emergente
          myRole: 'LEAD', // El creador es siempre encargado
          registered: true,
          status: 'Clase Emergente',
          studentIds: emergencyClass.studentIds || [],
          teacherId: emergencyClass.teacherId,
          isEmergencyClass: true
        })
      }
    }
    
    // 5. Convertir el mapa a array y procesar información adicional
    const allClasses = Array.from(classMap.values())
    
    const classesWithStatus = await Promise.all(allClasses.map(async (cls) => {
      // Conseguir información del profesor
      let teacherInfo = ''
      
      if (cls.name) {
        teacherInfo = cls.name
      }
      
      if (cls.teacherId) {
        if (cls.teacherId === authStore.user?.uid && authStore.user?.email) {
          teacherInfo += ` (${authStore.user.email})`
        } else if (teacherInfo) {
          teacherInfo += ` (ID: ${cls.teacherId.substring(0, 5)}...)`
        } else {
          teacherInfo = `Profesor ${cls.teacherId.substring(0, 6)}...` 
        }
      }
      
      // Obtener horario formateado
      let horarioFormateado = 'Horario no especificado'
      
      if (cls.schedule?.slots && cls.schedule.slots.length > 0) {
        const slot = cls.schedule.slots.find(s => {
          const slotDay = s.day.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const currentDay = dayOfWeek.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return slotDay === currentDay
        })
        
        if (slot) {
          horarioFormateado = formatearHorario(slot.startTime, slot.endTime)
        }
      } else if (cls.attendanceRecord) {
        // Si no hay horario programado pero hay registro de asistencia, mostrar "Clase extra"
        horarioFormateado = 'Clase extra/recuperación'
      }
      
      // Función para formatear horario en formato 12 horas
      function formatearHorario(inicio: string, fin: string): string {
        try {
          const formato12h = (timeStr: string) => {
            if (!timeStr) return ''
            if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
            
            if (timeStr.includes(':')) {
              const [hours, minutes] = timeStr.split(':')
              const hour = parseInt(hours, 10)
              const ampm = hour >= 12 ? 'PM' : 'AM'
              const hour12 = hour % 12 || 12
              return `${hour12}:${minutes} ${ampm}`
            }
            return timeStr
          }
          
          return `${formato12h(inicio)} - ${formato12h(fin)}`
        } catch (e) {
          console.error('Error al formatear horario:', e)
          return `${inicio} - ${fin}`
        }
      }
      
      return {
        ...cls,
        teacher: teacherInfo,
        horario: horarioFormateado,
        studentCount: cls.studentIds?.length || 0,
        // Información adicional para el modal
        classType: cls.type,
        isScheduledClass: cls.isScheduled,
        hasAttendanceRecord: cls.hasAttendance,
        // Información específica de clases compartidas
        isSharedClass: cls.type === 'shared',
        teacherRole: cls.myRole,
        teacherPermissions: cls.myPermissions
      }
    }))
    
    // 6. Ordenar las clases: primero las programadas, luego las compartidas, luego las emergentes, luego las extra
    classesWithStatus.sort((a, b) => {
      // Primero las programadas propias
      if (a.type === 'scheduled' && b.type !== 'scheduled') return -1
      if (a.type !== 'scheduled' && b.type === 'scheduled') return 1
      
      // Luego las compartidas
      if (a.type === 'shared' && b.type !== 'shared' && b.type !== 'scheduled') return -1
      if (a.type !== 'shared' && a.type !== 'scheduled' && b.type === 'shared') return 1
      
      // Luego las emergentes
      if (a.type === 'emergency' && b.type === 'recorded') return -1
      if (a.type === 'recorded' && b.type === 'emergency') return 1
      
      // Dentro del mismo tipo, ordenar por nombre
      return (a.name || '').localeCompare(b.name || '')
    })
    
    console.log(`[AttendanceView] Total de clases encontradas: ${classesWithStatus.length}`)
    console.log(`[AttendanceView] - Programadas (encargado): ${classesWithStatus.filter(c => c.type === 'scheduled').length}`)
    console.log(`[AttendanceView] - Compartidas (asistente): ${classesWithStatus.filter(c => c.type === 'shared').length}`)
    console.log(`[AttendanceView] - Emergentes: ${classesWithStatus.filter(c => c.type === 'emergency').length}`)
    console.log(`[AttendanceView] - Con asistencia extra: ${classesWithStatus.filter(c => c.type === 'recorded').length}`)
    
    classesForDate.value = classesWithStatus
  } catch (error) {
    console.error('[AttendanceView] Error al obtener las clases:', error)
    classesForDate.value = []
  }
}

// Handle class selection
function handleClassSelect(classId: string) {
  showClassesModal.value = false
  // Actualizar la clase seleccionada en el store para mantener coherencia
  attendanceStore.selectedClass = classId
  
  // Navegar a la ruta correcta según el rol del usuario
  const userRole = authStore.user?.role?.toLowerCase() || ''
  console.log(`[AttendanceView] handleClassSelect: Usuario completo:`, authStore.user)
  console.log(`[AttendanceView] handleClassSelect: Rol del usuario: '${userRole}' (original: '${authStore.user?.role}')`)
  let routePath = ''
  
  if (userRole === 'maestro' || userRole === 'teacher') {
    // Formatear fecha para maestros (YYYYMMDD)
    const dateFormatted = selectedDate.value.replace(/-/g, '')
    routePath = `/teacher/attendance/${dateFormatted}/${classId}`
    console.log(`[AttendanceView] handleClassSelect: Rol maestro detectado, navegando a: ${routePath}`)
  } else {
    // Para admin/director usar la ruta original
    routePath = `/attendance/${selectedDate.value}/${classId}`
    console.log(`[AttendanceView] handleClassSelect: Rol admin/director, navegando a: ${routePath}`)
  }
  
  console.log(`[AttendanceView] Navegando a la clase ${classId} en la fecha ${selectedDate.value} con rol ${userRole} -> ${routePath}`)
  router.push(routePath)
  loadAttendanceData(classId)
  updateView('attendance-form')
}

// Handle emergency class creation
function handleCreateEmergencyClass(date: string) {
  console.log(`[AttendanceView] Crear clase emergente para la fecha: ${date}`);
  
  // Cerrar el modal de clases y abrir el modal de clase emergente
  showClassesModal.value = false;
  modalDate.value = date;
  selectedDate.value = date;
  
  // Abrir el modal de clase emergente
  showEmergencyClassModal.value = true;
}

// Update selected date information
const updateSelectedDateInfo = async (date: string) => {
  try {
    const teacherId = authStore.user?.uid || ''
    if (!teacherId) {
      console.warn('No teacher ID available')
      return
    }

    // Usar la nueva función del store que maneja mejor la lógica
    const dateInfo = attendanceStore.getDateClassInfo(date, teacherId)
    
    selectedDateInfo.value = {
      hasRegistrations: dateInfo.hasRegistrations,
      registeredClasses: dateInfo.registeredClasses.map(rc => rc.classId),
      unregisteredClasses: dateInfo.unregisteredClasses.map(uc => uc.classId)
    }
  } catch (err) {
    console.error('Error updating date info:', err)
  }
}

// Select class and load attendance data
const selectClass = async (className: string) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos de clase...'
    
    selectedClass.value = className
    
    // Cargar estudiantes específicos de la clase primero
    console.log(`[AttendanceView] Cargando estudiantes para clase: ${className}`)
    await studentsStore.getStudentsByClass(className)
    
    await loadAttendanceData(className)
    updateView('attendance-form')
    
    // Update URL for deep linking
    const formattedDate = selectedDate.value.replace(/-/g, '')
    router.push(`/attendance/${formattedDate}/${className}`)
  } catch (err) {
    console.error('Error selecting class:', err)
    showToast('Error al cargar la clase', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Load attendance data for selected class and date
const loadAttendanceData = async (className: string) => {
  try {
    console.log('[AttendanceView] loadAttendanceData:', { className, selectedDate: selectedDate.value })
    isLoading.value = true
    loadingMessage.value = 'Cargando asistencia...'
    
    // Reset attendance records
    attendanceStore.attendanceRecords = {}
    attendanceStore.selectedClass = className
    attendanceStore.selectedDate = selectedDate.value
    
    console.log('[AttendanceView] Before fetchAttendanceDocument')
    
    // Fetch attendance document
    const attendanceDoc = await attendanceStore.fetchAttendanceDocument(selectedDate.value, className)
    
    console.log('[AttendanceView] After fetchAttendanceDocument, document:', attendanceDoc ? 'FOUND' : 'NOT FOUND')
    console.log('[AttendanceView] Attendance records:', attendanceStore.attendanceRecords)
    
    // Load students for the class
    const students = studentsStore.getStudentsByClass(className)
    console.log('[AttendanceView] Students for class:', students.length)
    
    // Only initialize attendance records for students not already in the document
    // This preserves existing attendance data from Firestore
    students.forEach(student => {
      if (!(student.id in attendanceStore.attendanceRecords)) {
        // Solo asignar 'Ausente' a estudiantes que NO tienen registro en Firestore
        attendanceStore.attendanceRecords[student.id] = 'Ausente'
      }
    })
    
    // Only log final records in development or when debugging is needed
    if (process.env.NODE_ENV === 'development' && window.localStorage.getItem('attendance-debug') === 'true') {
      console.log('[AttendanceView] Final attendance records after initialization:', attendanceStore.attendanceRecords)
    }
    
    // Only run automatic debugging if explicitly enabled and document not found
    if (!attendanceDoc && students.length > 0 && window.localStorage.getItem('attendance-auto-debug') === 'true') {
      console.warn('[AttendanceView] No se encontró documento de asistencia - ejecutando debugging automático')
      try {
        await attendanceStore.debugAttendanceSystem(selectedDate.value, className, authStore.user?.uid ?? '')
      } catch (debugErr) {
        console.error('[AttendanceView] Error en debugging automático:', debugErr)
      }
    }
    
    // Verify data integrity
    verifyAttendanceDataIntegrity()
    
    // Only update analytics if needed (with caching)
    if (window.localStorage.getItem('attendance-analytics-enabled') === 'true') {
      await attendanceStore.updateAnalytics(true) // Skip if recently updated
    }
  } catch (err) {
    console.error('Error loading attendance data:', err)
    showToast('Error al cargar datos de asistencia', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Force reload attendance data with verification
const forceReloadAttendanceData = async () => {
  try {
    console.log('[AttendanceView] Forzando recarga de datos de asistencia...')
    isLoading.value = true
    loadingMessage.value = 'Recargando datos de asistencia...'
    
    // Clear current data
    attendanceStore.attendanceRecords = {}
    attendanceStore.currentAttendanceDoc = null
    
    // Reload with force flag
    await attendanceStore.fetchAttendanceDocument(selectedDate.value, selectedClass.value, true)
    
    // Reinitialize student records
    const students = studentsStore.getStudentsByClass(selectedClass.value)
    students.forEach(student => {
      if (!(student.id in attendanceStore.attendanceRecords)) {
        attendanceStore.attendanceRecords[student.id] = 'Ausente'
      }
    })
    
    // Verify integrity after reload
    verifyAttendanceDataIntegrity()
    
    showToast('Datos de asistencia recargados correctamente', 'success')
  } catch (err) {
    console.error('Error recargando datos:', err)
    showToast('Error al recargar datos de asistencia', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Debug function to diagnose attendance system issues
const runAttendanceDebug = async () => {
  try {
    if (!selectedClass.value || !selectedDate.value) {
      showToast('Selecciona una clase y fecha para hacer debugging', 'error')
      return
    }
    
    isLoading.value = true
    loadingMessage.value = 'Ejecutando debugging del sistema de asistencia...'
    
    console.log('[AttendanceView] Ejecutando debugging avanzado...')
    
    // Run the advanced debugging function
    const debugResults = await attendanceStore.debugAttendanceSystem(selectedDate.value, selectedClass.value, authStore.user?.uid ?? '')
    
    // Show results in console and UI
    if (debugResults?.targetDocument) {
      showToast('✅ Documento encontrado - revisar consola para detalles', 'success')
      console.log('[AttendanceView] Debugging completado - documento encontrado')
    } else {
      showToast('❌ No se encontró documento - revisar consola para detalles', 'error')
      console.log('[AttendanceView] Debugging completado - documento NO encontrado')
    }
    
    // Also verify current state
    verifyAttendanceDataIntegrity()
    
  } catch (err) {
    console.error('[AttendanceView] Error en debugging:', err)
    showToast('Error ejecutando debugging', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// ============= DEBUGGING HELPERS =============
// Optimized verification - only detailed logs when debugging enabled
const verifyAttendanceDataIntegrity = () => {
  const debugEnabled = window.localStorage.getItem('attendance-debug') === 'true'
  
  if (!debugEnabled) {
    // Quick verification without detailed logs
    if (attendanceStore.currentAttendanceDoc) {
      const doc = attendanceStore.currentAttendanceDoc
      const totalInArrays = (doc.data.presentes?.length || 0) + 
                           (doc.data.ausentes?.length || 0) + 
                           (doc.data.tarde?.length || 0)
      const totalInRecords = Object.keys(attendanceStore.attendanceRecords).length
      
      if (totalInArrays !== totalInRecords) {
        console.warn('[AttendanceView] ⚠️ Data inconsistency detected - enable debug mode for details')
      }
    }
    return
  }
  
  // Detailed debugging when enabled
  console.log('=== VERIFICACIÓN DE INTEGRIDAD DE DATOS ===')
  console.log('Fecha seleccionada:', selectedDate.value)
  console.log('Clase seleccionada:', selectedClass.value)
  console.log('Documento actual en store:', attendanceStore.currentAttendanceDoc ? JSON.parse(JSON.stringify(attendanceStore.currentAttendanceDoc)) : null)
  console.log('Registros de asistencia en store:', JSON.parse(JSON.stringify(attendanceStore.attendanceRecords)))
  
  if (attendanceStore.currentAttendanceDoc) {
    const doc = attendanceStore.currentAttendanceDoc
    console.log('Arrays de Firestore:')
    console.log('- Presentes:', doc.data.presentes)
    console.log('- Ausentes:', doc.data.ausentes)  
    console.log('- Tarde:', doc.data.tarde)
    console.log('- Justificaciones:', doc.data.justificacion)
    
    // Verificar consistencia
    const totalInArrays = (doc.data.presentes?.length || 0) + 
                         (doc.data.ausentes?.length || 0) + 
                         (doc.data.tarde?.length || 0)
    const totalInRecords = Object.keys(attendanceStore.attendanceRecords).length
    
    console.log(`Total en arrays de Firestore: ${totalInArrays}`)
    console.log(`Total en registros de asistencia: ${totalInRecords}`)
    
    if (totalInArrays !== totalInRecords) {
      console.warn('⚠️ INCONSISTENCIA DETECTADA: Los totales no coinciden')
    } else {
      console.log('✅ Datos consistentes')
    }
  }
  console.log('=== FIN VERIFICACIÓN ===')
}

// ============= ATTENDANCE MANAGEMENT =============
// Handle attendance status updates
const handleUpdateStatus = (studentId: string, status: string) => {
  // Type assertion to ensure status is valid AttendanceStatus
  const validStatus = status as AttendanceStatus
  const previousStatus = attendanceStore.attendanceRecords[studentId]
  
  console.log(`[AttendanceView] Actualizando estado de asistencia:`)
  console.log(`- Estudiante: ${studentId}`)
  console.log(`- Estado anterior: ${previousStatus}`)
  console.log(`- Estado nuevo: ${validStatus}`)
  
  attendanceStore.attendanceRecords[studentId] = validStatus
  
  // Verify data after update
  setTimeout(() => verifyAttendanceDataIntegrity(), 100)
  
  // Show observation alert if needed
  if (status === 'Ausente' || status === 'Tardanza') {
    showObservationAlert.value = true
    setTimeout(() => { showObservationAlert.value = false }, 3000)
  }
}

// Check if date is in class schedule
const isDateInClassSchedule = (date: string, classId: string): boolean => {
  try {
    const scheduledDays = attendanceStore.getClassScheduleDays(classId)
    if (!scheduledDays?.length) return false
    
    const dayName = format(parseISO(date), 'EEEE', { locale: es }).toLowerCase()
    return scheduledDays.includes(dayName)
  } catch (err) {
    console.error('Error checking class schedule:', err)
    return false
  }
}

// ============= MODAL HANDLERS =============
// Open observation modal
const handleOpenObservation = async (student: SelectedStudent | null, observation?: ClassObservation | null) => {
  console.log('[Aqui] handleOpenObservation llamado con estudiante:', student, 'y observación:', observation)
  console.log('[Aqui] Estado anterior de showObservationsModal:', showObservationsModal.value)
  
  // Validar permisos antes de abrir el modal (con verificación segura)
  const currentClass = availableClasses.value?.find(cls => cls.id === selectedClass.value)
  if (currentClass?.isSharedClass && currentClass?.teacherPermissions) {
    const canAdd = currentClass.teacherPermissions.canAddObservations
    const canView = currentClass.teacherPermissions.canViewObservations
    
    if (!canAdd && !canView) {
      showToast('No tienes permisos para gestionar observaciones en esta clase compartida', 'error')
      return
    }
    
    if (observation && !canView) {
      showToast('No tienes permisos para ver observaciones en esta clase compartida', 'error')
      return
    }
    
    if (!observation && !canAdd) {
      showToast('No tienes permisos para crear observaciones en esta clase compartida', 'error')
      return
    }
  }
  
  selectedStudentForObs.value = student
  observationToEdit.value = observation || null; // Set the observation to edit/view
  showObservationsModal.value = true
  
  console.log('[AttendanceView] Estado después de setear showObservationsModal:', showObservationsModal.value)
  console.log('[AttendanceView] selectedStudentForObs:', selectedStudentForObs.value)
  console.log('[AttendanceView] observationToEdit:', observationToEdit.value)
  console.log('[AttendanceView] selectedClass:', selectedClass.value)
  console.log('[AttendanceView] selectedDate:', selectedDate.value)
  
  await nextTick()
  
  console.log('[AttendanceView] Después de nextTick, showObservationsModal:', showObservationsModal.value)
}

// Handle observation save
const handleObservationAdded = async (observations: string) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Guardando observación...'
    
    console.log(`[AttendanceView] Guardando observación para clase ${selectedClass.value} - fecha ${selectedDate.value}:`, observations)
    
    await attendanceStore.updateObservations(selectedDate.value, selectedClass.value, observations)
    
    // Verify data after saving observation
    setTimeout(() => verifyAttendanceDataIntegrity(), 100)
    
    showToast('Observación guardada correctamente', 'success')
    showObservationsModal.value = false
  } catch (err) {
    console.error('Error saving observation:', err)
    showToast('Error al guardar la observación', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Open justification modal
const handleOpenJustification = (student: SelectedStudent) => {
  const studentData = studentsStore.getStudentsByClass(selectedClass.value).find((s: any) => s.id === student.id)
  selectedStudentForJustification.value = studentData
  showJustificationModal.value = true
}

// Handle justification save
const handleSaveJustification = async (data: { reason: string; documentUrl?: string; file?: File }) => {
  try {
    if (!selectedStudentForJustification.value) return
    
    isLoading.value = true
    loadingMessage.value = 'Guardando justificación...'
    
    const studentId = selectedStudentForJustification.value.id
    const previousStatus = attendanceStore.attendanceRecords[studentId]
    
    console.log(`[AttendanceView] Guardando justificación para estudiante ${studentId}:`)
    console.log(`- Estado anterior: ${previousStatus}`)
    console.log(`- Razón: ${data.reason}`)
    
    // Update attendance status to justified
    attendanceStore.attendanceRecords[studentId] = 'Justificado'
    
    // Save justification
    if (data.file) {
      await attendanceStore.addJustificationToAttendance(
        studentId,
        selectedDate.value,
        selectedClass.value,
        data.reason,
        data.file
      )
    } else {
      // Create JustificationData object for the store function
      const justificationData = {
        studentId,
        classId: selectedClass.value,
        fecha: selectedDate.value,
        reason: data.reason,
        documentUrl: data.documentUrl || '',
        approvalStatus: 'pending' as const,
        createdAt: new Date(),
        timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
      await attendanceStore.addJustification(justificationData)
    }
    
    // Verify data integrity after justification
    setTimeout(() => verifyAttendanceDataIntegrity(), 100)
    
    showJustifiedAbsenceModal.value = false
    showToast('Justificación guardada correctamente', 'success')
  } catch (err) {
    console.error('Error saving justification:', err)
    showToast('Error al guardar la justificación', 'error')
    
    // Restore previous status if error occurred
    if (selectedStudentForJustification.value) {
      const studentId = selectedStudentForJustification.value.id
      // Try to restore from current document or set to absent
      const currentDoc = attendanceStore.currentAttendanceDoc
      if (currentDoc) {
        if (currentDoc.data.presentes?.includes(studentId)) {
          attendanceStore.attendanceRecords[studentId] = 'Presente'
        } else if (currentDoc.data.tarde?.includes(studentId)) {
          attendanceStore.attendanceRecords[studentId] = 'Tardanza'
        } else {
          attendanceStore.attendanceRecords[studentId] = 'Ausente'
        }
      }
    }
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// ============= EXPORT AND ANALYTICS =============
const toggleAnalytics = () => { showAnalytics.value = !showAnalytics.value }
const toggleTrends = () => { showTrends.value = !showTrends.value }
const openReportModal = () => { showReportModal.value = true }
const openExportModal = () => { showExportModal.value = true }

const handleOpenExport = (value: boolean) => {
  showExportModal.value = value
}

const handleGenerateReport = (filters: AttendanceFiltersType) => {
  reportFilters.value = filters
  console.log('Generating report with filters:', filters)
}

// Emergency class handlers
const handleEmergencyClassSubmitted = async (emergencyClassData: any) => {
  console.log('[AttendanceView] Datos de clase emergente recibidos:', emergencyClassData);
  
  try {
    // La clase emergente ya fue creada en el modal usando useEmergencyClasses
    // Ahora necesitamos crear el documento de asistencia y cargar la vista
    
    console.log('[AttendanceView] Clase emergente creada exitosamente:', {
      id: emergencyClassData.emergencyClassId,
      nombre: emergencyClassData.className,
      tipo: emergencyClassData.classType,
      fecha: emergencyClassData.date,
      horario: `${emergencyClassData.startTime} - ${emergencyClassData.endTime}`,
      instrumento: emergencyClassData.instrument,
      motivo: emergencyClassData.reason,
      estudiantes: emergencyClassData.selectedStudents,
      maestro: emergencyClassData.teacherId
    });
    
    // Mostrar mensaje de éxito
    showToast('Clase emergente creada exitosamente', 'success');
    
    // Cerrar el modal
    showEmergencyClassModal.value = false;
    
    // Ahora cargar la vista de asistencia para la clase emergente
    selectedClass.value = emergencyClassData.emergencyClassId || emergencyClassData.className;
    selectedDate.value = emergencyClassData.date;
    
    // Cargar datos de asistencia para la clase emergente
    await loadEmergencyClassAttendanceData(emergencyClassData);
    
    // Cambiar a la vista de asistencia
    updateView('attendance-form');
    
  } catch (error) {
    console.error('[AttendanceView] Error al procesar clase emergente:', error);
    showToast('Error al procesar la clase emergente', 'error');
  }
}

// Load attendance data for emergency class
const loadEmergencyClassAttendanceData = async (emergencyClassData: any) => {
  try {
    console.log('[AttendanceView] Cargando datos de asistencia para clase emergente:', emergencyClassData);
    isLoading.value = true;
    loadingMessage.value = 'Preparando clase emergente...';

    // Usar el nuevo método del store para crear el documento de asistencia
    const attendanceDocId = await attendanceStore.createEmergencyClassAttendanceDocument({
      emergencyClassId: emergencyClassData.emergencyClassId,
      className: emergencyClassData.className,
      date: emergencyClassData.date,
      selectedStudents: emergencyClassData.selectedStudents,
      teacherId: emergencyClassData.teacherId
    });

    console.log('[AttendanceView] Documento de asistencia creado con ID:', attendanceDocId);
    console.log('[AttendanceView] Estado de asistencia inicial:', attendanceStore.attendanceRecords);

    // Actualizar el selectedClassName computed
    selectedClass.value = emergencyClassData.emergencyClassId;

    // Verify data integrity
    verifyAttendanceDataIntegrity();

    // Show success message
    showToast('Clase emergente preparada para tomar asistencia', 'success');

  } catch (err) {
    console.error('Error loading emergency class attendance data:', err);
    showToast('Error al preparar la clase emergente', 'error');
    throw err; // Re-throw to handle in parent
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
}

const handleEmergencyClassCancelled = () => {
  console.log('[AttendanceView] Creación de clase emergente cancelada');
  showEmergencyClassModal.value = false;
}

// Calendar modal handlers
const handleCalendarSelect = (date: string | { date: string }) => {
  let dateStr: string
  if (typeof date === 'string') {
    dateStr = date
  } else if (date && typeof date === 'object' && 'date' in date) {
    dateStr = date.date
  } else {
    console.error('Invalid date parameter:', date)
    return
  }
  selectedDate.value = dateStr
  showCalendarModal.value = false
  updateView('class-select')
}

const handleMonthChange = (newMonth: Date) => {
  currentMonth.value = newMonth
  console.log('Month changed to:', newMonth)
}

const handleDateChange = async (newDate: string) => {
  if (isUpdating.value) return
  isUpdating.value = true
  
  try {
    selectedDate.value = newDate
    if (!attendanceStore.validateAttendanceDate(newDate)) {
      showToast('No se puede registrar asistencia para fechas futuras', 'error')
      return
    }
    
    if (selectedClass.value) {
      await loadAttendanceData(selectedClass.value)
    }
  } finally {
    isUpdating.value = false
  }
}

const handleSelectedDateUpdate = (newDate: string) => {
  selectedDate.value = newDate
}

// PDF Export
const exportCurrentClassAttendanceToPDF = async () => {
  try {
    if (!selectedClass.value || !selectedDate.value) {
      showToast('Seleccione una clase y fecha primero', 'error')
      return
    }
    
    const students = studentsStore.getStudentsByClass(selectedClass.value)
    const teacherName = authStore.user?.email || 'Profesor'
    const justifications = attendanceStore.getJustificationsByStudent || {}
    await generateAttendancePDF(
      students,
      attendanceStore.attendanceRecords,
      attendanceStore.getObservations,
      selectedClassName.value,
      teacherName,
      selectedDate.value,
      justifications
    )
    
    showToast('PDF generado correctamente', 'success')
  } catch (err) {
    console.error('Error generating PDF:', err)
    showToast('Error al generar PDF', 'error')
  }
}

// Función para generar HTML del reporte
const generateAttendanceHTML = (students: any[], records: any, observations: string, className: string, date: string) => {
  const presentCount = Object.values(records).filter(status => status === 'Presente').length
  const lateCount = Object.values(records).filter(status => status === 'Tardanza').length
  const justifiedCount = Object.values(records).filter(status => status === 'Justificado').length
  const absentCount = Object.values(records).filter(status => status === 'Ausente').length
  
  const studentRows = students.map((student, index) => {
    const status = records[student.id] || 'No registrado'
    const statusClass = status.toLowerCase().replace(' ', '-')
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${student.nombre} ${student.apellido}</td>
        <td class="${statusClass}">${status}</td>
        <td>${status === 'Justificado' ? 'Sí' : 'No'}</td>
      </tr>
    `
  }).join('')
  
  const formattedDate = format(parseISO(date), "d 'de' MMMM yyyy", { locale: es })
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Asistencia - ${className}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin-bottom: 10px; }
        .header h2 { color: #64748b; margin: 5px 0; }
        .summary-container { display: flex; justify-content: space-around; margin: 20px 0; }
        .summary-box { text-align: center; padding: 15px; border-radius: 8px; background-color: #f8fafc; }
        .summary-box h3 { margin: 0 0 10px 0; color: #374151; }
        .presente { color: #16a34a; font-size: 24px; font-weight: bold; }
        .tarde { color: #d97706; font-size: 24px; font-weight: bold; }
        .justificado { color: #2563eb; font-size: 24px; font-weight: bold; }
        .ausente { color: #dc2626; font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .observations { background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .footer { text-align: center; font-size: 14px; color: #6b7280; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reporte de Asistencia</h1>
        <h2>Clase: ${className}</h2>
        <h2>Fecha: ${formattedDate}</h2>
        <h2>Maestro: ${authStore.user?.email || 'Profesor'}</h2>
      </div>
      
      <div class="summary-container">
        <div class="summary-box">
          <h3>Presentes</h3>
          <p class="presente">${presentCount}</p>
        </div>
        <div class="summary-box">
          <h3>Tardes</h3>
          <p class="tarde">${lateCount}</p>
        </div>
        <div class="summary-box">
          <h3>Justificados</h3>
          <p class="justificado">${justifiedCount}</p>
        </div>
        <div class="summary-box">
          <h3>Ausentes</h3>
          <p class="ausente">${absentCount}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Alumno</th>
            <th>Estado</th>
            <th>Justificación</th>
          </tr>
        </thead>
        <tbody>
          ${studentRows}
        </tbody>
      </table>

      <div class="observations">
        <h3>Observaciones del Maestro:</h3>
        <p>${observations}</p>
      </div>
      
      <div class="footer">
        Este reporte fue generado automáticamente desde El Sistema PC - ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `
}

// Email report
const sendAttendanceEmail = async () => {
  if (!selectedClass.value || !selectedDate.value) {
    showToast('Seleccione una clase y fecha para enviar el correo.', 'error')
    return
  }
  
  if (!authStore.user || !authStore.user.email) {
    showToast('No se pudo obtener el correo del usuario para enviar el reporte.', 'error')
    return
  }

  if (!recipientEmail.value) {
    showToast('Por favor ingrese un correo electrónico de destinatario', 'error')
    return
  }

  isLoading.value = true
  loadingMessage.value = 'Enviando correo...'

  try {
    const students = studentsStore.getStudentsByClass(selectedClass.value)
    const records = attendanceStore.attendanceRecords
    const rawObservations = attendanceStore.currentAttendanceDoc?.data.observación || 'Sin observaciones.'
    const observations = Array.isArray(rawObservations) ? rawObservations.join('\n') : rawObservations
    const className = selectedClassName.value
    const date = selectedDate.value

    // Generar contenido HTML para el correo
    const htmlContent = generateAttendanceHTML(students, records, observations, className, date)

    // Usar la URL del webhook desde la configuración en Firestore
    const makeWebhookUrl = configStore.attendanceWebhookUrl || 'https://hook.us2.make.com/t2ockuc1vne58yqc68rjqp94njv1i3uo'
    
    // Preparar un array formateado de estudiantes para Google Sheets
    const formattedStudents = students.map((student, index) => {
      const attendanceStatus = records[student.id] || 'No registrado'
      let justificationReason = ''
      
      if (attendanceStatus === 'Justificado' && attendanceStore.currentAttendanceDoc?.data?.justificacion) {
        const justification = attendanceStore.currentAttendanceDoc.data.justificacion.find(j => j.id === student.id)
        if (justification && justification.reason) {
          justificationReason = `Justificación: ${justification.reason}`
        }
      }
      
      return {
        Num: index + 1,
        Nombre: student.nombre || '',
        Apellido: student.apellido || '',
        Estado: attendanceStatus,
        Observaciones: attendanceStatus === 'Justificado' ? justificationReason : observations,
        Maestro: authStore.user?.email || 'Profesor Desconocido',
        Fecha: format(parseISO(date), 'yyyy-MM-dd'),
        Clase: className
      }
    })

    // Preparar payload para Make.com
    const makePayload = {
      subject: `Reporte de Asistencia - ${className} - ${format(parseISO(date), 'yyyy-MM-dd')}`,
      format: 'email',
      type: 'attendance_report',
      action: 'send_attendance_email',
      htmlBody: htmlContent,
      date: selectedDate.value,
      class: selectedClass.value,
      className: selectedClassName.value,
      students: studentsStore.getStudentsByClass(selectedClass.value),
      formattedStudents: formattedStudents,
      attendanceRecords: attendanceStore.attendanceRecords,
      observations: attendanceStore.currentAttendanceDoc?.data.observación,
      teacherId: authStore.user?.uid,
      teacherName: authStore.user?.email || 'Profesor Desconocido',
      teacherEmail: authStore.user?.email,
      recipient: recipientEmail.value,
      summary: {
        total: students.length,
        presentes: Object.values(records).filter(status => status === 'Presente').length,
        ausentes: Object.values(records).filter(status => status === 'Ausente').length,
        tardanza: Object.values(records).filter(status => status === 'Tardanza').length,
        justificados: Object.values(records).filter(status => status === 'Justificado').length
      }
    }

    // Enviar los datos a Make.com
    await sendToMake(makeWebhookUrl, makePayload)

    showToast('Datos enviados a Make.com correctamente. Se procesará el envío del correo.', 'success')
  } catch (err: any) {
    console.error("Error enviando datos a Make.com:", err)
    showToast(`Error al enviar datos a Make.com: ${err.message || 'Error desconocido'}`, 'error')
    error.value = 'No se pudieron enviar los datos a Make.com.'
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Close all modals
const closeAllModals = () => {
  showObservationsModal.value = false
  showJustifiedAbsenceModal.value = false
  showReportModal.value = false
  showExportModal.value = false
  showCalendarModal.value = false
  showEmergencyClassModal.value = false
}

// ============= INITIALIZATION =============
const fetchInitialData = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos iniciales...'
    
    // Load all required data
    console.log('[AttendanceView] fetchInitialData: Starting data fetch...')
    await Promise.all([
      studentsStore.fetchStudents(),
      classesStore.fetchClasses(),
      attendanceStore.fetchAllAttendanceDates()
    ])
    console.log('[AttendanceView] fetchInitialData: Initial data fetched.')
    console.log('[AttendanceView] Classes loaded:', classesStore.classes.length)
    
    // Debug: Verificar clases compartidas disponibles
    const currentUserId = authStore.user?.uid
    if (currentUserId) {
      const sharedClassesDebug = classesStore.classes.filter(cls => {
        return cls.teachers?.some(teacher => 
          teacher.teacherId === currentUserId && teacher.role === TeacherRole.ASSISTANT
        )
      })
      console.log(`[AttendanceView] DEBUG: Clases compartidas disponibles para ${currentUserId}:`, sharedClassesDebug.length)
      console.log(`[AttendanceView] DEBUG: Detalles de clases compartidas:`, sharedClassesDebug.map(c => ({
        id: c.id,
        name: c.name,
        teachers: c.teachers,
        schedule: c.schedule?.slots
      })))
    }
    
    // Handle URL parameters
    if (props.date && props.classId) {
      console.log(`[AttendanceView] fetchInitialData: URL params detected - date: ${props.date}, classId: ${props.classId}`)
      const formattedDate = props.date.length === 8
        ? `${props.date.substring(0,4)}-${props.date.substring(4,6)}-${props.date.substring(6,8)}`
        : props.date
      
      selectedDate.value = formattedDate
      selectedClass.value = props.classId
      console.log(`[AttendanceView] fetchInitialData: selectedDate: ${selectedDate.value}, selectedClass: ${selectedClass.value}`)
      await selectClass(props.classId)
    } else if (route.query.class) {
      console.log(`[AttendanceView] fetchInitialData: URL query class detected: ${route.query.class}`)
      selectedClass.value = route.query.class as string
      console.log(`[AttendanceView] fetchInitialData: selectedClass: ${selectedClass.value}`)
      await loadAttendanceData(selectedClass.value)
      updateView('attendance-form')
    }
    
    error.value = null
  } catch (err) {
    error.value = 'Error al cargar los datos iniciales'
    console.error('Error loading initial data:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// ============= LIFECYCLE HOOKS =============
onMounted(async () => {
  await configStore.fetchConfigs()
  await fetchInitialData()
})

// ============= WATCHERS =============
// Watch for route changes
watch(() => [route.params.date, route.params.classId, route.path], async ([newDate, newClassId, path]) => {
  if (typeof path === 'string' && (path.endsWith('/attendance/calendar') || path.endsWith('/teacher/attendance/calendar'))) {
    updateView('calendar')
    selectedDate.value = getCurrentDate()
    selectedClass.value = ''
    closeAllModals()
    return
  }
  
  if (newDate && newClassId) {
    const dateStr = newDate as string
    const formattedDate = dateStr.length === 8
      ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`
      : dateStr
    
    selectedDate.value = formattedDate
    selectedClass.value = newClassId as string
    await selectClass(newClassId as string)
    // Load emergency class info if needed
    await loadEmergencyClassInfo()
  }
})

// Watch for date changes
watch(() => selectedDate.value, async (newDate) => {
  if (newDate) {
    await updateSelectedDateInfo(newDate)
  }
}, { immediate: true })

// Watch for changes in attendance records - only log when debugging enabled
watch(() => attendanceStore.attendanceRecords, (newRecords, oldRecords) => {
  if (window.localStorage.getItem('attendance-debug') === 'true') {
    console.log('[AttendanceView] Attendance records changed:')
    console.log('- Registros anteriores:', oldRecords ? JSON.parse(JSON.stringify(oldRecords)) : null)
    console.log('- Registros nuevos:', newRecords ? JSON.parse(JSON.stringify(newRecords)) : null)
  }
  
  // Quick integrity check without detailed logs
  verifyAttendanceDataIntegrity()
}, { deep: true })

// Watch for changes in current attendance document - only log when debugging enabled
watch(() => attendanceStore.currentAttendanceDoc, (newDoc, oldDoc) => {
  if (window.localStorage.getItem('attendance-debug') === 'true') {
    console.log('[AttendanceView] Current attendance document changed:')
    console.log('- Documento anterior:', oldDoc ? JSON.parse(JSON.stringify(oldDoc)) : null)
    console.log('- Documento nuevo:', newDoc ? JSON.parse(JSON.stringify(newDoc)) : null)
  }
}, { deep: true })

// Watch for changes in selected class
watch(() => selectedClass.value, async (newClassId) => {
  if (newClassId) {
    await loadEmergencyClassInfo()
  }
})
</script>

<style scoped>
.btn {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #4b5563;
  color: white;
}

.btn-secondary:hover {
  background-color: #374151;
}

.btn-info {
  background-color: #0891b2;
  color: white;
}

.btn-info:hover {
  background-color: #0e7490;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-xs {
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
}

.btn-error {
  background-color: #dc2626;
  color: white;
}

.btn-error:hover {
  background-color: #b91c1c;
}
</style>
