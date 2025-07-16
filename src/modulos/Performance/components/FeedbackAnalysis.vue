<template>
  <div class="placeholder-analysis">
    <h4>Análisis de Retroalimentación</h4>
    <p>Análisis en desarrollo...</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  studentId: string
  data?: any
}>();
</script>

<style scoped>
.placeholder-analysis {
  @apply p-8 text-center text-gray-500 dark:text-gray-400;
}
</style>
