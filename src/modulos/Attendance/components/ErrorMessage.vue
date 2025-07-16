<template>
  <div
    v-if="message"
    class="p-3 my-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-400"
    role="alert"
  >
    <span class="font-medium">¡Error!</span> {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string | null
}>();
</script>

<style scoped>
/* Puedes añadir estilos específicos aquí si es necesario */
</style>
