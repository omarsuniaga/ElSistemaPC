<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Análisis de Rendimiento</h2>
      
      <!-- Selector de período para todos los análisis -->
      <div class="flex space-x-2">
        <select v-model="selectedPeriod" class="px-3 py-1 border rounded-md text-sm dark:text-black">
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
    
    <!-- Alumnos con más ausencias en el rango seleccionado -->
    <div class="card hover:shadow-md transition-shadow duration-300 mt-8">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 space-y-3 lg:space-y-0">
        <h3 class="text-lg font-semibold flex items-center">
          <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-red-500" />
          Alumnos con más ausencias
        </h3>
        <div class="flex flex-wrap w-full lg:w-auto gap-2 items-center">
          <div class="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
            <div class="flex items-center">
              <label class="text-sm whitespace-nowrap mr-1">Desde:</label>
              <input type="date" v-model="absenceRange.start" class="dark:text-black border rounded px-2 py-1 text-sm w-full" />
            </div>
            <div class="flex items-center">
              <label class="text-sm whitespace-nowrap mr-1">Hasta:</label>
              <input type="date" v-model="absenceRange.end" class="border dark:text-black rounded px-2 py-1 text-sm w-full" />
            </div>
            <button 
              @click="filtrarAusenciasPorRango" 
              class="col-span-2 sm:col-span-1 sm:ml-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors duration-200"
            >
              Filtrar
            </button>
          </div>
          <div class="flex items-center w-full sm:w-auto mt-2 sm:mt-0">
            <label class="text-sm mr-1 whitespace-nowrap">Ordenar:</label>
            <select v-model="absenceSort" class="border dark:text-black rounded px-2 py-1 text-sm flex-grow">
              <option value="absences">Ausencias</option>
              <option value="attendanceRate">% Asistencia</option>
              <option value="lastAttendance">Última Asistencia</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Contenedor principal con dos visualizaciones: tabla para desktop y tarjetas para móvil -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <!-- Versión de tabla para pantallas medianas y grandes -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full table-auto">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estudiante</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ausencias</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Última Asistencia</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% Asistencia</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="student in sortedAbsentees" :key="student.studentId" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-4 py-2 text-sm">{{ studentName(student.studentId) }}</td>
                <td class="px-4 py-2 text-center text-sm">{{ student.absences }}</td>
                <td class="px-4 py-2 text-center text-sm">{{ formatDate(student.lastAttendance) }}</td>
                <td class="px-4 py-2 text-center">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': student.attendanceRate >= 90,
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': student.attendanceRate >= 75 && student.attendanceRate < 90,
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': student.attendanceRate < 75
                    }">
                    {{ Math.round(student.attendanceRate) }}%
                  </span>
                </td>
              </tr>
              <tr v-if="sortedAbsentees.length === 0">
                <td colspan="4" class="px-4 py-2 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron datos de ausencias en el rango seleccionado
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Versión de tarjetas para móvil -->
        <div class="md:hidden">
          <div v-if="sortedAbsentees.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
            No se encontraron datos de ausencias en el rango seleccionado
          </div>
          <div 
            v-else
            v-for="student in sortedAbsentees" 
            :key="student.studentId"
            class="border-b border-gray-200 dark:border-gray-700 p-4 last:border-b-0"
          >
            <div class="flex justify-between items-start">
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ studentName(student.studentId) }}
              </h4>
              <span class="px-2 py-1 text-xs leading-5 font-semibold rounded-full"
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': student.attendanceRate >= 90,
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': student.attendanceRate >= 75 && student.attendanceRate < 90,
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': student.attendanceRate < 75
                }">
                {{ Math.round(student.attendanceRate) }}%
              </span>
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div class="flex items-center">
                <span class="text-gray-500 dark:text-gray-400">Ausencias:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ student.absences }}</span>
              </div>
              <div class="flex items-center">
                <span class="text-gray-500 dark:text-gray-400">Última:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ formatDate(student.lastAttendance) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <span>Mostrando {{ sortedAbsentees.length }} estudiantes</span>
        <div v-if="bestAttendanceDay.bestDay" class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full">
          Día con más asistencias: <span class="font-semibold">{{ bestAttendanceDay.bestDay }}</span> ({{ bestAttendanceDay.total }} asistencias)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import Chart from 'chart.js/auto';
import { Line, Doughnut, Bar } from 'vue-chartjs';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  TrophyIcon, 
  BookOpenIcon, 
  UserGroupIcon, 
  ChartPieIcon, 
  MusicalNoteIcon, 
  AcademicCapIcon, 
  PresentationChartBarIcon, 
  ClipboardDocumentCheckIcon, 
  CalendarDaysIcon, 
  CalendarIcon 
} from '@heroicons/vue/24/outline';
import ChartContainer from '../../Analytics/components/ChartContainer.vue';
import { useRouter } from 'vue-router';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useClassesStore } from '../../Classes/store/classes';
import { useStudentsStore } from '../../Students/store/students';

const router = useRouter();

// Definir los eventos que este componente puede emitir
const emit = defineEmits(['period-changed', 'refresh-data']);

const showAllAtRiskStudents = () => {
  router.push('/at-risk-students');
};

const attendanceStore = useAttendanceStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
interface AbsentStudent {
  studentId: string;
  absences: number;
  lastAttendance: string;
  attendanceRate: number;
}

const topAbsentees = ref<AbsentStudent[]>([]);

// Define props con valores por defecto para evitar errores de undefined
const props = defineProps({
  attendanceByDayOfWeek: { type: Object, required: true },
  studentPerformance: { type: Object, required: true },
  chartOptions: { type: Object, required: true },
  doughnutOptions: { type: Object, default: () => ({}) },
  atRiskStudents: { type: Array, default: () => [] },
  bestAttendanceClasses: { type: Array, default: () => [] },
  lowestPerformanceIndicators: { type: Array, default: () => [] },
  studentsAnalytics: { 
    type: Object, 
    default: () => ({
      daily: 0,
      weekly: 0,
      monthly: 0,
      periodTotal: 0
    })
  },
  studentAttendanceTrend: { type: Object, default: () => ({}) },
  trendChartOptions: { type: Object, default: () => ({}) },
  instrumentPerformance: { type: Array, default: () => [] },
  teachersAnalytics: { 
    type: Object, 
    default: () => ({
      active: 0,
      avgAttendance: 0,
      weeklyClasses: 0,
      hoursWorked: 0
    })
  },
  teacherAttendanceData: { type: Object, default: () => ({}) },
  barChartOptions: { type: Object, default: () => ({}) },
  teacherAttendanceBalance: { type: Array, default: () => [] },
  dailyAttendanceData: { type: Object, default: () => ({}) },
  lineChartOptions: { type: Object, default: () => ({}) },
  attendanceAnalytics: { 
    type: Object, 
    default: () => ({
      dailyAverage: 0,
      peakDay: '',
      weeklyTotal: 0,
      bestDay: '',
      monthlyTotal: 0,
      weeklyAverage: 0,
      growthRate: 0
    })
  },
  weeklyAttendanceData: { type: Object, default: () => ({}) },
  monthlyAttendanceTrend: { type: Object, default: () => ({}) },
  periods: { 
    type: Array, 
    default: () => [{ id: 'current', name: 'Periodo Actual' }] 
  },
  tabs: { 
    type: Array, 
    default: () => [{ id: 'general', name: 'General' }] 
  }
});

const selectedPeriod = ref(props.periods.length > 0 ? props.periods[0].id : 'current');
const customDateRange = ref(false);
const dateRange = ref({ startDate: '', endDate: '' });
const selectedTab = ref(props.tabs.length > 0 ? props.tabs[0].id : 'general');

// Watcher para el cambio de período
watch(selectedPeriod, (newPeriod) => {
  // Actualizar el estado de fecha personalizada
  customDateRange.value = newPeriod === 'custom';
  
  // Emitir evento para notificar al componente padre sobre el cambio de período
  emit('period-changed', {
    period: newPeriod,
    dateRange: newPeriod === 'custom' ? dateRange.value : null
  });
  
  // Si es un período predefinido, actualizar automáticamente los datos
  if (newPeriod !== 'custom') {
    // Aquí se podrían cargar datos específicos para el período seleccionado
    // Por ejemplo, emitir un evento para que el componente padre actualice los datos
    emit('refresh-data', { period: newPeriod });
  }
});

// --- NUEVO: Cálculo del día con más asistencias ---
const bestAttendanceDay = ref({ bestDay: '', total: 0, attendanceByDay: {} });

async function calcularDiaMayorAsistencia(startDate, endDate) {
  await attendanceStore.fetchAttendanceByDateRange(startDate, endDate);
  const attendanceByDay = {
    'Domingo': 0, 'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Sábado': 0
  };
  attendanceStore.attendanceDocuments.forEach(doc => {
    const date = new Date(doc.fecha);
    const dayIndex = date.getDay();
    const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayIndex];
    const presentes = Array.isArray(doc.data.presentes) ? doc.data.presentes.length : 0;
    const tarde = Array.isArray(doc.data.tarde) ? doc.data.tarde.length : 0;
    attendanceByDay[dayName] += presentes + tarde;
  });
  let bestDay = '';
  let max = 0;
  for (const [day, total] of Object.entries(attendanceByDay)) {
    if (total > max) {
      max = total;
      bestDay = day;
    }
  }
  bestAttendanceDay.value = { bestDay, total: max, attendanceByDay };
}

// --- NUEVO: Alumnos con más ausencias en el rango seleccionado --- 
function studentName(studentId: string) {
  const student = studentsStore.getStudentById(studentId);
  if (student) {
    return `${student.nombre || ''} ${student.apellido || ''}`.trim();
  }
  return studentId;
}

async function calcularTopAbsentees(startDate: string, endDate: string) {
  await attendanceStore.fetchAttendanceByDateRange(startDate, endDate);
  // Usa el método del store para calcular ausentes
  topAbsentees.value = attendanceStore.calculateAbsentStudents(10);
}

onMounted(async () => {
  await classesStore.fetchClasses();
  await studentsStore.$patch({ students: [] }); // Limpia para evitar duplicados
  await studentsStore.$reset?.(); // Si existe método para resetear
  await studentsStore.$state.loading || await studentsStore.$state.error || await studentsStore.$state.lastSync || await studentsStore.$state.students;
  if (typeof studentsStore.fetchStudents === 'function') {
    await studentsStore.fetchStudents();
  }
  // Por ejemplo, analizar el último mes:
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 1);
  await calcularDiaMayorAsistencia(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10));
  await calcularTopAbsentees(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10));
});

const absenceRange = ref({
  start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
  end: new Date().toISOString().slice(0, 10)
});

async function filtrarAusenciasPorRango() {
  await calcularTopAbsentees(absenceRange.value.start, absenceRange.value.end);
}

const absenceSort = ref('absences');

const sortedAbsentees = computed(() => {
  if (!topAbsentees.value) return [];
  const arr = [...topAbsentees.value];
  if (absenceSort.value === 'attendanceRate') {
    return arr.sort((a, b) => a.attendanceRate - b.attendanceRate); // Menor % asistencia primero
  } else if (absenceSort.value === 'lastAttendance') {
    return arr.sort((a, b) => (a.lastAttendance < b.lastAttendance ? 1 : -1)); // Más reciente primero
  } else {
    return arr.sort((a, b) => b.absences - a.absences); // Más ausencias primero
  }
});

/**
 * Formatea una fecha de 'YYYY-MM-DD' a 'DD-MM-AAAA'
 */
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  // Validar que el formato de entrada sea correcto
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  
  // Dividir la fecha en partes
  const [year, month, day] = dateString.split('-');
  
  // Retornar en formato DD-MM-AAAA
  return `${day}-${month}-${year}`;
}
</script>
