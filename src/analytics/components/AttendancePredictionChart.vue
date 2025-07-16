<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        🔮 Predicción de Asistencia
      </h3>
      <select
        v-model="selectedTimeRange"
        class="text-sm border border-gray-300 rounded-md px-3 py-1"
      >
        <option value="7">Próximos 7 días</option>
        <option value="14">Próximos 14 días</option>
        <option value="30">Próximo mes</option>
      </select>
    </div>

    <div v-if="loading" class="h-64 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>

    <div v-else-if="predictions.length === 0" class="h-64 flex items-center justify-center">
      <div class="text-center">
        <div class="text-4xl mb-2">📊</div>
        <p class="text-gray-500">No hay predicciones disponibles</p>
      </div>
    </div>

    <div v-else>
      <!-- Chart Container -->
      <div class="h-64 mb-4">
        <canvas ref="chartCanvas" class="w-full h-full" />
      </div>

      <!-- Prediction Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ averagePredictedAttendance }}%</div>
          <div class="text-sm text-blue-800">Asistencia Promedio Esperada</div>
        </div>

        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">
            {{ highConfidencePredictions }}
          </div>
          <div class="text-sm text-green-800">Predicciones de Alta Confianza</div>
        </div>

        <div class="text-center p-3 bg-red-50 rounded-lg">
          <div class="text-2xl font-bold text-red-600">
            {{ riskDays }}
          </div>
          <div class="text-sm text-red-800">Días de Alto Riesgo</div>
        </div>
      </div>

      <!-- Risk Alerts -->
      <div
        v-if="riskPredictions.length > 0"
        class="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg"
      >
        <div class="flex items-start">
          <div class="text-yellow-400 mr-2">⚠️</div>
          <div>
            <h4 class="text-sm font-medium text-yellow-800">Alertas de Predicción</h4>
            <ul class="mt-1 text-sm text-yellow-700">
              <li v-for="alert in riskPredictions.slice(0, 3)" :key="alert.classId">
                {{ alert.className }}: {{ alert.predictedAttendance }}% esperado ({{ alert.date }})
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { AttendancePrediction } from '@/analytics/composables/useAdvancedAnalytics';

interface Props {
  predictions: AttendancePrediction[]
  loading?: boolean
}

const props = defineProps<Props>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const selectedTimeRange = ref('7');

// Computed properties
const filteredPredictions = computed(() => {
  const days = parseInt(selectedTimeRange.value);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  return props.predictions.filter((p) => {
    const predDate = new Date(p.date);
    return predDate <= cutoffDate;
  });
});

const averagePredictedAttendance = computed(() => {
  if (filteredPredictions.value.length === 0) return 0;

  const total = filteredPredictions.value.reduce((sum, p) => sum + p.predictedAttendance, 0);
  const avg = total / filteredPredictions.value.length;
  return Math.round(avg);
});

const highConfidencePredictions = computed(() => {
  return filteredPredictions.value.filter((p) => p.confidence > 0.8).length;
});

const riskDays = computed(() => {
  return filteredPredictions.value.filter((p) => p.riskLevel === 'high').length;
});

const riskPredictions = computed(() => {
  return filteredPredictions.value.filter((p) => p.riskLevel === 'high');
});

// Chart rendering
function renderChart() {
  if (!chartCanvas.value || filteredPredictions.value.length === 0) return;

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height);

  // Set canvas size
  const rect = chartCanvas.value.getBoundingClientRect();
  chartCanvas.value.width = rect.width * window.devicePixelRatio;
  chartCanvas.value.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const width = rect.width;
  const height = rect.height;
  const padding = 40;

  // Group predictions by date
  const dateGroups = new Map<string, AttendancePrediction[]>();
  filteredPredictions.value.forEach((p) => {
    if (!dateGroups.has(p.date)) {
      dateGroups.set(p.date, []);
    }
    dateGroups.get(p.date)!.push(p);
  });

  const dates = Array.from(dateGroups.keys()).sort();
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Draw axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw grid lines and labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';

  // Y-axis labels (attendance percentage)
  for (let i = 0; i <= 10; i++) {
    const y = height - padding - (i / 10) * chartHeight;
    const percentage = i * 10;

    // Grid line
    if (i > 0) {
      ctx.strokeStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Label
    ctx.textAlign = 'right';
    ctx.fillText(`${percentage}%`, padding - 10, y + 4);
  }

  // X-axis labels (dates)
  dates.forEach((date, index) => {
    const x = padding + (index / (dates.length - 1)) * chartWidth;
    const dateObj = new Date(date);
    const label = dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });

    ctx.textAlign = 'center';
    ctx.fillText(label, x, height - padding + 20);
  });

  // Draw prediction line and points
  if (dates.length > 1) {
    const points: {x: number; y: number; prediction: AttendancePrediction}[] = [];

    dates.forEach((date, index) => {
      const predictions = dateGroups.get(date)!;
      const avgAttendance =
        predictions.reduce((sum, p) => sum + p.predictedAttendance, 0) / predictions.length;

      const x = padding + (index / (dates.length - 1)) * chartWidth;
      const y = height - padding - (avgAttendance / 100) * chartHeight;

      points.push({ x, y, prediction: predictions[0] });
    });

    // Draw line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw points
    points.forEach((point) => {
      const color = getRiskColor(point.prediction.riskLevel);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // White border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}

function getRiskColor(riskLevel: string): string {
  const colorMap = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  return colorMap[riskLevel as keyof typeof colorMap] || '#6b7280';
}

// Watchers and lifecycle
watch([() => props.predictions, selectedTimeRange], () => {
  setTimeout(renderChart, 100);
});

onMounted(() => {
  setTimeout(renderChart, 100);
  window.addEventListener('resize', renderChart);
});
</script>

<style scoped>
canvas {
  display: block;
}
</style>
