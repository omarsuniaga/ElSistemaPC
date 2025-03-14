<template>
  <div class="analysis-panel">
    <h2>Panel de Análisis</h2>
    <div>
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useAttendanceStore } from '../stores/attendance';

Chart.register(...registerables);

const attendanceStore = useAttendanceStore();
const attendanceData = ref([]);
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const fetchAttendanceData = async () => {
  attendanceData.value = await attendanceStore.getAttendanceStats();
  renderChart();
};

const renderChart = () => {
  if (!chartCanvas.value) return;
  
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: ['Presentes', 'Ausentes', 'Justificados', 'Tardanzas'],
      datasets: [{
        label: 'Estadísticas de Asistencia',
        data: [
          attendanceData.value.present,
          attendanceData.value.absent,
          attendanceData.value.justified,
          attendanceData.value.late
        ],
        backgroundColor: ['#4caf50', '#f44336', '#ffeb3b', '#ff9800'],
      }],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
};

onMounted(() => {
  fetchAttendanceData();
});
</script>

<style scoped>
.analysis-panel {
  width: 100%;
  padding: 1rem;
}
</style>
