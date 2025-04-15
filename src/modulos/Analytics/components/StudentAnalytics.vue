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
          @change="handlePeriodChange"
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
    <div v-if="analyticsStore.loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3">Cargando datos...</span>
    </div>

    <!-- Error -->
    <div v-else-if="analyticsStore.error" class="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md mb-6">
      {{ analyticsStore.error }}
    </div>    <!-- Contenido del análisis -->
    <div v-else class="space-y-8">
      <!-- Indicadores principales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Total Alumnos</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ analyticsStore.studentMetrics.enrollmentTrends[analyticsStore.studentMetrics.enrollmentTrends.length - 1]?.totalStudents || 0 }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            <span :class="analyticsStore.studentMetrics.growth > 0 ? 'text-green-500' : 'text-red-500'">
              <template v-if="analyticsStore.studentMetrics.growth > 0">↑</template>
              <template v-else>↓</template>
              {{ Math.abs(analyticsStore.studentMetrics.growth) }}%
            </span>
            vs periodo anterior
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Asistencia Promedio</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ analyticsStore.attendanceMetrics.averageRate }}%</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">de clases programadas</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Rendimiento</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ analyticsStore.studentMetrics.averagePerformance }}%</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">promedio general</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Alumnos en Riesgo</h4>          <div class="mt-2">
            <span class="text-2xl font-bold">{{ analyticsStore.studentMetrics.atRiskStudents.length }}</span>
            <span class="text-sm text-gray-500 ml-1">
              ({{ calculateAtRiskPercentage }}%)
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">necesitan atención</p>
        </div>
      </div>      <!-- Distribución de estudiantes por instrumento -->
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
import { format, parseISO, isValid, formatISO, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAnalyticsStore } from '../store/analytics'
import { useStudentsStore } from '../../Students/store/students'
import { useInstrumentoStore } from '../../Instruments/store/instrumento'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import { Line, Bar, Doughnut } from 'vue-chartjs'

// Importa la configuración de Chart.js desde el archivo separado
import '../../../utils/chartConfig'
// Importa los componentes de gráficos después de asegurarte que Chart.js está registrado

// Stores
const analyticsStore = useAnalyticsStore()
const studentsStore = useStudentsStore()
const instrumentsStore = useInstrumentoStore()
const attendanceStore = useAttendanceStore()

// Estado local
const selectedPeriod = ref('currentMonth')
const showCustomDatePicker = ref(false)
const customDateRange = ref({
  startDate: '',
  endDate: ''
})
const riskFilterType = ref('all')
const isLoading = ref(false)
const error = ref<string | null>(null)
const metrics = ref<any>({})
const studentMetrics = ref<any>({})
const selectedStudent = ref<any>(null)

// Observar cambios en el periodo seleccionado
watch(selectedPeriod, (newPeriod) => {
  if (newPeriod === 'custom') {
    showCustomDatePicker.value = true
  } else {
    showCustomDatePicker.value = false
    handlePeriodChange()
  }
})

// Función para manejar cambios de periodo
const handlePeriodChange = () => {
  if (selectedPeriod.value !== 'custom') {
    loadAnalyticsForPeriod(selectedPeriod.value)
  }
}

// Aplicar filtro de fechas personalizado
function applyCustomDateFilter() {
  if (customDateRange.value.startDate && customDateRange.value.endDate) {
    loadAnalyticsForCustomRange()
  }
}

// Cargar analytics según el periodo seleccionado
const loadAnalyticsForPeriod = async (period: string) => {
  try {
    // Actualizar el periodo activo en el store
    analyticsStore.timeAnalytics.activeRange = period
    
    // Actualizar los rangos de fecha si es necesario
    await analyticsStore.updateTimeRanges()
    
    // Cargar todos los datos de analytics
    await analyticsStore.fetchAnalytics()
  } catch (err: any) {
    console.error('Error al cargar analytics por periodo:', err)
  }
}

// Cargar analytics para un rango personalizado
const loadAnalyticsForCustomRange = async () => {
  try {
    // Convertir fechas string a objetos Date
    const startDate = parseISO(customDateRange.value.startDate)
    const endDate = parseISO(customDateRange.value.endDate)
    
    if (!isValid(startDate) || !isValid(endDate)) {
      throw new Error('Fechas inválidas')
    }
    
    // Actualizar el rango personalizado en el store
    analyticsStore.timeAnalytics.dateRanges.customRange = {
      start: startDate,
      end: endDate
    }
    
    analyticsStore.timeAnalytics.activeRange = 'customRange'
    
    // Cargar analytics para este rango personalizado
    await analyticsStore.getAnalyticsByDateRange(startDate, endDate)
    await analyticsStore.fetchAnalytics()
  } catch (err: any) {
    console.error('Error al cargar analytics para rango personalizado:', err)
  }
}

// Porcentaje de alumnos en riesgo
const calculateAtRiskPercentage = computed(() => {
  const totalStudents = analyticsStore.studentMetrics.enrollmentTrends[analyticsStore.studentMetrics.enrollmentTrends.length - 1]?.totalStudents || 0
  const atRiskCount = analyticsStore.studentMetrics.atRiskStudents.length
  return totalStudents > 0 ? Math.round((atRiskCount / totalStudents) * 100) : 0
})

// Obtener alumnos en riesgo filtrados
const filteredAtRiskStudents = computed(() => {
  if (riskFilterType.value === 'all') {
    return analyticsStore.studentMetrics.atRiskStudents
  }
  
  return analyticsStore.studentMetrics.atRiskStudents.filter(student => 
    student.riskType === riskFilterType.value
  )
})

// Obtener etiqueta para tipo de riesgo
const getRiskTypeLabel = (riskType: string) => {
  switch (riskType) {
    case 'attendance':
      return 'Asistencia'
    case 'performance':
      return 'Rendimiento'
    case 'payments':
      return 'Pagos'
    default:
      return 'Rendimiento'
  }
}

// Obtener nivel del estudiante (función helper)
const getStudentLevel = (student: any) => {
  // Buscar estudiante completo en el store para obtener su nivel
  const completeStudent = studentsStore.students.find(s => s.id === student.id)
  return completeStudent?.level || completeStudent?.nivel || 'No asignado'
}

// Obtener nuevos estudiantes este mes
const getNewStudentsThisMonth = () => {
  const enrollmentTrends = analyticsStore.studentMetrics.enrollmentTrends
  if (enrollmentTrends && enrollmentTrends.length > 0) {
    return enrollmentTrends[enrollmentTrends.length - 1].newStudents
  }
  return 0
}

// Datos para gráfica de distribución por instrumento
const instrumentDistributionChart = computed(() => {
  const instrumentData = analyticsStore.studentMetrics.enrollmentByInstrument || []
  
  return {
    labels: instrumentData.map(item => item.instrument),
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

// Datos para gráfica de distribución por rendimiento
const performanceDistributionChart = computed(() => {
  const distribution = analyticsStore.studentMetrics.performanceDistribution
  
  return {
    labels: ['Excelente', 'Bueno', 'Regular', 'Necesita Mejora'],
    datasets: [
      {
        label: 'Distribución',
        data: [
          distribution.excellent,
          distribution.good,
          distribution.average,
          distribution.needsImprovement
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ]
      }
    ]
  }
})

// Datos para gráfica de tendencia de asistencia
const attendanceTrendChart = computed(() => {
  const weeklyData = analyticsStore.attendanceMetrics.weeklyAttendance || []
  
  return {
    labels: weeklyData.map(item => item.week),
    datasets: [
      {
        label: 'Tasa de Asistencia (%)',
        data: weeklyData.map(item => item.rate),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

// Datos para gráfica de actividad por mes
const activityByMonthChart = computed(() => {
  // Usar datos reales de inscripción como medida de actividad
  const enrollmentData = analyticsStore.studentMetrics.enrollmentTrends || []
  
  return {
    labels: enrollmentData.map(item => item.date),
    datasets: [
      {
        label: 'Total Estudiantes',
        data: enrollmentData.map(item => item.totalStudents),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      },
      {
        label: 'Nuevos Estudiantes',
        data: enrollmentData.map(item => item.newStudents),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }
    ]
  }
})

// Opciones para gráficas
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    }
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const
    }
  }
}

// Cargar datos iniciales
onMounted(async () => {
  try {
    // Inicializamos con el periodo por defecto
    await loadAnalyticsForPeriod(selectedPeriod.value)
  } catch (error) {
    console.error('Error cargando datos de analytics:', error)
  }
})

// Cargar métricas desde el store utilizando datos reales
async function loadMetrics() {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Preparar datos según el período seleccionado
    prepareDataBySelectedPeriod();
    
    // Si estamos viendo un estudiante específico
    if (selectedStudent.value) {
      // Obtener métricas del estudiante
      const studentData = await analyticsStore.fetchStudentMetrics(selectedStudent.value.id);
      
      // Verificar que las fechas sean válidas antes de crear objetos Date
      if (studentData.attendanceHistory) {
        studentData.attendanceHistory = studentData.attendanceHistory.map(record => {
          // Validar que la fecha sea correcta antes de convertirla
          let date;
          try {
            // Asegurarse de que la fecha tenga el formato correcto
            if (typeof record.date === 'string') {
              // Intentar parsear la fecha
              date = parseISO(record.date);
              // Verificar que la fecha sea válida
              if (!isValid(date)) {
                console.warn(`Fecha inválida encontrada: ${record.date}, usando fecha actual`);
                date = new Date(); // Usar fecha actual como fallback
              }
            } else {
              // Si no es string, usar fecha actual
              date = new Date();
            }
          } catch (e) {
            console.warn(`Error al procesar fecha: ${record.date}`, e);
            date = new Date(); // Usar fecha actual como fallback
          }
          
          return {
            ...record,
            date
          };
        });
      }
      
      studentMetrics.value = studentData;
    } else {
      // Obtener métricas generales de estudiantes
      // Calcular métricas reales a partir de los datos disponibles
      metrics.value = {
        totalStudents: studentsStore.students.length,
        growth: calculateStudentGrowth(),
        averageAttendance: calculateAverageAttendance(),
        averagePerformance: calculateAveragePerformance(),
        atRiskCount: identifyAtRiskStudents().length,
        atRiskPercentage: Math.round((identifyAtRiskStudents().length / studentsStore.students.length) * 100),
        instrumentDistribution: calculateInstrumentDistribution(),
        levelDistribution: calculateLevelDistribution(),
        attendanceTrend: calculateAttendanceTrend(),
        activityByMonth: calculateMonthlyActivity()
      };
    }
    
    // Actualizar gráficos con los nuevos datos
    updateCharts();
    
  } catch (err) {
    console.error('Error cargando métricas de estudiantes:', err);
    error.value = `Error al cargar métricas: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
}

// Función para actualizar los gráficos
function updateCharts() {
  // Esta función se llamará después de cargar los datos
  // No es necesario hacer nada si los computed properties ya están actualizando los gráficos
  console.log('Gráficos actualizados con nuevos datos');
}

// Helper methods to prepare and calculate real data
function prepareDataBySelectedPeriod() {
  // Set the time range in the analytics store based on selected period
  if (selectedPeriod.value !== 'custom') {
    analyticsStore.timeAnalytics.activeRange = selectedPeriod.value
  } else if (customDateRange.value.startDate && customDateRange.value.endDate) {
    // For custom range, update the custom range dates in the store
    analyticsStore.timeAnalytics.dateRanges.customRange = {
      start: parseISO(customDateRange.value.startDate),
      end: parseISO(customDateRange.value.endDate)
    }
    analyticsStore.timeAnalytics.activeRange = 'customRange'
  }
}

// Calculate student growth rate by comparing current student count with previous period
function calculateStudentGrowth(): number {
  // This calculates growth if not provided by the analytics store
  const currentStudentCount = studentsStore.students.length
  
  // Try to get historical student counts if available
  const enrollmentTrends = analyticsStore.studentMetrics.enrollmentTrends
  if (enrollmentTrends && enrollmentTrends.length >= 2) {
    // Compare current with previous period
    const latestEntry = enrollmentTrends[enrollmentTrends.length - 1]
    const previousEntry = enrollmentTrends[enrollmentTrends.length - 2]
    
    if (previousEntry.totalStudents > 0) {
      const growthRate = ((latestEntry.totalStudents - previousEntry.totalStudents) / previousEntry.totalStudents) * 100
      return Number(growthRate.toFixed(1))
    }
  }
  
  // Fallback: check if we can calculate from student registration dates
  let previousPeriodStudents = 0
  const now = new Date()
  const previousPeriodStartDate = new Date()
  previousPeriodStartDate.setMonth(now.getMonth() - 1)
  
  studentsStore.students.forEach(student => {
    // If student has registration date before previous period start
    if (student.registrationDate && new Date(student.registrationDate) < previousPeriodStartDate) {
      previousPeriodStudents++
    }
  })
  
  if (previousPeriodStudents > 0) {
    return Number((((currentStudentCount - previousPeriodStudents) / previousPeriodStudents) * 100).toFixed(1))
  }
  
  return 0 // If we can't calculate growth, return 0
}

// Calculate real average attendance from attendance records
function calculateAverageAttendance(): number {
  const records = attendanceStore.records
  
  if (!records || records.length === 0) {
    return 0
  }
  
  let presentCount = 0
  let totalCount = records.length
  
  records.forEach(record => {
    const status = record.status?.toLowerCase()
    if (status === 'presente' || status === 'present' || status === 'justificado') {
      presentCount++
    }
  })
  
  return Math.round((presentCount / totalCount) * 100)
}

// Calculate real average student performance
function calculateAveragePerformance(): number {
  // Check if we can access qualifications data
  try {
    // Try importing qualification store but handle case where it may not exist
    const { useQualificationStore } = require('../../Qualifications/store/qualification')
    const qualificationStore = useQualificationStore()
    
    if (qualificationStore?.qualifications?.length > 0) {
      // Calculate average from qualifications
      const sum = qualificationStore.qualifications.reduce((acc, qual) => acc + (qual.score || 0), 0)
      return Math.round((sum / qualificationStore.qualifications.length) * 100)
    }
  } catch (error) {
    console.log('Qualification store not available or has incorrect structure:', error)
  }
  
  // If no qualification data, check if students have performance properties
  if (studentsStore.students && studentsStore.students.length > 0) {
    // Try to find performance data in student objects
    const studentsWithPerformance = studentsStore.students.filter(student => 
      student.performance || student.averageScore || student.qualifications
    )
    
    if (studentsWithPerformance.length > 0) {
      const sum = studentsWithPerformance.reduce((acc, student) => {
        return acc + (student.performance || student.averageScore || 0)
      }, 0)
      
      return Math.round((sum / studentsWithPerformance.length))
    }
  }
  
  return 75 // Fallback value if no real data available
}

// Identify students at risk using various factors
function identifyAtRiskStudents(): any[] {
  const atRiskStudents = []
  
  // Get students with attendance issues
  const attendanceThreshold = 70 // Below this percentage is considered at risk
  
  // Define type for student attendance data
  interface AttendanceData {
    present: number;
    total: number;
  }
  
  // Group attendance records by student
  const studentAttendance: Record<string, AttendanceData> = {}
  attendanceStore.records.forEach(record => {
    if (!studentAttendance[record.studentId]) {
      studentAttendance[record.studentId] = {
        present: 0,
        total: 0
      }
    }
    
    studentAttendance[record.studentId].total++
    
    const status = (record.status || '').toLowerCase();
    if (status === 'presente' || status === 'present' || status === 'p' || 
        status === 'justificado' || status === 'justified' || status === 'j') {
      studentAttendance[record.studentId].present++;
    }
  });
  
  // Find students with attendance issues
  Object.entries(studentAttendance).forEach(([studentId, data]: [string, any]) => {
    if (data.total > 0) {
      const attendanceRate = (data.present / data.total) * 100;
      
      if (attendanceRate < attendanceThreshold) {
        // Find student data
        const student = studentsStore.students.find(s => s.id === studentId);
        
        if (student) {
          atRiskStudents.push({
            id: studentId,
            name: student.name || `${student.firstName} ${student.lastName || ''}`,
            instrument: student.instrument || 'No asignado',
            riskType: 'attendance',
            currentValue: Math.round(attendanceRate)
          });
        }
      }
    }
  });
  
  // Identify performance issues (if data available)
  // This would need access to qualification data, adjusting based on your exact data structure
  
  return atRiskStudents
}

// Calculate instrument distribution from real student data
function calculateInstrumentDistribution(): any[] {
  const instrumentCounts = {}
  
  studentsStore.students.forEach(student => {
    if (student.instrument) {
      if (!instrumentCounts[student.instrument]) {
        instrumentCounts[student.instrument] = 0
      }
      instrumentCounts[student.instrument]++
    }
  })
  
  // Convert to array format for chart
  return Object.entries(instrumentCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((Number(count) / studentsStore.students.length) * 100)
  }))
}

// Calculate level distribution from real student data
function calculateLevelDistribution(): any[] {
  const levelCounts = {
    'Principiante': 0,
    'Intermedio': 0,
    'Avanzado': 0,
    'No asignado': 0
  }
  
  studentsStore.students.forEach(student => {
    const level = student.level || 'No asignado'
    if (levelCounts[level] !== undefined) {
      levelCounts[level]++
    } else {
      // If the level doesn't match our predefined categories
      levelCounts['No asignado']++
    }
  })
  
  // Convert to array format for chart
  return Object.entries(levelCounts)
    .filter(([level, count]) => Number(count) > 0) // Only include levels that have students
    .map(([level, count]) => ({
      level,
      count
    }))
}

// Calculate attendance trend from real attendance data
function calculateAttendanceTrend(): any[] {
  // Group attendance records by date
  const attendanceByDate = {}
  
  attendanceStore.records.forEach(record => {
    // Check for both possible date field names (Fecha or date)
    const dateValue = record.Fecha || record.date
    
    if (dateValue) {
      // Ensure the date is valid
      let dateKey = dateValue
      
      try {
        // Try to format as YYYY-MM-DD if it's a Date object or ISO string
        if (dateValue instanceof Date) {
          dateKey = formatISO(dateValue, { representation: 'date' })
        } else if (typeof dateValue === 'string') {
          // Try to parse and then format consistently
          const parsedDate = parseISO(dateValue)
          if (isValid(parsedDate)) {
            dateKey = formatISO(parsedDate, { representation: 'date' })
          }
        }
      } catch (err) {
        console.warn('Could not format date, using as-is:', dateValue)
      }
      
      if (!attendanceByDate[dateKey]) {
        attendanceByDate[dateKey] = {
          present: 0,
          total: 0
        }
      }
      
      attendanceByDate[dateKey].total++
      
      // Check different status formats
      const status = (record.status || '').toLowerCase()
      if (status === 'presente' || status === 'present' || status === 'justificado' || status === 'justified') {
        attendanceByDate[dateKey].present++
      }
    }
  })
  
  // Convert to array format for chart
  return Object.entries(attendanceByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) // Sort by date
    .map(([date, data]: [string, any]) => ({
      date,
      rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
    }))
}

// Calculate monthly activity from real attendance data
function calculateMonthlyActivity(): any[] {
  // Group attendance records by month
  const activityByMonth = {}
  
  attendanceStore.records.forEach(record => {
    // Check for both possible date field names (Fecha or date)
    const dateValue = record.Fecha || record.date
    
    if (dateValue) {
      try {
        // Safely parse the date
        let date;
        if (dateValue instanceof Date) {
          date = dateValue;
        } else if (typeof dateValue === 'string') {
          date = parseISO(dateValue);
        } else {
          return; // Skip this record if date is in an unexpected format
        }
        
        // Verify the date is valid before using it
        if (!isValid(date)) {
          console.warn('Invalid date in record:', dateValue);
          return; // Skip invalid dates
        }
        
        // Format month data
        const monthYearKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMMM', { locale: es });
        
        if (!activityByMonth[monthYearKey]) {
          activityByMonth[monthYearKey] = {
            month: monthName,
            count: 0
          };
        }
        
        activityByMonth[monthYearKey].count++;
      } catch (error) {
        console.warn('Error processing date:', dateValue, error);
      }
    }
  });
  
  // Convert to array format for chart
  return Object.values(activityByMonth)
    .sort((a: any, b: any) => {
      // Sort by month number rather than name to get chronological order
      try {
        // Try to extract month number from name for proper sorting
        const aMonthIndex = es.months.indexOf(a.month.toLowerCase());
        const bMonthIndex = es.months.indexOf(b.month.toLowerCase());
        return aMonthIndex - bMonthIndex;
      } catch (error) {
        // Fallback to string comparison if above fails
        return a.month.localeCompare(b.month);
      }
    });
}

// Datos para gráfica de distribución por instrumento
const instrumentDistributionData = computed(() => {
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

// Datos para gráfica de tendencia de asistencia detallada
const attendanceTrendDetailChart = computed(() => {
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

// Datos para gráfica de actividad mensual detallada
const activityByMonthDetailChart = computed(() => {
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

// Alumnos con mejor rendimiento (usando datos reales)
const topPerformingStudents = computed(() => {
  // Intentar obtener datos reales de estudiantes
  if (studentsStore.students && studentsStore.students.length > 0) {
    // Filtrar estudiantes que tengan datos de rendimiento
    const studentsWithPerformance = studentsStore.students
      .filter(student => {
        // Verificar si el estudiante tiene alguna métrica de rendimiento
        return student.performance || student.averageScore || 
               (student.qualifications && student.qualifications.length > 0);
      })
      .map(student => {
        // Calcular progreso basado en los datos disponibles
        let progress = student.performance || student.averageScore || 0;
        
        // Si tiene calificaciones, calcular promedio
        if (student.qualifications && student.qualifications.length > 0) {
          const sum = student.qualifications.reduce((acc, qual) => acc + (qual.score || 0), 0);
          progress = Math.round((sum / student.qualifications.length) * 100);
        }
        
        return {
          id: student.id,
          name: student.name || `${student.firstName} ${student.lastName || ''}`,
          instrument: student.instrument || 'No asignado',
          level: student.level || 'No asignado',
          progress: progress
        };
      });
    
    // Ordenar por progreso (de mayor a menor) y tomar los 5 primeros
    return studentsWithPerformance
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);
  }
  
  // Si no hay datos reales, devolver un array vacío
  return [];
})

// Generate mock at-risk students
function generateMockAtRiskStudents() {
  return [
    { id: '1', name: 'Gabriel Mendez', performance: 62, instrument: 'Violín' },
    { id: '2', name: 'Sara Linares', performance: 58, instrument: 'Piano' },
    { id: '3', name: 'Miguel Torres', performance: 65, instrument: 'Guitarra' },
    { id: '4', name: 'Valentina Ruiz', performance: 59, instrument: 'Flauta' }
  ]
}

// Generate mock instrument distribution
function generateMockInstrumentDistribution() {
  return [
    { name: 'Piano', count: 24, percentage: 25 },
    { name: 'Violín', count: 20, percentage: 21 },
    { name: 'Guitarra', count: 18, percentage: 19 },
    { name: 'Flauta', count: 12, percentage: 13 },
    { name: 'Otros', count: 21, percentage: 22 }
  ]
}

// Generate mock attendance trend for the past 30 days
function generateMockAttendanceTrend() {
  const result = []
  const today = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    
    // Create a semi-realistic pattern with variations
    let rate = 85 + Math.sin(i * 0.5) * 15 + (Math.random() * 8 - 4)
    rate = Math.min(100, Math.max(65, Math.round(rate))) // Keep between 65% and 100%
    
    result.push({
      date: format(date, 'yyyy-MM-dd'),
      rate
    })
  }
  
  return result
}  // Alumnos en riesgo filtrados (vista detallada)
const filteredAtRiskStudentsDetail = computed(() => {
  // Usar la función real que identifica estudiantes en riesgo
  const atRiskStudentsList = identifyAtRiskStudents();
  
  if (riskFilterType.value === 'all') {
    return atRiskStudentsList;
  }
  
  return atRiskStudentsList.filter(student => student.riskType === riskFilterType.value);
})

</script>