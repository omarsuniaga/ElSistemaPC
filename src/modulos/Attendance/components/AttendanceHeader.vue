<!-- src/modulos/attendance/components/AttendanceHeader.vue -->
<script setup lang="ts">
import {
  ViewColumnsIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownOnSquareIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import ClassObservationBadge from './ClassObservationBadge.vue'

const props = defineProps<{
  className?: string;
  pendingChangesCount: number;
  isDisabled?: boolean;
  observations?: string;
  shouldAnimateObservationsButton?: boolean;
}>()

const emit = defineEmits<{
  (e: 'navigate-to-workspace'): void;
  (e: 'save'): void;
  (e: 'open-export'): void;
  (e: 'open-observation'): void;
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
    <div class="flex items-center space-x-2">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
        {{ props.className || 'Lista de asistencia' }}
      </h2>
      <ClassObservationBadge 
        :observations="props.observations"
        @click="emit('open-observation')"
        class="sm:text-base text-sm"
      />
    </div>
    
    <div class="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
      <!-- Workspace Button -->
      <button 
        @click="emit('navigate-to-workspace')"
        class="px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-initial justify-center"
      >
        <ViewColumnsIcon class="w-4 h-4" />
        <span class="hidden xs:inline">Area de Trabajo</span>
        <span class="xs:hidden">Área</span>
      </button>
      
      <!-- Save Button -->
      <button 
        @click="emit('save')"
        :disabled="props.isDisabled || props.pendingChangesCount === 0"
        :class="[
          'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-sm text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-initial justify-center', 
          props.pendingChangesCount > 0 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        ]"
      >
        <ArrowDownOnSquareIcon class="w-4 h-4" />
        <span class="hidden xs:inline">Guardar{{props.pendingChangesCount ? ` (${props.pendingChangesCount})` : ''}}</span>
        <span class="xs:hidden">Guardar</span>
      </button>
      
      <!-- Export Button -->
      <button 
        @click="emit('open-export')"
        class="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-initial justify-center"
      >
        <ArrowDownTrayIcon class="w-4 h-4" />
        <span class="hidden xs:inline">Exportar</span>
        <span class="xs:hidden">Exp</span>
      </button>
      
      <!-- Observations Button -->
      <button 
        @click="emit('open-observation')"
        :disabled="props.isDisabled"
        :class="[
          'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-sm text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-initial justify-center relative',
          props.isDisabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-amber-600 hover:bg-amber-700 text-white'
        ]"
      >
        <ChatBubbleLeftRightIcon class="w-4 h-4" />
        <span class="hidden xs:inline">Observaciones</span>
        <span class="xs:hidden">Obs</span>
        
        <!-- Animation indicator when observations are missing -->
        <span 
          v-if="props.shouldAnimateObservationsButton" 
          class="absolute -top-1 -left-1 flex h-3 w-3"
        >
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Usa utilidades de Tailwind o tu framework de estilos */
</style>
