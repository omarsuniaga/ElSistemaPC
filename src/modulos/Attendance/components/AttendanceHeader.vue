<!-- src/modulos/attendance/components/AttendanceHeader.vue -->
<script setup lang="ts">
import {
  ViewColumnsIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownOnSquareIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'
import ClassObservationBadge from './ClassObservationBadge.vue'
import { computed } from 'vue'
import { useRBACStore } from '@/stores/rbacStore'

const rbacStore = useRBACStore();

const props = defineProps<{
  className?: string;
  pendingChangesCount?: number;
  isDisabled?: boolean;
  observations?: string;
  shouldAnimateObservationsButton?: boolean;
  hasObservations?: boolean;
  observationButtonText?: string;
}>()

const emit = defineEmits<{
  (e: 'navigate-to-workspace'): void;
  (e: 'save'): void;
  (e: 'open-export'): void;
  (e: 'open-observation'): void;
  (e: 'click'): void;
}>()

// RBAC computed properties
const canEditAttendance = computed(() => {
  return rbacStore.hasPermission('attendance_edit') || rbacStore.hasRole('Maestro');
});

const canExportAttendance = computed(() => {
  return rbacStore.hasPermission('attendance_export') || rbacStore.hasRole('Maestro');
});

const canManageObservations = computed(() => {
  return rbacStore.hasPermission('attendance_observe') || rbacStore.hasRole('Maestro');
});

// Computed property to determine button text based on whether observations exist
const observationButtonText = computed(() => {
  return props.hasObservations ? 'Consultar' : 'Agregar';
})

// Computed property for the button tooltip
const observationTooltip = computed(() => {
  return props.hasObservations 
    ? 'Consultar observaciones existentes' 
    : 'Agregar una nueva observación';
})
</script>

<template>
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
    
      <div class="flex items-center space-x-2">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          <!-- Mostrar el nombre y dia de la clase como titulo -->
          {{ props.className }}          
        </h2>
        
      </div>
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
        v-if="canEditAttendance"
        @click="emit('save')"
        :disabled="props.isDisabled || (props.pendingChangesCount || 0) === 0"
        :class="[
          'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-sm text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-initial justify-center', 
          (props.pendingChangesCount || 0) > 0 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        ]"
      >
        <ArrowDownOnSquareIcon class="w-4 h-4" />
        <span class="hidden xs:inline">Guardar{{ (props.pendingChangesCount || 0) > 0 ? ` (${props.pendingChangesCount})` : ''}}</span>
        <span class="xs:hidden">Guardar</span>
      </button>
      
      <!-- Export Button -->
      <button 
        v-if="canExportAttendance"
        @click="emit('open-export')"
        class="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-initial justify-center"
      >
        <ArrowDownTrayIcon class="w-4 h-4" />
        <span class="hidden xs:inline">Exportar</span>
        <span class="xs:hidden">Export</span>
      </button>
      
      <!-- Observations Button - Changes based on whether observations exist -->
      <button 
        v-if="canManageObservations"
        @click="emit('open-observation')"
        :disabled="props.isDisabled"
        :title="observationTooltip"
        :class="[
          'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-sm text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-initial justify-center relative',
          props.isDisabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : props.hasObservations
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
        ]"
      >
        <!-- Icon changes based on whether observations exist -->
        <template v-if="props.hasObservations">
          <ChatBubbleLeftRightIcon class="w-4 h-4" />
        </template>
        <template v-else>
          <PlusCircleIcon class="w-4 h-4" />
        </template>
        
        <!-- Text changes based on whether observations exist -->
        <span class="hidden xs:inline">
          {{ props.hasObservations ? 'Consultar ' : 'Agregar ' }}
        </span>
        <span class="xs:hidden">
          {{ props.hasObservations ? 'Ver' : 'Agregar' }}
        </span>
        
        <!-- Animation indicator when observations are missing -->
        <span 
          v-if="!props.hasObservations"
          class="absolute -bottom-1 -left-1 flex h-3 w-3 "
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
