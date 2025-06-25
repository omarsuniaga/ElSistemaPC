<template>
  <div class="flex flex-wrap gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div class="flex items-center">
      <span class="mr-2 text-sm">Desde:</span>
      <input 
        type="date" 
        :value="from" 
        @input="$emit('update:from', ($event.target as HTMLInputElement).value)"
        class="border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
               border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500" 
      />
    </div>
    <div class="flex items-center">
      <span class="mx-2 text-sm">Hasta:</span>
      <input 
        type="date" 
        :value="to" 
        @input="$emit('update:to', ($event.target as HTMLInputElement).value)"
        class="border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
               border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500" 
      />
    </div>
    <div class="flex gap-2 ml-auto">
      <button 
        @click="$emit('set-range', 'yesterday')" 
        class="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 
               dark:hover:bg-gray-500 dark:text-gray-200"
      >
        Ayer
      </button>
      <button 
        @click="$emit('set-range', 'week')" 
        class="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 
               dark:hover:bg-gray-500 dark:text-gray-200"
      >
        Últ. semana
      </button>
      <button 
        @click="$emit('set-range', 'month')" 
        class="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 
               dark:hover:bg-gray-500 dark:text-gray-200"
      >
        Últ. mes
      </button>
      <button 
        @click="$emit('sync-data')" 
        class="px-3 py-1 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white 
               dark:bg-blue-500 dark:hover:bg-blue-600"
        title="Sincronizar asistencias para el rango de fechas"
      >
        Sincronizar
      </button>
      <button 
        @click="$emit('generate-report')" 
        class="px-3 py-1 text-xs font-medium rounded bg-primary-600 hover:bg-primary-700 text-white 
               dark:bg-primary-500 dark:hover:bg-primary-600"
      >
        Generar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  from: string
  to: string
}>()

defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  'set-range': [type: string]
  'sync-data': []
  'generate-report': []
}>()
</script>
