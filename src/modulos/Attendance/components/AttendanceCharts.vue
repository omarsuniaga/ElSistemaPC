<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Gráfico de Tendencia -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-4">Tendencia de Asistencia</h3>
      <div class="h-64">
        <line-chart
          :chart-data="trendChartData"
          :options="chartOptions"
        />
      </div>
    </div>

    <!-- Gráfico de Distribución -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-4">Distribución de Estados</h3>
      <div class="h-64">
        <pie-chart
          :chart-data="distributionChartData"
          :options="chartOptions"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Line as LineChart, Pie as PieChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  ArcElement
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  ArcElement
);

export default defineComponent({
  name: 'AttendanceCharts',
  components: {
    LineChart,
    PieChart
  },
  props: {
    attendanceData: {
      type: Object,
      required: true
    }
  },
  computed: {
    trendChartData() {
      return {
        labels: this.attendanceData.dates,
        datasets: [
          {
            label: 'Asistencia',
            data: this.attendanceData.attendance,
            borderColor: '#3B82F6',
            tension: 0.1
          }
        ]
      };
    },
    distributionChartData() {
      return {
        labels: ['Presentes', 'Ausentes', 'Justificados', 'Tardanzas'],
        datasets: [{
          data: [
            this.attendanceData.present,
            this.attendanceData.absent,
            this.attendanceData.justified,
            this.attendanceData.late
          ],
          backgroundColor: [
            '#10B981',
            '#EF4444',
            '#F59E0B',
            '#6366F1'
          ]
        }]
      };
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false
      };
    }
  }
});
</script>
