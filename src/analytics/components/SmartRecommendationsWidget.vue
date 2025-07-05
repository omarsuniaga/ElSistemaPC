<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        💡 Recomendaciones Inteligentes
      </h3>
      <span class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
        {{ recommendations.length }} sugerencias
      </span>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="h-4 bg-gray-200 rounded w-3/4" />
            <div class="h-6 bg-gray-200 rounded-full w-16" />
          </div>
          <div class="h-3 bg-gray-200 rounded w-full mb-2" />
          <div class="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>

    <div v-else-if="recommendations.length === 0" class="text-center py-8">
      <div class="text-4xl mb-2">🎯</div>
      <p class="text-gray-500">Todo funcionando perfectamente</p>
      <p class="text-sm text-gray-400">No hay recomendaciones en este momento</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="recommendation in recommendations"
        :key="recommendation.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
        :class="getRecommendationBorder(recommendation.priority)"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-start space-x-3">
            <div class="text-xl flex-shrink-0">
              {{ getTypeIcon(recommendation.type) }}
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-semibold text-gray-900 leading-tight">
                {{ recommendation.title }}
              </h4>
              <p class="text-xs text-gray-600 mt-1">
                {{ recommendation.description }}
              </p>
            </div>
          </div>

          <!-- Priority Badge -->
          <span
            class="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full"
            :class="getPriorityColor(recommendation.priority)"
          >
            Prioridad {{ recommendation.priority }}
          </span>
        </div>

        <!-- Metrics -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-4 text-xs text-gray-500">
            <div class="flex items-center space-x-1">
              <span>📈 Impacto:</span>
              <span class="font-medium text-green-600">
                +{{ (recommendation.impact * 100).toFixed(0) }}%
              </span>
            </div>
            <div class="flex items-center space-x-1">
              <span>⚡ Esfuerzo:</span>
              <span class="font-medium" :class="getEffortColor(recommendation.effort)">
                {{ getEffortText(recommendation.effort) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            class="h-2 rounded-full transition-all duration-500"
            :class="getImpactColor(recommendation.impact)"
            :style="{width: recommendation.impact * 100 + '%'}"
          />
        </div>

        <!-- Actions -->
        <div class="flex space-x-2">
          <button
            class="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
            @click="implementRecommendation(recommendation)"
          >
            ✅ Implementar
          </button>
          <button
            class="flex-1 bg-gray-100 text-gray-700 text-xs font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
            @click="getMoreDetails(recommendation)"
          >
            📋 Detalles
          </button>
          <button
            class="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
            @click="dismissRecommendation(recommendation)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div v-if="recommendations.length > 0" class="mt-6 pt-4 border-t border-gray-200">
      <div class="grid grid-cols-3 gap-3 text-center">
        <div>
          <div class="text-lg font-bold text-blue-600">{{ getTotalImpact() }}%</div>
          <div class="text-xs text-gray-500">Impacto Total</div>
        </div>
        <div>
          <div class="text-lg font-bold text-green-600">
            {{ getHighPriorityCount() }}
          </div>
          <div class="text-xs text-gray-500">Alta Prioridad</div>
        </div>
        <div>
          <div class="text-lg font-bold text-purple-600">
            {{ getLowEffortCount() }}
          </div>
          <div class="text-xs text-gray-500">Bajo Esfuerzo</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import type {SmartRecommendation} from "@/analytics/composables/useAdvancedAnalytics"

interface Props {
  recommendations: SmartRecommendation[]
  loading?: boolean
}

const props = defineProps<Props>()

function getTypeIcon(type: string): string {
  const iconMap = {
    schedule: "📅",
    communication: "📞",
    engagement: "🎯",
    capacity: "📊",
  }
  return iconMap[type as keyof typeof iconMap] || "💡"
}

function getPriorityColor(priority: number): string {
  if (priority >= 8) return "bg-red-100 text-red-800"
  if (priority >= 6) return "bg-yellow-100 text-yellow-800"
  return "bg-green-100 text-green-800"
}

function getRecommendationBorder(priority: number): string {
  if (priority >= 8) return "border-l-4 border-l-red-500"
  if (priority >= 6) return "border-l-4 border-l-yellow-500"
  return "border-l-4 border-l-green-500"
}

function getEffortColor(effort: string): string {
  const colorMap = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600",
  }
  return colorMap[effort as keyof typeof colorMap] || "text-gray-600"
}

function getEffortText(effort: string): string {
  const textMap = {
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
  }
  return textMap[effort as keyof typeof textMap] || "Desconocido"
}

function getImpactColor(impact: number): string {
  if (impact >= 0.15) return "bg-green-500"
  if (impact >= 0.1) return "bg-yellow-500"
  return "bg-blue-500"
}

function getTotalImpact(): number {
  const total = props.recommendations.reduce((sum, rec) => sum + rec.impact, 0)
  return Math.round(total * 100)
}

function getHighPriorityCount(): number {
  return props.recommendations.filter((rec) => rec.priority >= 7).length
}

function getLowEffortCount(): number {
  return props.recommendations.filter((rec) => rec.effort === "low").length
}

function implementRecommendation(recommendation: SmartRecommendation) {
  console.log("Implementando recomendación:", recommendation.title)

  // Aquí implementarías la lógica específica para cada tipo
  switch (recommendation.type) {
    case "schedule":
      // Abrir modal de optimización de horarios
      break
    case "communication":
      // Configurar comunicación automática
      break
    case "engagement":
      // Implementar estrategias de engagement
      break
    case "capacity":
      // Ajustar capacidad de clases
      break
  }
}

function getMoreDetails(recommendation: SmartRecommendation) {
  console.log("Mostrando detalles de:", recommendation.title)
  // Abrir modal con análisis detallado
}

function dismissRecommendation(recommendation: SmartRecommendation) {
  console.log("Descartando recomendación:", recommendation.id)
  // Implementar lógica para ocultar recomendación
}
</script>

<style scoped>
/* Animación de entrada para recomendaciones */
.space-y-3 > div {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Efectos hover para botones */
button:hover {
  transform: translateY(-1px);
}

/* Indicador visual para prioridades altas */
.border-l-red-500 {
  position: relative;
}

.border-l-red-500::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #ef4444, #dc2626);
  border-radius: 0 2px 2px 0;
}
</style>
