<template>
  <TransitionRoot appear :show="show">
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
            class="inline-block w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle md:max-w-xl"
          >
            <div class="modal-header border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <DialogTitle
                as="h3"
                class="text-lg font-medium leading-6 text-gray-900 dark:text-white"
              >
                {{ title }}
              </DialogTitle>
              <button
                class="modal-close-btn ml-auto -mr-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
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

            <div class="modal-body px-6 py-4 dark:text-gray-200">
              <div class="max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar">
                <slot />
              </div>
            </div>

            <div
              v-if="$slots.footer"
              class="modal-footer border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <slot name="footer" />
            </div>
          </div>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {Dialog, DialogOverlay, DialogTitle, TransitionRoot, TransitionChild} from "@headlessui/vue"

defineProps<{
  show: boolean
  title: string
}>()

defineEmits<{
  (e: "close"): void
}>()
</script>

<script lang="ts">
export default {
  name: "Modal",
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 50;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-body {
  color: #374151;
}

/* Estilos para la barra de desplazamiento personalizada */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* Dark mode para scrollbar */
@media (prefers-color-scheme: dark) {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #475569;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #64748b;
  }
}

/* Transiciones para el modal */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
