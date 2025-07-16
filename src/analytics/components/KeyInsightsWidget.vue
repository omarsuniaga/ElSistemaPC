<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">💡 Insights Clave</h3>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
          <div class="w-8 h-8 bg-gray-200 rounded-full" />
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div class="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div class="w-12 h-6 bg-gray-200 rounded" />
        </div>
      </div>
    </div>

    <div v-else-if="insights.length === 0" class="text-center py-8">
      <div class="text-4xl mb-2">🔍</div>
      <p class="text-gray-500">Generando insights...</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="insight in insights"
        :key="insight.id"
        class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
        :class="getCategoryBorder(insight.category)"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3">
            <div class="text-xl">{{ getCategoryIcon(insight.category) }}</div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-gray-900">{{ insight.title }}</h4>
              <p class="text-xs text-gray-600 mt-1">{{ insight.description }}</p>

              <!-- Metric Display -->
              <div class="flex items-center space-x-2 mt-2">
                <span class="text-lg font-bold" :class="getMetricColor(insight.metric)">
                  {{ formatMetric(insight.metric) }}
                </span>
                <span class="text-xs px-2 py-1 rounded-full" :class="getTrendColor(insight.trend)">
                  {{ getTrendText(insight.trend) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actionable Badge -->
          <div v-if="insight.actionable" class="flex-shrink-0">
            <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              Accionable
            </span>
          </div>
        </div>

        <!-- Action Button -->
        <div v-if="insight.actionable" class="mt-3 pt-3 border-t border-gray-100">
          <button
            class="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            @click="takeAction(insight)"
          >
            📋 Tomar Acción
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div v-if="insights.length > 0" class="mt-6 pt-4 border-t border-gray-200">
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <div class="text-lg font-bold text-blue-600">{{ actionableCount }}</div>
          <div class="text-xs text-gray-500">Insights Accionables</div>
        </div>
        <div>
          <div class="text-lg font-bold text-green-600">{{ improvingTrends }}</div>
          <div class="text-xs text-gray-500">Tendencias Positivas</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { KeyInsight } from '@/analytics/composables/useAdvancedAnalytics';

interface Props {
  insights: KeyInsight[]
  loading?: boolean
}

const props = defineProps<Props>();

const actionableCount = computed(() => {
  return props.insights.filter((insight) => insight.actionable).length;
});

const improvingTrends = computed(() => {
  return props.insights.filter((insight) => insight.trend === 'up').length;
});

function getCategoryIcon(category: string): string {
  const iconMap = {
    attendance: '📊',
    performance: '🎯',
    engagement: '💪',
    efficiency: '⚡',
  };
  return iconMap[category as keyof typeof iconMap] || '💡';
}

function getCategoryBorder(category: string): string {
  const borderMap = {
    attendance: 'border-l-4 border-l-blue-500',
    performance: 'border-l-4 border-l-green-500',
    engagement: 'border-l-4 border-l-purple-500',
    efficiency: 'border-l-4 border-l-orange-500',
  };
  return borderMap[category as keyof typeof borderMap] || 'border-l-4 border-l-gray-500';
}

function getMetricColor(metric: number): string {
  if (metric >= 0.8) return 'text-green-600';
  if (metric >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}

function getTrendColor(trend: string): string {
  const colorMap = {
    up: 'bg-green-100 text-green-800',
    down: 'bg-red-100 text-red-800',
    stable: 'bg-gray-100 text-gray-800',
  };
  return colorMap[trend as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
}

function getTrendText(trend: string): string {
  const textMap = {
    up: '📈 Mejorando',
    down: '📉 Decreciendo',
    stable: '➡️ Estable',
  };
  return textMap[trend as keyof typeof textMap] || 'Sin datos';
}

function formatMetric(metric: number): string {
  if (metric < 1) {
    return `${(metric * 100).toFixed(1)}%`;
  }
  return metric.toFixed(1);
}

function takeAction(insight: KeyInsight) {
  console.log('Tomando acción para insight:', insight.title);

  // Implementar acciones específicas según la categoría
  switch (insight.category) {
  case 'attendance':
    // Abrir modal de mejora de asistencia
    break;
  case 'performance':
    // Navegar a análisis de rendimiento
    break;
  case 'engagement':
    // Abrir herramientas de engagement
    break;
  case 'efficiency':
    // Mostrar optimizaciones sugeridas
    break;
  }
}
</script>

<style scoped>
/* Efecto de entrada suave */
.space-y-3 > div {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Efecto hover mejorado */
.hover\:shadow-md:hover {
  transform: translateY(-1px);
}
</style>
