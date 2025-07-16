<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div :class="['modal-container', `modal-${size}`]" role="dialog" aria-modal="true">
          <header v-if="title || $slots.header" class="modal-header">
            <slot name="header">
              <h3 v-if="title" class="modal-title">{{ title }}</h3>
            </slot>

            <button
              v-if="!persistent"
              class="modal-close"
              aria-label="Cerrar modal"
              @click="closeModal"
            >
              &times;
            </button>
          </header>

          <div class="modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  size: 'md',
  persistent: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>();

const showModal = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newVal) => {
    showModal.value = newVal;
    if (newVal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  },
);

watch(
  () => showModal.value,
  (newVal) => {
    emit('update:modelValue', newVal);
    if (!newVal) {
      emit('close');
    }
  },
);

const closeModal = () => {
  if (!props.persistent) {
    showModal.value = false;
  }
};

// Cerrar modal con escape
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && !props.persistent) {
    showModal.value = false;
  }
};

// Agregar/remover event listener
watch(
  () => showModal.value,
  (newVal) => {
    if (newVal) {
      document.addEventListener('keydown', handleKeydown);
    } else {
      document.removeEventListener('keydown', handleKeydown);
    }
  },
);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
  width: 90%;
}

.modal-sm {
  max-width: 300px;
}
.modal-md {
  max-width: 500px;
}
.modal-lg {
  max-width: 800px;
}
.modal-xl {
  max-width: 1140px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: #718096;
}

.modal-close:hover {
  color: #1a202c;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Transiciones */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
