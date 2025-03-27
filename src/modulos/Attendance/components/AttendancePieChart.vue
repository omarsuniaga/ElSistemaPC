# AttendancePieChart.vue
<script setup lang="ts">
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData
} from 'chart.js'
import { Pie } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

defineProps<{
  data: ChartData<'pie'>
}>()
</script>

<template>
  <Pie 
    :data="data"
    :options="{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const
        }
      }
    }"
  />
</template>
