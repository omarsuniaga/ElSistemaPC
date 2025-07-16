<template>
  <div
    v-if="visible"
    class="fixed top-4 right-4 p-4 rounded-md shadow-lg text-white z-50 transition-opacity duration-300"
    :class="toastClasses"
    role="alert"
  >
    <div class="flex items-center">
      <span class="font-medium mr-2">{{ title }}</span>
      <p>{{ message }}</p>
    </div>
    <button class="absolute top-1 right-1 text-xl leading-none" @click="dismissToast">
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String as () => 'success' | 'error' | 'info' | 'warning',
    default: 'info',
  },
  duration: {
    type: Number,
    default: 3000, // ms
  },
});

const visible = ref(true);
let timeoutId: number | null = null;

const toastClasses = computed(() => {
  return {
    'bg-green-500': props.type === 'success',
    'bg-red-500': props.type === 'error',
    'bg-blue-500': props.type === 'info',
    'bg-yellow-500': props.type === 'warning',
    'opacity-0': !visible.value,
    'opacity-100': visible.value,
  };
});

const title = computed(() => {
  switch (props.type) {
  case 'success':
    return 'Éxito!';
  case 'error':
    return 'Error!';
  case 'warning':
    return 'Advertencia!';
  case 'info':
  default:
    return 'Información';
  }
});

const dismissToast = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  visible.value = false;
  // Emit dismiss event after the fade-out animation could complete
  setTimeout(() => {
    emit('dismiss');
  }, 300); // Corresponds to transition-opacity duration-300
};

onMounted(() => {
  if (props.duration > 0) {
    timeoutId = window.setTimeout(dismissToast, props.duration);
  }
});

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});

// Watch for external changes to message to reset visibility and timer
watch(
  () => props.message,
  () => {
    visible.value = true;
    if (timeoutId) clearTimeout(timeoutId);
    if (props.duration > 0) {
      timeoutId = window.setTimeout(dismissToast, props.duration);
    }
  },
);
</script>

<style scoped>
/* Ensure smooth transition */
.transition-opacity {
  transition: opacity 0.3s ease-in-out;
}
</style>
