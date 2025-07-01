<template>
  <div
    class="indicator-simple bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center justify-center"
  >
    <div class="text-2xl font-bold">{{ value }}</div>
    <div class="text-sm text-gray-500 mt-1">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>()
</script>

<style scoped>
.indicator-simple {
  min-width: 120px;
  min-height: 80px;
}
</style>
