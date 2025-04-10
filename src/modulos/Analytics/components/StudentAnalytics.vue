<template>
  <div class="student-analytics">
    <header class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">Análisis de Alumnos</h2>
      
      <!-- Filtros de tiempo y vista -->
      <div class="flex gap-2 items-center">
        <label class="text-sm text-gray-600">Periodo:</label>
        <select 
          v-model="selectedPeriod" 
          class="px-3 py-1 border rounded-md text-sm"
        >
          <option value="lastWeek">Última semana</option>
          <option value="lastMonth">Último mes</option>
          <option value="currentMonth">Mes actual</option>
          <option value="custom">Personalizado</option>
        </select>
        
        <div v-if="showCustomDatePicker" class="flex gap-2">
          <input 
            v-model="customDateRange.startDate" 
            type="date" 
            class="px-2 py-1 border rounded-md text-sm" 
          />
          <input 
            v-model="customDateRange.endDate" 
            type="date" 
            class="px-2 py-1 border rounded-md text-sm" 
          />
          <button 
            @click="applyCustomDateFilter"
            class="px-2 py-1 bg-blue-600 text-white rounded-md text-sm"
          >
            Aplicar
          </button>
        </div>
      </div>
    </header>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3">Cargando datos...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md mb-6">
      {{ error }}
    </div>

    <!-- Contenido del análisis -->
    <div v-else class="space-y-8">
      <!-- Indicadores principales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Total Alumnos</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.totalStudents }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            <span :class="metrics.growth > 0 ? 'text-green-500' : 'text-red-500'">
              <template v-if="metrics.growth > 0">↑</template>
              <template v-else>↓</template>
              {{ Math.abs(metrics.growth) }}%
            </span>
            vs periodo anterior
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Asistencia Promedio</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.averageAttendance }}%</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">de clases programadas</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Rendimiento</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.averagePerformance }}%</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">promedio general</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Alumnos en Riesgo</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.atRiskCount }}</span>
            <span class="text-sm text-gray-500 ml-1">({{ metrics.atRiskPercentage }}%)</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">necesitan atención</p>
        </div>
      </div>

      <!-- Distribución de estudiantes por instrumento -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-base font-medium mb-4">Distribución por Instrumento</h4>
          <div class="h-72">
            <Doughnut 
              :data="instrumentDistributionChart" 
              :options="doughnutOptions" 
            />
          </div>
        </div>

        <!-- Distribución por nivel -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-base font-medium mb-4">Distribución por Nivel</h4>
          <div class="h-72">
            <Bar 
              :data="levelDistributionChart" 
              :options="barChartOptions" 
            />
          </div>
        </div>
      </div>

      <!-- Asistencia diaria de alumnos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h4 class="text-base font-medium mb-4">Tendencia de Asistencia de Alumnos</h4>
        <div class="h-60">
          <Line 
            :data="attendanceTrendChart" 
            :options="lineChartOptions" 
          />
        </div>
      </div>

      <!-- Alumnos con mayor progreso -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h4 class="text-base font-medium mb-4">Alumnos con Mayor Progreso</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Alumno
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Instrumento
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nivel
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Progreso
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="student in topPerformingStudents" :key="student.id">
                <td class="px-4 py-2 whitespace-nowrap">{{ student.name }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ student.instrument }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ student.level }}</td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        class="h-full rounded-full bg-green-500" 
                        :style="`width: ${student.progress}%`"
                      ></div>
                    </div>
                    <span class="text-sm">{{ student.progress }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Alumnos en riesgo -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-base font-medium">Alumnos en Riesgo</h4>
          <div class="flex gap-2">
            <select v-model="riskFilterType" class="px-3 py-1 border rounded-md text-sm">
              <option value="all">Todos los riesgos</option>
              <option value="attendance">Asistencia</option>
              <option value="performance">Rendimiento</option>
              <option value="payments">Pagos</option>
            </select>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Alumno
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Instrumento
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Factor de Riesgo
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor Actual
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="student in filteredAtRiskStudents" :key="student.id">
                <td class="px-4 py-2 whitespace-nowrap">{{ student.name }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ student.instrument }}</td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span 
                    class="px-2 py-1 text-xs rounded-full"
                    :class="{
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200': student.riskType === 'attendance',
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200': student.riskType === 'performance',
                      'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200': student.riskType === 'payments'
                    }"
                  >
                    {{ getRiskTypeLabel(student.riskType) }}
                  </span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  {{ student.currentValue }}{{ student.riskType === 'attendance' || student.riskType === 'performance' ? '%' : '' }}
                </td>
                <td class="px-4 py-2">
                  <button class="text-blue-600 hover:text-blue-800 text-sm mr-2">
                    Contactar
                  </button>
                  <button class="text-purple-600 hover:text-purple-800 text-sm">
                    Plan de Acción
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Actividad de los estudiantes -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h4 class="text-base font-medium mb-4">Actividad de Estudiantes</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="h-60">
            <Bar 
              :data="activityByMonthChart" 
              :options="barChartOptions" 
            />
          </div>
          
          <div class="space-y-4">
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 class="font-medium">Picos de Actividad</h5>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Los estudiantes son más activos los días <span class="font-bold">Miércoles y Viernes</span>,
                especialmente entre las <span class="font-bold">16:00 y 19:00</span> horas.
              </p>
            </div>
            
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 class="font-medium">Nivel de Participación</h5>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                El <span class="font-bold">75%</span> de los estudiantes participan activamente
                en al menos 2 actividades extracurriculares.
              </p>
            </div>
            
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 class="font-medium">Interacción App vs Presencial</h5>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Los estudiantes interactúan con la app un <span class="font-bold">35%</span>
                más que en el periodo anterior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAnalyticsStore } from '../store/analytics'
import { useStudentsStore } from '../../Students/store/students'
import { useInstrumentoStore } from '../../Instruments/store/instrumento'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const analyticsStore = useAnalyticsStore()
const studentsStore = useStudentsStore()
const instrumentsStore = useInstrumentoStore()
const attendanceStore = useAttendanceStore()

// Estado local
const isLoading = ref(true)
const error = ref('')
const selectedPeriod = ref('currentMonth')
const showCustomDatePicker = ref(false)
const customDateRange = ref({
  startDate: '',
  endDate: ''
})
const riskFilterType = ref('all')

// Métricas
const metrics = ref({
  totalStudents: 0,
  growth: 0,
  averageAttendance: 0,
  averagePerformance: 0,
  atRiskCount: 0,
  atRiskPercentage: 0,
  instrumentDistribution: [],
  levelDistribution: [],
  attendanceTrend: [],
  activityByMonth: []
})

// Observar cambios en el periodo seleccionado
watch(selectedPeriod, (newPeriod) => {
  if (newPeriod === 'custom') {
    showCustomDatePicker.value = true
  } else {
    showCustomDatePicker.value = false
    loadMetrics()
  }
})

// Aplicar filtro de fechas personalizado
function applyCustomDateFilter() {
  if (customDateRange.value.startDate && customDateRange.value.endDate) {
    loadMetrics()
  }
}

// Cargar métricas desde el store
async function loadMetrics() {
  isLoading.value = true
  error.value = ''
  
  try {
    await Promise.all([
      analyticsStore.fetchAnalytics(),
      studentsStore.fetchStudents(),
      instrumentsStore.fetchInstruments(),
      attendanceStore.fetchAttendance()
    ])
    
    // Asignar métricas de estudiantes
    const studentMetrics = analyticsStore.studentMetrics
    
    // Datos básicos
    metrics.value.totalStudents = studentsStore.students.length
    metrics.value.growth = studentMetrics.growth || 3.2
    metrics.value.averageAttendance = studentMetrics.averageAttendance || 87
    metrics.value.averagePerformance = studentMetrics.averagePerformance || 78
    
    // Alumnos en riesgo
    const atRiskStudentsList = studentMetrics.atRiskStudents || generateMockAtRiskStudents()
    metrics.value.atRiskCount = atRiskStudentsList.length
    metrics.value.atRiskPercentage = Math.round((atRiskStudentsList.length / metrics.value.totalStudents) * 100)
    
    // Distribución por instrumento
    metrics.value.instrumentDistribution = studentMetrics.instrumentDistribution || generateMockInstrumentDistribution()
    
    // Distribución por nivel
    metrics.value.levelDistribution = studentMetrics.levelDistribution || [
      { level: 'Principiante', count: 45 },
      { level: 'Intermedio', count: 32 },
      { level: 'Avanzado', count: 18 }
    ]
    
    // Tendencia de asistencia
    metrics.value.attendanceTrend = studentMetrics.attendanceTrend || generateMockAttendanceTrend()
    
    // Actividad por mes
    metrics.value.activityByMonth = studentMetrics.activityByMonth || [
      { month: 'Enero', count: 120 },
      { month: 'Febrero', count: 135 },
      { month: 'Marzo', count: 140 },
      { month: 'Abril', count: 150 },
      { month: 'Mayo', count: 165 },
      { month: 'Junio', count: 180 }
    ]
    
  } catch (err) {
    console.error('Error cargando métricas de estudiantes:', err)
    error.value = 'Error al cargar los datos. Por favor, intente de nuevo.'
  } finally {
    isLoading.value = false
  }
}

// Funciones para generar datos simulados
function generateMockAtRiskStudents() {
  const riskTypes = ['attendance', 'performance', 'payments']
  const students = []
  
  // Crear lista de estudiantes en riesgo simulada
  for (let i = 0; i < 12; i++) {
    const riskType = riskTypes[i % 3]
    let currentValue = 0
    
    if (riskType === 'attendance') {
      currentValue = Math.floor(Math.random() * 20) + 50 // 50-70%
    } else if (riskType === 'performance') {
      currentValue = Math.floor(Math.random() * 15) + 55 // 55-70%
    } else {
      currentValue = Math.floor(Math.random() * 3) + 1 // 1-3 meses de retraso
    }
    
    students.push({
      id: `student-${i + 1}`,
      name: `Estudiante ${i + 1}`,
      instrument: ['Piano', 'Guitarra', 'Violín', 'Flauta', 'Batería'][i % 5],
      level: ['Principiante', 'Intermedio', 'Avanzado'][Math.floor(i / 4)],
      riskType,
      currentValue
    })
  }
  
  return students
}

function generateMockInstrumentDistribution() {
  return [
    { name: 'Piano', count: 25 },
    { name: 'Guitarra', count: 30 },
    { name: 'Violín', count: 18 },
    { name: 'Batería', count: 12 },
    { name: 'Flauta', count: 10 },
    { name: 'Otros', count: 5 }
  ]
}

function generateMockAttendanceTrend() {
  const dates = []
  const today = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    dates.push({
      date: format(date, 'yyyy-MM-dd'),
      rate: Math.floor(Math.random() * 20) + 75 // 75-95%
    })
  }
  
  return dates
}

// Obtener etiqueta de tipo de riesgo
function getRiskTypeLabel(riskType) {
  switch (riskType) {
    case 'attendance':
      return 'Asistencia'
    case 'performance':
      return 'Rendimiento'
    case 'payments':
      return 'Pagos'
    default:
      return 'Desconocido'
  }
}

// Datos para gráfica de distribución por instrumento
const instrumentDistributionChart = computed(() => {
  const instrumentData = metrics.value.instrumentDistribution
  
  return {
    labels: instrumentData.map(item => item.name),
    datasets: [
      {
        label: 'Estudiantes',
        data: instrumentData.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ]
      }
    ]
  }
})

// Datos para gráfica de distribución por nivel
const levelDistributionChart = computed(() => {
  const levelData = metrics.value.levelDistribution
  
  return {
    labels: levelData.map(item => item.level),
    datasets: [
      {
        label: 'Estudiantes',
        data: levelData.map(item => item.count),
        backgroundColor: 'rgba(99, 102, 241, 0.6)'
      }
    ]
  }
})

// Datos para gráfica de tendencia de asistencia
const attendanceTrendChart = computed(() => {
  const trendData = metrics.value.attendanceTrend
  
  return {
    labels: trendData.map(item => format(parseISO(item.date), 'dd/MM')),
    datasets: [
      {
        label: 'Tasa de Asistencia',
        data: trendData.map(item => item.rate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

// Datos para gráfica de actividad por mes
const activityByMonthChart = computed(() => {
  const monthlyData = metrics.value.activityByMonth
  
  return {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Actividad',
        data: monthlyData.map(item => item.count),
        backgroundColor: 'rgba(99, 102, 241, 0.6)'
      }
    ]
  }
})

// Alumnos con mejor rendimiento (simulados)
const topPerformingStudents = computed(() => {
  const students = []
  
  for (let i = 0; i < 5; i++) {
    students.push({
      id: `top-student-${i + 1}`,
      name: `Estudiante Top ${i + 1}`,
      instrument: ['Piano', 'Guitarra', 'Violín', 'Flauta', 'Batería'][i],
      level: i < 3 ? 'Avanzado' : 'Intermedio',
      progress: 90 + Math.floor(Math.random() * 10) // 90-99%
    })
  }
  
  return students
})

// Alumnos en riesgo filtrados
const filteredAtRiskStudents = computed(() => {
  const atRiskStudentsList = generateMockAtRiskStudents()
  
  if (riskFilterType.value === 'all') {
    return atRiskStudentsList
  }
  
  return atRiskStudentsList.filter(student => student.riskType === riskFilterType.value)
})

// Opciones para gráficos de Doughnut
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const
    }
  }
}

// Opciones para gráficos de barras
const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

// Opciones para gráficos de línea
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      mode: 'index' as const,
      intersect: false
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      min: 50,
      max: 100
    }
  }
}

// Cargar datos iniciales
onMounted(() => {
  loadMetrics()
})
</script>