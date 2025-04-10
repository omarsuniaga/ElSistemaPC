<template>
  <div class="teacher-analytics">
    <header class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">Análisis de Maestros</h2>
      
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
          <h4 class="text-sm text-gray-500">Total Maestros</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.totalTeachers }}</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Asistencia Promedio</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.averageAttendance }}%</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">de clases programadas</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Eficiencia</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.averageEfficiency }}%</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">promedio</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Satisfacción</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.averageSatisfaction }} / 5</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">basado en evaluaciones</p>
        </div>
      </div>

      <!-- Balance de asistencias semanales -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h4 class="text-base font-medium mb-4">Balance de Asistencias Semanales</h4>
        <div class="h-80">
          <Bar 
            :data="weeklyAttendanceBalanceChart" 
            :options="groupedBarChartOptions" 
          />
        </div>
      </div>

      <!-- Distribución de especialidades -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-base font-medium mb-4">Distribución por Especialidad</h4>
          <div class="h-72">
            <Doughnut 
              :data="specialtyDistributionChart" 
              :options="doughnutOptions" 
            />
          </div>
        </div>

        <!-- Promedio de carga horaria -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-base font-medium mb-4">Carga Horaria (horas/semana)</h4>
          <div class="h-72">
            <Bar 
              :data="workloadChart" 
              :options="barChartOptions" 
            />
          </div>
        </div>
      </div>

      <!-- Top maestros por eficiencia -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h4 class="text-base font-medium mb-4">Maestros con Mayor Eficiencia</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Maestro
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Especialidad
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Clases
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Asistencia
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Eficiencia
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="teacher in topPerformingTeachers" :key="teacher.id">
                <td class="px-4 py-2 whitespace-nowrap">{{ teacher.name }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ teacher.specialty }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ teacher.totalClasses }}</td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span 
                    class="px-2 py-1 text-xs rounded-full"
                    :class="{
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200': teacher.attendance >= 95,
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200': teacher.attendance >= 90 && teacher.attendance < 95,
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200': teacher.attendance < 90
                    }"
                  >
                    {{ teacher.attendance }}%
                  </span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        class="h-full rounded-full bg-blue-500" 
                        :style="`width: ${teacher.efficiency}%`"
                      ></div>
                    </div>
                    <span class="text-sm">{{ teacher.efficiency }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Desglose de asistencia semanal por profesor -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-base font-medium">Desglose de Asistencia por Profesor</h4>
          <div class="flex gap-2">
            <select v-model="selectedTeacher" class="px-3 py-1 border rounded-md text-sm">
              <option value="">Seleccionar Profesor</option>
              <option 
                v-for="teacher in teachersList" 
                :key="teacher.id" 
                :value="teacher.id"
              >
                {{ teacher.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="selectedTeacher" class="space-y-6">
          <h5 class="font-medium text-gray-700 dark:text-gray-300">
            {{ getTeacherName(selectedTeacher) }}
          </h5>

          <!-- Diagrama semanal -->
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr>
                  <th class="px-2 py-2 text-center bg-gray-50 dark:bg-gray-700"></th>
                  <th 
                    v-for="day in ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']" 
                    :key="day"
                    class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700"
                  >
                    {{ day }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(timeSlot, index) in teacherSchedule" :key="index">
                  <td class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                    {{ timeSlot.time }}
                  </td>
                  <td 
                    v-for="day in ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']"
                    :key="day"
                    class="px-4 py-3 text-center"
                    :class="getCellClass(timeSlot, day)"
                  >
                    <template v-if="getClassInfo(timeSlot, day)">
                      <p class="font-medium text-xs">{{ getClassInfo(timeSlot, day).name }}</p>
                      <p class="text-xs">{{ getClassInfo(timeSlot, day).attendance }}%</p>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Leyenda -->
          <div class="flex justify-center gap-4">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-100 dark:bg-green-800 mr-1"></div>
              <span class="text-xs">Asistencia alta (>90%)</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-yellow-100 dark:bg-yellow-800 mr-1"></div>
              <span class="text-xs">Asistencia media (75-90%)</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-red-100 dark:bg-red-800 mr-1"></div>
              <span class="text-xs">Asistencia baja (<75%)</span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          Seleccione un profesor para ver su desglose de asistencia semanal
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAnalyticsStore } from '../store/analytics'
import { useTeachersStore } from '../../Teachers/store/teachers'
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
const teachersStore = useTeachersStore()

// Estado local
const isLoading = ref(true)
const error = ref('')
const selectedPeriod = ref('currentMonth')
const showCustomDatePicker = ref(false)
const customDateRange = ref({
  startDate: '',
  endDate: ''
})
const selectedTeacher = ref('')

// Métricas
const metrics = ref({
  totalTeachers: 0,
  averageAttendance: 0,
  averageEfficiency: 0,
  averageSatisfaction: 0,
  weeklyAttendanceBalance: [],
  specialtyDistribution: [],
  workloadDistribution: []
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
      teachersStore.fetchTeachers()
    ])
    
    // Asignar métricas de maestros
    const teacherMetrics = analyticsStore.teacherMetrics || {}
    
    // Datos básicos
    metrics.value.totalTeachers = teachersStore.teachers?.length || 0
    metrics.value.averageAttendance = teacherMetrics.averageAttendance || 92
    metrics.value.averageEfficiency = teacherMetrics.averageEfficiency || 87
    metrics.value.averageSatisfaction = teacherMetrics.averageSatisfaction || 4.6
    
    // Balance de asistencia semanal
    metrics.value.weeklyAttendanceBalance = teacherMetrics.weeklyAttendanceBalance || generateMockWeeklyAttendance()
    
    // Distribución por especialidad
    metrics.value.specialtyDistribution = teacherMetrics.specialtyDistribution || generateMockSpecialtyDistribution()
    
    // Distribución de carga horaria
    metrics.value.workloadDistribution = teacherMetrics.workloadDistribution || generateMockWorkloadDistribution()
    
  } catch (err) {
    console.error('Error cargando métricas de maestros:', err)
    error.value = 'Error al cargar los datos. Por favor, intente de nuevo.'
  } finally {
    isLoading.value = false
  }
}

// Funciones para generar datos simulados
function generateMockWeeklyAttendance() {
  const teachers = [
    'Prof. García',
    'Prof. Rodríguez',
    'Prof. Martínez',
    'Prof. López',
    'Prof. Fernández'
  ]
  
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  const result = []
  
  teachers.forEach(teacher => {
    const teacherData = {
      teacher,
      planned: {},
      actual: {}
    }
    
    days.forEach(day => {
      const plannedHours = Math.floor(Math.random() * 4) + 2 // 2-6
      const actualHours = plannedHours - Math.floor(Math.random() * Math.min(2, plannedHours)) // 0-2 menos que planned
      
      teacherData.planned[day] = plannedHours
      teacherData.actual[day] = actualHours
    })
    
    result.push(teacherData)
  })
  
  return result
}

function generateMockSpecialtyDistribution() {
  return [
    { specialty: 'Piano', count: 6 },
    { specialty: 'Guitarra', count: 8 },
    { specialty: 'Violín', count: 5 },
    { specialty: 'Batería', count: 3 },
    { specialty: 'Canto', count: 4 },
    { specialty: 'Otros', count: 2 }
  ]
}

function generateMockWorkloadDistribution() {
  return [
    { hours: '0-10', count: 3 },
    { hours: '11-20', count: 8 },
    { hours: '21-30', count: 12 },
    { hours: '31-40', count: 5 }
  ]
}

// Lista de profesores
const teachersList = computed(() => {
  return teachersStore.teachers?.map(teacher => ({
    id: teacher.id,
    name: teacher.nombre || teacher.name || `Profesor ${teacher.id}`,
    specialty: teacher.specialty || 'No especificado'
  })) || []
})

// Datos para el horario del profesor seleccionado
const teacherSchedule = computed(() => {
  const timeSlots = []
  
  for (let i = 8; i <= 20; i++) {
    timeSlots.push({
      time: `${i}:00`,
      classes: {
        Lunes: i % 3 === 0 ? generateMockClass() : null,
        Martes: i % 4 === 0 ? generateMockClass() : null,
        Miércoles: i % 2 === 0 ? generateMockClass() : null,
        Jueves: i % 3 === 1 ? generateMockClass() : null,
        Viernes: i % 4 === 1 ? generateMockClass() : null,
        Sábado: i >= 9 && i <= 14 && i % 2 === 0 ? generateMockClass() : null,
        Domingo: null
      }
    })
  }
  
  return timeSlots
})

// Función para generar una clase simulada
function generateMockClass() {
  const names = ['Piano Básico', 'Guitarra Intermedio', 'Violín Avanzado', 'Batería', 'Teoría Musical']
  const attendance = Math.floor(Math.random() * 31) + 70 // 70-100%
  
  return {
    name: names[Math.floor(Math.random() * names.length)],
    attendance
  }
}

// Función para obtener el nombre de un profesor por su ID
function getTeacherName(id) {
  const teacher = teachersList.value.find(t => t.id === id)
  return teacher ? teacher.name : 'Profesor no encontrado'
}

// Función para obtener la clase en un día y horario específico
function getClassInfo(timeSlot, day) {
  return timeSlot.classes[day]
}

// Función para obtener la clase CSS según la asistencia
function getCellClass(timeSlot, day) {
  const classInfo = getClassInfo(timeSlot, day)
  
  if (!classInfo) {
    return 'bg-white dark:bg-gray-800'
  }
  
  if (classInfo.attendance >= 90) {
    return 'bg-green-100 dark:bg-green-800'
  } else if (classInfo.attendance >= 75) {
    return 'bg-yellow-100 dark:bg-yellow-800'
  } else {
    return 'bg-red-100 dark:bg-red-800'
  }
}

// Mejores profesores por eficiencia
const topPerformingTeachers = computed(() => {
  const teachers = []
  
  for (let i = 0; i < 5; i++) {
    teachers.push({
      id: `top-teacher-${i + 1}`,
      name: `Profesor ${i + 1}`,
      specialty: ['Piano', 'Guitarra', 'Violín', 'Batería', 'Canto'][i],
      totalClasses: Math.floor(Math.random() * 6) + 3, // 3-8
      attendance: Math.floor(Math.random() * 11) + 90, // 90-100%
      efficiency: Math.floor(Math.random() * 16) + 85 // 85-100%
    })
  }
  
  return teachers.sort((a, b) => b.efficiency - a.efficiency)
})

// Datos para gráfico de balance de asistencias semanales
const weeklyAttendanceBalanceChart = computed(() => {
  const data = metrics.value.weeklyAttendanceBalance
  
  // Extraer nombres de profesores y días
  const teachers = data.map(item => item.teacher)
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  
  // Preparar datasets
  const datasets = []
  
  days.forEach((day, index) => {
    const plannedData = data.map(item => item.planned[day])
    const actualData = data.map(item => item.actual[day])
    
    datasets.push({
      label: `Plan ${day}`,
      data: plannedData,
      backgroundColor: `rgba(59, 130, 246, ${0.5 + index * 0.1})`,
      stack: day
    })
    
    datasets.push({
      label: `Real ${day}`,
      data: actualData,
      backgroundColor: `rgba(16, 185, 129, ${0.5 + index * 0.1})`,
      stack: day
    })
  })
  
  return {
    labels: teachers,
    datasets
  }
})

// Datos para gráfico de distribución por especialidad
const specialtyDistributionChart = computed(() => {
  const specialties = metrics.value.specialtyDistribution
  
  return {
    labels: specialties.map(item => item.specialty),
    datasets: [
      {
        label: 'Maestros',
        data: specialties.map(item => item.count),
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

// Datos para gráfico de carga horaria
const workloadChart = computed(() => {
  const workload = metrics.value.workloadDistribution
  
  return {
    labels: workload.map(item => item.hours),
    datasets: [
      {
        label: 'Maestros',
        data: workload.map(item => item.count),
        backgroundColor: 'rgba(99, 102, 241, 0.6)'
      }
    ]
  }
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

// Opciones para gráficos de barras agrupadas
const groupedBarChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  },
  scales: {
    x: {
      stacked: false
    },
    y: {
      beginAtZero: true
    }
  }
}

// Cargar datos iniciales
onMounted(() => {
  loadMetrics()
})
</script>