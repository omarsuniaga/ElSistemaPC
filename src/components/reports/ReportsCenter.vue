<!-- Sistema Avanzado de Reportes y Análisis -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mb-16">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              📊 Centro de Reportes y Analytics
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              Generación avanzada de reportes con análisis predictivo y exportación profesional
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <button
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              @click="showReportWizard = true"
            >
              🚀 Nuevo Reporte
            </button>
            <button
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              @click="showAnalyticsPanel = !showAnalyticsPanel"
            >
              📈 Analytics
            </button>
          </div>
        </div>
      </div>

      <!-- Dashboard de métricas rápidas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg
                class="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ totalReportsGenerated }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Reportes Generados</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg
                class="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ averageAttendanceRate }}%
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Asistencia Promedio</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg
                class="w-8 h-8 text-yellow-600 dark:text-yellow-400"
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
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ studentsAtRisk }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Estudiantes en Riesgo</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <svg
                class="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ totalExports }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Exportaciones</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de Analytics -->
      <div v-if="showAnalyticsPanel" class="mb-8">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
            📈 Análisis Predictivo en Tiempo Real
          </h2>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Patrones detectados -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🔍 Patrones Detectados
              </h3>
              <div class="space-y-3">
                <div
                  v-for="pattern in detectedPatterns"
                  :key="pattern.id"
                  :class="getPatternSeverityClass(pattern.severity)"
                  class="p-4 rounded-lg border-l-4"
                >
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium">{{ pattern.title }}</h4>
                    <span class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                      {{ pattern.confidence }}% confianza
                    </span>
                  </div>
                  <p class="text-sm mt-2 opacity-90">{{ pattern.description }}</p>
                  <div class="mt-3">
                    <span class="text-xs font-medium">Recomendaciones:</span>
                    <ul class="text-xs mt-1 space-y-1">
                      <li
                        v-for="rec in pattern.recommendations.slice(0, 2)"
                        :key="rec"
                        class="flex items-center"
                      >
                        <span class="w-1 h-1 bg-current rounded-full mr-2" />
                        {{ rec }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Insights predictivos -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🎯 Insights Predictivos
              </h3>
              <div class="space-y-3">
                <div
                  v-for="insight in predictiveInsights"
                  :key="insight.id"
                  class="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-lg"
                >
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium text-gray-900 dark:text-white">{{ insight.title }}</h4>
                    <span
                      class="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200"
                    >
                      {{ Math.round(insight.probability * 100) }}% probabilidad
                    </span>
                  </div>
                  <p class="text-sm mt-2 text-gray-700 dark:text-gray-300">
                    {{ insight.description }}
                  </p>
                  <div class="mt-3">
                    <span class="text-xs font-medium text-gray-900 dark:text-white"
                      >Acciones preventivas:</span
                    >
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="action in insight.preventiveActions.slice(0, 3)"
                        :key="action"
                        class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {{ action }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tipos de reportes disponibles -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <!-- Reporte de Asistencia -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center mb-4">
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg
                class="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Reporte de Asistencia
            </h3>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Análisis completo de asistencia con tendencias, patrones y estadísticas detalladas
          </p>
          <div class="space-y-2">
            <button
              class="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              :disabled="generatingReport"
              @click="generateAttendanceReport('pdf')"
            >
              📄 Generar PDF
            </button>
            <button
              class="w-full bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              :disabled="generatingReport"
              @click="generateAttendanceReport('excel')"
            >
              📊 Exportar Excel
            </button>
          </div>
        </div>

        <!-- Reporte de Estudiantes en Riesgo -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center mb-4">
            <div class="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <svg
                class="w-6 h-6 text-red-600 dark:text-red-400"
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
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Estudiantes en Riesgo
            </h3>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Identificación temprana de estudiantes que requieren atención especial
          </p>
          <div class="space-y-2">
            <button
              class="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              :disabled="generatingReport"
              @click="generateRiskReport('pdf')"
            >
              🚨 Generar PDF
            </button>
            <button
              class="w-full bg-orange-50 hover:bg-orange-100 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              :disabled="generatingReport"
              @click="generateRiskReport('excel')"
            >
              📋 Plan de Acción
            </button>
          </div>
        </div>

        <!-- Reporte de Rendimiento por Clase -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center mb-4">
            <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg
                class="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Rendimiento por Clase
            </h3>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Comparativas de rendimiento, benchmarks y análisis por instructor
          </p>
          <div class="space-y-2">
            <button
              class="w-full bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              :disabled="generatingReport"
              @click="generateClassReport('pdf')"
            >
              📈 Generar PDF
            </button>
            <button
              class="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              :disabled="generatingReport"
              @click="generateClassReport('excel')"
            >
              📊 Dashboard BI
            </button>
          </div>
        </div>
      </div>

      <!-- Historial de reportes recientes -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">📚 Historial de Reportes</h2>
          <button
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            @click="loadReportHistory"
          >
            🔄 Actualizar
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Nombre
                </th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tipo</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Generado
                </th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Estado
                </th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="report in recentReports"
                :key="report.id"
                class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center">
                    <span class="text-2xl mr-3">{{ getReportIcon(report.type) }}</span>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">{{ report.name }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ report.description }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="getReportTypeClass(report.type)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getReportTypeLabel(report.type) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {{ formatDisplayDate(report.createdAt) }}
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="getStatusClass(report.status)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getStatusLabel(report.status) }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center space-x-2">
                    <button
                      v-if="report.status === 'completed'"
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      @click="downloadReport(report)"
                    >
                      📥
                    </button>
                    <button
                      class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      @click="viewReportDetails(report)"
                    >
                      👁️
                    </button>
                    <button
                      class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                      @click="regenerateReport(report)"
                    >
                      🔄
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal del asistente de reportes -->
    <ReportWizardModal
      v-if="showReportWizard"
      @close="showReportWizard = false"
      @generate="handleReportGeneration"
    />

    <!-- Loading overlay -->
    <div
      v-if="generatingReport"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm w-full mx-4">
        <div class="flex items-center justify-center mb-4">
          <div
            class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"
          />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
          Generando Reporte
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
          {{ generationStatus }}
        </p>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{width: `${generationProgress}%`}"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format as formatDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { reportGenerator } from '../../services/reports/reportGenerator';
import { excelExporter } from '../../services/reports/excelExporter';
import { analyticsEngine } from '../../services/reports/analyticsEngine';
import dailyAttendanceService from '../../services/dailyAttendanceService';
import ReportWizardModal from './ReportWizardModal.vue';

// Interfaces
interface ReportItem {
  id: string
  name: string
  description: string
  type: string
  format: 'pdf' | 'excel'
  status: string
  createdAt: Date
}

interface PatternData {
  id: number
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  recommendations: string[]
}

interface InsightData {
  id: number
  title: string
  description: string
  probability: number
  preventiveActions: string[]
}

// Estado reactivo
const showReportWizard = ref(false);
const showAnalyticsPanel = ref(true);
const generatingReport = ref(false);
const generationStatus = ref('Inicializando...');
const generationProgress = ref(0);

// Métricas del dashboard
const totalReportsGenerated = ref(0);
const averageAttendanceRate = ref(0);
const studentsAtRisk = ref(0);
const totalExports = ref(0);

// Datos de analytics
const detectedPatterns = ref<PatternData[]>([]);
const predictiveInsights = ref<InsightData[]>([]);
const recentReports = ref<ReportItem[]>([]);

// Computed
const reportHistory = computed(() => {
  return recentReports.value.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
});

// Métodos principales
const generateAttendanceReport = async (format: 'pdf' | 'excel'): Promise<void> => {
  generatingReport.value = true;
  generationStatus.value = 'Obteniendo datos de asistencia...';
  generationProgress.value = 10;

  try {
    // Obtener datos de asistencia
    const attendanceReport = await dailyAttendanceService.getDailyAttendanceReport(
      new Date().toISOString().split('T')[0],
    );
    const attendanceData = attendanceReport.records || [];
    generationProgress.value = 30;
    generationStatus.value = 'Procesando estadísticas...';

    if (format === 'pdf') {
      generationStatus.value = 'Generando PDF profesional...';
      generationProgress.value = 60;

      const pdfBlob = await reportGenerator.generateAttendanceReport(
        attendanceData,
        {
          generatedBy: 'Sistema de Reportes',
          generatedAt: new Date(),
          academyName: 'Academia Musical El Sistema Punta Cana',
          academyLogo: undefined,
        },
        {
          includeCharts: true,
          includeStatistics: true,
          includeTrends: true,
          groupBy: 'student',
        },
      );

      generationProgress.value = 90;
      generationStatus.value = 'Finalizando...';

      // Descargar PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-asistencia-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      generationStatus.value = 'Generando Excel con múltiples hojas...';
      generationProgress.value = 60;

      const excelBlob = await excelExporter.exportAttendanceData(
        attendanceData,
        [], // TODO: Obtener estadísticas calculadas
        {
          filename: `reporte-asistencia-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`,
          includeCharts: true,
          includePivot: true,
        },
      );

      generationProgress.value = 90;
      generationStatus.value = 'Finalizando...';

      // Descargar Excel
      const url = URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-asistencia-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    generationProgress.value = 100;
    totalReportsGenerated.value++;
    totalExports.value++;

    // Registrar en historial
    recentReports.value.unshift({
      id: Date.now().toString(),
      name: `Reporte de Asistencia ${formatDate(new Date(), 'dd/MM/yyyy')}`,
      description: `Reporte completo de asistencia en formato ${format.toUpperCase()}`,
      type: 'attendance',
      format,
      status: 'completed',
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    alert('❌ Error generando el reporte. Por favor intenta nuevamente.');
  } finally {
    setTimeout(() => {
      generatingReport.value = false;
      generationProgress.value = 0;
    }, 1000);
  }
};

const generateRiskReport = async (format: 'pdf' | 'excel'): Promise<void> => {
  generatingReport.value = true;
  generationStatus.value = 'Analizando estudiantes en riesgo...';
  generationProgress.value = 15;

  try {
    // Obtener datos y calcular riesgo
    const attendanceReport = await dailyAttendanceService.getDailyAttendanceReport(
      new Date().toISOString().split('T')[0],
    );
    const attendanceData = attendanceReport.records || [];
    const riskStudents = await calculateStudentsAtRisk(attendanceData);

    generationProgress.value = 50;
    generationStatus.value = `Generando reporte para ${riskStudents.length} estudiantes en riesgo...`;

    if (format === 'pdf') {
      const pdfBlob = await reportGenerator.generateRiskStudentsReport(riskStudents, {
        generatedBy: 'Sistema de Reportes',
        generatedAt: new Date(),
        academyName: 'Academia Musical El Sistema Punta Cana',
      });

      downloadFile(pdfBlob, `estudiantes-riesgo-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
    } else {
      const excelBlob = await excelExporter.exportRiskStudentsReport(riskStudents, {
        filename: `estudiantes-riesgo-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`,
      });

      downloadFile(excelBlob, `estudiantes-riesgo-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }

    generationProgress.value = 100;
    totalReportsGenerated.value++;
  } catch (error) {
    console.error('Error generando reporte de riesgo:', error);
    alert('❌ Error generando el reporte de estudiantes en riesgo.');
  } finally {
    setTimeout(() => {
      generatingReport.value = false;
      generationProgress.value = 0;
    }, 1000);
  }
};

const generateClassReport = async (format: 'pdf' | 'excel'): Promise<void> => {
  generatingReport.value = true;
  generationStatus.value = 'Analizando rendimiento por clase...';

  try {
    // TODO: Implementar reporte de clases
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulación

    alert('✅ Reporte de rendimiento por clase generado exitosamente');
    totalReportsGenerated.value++;
  } catch (error) {
    console.error('Error generando reporte de clases:', error);
    alert('❌ Error generando el reporte de clases.');
  } finally {
    generatingReport.value = false;
  }
};

// Métodos auxiliares
const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const calculateStudentsAtRisk = async (attendanceData: any[]): Promise<any[]> => {
  // Calcular estudiantes en riesgo basado en patrones de asistencia
  const studentStats: any = {};

  attendanceData.forEach((record: any) => {
    if (!studentStats[record.studentId]) {
      studentStats[record.studentId] = {
        studentId: record.studentId,
        studentName: record.studentName,
        className: record.className,
        totalClasses: 0,
        attendedClasses: 0,
        absentClasses: 0,
        lateArrivals: 0,
        justifiedAbsences: 0,
      };
    }

    const stats = studentStats[record.studentId];
    stats.totalClasses++;

    switch (record.status) {
    case 'presente':
      stats.attendedClasses++;
      break;
    case 'ausente':
      stats.absentClasses++;
      break;
    case 'tardanza':
      stats.attendedClasses++;
      stats.lateArrivals++;
      break;
    case 'justificada':
      stats.justifiedAbsences++;
      break;
    }
  });

  // Calcular métricas de riesgo
  const riskStudents = Object.values(studentStats)
    .map((student: any) => {
      const attendanceRate = student.attendedClasses / student.totalClasses || 0;
      const punctualityRate =
        student.attendedClasses > 0
          ? (student.attendedClasses - student.lateArrivals) / student.attendedClasses
          : 1;

      let riskLevel = 'bajo';
      if (attendanceRate < 0.7 || student.absentClasses >= 3) riskLevel = 'crítico';
      else if (attendanceRate < 0.8 || student.absentClasses >= 2) riskLevel = 'alto';
      else if (attendanceRate < 0.9 || student.lateArrivals >= 3) riskLevel = 'medio';

      return {
        ...student,
        attendanceRate,
        punctualityRate,
        riskLevel,
        trend: 'estable', // TODO: Calcular tendencia real
      };
    })
    .filter((student) => student.riskLevel === 'alto' || student.riskLevel === 'crítico');

  return riskStudents;
};

const loadDashboardMetrics = async (): Promise<void> => {
  try {
    const attendanceReport = await dailyAttendanceService.getDailyAttendanceReport(
      new Date().toISOString().split('T')[0],
    );
    const attendanceData = attendanceReport.records || [];

    // Calcular métricas
    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter(
      (r) => r.status === 'Presente' || r.status === 'Tardanza',
    ).length;
    averageAttendanceRate.value = Math.round((presentCount / totalRecords) * 100);

    const riskStudents = await calculateStudentsAtRisk(attendanceData);
    studentsAtRisk.value = riskStudents.length;

    // Cargar analytics
    await loadAnalyticsData(attendanceData);
  } catch (error) {
    console.error('Error cargando métricas:', error);
  }
};

const loadAnalyticsData = async (attendanceData: any[]): Promise<void> => {
  try {
    // Inicializar motor de analytics
    analyticsEngine.initializeWithData(attendanceData);

    // Obtener patrones y insights
    const patterns = analyticsEngine.getPatterns();
    const insights = analyticsEngine.getPredictiveInsights();

    // Transformar para la UI
    detectedPatterns.value = patterns.slice(0, 5).map((pattern, index) => ({
      id: index,
      title: pattern.description.split('.')[0],
      description: pattern.description,
      severity: pattern.severity,
      confidence: Math.round(pattern.confidence * 100),
      recommendations: pattern.recommendations,
    }));

    predictiveInsights.value = insights.slice(0, 3).map((insight, index) => ({
      id: index,
      title: `Riesgo de ${insight.type.replace('_', ' ')}`,
      description: `${insight.targetStudents.length} estudiantes identificados con riesgo en ${insight.timeframe}`,
      probability: insight.probability,
      preventiveActions: insight.preventiveActions,
    }));
  } catch (error) {
    console.error('Error cargando analytics:', error);
  }
};

const loadReportHistory = (): void => {
  // TODO: Cargar historial real desde el backend
  console.log('Cargando historial de reportes...');
};

// Métodos de UI
const getPatternSeverityClass = (severity: string): string => {
  switch (severity) {
  case 'critical':
    return 'bg-red-50 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-200';
  case 'high':
    return 'bg-orange-50 dark:bg-orange-900 border-orange-500 text-orange-800 dark:text-orange-200';
  case 'medium':
    return 'bg-yellow-50 dark:bg-yellow-900 border-yellow-500 text-yellow-800 dark:text-yellow-200';
  default:
    return 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-800 dark:text-blue-200';
  }
};

const getReportIcon = (type: string): string => {
  switch (type) {
  case 'attendance':
    return '📊';
  case 'risk':
    return '⚠️';
  case 'class':
    return '📚';
  case 'notification':
    return '📱';
  default:
    return '📄';
  }
};

const getReportTypeClass = (type: string): string => {
  switch (type) {
  case 'attendance':
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  case 'risk':
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  case 'class':
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  default:
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getReportTypeLabel = (type: string): string => {
  switch (type) {
  case 'attendance':
    return 'Asistencia';
  case 'risk':
    return 'Riesgo';
  case 'class':
    return 'Clase';
  case 'notification':
    return 'Notificación';
  default:
    return 'Otro';
  }
};

const getStatusClass = (status: string): string => {
  switch (status) {
  case 'completed':
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  case 'generating':
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  case 'failed':
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  default:
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
  case 'completed':
    return 'Completado';
  case 'generating':
    return 'Generando';
  case 'failed':
    return 'Error';
  default:
    return 'Desconocido';
  }
};

const formatDisplayDate = (date: Date): string => {
  return formatDate(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
};

// Event handlers
const handleReportGeneration = (reportConfig: any): void => {
  console.log('Generando reporte con configuración:', reportConfig);
  showReportWizard.value = false;
  // TODO: Implementar generación basada en configuración
};

const downloadReport = (report: any): void => {
  console.log('Descargando reporte:', report.name);
  // TODO: Implementar descarga de reporte existente
};

const viewReportDetails = (report: any): void => {
  console.log('Viendo detalles del reporte:', report.name);
  // TODO: Implementar vista de detalles
};

const regenerateReport = (report: any): void => {
  console.log('Regenerando reporte:', report.name);
  // TODO: Implementar regeneración
};

// Lifecycle
onMounted(async () => {
  await loadDashboardMetrics();
  totalReportsGenerated.value = 127; // TODO: Obtener de BD
  totalExports.value = 89; // TODO: Obtener de BD
});
</script>
