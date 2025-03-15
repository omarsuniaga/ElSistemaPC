<script setup lang="ts">
import { ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { UserGroupIcon } from '@heroicons/vue/24/outline'
import type { Student } from '../types'

const props = defineProps<{
  groupName: string;
  students: Student[];
  isLoading: boolean;
}>()

const emit = defineEmits<{
  (e: 'remove-student', studentId: string): void;
  (e: 'add-student'): void;
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- Cabecera del grupo -->
    <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-lg mb-4">
      <h3 class="font-medium">{{ groupName }}</h3>
      <p class="text-sm">Gestión de estudiantes</p>
    </div>
    
    <!-- Lista de estudiantes -->
    <div v-if="students.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <UserGroupIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
      <p>No hay estudiantes en este grupo</p>
    </div>
    
    <div v-else class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
      <div
        v-for="student in students"
        :key="student.id"
        class="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-800 dark:text-blue-200">
            {{ student.nombre.charAt(0) }}{{ student.apellido.charAt(0) }}
          </div>
          <div>
            <p class="font-medium text-gray-800 dark:text-gray-200">
              {{ student.nombre }} {{ student.apellido }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ student.instrumento }}
            </p>
          </div>
        </div>
        <button
          @click="emit('remove-student', student.id)"
          class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Eliminar del grupo"
          :disabled="isLoading"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
    <!-- Botón para agregar estudiantes -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        @click="emit('add-student')"
        class="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
        :disabled="isLoading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Agregar Estudiante
      </button>
    </div>
  </div>
</template>