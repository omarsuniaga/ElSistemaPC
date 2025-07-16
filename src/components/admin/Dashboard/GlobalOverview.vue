<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
    <div class="mb-4 md:mb-6">
      <h2 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
        Resumen Global de la Academia
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Vista general del estado operacional del sistema
      </p>
    </div>

    <!-- 1. Indicador de Salud General del Sistema -->
    <div class="mb-4 md:mb-6">
      <h3 class="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Estado General del Sistema
      </h3>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div
            :class="systemHealthColor"
            class="w-3 h-3 md:w-4 md:h-4 rounded-full animate-pulse"
          />
          <p class="text-sm md:text-md font-medium text-gray-900 dark:text-white">
            {{ systemHealthMessage }}
          </p>
        </div>
        <div v-if="!isLoading" class="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          Última actualización: {{ lastUpdateTime }}
        </div>
      </div>
    </div>

    <!-- 2. Grid de Métricas Principales - Responsive -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      <!-- Total Estudiantes -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
        <div
          v-if="isLoading"
          class="h-6 md:h-8 w-12 md:w-16 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2 animate-pulse"
        />
        <p v-else class="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ dashboardData?.students?.total || 0 }}
        </p>
        <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Total Estudiantes
        </p>
      </div>
      
      <!-- Estudiantes Activos -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
        <div
          v-if="isLoading"
          class="h-6 md:h-8 w-12 md:w-16 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2 animate-pulse"
        />
        <p v-else class="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
          {{ dashboardData?.students?.active || 0 }}
        </p>
        <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Activos
        </p>
      </div>
      
      <!-- Total Maestros -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
        <div
          v-if="isLoading"
          class="h-6 md:h-8 w-12 md:w-16 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2 animate-pulse"
        />
        <p v-else class="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400">
          {{ dashboardData?.teachers?.total || 0 }}
        </p>
        <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Maestros
        </p>
      </div>
      
      <!-- Clases Hoy -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
        <div
          v-if="isLoading"
          class="h-6 md:h-8 w-12 md:w-16 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2 animate-pulse"
        />
        <p v-else class="text-lg md:text-2xl font-bold text-orange-600 dark:text-orange-400">
          {{ dashboardData?.classes?.today || 0 }}
        </p>
        <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Clases Hoy
        </p>
      </div>
    </div>

    <!-- 3. Reporte de Asistencia Diaria -->
    <div class="mb-4 md:mb-6">
      <ReporteAsistenciaDiaria />
    </div>

    <!-- 4. Estudiantes en Riesgo - Responsive -->
    <div class="mb-4 md:mb-6">
      <h3 class="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Estudiantes en Riesgo
        <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
          (Top 5 ausencias injustificadas)
        </span>
      </h3>
      
      <div
        v-if="isLoading"
        class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4"
      >
        <div v-for="i in 3" :key="i" class="flex justify-between items-center mb-2 last:mb-0">
          <div class="h-4 w-24 md:w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
          <div class="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
        </div>
      </div>
      
      <div
        v-else-if="studentsAtRisk.length === 0"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 md:p-4 text-center"
      >
        <div class="flex items-center justify-center space-x-2">
          <svg class="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm md:text-base text-green-700 dark:text-green-300">
            No hay estudiantes en riesgo actualmente
          </span>
        </div>
      </div>
      
      <div v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4">
        <div class="space-y-2 md:space-y-3">
          <div
            v-for="student in studentsAtRisk"
            :key="student.id"
            class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
          >
            <div class="flex-1 min-w-0">
              <span class="text-sm md:text-base text-gray-900 dark:text-white font-medium truncate block">
                {{ student.name }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Última asistencia: {{ student.lastAttendance || 'N/A' }}
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-red-600 dark:text-red-400 font-semibold text-sm md:text-base">
                {{ student.absences }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                ausencias
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Resumen Operacional -->
    <div>
      <h3 class="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Resumen Operacional
      </h3>
      
      <div
        v-if="isLoading"
        class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4"
      >
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
          <div class="h-4 w-20 md:w-24 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2 animate-pulse" />
          <div class="h-6 md:h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded mx-auto animate-pulse" />
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
          <div class="h-4 w-20 md:w-24 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2 animate-pulse" />
          <div class="h-6 md:h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded mx-auto animate-pulse" />
        </div>
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
          <p class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Nuevas Inscripciones (Último Mes)
          </p>
          <p class="text-lg md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {{ dashboardData?.systemHealth?.newEnrollments || 0 }}
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
          <p class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Clases Activas
          </p>
          <p class="text-lg md:text-2xl font-bold text-orange-600 dark:text-orange-400">
            {{ dashboardData?.classes?.active || 0 }}
          </p>
        </div>
      </div>
    </div>

    <!-- Reporte Semanal -->
    <div class="mt-4 md:mt-6">
      <AdminReporteSemanal />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import type { Ref } from 'vue';
import ReporteAsistenciaDiaria from '@/modulos/Attendance/views/ReporteAsistenciaDiaria.vue';
import AdminReporteSemanal from '@/modulos/Teachers/view/admin/AdminReporteSemanal.vue';

// Tipos
interface Student {
  id: string
  name: string
  absences: number
  lastAttendance?: string
}

interface DashboardData {
  students: {
    total: number
    active: number
  }
  teachers: {
    total: number
  }
  classes: {
    today: number
    active: number
  }
  systemHealth: {
    status: 'operational' | 'warning' | 'critical'
    message: string
    newEnrollments: number
  }
  studentsAtRisk: Student[]
  lastUpdate: Date
}

// Inyectar datos del dashboard padre
const dashboardData = inject<Ref<DashboardData | null>>('dashboardData');
const isLoading = inject<Ref<boolean>>('isLoading', { value: false } as Ref<boolean>);

// Computed properties para datos derivados
const systemHealthColor = computed(() => {
  if (isLoading.value) return 'bg-gray-300 dark:bg-gray-600';
  
  const status = dashboardData?.value?.systemHealth?.status;
  switch (status) {
  case 'operational':
    return 'bg-green-500';
  case 'warning':
    return 'bg-yellow-500';
  case 'critical':
    return 'bg-red-500';
  default:
    return 'bg-gray-400';
  }
});

const systemHealthMessage = computed(() => {
  if (isLoading.value) return 'Cargando estado del sistema...';
  return dashboardData?.value?.systemHealth?.message || 'Estado desconocido';
});

const studentsAtRisk = computed(() => {
  if (isLoading.value || !dashboardData?.value) return [];
  return dashboardData.value.studentsAtRisk?.slice(0, 5) || [];
});

const lastUpdateTime = computed(() => {
  if (!dashboardData?.value?.lastUpdate) return 'Nunca';
  return new Date(dashboardData.value.lastUpdate).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
});
</script>

<style scoped>
/* Add specific styles for GlobalOverview if needed */
</style>
