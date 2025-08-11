<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <!-- Información del día seleccionado -->
    <div v-if="selectedDate" class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {{ formattedSelectedDate }}
      </h3>
      
      <!-- Estadísticas del día -->
      <div class="space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Clases programadas:</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ dayStats.totalClasses }}</span>
        </div>
        
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Asistencias completas:</span>
          <span class="font-medium text-green-600 dark:text-green-400">{{ dayStats.completedAttendances }}</span>
        </div>
        
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Pendientes:</span>
          <span class="font-medium text-yellow-600 dark:text-yellow-400">{{ dayStats.pendingAttendances }}</span>
        </div>
      </div>
    </div>

    <!-- Resumen del mes -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">
        Resumen del Mes
      </h4>
      
      <div class="space-y-4">
        <!-- Gráfico de progreso -->
        <div>
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-600 dark:text-gray-400">Progreso general</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ Math.round(monthStats.completionPercentage) }}%
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${monthStats.completionPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Estadísticas detalladas -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ monthStats.totalCompleted }}
            </div>
            <div class="text-gray-600 dark:text-gray-400">Completas</div>
          </div>
          
          <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {{ monthStats.totalPending }}
            </div>
            <div class="text-gray-600 dark:text-gray-400">Pendientes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones rápidas -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
      <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">
        Acciones Rápidas
      </h4>
      
      <div class="space-y-3">
        <button
          @click="$emit('create-emergency-class')"
          class="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
        >
          Crear Clase Emergente
        </button>
        
        <button
          @click="$emit('view-reports')"
          class="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          Ver Reportes
        </button>
        
        <button
          @click="$emit('export-month')"
          class="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          Exportar Mes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DayStats {
  totalClasses: number
  completedAttendances: number
  pendingAttendances: number
}

interface MonthStats {
  totalCompleted: number
  totalPending: number
  completionPercentage: number
}

interface Props {
  selectedDate: Date | null
  dayStats: DayStats
  monthStats: MonthStats
}

const props = defineProps<Props>()

defineEmits<{
  'create-emergency-class': []
  'view-reports': []
  'export-month': []
}>()

const formattedSelectedDate = computed(() => {
  if (!props.selectedDate) return ''
  
  return format(props.selectedDate, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })
    .replace(/^\w/, (c) => c.toUpperCase())
})
</script>
