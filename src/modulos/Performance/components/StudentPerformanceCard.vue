<template>
  <div
    class="student-performance-card bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4 transition-all duration-200 hover:shadow-md"
    :class="[
      cardClass,
      props.compact ? 'p-3 space-y-3' : '',
      props.highlighted ? 'ring-2 ring-blue-500 shadow-lg' : '',
      performance.scores.overallScore < 60 || performance.attendance.attendanceRate < 75
        ? 'border-orange-300 bg-orange-50'
        : '',
    ]"
  >
    <!-- Header con avatar y info básica -->
    <div class="card-header flex items-center justify-between">
      <div class="student-info flex items-center space-x-3 flex-1 min-w-0">
        <StudentAvatar
          :first-name="performance.studentName.split(' ')[0]"
          :last-name="performance.studentName.split(' ').slice(1).join(' ')"
          size="md"
          class="avatar"
        />
        <div class="student-details flex-1 min-w-0">
          <h3 class="student-name font-semibold text-gray-900 truncate">
            {{ performance.studentName }}
          </h3>
          <div class="student-meta flex items-center space-x-2 mt-1">
            <span
              class="classification-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="classificationClass"
            >
              {{ performance.classification }}
            </span>
            <span class="last-updated text-xs text-gray-500">
              Actualizado {{ formatDate(performance.calculatedAt) }}
            </span>
          </div>
        </div>
      </div>

      <div class="score-display flex-shrink-0">
        <div
          class="score-circle w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
          :class="scoreCircleClass"
        >
          <span class="score-value">{{ Math.round(performance.scores.overallScore) }}</span>
        </div>
      </div>
    </div>

    <!-- Barra de progreso principal -->
    <div class="progress-section space-y-2">
      <div class="progress-bar-main w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="progress-fill-main h-full transition-all duration-500"
          :class="progressClass"
          :style="{width: `${Math.min(performance.scores.overallScore, 100)}%`}"
        />
      </div>
    </div>

    <!-- Métricas clave -->
    <div class="metrics-section space-y-2">
      <div class="metrics-row grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="metric-compact flex items-center space-x-2 min-w-0">
          <span>??</span>
          <div class="metric-content flex flex-col min-w-0">
            <span class="metric-value font-semibold text-gray-900 text-sm"
              >{{ performance.attendance.attendanceRate }}%</span
            >
            <span class="metric-label text-xs text-gray-500 truncate">Asistencia</span>
          </div>
        </div>

        <div class="metric-compact flex items-center space-x-2 min-w-0">
          <span>??</span>
          <div class="metric-content flex flex-col min-w-0">
            <span class="metric-value font-semibold text-gray-900 text-sm">{{
              Math.round(performance.repertoire.averageScore)
            }}</span>
            <span class="metric-label text-xs text-gray-500 truncate">Repertorio</span>
          </div>
        </div>

        <div class="metric-compact flex items-center space-x-2 min-w-0">
          <span>??</span>
          <div class="metric-content flex flex-col min-w-0">
            <span class="metric-value font-semibold text-gray-900 text-sm">{{
              Math.round(performance.work.collectiveWork.teamworkScore)
            }}</span>
            <span class="metric-label text-xs text-gray-500 truncate">Trabajo Grupal</span>
          </div>
        </div>

        <div class="metric-compact flex items-center space-x-2 min-w-0">
          <span>??</span>
          <div class="metric-content flex flex-col min-w-0">
            <span class="metric-value font-semibold text-gray-900 text-sm">{{
              performance.observations.positiveComments.length
            }}</span>
            <span class="metric-label text-xs text-gray-500 truncate">Comentarios +</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de tendencia -->
    <div v-if="showTrend && performance.trends" class="trend-section border-t border-gray-100 pt-3">
      <div class="trend-indicator flex items-center space-x-2" :class="trendClass">
        <span>??</span>
        <span class="trend-text text-xs font-medium">{{ trendText }}</span>
        <div class="trend-bar flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="trend-fill h-full transition-all duration-300"
            :class="trendFillClass"
            :style="{width: `${Math.abs(performance.trends.overall.changeRate)}%`}"
          />
        </div>
      </div>
    </div>

    <!-- Alertas y recomendaciones -->
    <div
      v-if="
        hasAlerts ||
        (showRecommendations &&
          performance.recommendations &&
          performance.recommendations.length > 0)
      "
      class="alerts-section border-t border-gray-100 pt-3 space-y-2"
    >
      <!-- Alertas -->
      <div v-if="hasAlerts" class="alerts space-y-1">
        <div
          v-if="performance.attendance.attendanceRate < 75"
          class="alert flex items-center space-x-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"
        >
          <span>??</span>
          <span>Asistencia baja ({{ performance.attendance.attendanceRate }}%)</span>
        </div>
        <div
          v-if="performance.scores.overallScore < 60"
          class="alert flex items-center space-x-2 text-xs px-2 py-1 rounded bg-red-100 text-red-800"
        >
          <span>??</span>
          <span>Rendimiento preocupante</span>
        </div>
        <div
          v-if="performance.trends && performance.trends.overall.changeRate < -10"
          class="alert flex items-center space-x-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
        >
          <span>??</span>
          <span>Tendencia descendente</span>
        </div>
      </div>

      <!-- Recomendaciones -->
      <div
        v-if="
          showRecommendations &&
          performance.recommendations &&
          performance.recommendations.length > 0
        "
        class="recommendations space-y-1"
      >
        <div
          class="recommendations-header flex items-center space-x-1 text-xs font-medium text-gray-700"
        >
          <span>??</span>
          <span>Recomendaciones</span>
        </div>
        <div class="recommendations-list space-y-1">
          <div
            v-for="(recommendation, index) in performance.recommendations.slice(0, 2)"
            :key="index"
            class="recommendation text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
          >
            {{ recommendation.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones rápidas -->
    <div
      v-if="showActions"
      class="actions-section border-t border-gray-100 pt-3 flex items-center space-x-2"
    >
      <button
        class="action-button inline-flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200"
        @click="$emit('view-details', performance.studentId)"
      >
        <span>??</span>
        Ver Detalles
      </button>
      <button
        class="action-button inline-flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200"
        @click="$emit('view-profile', performance.studentId)"
      >
        <span>??</span>
        Perfil
      </button>
      <button
        v-if="performance.attendance.attendanceRate < 75 || performance.scores.overallScore < 60"
        class="action-button inline-flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors bg-orange-100 text-orange-800 hover:bg-orange-200"
        @click="$emit('needs-attention', performance.studentId)"
      >
        <span>??</span>
        Atención
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// import { Icon } from '@iconify/vue'; // Commented temporarily for build
import StudentAvatar from '../../Students/components/StudentAvatar.vue';
import type { StudentPerformance, PerformanceRecommendation } from '../types/performance';

interface Props {
  performance: StudentPerformance
  showTrend?: boolean
  showRecommendations?: boolean
  showActions?: boolean
  compact?: boolean
  highlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTrend: true,
  showRecommendations: false,
  showActions: true,
  compact: false,
  highlighted: false,
});

const emit = defineEmits<{
  'view-details': [studentId: string]
  'view-profile': [studentId: string]
  'needs-attention': [studentId: string]
}>();

// Computed para clases y estilos
const cardClass = computed(() => ({
  // 'card-compact': props.compact, // Handled inline
  // 'card-highlighted': props.highlighted, // Handled inline
  // 'card-needs-attention': props.performance.scores.overallScore < 60 || props.performance.attendance.attendanceRate < 75 // Handled inline
}));

const classificationClass = computed(() => {
  const classification = props.performance.classification?.toLowerCase() || '';
  if (classification.includes('excelente')) return 'bg-green-100 text-green-800';
  if (classification.includes('bueno')) return 'bg-blue-100 text-blue-800';
  if (classification.includes('regular')) return 'bg-yellow-100 text-yellow-800';
  if (classification.includes('mejora')) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800'; // badge-concerning
});

const scoreCircleClass = computed(() => {
  const score = props.performance.scores.overallScore;
  if (score >= 90) return 'bg-green-500'; // circle-excellent
  if (score >= 80) return 'bg-blue-500'; // circle-good
  if (score >= 70) return 'bg-yellow-500'; // circle-regular
  if (score >= 60) return 'bg-orange-500'; // circle-needs-improvement
  return 'bg-red-500'; // circle-concerning
});

const progressClass = computed(() => {
  const score = props.performance.scores.overallScore;
  if (score >= 90) return 'bg-green-500'; // progress-excellent
  if (score >= 80) return 'bg-blue-500'; // progress-good
  if (score >= 70) return 'bg-yellow-500'; // progress-regular
  if (score >= 60) return 'bg-orange-500'; // progress-needs-improvement
  return 'bg-red-500'; // progress-concerning
});

// Tendencia
const trendIcon = computed(() => {
  const trend = props.performance.trends?.overall.changeRate;
  if (trend === undefined) return 'heroicons:minus';
  if (trend > 5) return 'heroicons:arrow-trending-up';
  if (trend < -5) return 'heroicons:arrow-trending-down';
  return 'heroicons:minus';
});

const trendClass = computed(() => {
  const trend = props.performance.trends?.overall.changeRate;
  if (trend === undefined) return 'text-gray-600'; // trend-stable
  if (trend > 5) return 'text-green-600'; // trend-positive
  if (trend < -5) return 'text-red-600'; // trend-negative
  return 'text-gray-600'; // trend-stable
});

const trendText = computed(() => {
  const trend = props.performance.trends?.overall.changeRate;
  if (trend === undefined) return 'Estable';
  if (trend > 10) return 'Mejorando mucho';
  if (trend > 5) return 'Mejorando';
  if (trend < -10) return 'Declinando mucho';
  if (trend < -5) return 'Declinando';
  return 'Estable';
});

const trendFillClass = computed(() => {
  const trend = props.performance.trends?.overall.changeRate;
  if (trend === undefined) return 'bg-gray-400'; // trend-fill-stable
  if (trend > 0) return 'bg-green-500'; // trend-fill-positive
  if (trend < 0) return 'bg-red-500'; // trend-fill-negative
  return 'bg-gray-400'; // trend-fill-stable
});

// Alertas
const hasAlerts = computed(() => {
  return (
    props.performance.attendance.attendanceRate < 75 ||
    props.performance.scores.overallScore < 60 ||
    (props.performance.trends && props.performance.trends.overall.changeRate < -10)
  );
});

// Utilidades
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'hace 1 día';
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.ceil(diffDays / 7)} semanas`;
  return `hace ${Math.ceil(diffDays / 30)} meses`;
};
</script>

<style scoped>
/* All @apply rules have been moved to inline classes in the template. */
/* Styles for dynamic classes computed in <script setup> are still applied via :class bindings. */
</style>
