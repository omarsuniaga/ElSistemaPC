<template>
  <div class="modal-placeholder">
    <h3>{{ title }}</h3>
    <p>Componente en desarrollo...</p>
    <button class="mt-4 px-4 py-2 bg-gray-500 text-white rounded" @click="$emit('close')">
      Cerrar
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Modal',
});

defineEmits<{
  (e: 'close'): void
  (e: 'guardar', data: any): void
}>();
</script>

<style scoped>
.modal-placeholder {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-placeholder > div {
  @apply bg-white p-6 rounded-lg;
}
</style>
