<template>
  <div class="relative">
    <button
      class="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      :class="{'text-gray-800': isOpen}"
      @click="toggle"
    >
      <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-5 5v-5z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 7v6a2 2 0 002 2h2"
        />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 3l4 4-4 4" />
      </svg>
      <span class="hidden sm:block">Notificaciones</span>
      <span
        v-if="notificationCount > 0"
        class="ml-1 px-2 py-1 text-xs bg-red-500 text-white rounded-full"
      >
        {{ notificationCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50"
    >
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800">Notificaciones</h3>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div v-if="notifications.length === 0" class="p-4 text-center text-gray-500">
          No hay notificaciones
        </div>

        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          :class="{'bg-blue-50': !notification.read}"
        >
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                :class="getNotificationTypeClass(notification.type)"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    v-if="notification.type === 'info'"
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                  <path
                    v-else-if="notification.type === 'warning'"
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                  <path
                    v-else-if="notification.type === 'error'"
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                  <path
                    v-else
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.title }}
              </p>
              <p class="text-sm text-gray-600 mt-1">
                {{ notification.message }}
              </p>
              <p class="text-xs text-gray-400 mt-2">
                {{ formatDate(notification.timestamp) }}
              </p>
            </div>

            <div class="flex-shrink-0">
              <button
                v-if="!notification.read"
                class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                @click="markAsRead(notification.id)"
              >
                Marcar leído
              </button>
              <button
                class="ml-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                @click="dismissNotification(notification.id)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="notifications.length > 0" class="p-4 border-t border-gray-200">
        <button
          class="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          @click="markAllAsRead"
        >
          Marcar todas como leídas
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

const isOpen = ref(false);
const notifications = ref<Notification[]>([]);

const notificationCount = computed(() => notifications.value.filter((n) => !n.read).length);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const getNotificationTypeClass = (type: string) => {
  const classes = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    success: 'bg-green-500',
  };
  return classes[type as keyof typeof classes] || 'bg-gray-500';
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const markAsRead = (id: string) => {
  const notification = notifications.value.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
  }
};

const dismissNotification = (id: string) => {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

const markAllAsRead = () => {
  notifications.value.forEach((notification) => {
    notification.read = true;
  });
};

const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
  notifications.value.unshift({
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date(),
  });
};

// Simular algunas notificaciones de ejemplo
onMounted(() => {
  // Ejemplo de notificaciones del sistema
  addNotification({
    type: 'info',
    title: 'Sistema actualizado',
    message: 'El sistema se ha actualizado correctamente',
    read: false,
  });

  addNotification({
    type: 'warning',
    title: 'Mantenimiento programado',
    message: 'Mantenimiento del servidor programado para mañana',
    read: false,
  });
});

// Cerrar dropdown al hacer clic fuera
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  const dropdown = target.closest('.relative');
  if (!dropdown) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Exponer métodos para uso externo
defineExpose({
  addNotification,
  markAsRead,
  dismissNotification,
  markAllAsRead,
});
</script>
