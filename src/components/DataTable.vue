<template>
  <div class="space-y-4">
    <!-- Table Controls -->
    <div class="flex justify-between items-center">
      <!-- Left Controls -->
      <div class="flex items-center gap-4">
        <select
          v-model="state.pageSize"
          class="input w-24"
          @change="setPageSize(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="option in pageSizeOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <div class="flex items-center gap-4">
          <label for="globalSearch" class="text-sm font-medium">Buscar</label>
          <input
            id="globalSearch"
            v-model="globalSearch"
            type="text"
            placeholder="Escribe para buscar..."
            class="input w-64"
          />
        </div>
        <button
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          :class="{'bg-blue-100 dark:bg-blue-900/30': showFilters}"
          @click="showFilters = !showFilters"
        >
          <FunnelIcon class="w-5 h-5" />
          Filtros
        </button>

        <button
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          @click="showColumnManager = !showColumnManager"
        >
          <ViewColumnsIcon class="w-5 h-5" />
          Columnas
        </button>
      </div>

      <!-- Right Controls -->
      <div class="flex items-center gap-2">
        <select v-model="exportFormat" class="input w-24">
          <option value="xlsx">Excel</option>
          <option value="csv">CSV</option>
        </select>

        <button
          class="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          @click="handleExport"
        >
          <ArrowDownTrayIcon class="w-5 h-5" />
          Exportar
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="showFilters" class="card">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Filtros</h3>
        <button
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          @click="clearFilters"
        >
          Limpiar
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="filter in filterOptions" :key="filter.id" class="space-y-1">
          <label class="text-sm font-medium">{{ filter.label }}</label>

          <template v-if="filter.type === 'select'">
            <select v-model="state.filters[filter.id]" class="input" :multiple="filter.multiple">
              <option value="">{{ filter.placeholder || "Seleccionar..." }}</option>
              <option v-for="option in filter.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </template>

          <template v-else-if="filter.type === 'date'">
            <input v-model="state.filters[filter.id]" type="date" class="input" />
          </template>

          <template v-else>
            <input
              v-model="state.filters[filter.id]"
              :type="filter.type"
              class="input"
              :placeholder="filter.placeholder"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Column Manager -->
    <div v-if="showColumnManager" class="card">
      <h3 class="text-lg font-semibold mb-4">Gestionar Columnas</h3>

      <vuedraggable
        v-model="state.columnOrder"
        item-key="id"
        handle=".handle"
        @end="reorderColumns(state.columnOrder)"
      >
        <template #item="{element}">
          <div
            class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded mb-2"
          >
            <div class="flex items-center gap-2">
              <span class="handle cursor-move">⋮⋮</span>
              <input
                type="checkbox"
                :checked="state.columns.find((col) => col.id === element)?.visible"
                @change="toggleColumn(element)"
              />
              <span>{{ state.columns.find((col) => col.id === element)?.label }}</span>
            </div>
          </div>
        </template>
      </vuedraggable>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="(row, idx) in paginatedItems"
            :key="row.id || idx"
            class="hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <td v-for="column in columns" :key="column.key" class="px-6 py-4 whitespace-nowrap">
              <div v-if="column.format" v-html="column.format(row[column.key])" />
              <div v-else>{{ row[column.key] }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex justify-between items-center">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} a
        {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }}
        de {{ pagination.total }} registros
      </div>

      <div class="flex items-center gap-2">
        <button
          :disabled="pagination.currentPage === 1"
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          @click="setPage(pagination.currentPage - 1)"
        >
          <ChevronLeftIcon class="w-5 h-5" />
        </button>

        <span class="px-4 py-2"> Página {{ pagination.currentPage }} de {{ totalPages }} </span>

        <button
          :disabled="pagination.currentPage === totalPages"
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          @click="setPage(pagination.currentPage + 1)"
        >
          <ChevronRightIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTable } from '../composables/useTable';
import type { TableColumn, FilterOption, ExportOptions } from '../types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ViewColumnsIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';
import vuedraggable from 'vuedraggable';

const props = defineProps<{
  items: any[]
  columns: TableColumn[]
  storageKey?: string
  defaultPageSize?: number
  exportFileName?: string
  filterOptions?: FilterOption[]
}>();

const showFilters = ref(false);
const showColumnManager = ref(false);
const exportFormat = ref<'xlsx' | 'csv'>('xlsx');

const {
  state,
  paginatedItems,
  pagination,
  totalPages,
  visibleColumns,
  setPage,
  setPageSize,
  setSort,
  setFilter,
  clearFilters,
  toggleColumn,
  reorderColumns,
  exportData,
} = useTable(props.items, props.columns, {
  storageKey: props.storageKey || '',
  defaultPageSize: props.defaultPageSize || 10,
  exportFileName: props.exportFileName || '',
});

const pageSizeOptions = [10, 25, 50, 100];

const globalSearch = computed<string>({
  get: () => state.searchQuery,
  set: (value: string) => {
    state.searchQuery = value;
  },
});

const handleExport = () => {
  interface VisibleColumn {
    id: string
  }

  const options: ExportOptions = {
    format: exportFormat.value,
    filename: props.exportFileName || '',
    includeHeaders: true,
    columnIds: visibleColumns.value.map((col: VisibleColumn) => col.id),
  };
  exportData(options);
};

const getSortIcon = (column: TableColumn) => {
  if (!column.sortable) return null;
  if (state.value.sortBy !== column.key) return ChevronUpDownIcon;
  return state.value.sortOrder === 'asc' ? ChevronUpIcon : ChevronDownIcon;
};
</script>
````
