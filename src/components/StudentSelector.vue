<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Student } from '../types'

const props = defineProps<{
  availableStudents: Student[];
  selectedStudentIds: string[];
  isLoading: boolean;
  groupName: string;
}>()

const emit = defineEmits<{
  (e: 'select-student', studentId: string): void;
  (e: 'add-selected'): void;
  (e: 'cancel'): void;
}>()

const searchQuery = ref('')

const filteredStudents = computed(() => {
  if (!searchQuery.value) return []
  
  return props.availableStudents.filter((student) => {
    const query = searchQuery.value.toLowerCase()
    return student.nombre.toLowerCase().includes(query) || 
           student.apellido.toLowerCase().includes(query)
  })
})

const selectedCount = computed(() => props.selectedStudentIds.length)

const getStudentById = (id: string): Student | undefined => {
  return props.availableStudents.find(student => student.id === id)
}

const getSelectedStudents = computed(() => {
  return props.selectedStudentIds
    .map(id => getStudentById(id))
    .filter(student => student !== undefined) as Student[]
})
</script>

<template>
  <div class="space-y-4">
    <!-- Información del grupo -->
    <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-lg mb-2 text-sm">
      Grupo: <span class="font-medium">{{ groupName }}</span>
    </div>
    
    <!-- Estudiantes seleccionados -->
    <div v-if="selectedStudentIds.length > 0" class="mb-4">
      <h3 class="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
        Estudiantes seleccionados ({{ selectedCount }})
      </h3>
      <div class="flex flex-wrap gap-2">
        <div 
          v-for="student in getSelectedStudents" 
          :key="student.id"
          class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs flex items-center"
        >
          {{ student.nombre }} {{ student.apellido }}
        </div>
      </div>
    </div>
    
    <!-- Selector de estudiante -->
    <div class="flex flex-col relative">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Estudiante</label>
      <input
        type="text"
        v-model="searchQuery"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="Buscar estudiante por nombre o apellido"
        autocomplete="off"
      />
      <ul v-if="searchQuery" class="absolute z-10 mt-12 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
        <li
          v-for="student in filteredStudents"
          :key="student.id"
          class="py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
          @click="emit('select-student', student.id)"
        >
          {{ student.nombre }} {{ student.apellido }} - {{ student.instrumento }}
        </li>
        <li v-if="filteredStudents.length === 0" class="py-2 px-4 text-gray-500 dark:text-gray-400">
          No se encontraron estudiantes
        </li>
      </ul>
    </div>
    
    <!-- Botones de acción -->
    <div class="flex justify-end gap-2 mt-4">
      <button
        type="button"
        class="inline-flex items-center rounded-md border border-transparent bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-semibold py-2 px-4 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        @click="emit('cancel')"
        :disabled="isLoading"
      >
        Cancelar
      </button>
      <button
        type="button"
        @click="emit('add-selected')"
        class="inline-flex items-center rounded-md border border-transparent bg-blue-600 text-white font-semibold py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :disabled="isLoading || selectedStudentIds.length === 0"
      >
        <span v-if="isLoading" class="mr-2">
          <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
        Agregar Estudiantes
      </button>
    </div>
  </div>
</template>