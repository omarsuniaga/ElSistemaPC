<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="handleBackdropClick"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" />

      <!-- Modal container -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all"
          :class="modalSizeClass"
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header || showCloseButton"
            class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center space-x-3">
              <!-- Icon -->
              <div v-if="icon" class="flex-shrink-0">
                <component
                  :is="iconComponent"
                  class="h-6 w-6"
                  :class="iconColorClass"
                />
              </div>
              
              <!-- Title -->
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  <slot name="title">{{ title }}</slot>
                </h3>
                <p v-if="subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ subtitle }}
                </p>
              </div>
            </div>

            <!-- Close button -->
            <button
              v-if="showCloseButton"
              @click="close"
              type="button"
              class="rounded-md bg-transparent p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6">
            <slot name="content">
              <p v-if="message" class="text-gray-600 dark:text-gray-300">
                {{ message }}
              </p>
            </slot>
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer || showDefaultActions"
            class="flex justify-end space-x-3 bg-gray-50 dark:bg-gray-700 px-6 py-4"
          >
            <slot name="footer">
              <template v-if="showDefaultActions">
                <button
                  v-if="showCancelButton"
                  @click="cancel"
                  type="button"
                  class="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {{ cancelText }}
                </button>
                
                <button
                  @click="confirm"
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  :class="confirmButtonClass"
                  :disabled="isLoading"
                >
                  <div v-if="isLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {{ confirmText }}
                </button>
              </template>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

export interface ModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  message?: string;
  icon?: string;
  iconType?: 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  showDefaultActions?: boolean;
  showCancelButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'success' | 'warning' | 'danger';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  isLoading?: boolean;
  preventClose?: boolean;
}

const props = withDefaults(defineProps<ModalProps>(), {
  showCloseButton: true,
  showDefaultActions: false,
  showCancelButton: true,
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  confirmType: 'primary',
  size: 'md',
  closeOnBackdrop: true,
  closeOnEscape: true,
  isLoading: false,
  preventClose: false
});

const emit = defineEmits<{
  close: [];
  confirm: [];
  cancel: [];
}>();

// Computed properties
const modalSizeClass = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  return sizes[props.size];
});

const iconComponent = computed(() => {
  if (!props.icon) return null;
  
  // Dynamic import would be better, but for simplicity using string mapping
  const iconMap: Record<string, string> = {
    'CheckCircleIcon': 'CheckCircleIcon',
    'ExclamationTriangleIcon': 'ExclamationTriangleIcon',
    'XCircleIcon': 'XCircleIcon',
    'InformationCircleIcon': 'InformationCircleIcon'
  };
  
  return iconMap[props.icon] || props.icon;
});

const iconColorClass = computed(() => {
  if (!props.iconType) return 'text-gray-400';
  
  const colors = {
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    info: 'text-blue-500'
  };
  
  return colors[props.iconType];
});

const confirmButtonClass = computed(() => {
  const baseClass = 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
  
  const typeClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
  };
  
  return typeClasses[props.confirmType] || baseClass;
});

// Methods
const close = () => {
  if (props.preventClose) return;
  emit('close');
};

const confirm = () => {
  if (props.isLoading) return;
  emit('confirm');
};

const cancel = () => {
  if (props.preventClose) return;
  emit('cancel');
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close();
  }
};

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && props.isOpen) {
    close();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
  
  // Prevent body scroll when modal is open
  if (props.isOpen) {
    document.body.style.overflow = 'hidden';
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
  document.body.style.overflow = '';
});

// Watch for isOpen changes to manage body scroll
// Note: In a real implementation, you might want to use a watcher here
</script>

<style scoped>
/* Modal animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Focus trap styles */
.modal-focus-trap {
  position: relative;
}

/* Backdrop blur effect */
.backdrop-blur {
  backdrop-filter: blur(4px);
}

/* Prevent text selection on backdrop */
.backdrop {
  user-select: none;
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .modal-container {
    margin: 1rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .modal-backdrop {
    background-color: rgba(0, 0, 0, 0.8);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .animate-spin {
    transition: none !important;
    animation: none !important;
  }
}

/* Dark mode improvements */
.dark .modal-content {
  border: 1px solid rgb(55 65 81);
}

/* Focus styles for accessibility */
button:focus-visible {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}
</style>