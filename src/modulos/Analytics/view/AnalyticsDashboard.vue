<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {format, subMonths, startOfMonth, endOfMonth} from "date-fns"
import {es} from "date-fns/locale"
import {useAnalyticsStore} from "../store/analytics"
import {useStudentsStore} from "../../Students/store/students"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useClassesStore} from "../../Classes/store/classes"
import {useAttendanceStore} from "../../Attendance/store/attendance"
import {useContentsStore} from "../../Contents/store/contents"
import {useInstrumentoStore} from "../../Instruments/store/instrumento"

// Componentes generales
import PerformanceKpi from "../components/PerformanceKpi.vue"
import ChartContainer from "../components/ChartContainer.vue"

// Componentes de análisis específicos
import StudentAnalytics from "../components/StudentAnalytics.vue"
import TeacherAnalytics from "../components/TeacherAnalytics.vue"
import AttendanceAnalytics from "../components/AttendanceAnalytics.vue"
import AnalysisPanel from "../components/AnalysisPanel.vue"
import ReportGenerator from "../components/ReportGenerator.vue"

// Íconos
import {
  UserIcon,
  UsersIcon,
  UserPlusIcon,
  ChartBarIcon,
  CalendarIcon,
  AcademicCapIcon,
} from "@heroicons/vue/24/outline"
import {Line, Doughnut} from "vue-chartjs"

// Stores
const analyticsStore = useAnalyticsStore()
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const classesStore = useClassesStore()
const attendanceStore = useAttendanceStore()
const contentsStore = useContentsStore()
const instrumentsStore = useInstrumentoStore()

// Dashboard state
const isLoading = ref(true)
const error = ref("")
const activeTab = ref("overview")

// Lista de pestañas disponibles
const tabs = [
  {id: "overview", label: "Resumen"},
  {id: "students", label: "Alumnos"},
  {id: "teachers", label: "Maestros"},
  {id: "attendance", label: "Asistencias"},
  {id: "academic", label: "Contenidos y Evaluaciones"},
  {id: "reports", label: "Informes"},
]

// Filtros de tiempo
const timeRange = ref({
  startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  selectedRange: "currentMonth",
})

// Opciones de rango de tiempo
const timeRangeOptions = [
  {value: "last3Months", label: "Últimos 3 meses"},
  {value: "last6Months", label: "Últimos 6 meses"},
  {value: "lastYear", label: "Último año"},
  {value: "currentMonth", label: "Mes actual"},
  {value: "custom", label: "Personalizado"},
]

// Ejemplo de computed agregando datos cruzados
const dashboardData = ref({
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalInstruments: 0,
  averageAttendance: 0,
  averagePerformance: 0,
  studentsGrowth: 0,
  instruments: {
    distribution: [],
    availableCount: 0,
    assignedCount: 0,
    needsRepairCount: 0,
    mostPopular: "",
  },
  classes: {
    bySize: [],
    byHours: [],
    byContent: [],
    mostPopular: "",
  },
  teachers: {
    byClasses: [],
    byStudents: [],
    byHours: [],
    topPerformer: "",
  },
  attendance: {
    byMonth: [],
    byClass: [],
    byDay: [],
  },
  performance: {
    distribution: {excellent: 0, good: 0, average: 0, needsImprovement: 0},
    byClass: [],
    trend: [],
  },
  students: {
    atRisk: [],
    topPerformers: [],
    byInstrument: [],
    byLevel: [],
  },
})

// Computed que agrega datos cruzados
const aggregatedData = computed(() => {
  return {
    totalStudents: dashboardData.value.totalStudents,
    totalTeachers: dashboardData.value.totalTeachers,
    totalClasses: dashboardData.value.totalClasses,
    averageAttendance: dashboardData.value.averageAttendance,
    averagePerformance: dashboardData.value.averagePerformance,
    studentsGrowth: dashboardData.value.studentsGrowth,
  }
})

// Filter state
const filters = ref({
  teacherId: "",
  classId: "",
  instrument: "",
  level: "",
})

// Cargar datos del dashboard
const loadDashboardData = async () => {
  isLoading.value = true
  error.value = ""

  try {
    await Promise.all([
      studentsStore.fetchStudents(),
      teachersStore.fetchTeachers(),
      classesStore.fetchClasses(),
      attendanceStore.fetchAttendance(),
      contentsStore.fetchContents(),
      instrumentsStore.fetchInstruments(),
      analyticsStore.fetchAnalytics(),
    ])

    // Datos básicos
    dashboardData.value.totalStudents = studentsStore.students.length
    dashboardData.value.totalTeachers = teachersStore.teachers.length
    dashboardData.value.totalClasses = classesStore.classes.length
    dashboardData.value.totalInstruments = instrumentsStore.instruments.length

    // Datos de asistencia
    dashboardData.value.averageAttendance = analyticsStore.attendanceMetrics.averageRate || 0

    // Datos de rendimiento
    dashboardData.value.averagePerformance = analyticsStore.studentMetrics.averagePerformance || 0

    // Crecimiento de estudiantes (simulado)
    dashboardData.value.studentsGrowth = analyticsStore.studentMetrics.growth || 5.2

    // Distribución de rendimiento
    dashboardData.value.performance.distribution = analyticsStore.studentMetrics
      .performanceDistribution || {
      excellent: 25,
      good: 45,
      average: 20,
      needsImprovement: 10,
    }

    // Datos para gráficos de asistencia
    if (analyticsStore.attendanceMetrics.weekdayAttendance) {
      // Si existen datos reales, usarlos
    }
  } catch (err) {
    console.error("Error loading dashboard data:", err)
    error.value = "Error cargando datos del dashboard"
  } finally {
    isLoading.value = false
  }
}

// Método para cambiar de pestaña
const changeTab = (tabId: string) => {
  activeTab.value = tabId
}

// Método para aplicar filtros de fecha
const applyTimeFilter = () => {
  if (timeRange.value.selectedRange === "currentMonth") {
    timeRange.value.startDate = format(startOfMonth(new Date()), "yyyy-MM-dd")
    timeRange.value.endDate = format(endOfMonth(new Date()), "yyyy-MM-dd")
  } else if (timeRange.value.selectedRange === "last3Months") {
    timeRange.value.startDate = format(startOfMonth(subMonths(new Date(), 3)), "yyyy-MM-dd")
    timeRange.value.endDate = format(new Date(), "yyyy-MM-dd")
  } else if (timeRange.value.selectedRange === "last6Months") {
    timeRange.value.startDate = format(startOfMonth(subMonths(new Date(), 6)), "yyyy-MM-dd")
    timeRange.value.endDate = format(new Date(), "yyyy-MM-dd")
  } else if (timeRange.value.selectedRange === "lastYear") {
    timeRange.value.startDate = format(startOfMonth(subMonths(new Date(), 12)), "yyyy-MM-dd")
    timeRange.value.endDate = format(new Date(), "yyyy-MM-dd")
  }

  // Vuelve a cargar datos con el nuevo filtro
  loadDashboardData()
}

// Manejador para el cambio de periodo desde AnalysisPanel
const handlePeriodChange = (data: {
  period: string
  dateRange: {startDate: string; endDate: string} | null
}) => {
  // Mapear el periodId a los rangos de tiempo correspondientes
  if (data.period === "current") {
    timeRange.value.selectedRange = "currentMonth"
  } else if (data.period === "last") {
    timeRange.value.selectedRange = "last3Months"
  } else if (data.period === "custom") {
    timeRange.value.selectedRange = "custom"
    // Si hay un rango de fechas personalizado, actualizarlo
    if (data.dateRange) {
      timeRange.value.startDate = data.dateRange.startDate
      timeRange.value.endDate = data.dateRange.endDate
    }
  }

  applyTimeFilter()
}

// Observar cambios en el filtro de tiempo
watch(
  () => timeRange.value.selectedRange,
  (newValue) => {
    if (newValue !== "custom") {
      applyTimeFilter()
    }
  }
)

// Chart configuration options
const commonChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    tooltip: {
      mode: "index",
      intersect: false,
    },
  },
})

// Chart data
const attendanceByDayChart = computed(() => {
  return {
    labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    datasets: [
      {
        label: "Asistencia",
        data: [90, 85, 88, 92, 87], // Sample data
        backgroundColor: "rgba(99, 102, 241, 0.5)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
      },
    ],
  }
})

const performanceDistributionChart = computed(() => {
  return {
    labels: ["Excelente", "Bueno", "Promedio", "Necesita Mejorar"],
    datasets: [
      {
        label: "Distribución de Rendimiento",
        data: [
          dashboardData.value.performance.distribution.excellent,
          dashboardData.value.performance.distribution.good,
          dashboardData.value.performance.distribution.average,
          dashboardData.value.performance.distribution.needsImprovement,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.6)",
          "rgba(59, 130, 246, 0.6)",
          "rgba(250, 204, 21, 0.6)",
          "rgba(239, 68, 68, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  }
})

// Datos para el panel de análisis en la pestaña académica
const attendanceByDayOfWeek = computed(() => {
  return {
    labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
    datasets: [
      {
        label: "Tasa de Asistencia (%)",
        data: [90, 87, 90, 88, 86, 91, 85],
        backgroundColor: "rgba(99, 102, 241, 0.5)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
      },
    ],
  }
})

const studentPerformance = computed(() => performanceDistributionChart.value)

const atRiskStudents = computed(() => [
  {id: "1", name: "Juan Pérez", instrument: "Guitarra", performance: 62},
  {id: "2", name: "María Gómez", instrument: "Piano", performance: 58},
  {id: "3", name: "Carlos López", instrument: "Violín", performance: 65},
])

const bestAttendanceClasses = computed(() => [
  {id: "1", name: "Guitarra Nivel 3", total: 30, attendanceRate: 95},
  {id: "2", name: "Piano Avanzado", total: 25, attendanceRate: 92},
  {id: "3", name: "Teoría Musical", total: 40, attendanceRate: 88},
])

const lowestPerformanceIndicators = computed(() => [
  {name: "Lectura a primera vista", subject: "Piano", score: 67},
  {name: "Técnicas avanzadas", subject: "Guitarra", score: 65},
  {name: "Armonización", subject: "Teoría", score: 70},
])

onMounted(async () => {
  await loadDashboardData()
})
</script>

<template>
  <div class="analytics-dashboard p-4 space-y-6">
    <header class="flex justify-between items-center flex-wrap gap-4">
      <h1 class="text-2xl font-bold">Dashboard de Análisis</h1>

      <!-- Filtros de tiempo -->
      <div class="flex items-center space-x-2">
        <label class="text-sm text-gray-600">Periodo:</label>
        <select v-model="timeRange.selectedRange" class="px-3 py-2 border rounded-md text-sm">
          <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <div v-if="timeRange.selectedRange === 'custom'" class="flex space-x-2">
          <input
            v-model="timeRange.startDate"
            type="date"
            class="px-2 py-1 border rounded-md text-sm"
          />
          <input
            v-model="timeRange.endDate"
            type="date"
            class="px-2 py-1 border rounded-md text-sm"
          />
          <button
            class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            @click="applyTimeFilter"
          >
            Aplicar
          </button>
        </div>
      </div>
    </header>

    <!-- Loading and error states -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      <span class="ml-3">Cargando estadísticas...</span>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
      {{ error }}
      <button class="ml-2 underline" @click="loadDashboardData">Reintentar</button>
    </div>

    <div v-else>
      <!-- Tabs Navigation -->
      <div class="mb-6 border-b border-gray-200">
        <nav class="-mb-px flex space-x-4 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
            @click="changeTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Pestañas de contenido -->
      <div v-if="activeTab === 'overview'">
        <!-- Ejemplo de KPI Cards con datos agregados -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PerformanceKpi
            title="Total Estudiantes"
            :value="aggregatedData.totalStudents"
            :trend="aggregatedData.studentsGrowth"
            :icon="UserIcon"
            metric-type="default"
          />
          <PerformanceKpi
            title="Total Profesores"
            :value="aggregatedData.totalTeachers"
            :trend="3.1"
            :icon="UsersIcon"
            metric-type="default"
          />
          <PerformanceKpi
            title="Total Clases"
            :value="aggregatedData.totalClasses"
            :trend="2.8"
            :icon="AcademicCapIcon"
            metric-type="default"
          />
          <PerformanceKpi
            title="Asistencia Promedio"
            :value="aggregatedData.averageAttendance"
            :trend="3"
            :icon="CalendarIcon"
            metric-type="percentage"
          />
          <PerformanceKpi
            title="Rendimiento Promedio"
            :value="aggregatedData.averagePerformance"
            :trend="1.5"
            :icon="ChartBarIcon"
            metric-type="percentage"
          />
          <PerformanceKpi
            title="Instrumentos"
            :value="dashboardData.totalInstruments"
            :trend="0"
            :icon="ChartBarIcon"
            metric-type="default"
          />
        </div>
        <!-- Análisis general -->
        <AnalysisPanel
          :attendance-by-day-of-week="attendanceByDayOfWeek"
          :student-performance="studentPerformance"
          :chart-options="commonChartOptions"
          :doughnut-options="commonChartOptions"
          :at-risk-students="atRiskStudents"
          :best-attendance-classes="bestAttendanceClasses"
          :lowest-performance-indicators="lowestPerformanceIndicators"
          :students-analytics="{
            daily: 25,
            weekly: 120,
            monthly: 480,
            periodTotal: 1200,
          }"
          :student-attendance-trend="{
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Asistencia',
                data: [85, 87, 90, 88, 92, 91],
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1,
              },
            ],
          }"
          :trend-chart-options="commonChartOptions"
          :instrument-performance="[
            {id: '1', name: 'Piano', students: 45, attendance: 92, performance: 88},
            {id: '2', name: 'Guitarra', students: 38, attendance: 88, performance: 85},
            {id: '3', name: 'Violín', students: 25, attendance: 90, performance: 87},
          ]"
          :teachers-analytics="{
            active: 12,
            avgAttendance: 95,
            weeklyClasses: 48,
            hoursWorked: 96,
          }"
          :teacher-attendance-data="{
            labels: ['Profesor A', 'Profesor B', 'Profesor C', 'Profesor D', 'Profesor E'],
            datasets: [
              {
                label: 'Asistencia (%)',
                data: [95, 92, 97, 90, 94],
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1,
              },
            ],
          }"
          :bar-chart-options="commonChartOptions"
          :teacher-attendance-balance="[
            {
              id: '1',
              name: 'Profesor A',
              scheduledClasses: 20,
              attendedClasses: 19,
              balanceRate: 95,
            },
            {
              id: '2',
              name: 'Profesor B',
              scheduledClasses: 18,
              attendedClasses: 17,
              balanceRate: 94,
            },
            {
              id: '3',
              name: 'Profesor C',
              scheduledClasses: 15,
              attendedClasses: 15,
              balanceRate: 100,
            },
          ]"
          :daily-attendance-data="{
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
              {
                label: 'Asistencia',
                data: [45, 38, 42, 40, 35, 30, 10],
                backgroundColor: 'rgba(139, 92, 246, 0.5)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 1,
              },
            ],
          }"
          :line-chart-options="commonChartOptions"
          :attendance-analytics="{
            dailyAverage: 35,
            peakDay: 'Lunes (45)',
            weeklyTotal: 240,
            bestDay: 'Lunes',
            monthlyTotal: 960,
            weeklyAverage: 240,
            growthRate: 3.5,
          }"
          :weekly-attendance-data="{
            labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
            datasets: [
              {
                label: 'Asistencia',
                data: [230, 245, 238, 252],
                backgroundColor: 'rgba(139, 92, 246, 0.5)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 1,
              },
            ],
          }"
          :monthly-attendance-trend="{
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Asistencia',
                data: [920, 950, 980, 960, 990, 1020],
                backgroundColor: 'rgba(139, 92, 246, 0.5)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 1,
              },
            ],
          }"
          :periods="[
            {id: 'current', name: 'Periodo Actual'},
            {id: 'last', name: 'Periodo Anterior'},
            {id: 'custom', name: 'Personalizado'},
          ]"
          :tabs="[
            {id: 'general', name: 'General'},
            {id: 'students', name: 'Alumnos'},
            {id: 'teachers', name: 'Maestros'},
            {id: 'attendance', name: 'Asistencias'},
          ]"
          @period-changed="handlePeriodChange"
          @refresh-data="loadDashboardData"
        />

        <!-- Resumen visual -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ChartContainer title="Asistencia por Día" :icon="ChartBarIcon">
            <Line :data="attendanceByDayChart" :options="commonChartOptions" />
          </ChartContainer>

          <ChartContainer title="Distribución de Rendimiento" :icon="ChartBarIcon">
            <Doughnut :data="performanceDistributionChart" :options="commonChartOptions" />
          </ChartContainer>
        </div>
      </div>

      <!-- Panel de Alumnos -->
      <div v-else-if="activeTab === 'students'">
        <StudentAnalytics />
      </div>

      <!-- Panel de Maestros -->
      <div v-else-if="activeTab === 'teachers'">
        <TeacherAnalytics />
      </div>

      <!-- Panel de Asistencias -->
      <div v-else-if="activeTab === 'attendance'">
        <AttendanceAnalytics />
      </div>

      <!-- Panel de Contenidos y Evaluaciones -->
      <div v-else-if="activeTab === 'academic'">
        <AnalysisPanel
          :attendance-by-day-of-week="attendanceByDayOfWeek"
          :student-performance="studentPerformance"
          :chart-options="commonChartOptions"
          :doughnut-options="commonChartOptions"
          :at-risk-students="atRiskStudents"
          :best-attendance-classes="bestAttendanceClasses"
          :lowest-performance-indicators="lowestPerformanceIndicators"
          @period-changed="handlePeriodChange"
          @refresh-data="loadDashboardData"
        />
      </div>

      <!-- Panel de Informes -->
      <div v-else-if="activeTab === 'reports'">
        <ReportGenerator />
      </div>
    </div>
  </div>
</template>
