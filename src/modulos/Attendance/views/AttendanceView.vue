<template>
  <div
    class="p-2 sm:p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-w-full overflow-x-hidden"
  >
    <!-- Toast Messages -->
    <div
      v-if="showMessage"
      class="fixed top-4 right-20 z-50 p-3 sm:p-4 rounded-lg shadow-lg text-white transition-all duration-300 text-sm sm:text-base max-w-[90vw] sm:max-w-md"
      :class="messageType === 'success' ? 'bg-green-500' : 'bg-red-500'"
    >
      {{ message }}
    </div>

    <!-- Descripción del módulo -->
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
        Presiona una fecha y luego escoge la clase que vas a registrar asistencia.
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col justify-center items-center py-6 sm:py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <div
        class="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary-600"
      />
      <span v-if="loadingMessage" class="mt-3 text-sm sm:text-base text-center">{{
        loadingMessage
      }}</span>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 sm:p-4 rounded-lg mb-4 text-sm sm:text-base"
    >
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {{ error }}
        </div>
        <button class="btn btn-sm btn-error" @click="fetchInitialData">Reintentar</button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-3 sm:space-y-5">
      <!-- Panel de Analytics -->
      <AttendanceAnalytics v-if="showAnalytics" class="mb-3 sm:mb-4" />

      <!-- Panel de Tendencias -->
      <AttendanceTrends v-if="showTrends" class="mb-3 sm:mb-4" />

      <!-- Modal de clases disponibles -->
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
            class="max-w-full overflow-x-auto"
            @select="selectDate"
            @month-change="handleMonthChange"
          />
        </div>

        <!-- Vista de Selección de Clase -->
        <div v-else-if="view === 'class-select'" class="max-w-3xl mx-auto">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-lg font-semibold">Seleccionar Clase</h2>
          </div>
          <DateClassSelector
            v-model="selectedClass"
            v-model:selected-date="selectedDate"
            :day-filter="true"
            :is-loading="isLoading"
            :classes-with-records="classesWithRecordsForSelectedDate"
            :marked-dates="simpleMarkedDates"
            class="max-w-full"
            @continue="() => selectClass(selectedClass)"
            @date-change="handleDateChange"
            @update:selected-date="handleSelectedDateUpdate"
            @back="updateView('calendar')"
          />
        </div>

        <!-- Vista de Lista de Asistencia -->
        <div v-else-if="view === 'attendance-form'" class="space-y-3 sm:space-y-4">
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-base sm:text-lg font-semibold">Lista de Asistencia</h2>
            <span class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {{
                selectedDate
                  ? format(parseISO(selectedDate), "dd/MM/yyyy")
                  : "Fecha no seleccionada"
              }}
            </span>
            <div class="flex gap-2">
              <button
                class="btn btn-info btn-sm"
                title="Recargar datos de asistencia"
                @click="forceReloadAttendanceData"
              >
                🔄 Recargar
              </button>
              <button class="btn btn-secondary btn-sm" @click="updateView('class-select')">
                Volver
              </button>
            </div>
          </div>

          <div
            class="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-2 mb-3 sm:mb-4"
          >
            <div
              v-if="getObservationsCount"
              class="flex items-center justify-center sm:justify-start w-full sm:w-auto mt-2 sm:mt-0"
            >
              <span class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic mr-2">
                Esta clase tiene observaciones
              </span>
              <button class="btn btn-xs sm:btn-sm btn-info" @click="handleOpenObservation(null)">
                Ver/Editar
              </button>
            </div>

            <!-- Botones de control de datos -->
            <div class="flex gap-2 flex-wrap justify-center sm:justify-end">
              <button
                class="btn btn-warning btn-xs sm:btn-sm"
                :disabled="isLoading"
                title="Recargar datos de asistencia"
                @click="forceReloadAttendanceData"
              >
                <i class="fas fa-sync-alt mr-1" />
                <span class="hidden sm:inline">Recargar</span>
                <span class="sm:hidden">R</span>
              </button>
              <button
                class="btn btn-info btn-xs sm:btn-sm"
                :disabled="isLoading"
                title="Ejecutar debugging del sistema"
                @click="runAttendanceDebug"
              >
                <i class="fas fa-bug mr-1" />
                <span class="hidden sm:inline">Debug</span>
                <span class="sm:hidden">D</span>
              </button>
            </div>
          </div>

          <!-- Debug info for troubleshooting -->
          <div
            v-if="view === 'attendance-form' && !selectedClassName && !selectedClass"
            class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 p-4 rounded-lg mb-4"
          >
            <h3 class="font-semibold mb-2">🔍 Debug Info - Attendance List not showing</h3>
            <ul class="text-sm space-y-1">
              <li><strong>View:</strong> {{ view }}</li>
              <li><strong>Selected Class:</strong> {{ selectedClass }}</li>
              <li><strong>Selected Class Name:</strong> {{ selectedClassName }}</li>
              <li><strong>Props Date:</strong> {{ $route.params.date }}</li>
              <li><strong>Props ClassId:</strong> {{ $route.params.classId }}</li>
              <li><strong>Classes Store Length:</strong> {{ classesStore.classes.length }}</li>
            </ul>
            <p class="mt-2 text-xs">
              If you see this, it means the attendance form view is active but class information is not available.
            </p>
          </div>

          <AttendanceList
            v-if="view === 'attendance-form' && (selectedClassName || selectedClass)"
            :students="studentsStore.getStudentsByClass(selectedClass)"
            :attendance-records="attendanceStore.attendanceRecords"
            :selected-class-name="selectedClassName || selectedClass"
            :is-disabled="!attendanceStore.validateAttendanceDate(selectedDate)"
            :current-date="selectedDate"
            :available-dates="availableClassDates"
            :observations-count="getObservationsCount"
            class="overflow-x-auto"
            @update-status="handleUpdateStatus"
            @open-justification="handleOpenJustification"
            @open-observation="handleOpenObservation"
            @open-export="() => handleOpenExport(true)"
            @class-changed="selectClass"
            @date-changed="handleDateChange"
            @navigate-to-calendar="navigateToCalendar"
            @navigate-to-class-selector="navigateToClassSelector"
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
      :model-value="showExportModal"
      :date="selectedDate"
      :class-name="selectedClass"
      :students="studentsStore.getStudentsByClass(selectedClass)"
      :attendance-records="attendanceStore.attendanceRecords"
      @update:model-value="showExportModal = $event"
      @close="showExportModal = false"
    />

    <AttendanceObservation
      v-model="showObservationsModal"
      :is-visible="showObservationsModal"
      :student-id="selectedStudentForObs?.id"
      :student-name="
        selectedStudentForObs
          ? `${selectedStudentForObs.nombre} ${selectedStudentForObs.apellido}`
          : ''
      "
      :class-id="selectedClass"
      :class-name="selectedClassName || selectedClass"
      :attendance-date="selectedDate"
      :initial-observation="observationToEdit"
      :class-observation-mode="!selectedStudentForObs"
      :teacher-permissions="
        availableClasses.find((cls) => cls.id === selectedClass)?.teacherPermissions || null
      "
      @observation-saved="handleObservationAdded"
      @close="showObservationsModal = false"
    />

    <JustifiedAbsenceModal
      :show="showJustificationModal"
      :student="selectedStudentForJustification"
      :initial-justification="initialJustificationText"
      @close="showJustificationModal = false"
      @save="handleSaveJustification"
    />

    <!-- Modal de calendario personalizado -->
    <div v-if="showCalendarModal" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="absolute inset-0 bg-black/50" @click="showCalendarModal = false" />
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-10">
        <div
          class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Seleccionar Fecha</h3>
          <button class="text-gray-500 hover:text-gray-700" @click="showCalendarModal = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <Calendar
            :selected-date="selectedDate"
            :current-month="currentMonth"
            :marked-dates="markedDates"
            class="max-w-full overflow-x-auto"
            @select="handleCalendarSelect"
            @month-change="handleMonthChange"
            @close="showCalendarModal = false"
            @navigate-to-calendar="navigateToCalendar"
          />
        </div>
      </div>
    </div>

    <EmergencyClassModal
      v-if="showEmergencyClassModal"
      v-model="showEmergencyClassModal"
      :class-id="selectedClass"
      :class-name="selectedClassName || selectedClass"
      :date="selectedDate"
      @submitted="handleEmergencyClassSubmitted"
      @cancel="handleEmergencyClassCancelled"
    />
  </div>
</template>

<script setup lang="ts">
import "@vuepic/vue-datepicker/dist/main.css"

// Componentes
import AttendanceList from "../components/AttendanceList.vue"
import AttendanceReportModal from "../components/AttendanceReportModal.vue"
import AttendanceObservation from "../components/AttendanceObservation.vue"
import AttendanceAnalytics from "../components/AttendanceAnalytics.vue"
import AttendanceTrends from "../components/AttendanceTrends.vue"
import AttendanceExportModal from "../components/AttendanceExportModal.vue"
import Calendar from "../../../components/Calendar.vue"
import DateClassSelector from "../../Classes/components/DateClassSelector.vue"
import JustifiedAbsenceModal from "../../../components/JustifiedAbsenceModal.vue"
import EmergencyClassModal from "../components/EmergencyClassModal.vue"
import ClassesModal from "../components/ClassesModal.vue"

// ✨ Composable principal que reemplaza toda la lógica anterior
import {useAttendanceManager} from "../../../composables/attendance/useAttendanceManager"
import {format, parseISO} from "date-fns"

// Props
const props = defineProps<{
  date?: string
  classId?: string
}>()

// ✨ UNA LÍNEA reemplaza 1,800+ líneas de lógica
const attendance = useAttendanceManager(props)

// Exponer todas las propiedades reactivas y métodos del composable
const {
  // Estado principal
  view,
  selectedDate,
  currentMonth,
  selectedClass,
  isLoading,
  error,
  loadingMessage,

  // Estados de modales
  showObservationsModal,
  selectedStudentForObs,
  showJustificationModal,
  selectedStudentForJustification,
  initialJustificationText,
  showReportModal,
  showExportModal,
  showAnalytics,
  showTrends,
  showCalendarModal,
  showEmergencyClassModal,
  observationToEdit,
  showClassesModal,
  modalDate,
  classesForDate,

  // Estados de datos
  markedDates,
  selectedClassName,
  classesWithRecordsForSelectedDate,
  simpleMarkedDates,
  availableClasses,
  availableClassDates,
  getObservationsCount,

  // Estados de mensajes
  showMessage,
  message,
  messageType,

  // Métodos de navegación
  updateView,
  navigateToCalendar,
  navigateToClassSelector,
  selectDate,
  handleClassSelect,
  handleCreateEmergencyClass,
  selectClass,

  // Métodos de datos
  // loadAttendanceData,
  forceReloadAttendanceData,
  runAttendanceDebug,
  fetchInitialData,

  // Métodos de asistencia
  handleUpdateStatus,

  // Métodos de modales
  handleOpenObservation,
  handleObservationAdded,
  handleOpenJustification,
  handleSaveJustification,
  handleOpenExport,
  handleGenerateReport,

  // Métodos de emergencia
  handleEmergencyClassSubmitted,
  handleEmergencyClassCancelled,

  // Métodos de calendario
  handleCalendarSelect,
  handleMonthChange,
  handleDateChange,
  handleSelectedDateUpdate,
} = attendance

// Re-exportar stores utilizados en el template
const {attendanceStore, studentsStore, classesStore} = attendance
</script>

<style scoped>
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background-color: #d97706;
}

.btn-info {
  background-color: #06b6d4;
  color: white;
}

.btn-info:hover {
  background-color: #0891b2;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-xs {
  padding: 2px 6px;
  font-size: 11px;
}

.btn-error {
  background-color: #ef4444;
  color: white;
}

.btn-error:hover {
  background-color: #b91c1c;
}
</style>
