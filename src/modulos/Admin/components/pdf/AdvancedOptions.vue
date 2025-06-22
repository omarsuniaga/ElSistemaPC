<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
      Opciones Avanzadas
    </h3>

    <div class="space-y-4">
      <!-- Incluir fotos -->
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="pdfOptions.includePhotos"
          @change="$emit('update:pdfOptions', { ...pdfOptions, includePhotos: $event.target.checked })"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Incluir fotos de estudiantes
        </span>
      </label>

      <!-- Agrupar por clase -->
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="pdfOptions.groupByClass"
          @change="$emit('update:pdfOptions', { ...pdfOptions, groupByClass: $event.target.checked })"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Agrupar por clase
        </span>
      </label>

      <!-- Incluir estadísticas -->
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="pdfOptions.includeStats"
          @change="$emit('update:pdfOptions', { ...pdfOptions, includeStats: $event.target.checked })"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Incluir estadísticas resumen
        </span>
      </label>

      <!-- Incluir logo -->
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="pdfOptions.includeLogo"
          @change="$emit('update:pdfOptions', { ...pdfOptions, includeLogo: $event.target.checked })"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Incluir logo institucional
        </span>
      </label>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Ordenar por -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ordenar por
        </label>
        <select
          :value="pdfOptions.sortBy"
          @change="$emit('update:pdfOptions', { ...pdfOptions, sortBy: $event.target.value })"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="name">Nombre</option>
          <option value="age">Edad</option>
          <option value="instrument">Instrumento</option>
          <option value="teacher">Maestro</option>
          <option value="class">Clase</option>
          <option value="enrollmentDate">Fecha de inscripción</option>
        </select>
      </div>

      <!-- Orden -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Orden
        </label>
        <select
          :value="pdfOptions.sortOrder"
          @change="$emit('update:pdfOptions', { ...pdfOptions, sortOrder: $event.target.value })"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="asc">Ascendente (A-Z)</option>
          <option value="desc">Descendente (Z-A)</option>
        </select>
      </div>
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

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:pdfOptions': [value: any]
}>()
</script> 