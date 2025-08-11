<template>
  <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4">
      <!-- Título y navegación -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Calendario de Asistencias
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona las asistencias de tus clases
          </p>
        </div>
        
        <!-- Navegación del calendario -->
        <div class="flex items-center space-x-4">
          <button
            @click="$emit('previous-month')"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Mes anterior"
          >
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          
          <div class="text-center min-w-[200px]">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ currentMonthYear }}
            </h2>
          </div>
          
          <button
            @click="$emit('next-month')"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Mes siguiente"
          >
            <ChevronRightIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Filtros y acciones -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- Botón Hoy -->
          <button
            @click="$emit('go-to-today')"
            class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Hoy
          </button>
          
          <!-- Selector de vista -->
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Vista:
            </label>
            <select
              :value="currentView"
              @change="$emit('change-view', $event.target.value)"
              class="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="month">Mes</option>
              <option value="week">Semana</option>
            </select>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex items-center space-x-3">
          <!-- Leyenda -->
          <div class="flex items-center space-x-4 text-xs">
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span class="text-gray-600 dark:text-gray-400">Completas</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span class="text-gray-600 dark:text-gray-400">Pendientes</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span class="text-gray-600 dark:text-gray-400">Sin registrar</span>
            </div>
          </div>

          <!-- Botón de exportar -->
          <button
            @click="$emit('export-calendar')"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

interface Props {
  currentMonthYear: string
  currentView: 'month' | 'week'
}

defineProps<Props>()

defineEmits<{
  'previous-month': []
  'next-month': []
  'go-to-today': []
  'change-view': [view: string]
  'export-calendar': []
}>()
</script>
