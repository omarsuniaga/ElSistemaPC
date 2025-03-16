<template>
  <Transition name="modal">
    <Dialog v-if="show" as="div" class="modal-overlay" @close="$emit('close')">
      <div class="modal-content dark:bg-gray-800" @click.stop>
        <DialogOverlay class="fixed inset-0 bg-black opacity-30" />
        <div class="modal-header dark:border-gray-700">
          <DialogTitle class="modal-title dark:text-gray-100">{{ title }}</DialogTitle>
          <button class="modal-close dark:text-gray-400 dark:hover:text-gray-200" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body dark:text-gray-200">
          <slot></slot>
        </div>
        <div v-if="$slots.footer" class="modal-footer dark:border-gray-700">
          <slot name="footer"></slot>
        </div>
      </div>
    </Dialog>
  </Transition>
</template>

<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle } from '@headlessui/vue'

const props = defineProps<{
  show: boolean
  title: string
}>()
defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.modal-content {
  background-color: white;
  border-radius: 8px;
  max-width: 90%;
  width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937; /* gray-800 */
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #64748b;
  transition: color 0.2s;
  border-radius: 9999px;
}
.modal-close:hover {
  color: #334155;
  background-color: rgba(0, 0, 0, 0.05);
}
.modal-body {
  padding: 1rem;
  overflow-y: auto;
  color: #374151; /* gray-700 */
}
.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
/* Soporte para modo oscuro a través de CSS Variables */
@media (prefers-color-scheme: dark) {
  .modal-content {
    background-color: var(--dark-bg, #1f2937);
  }
  .modal-title {
    color: var(--dark-text, #f9fafb);
  }
  .modal-body {
    color: var(--dark-text-secondary, #e5e7eb);
  }
  .modal-header, .modal-footer {
    border-color: var(--dark-border, #374151);
  }
  .modal-close {
    color: var(--dark-text-secondary, #9ca3af);
  }
  .modal-close:hover {
    color: var(--dark-text, #f9fafb);
    background-color: rgba(255, 255, 255, 0.1);
  }
}
/* Transiciones */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

<script lang="ts">
export default {
  name: 'Modal'
}
</script>
