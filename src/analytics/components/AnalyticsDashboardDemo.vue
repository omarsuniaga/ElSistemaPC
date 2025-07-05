<template>
  <div class="p-8 max-w-7xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">🧠 Analytics e Inteligencia Artificial</h1>
      <p class="text-lg text-gray-600">
        Dashboard completo con predicciones ML y análisis avanzado
      </p>
    </header>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p class="text-gray-600">Cargando analytics...</p>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div class="flex items-center">
        <div class="text-red-500 mr-3">⚠️</div>
        <div>
          <h3 class="text-sm font-medium text-red-800">Error en Analytics</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <div v-else class="space-y-8">
      <!-- Métricas Principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Estudiantes Totales"
          :value="metrics?.totalStudents || 0"
          icon="👥"
          color="blue"
          :trend="6.2"
        />
        <MetricCard
          title="Asistencia Promedio"
          :value="Math.round((metrics?.averageAttendance || 0) * 100)"
          suffix="%"
          icon="📊"
          color="green"
          :trend="2.8"
        />
        <MetricCard
          title="Clases Activas"
          :value="metrics?.activeClasses || 0"
          icon="🎵"
          color="purple"
          :trend="1.2"
        />
        <MetricCard
          title="Score de Salud"
          :value="Math.round((metrics?.healthScore || 0) * 100)"
          suffix="%"
          icon="💚"
          color="emerald"
          :trend="4.1"
        />
      </div>

      <!-- Widgets Principales -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Estudiantes en Riesgo -->
        <RiskStudentsWidget :students="riskStudents" :loading="loading" />

        <!-- Recomendaciones Inteligentes -->
        <SmartRecommendationsWidget :recommendations="recommendations" :loading="loading" />

        <!-- Alertas Críticas -->
        <AlertsWidget :alerts="alerts" :loading="loading" />
      </div>

      <!-- Charts y Análisis Avanzado -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Predicción de Asistencia -->
        <AttendancePredictionChart :predictions="predictions" :loading="loading" />

        <!-- Tendencias Semanales -->
        <WeeklyTrendsChart :data="weeklyTrends" :loading="loading" />
      </div>

      <!-- Widgets de Análisis Detallado -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Insights Clave -->
        <KeyInsightsWidget :insights="insights" :loading="loading" />

        <!-- Análisis de Horarios -->
        <TimeSlotAnalysisWidget :time-slots="timeSlots" :loading="loading" />

        <!-- Patrones Estacionales -->
        <SeasonalPatternsWidget :loading="loading" />
      </div>

      <!-- Información del Sistema -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900">Estado del Sistema de Analytics</h3>
            <p class="text-sm text-gray-600 mt-1">
              Última actualización: {{ formatDate(lastUpdated) }}
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center text-sm text-green-600">
              <div class="w-2 h-2 bg-green-500 rounded-full mr-2" />
              ML Activo
            </div>
            <button
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              :disabled="loading"
              @click="refreshData"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {useAdvancedAnalytics} from "../composables/useAdvancedAnalytics"

// Componentes
import MetricCard from "./MetricCard.vue"
import RiskStudentsWidget from "./RiskStudentsWidget.vue"
import SmartRecommendationsWidget from "./SmartRecommendationsWidget.vue"
import AlertsWidget from "./AlertsWidget.vue"
import AttendancePredictionChart from "./AttendancePredictionChart.vue"
import WeeklyTrendsChart from "./WeeklyTrendsChart.vue"
import KeyInsightsWidget from "./KeyInsightsWidget.vue"
import TimeSlotAnalysisWidget from "./TimeSlotAnalysisWidget.vue"
import SeasonalPatternsWidget from "./SeasonalPatternsWidget.vue"

// Composable principal
const {
  loading,
  error,
  metrics,
  insights,
  recommendations,
  riskStudents,
  alerts,
  predictions,
  lastUpdated,
  refreshData,
} = useAdvancedAnalytics()

// Datos computados para componentes específicos
const weeklyTrends = computed(() => [
  {label: "Lun", value: 85},
  {label: "Mar", value: 92},
  {label: "Mié", value: 88},
  {label: "Jue", value: 94},
  {label: "Vie", value: 78},
  {label: "Sáb", value: 65},
  {label: "Dom", value: 52},
])

const timeSlots = computed(() => [
  {time: "08:00", attendance: 75, efficiency: 0.75},
  {time: "09:00", attendance: 85, efficiency: 0.85},
  {time: "10:00", attendance: 92, efficiency: 0.92},
  {time: "11:00", attendance: 88, efficiency: 0.88},
  {time: "14:00", attendance: 82, efficiency: 0.82},
  {time: "15:00", attendance: 90, efficiency: 0.9},
  {time: "16:00", attendance: 87, efficiency: 0.87},
  {time: "17:00", attendance: 78, efficiency: 0.78},
])

function formatDate(date: Date | null): string {
  if (!date) return "Nunca"
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
</script>

<style scoped>
/* Animaciones para entrada suave */
.space-y-8 > div {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Efecto hover mejorado para botones */
button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Indicador de loading mejorado */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
