<!-- src/modulos/attendance/components/AttendanceHeader.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import HeaderActions from './HeaderActions.vue'
import { useHeaderActions } from '../composables/useHeaderActions'


/** Props actualizados */
const props = defineProps<{
  selectedDate: string
  selectedClass: string
  role: 'admin' | 'director' | 'maestro'
}>()

/** Emitir eventos hacia la vista */
const emit = defineEmits<{
  (e: 'analytics'): void
  (e: 'report'): void
  (e: 'export'): void
  (e: 'emergency'): void
  (e: 'changeView', view: 'calendar' | 'class-select' | 'attendance-form'): void
}>()

/** Composable centralizado de acciones */
const { open, canExport, canCreateEmergency, userName } = useHeaderActions({
  role: props.role
})

/** Fecha formateada bonito */
const formattedDate = computed(() =>
  props.selectedDate
    ? format(parseISO(props.selectedDate), "d 'de' MMMM yyyy", { locale: es })
    : 'Sin fecha'
)
</script>

<template>
  <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-800 shadow rounded-lg p-4">
    <div class="space-y-1">
      <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400">
        {{ props.selectedClass || 'Seleccione clase' }}
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ formattedDate }}</p>
      <p class="text-xs text-gray-400 dark:text-gray-500">{{ userName }}</p>
    </div>

    <button
      class="btn btn-secondary w-full sm:w-auto mb-2 sm:mb-0"
      @click="emit('changeView', 'calendar')"
    >
      <i class="fa-solid fa-calendar-days mr-2" /> Calendario
    </button>

    <HeaderActions
      :role="props.role"
      @analytics="() => emit('analytics')"
      @report="() => emit('report')"
      @export="() => canExport && emit('export')"
      @emergency="() => canCreateEmergency && emit('emergency')"
      
    />
  </header>
</template>

<style scoped>
/* Usa utilidades de Tailwind o tu framework de estilos */
</style>
