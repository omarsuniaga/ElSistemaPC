<template>
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div class="flex items-center gap-4">
      <button 
        v-if="view !== 'calendar'"
        @click="$emit('change-view', 'calendar')"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Volver al calendario"
      >
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Asistencias</h1>
        <p v-if="selectedDate || selectedClass" class="text-sm text-gray-600 dark:text-gray-400">
          {{ selectedDate ? formatDate(selectedDate) : '' }}
          {{ selectedClass ? `- ${selectedClass}` : '' }}
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      <button 
        @click="$emit('toggle-analytics')"
        :class="[
          'btn flex items-center gap-2 transition-colors',
          showAnalytics 
            ? 'bg-blue-700 text-white hover:bg-blue-800' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        ]"
      >
        <ChartBarIcon class="w-5 h-5" />
        {{ showAnalytics ? 'Ocultar Análisis' : 'Ver Análisis' }}
      </button>

      <button 
        @click="$emit('open-report-modal')"
        class="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 transition-colors"
      >
        <DocumentTextIcon class="w-5 h-5" />
        Informes
      </button>

      <button 
        @click="$emit('open-export-modal')"
        class="btn bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-2 transition-colors"
      >
        <ArrowDownTrayIcon class="w-5 h-5" />
        Exportar
      </button>

      <button 
        @click="$emit('create-new-attendance')"
        class="btn btn-primary flex items-center gap-2 transition-colors"
      >
        <PlusCircleIcon class="w-5 h-5" />
        Nueva Asistencia
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PlusCircleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  selectedDate?: string
  selectedClass?: string
  view: 'calendar' | 'class-select' | 'attendance-form'
  showAnalytics: boolean
}>()

const emit = defineEmits<{
  (e: 'change-view', view: 'calendar' | 'class-select' | 'attendance-form'): void
  (e: 'toggle-analytics'): void
  (e: 'open-report-modal'): void
  (e: 'open-export-modal'): void
  (e: 'create-new-attendance'): void
}>()

const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'PPP', { locale: es })
  } catch {
    return date
  }
}
</script>
