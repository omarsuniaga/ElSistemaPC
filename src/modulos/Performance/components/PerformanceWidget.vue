<template>
  <div
    class="performance-widget bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 ease-in-out hover:shadow-lg"
    :class="widgetClass"
  >
    <!-- Header del widget -->
    <div
      class="widget-header flex justify-between items-start px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <div class="widget-title-section flex-1">
        <h3
          class="widget-title flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white"
        >
          <ChartBarSquareIcon class="title-icon w-5 h-5 text-gray-500 dark:text-gray-400" />
          Rendimiento Académico
        </h3>
        <div v-if="lastUpdated" class="last-updated text-xs text-gray-500 dark:text-gray-400 mt-1">
          Actualizado {{ formatLastUpdated(lastUpdated) }}
        </div>
      </div>
      <div class="widget-actions flex gap-2">
        <button
          v-if="!loading"
          class="refresh-button p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          :disabled="loading"
          @click="refreshData"
        >
          <ArrowPathIcon class="w-5 h-5" :class="{'animate-spin': loading}" />
        </button>
        <button
          v-if="allowExpand"
          class="expand-button p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          @click="$emit('expand')"
        >
          <ArrowsPointingOutIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="widget-loading p-8 text-center">
      <div class="loading-content flex flex-col items-center gap-4">
        <ArrowPathIcon class="animate-spin w-8 h-8 text-blue-500" />
        <span class="loading-text text-sm text-gray-600 dark:text-gray-400"
          >Cargando rendimiento...</span
        >
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="widget-error p-8 text-center">
      <div class="error-content flex flex-col items-center gap-4">
        <ExclamationTriangleIcon class="w-8 h-8 text-red-500" />
        <span class="error-text text-sm text-red-600 dark:text-red-400">{{ error }}</span>
        <button
          class="retry-button px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          @click="refreshData"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="performance" class="widget-content p-5">
      <!-- Score principal -->
      <div
        class="main-score flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700"
      >
        <div
          class="score-circle w-16 h-16 rounded-full flex flex-col items-center justify-center text-white flex-shrink-0"
          :class="scoreCircleClass"
        >
          <span class="score-value text-2xl font-bold leading-none">{{
            Math.round(performance.scores.overallScore)
          }}</span>
          <span class="score-label text-xs opacity-90 leading-none">Puntuación</span>
        </div>
        <div class="score-details flex-1">
          <div class="classification text-base font-semibold mb-1" :class="classificationClass">
            {{ performanceLevel }}
          </div>
          <div class="score-description text-sm text-gray-600 dark:text-gray-400">
            {{ getScoreDescription(performance.scores.overallScore) }}
          </div>
        </div>
      </div>

      <!-- Métricas en formato compacto -->
      <div class="metrics-compact mb-4">
        <div class="metric-row grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div class="metric-item bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div class="metric-header flex items-center gap-2 mb-2">
              <CalendarDaysIcon class="metric-icon w-4 h-4 text-blue-500" />
              <span class="metric-label text-xs font-medium text-gray-700 dark:text-gray-300"
                >Asistencia</span
              >
            </div>
            <div class="metric-value-row flex items-center gap-2">
              <div
                class="metric-bar flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"
              >
                <div
                  class="metric-fill h-full transition-all duration-300 ease-in-out"
                  :class="getAttendanceColor(performance.attendance.attendanceRate)"
                  :style="{width: `${performance.attendance.attendanceRate}%`}"
                />
              </div>
              <span
                class="metric-percentage text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[2rem] text-right"
                >{{ performance.attendance.attendanceRate }}%</span
              >
            </div>
          </div>

          <div class="metric-item bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div class="metric-header flex items-center gap-2 mb-2">
              <MusicalNoteIcon class="metric-icon w-4 h-4 text-purple-500" />
              <span class="metric-label text-xs font-medium text-gray-700 dark:text-gray-300"
                >Repertorio</span
              >
            </div>
            <div class="metric-value-row flex items-center gap-2">
              <div
                class="metric-bar flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"
              >
                <div
                  class="metric-fill h-full transition-all duration-300 ease-in-out"
                  :class="getRepertoireColor(performance.repertoire.averageScore)"
                  :style="{width: `${performance.repertoire.averageScore}%`}"
                />
              </div>
              <span
                class="metric-percentage text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[2rem] text-right"
                >{{ Math.round(performance.repertoire.averageScore) }}%</span
              >
            </div>
          </div>
        </div>

        <div class="metric-row grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="metric-item bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div class="metric-header flex items-center gap-2 mb-2">
              <UserIcon class="metric-icon w-4 h-4 text-green-500" />
              <span class="metric-label text-xs font-medium text-gray-700 dark:text-gray-300"
                >Trabajo Individual</span
              >
            </div>
            <div class="metric-value-row flex items-center gap-2">
              <div
                class="metric-bar flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"
              >
                <div
                  class="metric-fill h-full transition-all duration-300 ease-in-out"
                  :class="getWorkColor(performance.work.individualWork.practiceHours, true)"
                  :style="{
                    width: `${Math.min(performance.work.individualWork.practiceHours * 10, 100)}%`,
                  }"
                />
              </div>
              <span
                class="metric-percentage text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[2rem] text-right"
                >{{ performance.work.individualWork.practiceHours }}h</span
              >
            </div>
          </div>

          <div class="metric-item bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div class="metric-header flex items-center gap-2 mb-2">
              <UsersIcon class="metric-icon w-4 h-4 text-orange-500" />
              <span class="metric-label text-xs font-medium text-gray-700 dark:text-gray-300"
                >Trabajo Grupal</span
              >
            </div>
            <div class="metric-value-row flex items-center gap-2">
              <div
                class="metric-bar flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"
              >
                <div
                  class="metric-fill h-full transition-all duration-300 ease-in-out"
                  :class="getWorkColor(performance.work.collectiveWork.teamworkScore, false)"
                  :style="{width: `${performance.work.collectiveWork.teamworkScore}%`}"
                />
              </div>
              <span
                class="metric-percentage text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[2rem] text-right"
                >{{ Math.round(performance.work.collectiveWork.teamworkScore) }}%</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Tendencia -->
      <div
        v-if="showTrend && performance.trends?.changeRate !== undefined"
        class="trend-section bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4"
      >
        <div class="trend-header flex items-center gap-2 mb-2">
          <ChartTrendingUpIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span class="trend-label text-xs font-medium text-gray-700 dark:text-gray-300"
            >Tendencia</span
          >
        </div>
        <div class="trend-indicator flex items-center gap-2" :class="trendClass">
          <component :is="trendIconComponent" class="w-4 h-4" />
          <span class="trend-text text-xs font-medium flex-1">{{ trendText }}</span>
          <div
            class="trend-value text-xs font-semibold px-1.5 py-0.5 rounded-md"
            :class="trendValueClass"
          >
            {{ formatTrendValue(performance.trends.changeRate) }}
          </div>
        </div>
      </div>

      <!-- Destacados y alertas -->
      <div v-if="highlights.length > 0 || alerts.length > 0" class="highlights-section mb-4">
        <!-- Destacados positivos -->
        <div v-if="highlights.length > 0" class="highlights mb-3">
          <div class="highlights-header flex items-center gap-2 mb-2">
            <StarIcon class="w-4 h-4 text-yellow-400" />
            <span class="highlights-label text-xs font-medium text-gray-700 dark:text-gray-300"
              >Destacados</span
            >
          </div>
          <div class="highlights-list flex flex-col gap-1">
            <div
              v-for="highlight in highlights.slice(0, 2)"
              :key="highlight"
              class="highlight-item flex items-center gap-2 text-xs"
            >
              <CheckCircleIcon class="w-3.5 h-3.5 text-green-500" />
              <span class="highlight-text text-gray-600 dark:text-gray-400">{{ highlight }}</span>
            </div>
          </div>
        </div>

        <!-- Alertas -->
        <div v-if="alerts.length > 0" class="alerts">
          <div class="alerts-header flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon class="w-4 h-4 text-orange-400" />
            <span class="alerts-label text-xs font-medium text-gray-700 dark:text-gray-300"
              >Atención</span
            >
          </div>
          <div class="alerts-list flex flex-col gap-1">
            <div
              v-for="alert in alerts.slice(0, 2)"
              :key="alert"
              class="alert-item flex items-center gap-2 text-xs"
            >
              <ExclamationCircleIcon class="w-3.5 h-3.5 text-orange-500" />
              <span class="alert-text text-gray-600 dark:text-gray-400">{{ alert }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Comentarios recientes -->
      <div v-if="showRecentComments && recentComments.length > 0" class="recent-comments mb-4">
        <div class="comments-header flex items-center gap-2 mb-2">
          <ChatBubbleLeftEllipsisIcon class="w-4 h-4 text-blue-500" />
          <span class="comments-label text-xs font-medium text-gray-700 dark:text-gray-300"
            >Comentarios Recientes</span
          >
        </div>
        <div class="comments-list flex flex-col gap-3">
          <div
            v-for="comment in recentComments"
            :key="comment.id"
            class="comment-item bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-l-2"
            :class="getCategoryBorderColor(comment.category)"
          >
            <div class="comment-meta flex justify-between items-center mb-1">
              <span class="teacher-name text-xs font-semibold text-gray-800 dark:text-gray-200">{{
                comment.teacherName
              }}</span>
              <span class="comment-date text-xs text-gray-500 dark:text-gray-400">{{
                formatCommentDate(comment.date)
              }}</span>
            </div>
            <div class="comment-text text-xs text-gray-600 dark:text-gray-400 mb-1.5 leading-snug">
              {{ comment.comment }}
            </div>
            <div
              class="comment-category inline-block px-2 py-0.5 rounded-full text-xs font-medium"
              :class="getCategoryClass(comment.category)"
            >
              {{ comment.category }}
            </div>
          </div>
        </div>
      </div>

      <!-- Actions footer -->
      <div
        v-if="showActions"
        class="widget-footer flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700"
      >
        <button
          class="action-btn flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors action-primary bg-blue-600 text-white hover:bg-blue-700"
          @click="$emit('view-details')"
        >
          <EyeIcon class="w-4 h-4" />
          Ver Detalles
        </button>
        <button
          v-if="performance.scores.overallScore < 70"
          class="action-btn flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors action-warning bg-yellow-500 text-white hover:bg-yellow-600"
          @click="$emit('view-recommendations')"
        >
          <LightBulbIcon class="w-4 h-4" />
          Recomendaciones
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="widget-empty p-8 text-center">
      <div class="empty-content flex flex-col items-center gap-4">
        <ChartBarSquareIcon class="w-10 h-10 text-gray-300 dark:text-gray-600" />
        <span class="empty-text text-sm text-gray-500 dark:text-gray-400"
          >No hay datos de rendimiento</span
        >
        <button
          class="load-button px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          @click="refreshData"
        >
          Cargar datos
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, shallowRef} from "vue"
import {
  ChartBarSquareIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  MusicalNoteIcon,
  UserIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon as SolidMinusIcon, // Renamed to avoid conflict
  StarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  EyeIcon,
  LightBulbIcon,
  ChartBarIcon as ChartTrendingUpIcon, // Using ChartBarIcon for trend, can be changed
} from "@heroicons/vue/24/solid" // Using solid icons for a more impactful look, can be mixed with outline
import {useStudentPerformance} from "../composables/useStudentPerformance"
import type {StudentPerformance} from "../types/performance"

interface Props {
  studentId: string
  compact?: boolean
  showTrend?: boolean
  showRecentComments?: boolean
  showActions?: boolean
  allowExpand?: boolean
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showTrend: true,
  showRecentComments: true,
  showActions: true,
  allowExpand: true,
  autoRefresh: false,
})

const emit = defineEmits<{
  "view-details": []
  "view-recommendations": []
  expand: []
}>()

// Composable
const {loading, error, performance, refresh: refreshData} = useStudentPerformance(props.studentId)

// Computed properties
const widgetClass = computed(() => ({
  "border-l-4 border-yellow-400 dark:border-yellow-500 bg-gradient-to-r from-yellow-50 dark:from-yellow-900/30 to-white dark:to-gray-800":
    performance.value &&
    (performance.value.scores.overallScore < 60 ||
      performance.value.attendance.attendanceRate < 70),
}))

const lastUpdated = computed(() => performance.value?.calculatedAt) // Assuming calculatedAt is the update timestamp

const scoreCircleClass = computed(() => {
  if (!performance.value) return "bg-gray-500"
  const score = performance.value.scores.overallScore
  if (score >= 90) return "bg-gradient-to-br from-green-500 to-green-600"
  if (score >= 80) return "bg-gradient-to-br from-blue-500 to-blue-600"
  if (score >= 70) return "bg-gradient-to-br from-yellow-500 to-yellow-600"
  if (score >= 60) return "bg-gradient-to-br from-orange-500 to-orange-600"
  return "bg-gradient-to-br from-red-500 to-red-600"
})

const classificationClass = computed(() => {
  if (!performance.value) return "text-gray-500"
  const classification = (performance.value.summary.level || "").toLowerCase() // Assuming summary.level
  if (classification.includes("excelente")) return "text-green-600 dark:text-green-400"
  if (classification.includes("bueno")) return "text-blue-600 dark:text-blue-400"
  if (classification.includes("regular")) return "text-yellow-600 dark:text-yellow-400"
  if (classification.includes("mejora")) return "text-orange-600 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
})

// Tendencia
const trendIconComponent = computed(() => {
  if (!performance.value || performance.value.trends?.changeRate === undefined)
    return SolidMinusIcon
  const trend = performance.value.trends.changeRate
  if (trend > 5) return ArrowTrendingUpIcon
  if (trend < -5) return ArrowTrendingDownIcon
  return SolidMinusIcon
})

const trendClass = computed(() => {
  if (!performance.value || performance.value.trends?.changeRate === undefined)
    return "text-gray-500 dark:text-gray-400"
  const trend = performance.value.trends.changeRate
  if (trend > 5) return "text-green-600 dark:text-green-400"
  if (trend < -5) return "text-red-600 dark:text-red-400"
  return "text-gray-500 dark:text-gray-400"
})

const performanceLevel = computed(() => {
  if (!performance.value || !performance.value.summary) return "No disponible"
  return performance.value.summary.level || "No clasificado"
})

const trendText = computed(() => {
  if (!performance.value || performance.value.trends?.changeRate === undefined) return "Sin datos"
  const trend = performance.value.trends.changeRate
  if (trend > 10) return "Mejorando significativamente"
  if (trend > 5) return "Mejorando"
  if (trend < -10) return "Declinando significativamente"
  if (trend < -5) return "Declinando"
  return "Estable"
})

const trendValueClass = computed(() => {
  if (!performance.value || performance.value.trends?.changeRate === undefined)
    return "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
  const trend = performance.value.trends.changeRate
  if (trend > 5) return "bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-200"
  if (trend < -5) return "bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-200"
  return "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
})

// Destacados y alertas
const highlights = computed(() => {
  if (!performance.value) return []
  const h: string[] = []

  if (performance.value.attendance.attendanceRate >= 95) {
    h.push("Excelente asistencia")
  }
  if (performance.value.repertoire.averageScore >= 90) {
    h.push("Destacado en repertorio")
  }
  if (performance.value.observations?.positiveComments?.length >= 2) {
    h.push("Múltiples comentarios positivos")
  }
  if (performance.value.trends?.changeRate > 10) {
    h.push("Mejora continua notable")
  }

  return h
})

const alerts = computed(() => {
  if (!performance.value) return []
  const a: string[] = []

  if (performance.value.attendance.attendanceRate < 75) {
    a.push("Asistencia baja, requiere atención")
  }
  if (performance.value.scores.overallScore < 60) {
    a.push("Rendimiento general preocupante")
  }
  if (performance.value.trends?.changeRate < -10) {
    a.push("Tendencia descendente marcada")
  }
  if (performance.value.attendance.punctuality < 80) {
    a.push("Puntualidad necesita mejorar")
  }

  return a
})

const recentComments = computed(() => {
  if (!performance.value || !performance.value.observations?.positiveComments) return []
  return performance.value.observations.positiveComments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2)
})

// Utility functions
const getScoreDescription = (score: number) => {
  if (score >= 90) return "Rendimiento excepcional en todas las áreas."
  if (score >= 80) return "Muy buen desempeño general."
  if (score >= 70) return "Desempeño sólido y consistente."
  if (score >= 60) return "Rendimiento aceptable, con áreas de mejora."
  return "Necesita mejorar significativamente su rendimiento."
}

const getAttendanceColor = (rate: number) => {
  if (rate >= 95) return "bg-green-500"
  if (rate >= 85) return "bg-blue-500"
  if (rate >= 75) return "bg-yellow-500"
  return "bg-red-500"
}

const getRepertoireColor = (score: number) => {
  if (score >= 90) return "bg-green-500"
  if (score >= 80) return "bg-blue-500"
  if (score >= 70) return "bg-yellow-500"
  return "bg-red-500"
}

const getWorkColor = (value: number, isHours = true) => {
  // Assuming practiceHours for individual, score for collective
  const score = isHours ? Math.min(value * 10, 100) : value // Normalize hours to a 0-100 scale if needed
  if (score >= 85) return "bg-green-500"
  if (score >= 75) return "bg-blue-500"
  if (score >= 65) return "bg-yellow-500"
  return "bg-red-500"
}

const categoryColorMap: Record<string, {bg: string; text: string; border: string}> = {
  técnica: {
    bg: "bg-blue-100 dark:bg-blue-700",
    text: "text-blue-700 dark:text-blue-200",
    border: "border-blue-500",
  },
  expresión: {
    bg: "bg-pink-100 dark:bg-pink-700",
    text: "text-pink-700 dark:text-pink-200",
    border: "border-pink-500",
  },
  comportamiento: {
    bg: "bg-green-100 dark:bg-green-700",
    text: "text-green-700 dark:text-green-200",
    border: "border-green-500",
  },
  progreso: {
    bg: "bg-yellow-100 dark:bg-yellow-700",
    text: "text-yellow-700 dark:text-yellow-200",
    border: "border-yellow-500",
  },
  liderazgo: {
    bg: "bg-indigo-100 dark:bg-indigo-700",
    text: "text-indigo-700 dark:text-indigo-200",
    border: "border-indigo-500",
  },
  creatividad: {
    bg: "bg-purple-100 dark:bg-purple-700",
    text: "text-purple-700 dark:text-purple-200",
    border: "border-purple-500",
  },
  default: {
    bg: "bg-gray-100 dark:bg-gray-600",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-400",
  },
}

const getCategoryClass = (category?: string) => {
  const cat = category?.toLowerCase() || "default"
  const colors = categoryColorMap[cat] || categoryColorMap.default
  return `${colors.bg} ${colors.text}`
}

const getCategoryBorderColor = (category?: string) => {
  const cat = category?.toLowerCase() || "default"
  const colors = categoryColorMap[cat] || categoryColorMap.default
  return colors.border
}

const formatLastUpdated = (dateString?: string) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  const diffMinutes = Math.round(diffSeconds / 60)
  const diffHours = Math.round(diffMinutes / 60)
  const diffDays = Math.round(diffHours / 24)

  if (diffMinutes < 1) return "justo ahora"
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  if (diffHours < 24) return `hace ${diffHours} h`
  if (diffDays === 1) return "ayer"
  if (diffDays < 7) return `hace ${diffDays} días`
  return date.toLocaleDateString("es-ES", {day: "numeric", month: "short"})
}

const formatCommentDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
}

const formatTrendValue = (trend: number) => {
  const sign = trend > 0 ? "+" : ""
  return `${sign}${Math.round(trend)}%`
}

// Lifecycle
let refreshInterval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (props.autoRefresh) {
    refreshInterval = setInterval(refreshData, 300000) // 5 minutos
  }
})

import {onUnmounted} from "vue"
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
/* Styles are now primarily handled by Tailwind CSS utility classes in the template. 
   This scoped style block can be used for very specific overrides or complex selectors if needed,
   but the goal is to minimize its use. */

/* Example of a more complex selector if absolutely necessary: */
/* .performance-widget .widget-title-section > .widget-title { ... } */

/* Ensure smooth animations */
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
