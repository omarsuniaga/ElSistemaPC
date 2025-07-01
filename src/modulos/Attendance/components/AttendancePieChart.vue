# AttendancePieChart.vue
<script setup lang="ts">
import {Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartData} from "chart.js"
import {Pie} from "vue-chartjs"

ChartJS.register(ArcElement, Tooltip, Legend)

defineProps<{
  data: ChartData<"pie">
}>()

// Make sure the component is exported as default
defineExpose({})
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {}
}
</script>

<template>
  <Pie
    :data="data"
    :options="{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
      },
    }"
  />
</template>
