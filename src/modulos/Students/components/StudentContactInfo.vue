<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
        <svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        Información de Contacto
      </h3>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Datos de contacto del alumno</p>
    </div>
    
    <div class="p-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Teléfono -->
        <div class="relative">
          <label for="tlf" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Teléfono
          </label>
          <div class="relative">
            <input
              id="tlf"
              v-model="localStudent.tlf"
              type="tel"
              :class="[
                'block w-full px-4 py-3 pl-12 rounded-lg border-2 transition-all duration-200 focus:outline-none',
                validationErrors.tlf
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : localStudent.tlf
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
              ]"
              placeholder="(809) 123-4567"
              @input="updateStudent"
            />
            <div class="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div v-if="localStudent.tlf" class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <p v-if="validationErrors.tlf" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ validationErrors.tlf }}
          </p>
        </div>

        <!-- Email -->
        <div class="relative">
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <div class="relative">
            <input
              id="email"
              v-model="localStudent.email"
              type="email"
              :class="[
                'block w-full px-4 py-3 pl-12 rounded-lg border-2 transition-all duration-200 focus:outline-none',
                validationErrors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : localStudent.email
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
              ]"
              placeholder="alumno@ejemplo.com"
              @input="updateStudent"
            />
            <div class="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <div v-if="localStudent.email" class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <p v-if="validationErrors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ validationErrors.email }}
          </p>
        </div>
      </div>

      <!-- Dirección -->
      <div class="mt-6">
        <label for="direccion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dirección
        </label>
        <div class="relative">
          <textarea
            id="direccion"
            v-model="localStudent.direccion"
            rows="3"
            :class="[
              'block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none resize-none',
              validationErrors.direccion
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : localStudent.direccion
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
              'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
            ]"
            placeholder="Dirección completa del alumno..."
            @input="updateStudent"
          />
          <div v-if="localStudent.direccion" class="absolute top-3 right-3">
            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <p v-if="validationErrors.direccion" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ validationErrors.direccion }}
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
  // Capitalizar dirección
  if (localStudent.value.direccion) {
    localStudent.value.direccion = localStudent.value.direccion.charAt(0).toUpperCase() + localStudent.value.direccion.slice(1)
  }
  
  emit('update:student', { ...localStudent.value })
}

watch(() => props.student, (newStudent) => {
  localStudent.value = { ...newStudent }
}, { deep: true })
</script>
