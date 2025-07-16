<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
    <transition-group name="notification">
      <div
        v-for="notification in notifications"
        v-show="notification.visible"
        :key="notification.id"
        :class="[
          'p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300',
          'flex items-start gap-3',
          getNotificationClass(notification.type),
        ]"
      >
        <div class="flex-shrink-0">
          <CheckCircleIcon v-if="notification.type === 'success'" class="w-5 h-5" />
          <ExclamationTriangleIcon v-else-if="notification.type === 'warning'" class="w-5 h-5" />
          <XCircleIcon v-else-if="notification.type === 'error'" class="w-5 h-5" />
          <InformationCircleIcon v-else class="w-5 h-5" />
        </div>

        <div class="flex-1">
          <h3 class="font-medium text-sm">{{ notification.title }}</h3>
          <p class="text-xs mt-1">{{ notification.message }}</p>
        </div>

        <button
          class="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
          @click="$emit('dismiss', notification.id)"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts" setup>
// src/components/NotificationSystem.vue
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/20/solid';

const notifications = ref([]);

const getNotificationClass = (type) => {
  const classes = {
    success: 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-100',
    warning:
      'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    error: 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-100',
    info: 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  };
  return classes[type] || classes.info;
};
</script>
<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.5s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
