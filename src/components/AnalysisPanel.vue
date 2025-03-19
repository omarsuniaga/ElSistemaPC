<template>
  <div class="space-y-8">
    <h2 class="text-2xl font-bold mb-4">Análisis de Rendimiento</h2>
    
    <!-- Attendance and Performance Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Attendance by Day of Week -->
      <ChartContainer title="Asistencia por Día" :icon="ChartBarIcon">
        <Line
          :data="attendanceByDayOfWeek"
          :options="chartOptions"
        />
      </ChartContainer>
      
      <!-- Student Performance Distribution -->
      <ChartContainer title="Distribución de Rendimiento" :icon="ChartBarIcon">
        <Doughnut
          :data="studentPerformance"
          :options="doughnutOptions"
        />
      </ChartContainer>
    </div>
    
    <!-- At Risk Students -->
    <div class="card hover:shadow-md transition-shadow duration-300">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold flex items-center">
          <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-red-500" />
          Estudiantes en Riesgo
        </h3>
        <router-link to="/at-risk-students" class="text-sm text-blue-500 hover:underline">
          Ver todos
        </router-link>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estudiante
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Instrumento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rendimiento
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="student in atRiskStudents" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium">{{ student.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ student.instrument }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    {{ student.performance }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button @click="showAllAtRiskStudents" 
              class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
        Ver Todos
      </button>
    </div>
    
    <!-- Top Classes by Attendance -->
    <div class="card hover:shadow-md transition-shadow duration-300">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold flex items-center">
          <TrophyIcon class="w-5 h-5 mr-2 text-yellow-500" />
          Clases con Mejor Asistencia
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Clase
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Total
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Asistencia
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="classItem in bestAttendanceClasses" :key="classItem.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium">{{ classItem.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ classItem.total }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': classItem.attendanceRate >= 90,
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': classItem.attendanceRate >= 75 && classItem.attendanceRate < 90,
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': classItem.attendanceRate < 75
                    }">
                    {{ classItem.attendanceRate }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Academic Performance Indicators -->
    <div class="card hover:shadow-md transition-shadow duration-300">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold flex items-center">
          <BookOpenIcon class="w-5 h-5 mr-2 text-purple-500" />
          Indicadores con Bajo Rendimiento
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Indicador
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Asignatura
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Puntuación
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(indicator, idx) in lowestPerformanceIndicators" 
                :key="idx" 
                class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium">{{ indicator.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ indicator.subject }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': indicator.score >= 80,
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': indicator.score >= 70 && indicator.score < 80,
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': indicator.score < 70
                    }">
                    {{ indicator.score }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line, Doughnut } from 'vue-chartjs';
import { ChartBarIcon, ExclamationTriangleIcon, TrophyIcon, BookOpenIcon } from '@heroicons/vue/24/outline';
import ChartContainer from './ChartContainer.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const showAllAtRiskStudents = () => {
  router.push('/at-risk-students');
};

// Define props
defineProps<{
  attendanceByDayOfWeek: any;
  studentPerformance: any;
  chartOptions: any;
  doughnutOptions: any;
  atRiskStudents: any[];
  bestAttendanceClasses: any[];
  lowestPerformanceIndicators: any[];
}>();
</script>
