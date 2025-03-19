<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTeachersStore } from '../stores/teachers'
import { useInstrumentoStore } from '../stores/instrumento'
import { 
  MusicalNoteIcon, 
  AcademicCapIcon, 
  UserIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

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
  (e: 'update:filters', filters: Filters): void,
  (e: 'reset'): void
}>()

const teachersStore = useTeachersStore()
const instrumentoStore = useInstrumentoStore()

const filters = ref<Filters>({...props.initialFilters})
const showFilters = ref(true)
const activeFilterCount = computed(() => {
  return Object.values(filters.value).filter(value => value !== '').length
})

// Cuando cambien los filtros, emitir el evento para actualizar
watch(filters, (newFilters) => {
  emit('update:filters', newFilters)
}, { deep: true })

const resetFilters = () => {
  filters.value = {
    instrument: '',
    level: '',
    teacherId: ''
  }
  emit('reset')
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-5 mb-2 border border-gray-100 dark:border-gray-700 transition-all duration-300">
    <div class="flex flex-row justify-between items-center mb-4 gap-3">
      <div class="flex items-center gap-2">
        <FunnelIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Filtros</h2>
        <span v-if="activeFilterCount > 0" 
          class="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
          {{ activeFilterCount }}
        </span>
      </div>
      
      <div class="flex gap-2 items-center">
        <button 
          v-if="activeFilterCount > 0"
          @click="resetFilters" 
          class="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
        >
          <XMarkIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Limpiar filtros</span>
          <span class="sm:hidden">Limpiar</span>
        </button>
        
        <button 
          @click="showFilters = !showFilters" 
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-xs flex items-center gap-1"
        >
          <ChevronDownIcon 
            class="h-4 w-4 transition-transform duration-300" 
            :class="{ 'transform rotate-180': !showFilters }"
          />
          <span>{{ showFilters ? 'Ocultar' : 'Mostrar' }}</span>
        </button>
      </div>
    </div>
    
    <div v-if="showFilters" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Filtro de Instrumento -->
      <div class="filter-group">
        <label class="filter-label">
          <MusicalNoteIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>Instrumento</span>
        </label>
        <div class="relative">
          <select
            v-model="filters.instrument"
            class="filter-select"
          >
            <option value="">Todos los instrumentos</option>
            <template v-for="(instruments, family) in instrumentoStore.instrumentsByFamily" :key="family">
              <optgroup :label="family.charAt(0).toUpperCase() + family.slice(1)" class="font-medium">
                <option 
                  v-for="instrument in instruments" 
                  :key="instrument"
                  :value="instrument"
                  class="pl-2"
                >
                  {{ instrument }}
                </option>
              </optgroup>
            </template>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <ChevronDownIcon class="h-4 w-4 transition-transform" :class="{'transform rotate-180': filters.instrument}" />
          </div>
        </div>
      </div>
      
      <!-- Filtro de Nivel -->
      <div class="filter-group">
        <label class="filter-label">
          <AcademicCapIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>Nivel</span>
        </label>
        <div class="relative">
          <select
            v-model="filters.level"
            class="filter-select"
          >
            <option value="">Todos los niveles</option>
            <option v-for="level in props.levelOptions" :key="level" :value="level">
              {{ level }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <ChevronDownIcon class="h-4 w-4 transition-transform" :class="{'transform rotate-180': filters.level}" />
          </div>
        </div>
      </div>
      
      <!-- Filtro de Profesor -->
      <div class="filter-group">
        <label class="filter-label">
          <UserIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>Profesor</span>
        </label>
        <div class="relative">
          <select
            v-model="filters.teacherId"
            class="filter-select"
          >
            <option value="">Todos los profesores</option>
            <option v-for="teacher in teachersStore.teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <ChevronDownIcon class="h-4 w-4 transition-transform" :class="{'transform rotate-180': filters.teacherId}" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Indicador de filtros colapsados -->
    <div v-if="!showFilters && activeFilterCount > 0" class="flex flex-wrap gap-2 mt-3">
      <div v-if="filters.instrument" class="active-filter">
        <span class="truncate max-w-[150px] sm:max-w-none">Instrumento: {{ filters.instrument }}</span>
        <XMarkIcon @click="filters.instrument = ''" class="h-4 w-4 flex-shrink-0 cursor-pointer hover:text-red-500" />
      </div>
      <div v-if="filters.level" class="active-filter">
        <span class="truncate max-w-[150px] sm:max-w-none">Nivel: {{ filters.level }}</span>
        <XMarkIcon @click="filters.level = ''" class="h-4 w-4 flex-shrink-0 cursor-pointer hover:text-red-500" />
      </div>
      <div v-if="filters.teacherId" class="active-filter">
        <span class="truncate max-w-[150px] sm:max-w-none">Profesor: {{ teachersStore.teachers.find(t => t.id === filters.teacherId)?.name || filters.teacherId }}</span>
        <XMarkIcon @click="filters.teacherId = ''" class="h-4 w-4 flex-shrink-0 cursor-pointer hover:text-red-500" />
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.filter-group {
  @apply flex flex-col;
}

.filter-label {
  @apply flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5;
}

.filter-select {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-30 py-2 sm:py-2.5 pl-3 pr-10 text-sm sm:text-base appearance-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500;
}

.active-filter {
  @apply flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm transition-all duration-200;
}

/* Animación para los elementos que aparecen/desaparecen */
.filter-group, .active-filter {
  @apply animate-fadeIn;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

/* Mejoras para el aspecto de los select en dark mode */
.dark .filter-select option {
  @apply bg-gray-700 text-white;
}

.dark .filter-select optgroup {
  @apply bg-gray-800 text-gray-300;
}

/* Ajustes responsive personalizados */
@media (max-width: 640px) {
  .filter-select {
    @apply text-sm py-2;
  }
}

/* Custom breakpoint para mostrar/ocultar etiquetas en pantallas muy pequeñas */
@media (min-width: 360px) {
  .xs\:inline {
    display: inline;
  }
  .xs\:hidden {
    display: none;
  }
}
</style>