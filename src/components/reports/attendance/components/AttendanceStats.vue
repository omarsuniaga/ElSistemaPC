<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div
      class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
    >
      <div class="flex items-center">
        <CheckCircleIcon class="h-8 w-8 text-green-500 mr-3" />
        <div>
          <p class="text-2xl font-bold text-green-700 dark:text-green-300">{{ totalPresentes }}</p>
          <p class="text-sm text-green-600 dark:text-green-400">Presentes</p>
        </div>
      </div>
    </div>

    <div
      class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800"
    >
      <div class="flex items-center">
        <XCircleIcon class="h-8 w-8 text-red-500 mr-3" />
        <div>
          <p class="text-2xl font-bold text-red-700 dark:text-red-300">{{ totalAusentes }}</p>
          <p class="text-sm text-red-600 dark:text-red-400">Ausentes</p>
        </div>
      </div>
    </div>

    <div
      class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800"
    >
      <div class="flex items-center">
        <ClockIcon class="h-8 w-8 text-yellow-500 mr-3" />
        <div>
          <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{{ totalTardes }}</p>
          <p class="text-sm text-yellow-600 dark:text-yellow-400">Tardanzas</p>
        </div>
      </div>
    </div>

    <div
      class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-center">
        <ExclamationTriangleIcon class="h-8 w-8 text-blue-500 mr-3" />
        <div>
          <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ totalJustificados }}</p>
          <p class="text-sm text-blue-600 dark:text-blue-400">Justificados</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Métricas adicionales -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <div
      class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800"
    >
      <h3 class="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
        Asistencia Promedio
      </h3>
      <p class="text-3xl font-bold text-purple-800 dark:text-purple-200">
        {{ averageAttendancePercentage }}%
      </p>
    </div>

    <div
      class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800"
    >
      <h3 class="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
        Mejor Día de Asistencia
      </h3>
      <p class="text-lg font-semibold text-indigo-800 dark:text-indigo-200">
        {{ bestAttendanceDay }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline"

defineProps<{
  totalPresentes: number
  totalAusentes: number
  totalTardes: number
  totalJustificados: number
  averageAttendancePercentage: number
  bestAttendanceDay: string
}>()
</script>
