<template>
  <div class="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <span class="self-center mr-2 text-sm font-medium">Exportar:</span>
    <button 
      @click="$emit('download-pdf')"
      :disabled="loading"
      class="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white 
             disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-3 w-3 text-white inline" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      PDF
    </button>
    <button 
      @click="$emit('export-csv')"
      class="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
    >
      CSV
    </button>
    <button 
      @click="$emit('export-xls')"
      class="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white"
    >
      Excel
    </button>
    
    <button 
      v-if="isDevelopmentMode"
      @click="$emit('debug-store')"
      class="px-3 py-1 text-xs rounded bg-yellow-600 hover:bg-yellow-700 text-white ml-auto"
      title="Debug del store de asistencia"
    >
      Debug Store
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineProps<{
  loading?: boolean
}>()

defineEmits<{
  'download-pdf': []
  'export-csv': []
  'export-xls': []
  'debug-store': []
}>()

const isDevelopmentMode = computed(() => {
  return process.env.NODE_ENV === 'development'
})
</script>
