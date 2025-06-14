<template>
  <div class="error-state bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <strong class="font-bold">¡Error!</strong>
    <span class="block sm:inline">{{ message }}</span>
    <button 
      v-if="showRetry"
      @click="$emit('retry')" 
      class="mt-2 sm:mt-0 sm:ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
      Reintentar
    </button>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* Add any specific styling for the error state component */
</style>
