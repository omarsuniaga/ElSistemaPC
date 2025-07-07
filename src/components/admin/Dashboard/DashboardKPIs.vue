<template>
  <div class="p-4 md:p-6">
    <div class="mb-4">
      <h2 class="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
        Indicadores Clave
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Métricas principales de la academia
      </p>
    </div>
    
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <!-- KPI Card: Active Students -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
        <div class="flex flex-col space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex-shrink-0 bg-blue-500 dark:bg-blue-600 rounded-md p-2">
              <UserGroupIcon class="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div class="relative group">
              <QuestionMarkCircleIcon
                class="h-3 w-3 md:h-4 md:w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-32 md:w-48 bg-gray-700 dark:bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
              >
                Total de estudiantes activos
              </div>
            </div>
          </div>
          <div>
            <p class="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Estudiantes
            </p>
            <div
              v-if="isLoading"
              class="mt-1 h-6 md:h-7 w-16 md:w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"
            />
            <p v-else class="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white">
              {{ dashboardData?.students?.active || 0 }}
            </p>
            <p v-if="!isLoading" class="text-xs text-gray-500 dark:text-gray-400">
              de {{ dashboardData?.students?.total || 0 }} total
            </p>
          </div>
        </div>
      </div>

      <!-- KPI Card: Classes Today -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
        <div class="flex flex-col space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex-shrink-0 bg-green-500 dark:bg-green-600 rounded-md p-2">
              <CalendarDaysIcon class="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div class="relative group">
              <QuestionMarkCircleIcon
                class="h-3 w-3 md:h-4 md:w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-32 md:w-48 bg-gray-700 dark:bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
              >
                Clases programadas para hoy
              </div>
            </div>
          </div>
          <div>
            <p class="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Clases Hoy
            </p>
            <div
              v-if="isLoading"
              class="mt-1 h-6 md:h-7 w-16 md:w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"
            />
            <p v-else class="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white">
              {{ dashboardData?.classes?.today || 0 }}
            </p>
            <p v-if="!isLoading" class="text-xs text-gray-500 dark:text-gray-400">
              {{ dashboardData?.classes?.thisWeek || 0 }} esta semana
            </p>
          </div>
        </div>
      </div>

      <!-- KPI Card: Weekly Attendance -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
        <div class="flex flex-col space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex-shrink-0 bg-yellow-500 dark:bg-yellow-600 rounded-md p-2">
              <CheckCircleIcon class="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div class="relative group">
              <QuestionMarkCircleIcon
                class="h-3 w-3 md:h-4 md:w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-32 md:w-56 bg-gray-700 dark:bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
              >
                Asistencias registradas esta semana
              </div>
            </div>
          </div>
          <div>
            <p class="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Asistencia
            </p>
            <div
              v-if="isLoading"
              class="mt-1 h-6 md:h-7 w-16 md:w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"
            />
            <p v-else class="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white">
              {{ dashboardData?.attendance?.thisWeek || 0 }}
            </p>
            <div v-if="!isLoading" class="flex items-center space-x-1">
              <span 
                :class="attendanceTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                class="text-xs font-medium"
              >
                {{ attendanceTrend.isPositive ? '+' : '' }}{{ attendanceTrend.value }}%
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">vs anterior</span>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI Card: Active Teachers -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600">
        <div class="flex flex-col space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex-shrink-0 bg-purple-500 dark:bg-purple-600 rounded-md p-2">
              <BellAlertIcon class="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div class="relative group">
              <QuestionMarkCircleIcon
                class="h-3 w-3 md:h-4 md:w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-32 md:w-48 bg-gray-700 dark:bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
              >
                Maestros activos en el sistema
              </div>
            </div>
          </div>
          <div>
            <p class="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              Maestros
            </p>
            <div
              v-if="isLoading"
              class="mt-1 h-6 md:h-7 w-16 md:w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"
            />
            <p v-else class="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white">
              {{ dashboardData?.teachers?.active || 0 }}
            </p>
            <p v-if="!isLoading" class="text-xs text-gray-500 dark:text-gray-400">
              de {{ dashboardData?.teachers?.total || 0 }} total
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from "vue"
import {
  UserGroupIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  BellAlertIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/vue/24/outline"

defineOptions({ name: "DashboardKPIs" })

// ==================== INJECTED DATA ====================
const dashboardData = inject("dashboardData")
const isLoading = inject("isLoading")

// ==================== COMPUTED PROPERTIES ====================
const attendanceTrend = computed(() => {
  const thisWeek = dashboardData?.value?.attendance?.thisWeek || 0
  const lastWeek = dashboardData?.value?.attendance?.lastWeek || 0
  
  if (lastWeek === 0) {
    return { value: 0, isPositive: true }
  }
  
  const difference = thisWeek - lastWeek
  const percentage = Math.round((difference / lastWeek) * 100)
  
  return {
    value: Math.abs(percentage),
    isPositive: percentage >= 0
  }
})
</script>
