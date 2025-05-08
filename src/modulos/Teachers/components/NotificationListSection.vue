<script setup lang="ts">
import { defineProps } from 'vue';

interface Notification {
  id: number;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'info' | 'reminder'; // Add more types if needed
}

const props = defineProps<{
  notifications: Notification[];
}>();
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <h2 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Notificaciones</h2>
    <div v-if="notifications.length > 0" class="space-y-3">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
        :class="{
          'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500': notification.type === 'info' && !notification.read,
          'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500': notification.type === 'reminder' && !notification.read
        }"
      >
        <div class="flex justify-between">
          <h3 class="font-medium text-gray-800 dark:text-gray-200">{{ notification.title }}</h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(notification.date) }}
          </span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ notification.message }}</p>
      </div>
    </div>
    <p v-else class="text-center text-gray-500 dark:text-gray-400 py-3 text-gray-500 dark:text-gray-400">No hay notificaciones.</p>
  </div>
</template>

<style scoped>
/* Add any specific styles for the notifications section here */
</style>