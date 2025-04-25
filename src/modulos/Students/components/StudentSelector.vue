<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Student } from '../types/student'

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
  (e: 'remove-student', studentId: string): void;
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

const clearSearchQuery = () => {
  searchQuery.value = ''
}

const selectAndClear = (studentId: string) => {
  emit('select-student', studentId)
  clearSearchQuery()
}

const removeStudent = (studentId: string) => {
  emit('remove-student', studentId)
}
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
      <div class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
        <div 
          v-for="student in getSelectedStudents" 
          :key="student.id"
          class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs flex items-center gap-1"
        >
          <span>{{ student.nombre }} {{ student.apellido }}</span>
          <button
            @click="removeStudent(student.id)"
            class="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 focus:outline-none"
            title="Quitar de la lista"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Selector de estudiante -->
    <div class="flex flex-col relative">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Estudiante</label>
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Buscar estudiante por nombre o apellido"
          autocomplete="off"
        />
        <button
          v-if="searchQuery"
          @click="clearSearchQuery"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          title="Limpiar búsqueda"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <ul v-if="searchQuery" class="absolute z-10 mt-12 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
        <li
          v-for="student in filteredStudents"
          :key="student.id"
          class="py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
          @click="selectAndClear(student.id)"
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