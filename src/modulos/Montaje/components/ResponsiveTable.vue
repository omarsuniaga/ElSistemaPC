<template>
  <div
:class="[
    'rounded-lg border overflow-hidden',
    themeClasses.surface,
    themeClasses.border
  ]">
    <!-- Mobile Card View -->
    <div v-if="isMobile && mobileCardView" class="divide-y divide-gray-200 dark:divide-gray-700">
      <div
        v-for="(row, index) in data"
        :key="index"
        :class="['p-4', themeClasses.hover]"
      >
        <div class="space-y-2">
          <div
            v-for="(column, colIndex) in columns"
            :key="colIndex"
            class="flex justify-between items-start"
          >
            <span :class="['text-sm font-medium', themeClasses.text.secondary]">
              {{ column.label }}:
            </span>
            <span :class="['text-sm text-right', themeClasses.text.primary]">
              <slot 
                :name="`cell-${column.key}`" 
                :row="row" 
                :value="row[column.key]"
                :index="index"
              >
                {{ row[column.key] }}
              </slot>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div v-else :class="tableClasses.container">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead :class="['bg-gray-50 dark:bg-gray-800']">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
                tableClasses.cell,
                themeClasses.text.muted
              ]"
            >
              <div class="flex items-center gap-2">
                {{ column.label }}
                <button
                  v-if="column.sortable"
                  :class="['hover:text-gray-900 dark:hover:text-gray-100']"
                  @click="toggleSort(column.key)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      v-if="sortKey === column.key && sortOrder === 'asc'"
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M5 15l7-7 7 7"
                    />
                    <path 
                      v-else-if="sortKey === column.key && sortOrder === 'desc'"
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M19 9l-7 7-7-7"
                    />
                    <path 
                      v-else
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    />
                  </svg>
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody :class="['divide-y divide-gray-200 dark:divide-gray-700', themeClasses.surface]">
          <tr
            v-for="(row, index) in sortedData"
            :key="index"
            :class="[themeClasses.hover]"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-4 whitespace-nowrap text-sm',
                tableClasses.cell,
                themeClasses.text.primary
              ]"
            >
              <slot 
                :name="`cell-${column.key}`" 
                :row="row" 
                :value="row[column.key]"
                :index="index"
              >
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div 
      v-if="data.length === 0"
      :class="['text-center py-12', themeClasses.text.muted]"
    >
      <slot name="empty">
        <div class="text-4xl mb-2">📋</div>
        <p>No hay datos disponibles</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useResponsive } from '../composables/useResponsive';

interface Column {
  key: string
  label: string
  sortable?: boolean
}

interface Props {
  columns: Column[]
  data: Record<string, any>[]
  mobileCardView?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mobileCardView: true,
});

const { themeClasses } = useTheme();
const { isMobile, tableClasses } = useResponsive();

const sortKey = ref<string | null>(null);
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortedData = computed(() => {
  if (!sortKey.value) return props.data;

  return [...props.data].sort((a, b) => {
    const aVal = a[sortKey.value!];
    const bVal = b[sortKey.value!];

    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};
</script>