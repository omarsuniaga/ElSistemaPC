<template>
  <Transition name="toast">
    <div v-if="show" 
      :class="[
        'fixed z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 flex items-center',
        'max-w-[90vw] sm:max-w-md',
        position === 'top-right' ? 'top-4 right-4' : 
        position === 'top-left' ? 'top-4 left-4' : 
        position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4',
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
      ]"
    >
      <!-- Icono según el tipo -->
      <span class="mr-2">
        <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </span>
      
      <!-- Mensaje -->
      <div class="flex-1">{{ message }}</div>
      
      <!-- Botón cerrar -->
      <button v-if="dismissible" @click="close" class="ml-3 text-white opacity-70 hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (val) => ['success', 'error', 'warning', 'info'].includes(val)
  },
  duration: {
    type: Number,
    default: 3000 // 3 segundos por defecto
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (val) => ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(val)
  },
  dismissible: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:show', 'close']);

// Timer para auto-cerrar el toast
let timer = null;

const close = () => {
  emit('update:show', false);
  emit('close');
};

// Reiniciar timer cuando cambian las props
watch(() => [props.show, props.duration], ([newShow, newDuration]) => {
  if (newShow && newDuration > 0) {
    setupTimer();
  }
});

const setupTimer = () => {
  clearTimeout(timer);
  if (props.duration > 0) {
    timer = setTimeout(() => {
      close();
    }, props.duration);
  }
};

onMounted(() => {
  if (props.show && props.duration > 0) {
    setupTimer();
  }
});

onBeforeUnmount(() => {
  clearTimeout(timer);
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>