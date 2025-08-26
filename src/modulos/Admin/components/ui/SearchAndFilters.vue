<template>
  <div class="search-and-filters bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ title }}
      </h3>
      <button
        v-if="collapsible"
        @click="toggleCollapsed"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <ChevronUpIcon v-if="!isCollapsed" class="h-5 w-5" />
        <ChevronDownIcon v-else class="h-5 w-5" />
      </button>
    </div>

    <!-- Collapsible content -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-show="!isCollapsed" class="space-y-4">
        <!-- Search bar -->
        <div v-if="searchable" class="search-container">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ searchLabel }}
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </div>
            <input
              :value="searchQuery"
              @input="handleSearchInput"
              :placeholder="searchPlaceholder"
              class="search-input block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            />
            
            <!-- Clear search button -->
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Filter grid -->
        <div v-if="filters.length > 0" class="filters-grid">
          <div
            :class="[
              'grid gap-4',
              `grid-cols-1`,
              filters.length >= 2 ? 'md:grid-cols-2' : '',
              filters.length >= 3 ? 'lg:grid-cols-3' : '',
              filters.length >= 4 ? 'xl:grid-cols-4' : ''
            ]"
          >
            <div
              v-for="filter in filters"
              :key="filter.key"
              class="filter-item"
            >
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ filter.label }}
              </label>

              <!-- Select filter -->
              <select
                v-if="filter.type === 'select'"
                :value="filterValues[filter.key]"
                @change="handleFilterChange(filter.key, ($event.target as HTMLSelectElement).value)"
                class="filter-select block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              >
                <option value="">{{ filter.placeholder || `Todos los ${filter.label.toLowerCase()}` }}</option>
                <option
                  v-for="option in filter.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>

              <!-- Multi-select filter -->
              <div v-else-if="filter.type === 'multiselect'" class="relative">
                <button
                  @click="toggleMultiselect(filter.key)"
                  class="filter-multiselect w-full flex items-center justify-between py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                >
                  <span class="truncate">
                    {{ getMultiselectDisplayText(filter) }}
                  </span>
                  <ChevronDownIcon class="h-4 w-4 text-gray-400" />
                </button>

                <!-- Multiselect dropdown -->
                <div
                  v-show="openMultiselects[filter.key]"
                  class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                >
                  <label
                    v-for="option in filter.options"
                    :key="option.value"
                    class="multiselect-option cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                  >
                    <input
                      type="checkbox"
                      :checked="isOptionSelected(filter.key, option.value)"
                      @change="toggleMultiselectOption(filter.key, option.value)"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span class="text-gray-900 dark:text-white">{{ option.label }}</span>
                  </label>
                </div>
              </div>

              <!-- Date range filter -->
              <div v-else-if="filter.type === 'daterange'" class="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  :value="filterValues[`${filter.key}_start`]"
                  @change="handleFilterChange(`${filter.key}_start`, ($event.target as HTMLInputElement).value)"
                  class="filter-date block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
                <input
                  type="date"
                  :value="filterValues[`${filter.key}_end`]"
                  @change="handleFilterChange(`${filter.key}_end`, ($event.target as HTMLInputElement).value)"
                  class="filter-date block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>

              <!-- Number range filter -->
              <div v-else-if="filter.type === 'numberrange'" class="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  :placeholder="`Mín ${filter.label.toLowerCase()}`"
                  :value="filterValues[`${filter.key}_min`]"
                  @input="handleFilterChange(`${filter.key}_min`, ($event.target as HTMLInputElement).value)"
                  class="filter-number block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
                <input
                  type="number"
                  :placeholder="`Máx ${filter.label.toLowerCase()}`"
                  :value="filterValues[`${filter.key}_max`]"
                  @input="handleFilterChange(`${filter.key}_max`, ($event.target as HTMLInputElement).value)"
                  class="filter-number block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>

              <!-- Boolean filter -->
              <label v-else-if="filter.type === 'boolean'" class="inline-flex items-center">
                <input
                  type="checkbox"
                  :checked="filterValues[filter.key]"
                  @change="handleFilterChange(filter.key, ($event.target as HTMLInputElement).checked)"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ filter.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Actions row -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-4">
            <!-- Clear filters button -->
            <button
              v-if="hasActiveFilters"
              @click="clearAllFilters"
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline transition-colors"
            >
              Limpiar filtros
            </button>

            <!-- Active filters indicator -->
            <div v-if="hasActiveFilters" class="flex items-center space-x-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ activeFiltersCount }} filtro{{ activeFiltersCount !== 1 ? 's' : '' }} activo{{ activeFiltersCount !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- Results count -->
          <div v-if="resultsCount !== undefined" class="text-sm text-blue-600 dark:text-blue-400">
            {{ resultsCount }} resultado{{ resultsCount !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline';

interface FilterOption {
  label: string;
  value: string | number | boolean;
}

interface Filter {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'daterange' | 'numberrange' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
}

interface Props {
  title?: string;
  searchable?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  filters?: Filter[];
  filterValues?: Record<string, any>;
  collapsible?: boolean;
  initiallyCollapsed?: boolean;
  resultsCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Buscar y Filtrar',
  searchable: true,
  searchLabel: 'Buscar',
  searchPlaceholder: 'Escriba para buscar...',
  searchQuery: '',
  filters: () => [],
  filterValues: () => ({}),
  collapsible: false,
  initiallyCollapsed: false,
});

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:filterValues': [values: Record<string, any>];
  search: [query: string];
  filter: [key: string, value: any];
  clear: [];
}>();

// State
const isCollapsed = ref(props.initiallyCollapsed);
const openMultiselects = reactive<Record<string, boolean>>({});
const multiselectRefs = ref<Record<string, HTMLElement>>({});

// Local state management
const localSearchQuery = ref(props.searchQuery);
const localFilterValues = reactive({ ...props.filterValues });

// Computed
const hasActiveFilters = computed(() => {
  return localSearchQuery.value !== '' || 
         Object.values(localFilterValues).some(value => 
           value !== '' && value !== null && value !== undefined &&
           (Array.isArray(value) ? value.length > 0 : true)
         );
});

const activeFiltersCount = computed(() => {
  let count = localSearchQuery.value ? 1 : 0;
  
  Object.entries(localFilterValues).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        if (value.length > 0) count++;
      } else {
        count++;
      }
    }
  });
  
  return count;
});

// Methods
const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value;
};

const handleSearchInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  localSearchQuery.value = value;
  emit('update:searchQuery', value);
  emit('search', value);
};

const clearSearch = () => {
  localSearchQuery.value = '';
  emit('update:searchQuery', '');
  emit('search', '');
};

const handleFilterChange = (key: string, value: any) => {
  localFilterValues[key] = value;
  emit('update:filterValues', { ...localFilterValues });
  emit('filter', key, value);
};

const toggleMultiselect = (key: string) => {
  openMultiselects[key] = !openMultiselects[key];
};

const isOptionSelected = (filterKey: string, optionValue: any): boolean => {
  const filterValue = localFilterValues[filterKey];
  if (!Array.isArray(filterValue)) return false;
  return filterValue.includes(optionValue);
};

const toggleMultiselectOption = (filterKey: string, optionValue: any) => {
  let currentValue = localFilterValues[filterKey] || [];
  if (!Array.isArray(currentValue)) currentValue = [];
  
  if (currentValue.includes(optionValue)) {
    currentValue = currentValue.filter(v => v !== optionValue);
  } else {
    currentValue = [...currentValue, optionValue];
  }
  
  handleFilterChange(filterKey, currentValue);
};

const getMultiselectDisplayText = (filter: Filter): string => {
  const selected = localFilterValues[filter.key] || [];
  if (!Array.isArray(selected) || selected.length === 0) {
    return filter.placeholder || `Seleccionar ${filter.label.toLowerCase()}`;
  }
  
  if (selected.length === 1) {
    const option = filter.options?.find(opt => opt.value === selected[0]);
    return option?.label || selected[0];
  }
  
  return `${selected.length} seleccionados`;
};

const clearAllFilters = () => {
  localSearchQuery.value = '';
  Object.keys(localFilterValues).forEach(key => {
    localFilterValues[key] = '';
  });
  
  emit('update:searchQuery', '');
  emit('update:filterValues', { ...localFilterValues });
  emit('clear');
};

// Handle clicks outside multiselect dropdowns
const handleClickOutside = (event: Event) => {
  Object.keys(openMultiselects).forEach(key => {
    const element = multiselectRefs.value[key];
    if (element && !element.contains(event.target as Node)) {
      openMultiselects[key] = false;
    }
  });
};

// Watch for prop changes
watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue;
});

watch(() => props.filterValues, (newValues) => {
  Object.assign(localFilterValues, newValues);
}, { deep: true });

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Component-specific styles */
.search-and-filters {
  position: relative;
}

.search-input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-select:focus,
.filter-date:focus,
.filter-number:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-multiselect:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.multiselect-option:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

/* Smooth transitions */
.search-input,
.filter-select,
.filter-date,
.filter-number,
.filter-multiselect {
  transition: all 0.2s ease;
}

/* Custom scrollbar for multiselect */
.overflow-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.dark .overflow-auto::-webkit-scrollbar-track {
  background: #374151;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.dark .overflow-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}

/* Responsive improvements */
@media (max-width: 640px) {
  .filters-grid .grid {
    grid-template-columns: 1fr !important;
    gap: 1rem;
  }
  
  .search-and-filters {
    padding: 1rem;
  }
}

/* Focus states for accessibility */
.search-input:focus,
.filter-select:focus,
.filter-date:focus,
.filter-number:focus,
.filter-multiselect:focus {
  outline: none;
  ring: 2px solid #3b82f6;
  ring-offset: 2px;
}

.dark .search-input:focus,
.dark .filter-select:focus,
.dark .filter-date:focus,
.dark .filter-number:focus,
.dark .filter-multiselect:focus {
  ring-offset-color: #1f2937;
}
</style>