<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl">
              <AcademicCapIcon class="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Gestión Avanzada de Maestros
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                Sistema integral de análisis y gestión de profesores
              </p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <button
              @click="exportData"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <ArrowDownTrayIcon class="w-5 h-5" />
              <span>Exportar</span>
            </button>
            <button
              @click="refreshData"
              :disabled="loading"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': loading }" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto p-6">
      <!-- Metrics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Maestros</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ metrics?.totalTeachers || 0 }}
              </p>
            </div>
            <div class="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <UsersIcon class="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Maestros Activos</p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">
                {{ metrics?.activeTeachers || 0 }}
              </p>
            </div>
            <div class="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircleIcon class="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Evaluación Promedio</p>
              <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {{ metrics?.averageRating ? metrics.averageRating.toFixed(1) : '0.0' }}
              </p>
            </div>
            <div class="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
              <StarIcon class="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Nómina Mensual</p>
              <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">
                ${{ metrics?.payrollAmount?.toLocaleString() || '0' }}
              </p>
            </div>
            <div class="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
              <CurrencyDollarIcon class="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Stats -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución por Desempeño
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-green-600 dark:text-green-400">Excelente</span>
              <span class="font-bold">{{ performanceStats.excellent }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-blue-600 dark:text-blue-400">Bueno</span>
              <span class="font-bold">{{ performanceStats.good }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-yellow-600 dark:text-yellow-400">Promedio</span>
              <span class="font-bold">{{ performanceStats.average }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-red-600 dark:text-red-400">Necesita Mejora</span>
              <span class="font-bold">{{ performanceStats.needsImprovement }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Maestros Destacados
          </h3>
          <div class="space-y-3">
            <div v-if="topPerformingTeachers.length === 0" class="text-gray-500 dark:text-gray-400">
              No hay datos disponibles
            </div>
            <div 
              v-for="(teacher, index) in topPerformingTeachers.slice(0, 5)" 
              :key="teacher.teacherId"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <span class="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-sm font-medium">
                  #{{ index + 1 }}
                </span>
                <span class="font-medium text-gray-900 dark:text-white">{{ teacher.teacherName }}</span>
              </div>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ teacher.evaluationScore.toFixed(1) }} ⭐
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <input
              v-model="filters.searchTerm"
              type="text"
              placeholder="Nombre del maestro..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nivel de Desempeño
            </label>
            <select
              v-model="filters.performanceLevel"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="excellent">Excelente</option>
              <option value="good">Bueno</option>
              <option value="average">Promedio</option>
              <option value="needs_improvement">Necesita Mejora</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horas Mínimas
            </label>
            <input
              v-model.number="filters.hoursRange.min"
              type="number"
              min="0"
              max="50"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Teachers Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Lista de Maestros ({{ filteredTeachers.length }})
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Maestro
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estudiantes
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Asistencia
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Evaluación
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Horas/Semana
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Desempeño
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="loading" class="animate-pulse">
                <td colspan="7" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Cargando maestros...
                </td>
              </tr>
              <tr v-else-if="filteredTeachers.length === 0">
                <td colspan="7" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron maestros con los filtros aplicados
                </td>
              </tr>
              <tr v-else v-for="teacher in filteredTeachers" :key="teacher.teacherId" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center">
                        <span class="text-white font-medium text-sm">
                          {{ teacher.teacherName.split(' ').map(n => n[0]).join('') }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ teacher.teacherName }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        ID: {{ teacher.teacherId }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ teacher.studentsManaged }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="text-sm text-gray-900 dark:text-white">
                      {{ (teacher.averageAttendance * 100).toFixed(1) }}%
                    </div>
                    <div class="ml-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        class="h-2 rounded-full"
                        :class="{
                          'bg-green-500': teacher.averageAttendance > 0.8,
                          'bg-yellow-500': teacher.averageAttendance > 0.6,
                          'bg-red-500': teacher.averageAttendance <= 0.6
                        }"
                        :style="{ width: `${teacher.averageAttendance * 100}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ teacher.evaluationScore.toFixed(1) }} ⭐
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ teacher.hoursPerWeek }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200': teacher.performanceLevel === 'excellent',
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200': teacher.performanceLevel === 'good',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200': teacher.performanceLevel === 'average',
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200': teacher.performanceLevel === 'needs_improvement'
                    }"
                  >
                    {{ 
                      teacher.performanceLevel === 'excellent' ? 'Excelente' :
                      teacher.performanceLevel === 'good' ? 'Bueno' :
                      teacher.performanceLevel === 'average' ? 'Promedio' :
                      'Necesita Mejora'
                    }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="showTeacherDetails(teacher)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    Ver Detalles
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Teacher Details Modal -->
    <div v-if="selectedTeacher" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            Detalles del Maestro: {{ selectedTeacher.teacherName }}
          </h3>
          <button
            @click="selectedTeacher = null"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Métricas de Desempeño</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Estudiantes:</span>
                <span class="font-medium">{{ selectedTeacher.studentsManaged }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Asistencia Promedio:</span>
                <span class="font-medium">{{ (selectedTeacher.averageAttendance * 100).toFixed(1) }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Retención de Estudiantes:</span>
                <span class="font-medium">{{ (selectedTeacher.studentRetention * 100).toFixed(1) }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Evaluación:</span>
                <span class="font-medium">{{ selectedTeacher.evaluationScore.toFixed(1) }} ⭐</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Recomendaciones</h4>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li v-for="recommendation in selectedTeacher.recommendations" :key="recommendation" class="flex items-start">
                <span class="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {{ recommendation }}
              </li>
            </ul>
          </div>
          
          <div class="md:col-span-2">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Acciones Sugeridas</h4>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li v-for="action in selectedTeacher.actionItems" :key="action" class="flex items-start">
                <span class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {{ action }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEnhancedTeachersStore } from '../store/enhancedTeachers'
import type { TeacherPerformanceAnalysis } from '../services/advancedTeachersService'
import {
  AcademicCapIcon,
  UsersIcon,
  CheckCircleIcon,
  StarIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import * as XLSX from 'xlsx'

const store = useEnhancedTeachersStore()

// State
const selectedTeacher = ref<TeacherPerformanceAnalysis | null>(null)

// Computed
const loading = computed(() => store.loading)
const metrics = computed(() => store.metrics)
const filteredTeachers = computed(() => store.filteredTeachers)
const performanceStats = computed(() => store.performanceStats)
const topPerformingTeachers = computed(() => store.topPerformingTeachers)
const filters = computed(() => store.filters)

// Methods
const refreshData = async () => {
  await store.fetchAllData()
}

const exportData = () => {
  const data = store.exportTeachersData()
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Maestros')
  XLSX.writeFile(wb, `maestros_${new Date().toISOString().split('T')[0]}.xlsx`)
}

const showTeacherDetails = (teacher: TeacherPerformanceAnalysis) => {
  selectedTeacher.value = teacher
}

const clearFilters = () => {
  store.clearFilters()
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>
