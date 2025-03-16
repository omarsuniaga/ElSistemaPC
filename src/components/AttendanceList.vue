<template>
  <div class="space-y-4">
    <div class="flex justify-end gap-1 sm:gap-2 mt-4">
      <button 
        @click="$router.push('/workspace')"
        class="btn btn-primary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
      >
        <ViewColumnsIcon class="w-5 h-5" />
        Area de Trabajo
      </button>
      <button class="btn btn-primary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" @click="emit('update-status', 'all', 'save')">
        <ArrowDownOnSquareIcon class="w-3 h-3 sm:w-4 sm:h-4" />
        <span class="hidden xs:inline">Guardar</span>
        <span class="xs:hidden">G</span>
      </button>
      <button class="btn btn-secondary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" @click="emit('open-export')">
        <ArrowDownTrayIcon class="w-3 h-3 sm:w-4 sm:h-4" />
        <span class="hidden xs:inline">Exportar</span>
        <span class="xs:hidden">E</span>
      </button>
      <button class="btn btn-info btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" @click="emit('open-observation', null)">
        <ChatBubbleLeftRightIcon class="w-3 h-3 sm:w-4 sm:h-4" />
        <span class="hidden xs:inline">Observaciones</span>
        <span class="xs:hidden">O</span>
      </button>
    </div>
    <div class="w-full overflow-x-auto rounded-lg">
      <table class="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/2 sm:w-auto">
              Estudiante
            </th>
            <th class="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4 sm:w-auto">
              Estado
            </th>
            <th class="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4 sm:w-auto">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="px-1 sm:px-4 py-2 sm:py-3">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-7 w-7 sm:h-10 sm:w-10">
                  <div :class="[
                    'w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm', 
                    getAvatarColor(student.nombre)
                  ]">
                    {{ getInitials(student.nombre, student.apellido) }}
                  </div>
                </div>
                <div class="ml-2 sm:ml-4 ">
                  <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ student.nombre }}
                  </div>
                  <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ student.apellido }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-1 sm:px-4 py-2 sm:py-3">
              <div class="flex items-center">
                <span :class="[
                  'px-1 sm:px-2 py-1 text-xs rounded-full flex items-center gap-1 max-w-[120px] sm:max-w-full',
                  getStatusClass(attendanceRecords[student.id] || 'Ausente')
                ]">
                  <span v-if="(attendanceRecords[student.id] || 'Ausente') === 'Presente'" class="inline-block flex-shrink-0">
                    <CheckCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                  <span v-else-if="(attendanceRecords[student.id] || 'Ausente') === 'Ausente'" class="inline-block flex-shrink-0">
                    <XCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                  <span v-else-if="(attendanceRecords[student.id] || 'Ausente') === 'Tardanza'" class="inline-block flex-shrink-0">
                    <ClockIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                  <span v-else-if="(attendanceRecords[student.id] || 'Ausente') === 'Justificado'" class="inline-block flex-shrink-0">
                    <DocumentCheckIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                  <span class="ml-1 text-xs truncate">{{ attendanceRecords[student.id] || 'Ausente' }}</span>
                </span>
              </div>
            </td>
            <td class="px-1 sm:px-4 py-2 sm:py-3 text-sm font-medium">
              <div class="flex no-wrap gap-2">
                <button 
                  @click="emit('update-status', student.id, 'Presente')"
                  :class="[
                    'btn btn-icon btn-sm sm:btn-sm',
                    (attendanceRecords[student.id] || 'Ausente') === 'Presente' ? 'btn-success-active' : 'btn-success'
                  ]"
                  title="Presente"
                >
                  <CheckCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button 
                  @click="emit('update-status', student.id, 'Ausente')"
                  :class="[
                    'btn btn-icon btn-sm sm:btn-sm',
                    (attendanceRecords[student.id] || 'Ausente') === 'Ausente' ? 'btn-danger-active' : 'btn-danger'
                  ]"
                  title="Ausente"
                >
                  <XCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button 
                  @click="emit('update-status', student.id, 'Tardanza')"
                  :class="[
                    'btn btn-icon btn-sm sm:btn-sm',
                    (attendanceRecords[student.id] || 'Ausente') === 'Tardanza' ? 'btn-warning-active' : 'btn-warning'
                  ]"
                  title="Tardanza"
                >
                  <ClockIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  @click="emit('open-justification', student)"
                  :class="[
                    'btn btn-icon btn-sm sm:btn-sm',
                    (attendanceRecords[student.id] || 'Ausente') === 'Justificado' ? 'btn-info-active' : 'btn-info'
                  ]"
                  title="Justificacion"
                >
                  <ChatBubbleLeftRightIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Student, AttendanceStatus } from '../types'
import {
  CheckCircleIcon,
  XCircleIcon,
  ViewColumnsIcon,
  ClockIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownOnSquareIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import './AttendanceList.css'

defineProps<{
  students: Student[];
  attendanceRecords: Record<string, string>;
}>()

const emit = defineEmits<{
  (e: 'update-status', studentId: string, status: AttendanceStatus | 'save'): void;
  (e: 'open-observation', student: Student | null): void;
  (e: 'open-justification', student: Student): void;
  (e: 'open-export'): void;
}>()

// Funciones de utilidad
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
  ]
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  return colors[hash % colors.length]
}

const getStatusClass = (status: string) => {
  const classes = {
    'Presente': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    'Ausente': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    'Tardanza': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    'Justificado': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
}
</script>

<style>
/* Add a custom breakpoint for extra small screens */
@media (min-width: 480px) {
  .xs\:inline {
    display: inline;
  }
  .xs\:hidden {
    display: none;
  }
}

/* Make buttons smaller on mobile */
.btn-xs {
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* Add overflow handling for tables */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

/* Ensure table doesn't overflow on small screens */
@media (max-width: 640px) {
  .min-w-full {
    min-width: 100%;
  }
}
</style>
