<template>
  <div>
    <header class="flex flex-col md:flex-row justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
      <div>
        <h1 class="text-2xl font-bold dark:text-white">{{ title }}</h1>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2 mt-3 md:mt-0">
        <button
          @click="$emit('toggle-filters')"
          class="btn-secondary flex items-center gap-1"
        >
          <AdjustmentsHorizontalIcon class="h-5 w-5" />
          {{ filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros' }}
        </button>
        <button
          @click="$emit('export')"
          class="btn-secondary flex items-center gap-1"
        >
          <ArrowDownTrayIcon class="h-5 w-5" />
          Exportar datos
        </button>
      </div>
    </header>

    <div 
      v-show="filtersVisible" 
      class="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-all duration-300"
    >
      <div class="flex flex-wrap gap-4">
        <div class="w-full md:w-auto">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clase</label>
          <select 
            v-model="selectedClassLocal" 
            class="input w-full md:w-48" 
            @change="handleClassChange"
          >
            <option value="">Todas las clases</option>
            <option v-for="class_ in classes" :key="class_.id" :value="class_.id">
              {{ class_.name }}
            </option>
          </select>
        </div>
        <div class="w-full md:w-auto">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo</label>
          <select 
            v-model="selectedPeriodLocal" 
            class="input w-full md:w-48" 
            @change="handlePeriodChange"
          >
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
            <option value="year">Todo el año</option>
          </select>
        </div>
        <div class="w-full md:w-auto">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordenar por</label>
          <select 
            v-model="sortByLocal" 
            class="input w-full md:w-48" 
            @change="handleSortChange"
          >
            <option value="name">Nombre</option>
            <option value="score_desc">Calificación (mayor a menor)</option>
            <option value="score_asc">Calificación (menor a mayor)</option>
            <option value="date">Fecha</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { 
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/20/solid'

const props = defineProps({
  title: {
    type: String,
    default: 'Espacio de Trabajo'
  },
  subtitle: {
    type: String,
    default: 'Gestiona y evalúa el progreso académico de los estudiantes'
  },
  filtersVisible: {
    type: Boolean,
    default: false
  },
  classes: {
    type: Array,
    default: () => []
  },
  selectedClass: {
    type: String,
    default: ''
  },
  selectedPeriod: {
    type: String,
    default: 'month'
  },
  sortBy: {
    type: String,
    default: 'name'
  }
})

const emit = defineEmits(['toggle-filters', 'export', 'filter'])

// Local state that syncs with props
const selectedClassLocal = ref(props.selectedClass)
const selectedPeriodLocal = ref(props.selectedPeriod)
const sortByLocal = ref(props.sortBy)

// Watch for prop changes and update local state
watchEffect(() => {
  selectedClassLocal.value = props.selectedClass
  selectedPeriodLocal.value = props.selectedPeriod
  sortByLocal.value = props.sortBy
})

const handleClassChange = () => {
  emit('filter', { type: 'class', value: selectedClassLocal.value })
}

const handlePeriodChange = () => {
  emit('filter', { type: 'period', value: selectedPeriodLocal.value })
}

const handleSortChange = () => {
  emit('filter', { type: 'sort', value: sortByLocal.value })
}
</script>

<style scoped>
.btn-secondary {
  @apply px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900;
}

.input {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white;
}

.dark\:shadow-xl-dark {
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
}
</style>