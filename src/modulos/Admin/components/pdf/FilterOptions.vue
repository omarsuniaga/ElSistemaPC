<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Filtros de Datos
      </h3>
      <button
        @click="resetFilters"
        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
      >
        Limpiar filtros
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Filtro por Clase -->
      <div v-if="showClassFilter" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Clase
        </label>
        <select
          :value="filters.classId"
          @change="$emit('update:classId', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todas las clases</option>
          <option
            v-for="classItem in availableClasses"
            :key="classItem.id"
            :value="classItem.id"
          >
            {{ classItem.name }}
          </option>
        </select>
      </div>

      <!-- Filtro por Maestro -->
      <div v-if="showTeacherFilter" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Maestro
        </label>
        <select
          :value="filters.teacherId"
          @change="$emit('update:teacherId', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todos los maestros</option>
          <option
            v-for="teacher in availableTeachers"
            :key="teacher.id"
            :value="teacher.id"
          >
            {{ teacher.name }}
          </option>
        </select>
      </div>

      <!-- Filtro por Instrumento -->
      <div v-if="showInstrumentFilter" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Instrumento
        </label>
        <select
          :value="filters.instrumentId"
          @change="$emit('update:instrumentId', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todos los instrumentos</option>
          <option
            v-for="instrument in availableInstruments"
            :key="instrument.id"
            :value="instrument.id"
          >
            {{ instrument.name }}
          </option>
        </select>
      </div>

      <!-- Filtro por Rango de Edad -->
      <div v-if="showAgeFilter" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rango de Edad
        </label>
        <div class="flex space-x-2">
          <input
            :value="filters.ageRange.min"
            @change="$emit('update:ageRange', { ...filters.ageRange, min: parseInt($event.target.value) || 0 })"
            type="number"
            min="0"
            max="100"
            placeholder="Mín"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span class="flex items-center text-gray-500">-</span>
          <input
            :value="filters.ageRange.max"
            @change="$emit('update:ageRange', { ...filters.ageRange, max: parseInt($event.target.value) || 100 })"
            type="number"
            min="0"
            max="100"
            placeholder="Máx"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <!-- Filtro por Fecha de Inscripción -->
      <div v-if="showEnrollmentFilter" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Fecha de Inscripción
        </label>
        <div class="space-y-2">
          <input
            :value="filters.enrollmentDate.start"
            @change="$emit('update:enrollmentDate', { ...filters.enrollmentDate, start: $event.target.value })"
            type="date"
            placeholder="Desde"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <input
            :value="filters.enrollmentDate.end"
            @change="$emit('update:enrollmentDate', { ...filters.enrollmentDate, end: $event.target.value })"
            type="date"
            placeholder="Hasta"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <!-- Filtro por Estado -->
      <div v-if="showStatusFilter" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Estado
        </label>
        <select
          :value="filters.status"
          @change="$emit('update:status', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>
    </div>

    <!-- Resumen de filtros aplicados -->
    <div
      v-if="filterSummary.length > 0"
      class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center space-x-2 mb-3">
        <FunnelIcon class="w-4 h-4 text-gray-500" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filtros aplicados:
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="filter in filterSummary"
          :key="filter"
          class="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full"
        >
          {{ filter }}
        </span>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div
      v-if="classStats"
      class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ classStats.total }}
        </div>
        <div class="text-xs text-blue-700 dark:text-blue-300">Total</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ classStats.active }}
        </div>
        <div class="text-xs text-green-700 dark:text-green-300">Activos</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-red-600 dark:text-red-400">
          {{ classStats.inactive }}
        </div>
        <div class="text-xs text-red-700 dark:text-red-300">Inactivos</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {{ classStats.pending }}
        </div>
        <div class="text-xs text-yellow-700 dark:text-yellow-300">Pendientes</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FunnelIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  selectedReportType: string
  filters: {
    classId: string
    teacherId: string
    instrumentId: string
    ageRange: { min: number; max: number }
    enrollmentDate: { start: string; end: string }
    status: string
  }
  availableClasses: any[]
  availableTeachers: any[]
  availableInstruments: any[]
  filterSummary: string[]
  classStats: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:classId': [value: string]
  'update:teacherId': [value: string]
  'update:instrumentId': [value: string]
  'update:ageRange': [value: { min: number; max: number }]
  'update:enrollmentDate': [value: { start: string; end: string }]
  'update:status': [value: string]
}>()

// Computed
const showClassFilter = computed(() => {
  return ['students', 'classes', 'attendance'].includes(props.selectedReportType)
})

const showTeacherFilter = computed(() => {
  return ['students', 'classes', 'attendance'].includes(props.selectedReportType)
})

const showInstrumentFilter = computed(() => {
  return ['students', 'classes', 'teachers'].includes(props.selectedReportType)
})

const showAgeFilter = computed(() => {
  return ['students'].includes(props.selectedReportType)
})

const showEnrollmentFilter = computed(() => {
  return ['students'].includes(props.selectedReportType)
})

const showStatusFilter = computed(() => {
  return ['students', 'teachers', 'classes'].includes(props.selectedReportType)
})

// Funciones
const resetFilters = () => {
  emit('update:classId', '')
  emit('update:teacherId', '')
  emit('update:instrumentId', '')
  emit('update:ageRange', { min: 0, max: 100 })
  emit('update:enrollmentDate', { start: '', end: '' })
  emit('update:status', 'all')
}
</script> 