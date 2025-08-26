<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
        <svg class="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
        </svg>
        Información Adicional
      </h3>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Observaciones y notas especiales</p>
    </div>
    
    <div class="p-6">
      <!-- Observaciones -->
      <div>
        <label for="observaciones" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observaciones
        </label>
        <div class="relative">
          <textarea
            id="observaciones"
            v-model="localStudent.observaciones"
            rows="4"
            :class="[
              'block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none resize-none',
              validationErrors.observaciones
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : localStudent.observaciones
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
              'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
            ]"
            placeholder="Notas especiales, nivel del alumno, objetivos, etc..."
            @input="updateStudent"
          />
          <div v-if="localStudent.observaciones" class="absolute top-3 right-3">
            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <p v-if="validationErrors.observaciones" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ validationErrors.observaciones }}
        </p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Información que puede ser útil para profesores y administradores
        </p>
      </div>

      <!-- Estado del alumno -->
      <div class="mt-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Estado del Alumno
        </label>
        <div class="flex items-center space-x-3">
          <label class="inline-flex items-center">
            <input
              v-model="localStudent.activo"
              type="checkbox"
              :value="true"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              @change="updateStudent"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Alumno activo</span>
          </label>
          <div class="flex items-center px-2 py-1 rounded-full text-xs font-medium" :class="localStudent.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'">
            <div class="w-2 h-2 rounded-full mr-1" :class="localStudent.activo ? 'bg-green-400' : 'bg-red-400'"></div>
            {{ localStudent.activo ? 'Activo' : 'Inactivo' }}
          </div>
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Los alumnos inactivos no aparecerán en las listas de asistencia
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Student } from '../types/student'

interface Props {
  student: Omit<Student, 'id'> & { id?: string }
  validationErrors: Record<string, string>
}

interface Emits {
  (e: 'update:student', value: Omit<Student, 'id'> & { id?: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localStudent = ref({ ...props.student })

const updateStudent = () => {
  // Capitalizar observaciones
  if (localStudent.value.observaciones) {
    localStudent.value.observaciones = localStudent.value.observaciones.charAt(0).toUpperCase() + localStudent.value.observaciones.slice(1)
  }
  
  emit('update:student', { ...localStudent.value })
}

watch(() => props.student, (newStudent) => {
  localStudent.value = { ...newStudent }
}, { deep: true })
</script>
