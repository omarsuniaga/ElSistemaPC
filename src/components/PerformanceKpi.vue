<template>
  <div class="card hover:shadow-md transition-shadow duration-300">
    <h3 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">{{ title }}</h3>
    <div class="flex items-center">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center border-4"
        :class="colorClass"
      >
        <span class="text-xl font-bold">{{ isPercentage ? `${value}%` : value }}</span>
      </div>
      <div class="ml-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"

const props = defineProps<{
  title: string
  value: number | string
  description: string
  isPercentage?: boolean
  thresholds?: {
    high?: number
    medium?: number
  }
  colorClasses?: {
    high: string
    medium: string
    low: string
    default?: string
  }
}>()

const colorClass = computed(() => {
  // Si se proporciona un colorClass default, usarlo
  if (!props.thresholds && props.colorClasses?.default) {
    return props.colorClasses.default
  }

  // Si no hay umbrales definidos, usar colores predeterminados basados en si es porcentaje
  if (!props.thresholds) {
    if (props.isPercentage) {
      return "border-blue-500 text-blue-500"
    } else {
      return "border-blue-500 text-blue-500"
    }
  }

  // Determinar color basado en umbrales
  const numValue = typeof props.value === "string" ? parseFloat(props.value) : props.value

  if (numValue >= (props.thresholds.high || 80)) {
    return props.colorClasses?.high || "border-green-500 text-green-500"
  } else if (numValue >= (props.thresholds.medium || 60)) {
    return props.colorClasses?.medium || "border-yellow-500 text-yellow-500"
  } else {
    return props.colorClasses?.low || "border-red-500 text-red-500"
  }
})
</script>
