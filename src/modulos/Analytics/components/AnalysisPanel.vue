<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Análisis de Rendimiento</h2>
      
      <!-- Selector de período para todos los análisis -->
      <div class="flex space-x-2">
        <select v-model="selectedPeriod" class="px-3 py-1 border rounded-md text-sm">
          <option v-for="period in periods" :key="period.id" :value="period.id">
            {{ period.name }}
          </option>
        </select>
        
        <div v-if="customDateRange" class="flex space-x-2">
          <input 
            v-model="dateRange.startDate" 
            type="date" 
            class="px-2 py-1 border rounded-md text-sm" 
          />
          <input 
            v-model="dateRange.endDate" 
            type="date" 
            class="px-2 py-1 border rounded-md text-sm" 
          />
        </div>
      </div>
    </div>
    
    <!-- Tabs para diferentes tipos de análisis -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="selectedTab = tab.id"
          class="py-2 px-1 border-b-2 font-medium text-sm"
          :class="selectedTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>
    
    <!-- Attendance and Performance Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" v-show="selectedTab === 'general'">
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
    
    <!-- Análisis de Alumnos -->
    <div v-show="selectedTab === 'students'" class="space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card hover:shadow-md transition-shadow duration-300">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <UserGroupIcon class="w-5 h-5 mr-2 text-blue-500" />
            Asistencia de Alumnos
          </h3>
          <div class="flex flex-col space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 class="text-sm text-gray-500">Hoy</h4>
                <p class="text-2xl font-bold">{{ studentsAnalytics.daily }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 class="text-sm text-gray-500">Esta Semana</h4>
                <p class="text-2xl font-bold">{{ studentsAnalytics.weekly }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 class="text-sm text-gray-500">Este Mes</h4>
                <p class="text-2xl font-bold">{{ studentsAnalytics.monthly }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 class="text-sm text-gray-500">Período Actual</h4>
                <p class="text-2xl font-bold">{{ studentsAnalytics.periodTotal }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card hover:shadow-md transition-shadow duration-300 col-span-2">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <ChartPieIcon class="w-5 h-5 mr-2 text-blue-500" />
            Tendencia de Asistencia
          </h3>
          <div class="h-64">
            <Line
              :data="studentAttendanceTrend"
              :options="trendChartOptions"
            />
          </div>
        </div>
      </div>
      
      <!-- Tabla de rendimiento por instrumento -->
      <div class="card hover:shadow-md transition-shadow duration-300">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <MusicalNoteIcon class="w-5 h-5 mr-2 text-indigo-500" />
          Rendimiento por Instrumento
        </h3>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Instrumento
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Alumnos
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Asistencia
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rendimiento
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="instrument in instrumentPerformance" :key="instrument.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium">{{ instrument.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ instrument.students }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': instrument.attendance >= 90,
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': instrument.attendance >= 75 && instrument.attendance < 90,
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': instrument.attendance < 75
                      }">
                      {{ instrument.attendance }}%
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': instrument.performance >= 90,
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': instrument.performance >= 75 && instrument.performance < 90,
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': instrument.performance < 75
                      }">
                      {{ instrument.performance }}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Análisis de Maestros -->
    <div v-show="selectedTab === 'teachers'" class="space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card hover:shadow-md transition-shadow duration-300">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <AcademicCapIcon class="w-5 h-5 mr-2 text-emerald-500" />
            Balance de Maestros
          </h3>
          <div class="flex flex-col space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 class="text-sm text-gray-500">Total Activos</h4>
                <p class="text-2xl font-bold">{{ teachersAnalytics.active }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 class="text-sm text-gray-500">Asistencia Promedio</h4>
                <p class="text-2xl font-bold">{{ teachersAnalytics.avgAttendance }}%</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 class="text-sm text-gray-500">Clases Semanales</h4>
                <p class="text-2xl font-bold">{{ teachersAnalytics.weeklyClasses }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 class="text-sm text-gray-500">Horas Impartidas</h4>
                <p class="text-2xl font-bold">{{ teachersAnalytics.hoursWorked }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card hover:shadow-md transition-shadow duration-300 col-span-2">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <PresentationChartBarIcon class="w-5 h-5 mr-2 text-emerald-500" />
            Asistencia por Maestro
          </h3>
          <div class="h-64">
            <Bar
              :data="teacherAttendanceData"
              :options="barChartOptions"
            />
          </div>
        </div>
      </div>
      
      <!-- Balance de asistencia de maestros -->
      <div class="card hover:shadow-md transition-shadow duration-300">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <ClipboardDocumentCheckIcon class="w-5 h-5 mr-2 text-emerald-500" />
          Balance de Asistencias Semanales
        </h3>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Maestro
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Clases Programadas
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Clases Impartidas
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="teacher in teacherAttendanceBalance" :key="teacher.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium">{{ teacher.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ teacher.scheduledClasses }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ teacher.attendedClasses }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': teacher.balanceRate >= 90,
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': teacher.balanceRate >= 75 && teacher.balanceRate < 90,
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': teacher.balanceRate < 75
                      }">
                      {{ teacher.balanceRate }}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Análisis de Asistencias -->
    <div v-show="selectedTab === 'attendance'" class="space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Asistencia diaria -->
        <div class="card hover:shadow-md transition-shadow duration-300">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <CalendarDaysIcon class="w-5 h-5 mr-2 text-purple-500" />
            Asistencia Diaria
          </h3>
          <div class="h-64">
            <Line
              :data="dailyAttendanceData"
              :options="lineChartOptions"
            />
          </div>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h4 class="text-sm text-gray-500">Promedio Diario</h4>
              <p class="text-2xl font-bold">{{ attendanceAnalytics.dailyAverage }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h4 class="text-sm text-gray-500">Mayor Asistencia</h4>
              <p class="text-2xl font-bold">{{ attendanceAnalytics.peakDay }}</p>
            </div>
          </div>
        </div>

        <!-- Asistencia semanal -->
        <div class="card hover:shadow-md transition-shadow duration-300">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <CalendarIcon class="w-5 h-5 mr-2 text-purple-500" />
            Asistencia Semanal
          </h3>
          <div class="h-64">
            <Bar
              :data="weeklyAttendanceData"
              :options="barChartOptions"
            />
          </div>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h4 class="text-sm text-gray-500">Total Semanal</h4>
              <p class="text-2xl font-bold">{{ attendanceAnalytics.weeklyTotal }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h4 class="text-sm text-gray-500">Mejor Día</h4>
              <p class="text-2xl font-bold">{{ attendanceAnalytics.bestDay }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tendencia mensual -->
      <div class="card hover:shadow-md transition-shadow duration-300">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <ChartBarIcon class="w-5 h-5 mr-2 text-purple-500" />
          Tendencia Mensual
        </h3>
        <div class="h-80">
          <Bar
            :data="monthlyAttendanceTrend"
            :options="trendChartOptions"
          />
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500">Total Mensual</h4>
            <p class="text-2xl font-bold">{{ attendanceAnalytics.monthlyTotal }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500">Promedio Semanal</h4>
            <p class="text-2xl font-bold">{{ attendanceAnalytics.weeklyAverage }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500">Tasa de Crecimiento</h4>
            <p class="text-2xl font-bold" :class="attendanceAnalytics.growthRate >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ attendanceAnalytics.growthRate >= 0 ? '+' : '' }}{{ attendanceAnalytics.growthRate }}%
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- At Risk Students -->
    <div v-show="selectedTab === 'general'" class="card hover:shadow-md transition-shadow duration-300">
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
    <div v-show="selectedTab === 'general'" class="card hover:shadow-md transition-shadow duration-300">
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
import { ChartBarIcon, ExclamationTriangleIcon, TrophyIcon, BookOpenIcon, UserGroupIcon, ChartPieIcon, MusicalNoteIcon, AcademicCapIcon, PresentationChartBarIcon, ClipboardDocumentCheckIcon, CalendarDaysIcon, CalendarIcon } from '@heroicons/vue/24/outline';
import ChartContainer from '../../Analytics/components/ChartContainer.vue';
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
  studentsAnalytics: any;
  studentAttendanceTrend: any;
  trendChartOptions: any;
  instrumentPerformance: any[];
  teachersAnalytics: any;
  teacherAttendanceData: any;
  barChartOptions: any;
  teacherAttendanceBalance: any[];
  dailyAttendanceData: any;
  lineChartOptions: any;
  attendanceAnalytics: any;
  weeklyAttendanceData: any;
  monthlyAttendanceTrend: any;
  periods: any[];
  tabs: any[];
}>();

const selectedPeriod = ref(periods[0].id);
const customDateRange = ref(false);
const dateRange = ref({ startDate: '', endDate: '' });
const selectedTab = ref(tabs[0].id);
</script>
