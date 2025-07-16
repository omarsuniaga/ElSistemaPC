<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 mb-3"
    :class="{'shadow-md': showFilters}"
  >
    <!-- Formato compacto (una sola línea) -->
    <div class="flex items-center justify-between px-3 py-2">
      <div class="flex items-center gap-2">
        <button
          class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          :title="showFilters ? 'Ocultar filtros' : 'Mostrar filtros'"
          @click="toggleFilters"
        >
          <AdjustmentsHorizontalIcon class="h-5 w-5" />
        </button>

        <div class="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
          <span v-if="activeFilterCount === 0">Filtros</span>
          <span v-else class="font-medium text-blue-600 dark:text-blue-400">
            {{ activeFilterCount }}
            {{ activeFilterCount === 1 ? "filtro activo" : "filtros activos" }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Indicadores de filtros activos (visible solo cuando está compacto) -->
        <div
          v-if="!showFilters"
          class="flex items-center gap-1.5 ml-1 overflow-x-auto max-w-[70%] hide-scrollbar"
        >
          <span
            v-if="filters.instrument"
            class="badge bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
          >
            {{ filters.instrument }}
          </span>
          <span
            v-if="filters.level"
            class="badge bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
          >
            {{ filters.level }}
          </span>
          <span
            v-if="filters.teacherId"
            class="badge bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
          >
            {{ getTeacherName(filters.teacherId) }}
          </span>
        </div>

        <!-- Botón de reset (visible solo si hay filtros activos) -->
        <button
          v-if="activeFilterCount > 0"
          class="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 ml-1"
          title="Limpiar todos los filtros"
          @click="resetFilters"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>

        <!-- Botón para expandir/contraer los filtros -->
        <button
          class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          @click="toggleFilters"
        >
          <ChevronDownIcon
            class="h-5 w-5 transition-transform duration-300"
            :class="{'transform rotate-180': showFilters}"
          />
        </button>
      </div>
    </div>

    <!-- Panel de filtros extendido (visible solo cuando se expande) -->
    <div
      v-if="showFilters"
      class="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <!-- Filtro de Instrumento -->
        <div class="filter-group">
          <label class="filter-label">
            <MusicalNoteIcon class="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <span>Instrumento</span>
          </label>
          <div class="relative">
            <select v-model="filters.instrument" class="filter-select">
              <option value="">Todos los instrumentos</option>
              <template
                v-for="(instruments, family) in instrumentoStore.instrumentsByFamily"
                :key="family"
              >
                <optgroup
                  :label="family.charAt(0).toUpperCase() + family.slice(1)"
                  class="font-medium"
                >
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
          </div>
        </div>

        <!-- Filtro de Nivel -->
        <div class="filter-group">
          <label class="filter-label">
            <AcademicCapIcon class="h-4 w-4 text-green-500 dark:text-green-400" />
            <span>Nivel</span>
          </label>
          <div class="relative">
            <select v-model="filters.level" class="filter-select">
              <option value="">Todos los niveles</option>
              <option v-for="level in props.levelOptions" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
          </div>
        </div>

        <!-- Filtro de Profesor -->
        <div class="filter-group">
          <label class="filter-label">
            <UserIcon class="h-4 w-4 text-purple-500 dark:text-purple-400" />
            <span>Profesor</span>
          </label>
          <div class="relative">
            <select v-model="filters.teacherId" class="filter-select">
              <option value="">Todos los profesores</option>
              <option
                v-for="teacher in teachersStore.teachers"
                :key="teacher.id"
                :value="teacher.id"
              >
                {{ teacher.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useInstrumentoStore } from '../../Instruments/store/instrumento';
import {
  MusicalNoteIcon,
  AcademicCapIcon,
  UserIcon,
  ClockIcon,
  PencilIcon,
  XMarkIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/vue/24/outline';

interface Filters {
  instrument: string
  level: string
  teacherId: string
  additionalFilter: string
}

const props = defineProps<{
  initialFilters: Filters
  levelOptions: string[]
  additionalFilterOptions?: string[]
}>();

const emit = defineEmits<{
  (e: 'update:filters', filters: Filters): void
  (e: 'reset'): void
}>();

const teachersStore = useTeachersStore();
const instrumentoStore = useInstrumentoStore();

const filters = ref<Filters>({ ...props.initialFilters });
const showFilters = ref(false); // Por defecto, los filtros están ocultos
const activeFilterCount = computed(() => {
  return Object.values(filters.value).filter((value) => value !== '').length;
});

// Cuando cambien los filtros, emitir el evento para actualizar
watch(
  filters,
  (newFilters) => {
    emit('update:filters', newFilters);
  },
  { deep: true },
);

const resetFilters = () => {
  filters.value = {
    instrument: '',
    level: '',
    teacherId: '',
  };
  emit('reset');
};

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const getTeacherName = (id: string) => {
  return teachersStore.teachers.find((t) => t.id === id)?.name || id;
};
</script>

<style lang="postcss">
.filter-group {
  @apply flex flex-col;
}

.filter-label {
  @apply flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5;
}

.filter-select {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-30 py-1.5 pl-3 pr-8 text-sm appearance-none transition-all duration-200;
}

.badge {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs whitespace-nowrap truncate max-w-[120px];
}

/* Ocultar scrollbar pero mantener funcionalidad de scroll */
.hide-scrollbar {
  -ms-overflow-style: none; /* IE y Edge */
  scrollbar-width: none; /* Firefox */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* Animación para los elementos que aparecen/desaparecen */
.filter-group {
  @apply animate-fadeIn;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
</style>
