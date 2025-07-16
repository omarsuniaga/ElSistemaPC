<template>
  <div class="attendance-toolbar bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 gap-3">
      <!-- Left: Search -->
      <div class="flex-1 flex items-center gap-2">
        <input
          ref="searchInputElement"
          v-model="searchInput"
          @input="updateSearch"
          type="text"
          placeholder="Buscar estudiante..."
          class="w-full md:w-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button v-if="searchInput" @click="clearSearch" class="ml-1 px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Limpiar</button>
      </div>  
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { defineProps, defineEmits, defineExpose } from 'vue';

const props = defineProps({
  searchQuery: String,
});

const emit = defineEmits(['search', 'clear-search']);

const searchInput = ref(props.searchQuery || '');
const searchInputElement = ref<HTMLInputElement | null>(null);

watch(() => props.searchQuery, (newValue) => {
  if (newValue !== undefined) {
    searchInput.value = newValue;
  }
});

function updateSearch() {
  emit('search', searchInput.value);
}

function clearSearch() {
  searchInput.value = '';
  emit('clear-search');
  // Automáticamente enfocamos el campo después de limpiar
  focus();
}

// Método expuesto para permitir al componente padre enfocar el campo de búsqueda
function focus() {
  nextTick(() => {
    searchInputElement.value?.focus();
  });
}

// Exponemos el método focus al componente padre
defineExpose({
  focus // Exponemos el método focus al componente padre
});
</script>
