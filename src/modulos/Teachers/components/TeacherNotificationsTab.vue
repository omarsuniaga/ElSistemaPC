<script setup lang="ts">
import type { Notification } from '../../../types/notifications'; // Assuming types are moved
import { NotificationType } from '../../../types/notifications'; // Import the enum

const props = defineProps<{ 
  notifications: Notification[];
}>();

</script>

<template>
  <div class="space-y-6">
    
    <!-- Notifications -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 class="text-lg font-semibold mb-3">Notificaciones</h2>
      <div v-if="notifications.length > 0" class="space-y-3">
        <div 
          v-for="notification in props.notifications" 
          :key="notification.id"
          :class="{
            'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500': notification.type === NotificationType.Info && !notification.read,
            'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500': notification.type === NotificationType.Reminder && !notification.read
          }"
        >
          <div class="flex justify-between">
            <h3 class="font-medium">{{ notification.title }}</h3>
            <span class="text-xs text-gray-500">
              {{ new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(new Date(notification.date)) }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ notification.message }}</p>
        </div>
      </div>
      <p v-else class="text-center text-gray-500 dark:text-gray-400 py-3">No hay notificaciones.</p>
    </div>
  </div>
</template>
