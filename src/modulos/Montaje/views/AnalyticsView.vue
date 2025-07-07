<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">📊 Análisis y Reportes</h1>
          <p class="text-gray-600">{{ work.name }} - {{ work.composer }}</p>
          <p class="text-sm text-gray-500 mt-2">
            Análisis avanzado del progreso y rendimiento de la obra
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="generateReport('performance')"
            :disabled="loading"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
          >
            📈 Generar Reporte
          </button>
          <button
            @click="exportData"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            📤 Exportar Datos
          </button>
        </div>
      </div>
    </div>

    <!-- Key Metrics Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Progreso General</p>
            <p class="text-2xl font-bold text-blue-600">{{ overallProgress }}%</p>
          </div>
          <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📈</span>
          </div>
        </div>
        <div class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${overallProgress}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Horas de Práctica</p>
            <p class="text-2xl font-bold text-green-600">{{ totalPracticeHours }}h</p>
          </div>
          <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">⏱️</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">+12% vs semana anterior</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Puntuación Promedio</p>
            <p class="text-2xl font-bold text-purple-600">{{ averageScore.toFixed(1) }}</p>
          </div>
          <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">⭐</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Escala 1-5</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Días Restantes</p>
            <p class="text-2xl font-bold text-orange-600">{{ daysRemaining }}</p>
          </div>
          <div class="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📅</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Hasta fecha objetivo</p>
      </div>
    </div>

    <!-- Performance Trends Chart -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">📈 Tendencias de Rendimiento</h2>
      <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div class="text-center text-gray-500">
          <div class="text-4xl mb-2">📊</div>
          <p>Gráfico de tendencias de rendimiento</p>
          <p class="text-sm">(Integración con Chart.js pendiente)</p>
        </div>
      </div>
    </div>

    <!-- Instrument Performance Comparison -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">🎼 Comparación por Instrumentos</h2>
      <div class="space-y-4">
        <div 
          v-for="instrument in work.instruments.slice(0, 6)" 
          :key="instrument.id"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <span class="font-medium text-gray-900">{{ instrument.name }}</span>
            <span class="text-sm text-gray-500">{{ instrument.family }}</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-32 bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                :class="getPerformanceColor(getInstrumentScore(instrument.id))"
                :style="{ width: `${(getInstrumentScore(instrument.id) / 5) * 100}%` }"
              ></div>
            </div>
            <span class="text-sm font-medium text-gray-700 w-8">
              {{ getInstrumentScore(instrument.id).toFixed(1) }}
            </span>
            <span 
              class="text-xs px-2 py-1 rounded-full"
              :class="getTrendClass(getInstrumentTrend(instrument.id))"
            >
              {{ getInstrumentTrend(instrument.id) > 0 ? '↗️' : getInstrumentTrend(instrument.id) < 0 ? '↘️' : '➡️' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights and Recommendations -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">💡 Insights Automáticos</h2>
        <div class="space-y-3">
          <div 
            v-for="(insight, index) in insights" 
            :key="index"
            class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
          >
            <span class="text-blue-500 mt-0.5">💡</span>
            <p class="text-sm text-gray-700">{{ insight }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">🎯 Recomendaciones</h2>
        <div class="space-y-3">
          <div 
            v-for="(recommendation, index) in recommendations" 
            :key="index"
            class="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
          >
            <span class="text-green-500 mt-0.5">🎯</span>
            <p class="text-sm text-gray-700">{{ recommendation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Reports -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">📋 Reportes Recientes</h2>
      <div class="space-y-3">
        <div 
          v-for="report in reports.slice(0, 5)" 
          :key="report.id"
          class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div>
            <h3 class="font-medium text-gray-900">Reporte de {{ report.type === 'performance' ? 'Rendimiento' : 'Progreso' }}</h3>
            <p class="text-sm text-gray-500">Generado: {{ formatDate(report.generatedAt) }}</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="viewReport(report)"
              class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              👁️ Ver
            </button>
            <button
              @click="downloadReport(report)"
              class="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              📥 Descargar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-700">Generando reporte de análisis...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAnalytics } from '../composables/useAnalytics'
import type { MusicalWork } from '../types/heatmap'

const props = defineProps<{
  work: MusicalWork
}>()

const { reports, loading, generatePerformanceReport, getPredictiveInsights } = useAnalytics()

// Mock data for demonstration
const overallProgress = ref(67)
const totalPracticeHours = ref(142)
const averageScore = ref(3.8)

const daysRemaining = computed(() => {
  if (!props.work.endDate) return 0
  const end = new Date(props.work.endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const insights = ref([
  'La sección de cuerdas muestra una mejora constante del 15% en las últimas 4 semanas',
  'Los vientos necesitan más trabajo en afinación y cohesión según las últimas evaluaciones',
  'El tiempo de práctica promedio ha aumentado un 23% comparado con el mes anterior',
  'Se detecta una correlación positiva entre las horas de ensayo seccional y la mejora en cohesión'
])

const recommendations = ref([
  'Incrementar ensayos seccionales para vientos en un 30% durante las próximas 2 semanas',
  'Implementar ejercicios específicos de afinación al inicio de cada ensayo',
  'Establecer metas semanales más específicas para cada sección',
  'Considerar sesiones de coaching individual para instrumentos con menor progreso'
])

const generateReport = async (type: string) => {
  await generatePerformanceReport(props.work.id, 'monthly')
}

const exportData = () => {
  // Simulate data export
  const data = {
    work: props.work,
    metrics: {
      overallProgress: overallProgress.value,
      practiceHours: totalPracticeHours.value,
      averageScore: averageScore.value
    },
    insights: insights.value,
    recommendations: recommendations.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analisis_${props.work.name}_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const getInstrumentScore = (instrumentId: string): number => {
  // Mock calculation
  return 2.5 + Math.random() * 2.5
}

const getInstrumentTrend = (instrumentId: string): number => {
  // Mock trend calculation
  return (Math.random() - 0.5) * 2
}

const getPerformanceColor = (score: number): string => {
  if (score <= 2) return 'bg-red-500'
  if (score <= 3) return 'bg-yellow-500'
  if (score <= 4) return 'bg-blue-500'
  return 'bg-green-500'
}

const getTrendClass = (trend: number): string => {
  if (trend > 0.1) return 'bg-green-100 text-green-700'
  if (trend < -0.1) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewReport = (report: any) => {
  // Open report in modal or new view
  console.log('Viewing report:', report)
}

const downloadReport = (report: any) => {
  // Download report as PDF or Excel
  console.log('Downloading report:', report)
}

onMounted(() => {
  // Load initial analytics data
})
</script>