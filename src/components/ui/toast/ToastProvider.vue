<script setup lang="ts">
import {useToast} from "./use-toast"
import {XMarkIcon} from "@heroicons/vue/24/outline"

const {toasts, dismiss} = useToast()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <template v-for="toast in toasts" :key="toast.id">
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3 min-w-[300px] max-w-[500px] animate-in slide-in-from-right"
        :class="{
          'border-l-4 border-l-red-500': toast.variant === 'destructive',
          'border-l-4 border-l-green-500': toast.variant === 'success',
        }"
      >
        <div class="flex-1">
          <h3 class="font-medium mb-1">{{ toast.title }}</h3>
          <p v-if="toast.description" class="text-sm text-gray-600 dark:text-gray-400">
            {{ toast.description }}
          </p>
        </div>
        <button class="text-gray-500 hover:text-gray-700" @click="dismiss(toast.id)">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.animate-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
