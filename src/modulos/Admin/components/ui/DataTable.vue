<template>
  <div class="data-table">
    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Loading overlay -->
      <div v-if="loading" class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-10">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ loadingText }}</p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && filteredData.length === 0" class="p-12 text-center">
        <component :is="emptyIcon" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ emptyTitle }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ emptyDescription }}
        </p>
        <slot name="empty-actions"></slot>
      </div>

      <!-- Table content -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <!-- Table Header -->
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <!-- Selection column -->
              <th v-if="selectable" class="px-6 py-3 w-12">
                <input
                  type="checkbox"
                  :checked="selectedItems.length === filteredData.length && filteredData.length > 0"
                  :indeterminate="selectedItems.length > 0 && selectedItems.length < filteredData.length"
                  @change="toggleSelectAll"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>

              <!-- Column headers -->
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : '',
                  column.align === 'center' ? 'text-center' : '',
                  column.align === 'right' ? 'text-right' : ''
                ]"
                @click="column.sortable ? handleSort(column.key) : null"
              >
                <div class="flex items-center space-x-1">
                  <span>{{ column.label }}</span>
                  <div v-if="column.sortable" class="flex flex-col">
                    <ChevronUpIcon
                      :class="[
                        'h-3 w-3 transition-colors',
                        sortField === column.key && sortOrder === 'asc' 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-400'
                      ]"
                    />
                    <ChevronDownIcon
                      :class="[
                        'h-3 w-3 -mt-1 transition-colors',
                        sortField === column.key && sortOrder === 'desc' 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-400'
                      ]"
                    />
                  </div>
                </div>
              </th>

              <!-- Actions column -->
              <th v-if="$slots.actions" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(item, index) in paginatedData"
              :key="getItemKey(item, index)"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <!-- Selection column -->
              <td v-if="selectable" class="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  :checked="isItemSelected(item)"
                  @change="toggleItemSelection(item)"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>

              <!-- Data columns -->
              <td
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'px-6 py-4',
                  column.align === 'center' ? 'text-center' : '',
                  column.align === 'right' ? 'text-right' : '',
                  column.width ? `w-${column.width}` : ''
                ]"
              >
                <!-- Custom slot content -->
                <slot
                  v-if="$slots[`column-${column.key}`]"
                  :name="`column-${column.key}`"
                  :item="item"
                  :value="getNestedValue(item, column.key)"
                  :index="index"
                ></slot>

                <!-- Default content -->
                <div v-else class="text-sm">
                  <span
                    :class="[
                      column.truncate ? 'truncate block max-w-xs' : '',
                      'text-gray-900 dark:text-white'
                    ]"
                  >
                    {{ formatCellValue(getNestedValue(item, column.key), column) }}
                  </span>
                </div>
              </td>

              <!-- Actions column -->
              <td v-if="$slots.actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <slot name="actions" :item="item" :index="index"></slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && filteredData.length > pageSize" class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div class="flex items-center justify-between">
          <!-- Results info -->
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Mostrando
                <span class="font-medium">{{ startIndex + 1 }}</span>
                a
                <span class="font-medium">{{ Math.min(endIndex, filteredData.length) }}</span>
                de
                <span class="font-medium">{{ filteredData.length }}</span>
                resultados
              </p>
            </div>
            
            <!-- Pagination controls -->
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="previousPage"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <ChevronLeftIcon class="h-5 w-5" />
                </button>
                
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors',
                    page === currentPage
                      ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  ]"
                >
                  {{ page }}
                </button>
                
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <ChevronRightIcon class="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TableCellsIcon,
} from '@heroicons/vue/24/outline';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  format?: 'text' | 'number' | 'date' | 'currency' | 'boolean';
}

interface Props {
  data: any[];
  columns: Column[];
  loading?: boolean;
  loadingText?: string;
  selectable?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: any;
  searchQuery?: string;
  searchFields?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: 'Cargando...',
  selectable: false,
  pageSize: 10,
  emptyTitle: 'No hay datos',
  emptyDescription: 'No se encontraron elementos para mostrar.',
  emptyIcon: TableCellsIcon,
  searchQuery: '',
  searchFields: () => [],
});

const emit = defineEmits<{
  selectionChange: [selectedItems: any[]];
  sort: [field: string, order: 'asc' | 'desc'];
}>();

// State
const currentPage = ref(1);
const sortField = ref<string>('');
const sortOrder = ref<'asc' | 'desc'>('asc');
const selectedItems = ref<any[]>([]);

// Computed
const filteredData = computed(() => {
  let filtered = [...props.data];

  // Search filter
  if (props.searchQuery && props.searchFields.length > 0) {
    const query = props.searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      props.searchFields.some(field =>
        String(getNestedValue(item, field) || '').toLowerCase().includes(query)
      )
    );
  }

  // Sorting
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aValue = getNestedValue(a, sortField.value);
      const bValue = getNestedValue(b, sortField.value);
      
      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;
      
      return sortOrder.value === 'desc' ? -comparison : comparison;
    });
  }

  return filtered;
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / props.pageSize));
const startIndex = computed(() => (currentPage.value - 1) * props.pageSize);
const endIndex = computed(() => startIndex.value + props.pageSize);

const paginatedData = computed(() =>
  filteredData.value.slice(startIndex.value, endIndex.value)
);

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage.value - half);
  const end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// Methods
const getItemKey = (item: any, index: number): string => {
  return item.id || item._id || index.toString();
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const formatCellValue = (value: any, column: Column): string => {
  if (value == null) return '-';

  switch (column.format) {
    case 'date':
      return new Date(value).toLocaleDateString('es-ES');
    case 'currency':
      return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR' 
      }).format(value);
    case 'number':
      return new Intl.NumberFormat('es-ES').format(value);
    case 'boolean':
      return value ? 'Sí' : 'No';
    default:
      return String(value);
  }
};

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
  
  emit('sort', sortField.value, sortOrder.value);
};

const isItemSelected = (item: any): boolean => {
  return selectedItems.value.some(selected => 
    getItemKey(selected, -1) === getItemKey(item, -1)
  );
};

const toggleItemSelection = (item: any) => {
  const isSelected = isItemSelected(item);
  
  if (isSelected) {
    selectedItems.value = selectedItems.value.filter(selected =>
      getItemKey(selected, -1) !== getItemKey(item, -1)
    );
  } else {
    selectedItems.value.push(item);
  }
};

const toggleSelectAll = () => {
  if (selectedItems.value.length === filteredData.value.length) {
    selectedItems.value = [];
  } else {
    selectedItems.value = [...filteredData.value];
  }
};

// Pagination methods
const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const goToPage = (page: number) => {
  currentPage.value = page;
};

// Watch for selection changes
watch(selectedItems, (newSelection) => {
  emit('selectionChange', newSelection);
}, { deep: true });

// Reset page when data changes
watch(() => props.data, () => {
  currentPage.value = 1;
});

// Reset page when search changes
watch(() => props.searchQuery, () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.data-table {
  position: relative;
}

/* Smooth transitions */
table {
  transition: opacity 0.2s ease;
}

tbody tr {
  transition: all 0.2s ease;
}

tbody tr:hover {
  transform: translateX(2px);
}

/* Custom checkbox styles */
input[type="checkbox"]:indeterminate {
  background-color: #3b82f6;
  border-color: #3b82f6;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M3.5 8h9'/%3e%3c/svg%3e");
}

/* Loading overlay */
.data-table > div {
  position: relative;
}

/* Responsive improvements */
@media (max-width: 640px) {
  .px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .py-4 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
}
</style>