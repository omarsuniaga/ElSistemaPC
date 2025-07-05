<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      📈 Tendencias Semanales
    </h3>

    <div v-if="loading" class="h-48 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>

    <div v-else class="space-y-4">
      <!-- Simple bar chart representation -->
      <div class="space-y-3">
        <div v-for="(week, index) in mockWeeklyData" :key="index" class="flex items-center">
          <div class="w-16 text-sm text-gray-600">{{ week.label }}</div>
          <div class="flex-1 ml-3">
            <div class="flex items-center">
              <div class="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                <div
                  class="h-3 rounded-full transition-all duration-500"
                  :class="getBarColor(week.value)"
                  :style="{width: week.value + '%'}"
                />
              </div>
              <span class="text-sm font-medium w-12">{{ week.value }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="pt-4 border-t border-gray-200">
        <div class="grid grid-cols-2 gap-4 text-center">
          <div>
            <div class="text-lg font-bold text-green-600">{{ bestWeek }}%</div>
            <div class="text-xs text-gray-500">Mejor Semana</div>
          </div>
          <div>
            <div class="text-lg font-bold" :class="trendColor">{{ weeklyTrend }}</div>
            <div class="text-xs text-gray-500">Tendencia</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"

interface Props {
  trends?: any[]
  loading?: boolean
}

defineProps<Props>()

// Mock data for demonstration
const mockWeeklyData = [
  {label: "Sem 1", value: 85},
  {label: "Sem 2", value: 78},
  {label: "Sem 3", value: 82},
  {label: "Sem 4", value: 88},
]

const bestWeek = computed(() => {
  return Math.max(...mockWeeklyData.map((w) => w.value))
})

const weeklyTrend = computed(() => {
  const recent = mockWeeklyData.slice(-2)
  const change = recent[1].value - recent[0].value
  return change > 0 ? `+${change}%` : `${change}%`
})

const trendColor = computed(() => {
  const recent = mockWeeklyData.slice(-2)
  const change = recent[1].value - recent[0].value
  return change > 0 ? "text-green-600" : "text-red-600"
})

function getBarColor(value: number): string {
  if (value >= 85) return "bg-green-500"
  if (value >= 75) return "bg-yellow-500"
  return "bg-red-500"
}
</script>
