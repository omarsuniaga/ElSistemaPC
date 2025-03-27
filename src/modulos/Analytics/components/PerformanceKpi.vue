<script setup lang="ts">
import { Chart } from 'chart.js'
import type { KpiData } from '../types/analytics'

defineProps<{
  title: string
  value: string | number
  trend: number
  icon: any
  metricType?: 'currency' | 'percentage' | 'default'
}>()
</script>

<template>
  <div class="kpi-card p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-medium text-gray-500">{{ title }}</h3>
        <p class="text-2xl font-semibold mt-1">
          {{ metricType === 'currency' ? `$${value}` : value }}
          <span v-if="metricType === 'percentage'" class="text-sm">%</span>
        </p>
      </div>
      <div class="flex items-center">
        <component :is="icon" class="w-8 h-8 text-indigo-600" />
      </div>
    </div>
    <div class="mt-2 flex items-center text-sm">
      <span :class="trend >= 0 ? 'text-green-600' : 'text-red-600'">
        {{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
      </span>
      <span class="ml-2 text-gray-500">vs último mes</span>
    </div>
  </div>
</template>