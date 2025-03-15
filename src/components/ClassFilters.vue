<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTeachersStore } from '../stores/teachers'
import { useInstrumentoStore } from '../stores/instrumento'

interface Filters {
  instrument: string
  level: string
  teacherId: string
}

const props = defineProps<{
  initialFilters: Filters,
  levelOptions: string[]
}>()

const emit = defineEmits<{
  (e: 'update:filters', filters: Filters): void
}>()

const teachersStore = useTeachersStore()
const instrumentoStore = useInstrumentoStore()

const filters = ref<Filters>({...props.initialFilters})

// Cuando cambien los filtros, emitir el evento para actualizar
watch(filters, (newFilters) => {
  emit('update:filters', newFilters)
}, { deep: true })
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
    <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Filtros</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Filtro de Instrumento -->
      <div class="flex flex-col">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instrumento</label>
        <div class="relative">
          <select
            v-model="filters.instrument"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Todos los instrumentos</option>
            <template v-for="(instruments, family) in instrumentoStore.instrumentsByFamily" :key="family">
              <optgroup :label="family.charAt(0).toUpperCase() + family.slice(1)">
                <option 
                  v-for="instrument in instruments" 
                  :key="instrument"
                  :value="instrument"
                >
                  {{ instrument }}
                </option>
              </optgroup>
            </template>
          </select>
        </div>
      </div>
      
      <!-- Filtro de Nivel -->
      <div class="flex flex-col">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nivel</label>
        <select
          v-model="filters.level"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Todos los niveles</option>
          <option v-for="level in props.levelOptions" :key="level" :value="level">
            {{ level }}
          </option>
        </select>
      </div>
      
      <!-- Filtro de Profesor -->
      <div class="flex flex-col">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profesor</label>
        <select
          v-model="filters.teacherId"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Todos los profesores</option>
          <option v-for="teacher in teachersStore.teachers" :key="teacher.id" :value="teacher.id">
            {{ teacher.name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>