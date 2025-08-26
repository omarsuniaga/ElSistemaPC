<template>
  <div class="notification-center relative" ref="notificationRef">
    <!-- Notification Bell Button -->
    <button
      @click="toggleNotifications"
      class="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md transition-colors"
    >
      <BellIcon class="h-6 w-6" />
      
      <!-- Unread count badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-pulse"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Notifications Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-1"
    >
      <div
        v-show="isOpen"
        class="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Notificaciones
            </h3>
            <div class="flex items-center space-x-2">
              <!-- Mark all as read -->
              <button
                v-if="unreadCount > 0"
                @click="markAllAsRead"
                class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Marcar todas
              </button>
              
              <!-- Settings -->
              <button
                @click="openSettings"
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
              >
                <CogIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="flex border-b border-gray-200 dark:border-gray-700">
          <button
            v-for="filter in filterOptions"
            :key="filter.key"
            @click="activeFilter = filter.key"
            :class="[
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeFilter === filter.key
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            {{ filter.label }}
            <span v-if="filter.count > 0" class="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
              {{ filter.count }}
            </span>
          </button>
        </div>

        <!-- Notifications list -->
        <div class="max-h-96 overflow-y-auto">
          <!-- Loading state -->
          <div v-if="isLoading" class="p-4 text-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Cargando notificaciones...</p>
          </div>

          <!-- Empty state -->
          <div v-else-if="filteredNotifications.length === 0" class="p-6 text-center">
            <BellSlashIcon class="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No hay notificaciones
            </h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ activeFilter === 'all' ? 'No tienes notificaciones' : 'No hay notificaciones de este tipo' }}
            </p>
          </div>

          <!-- Notifications -->
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="notification in filteredNotifications"
              :key="notification.id"
              class="notification-item p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              :class="{ 'bg-blue-50 dark:bg-blue-900/20': !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="flex items-start space-x-3">
                <!-- Icon -->
                <div class="flex-shrink-0">
                  <div :class="getNotificationIconClasses(notification.type)" class="w-8 h-8 rounded-full flex items-center justify-center">
                    <component :is="getNotificationIcon(notification.type)" class="h-4 w-4" />
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p :class="['text-sm font-medium', notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-white']">
                        {{ notification.title }}
                      </p>
                      <p :class="['text-xs mt-1', notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300']">
                        {{ notification.message }}
                      </p>
                    </div>
                    
                    <!-- Unread indicator -->
                    <div v-if="!notification.read" class="flex-shrink-0 ml-2">
                      <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="flex items-center justify-between mt-2">
                    <time class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatTime(notification.createdAt) }}
                    </time>
                    
                    <!-- Actions -->
                    <div class="flex items-center space-x-2">
                      <button
                        v-if="!notification.read"
                        @click.stop="markAsRead(notification.id)"
                        class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Marcar leída
                      </button>
                      
                      <button
                        @click.stop="deleteNotification(notification.id)"
                        class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="viewAllNotifications"
            class="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  BellIcon,
  BellSlashIcon,
  CogIcon,
  UserIcon,
  BookOpenIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'student' | 'class' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  data?: any;
}

// State
const router = useRouter();
const notificationRef = ref<HTMLElement>();
const isOpen = ref(false);
const isLoading = ref(false);
const activeFilter = ref('all');

// Mock notifications data
const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'student',
    title: 'Nuevo estudiante registrado',
    message: 'Ana García se inscribió en Piano Intermedio',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    actionUrl: '/admin/students'
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pago recibido',
    message: 'Carlos López completó el pago de mensualidad',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    actionUrl: '/admin/payments'
  },
  {
    id: '3',
    type: 'class',
    title: 'Clase cancelada',
    message: 'Violín Avanzado - Viernes cancelada por el maestro',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    actionUrl: '/admin/classes'
  },
  {
    id: '4',
    type: 'warning',
    title: 'Baja asistencia',
    message: 'Guitarra Principiantes tiene 60% de asistencia',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    actionUrl: '/admin/reports/attendance'
  },
  {
    id: '5',
    type: 'system',
    title: 'Actualización de sistema',
    message: 'Sistema actualizado a versión 2.1.0',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  }
]);

// Computed
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

const filterOptions = computed(() => [
  { key: 'all', label: 'Todas', count: notifications.value.length },
  { key: 'unread', label: 'Sin leer', count: unreadCount.value },
  { key: 'student', label: 'Estudiantes', count: notifications.value.filter(n => n.type === 'student').length },
  { key: 'class', label: 'Clases', count: notifications.value.filter(n => n.type === 'class').length },
  { key: 'payment', label: 'Pagos', count: notifications.value.filter(n => n.type === 'payment').length }
]);

const filteredNotifications = computed(() => {
  let filtered = notifications.value;

  if (activeFilter.value === 'unread') {
    filtered = filtered.filter(n => !n.read);
  } else if (activeFilter.value !== 'all') {
    filtered = filtered.filter(n => n.type === activeFilter.value);
  }

  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
});

// Methods
const toggleNotifications = () => {
  isOpen.value = !isOpen.value;
};

const closeNotifications = () => {
  isOpen.value = false;
};

const markAsRead = (notificationId: string) => {
  const notification = notifications.value.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
};

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true);
};

const deleteNotification = (notificationId: string) => {
  const index = notifications.value.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
};

const handleNotificationClick = (notification: Notification) => {
  markAsRead(notification.id);
  
  if (notification.actionUrl) {
    router.push(notification.actionUrl);
    closeNotifications();
  }
};

const openSettings = () => {
  router.push('/admin/settings/notifications');
  closeNotifications();
};

const viewAllNotifications = () => {
  router.push('/admin/notifications');
  closeNotifications();
};

const getNotificationIcon = (type: string) => {
  const icons = {
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
    student: UserIcon,
    class: BookOpenIcon,
    payment: CurrencyDollarIcon,
    system: CogIcon,
  };
  return icons[type as keyof typeof icons] || InformationCircleIcon;
};

const getNotificationIconClasses = (type: string) => {
  const classes = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    student: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    class: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    payment: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    system: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
};

// Handle clicks outside to close
const handleClickOutside = (event: Event) => {
  if (notificationRef.value && !notificationRef.value.contains(event.target as Node)) {
    closeNotifications();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Simulate real-time notifications
onMounted(() => {
  // Simulate receiving a new notification every 30 seconds (for demo)
  const interval = setInterval(() => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: 'info',
      title: 'Notificación en tiempo real',
      message: 'Esta es una notificación de ejemplo generada automáticamente',
      read: false,
      createdAt: new Date(),
    };
    notifications.value.unshift(newNotification);
  }, 30000);

  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>

<style scoped>
.notification-center {
  position: relative;
  z-index: 50;
}

.notification-item {
  position: relative;
}

.notification-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.notification-item:hover::before {
  background-color: #3b82f6;
}

/* Smooth animations */
.notification-item {
  transition: all 0.2s ease;
}

.notification-item:hover {
  transform: translateX(2px);
}

/* Custom scrollbar */
.max-h-96::-webkit-scrollbar {
  width: 4px;
}

.max-h-96::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.dark .max-h-96::-webkit-scrollbar-track {
  background: #374151;
}

.max-h-96::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.dark .max-h-96::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark .max-h-96::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Badge animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .8;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>