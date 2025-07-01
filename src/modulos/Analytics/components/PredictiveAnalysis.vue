<script setup lang="ts">
import {ref, computed, onMounted, watchEffect} from "vue"
import {Line, Bar, Radar} from "vue-chartjs"
import ChartContainer from "./ChartContainer.vue"
import {format, addMonths, startOfMonth} from "date-fns"
import {es} from "date-fns/locale"
import {useAnalyticsStore} from "../store/analytics"
import {useStudentsStore} from "../../Students/store/students"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useAttendanceStore} from "../../Attendance/store/attendance"

// Stores
const analyticsStore = useAnalyticsStore()
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const attendanceStore = useAttendanceStore()

// Component state
const isLoading = ref(true)
const error = ref("")
const selectedTimeframe = ref("3months") // 3months, 6months, 1year
const selectedMetric = ref("attendance") // attendance, performance
const selectedEntityType = ref("all") // all, teacher, class, student
const selectedEntityId = ref("")

// Properties
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({
      teacherId: "",
      classId: "",
      startDate: "",
      endDate: "",
    }),
  },
})

// Emit events
const emit = defineEmits(["insight-generated", "prediction-changed"])

// Predictive models data
const predictiveData = ref({
  attendancePrediction: [],
  performancePrediction: [],
  dropoutRiskStudents: [],
  improvementOpportunities: [],
  teacherComparison: [],
  classComparison: [],
  seasonalPatterns: [],
})

// Computed properties for charts
const attendanceTrendChart = computed(() => {
  // Historical + predicted data
  const labels = generateFutureMonths(6) // Next 6 months

  return {
    labels,
    datasets: [
      {
        label: "Asistencia Histórica",
        data: [89, 87, 92, 90, 88, 91].concat(Array(6).fill(null)), // Historical data
        borderColor: "rgba(75, 85, 99, 0.8)",
        backgroundColor: "rgba(75, 85, 99, 0.2)",
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Predicción de Asistencia",
        data: Array(6).fill(null).concat(predictiveData.value.attendancePrediction),
        borderColor: "rgba(79, 70, 229, 0.8)",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 3,
      },
    ],
  }
})

const performanceTrendChart = computed(() => {
  const labels = generateFutureMonths(6) // Next 6 months

  return {
    labels,
    datasets: [
      {
        label: "Rendimiento Histórico",
        data: [75, 76, 78, 77, 79, 80].concat(Array(6).fill(null)), // Historical data
        borderColor: "rgba(75, 85, 99, 0.8)",
        backgroundColor: "rgba(75, 85, 99, 0.2)",
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Predicción de Rendimiento",
        data: Array(6).fill(null).concat(predictiveData.value.performancePrediction),
        borderColor: "rgba(16, 185, 129, 0.8)",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 3,
      },
    ],
  }
})

const teacherComparisonChart = computed(() => {
  return {
    labels: ["Asistencia", "Rendimiento", "Participación", "Mejora", "Retención"],
    datasets: predictiveData.value.teacherComparison.map((teacher, index) => ({
      label: teacher.name,
      data: teacher.metrics,
      backgroundColor: getColorByIndex(index, 0.2),
      borderColor: getColorByIndex(index, 1),
      borderWidth: 1,
    })),
  }
})

const seasonalPatternsChart = computed(() => {
  return {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    datasets: [
      {
        label: "Asistencia por mes",
        data: predictiveData.value.seasonalPatterns,
        backgroundColor: "rgba(99, 102, 241, 0.5)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
      },
    ],
  }
})

// Chart options
const lineChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      mode: "index",
      intersect: false,
    },
    legend: {
      position: "top",
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      min: 40,
      max: 100,
      ticks: {
        callback(value) {
          return value + "%"
        },
      },
    },
  },
})

const radarChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 20,
      },
    },
  },
  elements: {
    line: {
      borderWidth: 2,
    },
  },
})

// Helper functions
function getColorByIndex(index, alpha) {
  const colors = [
    `rgba(79, 70, 229, ${alpha})`, // Indigo
    `rgba(16, 185, 129, ${alpha})`, // Emerald
    `rgba(245, 158, 11, ${alpha})`, // Amber
    `rgba(239, 68, 68, ${alpha})`, // Red
    `rgba(37, 99, 235, ${alpha})`, // Blue
  ]
  return colors[index % colors.length]
}

function generateFutureMonths(count) {
  const months = []
  const currentDate = new Date()

  // Add past months
  for (let i = 5; i >= 0; i--) {
    const pastMonth = addMonths(currentDate, -i)
    months.push(format(pastMonth, "MMM yyyy", {locale: es}))
  }

  // Add future months
  for (let i = 1; i <= count; i++) {
    const futureMonth = addMonths(currentDate, i)
    months.push(format(futureMonth, "MMM yyyy", {locale: es}))
  }

  return months
}

// Actions
const generatePredictions = async () => {
  isLoading.value = true
  error.value = ""

  try {
    // In a real application, this would call a backend ML service
    // For now, we'll simulate predictions with plausible data

    // Simulate attendance prediction (slightly increasing trend)
    predictiveData.value.attendancePrediction = [91, 92, 93, 92, 94, 95]

    // Simulate performance prediction (steady improvement)
    predictiveData.value.performancePrediction = [81, 82, 83, 84, 84, 85]

    // Students at risk of dropping out
    predictiveData.value.dropoutRiskStudents = [
      {
        id: "1",
        name: "Luis Ramírez",
        instrument: "Violín",
        riskScore: 78,
        factors: ["Asistencia baja", "Rendimiento decreciente"],
      },
      {
        id: "2",
        name: "Ana Flores",
        instrument: "Piano",
        riskScore: 65,
        factors: ["Falta de práctica", "Ausencias frecuentes"],
      },
      {
        id: "3",
        name: "Miguel Torres",
        instrument: "Flauta",
        riskScore: 82,
        factors: ["Conflicto de horarios", "Dificultad con técnica"],
      },
    ]

    // Opportunities for improvement
    predictiveData.value.improvementOpportunities = [
      {
        area: "Asistencia en clases de cuerdas",
        impact: "Alto",
        suggestion: "Ajustar horarios a tarde-noche",
      },
      {
        area: "Rendimiento en teoría musical",
        impact: "Medio",
        suggestion: "Introducir material interactivo",
      },
      {
        area: "Participación en ensamble",
        impact: "Alto",
        suggestion: "Programar presentaciones mensuales",
      },
    ]

    // Teacher comparison data
    predictiveData.value.teacherComparison = [
      {name: "Marta Jiménez", metrics: [95, 87, 90, 75, 92]},
      {name: "Carlos Fuentes", metrics: [88, 92, 85, 90, 87]},
      {name: "Laura González", metrics: [92, 85, 93, 82, 90]},
    ]

    // Seasonal patterns
    predictiveData.value.seasonalPatterns = [85, 87, 89, 90, 92, 88, 75, 82, 88, 91, 89, 83]

    // Emit insight event
    emit("insight-generated", {
      keyInsight: "Se proyecta un aumento del 4% en asistencia para los próximos 6 meses",
      recommendations: [
        "Implementar recordatorios automáticos 24h antes de cada clase",
        "Enfoque especial en estudiantes de viento-madera que muestran tendencia a la baja",
        "Considerar ajustar horarios de clases de teoría para mejorar asistencia",
      ],
    })
  } catch (err) {
    console.error("Error generating predictions:", err)
    error.value = "Error al generar predicciones"
  } finally {
    isLoading.value = false
  }
}

const exportPredictions = () => {
  // In a real application, this would generate CSV/PDF report
  alert("La exportación del informe predictivo estará disponible en la próxima versión.")
}

// Lifecycle hooks
onMounted(async () => {
  await generatePredictions()
})

// Watch for filter changes
watchEffect(() => {
  if (props.filters) {
    // Re-generate predictions when filters change
    generatePredictions()
  }
})
</script>

<template>
  <div class="predictive-analysis p-4 space-y-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-800">Análisis Predictivo</h2>

      <div class="flex space-x-3">
        <!-- Timeframe selector -->
        <select
          v-model="selectedTimeframe"
          class="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="3months">Próximos 3 meses</option>
          <option value="6months">Próximos 6 meses</option>
          <option value="1year">Próximo año</option>
        </select>

        <!-- Metric selector -->
        <select
          v-model="selectedMetric"
          class="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="attendance">Asistencia</option>
          <option value="performance">Rendimiento</option>
        </select>

        <button
          class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          :disabled="isLoading"
          @click="generatePredictions"
        >
          <span v-if="isLoading">Generando...</span>
          <span v-else>Actualizar Predicción</span>
        </button>

        <button
          class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          @click="exportPredictions"
        >
          Exportar Informe
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
      {{ error }}
    </div>

    <!-- Trend charts -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <ChartContainer title="Predicción de Asistencia" icon="ChartBarIcon" :is-loading="isLoading">
        <Line
          v-if="!isLoading"
          :data="attendanceTrendChart"
          :options="lineChartOptions"
          height="250"
        />
      </ChartContainer>

      <ChartContainer title="Predicción de Rendimiento" icon="ChartBarIcon" :is-loading="isLoading">
        <Line
          v-if="!isLoading"
          :data="performanceTrendChart"
          :options="lineChartOptions"
          height="250"
        />
      </ChartContainer>
    </div>

    <!-- Risk assessment -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Estudiantes en Riesgo de Abandono</h3>

      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estudiante
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Instrumento
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nivel de Riesgo
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Factores
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones Recomendadas
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="student in predictiveData.dropoutRiskStudents" :key="student.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ student.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ student.instrument }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :class="{
                        'bg-red-500': student.riskScore > 70,
                        'bg-yellow-500': student.riskScore > 50 && student.riskScore <= 70,
                        'bg-green-500': student.riskScore <= 50,
                      }"
                      :style="{width: student.riskScore + '%'}"
                    />
                  </div>
                  <span class="ml-3 text-sm text-gray-700">{{ student.riskScore }}%</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <span
                  v-for="(factor, idx) in student.factors"
                  :key="idx"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1"
                >
                  {{ factor }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <button class="text-indigo-600 hover:text-indigo-900 font-medium">
                  Plan de intervención
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Comparative analysis -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Teacher comparison -->
      <ChartContainer title="Comparativa de Profesores" icon="UsersIcon" :is-loading="isLoading">
        <div v-if="!isLoading" class="h-72">
          <Radar :data="teacherComparisonChart" :options="radarChartOptions" />
        </div>
      </ChartContainer>

      <!-- Seasonal patterns -->
      <ChartContainer title="Patrones Estacionales" icon="CalendarIcon" :is-loading="isLoading">
        <div v-if="!isLoading" class="h-72">
          <Bar
            :data="seasonalPatternsChart"
            :options="{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: false,
                  min: 70,
                  max: 100,
                  ticks: {
                    callback: function (value) {
                      return value + '%'
                    },
                  },
                },
              },
            }"
          />
        </div>
      </ChartContainer>
    </div>

    <!-- Insights and opportunities -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
      <!-- Improvement opportunities -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Oportunidades de Mejora</h3>

        <div v-if="isLoading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(opportunity, idx) in predictiveData.improvementOpportunities"
            :key="idx"
            class="bg-gray-50 p-4 rounded-md"
          >
            <div class="flex justify-between">
              <h4 class="text-base font-medium text-gray-800">{{ opportunity.area }}</h4>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-red-100 text-red-800': opportunity.impact === 'Alto',
                  'bg-yellow-100 text-yellow-800': opportunity.impact === 'Medio',
                  'bg-blue-100 text-blue-800': opportunity.impact === 'Bajo',
                }"
              >
                Impacto {{ opportunity.impact }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-600">Sugerencia: {{ opportunity.suggestion }}</p>
          </div>
        </div>
      </div>

      <!-- Key findings -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Hallazgos Clave</h3>

        <div v-if="isLoading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>

        <div v-else class="space-y-4">
          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-indigo-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-indigo-700">
                  Se proyecta un aumento del 4% en asistencia para los próximos 6 meses
                </p>
              </div>
            </div>
          </div>

          <div class="bg-green-50 border-l-4 border-green-500 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-700">
                  Los alumnos de piano muestran mejora constante en rendimiento (+5% en comparación
                  con el trimestre anterior)
                </p>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  Las clases de teoría musical tienen una tasa de asistencia 15% menor que las
                  clases prácticas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
