<template>
  <div
    class="metric-card bg-white rounded-lg shadow-sm p-4 border hover:shadow-md transition-all duration-200"
    :class="cardColorClass"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div v-if="icon" class="text-2xl">{{ icon }}</div>
        <div>
          <h3 class="text-sm font-medium text-gray-600">{{ title }}</h3>
          <p class="text-2xl font-bold" :class="valueColorClass">{{ displayValue }}</p>
        </div>
      </div>

      <!-- Indicador de tendencia -->
      <div v-if="trend !== 0" class="flex items-center text-sm">
        <svg
          v-if="trend > 0"
          class="w-4 h-4 text-green-500 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7l5 5-5 5M6 12h12"
          />
        </svg>
        <svg
          v-else
          class="w-4 h-4 text-red-500 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 17l-5-5 5-5M18 12H6"
          />
        </svg>
        <span :class="trendColorClass"> {{ Math.abs(trend * 100).toFixed(1) }}% </span>
      </div>
    </div>

    <!-- Barra de progreso para métricas de porcentaje -->
    <div v-if="showProgress" class="mt-3">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all duration-500"
          :class="progressColorClass"
          :style="{width: progressPercentage + '%'}"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"

interface Props {
  title: string
  value: string | number
  icon?: string
  trend?: number
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray"
  showProgress?: boolean
  maxValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  trend: 0,
  color: "blue",
  showProgress: false,
  maxValue: 100,
})

const displayValue = computed(() => {
  if (typeof props.value === "number") {
    if (props.value > 1000) {
      return (props.value / 1000).toFixed(1) + "k"
    }
    return props.value.toString()
  }
  return props.value
})

const cardColorClass = computed(() => {
  const baseClasses = "border-l-4"
  const colorMap = {
    blue: "border-blue-500",
    green: "border-green-500",
    red: "border-red-500",
    yellow: "border-yellow-500",
    purple: "border-purple-500",
    gray: "border-gray-500",
  }
  return `${baseClasses} ${colorMap[props.color]}`
})

const valueColorClass = computed(() => {
  const colorMap = {
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-700",
    yellow: "text-yellow-700",
    purple: "text-purple-700",
    gray: "text-gray-700",
  }
  return colorMap[props.color]
})

const trendColorClass = computed(() => {
  return props.trend > 0 ? "text-green-600" : "text-red-600"
})

const progressColorClass = computed(() => {
  const colorMap = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    gray: "bg-gray-500",
  }
  return colorMap[props.color]
})

const progressPercentage = computed(() => {
  if (!props.showProgress) return 0

  const numericValue =
    typeof props.value === "string" ? parseFloat(props.value.replace("%", "")) : props.value

  return Math.min(100, Math.max(0, (numericValue / props.maxValue) * 100))
})
</script>

<style scoped>
.metric-card {
  cursor: default;
}

.metric-card:hover {
  transform: translateY(-1px);
}
</style>
