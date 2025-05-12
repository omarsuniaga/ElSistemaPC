<template>
  <Transition name="toast">
    <div
      v-if="isVisible"
      class="fixed z-50 max-w-xs w-full shadow-lg rounded-lg border overflow-hidden transition-all duration-300"
      :class="[getPositionClasses(), getTypeClasses()]"
    >
      <div class="p-3 flex items-start space-x-2">
        <div class="flex-shrink-0">
          <component :is="getIcon()" class="h-5 w-5" :class="getIconClasses()" />
        </div>
        <div class="flex-1">
          <p class="text-sm">{{ message }}</p>
        </div>
        <div>
          <button @click="closeToast" class="text-gray-500 hover:text-gray-700">
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
      <!-- Barra de progreso que se reduce según la duración -->
      <div class="h-1 transition-all ease-linear bg-opacity-30"
           :class="{'bg-green-500': type === 'success', 'bg-red-500': type === 'error', 
                   'bg-yellow-500': type === 'warning', 'bg-blue-500': type === 'info' || !type}"
           :style="{
             width: '100%', 
             animationName: 'toast-progress',
             animationDuration: `${props.duration || defaultDuration}ms`,
             animationTimingFunction: 'linear',
             animationFillMode: 'forwards'
           }">
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number; // Duración en milisegundos
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Valor predeterminado para duración si no se proporciona
const defaultDuration = 3000; // 3 segundos
let timeoutId: number | null = null;

const isVisible = ref(props.show);

const closeToast = () => {
  isVisible.value = false;
  emit('close');
  
  // Limpiar cualquier timeout existente
  if (timeoutId !== null) {
    window.clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const startAutoHideTimer = () => {
  // Limpiar timeout existente si hay uno
  if (timeoutId !== null) {
    window.clearTimeout(timeoutId);
  }
  
  // Usar la duración de props o el valor predeterminado
  const duration = props.duration || defaultDuration;
  
  // Establecer nuevo timeout
  timeoutId = window.setTimeout(() => {
    closeToast();
  }, duration);
};

watch(() => props.show, (newVal) => {
  isVisible.value = newVal;
  
  if (newVal) {
    startAutoHideTimer();
  } else if (timeoutId !== null) {
    window.clearTimeout(timeoutId);
    timeoutId = null;
  }
});

onMounted(() => {
  if (props.show) {
    startAutoHideTimer();
  }
});

onBeforeUnmount(() => {
  if (timeoutId !== null) {
    window.clearTimeout(timeoutId);
  }
});

const getIcon = () => {
  switch (props.type) {
    case 'success':
      return CheckCircleIcon;
    case 'error':
      return XCircleIcon;
    case 'warning':
      return ExclamationTriangleIcon;
    case 'info':
      return InformationCircleIcon;
    default:
      return InformationCircleIcon;
  }
};

const getPositionClasses = () => {
  switch (props.position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'top-right':
    default:
      return 'top-4 right-4';
  }
};

const getTypeClasses = () => {
  switch (props.type) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800';
  }
};

const getIconClasses = () => {
  switch (props.type) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
    default:
      return 'text-blue-500';
  }
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}
</style>