<template>
  <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4">
      <!-- Título y navegación -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-4 md:space-y-0">
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Calendario de Asistencias
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ currentMonthYear }}
          </p>
        </div>
        
        <!-- Navegación del calendario -->
        <div class="flex items-center space-x-2">
          <div class="relative flex rounded-md shadow-sm">
            <button
              @click="$emit('previous-month')"
              class="px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :disabled="loading"
              :class="{ 'opacity-50 cursor-not-allowed': loading }"
              title="Mes anterior"
            >
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            
            <button
              @click="$emit('go-to-today')"
              class="px-4 py-2 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :disabled="loading"
              :class="{ 'opacity-50 cursor-not-allowed': loading }"
            >
              Hoy
            </button>
            
            <button
              @click="$emit('next-month')"
              class="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :disabled="loading"
              :class="{ 'opacity-50 cursor-not-allowed': loading }"
              title="Mes siguiente"
            >
              <ChevronRightIcon class="h-5 w-5" />
            </button>
          </div>
          
          <!-- Selector de vista -->
          <div class="relative">
            <select
              v-model="currentView"
              class="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              :disabled="loading"
              @change="$emit('view-changed', currentView)"
            >
              <option value="month">Mes</option>
              <option value="week">Semana</option>
              <option value="day">Día</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <SelectorIcon class="h-4 w-4" />
            </div>
          </div>
          
          <!-- Botón de actualizar -->
          <button
            @click="$emit('refresh')"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            :class="{ 'animate-spin': loading }"
            :disabled="loading"
            title="Actualizar"
          >
            <RefreshIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Filtros y acciones -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
        <div class="flex items-center space-x-2 mb-3 sm:mb-0">
          <!-- Filtro por profesor -->
          <div class="relative">
            <select
              v-model="selectedTeacher"
              class="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-48"
              :disabled="loading"
              @change="$emit('teacher-changed', selectedTeacher)"
            >
              <option value="">Todos los profesores</option>
              <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                {{ teacher.name }}
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <UserGroupIcon class="h-4 w-4" />
            </div>
          </div>
          
          <!-- Filtro por estado -->
          <div class="relative">
            <select
              v-model="selectedStatus"
              class="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-40"
              :disabled="loading"
              @change="$emit('status-changed', selectedStatus)"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
              <option value="missed">Perdidas</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <FilterIcon class="h-4 w-4" />
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- Botón de exportar -->
          <button
            @click="$emit('export')"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            :disabled="loading"
            :class="{ 'opacity-50 cursor-not-allowed': loading }"
          >
            <DocumentDownloadIcon class="h-4 w-4 mr-2" />
            Exportar
          </button>
          
          <!-- Botón de nueva clase -->
          <button
            @click="$emit('new-class')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            :disabled="loading"
            :class="{ 'opacity-50 cursor-not-allowed': loading }"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Nueva clase
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  RefreshIcon,
  PlusIcon,
  DocumentDownloadIcon,
  UserGroupIcon,
  FilterIcon,
  SelectorIcon
} from '@heroicons/vue/outline'

interface Teacher {
  id: string
  name: string
}

interface Props {
  currentMonthYear: string
  loading?: boolean
  view?: 'month' | 'week' | 'day'
  teachers?: Teacher[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  view: 'month',
  teachers: () => []
})

const emit = defineEmits<{
  (e: 'previous-month'): void
  (e: 'next-month'): void
  (e: 'go-to-today'): void
  (e: 'refresh'): void
  (e: 'export'): void
  (e: 'new-class'): void
  (e: 'view-changed', view: string): void
  (e: 'teacher-changed', teacherId: string): void
  (e: 'status-changed', status: string): void
}>()

// Estado local
const currentView = ref(props.view)
const selectedTeacher = ref('')
const selectedStatus = ref('')

// Watchers
watch(() => props.view, (newView) => {
  currentView.value = newView
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
