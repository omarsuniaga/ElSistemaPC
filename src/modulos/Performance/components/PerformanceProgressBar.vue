<template>
  <div
    :class="[
      'performance-progress-bar bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4',
      size === 'small' ? 'p-3' : '',
      size === 'large' ? 'p-6' : '',
    ]"
  >
    <!-- Barra de progreso principal -->
    <div class="progress-container space-y-3">
      <div class="progress-header flex items-center justify-between">
        <div class="progress-info flex items-center space-x-3">
          <h3
            class="progress-title font-semibold text-gray-900"
            :class="[size === 'small' ? 'text-base' : 'text-lg', size === 'large' ? 'text-xl' : '']"
          >
            {{ title }}
          </h3>
          <div class="progress-score flex items-baseline space-x-1">
            <span
              class="score-value font-bold text-gray-900"
              :class="[
                size === 'small' ? 'text-xl' : 'text-2xl',
                size === 'large' ? 'text-3xl' : '',
              ]"
              >{{ score }}</span
            >
            <span class="score-max text-sm text-gray-500">/100</span>
          </div>
        </div>
        <div
          class="progress-classification px-3 py-1 rounded-full text-sm font-medium"
          :class="classificationComputedClass"
        >
          {{ classification }}
        </div>
      </div>

      <div class="progress-bar-container flex items-center space-x-3">
        <div class="progress-bar flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="progress-fill h-full transition-all duration-500 ease-out"
            :class="progressComputedClass"
            :style="{width: `${Math.min(score, 100)}%`}"
          />
        </div>
        <div class="progress-percentage text-sm font-medium text-gray-700 min-w-[3rem] text-right">
          {{ Math.round(score) }}%
        </div>
      </div>
    </div>

    <!-- Métricas detalladas -->
    <div v-if="showDetails" class="metrics-details border-t border-gray-100 pt-4">
      <div class="metrics-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="metric-item space-y-2">
          <div class="metric-label text-xs font-medium text-gray-600 uppercase tracking-wide">
            Asistencia
          </div>
          <div class="metric-value flex items-center space-x-2">
            <div class="mini-progress w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="mini-fill h-full transition-all duration-300"
                :style="{width: `${attendanceRate}%`}"
                :class="getAttendanceColor(attendanceRate)"
              />
            </div>
            <span class="metric-text text-sm font-medium text-gray-900">{{ attendanceRate }}%</span>
          </div>
        </div>

        <div class="metric-item space-y-2">
          <div class="metric-label text-xs font-medium text-gray-600 uppercase tracking-wide">
            Repertorio
          </div>
          <div class="metric-value flex items-center space-x-2">
            <div class="mini-progress w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="mini-fill h-full transition-all duration-300"
                :style="{width: `${repertoireScore}%`}"
                :class="getRepertoireColor(repertoireScore)"
              />
            </div>
            <span class="metric-text text-sm font-medium text-gray-900"
              >{{ repertoireScore }}/100</span
            >
          </div>
        </div>

        <div class="metric-item space-y-2">
          <div class="metric-label text-xs font-medium text-gray-600 uppercase tracking-wide">
            Trabajo Individual
          </div>
          <div class="metric-value flex items-center space-x-2">
            <div class="mini-progress w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="mini-fill h-full transition-all duration-300"
                :style="{width: `${individualWorkScore}%`}"
                :class="getWorkColor(individualWorkScore)"
              />
            </div>
            <span class="metric-text text-sm font-medium text-gray-900"
              >{{ individualWorkScore }}/100</span
            >
          </div>
        </div>

        <div class="metric-item space-y-2">
          <div class="metric-label text-xs font-medium text-gray-600 uppercase tracking-wide">
            Trabajo Colectivo
          </div>
          <div class="metric-value flex items-center space-x-2">
            <div class="mini-progress w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="mini-fill h-full transition-all duration-300"
                :style="{width: `${collectiveWorkScore}%`}"
                :class="getWorkColor(collectiveWorkScore)"
              />
            </div>
            <span class="metric-text text-sm font-medium text-gray-900"
              >{{ collectiveWorkScore }}/100</span
            >
          </div>
        </div>

        <div class="metric-item space-y-2">
          <div class="metric-label text-xs font-medium text-gray-600 uppercase tracking-wide">
            Observaciones Positivas
          </div>
          <div class="metric-value flex items-center space-x-2">
            <div class="observations-count flex items-center space-x-2">
              <ChatBubbleLeftEllipsisIcon class="h-5 w-5 text-blue-500" />
              <span class="metric-text text-sm font-medium text-gray-900">{{
                positiveObservations
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tendencia -->
    <div
      v-if="showTrend && trend !== undefined"
      class="trend-indicator border-t border-gray-100 pt-3"
    >
      <div class="trend-content flex items-center space-x-2">
        <component
          :is="getTrendIcon(trend)"
          :class="getTrendColor(trend)"
          class="trend-icon h-5 w-5"
        />
        <span class="trend-text text-sm font-medium" :class="getTrendColor(trend)">
          {{ getTrendText(trend) }}
        </span>
      </div>
    </div>

    <!-- Recomendaciones rápidas -->
    <div
      v-if="showRecommendations && recommendations.length > 0"
      class="recommendations border-t border-gray-100 pt-3 space-y-2"
    >
      <div
        class="recommendations-header flex items-center space-x-2 text-sm font-medium text-gray-700"
      >
        <LightBulbIcon class="h-5 w-5 text-yellow-500" />
        <span>Recomendaciones</span>
      </div>
      <div class="recommendations-list space-y-1">
        <div
          v-for="(rec, index) in recommendations.slice(0, 2)"
          :key="index"
          class="recommendation-item flex items-start space-x-2 text-sm text-gray-600"
        >
          <ArrowRightIcon class="h-4 w-4 text-gray-400 mt-1" />
          <span class="recommendation-text flex-1">{{ rec }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {
  ChatBubbleLeftEllipsisIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  LightBulbIcon,
  ArrowRightIcon,
} from "@heroicons/vue/24/solid"
import type {StudentPerformance} from "../types/performance"

interface Props {
  performance?: StudentPerformance
  title?: string
  score: number
  classification?: string
  attendanceRate?: number
  repertoireScore?: number
  individualWorkScore?: number
  collectiveWorkScore?: number
  positiveObservations?: number
  trend?: number
  recommendations?: string[]
  showDetails?: boolean
  showTrend?: boolean
  showRecommendations?: boolean
  size?: "small" | "medium" | "large"
}

const props = withDefaults(defineProps<Props>(), {
  title: "Rendimiento General",
  classification: "Sin datos",
  attendanceRate: 0,
  repertoireScore: 0,
  individualWorkScore: 0,
  collectiveWorkScore: 0,
  positiveObservations: 0,
  recommendations: () => [],
  showDetails: true,
  showTrend: true,
  showRecommendations: false,
  size: "medium",
})

// Computed properties para colores y estilos
const progressComputedClass = computed(() => {
  if (props.score >= 90) return "bg-gradient-to-r from-green-400 to-green-600"
  if (props.score >= 80) return "bg-gradient-to-r from-blue-400 to-blue-600"
  if (props.score >= 70) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
  if (props.score >= 60) return "bg-gradient-to-r from-orange-400 to-orange-600"
  return "bg-gradient-to-r from-red-400 to-red-600"
})

const classificationComputedClass = computed(() => {
  const classification = props.classification.toLowerCase()
  if (classification.includes("excelente")) return "bg-green-100 text-green-800"
  if (classification.includes("bueno")) return "bg-blue-100 text-blue-800"
  if (classification.includes("regular")) return "bg-yellow-100 text-yellow-800"
  if (classification.includes("mejora")) return "bg-orange-100 text-orange-800"
  return "bg-red-100 text-red-800"
})

// Funciones para colores de métricas
const getAttendanceColor = (rate: number) => {
  if (rate >= 95) return "bg-green-500"
  if (rate >= 85) return "bg-blue-500"
  if (rate >= 75) return "bg-yellow-500"
  if (rate >= 65) return "bg-orange-500"
  return "bg-red-500"
}

const getRepertoireColor = (score: number) => {
  if (score >= 90) return "bg-green-500"
  if (score >= 80) return "bg-blue-500"
  if (score >= 70) return "bg-yellow-500"
  if (score >= 60) return "bg-orange-500"
  return "bg-red-500"
}

const getWorkColor = (score: number) => {
  if (score >= 85) return "bg-green-500"
  if (score >= 75) return "bg-blue-500"
  if (score >= 65) return "bg-yellow-500"
  if (score >= 55) return "bg-orange-500"
  return "bg-red-500"
}

// Funciones para tendencias
const getTrendIcon = (trend: number) => {
  if (trend > 5) return ArrowTrendingUpIcon
  if (trend < -5) return ArrowTrendingDownIcon
  return MinusIcon
}

const getTrendColor = (trend: number) => {
  if (trend > 5) return "text-green-500"
  if (trend < -5) return "text-red-500"
  return "text-gray-500"
}

const getTrendText = (trend: number) => {
  if (trend > 10) return "Mejorando significativamente"
  if (trend > 5) return "Mejorando"
  if (trend < -10) return "Declinando significativamente"
  if (trend < -5) return "Declinando"
  return "Estable"
}
</script>

<style scoped>
/* All @apply rules have been moved to inline classes in the template or replaced by computed properties. */
/* Dynamic classes for progress fill, classification, mini-fills, and trends are handled in the <script setup> block. */
</style>
