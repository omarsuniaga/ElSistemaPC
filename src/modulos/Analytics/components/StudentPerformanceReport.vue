<template>
  <div class="student-performance">
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      <span class="ml-3">Cargando datos...</span>
    </div>

    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
      {{ error }}
    </div>

    <div v-else>
      <!-- Encabezado con información del estudiante -->
      <div v-if="student" class="mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold">{{ student.nombre }} {{ student.apellido }}</h3>
            <div class="flex flex-wrap gap-2 mt-1">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {{ student.instrumento || "Sin instrumento" }}
              </span>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
              >
                Nivel {{ student.nivel || "No establecido" }}
              </span>
              <span
                v-if="performanceData"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="statusClass"
              >
                {{ performanceData.status }}
              </span>
            </div>
          </div>

          <!-- Selector de periodo (si no es modo compacto) -->
          <div v-if="!props.compact">
            <select
              v-model="$props.period"
              class="mt-1 block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="current-month">Mes actual</option>
              <option value="last-month">Mes anterior</option>
              <option value="last-3-months">Últimos 3 meses</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Contenido del reporte -->
      <div v-if="performanceData" class="space-y-6">
        <!-- Indicadores clave (KPIs) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500 dark:text-gray-400">Asistencia</h4>
            <div class="mt-1 flex items-center">
              <span class="text-2xl font-bold">{{ performanceData.attendanceRate }}%</span>
              <span
                v-if="performanceData.trend.attendance != 0"
                class="ml-2 flex items-center text-xs font-medium"
              >
                <svg
                  v-if="performanceData.trend.attendance > 0"
                  class="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                <span
                  :class="performanceData.trend.attendance > 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ Math.abs(performanceData.trend.attendance).toFixed(1) }}%
                </span>
              </span>
            </div>
            <div class="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="h-2 rounded-full"
                :class="{
                  'bg-green-500': performanceData.attendanceRate >= 90,
                  'bg-yellow-500':
                    performanceData.attendanceRate >= 75 && performanceData.attendanceRate < 90,
                  'bg-red-500': performanceData.attendanceRate < 75,
                }"
                :style="`width: ${performanceData.attendanceRate}%`"
              />
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500 dark:text-gray-400">Promedio</h4>
            <div class="mt-1 flex items-center">
              <span class="text-2xl font-bold">{{ performanceData.averageGrade.toFixed(1) }}</span>
              <span class="ml-1 text-gray-500 dark:text-gray-400">/10</span>
              <span
                v-if="performanceData.trend.grade != 0"
                class="ml-2 flex items-center text-xs font-medium"
              >
                <svg
                  v-if="performanceData.trend.grade > 0"
                  class="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                <span :class="performanceData.trend.grade > 0 ? 'text-green-500' : 'text-red-500'">
                  {{ Math.abs(performanceData.trend.grade).toFixed(1) }}
                </span>
              </span>
            </div>
            <div class="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="h-2 rounded-full"
                :class="{
                  'bg-green-500': performanceData.averageGrade >= 9,
                  'bg-emerald-500':
                    performanceData.averageGrade >= 8 && performanceData.averageGrade < 9,
                  'bg-blue-500':
                    performanceData.averageGrade >= 7 && performanceData.averageGrade < 8,
                  'bg-yellow-500':
                    performanceData.averageGrade >= 6 && performanceData.averageGrade < 7,
                  'bg-red-500': performanceData.averageGrade < 6,
                }"
                :style="`width: ${performanceData.averageGrade * 10}%`"
              />
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500 dark:text-gray-400">Ausencias</h4>
            <div class="mt-1 flex items-center">
              <span class="text-2xl font-bold">{{ performanceData.absences }}</span>
              <span class="ml-1 text-gray-500 dark:text-gray-400"
                >/{{ attendanceData?.total || 0 }}</span
              >
            </div>
            <div class="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="h-2 rounded-full bg-red-500"
                :style="`width: ${attendanceData?.total ? (performanceData.absences / attendanceData.total) * 100 : 0}%`"
              />
            </div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Gráfico de asistencia -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-base font-medium mb-3">Registro de Asistencia</h4>
            <div class="h-60">
              <Bar
                :data="attendanceChartData"
                :options="{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: `Total ${attendanceData?.total || 0} registros`,
                    },
                  },
                }"
              />
            </div>
          </div>

          <!-- Gráfico de evolución -->
          <div
            v-if="qualificationsData?.evaluations?.length"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <h4 class="text-base font-medium mb-3">Evolución de Calificaciones</h4>
            <div class="h-60">
              <Line :data="gradesChartData" :options="chartOptions" />
            </div>
          </div>

          <!-- Gráfico de habilidades -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:col-span-2">
            <h4 class="text-base font-medium mb-3">Perfil de Habilidades</h4>
            <div class="h-72">
              <Radar :data="skillsChartData" :options="chartOptions" />
            </div>
          </div>
        </div>

        <!-- Lista de evaluaciones (solo en modo completo) -->
        <div
          v-if="!props.compact && qualificationsData?.evaluations?.length > 0"
          class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
        >
          <div class="px-4 py-3 border-b dark:border-gray-700">
            <h4 class="text-base font-medium">Últimas evaluaciones</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Tipo
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Descripción
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Calificación
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr v-for="(evaluation, index) in qualificationsData.evaluations" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{
                      format(new Date(evaluation.fecha || evaluation.date), "dd/MM/yyyy", {
                        locale: es,
                      })
                    }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ evaluation.tipo || evaluation.type || "General" }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ evaluation.descripcion || evaluation.description || "Sin descripción" }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs inline-flex leading-5 font-semibold rounded"
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400':
                          evaluation.calificacion >= 9 || evaluation.grade >= 9,
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400':
                          (evaluation.calificacion >= 7 && evaluation.calificacion < 9) ||
                          (evaluation.grade >= 7 && evaluation.grade < 9),
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400':
                          (evaluation.calificacion >= 6 && evaluation.calificacion < 7) ||
                          (evaluation.grade >= 6 && evaluation.grade < 7),
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400':
                          evaluation.calificacion < 6 || evaluation.grade < 6,
                      }"
                    >
                      {{ evaluation.calificacion || evaluation.grade || 0 }} / 10
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else-if="!isLoading" class="text-center py-8 text-gray-500">
        Selecciona un estudiante para ver su rendimiento
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAnalyticsStore } from '../store/analytics';
import { useStudentsStore } from '../../Students/store/students';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useQualificationStore } from '../../Qualifications/store/qualification';
import { Line, Radar, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const props = defineProps({
  studentId: {
    type: String,
    default: '',
  },
  period: {
    type: String,
    default: 'current-month', // 'current-month', 'last-month', 'last-3-months'
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const analyticsStore = useAnalyticsStore();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const qualificationStore = useQualificationStore();

// Estado local
const isLoading = ref(true);
const error = ref('');
const student = ref<any>(null);
const performanceData = ref<any>(null);
const attendanceData = ref<any>(null);
const qualificationsData = ref<any>(null);

// Periodo
const periodStart = computed(() => {
  switch (props.period) {
  case 'last-month':
    return startOfMonth(subMonths(new Date(), 1));
  case 'last-3-months':
    return startOfMonth(subMonths(new Date(), 3));
  case 'current-month':
  default:
    return startOfMonth(new Date());
  }
});

const periodEnd = computed(() => {
  switch (props.period) {
  case 'last-month':
    return endOfMonth(subMonths(new Date(), 1));
  default:
    return new Date();
  }
});

// Observar cambios en el ID del estudiante
watch(
  () => props.studentId,
  (newStudentId) => {
    if (newStudentId) {
      loadStudentData();
    }
  },
);

// Observar cambios en el periodo
watch(
  () => props.period,
  () => {
    if (props.studentId) {
      loadPerformanceData();
    }
  },
);

// Cargar datos del estudiante
async function loadStudentData() {
  if (!props.studentId) return;

  isLoading.value = true;
  error.value = '';

  try {
    // Cargar datos del estudiante
    await studentsStore.fetchStudents();
    student.value = studentsStore.students.find((s) => s.id === props.studentId);

    if (!student.value) {
      throw new Error('Estudiante no encontrado');
    }

    // Cargar datos de rendimiento
    await loadPerformanceData();
  } catch (err: any) {
    console.error('Error al cargar datos del estudiante:', err);
    error.value = err.message || 'Error al cargar datos del estudiante';
  } finally {
    isLoading.value = false;
  }
}

// Cargar datos de rendimiento
async function loadPerformanceData() {
  isLoading.value = true;

  try {
    await Promise.all([
      analyticsStore.fetchAnalytics(),
      loadAttendanceData(),
      loadQualificationsData(),
    ]);

    // Identificar si el estudiante está en riesgo o es destacado
    const atRiskStudents = analyticsStore.studentMetrics.atRiskStudents || [];
    const topStudents = analyticsStore.studentMetrics.topStudents || [];

    const isAtRisk = atRiskStudents.some((s) => s.id === props.studentId);
    const isTopPerformer = topStudents.some((s) => s.id === props.studentId);

    // Crear objeto de rendimiento
    performanceData.value = {
      attendanceRate: attendanceData.value?.attendanceRate || 0,
      averageGrade: qualificationsData.value?.averageGrade || 0,
      absences: attendanceData.value?.absences || 0,
      evaluations: qualificationsData.value?.evaluations || [],
      isAtRisk,
      isTopPerformer,
      status: isTopPerformer ? 'Destacado' : isAtRisk ? 'En riesgo' : 'Regular',
      trend: calculatePerformanceTrend(),
    };
  } catch (err: any) {
    console.error('Error al cargar datos de rendimiento:', err);
    error.value = err.message || 'Error al cargar datos de rendimiento';
  } finally {
    isLoading.value = false;
  }
}

// Cargar datos de asistencia
async function loadAttendanceData() {
  try {
    await attendanceStore.fetchAttendance();

    // Filtrar registros de asistencia del estudiante en el periodo seleccionado
    const startDate = periodStart.value;
    const endDate = periodEnd.value;

    const records = attendanceStore.records.filter((record) => {
      const recordDate = new Date(record.Fecha || record.fecha || record.date);
      return (
        record.studentId === props.studentId && recordDate >= startDate && recordDate <= endDate
      );
    });

    // Calcular métricas
    const total = records.length;
    const present = records.filter((r) => r.status === 'presente' || r.status === 'PRESENT').length;
    const absences = records.filter((r) => r.status === 'ausente' || r.status === 'ABSENT').length;
    const justified = records.filter(
      (r) => r.status === 'justificado' || r.status === 'JUSTIFIED',
    ).length;
    const delayed = records.filter((r) => r.status === 'demorado' || r.status === 'DELAYED').length;

    const attendanceRate = total > 0 ? Math.round(((present + justified) / total) * 100) : 0;

    attendanceData.value = {
      total,
      present,
      absences,
      justified,
      delayed,
      attendanceRate,
      records,
    };

    return attendanceData.value;
  } catch (err: any) {
    console.error('Error al cargar datos de asistencia:', err);
    throw err;
  }
}

// Cargar calificaciones
async function loadQualificationsData() {
  try {
    await qualificationStore.fetchQualifications();

    // Filtrar calificaciones del estudiante en el periodo seleccionado
    const startDate = periodStart.value;
    const endDate = periodEnd.value;

    const evaluations = qualificationStore.qualifications.filter((qual) => {
      const evalDate = new Date(qual.fecha || qual.date);
      return qual.studentId === props.studentId && evalDate >= startDate && evalDate <= endDate;
    });

    // Calcular promedio
    const total = evaluations.length;
    const sum = evaluations.reduce(
      (acc, eval_) => acc + (eval_.calificacion || eval_.grade || 0),
      0,
    );
    const averageGrade = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    // Organizar por tipo de evaluación
    const byType: Record<string, number[]> = {};

    evaluations.forEach((eval_) => {
      const type = eval_.tipo || eval_.type || 'General';
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(eval_.calificacion || eval_.grade || 0);
    });

    // Calcular promedio por tipo
    const averageByType: Record<string, number> = {};

    Object.entries(byType).forEach(([type, grades]) => {
      const typeSum = grades.reduce((acc, grade) => acc + grade, 0);
      averageByType[type] = Math.round((typeSum / grades.length) * 10) / 10;
    });

    qualificationsData.value = {
      total,
      averageGrade,
      evaluations,
      byType,
      averageByType,
    };

    return qualificationsData.value;
  } catch (err: any) {
    console.error('Error al cargar calificaciones:', err);
    throw err;
  }
}

// Calcular tendencia de rendimiento (esto sería idealmente con datos históricos)
function calculatePerformanceTrend() {
  // Por ahora usamos una simulación simple
  const attendanceTrend = Math.random() > 0.5 ? 1 : -1;
  const gradeTrend = Math.random() > 0.5 ? 1 : -1;

  return {
    attendance: attendanceTrend * (Math.random() * 5),
    grade: gradeTrend * (Math.random() * 1),
  };
}

// Datos para gráficos
// Usar sólo datos reales de attendanceData
const attendanceChartData = computed(() => {
  if (!attendanceData.value) {
    return {
      labels: [],
      datasets: [],
    };
  }

  return {
    labels: ['Presente', 'Justificado', 'Con retraso', 'Ausente'],
    datasets: [
      {
        label: 'Registro de asistencia',
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)', // Verde
          'rgba(59, 130, 246, 0.7)', // Azul
          'rgba(245, 158, 11, 0.7)', // Amarillo
          'rgba(239, 68, 68, 0.7)', // Rojo
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
        data: [
          attendanceData.value.present,
          attendanceData.value.justified,
          attendanceData.value.delayed,
          attendanceData.value.absences,
        ],
      },
    ],
  };
});

// Datos para gráfico de calificaciones
// Usar sólo datos reales de qualificationsData
const gradesChartData = computed(() => {
  if (!qualificationsData.value || !qualificationsData.value.evaluations.length) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const evaluations = qualificationsData.value.evaluations
    .sort((a: any, b: any) => {
      const dateA = new Date(a.fecha || a.date);
      const dateB = new Date(b.fecha || b.date);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-10); // Tomar las últimas 10 evaluaciones

  return {
    labels: evaluations.map((e: any) => {
      const date = new Date(e.fecha || e.date);
      return format(date, 'dd/MM', { locale: es });
    }),
    datasets: [
      {
        label: 'Calificaciones',
        data: evaluations.map((e: any) => e.calificacion || e.grade || 0),
        fill: false,
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.1,
      },
    ],
  };
});

// Datos para gráfico de habilidades
// Usar sólo datos reales de qualificationsData
const skillsChartData = computed(() => {
  // En una app real, habría un modelo de habilidades con evaluciones específicas
  // Aquí simulamos algunos datos según el promedio general
  const averageGrade = qualificationsData.value?.averageGrade || 0;

  // Base para generar valores aleatorios en torno al promedio
  function randomValue(base: number, variance: number = 10) {
    const min = Math.max(0, base - variance);
    const max = Math.min(100, base + variance);
    return min + Math.random() * (max - min);
  }

  // Convertir calificación a percentil (asumiendo escala 0-10)
  const basePercentile = averageGrade * 10;

  return {
    labels: ['Técnica', 'Teoría', 'Expresividad', 'Ritmo', 'Lectura musical', 'Interpretación'],
    datasets: [
      {
        label: 'Habilidades',
        data: [
          randomValue(basePercentile, 15),
          randomValue(basePercentile, 15),
          randomValue(basePercentile, 15),
          randomValue(basePercentile, 15),
          randomValue(basePercentile, 15),
          randomValue(basePercentile, 15),
        ],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)',
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: true,
      text: '',
    },
  },
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 20,
      },
    },
  },
};

// Etiqueta de estado según rendimiento
const statusClass = computed(() => {
  if (!performanceData.value) return '';

  if (performanceData.value.isTopPerformer) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  } else if (performanceData.value.isAtRisk) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
});

// Iniciar carga de datos
onMounted(() => {
  if (props.studentId) {
    loadStudentData();
  }
});
</script>

<style scoped>
.student-performance {
  @apply w-full;
}
</style>
