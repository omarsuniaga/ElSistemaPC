<template>
  <div class="barchart-container">
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import {Bar} from "vue-chartjs"
import "../../../utils/chartConfig"
import type {ChartData, ChartOptions} from "chart.js"

defineProps<{
  chartData: ChartData<"bar">
  options?: ChartOptions<"bar">
}>()
</script>

<style scoped>
.barchart-container {
  width: 100%;
  min-height: 300px;
}
</style>
