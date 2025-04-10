<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format, subMonths, subWeeks, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAnalyticsStore } from '../store/analytics'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { Bar, Doughnut } from 'vue-chartjs'
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

const props = defineProps({
  teacherId: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    default: () => startOfMonth(subMonths(new Date(), 1))
  },
  endDate: {
    type: Date,
    default: () => endOfMonth(new Date())
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const analyticsStore = useAnalyticsStore()
const teachersStore = useTeachersStore()

// Estado local
const isLoading = ref(false)
const error = ref('')
const report = ref<any>(null)
const teacher = ref<any>(null)
const customDateRange = ref(false)
const dateRange = ref({
  startDate: format(props.startDate, 'yyyy-MM-dd'),
  endDate: format(props.endDate, 'yyyy-MM-dd')
})

// Generación de periodo automática
const periods = [
  { id: 'last-month', name: 'Último mes', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
  { id: 'current-month', name: 'Mes actual', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  { id: 'last-week', name: 'Última semana', start: subWeeks(new Date(), 1), end: new Date() },
  { id: 'custom', name: 'Personalizado', start: new Date(), end: new Date() }
]

const selectedPeriod = ref(periods[0].id)

// Observadores
watch(() => props.teacherId, (newTeacherId) => {
  if (newTeacherId) {
    loadTeacherData()
  }
})

watch(selectedPeriod, (newPeriod) => {
  if (newPeriod !== 'custom') {
    const period = periods.find(p => p.id === newPeriod)
    if (period) {
      dateRange.value = {
        startDate: format(period.start, 'yyyy-MM-dd'),
        endDate: format(period.end, 'yyyy-MM-dd')
      }
      loadReport()
    }
  } else {
    customDateRange.value = true
  }
})

watch([() => dateRange.value.startDate, () => dateRange.value.endDate], () => {
  if (customDateRange.value && dateRange.value.startDate && dateRange.value.endDate) {
    loadReport()
  }
})

// Carga de datos
async function loadTeacherData() {
  if (!props.teacherId) return
  
  isLoading.value = true
  error.value = ''

  try {
    await teachersStore.fetchTeachers()
    teacher.value = teachersStore.getTeacherById(props.teacherId)
    
    if (!teacher.value) {
      throw new Error('Profesor no encontrado')
    }
    
    await loadReport()
  } catch (err: any) {
    console.error('Error al cargar datos del profesor:', err)
    error.value = err.message || 'Error al cargar datos del profesor'
  } finally {
    isLoading.value = false
  }
}

async function loadReport() {
  if (!props.teacherId) return
  
  isLoading.value = true
  error.value = ''

  try {
    const start = new Date(dateRange.value.startDate)
    const end = new Date(dateRange.value.endDate)
    
    report.value = await analyticsStore.generateTeacherReport(
      props.teacherId, 
      start, 
      end
    )
  } catch (err: any) {
    console.error('Error al generar reporte del profesor:', err)
    error.value = err.message || 'Error al generar reporte del profesor'
  } finally {
    isLoading.value = false
  }
}

// Gráficos y datos procesados
const efficiencyRatingClass = computed(() => {
  if (!report.value) return {}
  
  const efficiency = report.value.efficiency.overall
  
  if (efficiency > 90) return 'text-green-600 dark:text-green-400'
  if (efficiency > 80) return 'text-emerald-600 dark:text-emerald-400'
  if (efficiency > 70) return 'text-lime-600 dark:text-lime-400'
  if (efficiency > 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
})

const attendanceChartData = computed(() => {
  if (!report.value) {
    return {
      labels: [],
      datasets: []
    }
  }

  return {
    labels: ['Horas Programadas', 'Horas Trabajadas'],
    datasets: [
      {
        label: 'Horas',
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
        data: [
          report.value.attendance.scheduledHours,
          report.value.attendance.workedHours
        ]
      }
    ]
  }
})

const teacherClassesData = computed(() => {
  if (!report.value || !report.value.classes || !report.value.classes.details) {
    return []
  }

  return report.value.classes.details.map((classItem: any) => {
    const schedules = classItem.schedules || []
    const totalSchedules = schedules.length
    const className = classItem.name || classItem.nombre || 'Clase sin nombre'
    
    return {
      name: className,
      totalSchedules,
      instrument: classItem.instrument || classItem.instrumento || 'No especificado'
    }
  })
})

const appUsageChartData = computed(() => {
  if (!report.value || !report.value.appUsage) {
    return {
      labels: [],
      datasets: []
    }
  }
  
  return {
    labels: ['En Horario de Clase', 'Fuera de Horario'],
    datasets: [
      {
        label: 'Sesiones',
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(156, 163, 175, 0.8)'],
        data: [
          report.value.appUsage.sessionsInClassTime || 0,
          (report.value.appUsage.totalSessions || 0) - (report.value.appUsage.sessionsInClassTime || 0)
        ]
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: false
    }
  }
}

// Cargar datos cuando se monte el componente
onMounted(() => {
  if (props.teacherId) {
    loadTeacherData()
  }
})
</script>

<template>
  <div class="teacher-performance">
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3">Generando reporte...</span>
    </div>
    
    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
      {{ error }}
    </div>
    
    <div v-else>
      <!-- Encabezado del reporte -->
      <div v-if="teacher && report" class="mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold">
              {{ teacher.nombre || teacher.name || 'Profesor' }}
            </h3>
            <div class="text-sm text-gray-600">
              <p>Periodo: {{ format(new Date(report.period.start), 'dd/MM/yyyy', { locale: es }) }} - 
                     {{ format(new Date(report.period.end), 'dd/MM/yyyy', { locale: es }) }}</p>
            </div>
          </div>
          
          <!-- Selector de periodo -->
          <div v-if="!props.compact" class="flex space-x-2">
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
      </div>
      
      <!-- Contenido del reporte -->
      <div v-if="report" class="space-y-6">
        <!-- Indicadores clave -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500 dark:text-gray-400">Clases Impartidas</h4>
            <div class="mt-2 flex items-center">
              <span class="text-2xl font-bold">{{ report.classes.total }}</span>
            </div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500 dark:text-gray-400">Asistencia</h4>
            <div class="mt-2 flex items-center">
              <span class="text-2xl font-bold">{{ Math.round(report.attendance.attendanceRate) }}%</span>
              <div 
                class="ml-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
              >
                <div 
                  class="bg-blue-600 h-2.5 rounded-full" 
                  :style="`width: ${report.attendance.attendanceRate}%`"
                ></div>
              </div>
            </div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-sm text-gray-500 dark:text-gray-400">Eficiencia General</h4>
            <div class="mt-2 flex items-center">
              <span class="text-2xl font-bold" :class="efficiencyRatingClass">
                {{ Math.round(report.efficiency.overall) }}%
              </span>
              <span class="ml-2 px-2 py-0.5 rounded text-xs" :class="efficiencyRatingClass">
                {{ report.efficiency.rating }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Gráficos y detalles -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Horas trabajadas vs programadas -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-base font-medium mb-4">Horas Trabajadas vs Programadas</h4>
            <div class="h-60">
              <Bar :data="attendanceChartData" :options="chartOptions" />
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span class="text-sm text-gray-500 dark:text-gray-400">Programadas</span>
                <p class="font-medium">{{ report.attendance.scheduledHours }} horas</p>
              </div>
              <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span class="text-sm text-gray-500 dark:text-gray-400">Trabajadas</span>
                <p class="font-medium">{{ report.attendance.workedHours }} horas</p>
              </div>
            </div>
          </div>
          
          <!-- Uso de la aplicación -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 class="text-base font-medium mb-4">Uso de la Aplicación</h4>
            <div class="h-60">
              <Doughnut :data="appUsageChartData" :options="chartOptions" />
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2">
              <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span class="text-sm text-gray-500 dark:text-gray-400">Total Sesiones</span>
                <p class="font-medium">{{ report.appUsage.totalSessions }}</p>
              </div>
              <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span class="text-sm text-gray-500 dark:text-gray-400">Tiempo Promedio</span>
                <p class="font-medium">{{ Math.round(report.appUsage.averageSessionDuration) }} min</p>
              </div>
              <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span class="text-sm text-gray-500 dark:text-gray-400">Eficiencia de Uso</span>
                <p class="font-medium">{{ Math.round(report.appUsage.efficiencyRate) }}%</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Clases del profesor -->
        <div v-if="!props.compact && teacherClassesData.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-base font-medium mb-4">Clases Impartidas</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full table-auto">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-700">
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clase</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Instrumento</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sesiones</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="classItem in teacherClassesData" :key="classItem.name">
                  <td class="px-4 py-2">{{ classItem.name }}</td>
                  <td class="px-4 py-2">{{ classItem.instrument }}</td>
                  <td class="px-4 py-2">{{ classItem.totalSchedules }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div v-else-if="!isLoading" class="text-center py-8 text-gray-500">
        Selecciona un profesor y un rango de fechas para generar el reporte
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.teacher-performance {
  @apply w-full;
}
</style>