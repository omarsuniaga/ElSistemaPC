<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        Panel de Analytics
      </h3>
      <div class="flex space-x-2">
        <select v-model="selectedPeriod" class="px-3 py-1 text-sm border border-gray-300 rounded-md">
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="quarter">Este trimestre</option>
          <option value="year">Este año</option>
        </select>
        <button
          @click="refreshData"
          class="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded-md transition-colors"
        >
          Actualizar
        </button>
        <button
          @click="exportReport"
          class="px-3 py-1 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
        >
          Exportar
        </button>
      </div>
    </div>

    <!-- Métricas principales -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Estudiantes Activos</p>
            <p class="text-3xl font-bold">{{ analytics.activeStudents }}</p>
            <p class="text-blue-100 text-sm">
              <span :class="getTrendClass(analytics.studentsTrend)">
                {{ analytics.studentsTrend > 0 ? '+' : '' }}{{ analytics.studentsTrend }}%
              </span>
              vs período anterior
            </p>
          </div>
          <div class="bg-blue-400 rounded-full p-3">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">Ingresos</p>
            <p class="text-3xl font-bold">${{ formatNumber(analytics.revenue) }}</p>
            <p class="text-green-100 text-sm">
              <span :class="getTrendClass(analytics.revenueTrend)">
                {{ analytics.revenueTrend > 0 ? '+' : '' }}{{ analytics.revenueTrend }}%
              </span>
              vs período anterior
            </p>
          </div>
          <div class="bg-green-400 rounded-full p-3">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">Clases Impartidas</p>
            <p class="text-3xl font-bold">{{ analytics.classesCompleted }}</p>
            <p class="text-purple-100 text-sm">
              <span :class="getTrendClass(analytics.classesTrend)">
                {{ analytics.classesTrend > 0 ? '+' : '' }}{{ analytics.classesTrend }}%
              </span>
              vs período anterior
            </p>
          </div>
          <div class="bg-purple-400 rounded-full p-3">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Satisfacción</p>
            <p class="text-3xl font-bold">{{ analytics.satisfaction }}%</p>
            <p class="text-orange-100 text-sm">
              <span :class="getTrendClass(analytics.satisfactionTrend)">
                {{ analytics.satisfactionTrend > 0 ? '+' : '' }}{{ analytics.satisfactionTrend }}%
              </span>
              vs período anterior
            </p>
          </div>
          <div class="bg-orange-400 rounded-full p-3">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Gráfico de ingresos -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Ingresos por Mes</h4>
        <div class="h-64 flex items-end space-x-2">
          <div 
            v-for="(month, index) in revenueChart" 
            :key="index"
            class="bg-green-500 rounded-t flex-1 flex items-end justify-center pb-2"
            :style="{ height: `${(month.value / Math.max(...revenueChart.map(m => m.value))) * 100}%` }"
          >
            <span class="text-white text-xs font-semibold">${{ formatNumber(month.value) }}</span>
          </div>
        </div>
        <div class="flex justify-between mt-2">
          <span v-for="month in revenueChart" :key="month.month" class="text-xs text-gray-600">
            {{ month.month }}
          </span>
        </div>
      </div>

      <!-- Gráfico de asistencia -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Asistencia por Semana</h4>
        <div class="h-64 flex items-end space-x-2">
          <div 
            v-for="(week, index) in attendanceChart" 
            :key="index"
            class="bg-blue-500 rounded-t flex-1 flex items-end justify-center pb-2"
            :style="{ height: `${(week.value / 100) * 100}%` }"
          >
            <span class="text-white text-xs font-semibold">{{ week.value }}%</span>
          </div>
        </div>
        <div class="flex justify-between mt-2">
          <span v-for="week in attendanceChart" :key="week.week" class="text-xs text-gray-600">
            {{ week.week }}
          </span>
        </div>
      </div>
    </div>

    <!-- Distribución de instrumentos -->
    <div class="bg-gray-50 rounded-lg p-6 mb-8">
      <h4 class="text-lg font-semibold text-gray-900 mb-4">Distribución de Instrumentos</h4>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          v-for="instrument in instrumentDistribution" 
          :key="instrument.name"
          class="text-center"
        >
          <div 
            class="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg mb-2"
            :style="{ backgroundColor: instrument.color }"
          >
            {{ instrument.count }}
          </div>
          <p class="text-sm font-medium text-gray-700">{{ instrument.name }}</p>
          <p class="text-xs text-gray-500">{{ instrument.percentage }}%</p>
        </div>
      </div>
    </div>

    <!-- Tabla de top maestros -->
    <div class="bg-gray-50 rounded-lg p-6">
      <h4 class="text-lg font-semibold text-gray-900 mb-4">Top Maestros por Rendimiento</h4>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th class="pb-2">Maestro</th>
              <th class="pb-2">Estudiantes</th>
              <th class="pb-2">Clases</th>
              <th class="pb-2">Calificación</th>
              <th class="pb-2">Ingresos</th>
            </tr>
          </thead>
          <tbody class="text-sm text-gray-900">
            <tr v-for="teacher in topTeachers" :key="teacher.id" class="border-t border-gray-200">
              <td class="py-2 font-medium">{{ teacher.name }}</td>
              <td class="py-2">{{ teacher.students }}</td>
              <td class="py-2">{{ teacher.classes }}</td>
              <td class="py-2">
                <div class="flex items-center">
                  <span class="text-yellow-400">★</span>
                  <span class="ml-1">{{ teacher.rating }}</span>
                </div>
              </td>
              <td class="py-2 font-semibold">${{ formatNumber(teacher.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Analytics {
  activeStudents: number
  studentsTrend: number
  revenue: number
  revenueTrend: number
  classesCompleted: number
  classesTrend: number
  satisfaction: number
  satisfactionTrend: number
}

interface ChartData {
  month?: string
  week?: string
  value: number
}

interface InstrumentData {
  name: string
  count: number
  percentage: number
  color: string
}

interface TopTeacher {
  id: string
  name: string
  students: number
  classes: number
  rating: number
  revenue: number
}

const emit = defineEmits<{
  refreshData: []
  exportReport: [period: string]
}>()

// State
const selectedPeriod = ref('month')

const analytics = ref<Analytics>({
  activeStudents: 156,
  studentsTrend: 8.5,
  revenue: 45320,
  revenueTrend: 12.3,
  classesCompleted: 342,
  classesTrend: -2.1,
  satisfaction: 94,
  satisfactionTrend: 3.2
})

const revenueChart = ref<ChartData[]>([
  { month: 'Ene', value: 35000 },
  { month: 'Feb', value: 42000 },
  { month: 'Mar', value: 38000 },
  { month: 'Abr', value: 45000 },
  { month: 'May', value: 48000 },
  { month: 'Jun', value: 45320 }
])

const attendanceChart = ref<ChartData[]>([
  { week: 'S1', value: 92 },
  { week: 'S2', value: 88 },
  { week: 'S3', value: 95 },
  { week: 'S4', value: 91 }
])

const instrumentDistribution = ref<InstrumentData[]>([
  { name: 'Piano', count: 45, percentage: 29, color: '#3B82F6' },
  { name: 'Guitarra', count: 38, percentage: 24, color: '#10B981' },
  { name: 'Violín', count: 32, percentage: 21, color: '#8B5CF6' },
  { name: 'Batería', count: 25, percentage: 16, color: '#F59E0B' },
  { name: 'Canto', count: 16, percentage: 10, color: '#EF4444' }
])

const topTeachers = ref<TopTeacher[]>([
  { id: '1', name: 'Prof. Elena Martínez', students: 15, classes: 68, rating: 4.8, revenue: 8500 },
  { id: '2', name: 'Mtro. Jorge Díaz', students: 12, classes: 54, rating: 4.6, revenue: 7200 },
  { id: '3', name: 'Mtra. Carmen Vásquez', students: 10, classes: 45, rating: 4.9, revenue: 6800 },
  { id: '4', name: 'Prof. Ricardo Moreno', students: 14, classes: 62, rating: 4.7, revenue: 7800 },
  { id: '5', name: 'Mtra. Lucía Fernández', students: 11, classes: 48, rating: 4.5, revenue: 6400 }
])

// Methods
const getTrendClass = (trend: number) => {
  return trend > 0 ? 'text-green-200' : 'text-red-200'
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-ES').format(num)
}

const refreshData = () => {
  emit('refreshData')
  // Simular actualización de datos
  loadAnalytics()
}

const exportReport = () => {
  emit('exportReport', selectedPeriod.value)
}

const loadAnalytics = () => {
  // Simular carga de datos analíticos
  // En una aplicación real, esto haría una llamada a la API
  console.log('Loading analytics for period:', selectedPeriod.value)
  
  // Actualizar datos basados en el período seleccionado
  if (selectedPeriod.value === 'today') {
    analytics.value.activeStudents = 142
    analytics.value.revenue = 1580
    analytics.value.classesCompleted = 28
  } else if (selectedPeriod.value === 'week') {
    analytics.value.activeStudents = 148
    analytics.value.revenue = 8950
    analytics.value.classesCompleted = 156
  }
  // ... más lógica para otros períodos
}

// Lifecycle
onMounted(() => {
  loadAnalytics()
})
</script>
