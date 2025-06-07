<template>
  asdasdkalsk
  <div 
    v-if="observations" 
    @click="$emit('click')"
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
    Ver Observaciones
  </div>
</template>

<script setup lang="ts">
defineProps<{
  observations: string | null | undefined
}>();

defineEmits(['click']);
</script>
