<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">🚨 Alertas y Avisos</h3>
      <div class="flex space-x-2">
        <span
          v-if="alerts.length > 0"
          class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
        >
          {{ alerts.length }} críticas
        </span>
        <span
          v-if="warnings.length > 0"
          class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
        >
          {{ warnings.length }} avisos
        </span>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
          <div class="w-6 h-6 bg-gray-200 rounded-full" />
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div class="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="alerts.length === 0 && warnings.length === 0" class="text-center py-8">
      <div class="text-4xl mb-2">✅</div>
      <p class="text-gray-500">Todo funcionando correctamente</p>
      <p class="text-sm text-gray-400">No hay alertas en este momento</p>
    </div>

    <div v-else class="space-y-3 max-h-96 overflow-y-auto">
      <!-- Critical Alerts -->
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg"
      >
        <div class="flex items-start">
          <div class="text-red-500 mr-3 mt-0.5">🚨</div>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-red-800">{{ alert.message }}</h4>
            <p class="text-xs text-red-600 mt-1">
              {{ formatTimestamp(alert.createdAt) }}
            </p>

            <!-- Affected Items -->
            <div v-if="alert.affectedClasses?.length > 0" class="mt-2">
              <p class="text-xs text-red-700 font-medium">Clases afectadas:</p>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="className in alert.affectedClasses.slice(0, 3)"
                  :key="className"
                  class="inline-block bg-red-200 text-red-800 text-xs px-2 py-1 rounded"
                >
                  {{ className }}
                </span>
                <span
                  v-if="alert.affectedClasses.length > 3"
                  class="inline-block bg-red-200 text-red-800 text-xs px-2 py-1 rounded"
                >
                  +{{ alert.affectedClasses.length - 3 }} más
                </span>
              </div>
            </div>

            <!-- Suggested Actions -->
            <div v-if="alert.suggestedActions?.length > 0" class="mt-3">
              <p class="text-xs text-red-700 font-medium mb-1">Acciones sugeridas:</p>
              <div class="space-y-1">
                <button
                  v-for="action in alert.suggestedActions.slice(0, 2)"
                  :key="action"
                  class="block text-xs text-red-700 hover:text-red-900 hover:underline"
                  @click="executeAction(alert, action)"
                >
                  • {{ action }}
                </button>
              </div>
            </div>
          </div>

          <!-- Dismiss Button -->
          <button class="text-red-400 hover:text-red-600 ml-2" @click="dismissAlert(alert)">
            ✕
          </button>
        </div>
      </div>

      <!-- Warnings -->
      <div
        v-for="warning in warnings"
        :key="warning.id"
        class="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg"
      >
        <div class="flex items-start">
          <div class="text-yellow-500 mr-3 mt-0.5">⚠️</div>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-yellow-800">{{ warning.message }}</h4>
            <p class="text-xs text-yellow-600 mt-1">{{ warning.type }}</p>
          </div>
          <button
            class="text-yellow-400 hover:text-yellow-600 ml-2"
            @click="dismissWarning(warning)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div v-if="alerts.length > 0 || warnings.length > 0" class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex space-x-2">
        <button
          v-if="alerts.length > 0"
          class="flex-1 bg-red-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-red-700 transition-colors"
          @click="resolveAllCritical"
        >
          🚨 Resolver Críticas
        </button>
        <button
          class="flex-1 bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors"
          @click="generateAlertReport"
        >
          📊 Reporte
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Alert, Warning } from '@/analytics/composables/useAdvancedAnalytics';

interface Props {
  alerts: Alert[]
  warnings: Warning[]
  loading?: boolean
}

defineProps<Props>();

function formatTimestamp(date: Date): string {
  return new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60)),
    'hour',
  );
}

function executeAction(alert: Alert, action: string) {
  console.log(`Ejecutando acción "${action}" para alerta:`, alert.id);

  // Implementar acciones específicas
  switch (action) {
  case 'Contactar estudiantes ausentes':
    // Abrir modal de contacto masivo
    break;
  case 'Revisar horarios de clase':
    // Navegar a configuración de horarios
    break;
  case 'Evaluar metodología de enseñanza':
    // Abrir dashboard de evaluación
    break;
  }
}

function dismissAlert(alert: Alert) {
  console.log('Descartando alerta:', alert.id);
  // Implementar lógica para ocultar alerta
}

function dismissWarning(warning: Warning) {
  console.log('Descartando aviso:', warning.id);
  // Implementar lógica para ocultar aviso
}

function resolveAllCritical() {
  console.log('Resolviendo todas las alertas críticas...');
  // Implementar flujo de resolución masiva
}

function generateAlertReport() {
  console.log('Generando reporte de alertas...');
  // Implementar generación de reporte
}
</script>

<style scoped>
/* Animación de pulsado para alertas críticas */
.border-red-500 {
  animation: alertPulse 3s infinite;
}

@keyframes alertPulse {
  0%,
  100% {
    border-color: #ef4444;
    background-color: #fef2f2;
  }
  50% {
    border-color: #dc2626;
    background-color: #fee2e2;
  }
}

/* Scroll personalizado */
.max-h-96::-webkit-scrollbar {
  width: 4px;
}

.max-h-96::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.max-h-96::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}
</style>
