<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Header con título y período -->
    <div class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-600">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Métricas de Asistencia
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ formatDateRange(dateRange.start, dateRange.end) }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="refreshMetrics"
            :disabled="loading"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title="Actualizar métricas"
          >
            <svg class="w-5 h-5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p class="text-gray-500 dark:text-gray-400">Cargando métricas de asistencia...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-6">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm text-red-700 dark:text-red-400">{{ error }}</span>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else-if="!metrics || metrics.summary.total === 0" class="p-6">
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Sin registros de asistencia</h3>
        <p class="text-gray-500 dark:text-gray-400">No hay datos de asistencia disponibles para este período.</p>
      </div>
    </div>

    <!-- Métricas Content -->
    <div v-else class="p-6 space-y-6">
      <!-- Resumen General -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-600 dark:text-green-400 font-medium">Presente</p>
              <p class="text-2xl font-bold text-green-700 dark:text-green-300">{{ metrics.summary.present }}</p>
            </div>
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-red-600 dark:text-red-400 font-medium">Ausente</p>
              <p class="text-2xl font-bold text-red-700 dark:text-red-300">{{ metrics.summary.absent }}</p>
            </div>
            <div class="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Tardanza</p>
              <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{{ metrics.summary.late }}</p>
            </div>
            <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">Justificado</p>
              <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ metrics.summary.justified }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasa de Asistencia -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">Tasa de Asistencia</h4>
          <span class="text-lg font-bold" :class="getAttendanceRateColor(metrics.summary.attendanceRate)">
            {{ metrics.summary.attendanceRate }}%
          </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-500 ease-out"
            :class="getAttendanceRateBarColor(metrics.summary.attendanceRate)"
            :style="{ width: metrics.summary.attendanceRate + '%' }"
          ></div>
        </div>
        <div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0%</span>
          <span class="font-medium" :class="getClassificationColor(metrics.classification)">
            {{ metrics.classification }}
          </span>
          <span>100%</span>
        </div>
      </div>

      <!-- Performance por Clase -->
      <div v-if="metrics.classPerformance && metrics.classPerformance.length > 0">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Rendimiento por Clase</h4>
        <div class="space-y-3">
          <div 
            v-for="classData in metrics.classPerformance" 
            :key="classData.classId"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ classData.className || 'Clase sin nombre' }}
              </span>
              <span class="text-sm font-semibold" :class="getAttendanceRateColor(classData.attendanceRate)">
                {{ classData.attendanceRate }}%
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div 
                class="h-1.5 rounded-full transition-all duration-300"
                :class="getAttendanceRateBarColor(classData.attendanceRate)"
                :style="{ width: classData.attendanceRate + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{{ classData.present }} presente de {{ classData.total }} clases</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Registros Recientes -->
      <div v-if="metrics.recentRecords && metrics.recentRecords.length > 0">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Registros Recientes</h4>
        <div class="space-y-2">
          <div 
            v-for="record in metrics.recentRecords.slice(0, 5)" 
            :key="`${record.Fecha}-${record.classId}`"
            class="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full" :class="getStatusColor(record)"></div>
              <div>
                <span class="text-sm text-gray-900 dark:text-white">
                  {{ record.className || 'Clase sin nombre' }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {{ formatDate(record.fecha) }}
                </span>
              </div>
            </div>
            <span class="text-xs font-medium px-2 py-1 rounded-full" :class="getStatusBadgeClass(record)">
              {{ getStatusText(record) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getStudentAttendanceMetrics } from '../services/attendanceAnalysis'
import type { AttendanceMetrics } from '../services/attendanceAnalysis'

// Props
interface Props {
  studentId: string
  dateRange: {
    start: string
    end: string
  }
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false
})

// State
const loading = ref(false)
const error = ref<string | null>(null)
const metrics = ref<AttendanceMetrics | null>(null)

// Computed
const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start).toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short' 
  })
  const endDate = new Date(end).toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
  return `${startDate} - ${endDate}`
}

const formatDate = (date: any) => {
  if (!date) return 'Sin fecha'
  
  // Si es una fecha string, convertir a Date
  if (typeof date === 'string') {
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    })
  }
  
  // Si ya es un Date object
  if (date instanceof Date) {
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    })
  }
  
  return 'Formato inválido'
}

// Helper functions
const getAttendanceRateColor = (rate: number) => {
  if (rate >= 90) return 'text-green-600 dark:text-green-400'
  if (rate >= 75) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const getAttendanceRateBarColor = (rate: number) => {
  if (rate >= 90) return 'bg-green-500'
  if (rate >= 75) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getClassificationColor = (classification: string) => {
  switch (classification) {
    case 'Excelente': return 'text-green-600 dark:text-green-400'
    case 'Bueno': return 'text-blue-600 dark:text-blue-400'
    case 'Regular': return 'text-yellow-600 dark:text-yellow-400'
    case 'Deficiente': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusColor = (record: any) => {
  switch (record.status) {
    case 'Presente': return 'bg-green-500'
    case 'Justificado': return 'bg-blue-500'
    case 'Tardanza': return 'bg-yellow-500'
    case 'Ausente': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getStatusBadgeClass = (record: any) => {
  switch (record.status) {
    case 'Presente': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'Justificado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'Tardanza': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'Ausente': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

const getStatusText = (record: any) => {
  return record.status || 'Desconocido'
}

// Methods
const loadMetrics = async () => {
  try {
    loading.value = true
    error.value = null
    
    console.log('🔄 Cargando métricas de asistencia desde FIREBASE para:', props.studentId)
    console.log('📅 Rango de fechas:', props.dateRange)
    
    // Usar la nueva función optimizada que busca directamente en ASISTENCIAS
    const attendanceMetrics = await getStudentAttendanceMetrics(props.studentId, {
      start: props.dateRange.start,
      end: props.dateRange.end
    })

    metrics.value = attendanceMetrics
    
    console.log('✅ Métricas calculadas desde Firebase:', {
      total: metrics.value.summary.total,
      attendanceRate: metrics.value.summary.attendanceRate,
      classification: metrics.value.classification,
      classesWithNames: metrics.value.classPerformance.map(c => ({ 
        name: c.className, 
        id: c.classId 
      }))
    })
  } catch (err: any) {
    console.error('❌ Error cargando métricas:', err)
    error.value = err.message || 'Error al cargar las métricas de asistencia'
  } finally {
    loading.value = false
  }
}

const refreshMetrics = () => {
  loadMetrics()
}

// Watchers
watch(() => [props.studentId, props.dateRange], () => {
  if (props.studentId) {
    loadMetrics()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (props.studentId) {
    loadMetrics()
  }
})
</script>