<template>
  <Teleport to="body">
    <div class="toast-container fixed top-4 right-4 z-50 space-y-2">
      <TransitionGroup
        name="toast"
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        move-class="transition-all duration-300"
        appear
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
          :class="getToastStyleClass(toast.type)"
        >
          <div class="p-4">
            <div class="flex items-start">
              <!-- Icon -->
              <div class="flex-shrink-0">
                <component
                  :is="getToastIcon(toast.type)"
                  class="h-6 w-6"
                  :class="getIconColorClass(toast.type)"
                />
              </div>

              <!-- Content -->
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ toast.title }}
                </p>
                <p v-if="toast.message" class="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  {{ toast.message }}
                </p>
                
                <!-- Action button -->
                <div v-if="toast.action" class="mt-3 flex space-x-7">
                  <button
                    @click="handleAction(toast)"
                    type="button"
                    class="bg-white dark:bg-gray-800 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                    :class="getActionButtonClass(toast.type)"
                  >
                    {{ toast.action.label }}
                  </button>
                </div>
              </div>

              <!-- Close button -->
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="removeToast(toast.id)"
                  class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- Progress bar for auto-dismiss -->
            <div
              v-if="toast.duration && toast.duration > 0"
              class="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1"
            >
              <div
                class="h-1 rounded-full transition-all ease-linear"
                :class="getProgressBarClass(toast.type)"
                :style="{ width: `${getProgressPercentage(toast)}%` }"
              />
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // 0 for persistent, undefined for default (5000ms)
  action?: ToastAction;
  createdAt: number;
  timeoutId?: number;
}

// State
const toasts = ref<Toast[]>([]);
const defaultDuration = 5000; // 5 seconds

// Methods
const addToast = (toast: Omit<Toast, 'id' | 'createdAt'>) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const createdAt = Date.now();
  const duration = toast.duration !== undefined ? toast.duration : defaultDuration;
  
  const newToast: Toast = {
    ...toast,
    id,
    createdAt,
    duration
  };

  toasts.value.push(newToast);

  // Auto-dismiss if duration is set
  if (duration > 0) {
    newToast.timeoutId = window.setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
};

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(toast => toast.id === id);
  if (index > -1) {
    const toast = toasts.value[index];
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }
    toasts.value.splice(index, 1);
  }
};

const clearAllToasts = () => {
  toasts.value.forEach(toast => {
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }
  });
  toasts.value = [];
};

const handleAction = (toast: Toast) => {
  if (toast.action) {
    toast.action.handler();
  }
  removeToast(toast.id);
};

// Style helpers
const getToastStyleClass = (type: ToastType) => {
  const baseClass = 'border-l-4';
  const typeClasses = {
    success: 'border-green-400',
    error: 'border-red-400',
    warning: 'border-yellow-400',
    info: 'border-blue-400'
  };
  return `${baseClass} ${typeClasses[type]}`;
};

const getToastIcon = (type: ToastType) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  };
  return icons[type];
};

const getIconColorClass = (type: ToastType) => {
  const colors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };
  return colors[type];
};

const getActionButtonClass = (type: ToastType) => {
  const classes = {
    success: 'text-green-600 hover:text-green-500 focus:ring-green-500',
    error: 'text-red-600 hover:text-red-500 focus:ring-red-500',
    warning: 'text-yellow-600 hover:text-yellow-500 focus:ring-yellow-500',
    info: 'text-blue-600 hover:text-blue-500 focus:ring-blue-500'
  };
  return classes[type];
};

const getProgressBarClass = (type: ToastType) => {
  const classes = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400',
    info: 'bg-blue-400'
  };
  return classes[type];
};

const getProgressPercentage = (toast: Toast) => {
  if (!toast.duration || toast.duration <= 0) return 0;
  
  const elapsed = Date.now() - toast.createdAt;
  const percentage = Math.max(0, Math.min(100, (elapsed / toast.duration) * 100));
  return percentage;
};

// Utility functions for external use
const showSuccess = (title: string, message?: string, options?: Partial<Toast>) => {
  return addToast({ type: 'success', title, message, ...options });
};

const showError = (title: string, message?: string, options?: Partial<Toast>) => {
  return addToast({ type: 'error', title, message, duration: 0, ...options });
};

const showWarning = (title: string, message?: string, options?: Partial<Toast>) => {
  return addToast({ type: 'warning', title, message, ...options });
};

const showInfo = (title: string, message?: string, options?: Partial<Toast>) => {
  return addToast({ type: 'info', title, message, ...options });
};

// Global toast service
const useToast = () => {
  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    remove: removeToast,
    clear: clearAllToasts
  };
};

// Cleanup on unmount
onUnmounted(() => {
  toasts.value.forEach(toast => {
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }
  });
});

// Expose methods for external use
defineExpose({
  addToast,
  removeToast,
  clearAllToasts,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  useToast
});
</script>

<style scoped>
.toast-container {
  max-width: 420px;
}

/* Animation adjustments for mobile */
@media (max-width: 640px) {
  .toast-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}

/* Toast transitions */
.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-active {
  position: absolute;
  right: 0;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .toast-container div {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .toast-move,
  .toast-enter-active,
  .toast-leave-active {
    transition: none !important;
  }
  
  .progress-bar {
    transition: none !important;
  }
}

/* Focus styles */
button:focus-visible {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}
</style>