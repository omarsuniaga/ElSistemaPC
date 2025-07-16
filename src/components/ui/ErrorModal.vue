<template>
  <TransitionRoot appear :show="!!message">
    <Dialog as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="$emit('close')">
      <div class="min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <DialogOverlay class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <!-- Este elemento es para centrar el modal -->
        <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true"
          >&#8203;</span
        >

        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            class="inline-block w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-md sm:align-middle"
          >
            <!-- Header -->
            <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <!-- Error Icon -->
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg
                      class="h-5 w-5 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <DialogTitle
                    as="h3"
                    class="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Error
                  </DialogTitle>
                </div>
                <button
                  class="ml-auto -mr-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  aria-label="Cerrar"
                  @click="$emit('close')"
                >
                  <svg
                    class="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="px-6 py-4">
              <div class="text-sm text-gray-600 dark:text-gray-300">
                <p>{{ message }}</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex justify-end">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  @click="$emit('close')"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';

defineProps<{
  message: string | null
}>();

defineEmits<{
  (e: 'close'): void
}>();
</script>

<script lang="ts">
export default {
  name: 'ErrorModal',
};
</script>
