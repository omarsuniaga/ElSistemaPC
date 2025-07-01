<template>
  <div
    class="modal-placeholder bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>
      <p class="text-gray-600 mb-4">Este modal está en desarrollo...</p>
      <div class="flex justify-end space-x-3">
        <button
          class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          @click="$emit('close')"
        >
          Cerrar
        </button>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="$emit('guardar', {})"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  repertorio?: any
  obra?: any
  plan?: any
  "repertorio-id"?: string
}

withDefaults(defineProps<Props>(), {
  title: "Modal",
})

defineEmits<{
  (e: "close"): void
  (e: "guardar", data: any): void
}>()
</script>
