<template>
  <div class="h-full w-full">
    <Line 
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { computed } from 'vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default {
  name: 'AttendanceTrendChart',
  components: {
    Line
  },
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const chartOptions = computed(() => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + '%'
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y + '%'
            }
          }
        }
      },
    }))

    const chartData = computed(() => props.data)

    return {
      chartOptions,
      chartData
    }
  }
}
</script>
