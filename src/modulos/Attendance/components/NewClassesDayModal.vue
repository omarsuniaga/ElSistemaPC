<!--
  📋 MODAL DE CLASES DEL DÍA - COMPONENTE LIMPIO
  Arquitectura: Presentational Component con responsabilidad única
-->
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Overlay -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="handleClose"
    />
    
    <!-- Modal Container -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div 
        class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Clases del {{ formattedDate }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ stats.total }} clases encontradas • {{ stats.pending }} pendientes
              </p>
            </div>
            
            <!-- Close Button -->
            <button
              class="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="handleClose"
              aria-label="Cerrar modal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-4 max-h-96 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            <span class="ml-3 text-gray-600 dark:text-gray-400">Cargando clases...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="classes.length === 0" class="text-center py-8">
            <div class="text-gray-400 text-6xl mb-4">📅</div>
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay clases programadas
            </h4>
            <p class="text-gray-500 dark:text-gray-400">
              No tienes clases programadas para este día.
            </p>
          </div>

          <!-- Classes List -->
          <div v-else class="space-y-4">
            <ClassCard
              v-for="classItem in classes"
              :key="classItem.id"
              :class-item="classItem"
              @take-attendance="handleTakeAttendance"
              @view-attendance="handleViewAttendance"
              @edit-class="handleEditClass"
            />
          </div>
        </div>

        <!-- Footer -->
        <div v-if="!loading && classes.length > 0" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div class="flex items-center justify-between">
            <!-- Stats -->
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <span class="inline-flex items-center">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {{ stats.withAttendance }} con asistencia
              </span>
              <span class="inline-flex items-center ml-4">
                <div class="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                {{ stats.pending }} pendientes
              </span>
            </div>

            <!-- Actions -->
            <div class="flex space-x-2">
              <button
                class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                @click="handleRefresh"
              >
                Actualizar
              </button>
              <button
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                :disabled="stats.pending === 0"
                @click="handleTakeAllAttendance"
              >
                Tomar Asistencia Pendientes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarService } from '../services/CalendarService'
import ClassCard from './ClassCard.vue'
import type { DayClassItem } from '../types/calendar.types'

// Props
interface Props {
  isOpen: boolean
  date: string
  classes: DayClassItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  'close': []
  'take-attendance': [classId: string]
  'view-attendance': [classId: string] 
  'edit-class': [classId: string]
  'refresh': []
  'take-all-attendance': []
}>()

// Computed
const formattedDate = computed(() => {
  if (!props.date) return ''
  return CalendarService.formatDate(props.date, 'EEEE, d \'de\' MMMM \'de\' yyyy')
})

const stats = computed(() => {
  const total = props.classes.length
  const withAttendance = props.classes.filter(cls => cls.hasAttendanceRecord).length
  const pending = total - withAttendance

  return { total, withAttendance, pending }
})

// Methods
const handleClose = () => {
  emit('close')
}

const handleTakeAttendance = (classId: string) => {
  emit('take-attendance', classId)
}

const handleViewAttendance = (classId: string) => {
  emit('view-attendance', classId)
}

const handleEditClass = (classId: string) => {
  emit('edit-class', classId)
}

const handleRefresh = () => {
  emit('refresh')
}

const handleTakeAllAttendance = () => {
  emit('take-all-attendance')
}
</script>

<style scoped>
/* Animaciones suaves para el modal */
.fixed {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Scroll personalizado */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.5);
}
</style>
