<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">📊 Centro de Reportes</h3>
      
      <!-- Navigation Tabs -->
      <div class="flex border-b border-gray-200 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
            activeTab === tab.key
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <!-- Generate Reports Tab -->
      <div v-if="activeTab === 'generate'" class="space-y-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-medium text-blue-800 mb-2">Generar Nuevo Reporte</h4>
          <p class="text-sm text-blue-600">Crea reportes personalizados de progreso y rendimiento</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
              <select
                v-model="reportForm.type"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="progress">Reporte de Progreso</option>
                <option value="performance">Reporte de Rendimiento</option>
                <option value="attendance">Reporte de Asistencia</option>
                <option value="comparison">Reporte Comparativo</option>
                <option value="detailed">Reporte Detallado</option>
                <option value="summary">Resumen Ejecutivo</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                v-model="reportForm.period"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mes</option>
                <option value="quarter">Último Trimestre</option>
                <option value="semester">Último Semestre</option>
                <option value="year">Último Año</option>
                <option value="custom">Período Personalizado</option>
              </select>
            </div>

            <div v-if="reportForm.period === 'custom'" class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  v-model="reportForm.startDate"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  v-model="reportForm.endDate"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Obras a Incluir</label>
              <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                <label 
                  v-for="work in availableWorks" 
                  :key="work.id"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="reportForm.selectedWorks"
                    type="checkbox"
                    :value="work.id"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">{{ work.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Métricas a Incluir</label>
              <div class="space-y-2">
                <label 
                  v-for="metric in availableMetrics" 
                  :key="metric.key"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="reportForm.selectedMetrics"
                    type="checkbox"
                    :value="metric.key"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">{{ metric.label }}</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Formato de Exportación</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input
                    v-model="reportForm.formats"
                    type="checkbox"
                    value="pdf"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">📄 PDF</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="reportForm.formats"
                    type="checkbox"
                    value="excel"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">📊 Excel</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="reportForm.formats"
                    type="checkbox"
                    value="csv"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">📋 CSV</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Configuración Adicional</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input
                    v-model="reportForm.includeCharts"
                    type="checkbox"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">Incluir gráficos</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="reportForm.includeRecommendations"
                    type="checkbox"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">Incluir recomendaciones</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="reportForm.includeComparisons"
                    type="checkbox"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">Incluir comparaciones históricas</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            :disabled="generating || !canGenerate"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            @click="generateReport"
          >
            {{ generating ? 'Generando...' : '📊 Generar Reporte' }}
          </button>
          <button
            :disabled="generating || !canGenerate"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
            @click="previewReport"
          >
            👁️ Vista Previa
          </button>
        </div>
      </div>

      <!-- Saved Reports Tab -->
      <div v-if="activeTab === 'saved'" class="space-y-6">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 class="font-medium text-green-800 mb-2">Reportes Guardados</h4>
          <p class="text-sm text-green-600">Accede a reportes generados anteriormente</p>
        </div>

        <div class="space-y-3">
          <div 
            v-for="report in savedReports"
            :key="report.id"
            class="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-medium text-gray-900">{{ report.title }}</h5>
              <span class="text-sm text-gray-500">{{ formatDate(report.generatedAt) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">
                <span class="mr-4">Tipo: {{ getReportTypeLabel(report.type) }}</span>
                <span class="mr-4">Período: {{ report.period }}</span>
                <span>{{ report.works.length }} obras</span>
              </div>
              <div class="flex gap-2">
                <button
                  class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  @click="viewReport(report)"
                >
                  👁️ Ver
                </button>
                <button
                  class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                  @click="downloadReport(report)"
                >
                  📥 Descargar
                </button>
                <button
                  class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
                  @click="shareReport(report)"
                >
                  📤 Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Templates Tab -->
      <div v-if="activeTab === 'templates'" class="space-y-6">
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 class="font-medium text-purple-800 mb-2">Plantillas de Reportes</h4>
          <p class="text-sm text-purple-600">Crea y gestiona plantillas para reportes recurrentes</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="template in reportTemplates"
            :key="template.id"
            class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer"
            @click="useTemplate(template)"
          >
            <h5 class="font-medium text-gray-900 mb-2">{{ template.name }}</h5>
            <p class="text-sm text-gray-600 mb-3">{{ template.description }}</p>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{{ template.metrics.length }} métricas</span>
              <span>{{ template.usageCount }} usos</span>
            </div>
          </div>

          <div 
            class="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:border-purple-400 transition-colors cursor-pointer"
            @click="showCreateTemplate = true"
          >
            <div class="text-2xl mb-2">➕</div>
            <span class="text-sm text-gray-600">Nueva Plantilla</span>
          </div>
        </div>
      </div>

      <!-- Analytics Tab -->
      <div v-if="activeTab === 'analytics'" class="space-y-6">
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 class="font-medium text-orange-800 mb-2">Análisis Avanzado</h4>
          <p class="text-sm text-orange-600">Análisis predictivo y tendencias de rendimiento</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h5 class="font-medium text-gray-900 mb-3">Tendencias de Progreso</h5>
            <div class="h-32 bg-gray-100 rounded flex items-center justify-center">
              <span class="text-gray-500 text-sm">Gráfico de tendencias</span>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h5 class="font-medium text-gray-900 mb-3">Predicciones</h5>
            <div class="space-y-2">
              <div class="text-sm">
                <span class="text-gray-600">Fecha estimada de finalización:</span>
                <span class="font-medium text-green-600 ml-2">15 Jun 2024</span>
              </div>
              <div class="text-sm">
                <span class="text-gray-600">Probabilidad de éxito:</span>
                <span class="font-medium text-blue-600 ml-2">87%</span>
              </div>
              <div class="text-sm">
                <span class="text-gray-600">Riesgo principal:</span>
                <span class="font-medium text-orange-600 ml-2">Memorización</span>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h5 class="font-medium text-gray-900 mb-3">Recomendaciones</h5>
            <div class="space-y-2 text-sm">
              <div class="flex items-start gap-2">
                <span class="text-green-500">✓</span>
                <span>Incrementar ensayos seccionales</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-yellow-500">⚠</span>
                <span>Revisar afinación en vientos</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-blue-500">ℹ</span>
                <span>Considerar ensayo adicional</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex gap-3 mt-6">
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          @click="$emit('close')"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useMusicalWorks } from '../composables/useHeatMapProjects';

const emit = defineEmits<{
  close: []
}>();

const { works } = useMusicalWorks();
const activeTab = ref('generate');
const generating = ref(false);
const showCreateTemplate = ref(false);

const tabs = [
  { key: 'generate', label: 'Generar', icon: '📊' },
  { key: 'saved', label: 'Guardados', icon: '💾' },
  { key: 'templates', label: 'Plantillas', icon: '📋' },
  { key: 'analytics', label: 'Análisis', icon: '🔍' },
];

const reportForm = reactive({
  type: 'progress',
  period: 'month',
  startDate: '',
  endDate: '',
  selectedWorks: [],
  selectedMetrics: ['progress', 'attendance', 'scores'],
  formats: ['pdf'],
  includeCharts: true,
  includeRecommendations: true,
  includeComparisons: false,
});

const availableWorks = computed(() => works.value);

const availableMetrics = [
  { key: 'progress', label: 'Progreso General' },
  { key: 'attendance', label: 'Asistencia' },
  { key: 'scores', label: 'Puntuaciones' },
  { key: 'practice_hours', label: 'Horas de Práctica' },
  { key: 'milestones', label: 'Hitos Alcanzados' },
  { key: 'trends', label: 'Tendencias' },
  { key: 'comparisons', label: 'Comparaciones' },
  { key: 'predictions', label: 'Predicciones' },
];

const canGenerate = computed(() => {
  return reportForm.selectedWorks.length > 0 && 
         reportForm.selectedMetrics.length > 0 && 
         reportForm.formats.length > 0;
});

const savedReports = ref([
  {
    id: 'report1',
    title: 'Reporte de Progreso - Marzo 2024',
    type: 'progress',
    period: 'month',
    works: ['work1', 'work2'],
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
    formats: ['pdf', 'excel'],
  },
  {
    id: 'report2',
    title: 'Análisis de Rendimiento - Q1 2024',
    type: 'performance',
    period: 'quarter',
    works: ['work1'],
    generatedAt: new Date(Date.now() - 172800000).toISOString(),
    formats: ['pdf'],
  },
]);

const reportTemplates = ref([
  {
    id: 'template1',
    name: 'Reporte Mensual Estándar',
    description: 'Reporte mensual con métricas básicas de progreso',
    metrics: ['progress', 'attendance', 'scores'],
    usageCount: 12,
  },
  {
    id: 'template2',
    name: 'Análisis Trimestral',
    description: 'Análisis completo con tendencias y predicciones',
    metrics: ['progress', 'trends', 'predictions', 'comparisons'],
    usageCount: 4,
  },
]);

const generateReport = async () => {
  generating.value = true;
  try {
    const reportData = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${getReportTypeLabel(reportForm.type)} - ${new Date().toLocaleDateString('es-ES')}`,
      type: reportForm.type,
      period: reportForm.period,
      startDate: reportForm.startDate,
      endDate: reportForm.endDate,
      works: reportForm.selectedWorks,
      metrics: reportForm.selectedMetrics,
      formats: reportForm.formats,
      config: {
        includeCharts: reportForm.includeCharts,
        includeRecommendations: reportForm.includeRecommendations,
        includeComparisons: reportForm.includeComparisons,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: 'current_user_id',
    };
    
    console.log('Generating report:', reportData);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add to saved reports
    savedReports.value.unshift(reportData);
    
    alert('Reporte generado exitosamente');
    activeTab.value = 'saved';
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Error al generar el reporte');
  } finally {
    generating.value = false;
  }
};

const previewReport = () => {
  console.log('Previewing report with config:', reportForm);
  // Implement preview logic
};

const viewReport = (report: any) => {
  console.log('Viewing report:', report);
  // Implement view logic
};

const downloadReport = (report: any) => {
  console.log('Downloading report:', report);
  // Implement download logic
};

const shareReport = (report: any) => {
  console.log('Sharing report:', report);
  // Implement share logic
};

const useTemplate = (template: any) => {
  console.log('Using template:', template);
  // Apply template configuration to form
  reportForm.selectedMetrics = [...template.metrics];
};

const getReportTypeLabel = (type: string): string => {
  const labels = {
    progress: 'Progreso',
    performance: 'Rendimiento',
    attendance: 'Asistencia',
    comparison: 'Comparativo',
    detailed: 'Detallado',
    summary: 'Resumen',
  };
  return labels[type] || type;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  // Set default date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  
  reportForm.endDate = endDate.toISOString().split('T')[0];
  reportForm.startDate = startDate.toISOString().split('T')[0];
  
  // Select all works by default
  reportForm.selectedWorks = works.value.map(w => w.id);
});
</script>