<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Análisis de Asistencia</h4>
      <p class="text-gray-600 dark:text-gray-400">
        Evaluación detallada del patrón de asistencia del estudiante
      </p>
    </div>

    <div class="space-y-6">
      <!-- Attendance Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex-shrink-0">
            <CalendarIcon class="w-6 h-6 text-green-500" />
          </div>
          <div class="space-y-1">
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ data?.attendanceRate || 0 }}%
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Tasa de Asistencia</p>
          </div>
        </div>

        <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex-shrink-0">
            <ClockIcon class="w-6 h-6 text-blue-500" />
          </div>
          <div class="space-y-1">
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ data?.punctualityRate || 0 }}%
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Puntualidad</p>
          </div>
        </div>

        <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex-shrink-0">
            <ExclamationTriangleIcon class="w-6 h-6 text-amber-500" />
          </div>
          <div class="space-y-1">
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ data?.absences || 0 }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Faltas Total</p>
          </div>
        </div>

        <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex-shrink-0">
            <ArrowTrendingUpIcon class="w-6 h-6 text-purple-500" />
          </div>
          <div class="space-y-1">
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ data?.trend || "Estable" }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Tendencia</p>
          </div>
        </div>
      </div>

      <!-- Attendance Pattern Chart -->
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
      >
        <h5 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Patrón de Asistencia (Últimos 3 meses)
        </h5>
        <div class="space-y-4">
          <!-- Chart implementation would go here -->
          <div class="space-y-4">
            <div class="flex items-end justify-between h-32 gap-1">
              <div
                v-for="week in mockWeeklyData"
                :key="week.week"
                class="flex-1 bg-blue-500 rounded-t-sm min-h-1 transition-all duration-300 hover:bg-blue-600"
                :style="{height: `${week.attendance}%`}"
                :title="`Semana ${week.week}: ${week.attendance}%`"
              />
            </div>
            <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span v-for="week in mockWeeklyData" :key="week.week"> S{{ week.week }} </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Insights -->
      <div class="space-y-4">
        <h5 class="text-base font-semibold text-gray-900 dark:text-white">Insights Detallados</h5>

        <div class="space-y-3">
          <div
            class="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          >
            <CheckCircleIcon class="w-5 h-5" />
            <p>Ha mejorado su asistencia en las últimas 4 semanas</p>
          </div>

          <div
            class="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          >
            <InformationCircleIcon class="w-5 h-5" />
            <p>Patrón más irregular los días lunes</p>
          </div>

          <div
            class="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
          >
            <ExclamationTriangleIcon class="w-5 h-5" />
            <p>3 faltas consecutivas en el último mes</p>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="space-y-4">
        <h5 class="text-base font-semibold text-gray-900 dark:text-white">Recomendaciones</h5>

        <div class="space-y-3">
          <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <LightBulbIcon class="w-5 h-5 text-yellow-500" />
            <div class="space-y-1">
              <h6 class="font-semibold text-gray-900 dark:text-white">
                Establecer rutina de recordatorios
              </h6>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Configurar notificaciones 30 minutos antes de cada clase
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <CalendarIcon class="w-5 h-5 text-blue-500" />
            <div class="space-y-1">
              <h6 class="font-semibold text-gray-900 dark:text-white">
                Agendar clases de recuperación
              </h6>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Programar sesiones adicionales para compensar clases perdidas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/vue/24/outline"

interface AttendanceAnalysisData {
  attendanceRate: number
  punctualityRate: number
  absences: number
  trend: string
  weeklyData?: Array<{
    week: number
    attendance: number
  }>
}

defineProps<{
  studentId: string
  data?: AttendanceAnalysisData
}>()

// Mock data for demonstration
const mockWeeklyData = [
  {week: 1, attendance: 100},
  {week: 2, attendance: 75},
  {week: 3, attendance: 100},
  {week: 4, attendance: 50},
  {week: 5, attendance: 100},
  {week: 6, attendance: 75},
  {week: 7, attendance: 100},
  {week: 8, attendance: 100},
  {week: 9, attendance: 75},
  {week: 10, attendance: 100},
  {week: 11, attendance: 100},
  {week: 12, attendance: 100},
]
</script>

<style scoped>
/* All @apply rules have been moved to the template */
</style>
