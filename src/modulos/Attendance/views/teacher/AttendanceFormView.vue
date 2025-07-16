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
      <!-- Grid de tarjetas de resumen -->

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
  <button
    class="fixed z-40 right-6 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
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
      <div class="mx-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
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
import { format, parseISO } from 'date-fns';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AttendanceExportService from '../../services/exportService';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';
import { es } from 'date-fns/locale';

// Inicializar el servicio de toast
const toast = useToast();

// Stores
import { useClassesStore } from '../../../Classes/store/classes';
import { useStudentsStore } from '../../../Students/store/students';
import { useAttendanceStore } from '../../store/attendance';
import { useAuthStore } from '../../../../stores/auth';

// Componentes
import AttendanceHeader from '../../components/form/AttendanceHeader.vue';
import StudentAttendanceGrid from '@/modulos/Attendance/components/form/StudentAttendanceGrid.vue';
import ExportAttendanceModal from '@/modulos/Attendance/components/export/ExportAttendanceModal.vue';
import ClassObservationInput from '../../components/form/ClassObservationInput.vue';
import AttendanceToolbar from '../../components/form/AttendanceToolbar.vue';
import JustifiedAbsenceModal from '../../../../components/JustifiedAbsenceModal.vue';

// Tipos
type AttendanceStatus = 'Pendiente' | 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';

interface Student {
  id: string;
  nombre: string;
  apellido: string;
  status?: AttendanceStatus; // 'Presente', 'Ausente', etc.
  name?: string;
  justification?: string;
  isChanged?: boolean;
}

// Definimos los tipos de estado de asistencia que usa el componente hijo
type AttendanceGridStatus = 'pending' | 'absent' | 'present' | 'late' | 'justified';

interface IAttendanceRecord {
  studentId: string;
  status: AttendanceGridStatus; 
  justification?: string;
}

// Router y Route
const route = useRoute();
const router = useRouter();

// Stores
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const attendanceRecords = ref<IAttendanceRecord[]>([]);
const authStore = useAuthStore();

// Estado del componente
const students = ref<Student[]>([]);
const classInfo = ref<any | null>(null);
const searchQuery = ref('');
const classObservations = ref('');
const hasUnsavedChanges = ref(false);
const isInitializing = ref(true);
const loading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
const lastSaved = ref<Date | null>(null);
const showUnsavedWarning = ref(false);
const showJustificationModal = ref(false);
const selectedStudentForJustification = ref<any | null>(null);
const showExportModal = ref(false);
const closeExportModal = () => {
  showExportModal.value = false;
};

// Función para mapear estados de la UI a códigos de exportación
const mapStatusToExport = (status: string) => {
  const statusMap = {
    'Presente': 'present',
    'Ausente': 'absent',
    'Tardanza': 'late',
    'Justificado': 'justified',
    'Pendiente': 'pending'
  };
  return statusMap[status] || 'pending';
};

// Funciones de manejo de exportación
const handleExportPDF = async () => {
  // La función exportAttendanceData ya maneja las notificaciones y cierre del modal
  await exportAttendanceData('pdf');
};

const handleExportExcel = async () => {
  // La función exportAttendanceData ya maneja las notificaciones y cierre del modal
  await exportAttendanceData('excel');
};

const handleExportHTML = async () => {
  // La función exportAttendanceData ya maneja las notificaciones y cierre del modal
  await exportAttendanceData('html');
};

const handleShareWhatsApp = async () => {
  // La función exportAttendanceData ya maneja las notificaciones y cierre del modal
  await exportAttendanceData('whatsapp');
};

// Función común para preparar los datos de exportación
const exportAttendanceData = async (format: 'pdf' | 'excel' | 'html' | 'whatsapp') => {
  try {
    // Importar dinámicamente el servicio de exportación
    const { AttendanceExportService } = await import('../../services/exportService');
    
    // Preparar datos para exportación
    const exportData = {
      date: selectedDate.value, // Usar la fecha original sin formatear para que el servicio la procese correctamente
      className: classInfo.value?.name || '',
      students: students.value.map(s => ({
        id: s.id,
        name: s.name || `${s.nombre || ''} ${s.apellido || ''}`.trim(),
        status: mapStatusToExport(s.status),
        justification: s.justification
      })),
      observation: classObservations.value
    };

    // Calcular estadísticas para incluirlas en la exportación
    const stats = {
      total: students.value.length,
      presente: students.value.filter(s => s.status === 'Presente').length,
      ausente: students.value.filter(s => s.status === 'Ausente').length,
      tardanza: students.value.filter(s => s.status === 'Tardanza').length,
      justificado: students.value.filter(s => s.status === 'Justificado').length,
      pendiente: students.value.filter(s => s.status === 'Pendiente').length,
    };

    // Añadir estadísticas al objeto de observación
    const statsText = `\n\nRESUMEN:\n- Total estudiantes: ${stats.total}\n- Presentes: ${stats.presente} (${Math.round((stats.presente/stats.total || 0)*100)}%)\n- Ausentes: ${stats.ausente} (${Math.round((stats.ausente/stats.total || 0)*100)}%)\n- Tardanzas: ${stats.tardanza} (${Math.round((stats.tardanza/stats.total || 0)*100)}%)\n- Justificados: ${stats.justificado} (${Math.round((stats.justificado/stats.total || 0)*100)}%)\n`;
    
    exportData.observation = (exportData.observation || '') + statsText;

    // Exportar según el formato seleccionado
    switch (format) {
      case 'pdf':
        await AttendanceExportService.exportToPDF(exportData);
        toast.success('PDF generado con éxito');
        break;
      case 'excel':
        await AttendanceExportService.exportToExcel(exportData);
        toast.success('Excel generado con éxito');
        break;
      case 'html':
        AttendanceExportService.exportToHTML(exportData);
        toast.success('HTML generado con éxito');
        break;
      case 'whatsapp':
        AttendanceExportService.shareToWhatsApp(exportData);
        toast.success('Mensaje de WhatsApp creado');
        break;
    }
    
    // Cerrar el modal de exportación
    closeExportModal();
    
  } catch (error) {
    console.error(`Error al exportar asistencia como ${format}:`, error);
    toast.error(`Error al exportar: ${error.message || 'Error desconocido'}`);
  }
};

// Esta función ya está definida anteriormente

// Referencia a elementos del DOM
const searchInput = ref<HTMLInputElement | null>(null);

// Props de la ruta (manejados en onMounted)
const selectedDate = ref('');
const selectedClass = ref('');

/**
 * COMPUTED PROPERTIES
 */

// Verificar si hay datos válidos para guardar
const canSave = computed(() => {
  // Verificar si hay al menos un alumno con estado distinto a Pendiente
  const hasNonPendingStudents = students.value.some(s => s.status !== 'Pendiente');
  
  // Verificar si hay alguna observación ingresada
  const hasObservations = classObservations.value && classObservations.value.trim() !== '';
  
  // Se puede guardar solo si hay al menos un alumno con estado distinto a Pendiente Y hay observaciones escritas
  return hasNonPendingStudents && hasObservations;
});

// Filtrar estudiantes según término de búsqueda
const displayedStudents = computed(() => {
  if (!searchQuery.value.trim()) {
    return students.value; // Si no hay búsqueda, mostrar todos
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return students.value.filter(student => {
    // Buscar en nombre completo
    const fullName = `${student.nombre || ''} ${student.apellido || ''}`.toLowerCase();
    if (fullName.includes(query)) return true;
    
    // Buscar en otros campos
    const fields = [student.id, student.grupo?.toString(), student.email];
    return fields.some(field => field && field.toLowerCase().includes(query));
  });
});

const currentClass = computed(() => classInfo.value);

/**
 * Calcula las estadísticas de asistencia para mostrar en el encabezado
 */
const attendanceStats = computed(() => {
  // Si no hay estudiantes, devolver valores por defecto
  if (!students.value || students.value.length === 0) {
    return {
      total: 0,
      presente: 0,
      ausente: 0,
      tardanza: 0,
      justificado: 0,
      pendiente: 0,
      attendanceRate: 0
    };
  }
  
  // Contar cada estado
  const total = students.value.length;
  const presente = students.value.filter(s => s.status === 'Presente').length;
  const ausente = students.value.filter(s => s.status === 'Ausente').length;
  const tardanza = students.value.filter(s => s.status === 'Tardanza').length;
  const justificado = students.value.filter(s => s.status === 'Justificado').length;
  const pendiente = students.value.filter(s => s.status === 'Pendiente').length;
  
  // Calcular tasa de asistencia (presentes + tardanzas) / total
  const attendanceRate = total > 0 ? ((presente + tardanza) / total) * 100 : 0;
  
  return {
    total,
    presente,
    ausente,
    tardanza,
    justificado,
    pendiente,
    attendanceRate
  };
});

/**
 * Formatea la fecha para mostrarla de manera legible
 */
const formattedDate = computed(() => {
  if (!selectedDate.value) return '';
  
  try {
    // Asegurarse de manejar la fecha correctamente sin ajustes de zona horaria no deseados
    // Convertir la fecha ISO a sus partes (YYYY-MM-DD)
    const [year, month, day] = selectedDate.value.split('-').map(Number);
    
    // Crear un objeto Date usando UTC para evitar ajustes automáticos de zona horaria
    // Restamos 1 del mes porque en JS los meses son 0-indexados (enero = 0)
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    // Verificar si es una fecha válida
    if (isNaN(dateObj.getTime())) {
      console.warn('Fecha inválida:', selectedDate.value);
      return selectedDate.value; // Devolver el valor original si no es válido
    }
    
    // Opciones para formatear la fecha
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
    };
    
    // Formatear la fecha en español usando date-fns para mayor precisión
    return format(dateObj, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  } catch (err) {
    console.error('Error al formatear fecha:', err);
    return selectedDate.value; // Devolver el valor original en caso de error
  }
});


const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
  const student = students.value.find(s => s.id === studentId);
  if (!student) return;

  student.status = status;
  student.isChanged = true;
  hasUnsavedChanges.value = true;
};

const handleAttendanceUpdate = (studentId: string, status: string) => {
  if (!studentId) return;
  
  // Convertir el status recibido (que viene del componente hijo) a AttendanceStatus
  // Los valores de StudentAttendanceGrid son: 'pending', 'present', 'absent', 'late', 'justified'
  // Los valores de AttendanceStatus son: 'Pendiente', 'Presente', 'Ausente', 'Tardanza', 'Justificado'
  const statusMap: Record<string, AttendanceStatus> = {
    'pending': 'Pendiente',
    'present': 'Presente', 
    'absent': 'Ausente',
    'late': 'Tardanza',
    'justified': 'Justificado'
  };
  
  // Convertir el status a los tipos correctos
  const gridStatus = status as AttendanceGridStatus;
  const mappedStatus = statusMap[status] || 'Pendiente';
  
  // Actualizar el estado local de attendanceRecords
  const index = attendanceRecords.value.findIndex(record => record.studentId === studentId);
  if (index !== -1) {
    attendanceRecords.value[index].status = gridStatus;
  } else {
    // Si no existe, agregarlo
    attendanceRecords.value.push({
      studentId: studentId,
      status: gridStatus
    });
  }
  
  // Actualizar también en students para mantener la sincronización
  const studentIndex = students.value.findIndex(s => s.id === studentId);
  if (studentIndex !== -1) {
    students.value[studentIndex].status = mappedStatus;
    students.value[studentIndex].isChanged = true;
  }
  
  hasUnsavedChanges.value = true;
};

const handleManualSave = async () => {
  isSaving.value = true;
  error.value = null;
  try {
    const updateAttendanceDataFormat = () => {
      const attendanceData = {};
      
      students.value.forEach((student) => {
        if (student.isChanged || student.justification) {
          attendanceData[student.id] = {
            status: student.status || 'Ausente',
            justification: student.justification || '',
            studentName: student.name,
          };
        }
      });

      // Actualizar también el estado local de attendanceRecords para evitar errores de renderizado
      attendanceRecords.value = convertToAttendanceRecords(students.value);
      
      return attendanceData;
    };

    const attendanceData = updateAttendanceDataFormat();

    await attendanceStore.saveAttendance({
      date: selectedDate.value,
      classId: selectedClass.value,
      attendance: attendanceData,
      observation: classObservations.value,
    });

    students.value.forEach((s) => (s.isChanged = false));
    hasUnsavedChanges.value = false;
    lastSaved.value = new Date();
    
    // Mostrar modal de exportación
    showExportModal.value = true;
  } catch (err: any) {
    error.value = 'Error al guardar la asistencia.';
    console.error('❌ [AttendanceForm] Error en handleManualSave:', err);
  } finally {
    isSaving.value = false;
  }
};

// --- Manejo de Justificaciones ---
const handleOpenJustificationModal = (student: Student) => {
  selectedStudentForJustification.value = student;
  showJustificationModal.value = true;
};

// --- Manejo de Exportaciones ---
const handleExport = async (format: 'pdf' | 'excel' | 'html' | 'whatsapp') => {
  try {
    // Usar la función exportAttendanceData para preparar los datos
    await exportAttendanceData(format);
    
    // El cierre del modal y la notificación se manejan dentro de exportAttendanceData
  } catch (err) {
    console.error(`Error al exportar asistencia como ${format}:`, err);
    toast.error(`Error al exportar asistencia: ${err.message || 'Error desconocido'}`);
  }
};

const handleSaveJustification = ({ reason }: { reason: string }) => {
  if (!selectedStudentForJustification.value) return;
  const student = students.value.find(s => s.id === selectedStudentForJustification.value!.id);
  if (student) {
    student.justification = reason;
    student.status = 'Justificado';
    student.isChanged = true;
    hasUnsavedChanges.value = true;
  }
  showJustificationModal.value = false;
  selectedStudentForJustification.value = null;
};

const handleCloseJustificationModal = () => {
  showJustificationModal.value = false;
  selectedStudentForJustification.value = null;
};

// --- Acciones de la Toolbar ---
const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const clearSearch = () => {
  searchQuery.value = '';
  // Ahora podemos usar el método focus expuesto por AttendanceToolbar
  searchInput.value?.focus();
};

const markAllPresent = () => {
  students.value.forEach((student) => {
    if (student.status !== 'Presente') {
      updateStudentStatus(student.id, 'Presente');
    }
  });
};

const resetAllStatuses = () => {
  students.value.forEach((student) => {
    updateStudentStatus(student.id, 'Ausente');
  });
};

// --- Navegación ---
const navigateBack = () => {
  router.push({ name: 'ProfessionalCalendarView' }); // Asumiendo que esta es la ruta del calendario
};

const exitWithoutSaving = () => {
  if (hasUnsavedChanges.value) {
    showUnsavedWarning.value = true;
  } else {
    navigateBack();
  }
};

const confirmExitWithoutSaving = () => {
  hasUnsavedChanges.value = false;
  showUnsavedWarning.value = false;
  navigateBack();
};

/**
 * Inicializa el formulario de asistencia cargando los estudiantes y datos de la clase
 */
const initializeForm = async () => {
  loading.value = true;
  isInitializing.value = true;
  error.value = null;
  
  try {
    // Obtener los parámetros de la ruta
    const classId = route.params.classId as string;
    const date = route.params.date as string;
    
    if (!classId || !date) {
      throw new Error('Parámetros de clase o fecha no encontrados');
    }
    
    selectedClass.value = classId;
    selectedDate.value = date;
    
    console.log('📊 [AttendanceForm] Inicializando con classId:', classId, 'fecha:', date);
    
    // Cargar información de la clase
    const classData = await classesStore.getClassById(classId);
    if (!classData) throw new Error(`Clase con ID ${classId} no encontrada`);
    classInfo.value = classData;
    
    // Cargar todos los estudiantes primero
    await studentsStore.fetchStudents();
    
    // Obtener los estudiantes específicos de esta clase usando el getter
    const classStudents = studentsStore.getStudentsByClass(classId);
    
    if (!classStudents || classStudents.length === 0) {
      console.warn('⚠️ [AttendanceForm] No se encontraron estudiantes para esta clase');
    }
    
    console.log('👥 [AttendanceForm] Estudiantes cargados:', classStudents.length);
    
    // Cargar registros de asistencia existentes para esta fecha y clase
    // Usar fetchAttendanceDocument en lugar de getRecordsByDateAndClass
    console.log('🔄 [AttendanceForm] Cargando documento de asistencia para fecha:', date, 'y clase:', classId);
    await attendanceStore.fetchAttendanceDocument(date, classId);
    
    // Convertir el formato de documento a un formato utilizable para nuestros registros
    const attendanceDoc = attendanceStore.currentAttendanceDoc.value;
    console.log('📝 [AttendanceForm] Documento de asistencia cargado:', attendanceDoc);
    
    let existingRecords = {};
    
    if (attendanceDoc && attendanceDoc.data) {
      console.log('📊 [AttendanceForm] Datos del documento de asistencia:', JSON.stringify(attendanceDoc.data));
      // Combinar todos los estados en un solo objeto
      const allStudentIds = [
        ...(attendanceDoc.data.presentes || []),
        ...(attendanceDoc.data.ausentes || []),
        ...(attendanceDoc.data.tarde || []),
        ...(attendanceDoc.data.justificacion || [])
      ];
      
      console.log('🔍 [AttendanceForm] IDs de estudiantes encontrados:', allStudentIds);
      
      // Crear un mapa de estudiantes con sus estados
      allStudentIds.forEach(studentId => {
        let status = 'Pendiente';
        let justification = '';
        
        // Loguear para depuración
        console.log(`🔎 [AttendanceForm] Verificando estado del estudiante ${studentId}:`, {
          enPresentes: attendanceDoc.data.presentes?.includes(studentId),
          enAusentes: attendanceDoc.data.ausentes?.includes(studentId),
          enTarde: attendanceDoc.data.tarde?.includes(studentId),
          enJustificados: attendanceDoc.data.justificacion?.includes(studentId)
        });
        
        if (attendanceDoc.data.presentes?.includes(studentId)) {
          status = 'Presente';
        } else if (attendanceDoc.data.ausentes?.includes(studentId)) {
          status = 'Ausente';
        } else if (attendanceDoc.data.tarde?.includes(studentId)) {
          status = 'Tardanza';
        } else if (attendanceDoc.data.justificacion?.includes(studentId)) {
          status = 'Justificado';
          // Buscar justificación si existe
          // Esto es una simplificación, podrías necesitar obtener justificaciones por separado
        }
        
        console.log(`⏩ [AttendanceForm] Estado asignado para estudiante ${studentId}:`, status);
        
        existingRecords[studentId] = {
          status,
          justification
        };
      });
      
      console.log('📚 [AttendanceForm] Registros de asistencia cargados:', Object.keys(existingRecords).length);
    }
    
    // Inicializar el estado de los estudiantes
    students.value = classStudents.map(student => ({
      ...student,
      id: student.id,
      nombre: student.nombre || '',
      apellido: student.apellido || '',
      name: `${student.nombre || ''} ${student.apellido || ''}`.trim(),
      status: 'Pendiente' as AttendanceStatus,
      isChanged: false,
    }));
    
    // Aplicar registros existentes si hay alguno
    if (existingRecords && Object.keys(existingRecords).length > 0) {
      console.log('📊 [AttendanceForm] Aplicando registros existentes a', Object.keys(existingRecords).length, 'estudiantes');
      
      // Primero asegurar que todos los estudiantes tienen IDs en formato string
      const studentsWithStringIds = students.value.map(s => ({
        ...s,
        id: String(s.id) // Asegurar que el ID es string para evitar problemas de comparación
      }));
      students.value = studentsWithStringIds;
      
      // Ahora aplicar los estados a cada estudiante
      for (const studentId in existingRecords) {
        // Usar string para la comparación de IDs
        const student = students.value.find(s => String(s.id) === String(studentId));
        if (student) {
          console.log(`🧩 [AttendanceForm] Aplicando estado '${existingRecords[studentId].status}' al estudiante:`, student.name);
          student.status = existingRecords[studentId].status;
          student.justification = existingRecords[studentId].justification || '';
          // No marcar como cambiado porque son datos existentes
          student.isChanged = false;
        } else {
          console.warn(`⚠️ [AttendanceForm] No se encontró estudiante con ID: ${studentId}`);
        }
      }
    } else {
      console.log('ℹ️ [AttendanceForm] No hay registros previos de asistencia para esta fecha/clase');
    }
    
    // Cargar observaciones de clase si existen
    // Ya tenemos el documento cargado anteriormente
    
    if (attendanceDoc && attendanceDoc.data && attendanceDoc.data.observación) {
      // Si el documento tiene observaciones, las usamos
      const observaciones = attendanceDoc.data.observación;
      
      // Manejar tanto string como array de observaciones
      if (Array.isArray(observaciones)) {
        classObservations.value = observaciones.join('\n');
      } else {
        classObservations.value = observaciones;
      }
    } else {
      // Si no hay observaciones, inicializamos con cadena vacía
      classObservations.value = '';
    }
    
    console.log('📖 [AttendanceForm] Observaciones cargadas:', classObservations.value ? 'Sí' : 'No');
    
    // Actualizar registros para la tabla
    updateAttendanceRecords();
    
    console.log('✅ [AttendanceForm] Formulario inicializado correctamente');
    
  } catch (err) {
    console.error('❌ [AttendanceForm] Error al inicializar el formulario:', err);
    error.value = 'Error al cargar los datos de asistencia. Intenta nuevamente.';
  } finally {
    loading.value = false;
    isInitializing.value = false;
  }
};

/**
 * Actualiza los registros de asistencia para el componente de tabla
 */
const updateAttendanceRecords = () => {
  attendanceRecords.value = students.value.map(student => ({
    studentId: student.id,
    status: convertToGridStatus(student.status),
    justification: student.justification
  }));
};

/**
 * Convierte el formato de estado de asistencia al formato que usa el grid
 */
const convertToGridStatus = (status: AttendanceStatus): AttendanceGridStatus => {
  const statusMap: Record<AttendanceStatus, AttendanceGridStatus> = {
    'Pendiente': 'pending',
    'Presente': 'present',
    'Ausente': 'absent',
    'Tardanza': 'late',
    'Justificado': 'justified'
  };
  return statusMap[status] || 'pending';
};

/**
 * Convierte el listado de estudiantes al formato de registros de asistencia
 */
const convertToAttendanceRecords = (students: Student[]): IAttendanceRecord[] => {
  return students.map(student => ({
    studentId: student.id,
    status: convertToGridStatus(student.status || 'Pendiente'),
    justification: student.justification
  }));
};

// Las funciones handleSearch y clearSearch ya están definidas arriba

/**
 * 🎬 LIFECYCLE & WATCHERS
 */
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