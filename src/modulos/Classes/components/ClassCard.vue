<script setup lang="ts">
import { computed } from 'vue'
import { useTeachersStore } from '../store/teachers'
import type { Class } from '../types/class'
import {
  UserIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  classData: Class;
  studentCount: number;
  topStudents: Array<{id: string, nombre: string, apellido: string}>;
}>()

const emit = defineEmits<{
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
  (e: 'manage-students', id: string): void;
}>()

const teachersStore = useTeachersStore()

// Computed properties
const selectedGroupTeacher = computed(() => {
  return teachersStore.teachers.find((t) => t.id === props.classData.teacherId)
})

// Helper Functions
const getTeacherName = (teacherId: string): string => {
  const teacher = teachersStore.teachers.find((t) => t.id === teacherId) as unknown as { id: string, name: string }
  return teacher ? `${teacher.name}` : 'Profesor no asignado'
}

const formatSchedule = (schedule: string | { days: string[], startTime?: string, endTime?: string }): string => {
  if (typeof schedule === 'string') {
    return schedule;
  }
  
  if (!schedule?.days?.length || !schedule.startTime || !schedule.endTime) {
    return 'Horario no definido'
  }
  return `${schedule.days.join(', ')} de ${schedule.startTime} a ${schedule.endTime}`
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
    <div class="p-5">
      <!-- Cabecera del grupo -->
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ classData.name }}</h3>
        <div class="flex space-x-2">
          <button
            @click="emit('edit', classData.id)"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            title="Editar grupo"
          >
            <PencilIcon class="w-5 h-5" />
          </button>
          <button
            @click="emit('delete', classData.id)"
            class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
            title="Eliminar grupo"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <!-- Detalles del grupo -->
      <div class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <div class="flex items-center">
          <UserIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>{{ getTeacherName(classData.teacherId) }}</span>
        </div>
        <div class="flex items-center">
          <AcademicCapIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>{{ classData.level }}</span>
        </div>
        <div class="flex items-center">
          <MusicalNoteIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>{{ classData.instrument }}</span>
        </div>
        
        <!-- Lista de estudiantes -->
        <div>
          <div class="flex items-center mb-2">
            <UserGroupIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span>{{ studentCount }}</span>
          </div>
          
          <div v-if="topStudents.length > 0" class="flex flex-wrap gap-1 mt-1 mb-2">
            <div 
              v-for="student in topStudents" 
              :key="student.id"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs"
            >
              {{ student.nombre }} {{ student.apellido }}
            </div>
            <div 
              v-if="studentCount > topStudents.length"
              class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs"
            >
              +{{ studentCount - topStudents.length }} más
            </div>
          </div>
        </div>
        
        <div class="flex items-center">
          <ClockIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>{{ formatSchedule(classData.schedule) }}</span>
        </div>
      </div>
      
      <!-- Botón de gestión de estudiantes -->
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="emit('manage-students', classData.id)"
          class="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <UserGroupIcon class="w-4 h-4" />
          Gestionar Estudiantes
        </button>
      </div>
    </div>
  </div>
</template>