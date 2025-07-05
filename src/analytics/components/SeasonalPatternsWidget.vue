<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      🌊 Patrones Estacionales
    </h3>

    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-32 bg-gray-200 rounded" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div v-for="i in 4" :key="i" class="animate-pulse">
          <div class="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- Patrón Anual -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Tendencia Anual de Asistencia</h4>
        <div class="relative h-32 bg-gray-50 rounded-lg p-4">
          <svg class="w-full h-full" viewBox="0 0 400 100">
            <defs>
              <linearGradient id="seasonalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color: #3b82f6; stop-opacity: 0.3" />
                <stop offset="100%" style="stop-color: #3b82f6; stop-opacity: 0.1" />
              </linearGradient>
            </defs>

            <!-- Línea de tendencia -->
            <polyline
              :points="getYearlyTrendPoints()"
              fill="none"
              stroke="#3B82F6"
              stroke-width="2"
              stroke-linecap="round"
            />

            <!-- Área bajo la curva -->
            <polygon :points="getYearlyAreaPoints()" fill="url(#seasonalGradient)" />

            <!-- Puntos de datos -->
            <circle
              v-for="(point, index) in yearlyData"
              :key="index"
              :cx="(index * 400) / (yearlyData.length - 1)"
              :cy="100 - point.value * 80"
              r="3"
              fill="#3B82F6"
              class="hover:r-5 transition-all cursor-pointer"
              @mouseover="showTooltip(point, $event)"
              @mouseleave="hideTooltip"
            />
          </svg>

          <!-- Etiquetas de meses -->
          <div class="flex justify-between text-xs text-gray-500 mt-2">
            <span v-for="month in months" :key="month" class="text-center">
              {{ month }}
            </span>
          </div>
        </div>
      </div>

      <!-- Estaciones del Año -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Rendimiento por Estación</h4>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="season in seasons"
            :key="season.name"
            class="p-4 border border-gray-200 rounded-lg text-center"
            :class="getSeasonBorder(season.performance)"
          >
            <div class="text-2xl mb-2">{{ season.icon }}</div>
            <h5 class="text-sm font-semibold text-gray-900">{{ season.name }}</h5>
            <div class="mt-2">
              <span class="text-lg font-bold" :class="getPerformanceColor(season.performance)">
                {{ Math.round(season.performance * 100) }}%
              </span>
              <p class="text-xs text-gray-500 mt-1">{{ season.description }}</p>
            </div>

            <!-- Indicadores de tendencia -->
            <div class="flex justify-center space-x-2 mt-3">
              <span
                v-for="factor in season.factors"
                :key="factor"
                class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {{ factor }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Eventos Especiales -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Impacto de Eventos Especiales</h4>
        <div class="space-y-3">
          <div
            v-for="event in specialEvents"
            :key="event.name"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <span class="text-lg">{{ event.icon }}</span>
              <div>
                <h5 class="text-sm font-semibold text-gray-900">{{ event.name }}</h5>
                <p class="text-xs text-gray-500">{{ event.period }}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold" :class="getImpactColor(event.impact)">
                {{ event.impact > 0 ? "+" : "" }}{{ Math.round(event.impact * 100) }}%
              </span>
              <p class="text-xs text-gray-500">vs promedio</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Predicciones y Recomendaciones -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Predicciones Próximos Meses</h4>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div v-for="prediction in predictions" :key="prediction.month" class="text-center">
              <div class="text-sm font-medium text-blue-900">{{ prediction.month }}</div>
              <div class="text-lg font-bold text-blue-700">
                {{ Math.round(prediction.expected * 100) }}%
              </div>
              <div class="text-xs text-blue-600">{{ prediction.confidence }}% confianza</div>
            </div>
          </div>

          <div class="border-t border-blue-200 pt-3">
            <h5 class="text-sm font-semibold text-blue-900 mb-2">
              💡 Recomendaciones Estacionales
            </h5>
            <ul class="space-y-1">
              <li class="text-xs text-blue-800">
                • Incrementar promociones en meses de baja asistencia
              </li>
              <li class="text-xs text-blue-800">
                • Planificar eventos especiales para mantener engagement
              </li>
              <li class="text-xs text-blue-800">• Ajustar horarios según patrones estacionales</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Métricas Resumen -->
      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div class="text-center">
          <div class="text-lg font-bold text-green-600">{{ bestSeason.name }}</div>
          <div class="text-xs text-gray-500">Mejor Estación</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-blue-600">
            {{ Math.round(seasonalVariation * 100) }}%
          </div>
          <div class="text-xs text-gray-500">Variación Estacional</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-purple-600">
            {{ Math.round(predictabilityScore * 100) }}%
          </div>
          <div class="text-xs text-gray-500">Predictibilidad</div>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-if="tooltip.show"
      class="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
      :style="{left: tooltip.x + 'px', top: tooltip.y + 'px'}"
    >
      {{ tooltip.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from "vue"

interface YearlyDataPoint {
  month: string
  value: number
}

interface Season {
  name: string
  icon: string
  performance: number
  description: string
  factors: string[]
}

interface SpecialEvent {
  name: string
  icon: string
  period: string
  impact: number
}

interface Prediction {
  month: string
  expected: number
  confidence: number
}

interface Props {
  loading?: boolean
}

defineProps<Props>()

// Datos de ejemplo (en implementación real vendrían de la API)
const yearlyData = ref<YearlyDataPoint[]>([
  {month: "Ene", value: 0.72},
  {month: "Feb", value: 0.78},
  {month: "Mar", value: 0.85},
  {month: "Abr", value: 0.88},
  {month: "May", value: 0.92},
  {month: "Jun", value: 0.89},
  {month: "Jul", value: 0.75},
  {month: "Ago", value: 0.68},
  {month: "Sep", value: 0.85},
  {month: "Oct", value: 0.9},
  {month: "Nov", value: 0.82},
  {month: "Dic", value: 0.7},
])

const months = computed(() => yearlyData.value.map((data) => data.month))

const seasons = ref<Season[]>([
  {
    name: "Primavera",
    icon: "🌸",
    performance: 0.88,
    description: "Excelente participación",
    factors: ["Clima", "Motivación", "Nuevos estudiantes"],
  },
  {
    name: "Verano",
    icon: "☀️",
    performance: 0.77,
    description: "Reducción por vacaciones",
    factors: ["Vacaciones", "Calor", "Horarios flexibles"],
  },
  {
    name: "Otoño",
    icon: "🍂",
    performance: 0.86,
    description: "Retorno y estabilidad",
    factors: ["Vuelta rutina", "Nuevos cursos", "Clima agradable"],
  },
  {
    name: "Invierno",
    icon: "❄️",
    performance: 0.73,
    description: "Menor asistencia",
    factors: ["Frío", "Fiestas", "Enfermidades"],
  },
])

const specialEvents = ref<SpecialEvent[]>([
  {name: "Concierto Anual", icon: "🎵", period: "Mayo", impact: 0.15},
  {name: "Vacaciones Escolares", icon: "🏖️", period: "Jul-Ago", impact: -0.23},
  {name: "Festivales Navideños", icon: "🎄", period: "Diciembre", impact: -0.12},
  {name: "Recitales de Primavera", icon: "🌻", period: "Abril", impact: 0.18},
])

const predictions = ref<Prediction[]>([
  {month: "Feb", expected: 0.79, confidence: 85},
  {month: "Mar", expected: 0.84, confidence: 88},
  {month: "Abr", expected: 0.87, confidence: 82},
])

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  content: "",
})

// Computadas
const bestSeason = computed(() => {
  return seasons.value.reduce((best, season) => {
    return season.performance > best.performance ? season : best
  })
})

const seasonalVariation = computed(() => {
  const values = yearlyData.value.map((data) => data.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  return max - min
})

const predictabilityScore = computed(() => {
  // Simulación de score de predictibilidad basado en varianza
  return 0.84
})

// Métodos para el gráfico SVG
function getYearlyTrendPoints(): string {
  return yearlyData.value
    .map((point, index) => {
      const x = (index * 400) / (yearlyData.value.length - 1)
      const y = 100 - point.value * 80
      return `${x},${y}`
    })
    .join(" ")
}

function getYearlyAreaPoints(): string {
  const points = getYearlyTrendPoints()
  const firstX = 0
  const lastX = 400
  return `${firstX},100 ${points} ${lastX},100`
}

function getSeasonBorder(performance: number): string {
  if (performance >= 0.85) return "border-green-300 bg-green-50"
  if (performance >= 0.75) return "border-yellow-300 bg-yellow-50"
  return "border-red-300 bg-red-50"
}

function getPerformanceColor(performance: number): string {
  if (performance >= 0.85) return "text-green-600"
  if (performance >= 0.75) return "text-yellow-600"
  return "text-red-600"
}

function getImpactColor(impact: number): string {
  return impact > 0 ? "text-green-600" : "text-red-600"
}

function showTooltip(point: YearlyDataPoint, event: MouseEvent) {
  tooltip.value = {
    show: true,
    x: event.offsetX,
    y: event.offsetY - 30,
    content: `${point.month}: ${Math.round(point.value * 100)}%`,
  }
}

function hideTooltip() {
  tooltip.value.show = false
}
</script>

<style scoped>
/* Efectos suaves para elementos interactivos */
.transition-all {
  transition: all 0.3s ease;
}

/* Animaciones de hover para elementos SVG */
circle:hover {
  r: 5;
  transition: r 0.2s ease;
}
</style>
