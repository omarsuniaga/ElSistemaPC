<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between py-6">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.go(-1)"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Volver"
            >
              <ArrowLeftIcon class="h-6 w-6" />
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                📊 Reporte Semanal de Asistencias
              </h1>
              <p class="text-sm text-gray-600 dark:text-gray-400" v-if="weekSummary">
                {{ weekSummary.week }} • {{ weekSummary.period }}
              </p>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="flex items-center space-x-3">
            <button
              @click="refreshReport"
              :disabled="isLoading"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': isLoading }" />
              Actualizar
            </button>
            <button
              @click="showExportModal = true"
              class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowDownIcon class="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p class="text-gray-600 dark:text-gray-400">Generando reporte semanal...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div class="flex items-center">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-500 mr-3" />
          <div>
            <h3 class="text-sm font-medium text-red-800 dark:text-red-300">Error al generar reporte</h3>
            <p class="text-sm text-red-700 dark:text-red-400 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Report Content -->
      <div v-else-if="hasData && currentWeekData" class="space-y-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <UsersIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Esperados</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ weekSummary?.totalExpected || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Asistieron</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ weekSummary?.totalActual || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <ChartBarIcon class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">% Asistencia</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ weekSummary?.attendanceRate || 0 }}%</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Críticas</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ criticalAbsences?.length || 0 }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Attendance Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Asistencia por Días
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Comparación de estudiantes esperados vs asistencias reales
            </p>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Día
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Esperados
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Asistieron
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ausentes
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    % Asistencia
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr 
                  v-for="day in currentWeekData.dailyStats" 
                  :key="day.date"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ day.dayName }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(day.date) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ day.expectedStudents }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="text-sm font-medium text-green-600 dark:text-green-400">
                      {{ day.actualAttendance }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      @click="showAbsenceDetails(day.date, day.absenceDetails)"
                      class="text-sm font-medium hover:underline transition-colors"
                      :class="day.absentStudents > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'"
                    >
                      {{ day.absentStudents }}
                    </button>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getAttendanceRateClass(day.attendanceRate)"
                    >
                      {{ day.attendanceRate }}%
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      @click="viewDayDetails(day.date)"
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Critical Absences Alert -->
        <div v-if="criticalAbsences && criticalAbsences.length > 0" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div class="flex items-start">
            <ExclamationTriangleIcon class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div class="flex-1">
              <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                ⚠️ Ausencias que requieren atención inmediata
              </h3>
              <p class="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                {{ criticalAbsences.length }} estudiante{{ criticalAbsences.length !== 1 ? 's' : '' }} con ausencias críticas requieren notificación a los padres.
              </p>
              <div class="flex space-x-3">
                <button
                  @click="showAbsenceManagement"
                  class="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <UserGroupIcon class="h-4 w-4 mr-2" />
                  Gestionar Ausencias
                </button>
                <button
                  @click="sendBulkNotifications"
                  class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ChatBubbleLeftRightIcon class="h-4 w-4 mr-2" />
                  Enviar Notificaciones
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Absence Details Modal -->
    <AbsenceDetailsModal
      v-if="showAbsenceModal"
      :is-open="showAbsenceModal"
      :date="selectedDate"
      :absence-details="selectedAbsences"
      @close="closeAbsenceModal"
      @justify-absence="handleJustifyAbsence"
      @send-notification="handleSendNotification"
    />

    <!-- Export Modal -->
    <ExportModal
      v-if="showExportModal"
      :is-open="showExportModal"
      :report-data="currentWeekData"
      @close="showExportModal = false"
      @export="handleExport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline';

// Composables
import { useWeeklyReport } from '../../composables/reports/useWeeklyReport';

// Components
import AbsenceDetailsModal from '../../components/reports/AbsenceDetailsModal.vue';
import ExportModal from '../../components/reports/ExportModal.vue';

// Types
import type { AbsenceDetail } from '../../types/reports';

const {
  isLoading,
  error,
  currentWeekData,
  hasData,
  weekSummary,
  criticalAbsences,
  generateWeeklyReport
} = useWeeklyReport();

// Modal states
const showAbsenceModal = ref(false);
const showExportModal = ref(false);
const selectedDate = ref<string>('');
const selectedAbsences = ref<AbsenceDetail[]>([]);

// Methods
const refreshReport = async () => {
  try {
    await generateWeeklyReport();
  } catch (err) {
    console.error('Error refreshing report:', err);
  }
};

const formatDate = (date: string) => {
  return format(new Date(date), 'dd MMM', { locale: es });
};

const getAttendanceRateClass = (rate: number) => {
  if (rate >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  if (rate >= 75) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
};

const showAbsenceDetails = (date: string, absences: AbsenceDetail[]) => {
  selectedDate.value = date;
  selectedAbsences.value = absences;
  showAbsenceModal.value = true;
};

const closeAbsenceModal = () => {
  showAbsenceModal.value = false;
  selectedDate.value = '';
  selectedAbsences.value = [];
};

const viewDayDetails = (date: string) => {
  // Navigate to detailed day view
  console.log('View details for:', date);
};

const showAbsenceManagement = () => {
  // Navigate to absence management view
  console.log('Show absence management');
};

const sendBulkNotifications = () => {
  // Handle bulk WhatsApp notifications
  console.log('Send bulk notifications');
};

const handleJustifyAbsence = (studentId: string, date: string) => {
  // Handle absence justification
  console.log('Justify absence:', { studentId, date });
};

const handleSendNotification = (studentId: string) => {
  // Handle individual notification
  console.log('Send notification to:', studentId);
};

const handleExport = (config: any) => {
  // Handle report export
  console.log('Export report:', config);
  showExportModal.value = false;
};

// Lifecycle
onMounted(() => {
  generateWeeklyReport();
});
</script>

<style scoped>
/* Custom styles for the report view */
.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease;
}
</style>