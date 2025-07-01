<template>
  <div class="analytics-dashboard space-y-6">
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Completion Efficiency -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Eficiencia de Completación</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpis.completionEfficiency }}%</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span :class="kpis.completionEfficiency >= 70 ? 'text-green-600' : 'text-red-600'">
              {{ kpis.completionEfficiency >= 70 ? "↗" : "↘" }}
            </span>
            <span class="text-gray-600 ml-1">Meta: 70%</span>
          </div>
        </div>
      </div>

      <!-- Quality Score -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Calidad Promedio</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpis.qualityScore }}/100</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span :class="getTrendColor(kpis.evaluationTrend)">
              {{ getTrendIcon(kpis.evaluationTrend) }}
            </span>
            <span class="text-gray-600 ml-1"
              >Tendencia: {{ getTrendText(kpis.evaluationTrend) }}</span
            >
          </div>
        </div>
      </div>

      <!-- Productivity -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Productividad Semanal</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpis.productivity }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-purple-600"
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
        </div>
        <div class="mt-4">
          <div class="text-sm text-gray-600">Obras esta semana</div>
        </div>
      </div>

      <!-- Overall Progress -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Progreso General</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpis.overallProgress }}%</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-orange-600 h-2 rounded-full transition-all duration-300"
              :style="{width: `${kpis.overallProgress}%`}"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Timeline Chart -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Actividad Mensual</h3>
          <select
            v-model="selectedTimelineMetric"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="works">Obras</option>
            <option value="evaluations">Evaluaciones</option>
            <option value="averageScore">Puntuación Promedio</option>
          </select>
        </div>
        <div class="h-64">
          <canvas ref="timelineChartRef" />
        </div>
      </div>

      <!-- Distribution Chart -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Distribución de Puntuaciones</h3>
        </div>
        <div class="h-64">
          <canvas ref="distributionChartRef" />
        </div>
      </div>
    </div>

    <!-- Detailed Metrics -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- State Distribution -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Estados de Obras</h3>
        <div class="space-y-3">
          <div
            v-for="(count, state) in stateMetrics.stateDistribution"
            :key="state"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 capitalize">{{ state }}</span>
            <div class="flex items-center gap-2">
              <div class="w-16 bg-gray-200 rounded-full h-2">
                <div
                  :class="getStateColor(state)"
                  class="h-2 rounded-full"
                  :style="{width: `${(count / totalStates) * 100}%`}"
                />
              </div>
              <span class="text-sm font-medium text-gray-900 min-w-[2rem]">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Time Metrics -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Métricas de Tiempo</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Promedio de completación</span>
            <span class="text-sm font-medium text-gray-900"
              >{{ kpis.averageCompletionDays }} días</span
            >
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Planes activos</span>
            <span class="text-sm font-medium text-gray-900">{{ kpis.activePlans }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Total evaluaciones</span>
            <span class="text-sm font-medium text-gray-900">{{ kpis.totalEvaluations }}</span>
          </div>
        </div>
      </div>

      <!-- Period Comparison -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Comparación Temporal</h3>
          <select
            v-model="selectedPeriod"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm"
            @change="updatePeriodComparison"
          >
            <option value="week">Semanal</option>
            <option value="month">Mensual</option>
            <option value="quarter">Trimestral</option>
          </select>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Obras</span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900">{{
                periodComparison.current.works
              }}</span>
              <span
                :class="periodComparison.changes.works >= 0 ? 'text-green-600' : 'text-red-600'"
                class="text-sm"
              >
                ({{ periodComparison.changes.works >= 0 ? "+" : ""
                }}{{ periodComparison.changes.works }})
              </span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Evaluaciones</span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900">{{
                periodComparison.current.evaluations
              }}</span>
              <span
                :class="
                  periodComparison.changes.evaluations >= 0 ? 'text-green-600' : 'text-red-600'
                "
                class="text-sm"
              >
                ({{ periodComparison.changes.evaluations >= 0 ? "+" : ""
                }}{{ periodComparison.changes.evaluations }})
              </span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Puntuación Promedio</span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900">{{
                periodComparison.current.averageScore
              }}</span>
              <span
                :class="
                  periodComparison.changes.averageScore >= 0 ? 'text-green-600' : 'text-red-600'
                "
                class="text-sm"
              >
                ({{ periodComparison.changes.averageScore >= 0 ? "+" : ""
                }}{{ periodComparison.changes.averageScore }})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch, nextTick} from "vue"
import {useMontajeAnalytics} from "../composables/useMontajeAnalytics"
import type {Work, Evaluation, WorkState, Plan} from "../types"

interface Props {
  works: Work[]
  evaluations: Evaluation[]
  states: WorkState[]
  plans: Plan[]
}

const props = defineProps<Props>()

const analytics = useMontajeAnalytics()

// Chart refs
const timelineChartRef = ref<HTMLCanvasElement>()
const distributionChartRef = ref<HTMLCanvasElement>()

// Selection state
const selectedTimelineMetric = ref<"works" | "evaluations" | "averageScore">("works")
const selectedPeriod = ref<"week" | "month" | "quarter">("month")

// Computed metrics
const kpis = computed(() =>
  analytics.calculateInstitutionalKPIs(props.works, props.plans, props.evaluations, props.states)
)

const stateMetrics = computed(() => analytics.calculateStateMetrics(props.states))

const totalStates = computed(() =>
  Object.values(stateMetrics.value.stateDistribution).reduce((sum, count) => sum + count, 0)
)

const periodComparison = ref(
  analytics.calculatePeriodComparison(props.works, props.evaluations, selectedPeriod.value)
)

const timelineData = computed(() => analytics.generateTimelineChart(props.works, props.evaluations))

const distributionData = computed(() => analytics.generateDistributionChart(props.evaluations))

// Methods
const getTrendColor = (trend: "up" | "down" | "neutral") => {
  switch (trend) {
    case "up":
      return "text-green-600"
    case "down":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

const getTrendIcon = (trend: "up" | "down" | "neutral") => {
  switch (trend) {
    case "up":
      return "↗"
    case "down":
      return "↘"
    default:
      return "→"
  }
}

const getTrendText = (trend: "up" | "down" | "neutral") => {
  switch (trend) {
    case "up":
      return "Mejorando"
    case "down":
      return "Descendente"
    default:
      return "Estable"
  }
}

const getStateColor = (state: string) => {
  const colorMap: Record<string, string> = {
    active: "bg-green-500",
    completed: "bg-blue-500",
    inactive: "bg-gray-500",
    archived: "bg-yellow-500",
    planning: "bg-purple-500",
    "in-progress": "bg-orange-500",
  }
  return colorMap[state] || "bg-gray-500"
}

const updatePeriodComparison = () => {
  periodComparison.value = analytics.calculatePeriodComparison(
    props.works,
    props.evaluations,
    selectedPeriod.value
  )
}

// Chart rendering (simplified for demo - in real implementation would use Chart.js)
const renderTimelineChart = () => {
  // This would integrate with a proper charting library like Chart.js
  console.log("Rendering timeline chart with data:", timelineData.value)
}

const renderDistributionChart = () => {
  // This would integrate with a proper charting library like Chart.js
  console.log("Rendering distribution chart with data:", distributionData.value)
}

// Watchers
watch([selectedTimelineMetric, timelineData], () => {
  nextTick(() => {
    renderTimelineChart()
  })
})

watch(distributionData, () => {
  nextTick(() => {
    renderDistributionChart()
  })
})

// Lifecycle
onMounted(() => {
  nextTick(() => {
    renderTimelineChart()
    renderDistributionChart()
  })
})
</script>
