<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center"
  >
    <div class="bg-white rounded-lg shadow-lg p-4 max-w-md w-full">
      <h2 class="text-lg font-bold mb-2">{{ title }}</h2>
      <p class="text-gray-600 mb-4">{{ message }}</p>
      <div class="flex justify-end gap-2 mt-4">
        <button
          :disabled="isLoading"
          class="bg-gray-200 hover:bg-gray-300 text-gray-600 py-2 px-4 rounded-lg font-medium"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button
          :disabled="isLoading"
          class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
          @click="handleConfirm"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from "vue"

export default defineComponent({
  name: "ConfirmModal",
  props: {
    show: {
      type: Boolean,
      required: true,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["confirm", "cancel"],
  setup(_, {emit}) {
    const handleConfirm = () => {
      emit("confirm")
    }

    const handleCancel = () => {
      emit("cancel")
    }

    return {
      handleConfirm,
      handleCancel,
    }
  },
})
</script>

<style scoped>
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
