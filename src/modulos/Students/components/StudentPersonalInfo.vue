<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
        <svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
        </svg>
        Información Personal
      </h3>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Datos básicos del alumno</p>
    </div>
    
    <div class="p-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Nombre -->
        <div class="relative">
          <label for="nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre *
          </label>
          <div class="relative">
            <input
              id="nombre"
              v-model="localStudent.nombre"
              type="text"
              required
              :class="[
                'block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none',
                validationErrors.nombre
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : localStudent.nombre
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
              ]"
              placeholder="Ingresa el nombre"
              @input="updateStudent"
            />
            <div v-if="localStudent.nombre" class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <p v-if="validationErrors.nombre" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ validationErrors.nombre }}
          </p>
        </div>

        <!-- Apellido -->
        <div class="relative">
          <label for="apellido" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Apellido *
          </label>
          <div class="relative">
            <input
              id="apellido"
              v-model="localStudent.apellido"
              type="text"
              required
              :class="[
                'block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none',
                validationErrors.apellido
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : localStudent.apellido
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
              ]"
              placeholder="Ingresa el apellido"
              @input="updateStudent"
            />
            <div v-if="localStudent.apellido" class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <p v-if="validationErrors.apellido" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ validationErrors.apellido }}
          </p>
        </div>

        <!-- Edad -->
        <div class="relative">
          <label for="edad" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Edad
          </label>
          <div class="relative">
            <input
              id="edad"
              v-model="localStudent.edad"
              type="number"
              min="3"
              max="99"
              :class="[
                'block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none',
                validationErrors.edad
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : localStudent.edad
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
              ]"
              placeholder="Edad del alumno"
              @input="updateStudent"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p v-if="validationErrors.edad" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ validationErrors.edad }}
          </p>
        </div>

        <!-- Instrumento -->
        <div class="relative">
          <label for="instrumento" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instrumento
          </label>
          <div class="relative">
            <input
              id="instrumento"
              v-model="localStudent.instrumento"
              type="text"
              :class="[
                'block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none',
                validationErrors.instrumento
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : localStudent.instrumento
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
              ]"
              placeholder="Instrumento principal"
              @input="updateStudent"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          </div>
          <p v-if="validationErrors.instrumento" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ validationErrors.instrumento }}
          </p>
        </div>

        <!-- Clases/Grupos -->
        <div class="sm:col-span-2">
          <label for="grupo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Clases
          </label>
          <div class="relative">
            <select
              id="grupo"
              v-model="localStudent.grupo"
              multiple
              :class="[
                'block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none',
                validationErrors.grupo
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : localStudent.grupo && localStudent.grupo.length > 0
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
              ]"
              @change="updateStudent"
            >
              <option v-for="grupoName in availableGrupos" :key="grupoName" :value="grupoName">
                {{ grupoName }}
              </option>
            </select>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples clases
          </p>
          <p v-if="validationErrors.grupo" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ validationErrors.grupo }}
          </p>
        </div>
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
  availableGrupos: string[]
}

interface Emits {
  (e: 'update:student', value: Omit<Student, 'id'> & { id?: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localStudent = ref({ ...props.student })

const updateStudent = () => {
  // Capitalizar nombre y apellido
  if (localStudent.value.nombre) {
    localStudent.value.nombre = localStudent.value.nombre.charAt(0).toUpperCase() + localStudent.value.nombre.slice(1)
  }
  if (localStudent.value.apellido) {
    localStudent.value.apellido = localStudent.value.apellido.charAt(0).toUpperCase() + localStudent.value.apellido.slice(1)
  }
  if (localStudent.value.instrumento) {
    localStudent.value.instrumento = localStudent.value.instrumento.charAt(0).toUpperCase() + localStudent.value.instrumento.slice(1)
  }
  
  emit('update:student', { ...localStudent.value })
}

watch(() => props.student, (newStudent) => {
  localStudent.value = { ...newStudent }
}, { deep: true })
</script>
