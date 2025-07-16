<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Opciones del PDF</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Orientación -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Orientación
        </label>
        <select
          :value="pdfOptions.orientation"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          @change="$emit('update:pdfOptions', {...pdfOptions, orientation: $event.target.value})"
        >
          <option value="portrait">Vertical</option>
          <option value="landscape">Horizontal</option>
        </select>
      </div>

      <!-- Tamaño de página -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tamaño de Página
        </label>
        <select
          :value="pdfOptions.pageSize"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          @change="$emit('update:pdfOptions', {...pdfOptions, pageSize: $event.target.value})"
        >
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="Letter">Carta</option>
          <option value="Legal">Legal</option>
        </select>
      </div>
    </div>

    <div class="space-y-3">
      <!-- Incluir encabezado -->
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="pdfOptions.includeHeader"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          @change="
            $emit('update:pdfOptions', {...pdfOptions, includeHeader: $event.target.checked})
          "
        />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Incluir encabezado institucional
        </span>
      </label>

      <!-- Incluir fecha -->
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="pdfOptions.includeDate"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          @change="$emit('update:pdfOptions', {...pdfOptions, includeDate: $event.target.checked})"
        />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Incluir fecha de generación
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  selectedReportType: string
  pdfOptions: {
    orientation: string
    pageSize: string
    includeHeader: boolean
    includeDate: boolean
    includeLogo: boolean
    includePhotos: boolean
    groupByClass: boolean
    includeStats: boolean
    sortBy: string
    sortOrder: string
  }
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:pdfOptions': [value: any]
}>();
</script>
