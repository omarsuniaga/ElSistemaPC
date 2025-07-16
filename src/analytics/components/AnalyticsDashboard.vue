<template>
  <div class="analytics-dashboard p-6 space-y-6 bg-gray-50 min-h-screen">
    <!-- Header con métricas principales -->
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">🧠 Analytics e IA</h1>
          <p class="text-gray-600 mt-1">Insights inteligentes y predicciones avanzadas</p>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Health Score -->
          <div class="text-center">
            <div class="text-3xl font-bold" :class="healthScoreColor">
              {{ Math.round(healthScore) }}%
            </div>
            <div class="text-sm text-gray-500">Health Score</div>
          </div>

          <!-- Botón de actualización -->
          <button
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            @click="refreshDashboard"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{{ loading ? "Actualizando..." : "Actualizar" }}</span>
          </button>
        </div>
      </div>

      <!-- Métricas Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Estudiantes"
          :value="dashboard.overview.totalStudents"
          icon="👥"
          :trend="0"
        />
        <MetricCard
          title="Clases Activas"
          :value="dashboard.overview.activeClasses"
          icon="📚"
          :trend="0"
        />
        <MetricCard
          title="Asistencia Promedio"
          :value="`${(dashboard.overview.averageAttendance * 100).toFixed(1)}%`"
          icon="📊"
          :trend="dashboard.overview.attendanceTrend"
        />
        <MetricCard
          title="Estudiantes en Riesgo"
          :value="dashboard.overview.riskStudents"
          icon="⚠️"
          :trend="0"
          color="red"
        />
        <MetricCard
          title="Predicciones"
          :value="dashboard.overview.predictions"
          icon="🔮"
          :trend="0"
          color="purple"
        />
        <MetricCard
          title="Alertas"
          :value="alertsSummary.total"
          icon="🚨"
          :trend="0"
          :color="alertsSummary.hasUrgent ? 'red' : 'green'"
        />
      </div>
    </div>

    <!-- Grid principal de componentes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna izquierda: Predicciones -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Estudiantes en Riesgo -->
        <RiskStudentsWidget :students="dashboard.predictions.riskStudents" :loading="loading" />

        <!-- Recomendaciones Inteligentes -->
        <SmartRecommendationsWidget :recommendations="topRecommendations" :loading="loading" />
      </div>

      <!-- Columna central: Gráficos y Tendencias -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Predicción de Asistencia -->
        <AttendancePredictionChart
          :predictions="dashboard.predictions.nextWeekAttendance"
          :loading="loading"
        />

        <!-- Tendencias Semanales -->
        <WeeklyTrendsChart :trends="dashboard.trends.weeklyTrends" :loading="loading" />
      </div>

      <!-- Columna derecha: Insights y Alertas -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Alertas Críticas -->
        <AlertsWidget
          :alerts="dashboard.alerts.criticalAlerts"
          :warnings="dashboard.alerts.warnings"
          :loading="loading"
        />

        <!-- Key Insights -->
        <KeyInsightsWidget :insights="dashboard.insights.keyInsights" :loading="loading" />
      </div>
    </div>

    <!-- Sección expandida: Análisis Detallado -->
    <div class="bg-white rounded-xl shadow-sm p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">🔍 Análisis Detallado</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Análisis de Horarios -->
        <TimeSlotAnalysisWidget :analysis="dashboard.trends.timeSlotAnalysis" :loading="loading" />

        <!-- Patrones Estacionales -->
        <SeasonalPatternsWidget :patterns="dashboard.trends.seasonalPatterns" :loading="loading" />
      </div>
    </div>

    <!-- Modal de Error -->
    <ErrorModal v-if="error" :message="error" @close="error = null" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAdvancedAnalytics } from '@/analytics/composables/useAdvancedAnalytics';

// Components
import MetricCard from '@/analytics/components/MetricCard.vue';
import RiskStudentsWidget from '@/analytics/components/RiskStudentsWidget.vue';
import SmartRecommendationsWidget from '@/analytics/components/SmartRecommendationsWidget.vue';
import AttendancePredictionChart from '@/analytics/components/AttendancePredictionChart.vue';
import WeeklyTrendsChart from '@/analytics/components/WeeklyTrendsChart.vue';
import AlertsWidget from '@/analytics/components/AlertsWidget.vue';
import KeyInsightsWidget from '@/analytics/components/KeyInsightsWidget.vue';
import TimeSlotAnalysisWidget from '@/analytics/components/TimeSlotAnalysisWidget.vue';
import SeasonalPatternsWidget from '@/analytics/components/SeasonalPatternsWidget.vue';
import ErrorModal from '@/components/ui/ErrorModal.vue';

// Composable de Analytics
const {
  loading,
  error,
  dashboard,
  healthScore,
  alertsSummary,
  topRecommendations,
  refreshDashboard,
} = useAdvancedAnalytics();

// Computed properties
const healthScoreColor = computed(() => {
  const score = healthScore.value;
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
});
</script>

<style scoped>
.analytics-dashboard {
  /* Animaciones suaves para transiciones */
  .metric-card {
    transition: all 0.3s ease;
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
  }

  /* Efectos de carga */
  .loading-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  /* Indicadores de estado */
  .status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .status-healthy {
    background-color: #10b981;
  }
  .status-warning {
    background-color: #f59e0b;
  }
  .status-critical {
    background-color: #ef4444;
  }

  /* Tooltips informativos */
  .tooltip {
    position: relative;
  }

  .tooltip:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
  }
}
</style>
