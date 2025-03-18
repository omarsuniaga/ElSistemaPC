<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 mb-6 border border-gray-200 dark:border-gray-700">
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Selecciona la Fecha y Clase</h2>
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <label for="selectedDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
        <div class="relative">
          <input
            type="date"
            id="selectedDate"
            :value="selectedDate"
            @input="handleDateChange"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      <div class="flex-1">
        <label for="selectedClass" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clase</label>
        <div class="relative">
          <select
            id="selectedClass"
            :value="modelValue"
            @change="handleClassChange"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 appearance-none"
          >
            <option value="" disabled>Selecciona una clase</option>
            <option v-for="class_ in availableClasses" :key="class_.id" :value="class_.name">
              {{ class_.name }} ({{ getStudentToClass().length }} alumnos)
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 flex justify-between">
      <span v-if="isLoading" class="inline-flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Cargando...
      </span>
      <button 
        @click="$emit('continue')"
        :disabled="!modelValue || isLoading"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed"
      >
        Continuar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClassesStore } from '../stores/classes'
import { useStudentsStore } from '../stores/students'
import { getDayName } from '../utils/dateUtils'

interface ScheduleConfig {
  days?: string[]
  [key: string]: any
}

const props = defineProps<{
  modelValue?: string
  selectedDate: string
  dayFilter?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:selectedDate', value: string): void
  (e: 'continue'): void
  // studentsIDs: Array
  (e: 'update:studentsIDs', value: Array<string>): void
}>()

const classesStore = useClassesStore()
const studentsStore = useStudentsStore()
const isLoading = ref(false)
const studentByClass = ref<string[]>([])

const handleDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target?.value) {
    emit('update:selectedDate', target.value)
  }
}

const handleClassChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  if (target?.value) {
    emit('update:modelValue', target.value)
  }
}

const availableClasses = computed(() => {
  if (!props.dayFilter) return classesStore.classes

  const currentDayName = getDayName(props.selectedDate).toLowerCase()
    
  return classesStore.classes.filter(c => {
    // Manejar tanto string como objeto para schedule
    if (typeof c.schedule === 'string') {
      return c.schedule.toLowerCase().includes(currentDayName)
    } else if (c.schedule && typeof c.schedule === 'object') {
      return c.schedule.days.some(day => 
        day.toLowerCase() === currentDayName
      )
    }
    return false
  })
})

const getStudentToClass = () => {
  studentByClass.value = classesStore.classes.map(c => c.studentIds).flat()
  return studentByClass.value
}

onMounted(async () => {
  try {
    isLoading.value = true
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents()
    ])
  } catch (error) {
    console.error('Error cargando datos:', error)
  } finally {
    isLoading.value = false
  }
})

// Watch para actualizar la selección cuando cambie la fecha
watch(() => props.selectedDate, () => {
  // Si la clase seleccionada no está disponible para el nuevo día, resetear la selección
  if (props.modelValue && !availableClasses.value.find(c => c.name === props.modelValue)) {
    emit('update:modelValue', '')
  }
})
</script>

<style scoped>
/* Estilos para inputs y select personalizados */
input[type="date"],
select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: transparent;
}

/* Eliminar el ícono de calendario nativo en navegadores */
input[type="date"]::-webkit-calendar-picker-indicator {
  background: transparent;
  bottom: 0;
  color: transparent;
  cursor: pointer;
  height: 100%;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 1;
}

/* Personalización para navegadores basados en Webkit (Chrome, Safari, Edge) */
input:focus, select:focus {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
}

/* Transiciones suaves para cambios de tema */
.dark .transition-colors,
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Mejora de estilos para modo oscuro */
@media (prefers-color-scheme: dark) {
  input[type="date"],
  select {
    color-scheme: dark;
  }
}
</style>
