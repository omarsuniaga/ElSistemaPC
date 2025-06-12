<script setup lang="ts">
import { defineProps } from 'vue';
import { useTeacherNotifications } from '../composables/useTeacherNotifications';
import TeacherNotificationsList from './TeacherNotificationsList.vue';

// Props originales para compatibilidad (si se necesitan)
interface Notification {
  id: number;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'info' | 'reminder';
}

const props = defineProps<{
  notifications?: Notification[]; // Opcional para mantener compatibilidad
}>();

// Usar el composable de notificaciones de maestros
const {
  notifications: teacherNotifications,
  isLoading,
  error,
  acceptInvitation,
  rejectInvitation,
  markAsRead,
  deleteNotificationItem,
  loadNotifications
} = useTeacherNotifications();

// Manejadores de eventos
const handleAcceptInvitation = async (notificationId: string) => {
  await acceptInvitation(notificationId);
};

const handleRejectInvitation = async (notificationId: string) => {
  await rejectInvitation(notificationId);
};

const handleMarkAsRead = async (notificationId: string) => {
  await markAsRead(notificationId);
};

const handleDeleteNotification = async (notificationId: string) => {
  await deleteNotificationItem(notificationId);
};

const handleRetry = async () => {
  await loadNotifications();
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <!-- Usar el nuevo componente de notificaciones de maestros -->
    <TeacherNotificationsList
      :notifications="teacherNotifications"
      :is-loading="isLoading"
      :error="error"
      @accept-invitation="handleAcceptInvitation"
      @reject-invitation="handleRejectInvitation"
      @mark-as-read="handleMarkAsRead"
      @delete-notification="handleDeleteNotification"
      @retry="handleRetry"
    />
    
    <!-- Fallback para notificaciones originales (si existen) -->
    <div v-if="props.notifications && props.notifications.length > 0" class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 class="text-md font-medium text-gray-900 dark:text-white mb-3">Otras Notificaciones</h3>
      <div class="space-y-3">
        <div
          v-for="notification in props.notifications"
          :key="notification.id"
          class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          :class="{
            'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500': notification.type === 'info' && !notification.read,
            'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500': notification.type === 'reminder' && !notification.read
          }"
        >
          <div class="flex justify-between">
            <h4 class="font-medium text-gray-800 dark:text-gray-200">{{ notification.title }}</h4>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(notification.date) }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ notification.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos para la sección de notificaciones */
</style>