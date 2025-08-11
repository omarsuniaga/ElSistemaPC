<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
    <!-- 🔄 ESTADO DE CARGA INICIAL -->
    <div v-if="isInitializing" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Cargando formulario de asistencia...</p>
      </div>
    </div>
      
    <!-- 📝 FORMULARIO DE ASISTENCIA -->
    <div v-if="!isInitializing && currentClass && students.length > 0" class="pb-20">
      <!-- Header responsivo -->
      <div class="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 px-4 py-4">
        <!-- Buscador y acciones -->
        <div class="flex-1 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
          <AttendanceToolbar
            ref="searchInput"
            :search-query="searchQuery"
            :students-count="students.length"
            :filtered-count="displayedStudents.length"
            class="w-full md:w-auto"
            @search="handleSearch"
            @clear-search="clearSearch"
            @mark-all-present="markAllPresent"
            @reset-all="resetAllStatuses"
          />
        </div>
  <!-- FAB: Botón guardar asistencia/observación flotante -->
  <div class="fixed z-40 right-6 top-1/2 transform -translate-y-1/2" style="width:56px;height:56px;">
    <button
      class="w-full h-full bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      style="box-shadow: 0 4px 16px rgba(0,0,0,0.18);"
      :disabled="isSaving || !canSave"
      :class="{'opacity-50 cursor-not-allowed': !canSave || isSaving}"
      @click="handleManualSave"
      title="Guardar asistencia y observación"
      aria-label="Guardar asistencia y observación"
    >
      <!-- Material Design Save Icon -->
      <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10zm-5 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5-9H7v4h10V7z" />
      </svg>
      <span class="sr-only">Guardar asistencia y observación</span>
    </button>
    <div
      v-if="isSaving || !canSave"
      class="absolute inset-0 z-50 cursor-pointer"
      style="background:transparent;"
      @mousedown="handleSaveButtonPress"
    ></div>
  </div>

        <!-- Resumen de asistencia -->
        <div class="flex-shrink-0 w-full md:w-auto">
          <details>
            <summary class="bg-gray-800 text-white rounded-lg px-4 py-2 cursor-pointer select-none text-center md:text-left">Resumen de Asistencia</summary>
            <Transition name="fade">
              <AttendanceHeader
                :class-info="currentClass"
                :formatted-date="formattedDate"
                :attendance-stats="attendanceStats"
                @exit-without-saving="exitWithoutSaving"
              />
            </Transition>
          </details>
        </div>
      </div>

   

      <!-- Grid de estudiantes -->
      <div class="px-4 py-6">

        <StudentAttendanceGrid
          :students="displayedStudents"
          :attendance-records="attendanceRecords"
          :loading="loading"
          @update-status="handleAttendanceUpdate"
          @open-justification-modal="handleOpenJustificationModal"
        />
        <!-- Modal para justificación de ausencia (solo JustificationModal) -->
        <JustifiedAbsenceModal
          v-if="showJustificationModal"
          :student="selectedStudentForJustification"
          :initial-reason="selectedStudentForJustification?.justification || ''"
          @save="handleSaveJustification"
          @close="handleCloseJustificationModal"
        />

        <!-- Mensaje si no hay estudiantes filtrados -->
        <div v-if="displayedStudents.length === 0 && searchQuery" class="text-center py-12">
          <div
            class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No se encontraron estudiantes
          </p>
          <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Busca por "{{ searchQuery }}"</p>
          <button
            class="mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            @click="clearSearch"
          >
            Limpiar búsqueda
          </button>
        </div>
      </div>

      <!-- Observaciones de la clase -->
  <div ref="observationSection" class="mx-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <ClassObservationInput
          v-model="classObservations"
          :class-id="selectedClass"
          :date="selectedDate"
        />
      </div>
    </div>

    <!-- 📊 MODAL DE EXPORTACIÓN -->
    <div v-if="showExportModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-export">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true" @click="closeExportModal"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg sm:my-8 sm:align-middle">
          <div class="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Asistencia guardada correctamente
              </h3>
              <button @click="closeExportModal" class="text-gray-400 hover:text-gray-500">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-gray-700 dark:text-gray-300 mb-6">¿Qué deseas hacer con el registro de asistencia?</p>
            
            <div class="grid grid-cols-2 gap-4">
              <!-- PDF -->
              <div 
                class="p-4 border rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
                @click="handleExportPDF"
              >
                <div class="flex flex-col items-center text-center">
                  <svg class="h-10 w-10 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-1">Exportar a PDF</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Informe completo en formato PDF</p>
                </div>
              </div>
              
              <!-- Excel -->
              <div 
                class="p-4 border rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
                @click="handleExportExcel"
              >
                <div class="flex flex-col items-center text-center">
                  <svg class="h-10 w-10 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-1">Exportar a Excel</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Tabla de datos en formato XLSX</p>
                </div>
              </div>
              
              <!-- HTML -->
              <div 
                class="p-4 border rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
                @click="handleExportHTML"
              >
                <div class="flex flex-col items-center text-center">
                  <svg class="h-10 w-10 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-1">Exportar a HTML</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Página web interactiva</p>
                </div>
              </div>
              
              <!-- WhatsApp -->
              <div 
                class="p-4 border rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
                @click="handleShareWhatsApp"
              >
                <div class="flex flex-col items-center text-center">
                  <svg class="h-10 w-10 text-green-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z"/>
                    <path d="M20.52 3.449C12.831-3.984.106 1.407.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c7.687 0 13.941-6.245 13.949-13.912.003-3.713-1.452-7.205-4.08-9.834zm-4.031 21.256c-1.467.038-2.913-.333-4.198-1.07l-.301-.18-3.119.815.838-3.025-.196-.307c-.815-1.29-1.243-2.786-1.241-4.313.006-4.47 3.666-8.108 8.167-8.108 2.174.003 4.215.843 5.75 2.366 1.535 1.526 2.385 3.554 2.381 5.712-.005 4.47-3.664 8.11-8.081 8.11z" fillRule="nonzero"/>
                  </svg>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-1">Compartir por WhatsApp</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Mensaje formateado para grupos</p>
                </div>
              </div>
            </div>
            
            <div class="mt-6 flex justify-end space-x-3">
              <button 
                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                @click="closeExportModal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 🚫 ESTADO SIN DATOS O ERROR -->
    <div
      v-else-if="!isInitializing && (!currentClass || students.length === 0)"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center max-w-md mx-auto px-4">
        <div class="mb-6">
          <svg
            class="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Registro de Asistencia
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Para registrar asistencia, primero debes seleccionar una fecha y una clase desde el
          calendario.
        </p>
        <div class="space-y-3">
          <button
            class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            @click="router.push('/teacher/attendance/calendar')"
          >
            📅 Ir al Calendario
          </button>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Desde el calendario podrás seleccionar la fecha y ver las clases disponibles para ese
            día.
          </p>
        </div>
      </div>
    </div>



    <!-- ⚠️ MODAL DE ADVERTENCIA -->
    <div
      v-if="showUnsavedWarning"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex items-center space-x-3 mb-4">
            <div
              class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Cambios sin guardar
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Tienes {{ pendingChanges }} cambio{{ pendingChanges > 1 ? "s" : "" }} pendiente{{
                  pendingChanges > 1 ? "s" : ""
                }}
              </p>
            </div>
          </div>

          <p class="text-gray-700 dark:text-gray-300 mb-6">
            ¿Estás seguro de que quieres salir sin guardar los cambios?
          </p>

          <div class="flex items-center justify-end space-x-3">
            <button
              class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              @click="confirmExitWithoutSaving"
            >
              Salir
            </button>
           
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Composables
import { useAttendanceFormLogic } from '../../composables/useAttendanceFormLogic';

// Componentes
import AttendanceHeader from '../../components/form/AttendanceHeader.vue';
import StudentAttendanceGrid from '@/modulos/Attendance/components/form/StudentAttendanceGrid.vue';
import ExportAttendanceModal from '@/modulos/Attendance/components/export/ExportAttendanceModal.vue';
import ClassObservationInput from '../../components/form/ClassObservationInput.vue';
import AttendanceToolbar from '../../components/form/AttendanceToolbar.vue';
import JustifiedAbsenceModal from '../../../../components/JustifiedAbsenceModal.vue';

// Usar el composable principal
const {
  students,
  classInfo,
  searchQuery,
  classObservations,
  hasUnsavedChanges,
  isInitializing,
  loading,
  isSaving,
  error,
  lastSaved,
  showUnsavedWarning,
  showJustificationModal,
  selectedStudentForJustification,
  attendanceRecords,
  selectedDate,
  selectedClass,
  observationSection,
  canSave,
  displayedStudents,
  currentClass,
  attendanceStats,
  formattedDate,
  updateStudentStatus,
  handleAttendanceUpdate,
  handleManualSave,
  handleSaveButtonPress,
  handleOpenJustificationModal,
  handleSaveJustification,
  handleCloseJustificationModal,
  handleSearch,
  clearSearch,
  markAllPresent,
  resetAllStatuses,
  navigateBack,
  exitWithoutSaving,
  confirmExitWithoutSaving,
  initializeForm,
  updateAttendanceRecords,
  convertToGridStatus,
  convertToAttendanceRecords,
  showExportModal,
  closeExportModal,
  handleExportPDF,
  handleExportExcel,
  handleExportHTML,
  handleShareWhatsApp,
} = useAttendanceFormLogic();

// Lifecycle hook
onMounted(() => {
  initializeForm();

  const handleKeyPress = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      handleManualSave();
    }
  };
  document.addEventListener('keydown', handleKeyPress);
  
  // Limpieza
  return () => {
    document.removeEventListener('keydown', handleKeyPress);
  };
});

window.addEventListener('beforeunload', (event) => {
  if (hasUnsavedChanges.value) {
    event.preventDefault();
    event.returnValue = '';
  }
});
</script>

<style scoped>
/* Animaciones personalizadas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Efectos de scroll suave */
.smooth-scroll {
  scroll-behavior: smooth;
}

/* Optimizaciones de rendimiento */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
</style>
