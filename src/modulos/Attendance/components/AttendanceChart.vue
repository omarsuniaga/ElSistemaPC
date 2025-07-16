<template>
  <div class="attendance-chart">
    <canvas ref="chartCanvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps<{
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string[]
      borderColor?: string
      borderWidth?: number
    }[]
  }
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const createChart = () => {
  if (!chartCanvas.value) return;

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(chartCanvas.value, {
    type: 'bar',
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Tendencia de Asistencia',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
};

onMounted(() => {
  createChart();
});

watch(
  () => props.data,
  () => {
    createChart();
  },
  { deep: true },
);
</script>

<script lang="ts">
export default {
  name: 'AttendanceChart',
};
</script>

<style scoped>
.attendance-chart {
  width: 100%;
  height: 300px;
  margin: 20px 0;
}
</style>
