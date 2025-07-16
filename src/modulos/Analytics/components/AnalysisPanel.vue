<template>
  <!-- Alumnos con más ausencias en el rango seleccionado -->
  <TopAbsenteesByRange :limit="10" class="mt-8" />
  <div class="space-y-8">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Análisis de Rendimiento</h2>

      <!-- Selector de período para todos los análisis -->
      <div class="flex space-x-2">
        <select
          v-model="selectedPeriod"
          class="px-3 py-1 border rounded-md text-sm dark:text-black"
        >
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
          class="py-2 px-1 border-b-2 font-medium text-sm"
          :class="
            selectedTab === tab.id
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          "
          @click="selectedTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Attendance and Performance Charts -->
    <div v-show="selectedTab === 'general'" class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Attendance by Day of Week -->
      <ChartContainer title="Asistencia por Día" :icon="ChartBarIcon">
        <Line :data="attendanceByDayOfWeek" :options="chartOptions" />
      </ChartContainer>

      <!-- Student Performance Distribution -->
      <ChartContainer title="Distribución de Rendimiento" :icon="ChartBarIcon">
        <Doughnut :data="studentPerformance" :options="doughnutOptions" />
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
        <!-- aqui topAbsenteesByRange -->
        <TopAbsenteesByRange :limit="10" class="mt-8" />

        <div class="card hover:shadow-md transition-shadow duration-300 col-span-2">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <ChartPieIcon class="w-5 h-5 mr-2 text-blue-500" />
            Tendencia de Asistencia
          </h3>
          <div class="h-64">
            <Line :data="studentAttendanceTrend" :options="trendChartOptions" />
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
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Instrumento
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Total Alumnos
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Asistencia
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Rendimiento
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="instrumento in instrumentPerformance"
                :key="instrumento.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium">{{ instrumento.nombre }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ instrumento.students }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span
                      class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300':
                          instrumento.attendance >= 90,
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300':
                          instrumento.attendance >= 75 && instrumento.attendance < 90,
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300':
                          instrumento.attendance < 75,
                      }"
                    >
                      {{ instrumento.attendance }}%
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span
                      class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300':
                          instrumento.rendimiento >= 90,
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300':
                          instrumento.rendimiento >= 75 && instrumento.rendimiento < 90,
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300':
                          instrumento.rendimiento < 75,
                      }"
                    >
                      {{ instrumento.rendimiento }}%
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
      <!-- Lista de maestros reales -->
      <div v-if="teachersStore.teachers && teachersStore.teachers.length">
        <table class="min-w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Maestro
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Especialidad
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Clases
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Asistencia (%)
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Eficiencia
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tm in teacherMetrics" :key="tm.id">
              <td class="px-4 py-2">{{ tm.name }}</td>
              <td class="px-4 py-2">{{ tm.specialty }}</td>
              <td class="px-4 py-2">{{ tm.classCount }}</td>
              <td class="px-4 py-2">{{ tm.attendanceRate.toFixed(1) }}</td>
              <td class="px-4 py-2">{{ tm.efficiency.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-center py-8 text-gray-500">No hay datos de maestros.</div>

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
            <Bar :data="teacherAttendanceData" :options="barChartOptions" />
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
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Maestro
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Clases Programadas
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Clases Impartidas
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Balance
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="teacher in teacherAttendanceBalance"
                :key="teacher.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
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
                    <span
                      class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300':
                          teacher.balanceRate >= 90,
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300':
                          teacher.balanceRate >= 75 && teacher.balanceRate < 90,
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300':
                          teacher.balanceRate < 75,
                      }"
                    >
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
            <Line :data="dailyAttendanceData" :options="lineChartOptions" />
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
            <Bar :data="weeklyAttendanceData" :options="barChartOptions" />
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
          <Bar :data="monthlyAttendanceTrend" :options="trendChartOptions" />
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
            <p
              class="text-2xl font-bold"
              :class="attendanceAnalytics.growthRate >= 0 ? 'text-green-500' : 'text-red-500'"
            >
              {{ attendanceAnalytics.growthRate >= 0 ? "+" : ""
              }}{{ attendanceAnalytics.growthRate }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import TopAbsenteesByRange from '@/components/TopAbsenteesByRange.vue';
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
  CalendarIcon,
} from '@heroicons/vue/24/outline';
import ChartContainer from '../../Analytics/components/ChartContainer.vue';
import { useRouter } from 'vue-router';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useClassesStore } from '../../Classes/store/classes';
import { useStudentsStore } from '../../Students/store/students';
import { useTeachersStore } from '../../Teachers/store/teachers';

const router = useRouter();

// Definir los eventos que este componente puede emitir
const emit = defineEmits(['period-changed', 'refresh-data']);

const showAllAtRiskStudents = () => {
  router.push('/at-risk-students');
};

const attendanceStore = useAttendanceStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const teachersStore = useTeachersStore();

// --- Teacher Metrics Computed Property ---
const teacherMetrics = computed(() => {
  return teachersStore.teachers.map((teacher) => {
    // Specialty: take first specialty or fallback
    const specialty =
      Array.isArray(teacher.specialties) && teacher.specialties.length > 0
        ? teacher.specialties[0]
        : teacher.specialty || 'No especificado';
    // Class count
    const teacherClasses = classesStore.classes.filter((c) => c.teacherId === teacher.id);
    const classCount = teacherClasses.length;
    // Attendance: count how many classes have attendance records for this teacher
    const teacherClassIds = teacherClasses.map((c) => c.id);
    // only include docs that have a data object
    const teacherAttendanceDocs = attendanceStore.attendanceDocuments.filter(
      (doc) => doc.data && teacherClassIds.includes(doc.classId),
    );

    const totalAttendance = teacherAttendanceDocs.length;
    // Attendance rate: average attendance rate over these classes
    let attendanceRate = 0;
    if (totalAttendance > 0) {
      let sum = 0;
      teacherAttendanceDocs.forEach((doc) => {
        const presentes = Array.isArray(doc.data.presentes) ? doc.data.presentes.length : 0;
        const tarde = Array.isArray(doc.data.tarde) ? doc.data.tarde.length : 0;
        const total = presentes + tarde;
        const totalStudents =
          (Array.isArray(doc.data.presentes) ? doc.data.presentes.length : 0) +
          (Array.isArray(doc.data.ausentes) ? doc.data.ausentes.length : 0) +
          (Array.isArray(doc.data.tarde) ? doc.data.tarde.length : 0);
        sum += totalStudents > 0 ? (total / totalStudents) * 100 : 0;
      });
      attendanceRate = sum / totalAttendance;
    }
    // Efficiency: simple average of class count and attendance rate (normalize class count if needed)
    // For demo, efficiency = (attendanceRate + (classCount * 10)) / 2
    // Adjust this formula as needed
    const efficiency = (attendanceRate + classCount * 10) / 2;
    return {
      id: teacher.id,
      name: teacher.name,
      specialty,
      classCount,
      attendanceRate,
      efficiency,
    };
  });
});

interface AbsentStudent {
  studentId: string
  absences: number
  lastAttendance: string
  attendanceRate: number
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
      periodTotal: 0,
    }),
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
      hoursWorked: 0,
    }),
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
      growthRate: 0,
    }),
  },
  weeklyAttendanceData: { type: Object, default: () => ({}) },
  monthlyAttendanceTrend: { type: Object, default: () => ({}) },
  periods: {
    type: Array,
    default: () => [{ id: 'current', nombre: 'Periodo Actual' }],
  },
  tabs: {
    type: Array,
    default: () => [{ id: 'general', nombre: 'General' }],
  },
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
    dateRange: newPeriod === 'custom' ? dateRange.value : null,
  });

  // Si es un período predefinido, actualizar automáticamente los datos
  if (newPeriod !== 'custom') {
    // Aquí se podrían cargar datos específicos para el período seleccionado
    // Por ejemplo, emitir un evento para que el componente padre actualice los datos
    emit('refresh-data', { period: newPeriod });
  }
});

// --- NUEVO: Cálculo del día con más asistencias ---
// Usar sólo datos reales de attendanceStore para este análisis.
const bestAttendanceDay = ref({ bestDay: '', total: 0, attendanceByDay: {} });

async function calcularDiaMayorAsistencia(startDate, endDate) {
  await attendanceStore.fetchAttendanceByDateRange(startDate, endDate);
  const attendanceByDay = {
    Domingo: 0,
    Lunes: 0,
    Martes: 0,
    Miércoles: 0,
    Jueves: 0,
    Viernes: 0,
    Sábado: 0,
  };

  attendanceStore.attendanceDocuments.forEach((doc) => {
    // skip any doc without a data object
    if (!doc.data) return;

    const date = new Date(doc.fecha);
    const dayIndex = date.getDay();
    const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][
      dayIndex
    ];

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
// Usar sólo datos reales de attendanceStore y studentsStore para este análisis.
function studentNombre(studentId: string) {
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
  await studentsStore.$reset?.() // Si existe método para resetear
  ;(await studentsStore.$state.loading) ||
    (await studentsStore.$state.error) ||
    (await studentsStore.$state.lastSync) ||
    (await studentsStore.$state.students);
  if (typeof studentsStore.fetchStudents === 'function') {
    await studentsStore.fetchStudents();
  }
  // Por ejemplo, analizar el último mes:
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 1);
  await calcularDiaMayorAsistencia(
    startDate.toISOString().slice(0, 10),
    endDate.toISOString().slice(0, 10),
  );
  await calcularTopAbsentees(
    startDate.toISOString().slice(0, 10),
    endDate.toISOString().slice(0, 10),
  );
});

const absenceRange = ref({
  start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
  end: new Date().toISOString().slice(0, 10),
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
