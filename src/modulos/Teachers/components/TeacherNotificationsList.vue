<template>
  <div class="space-y-4">
    <!-- Header con contador -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Notificaciones</h3>
      <div v-if="unreadCount > 0" class="flex items-center space-x-2">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          {{ unreadCount }} sin leer
        </span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex space-x-2 overflow-x-auto pb-2">
      <button
        v-for="filter in filters"
        :key="filter.value"
        :class="[
          'px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors',
          activeFilter === filter.value
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
        ]"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
        <span v-if="filter.count > 0" class="ml-1 text-xs"> ({{ filter.count }}) </span>
      </button>
    </div>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4"
    >
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-400">
            Error al cargar notificaciones
          </h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">
            {{ error }}
          </p>
          <button
            class="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 underline"
            @click="$emit('retry')"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    </div>

    <!-- Lista de notificaciones -->
    <div v-else-if="filteredNotifications.length > 0" class="space-y-3">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        :class="[
          'p-4 rounded-lg border transition-all duration-200 hover:shadow-md',
          notification.status === 'pending' || notification.status === 'unread'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600',
        ]"
      >
        <!-- Header de la notificación -->
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <!-- Icono según tipo -->
            <div
              :class="[
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                notification.type === 'class-invitation'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-gray-100 dark:bg-gray-700',
              ]"
            >
              <UserPlusIcon
                v-if="notification.type === 'class-invitation'"
                class="w-4 h-4 text-blue-600 dark:text-blue-400"
              />
              <BellIcon v-else class="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>

            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ notification.title }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ notification.message }}
              </p>
            </div>
          </div>

          <!-- Estado y tiempo -->
          <div class="flex flex-col items-end space-y-1">
            <span
              :class="[
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                getStatusStyle(notification.status),
              ]"
            >
              {{ getStatusLabel(notification.status) }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatNotificationTime(notification.createdAt) }}
            </span>
          </div>
        </div>

        <!-- Detalles adicionales para invitaciones -->
        <div v-if="notification.type === 'class-invitation'" class="mt-3 pl-11">
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-700 dark:text-gray-300">Clase:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                notification.className
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-700 dark:text-gray-300">De:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                notification.fromUserName
              }}</span>
            </div>
          </div>

          <!-- Botones de acción para invitaciones pendientes -->
          <div v-if="notification.status === 'pending'" class="mt-3 flex space-x-2">
            <button
              :disabled="isProcessing"
              class="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="$emit('accept-invitation', notification.id!)"
            >
              <CheckIcon class="w-4 h-4 inline mr-1" />
              Aceptar
            </button>
            <button
              :disabled="isProcessing"
              class="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="$emit('reject-invitation', notification.id!)"
            >
              <XMarkIcon class="w-4 h-4 inline mr-1" />
              Rechazar
            </button>
          </div>
        </div>

        <!-- Botones de acción generales -->
        <div class="mt-3 pl-11 flex items-center justify-between">
          <div class="flex space-x-2">
            <button
              v-if="notification.status === 'unread'"
              class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 underline"
              @click="$emit('mark-as-read', notification.id!)"
            >
              Marcar como leída
            </button>
          </div>

          <button
            class="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 underline"
            @click="$emit('delete-notification', notification.id!)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-8">
      <BellIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay notificaciones</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{
          activeFilter === "all"
            ? "No tienes notificaciones."
            : "No hay notificaciones en esta categoría."
        }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserPlusIcon,
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

import type { TeacherNotification } from '../services/teacherNotifications';

interface Props {
  notifications: TeacherNotification[]
  isLoading?: boolean
  error?: string | null
  isProcessing?: boolean
}

interface Emits {
  (e: 'accept-invitation', notificationId: string): void
  (e: 'reject-invitation', notificationId: string): void
  (e: 'mark-as-read', notificationId: string): void
  (e: 'delete-notification', notificationId: string): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  isProcessing: false,
});

defineEmits<Emits>();

// Filtro activo
const activeFilter = ref<'all' | 'pending' | 'invitations' | 'general'>('all');

// Computed properties
const unreadCount = computed(
  () => props.notifications.filter((n) => n.status === 'unread' || n.status === 'pending').length,
);

const pendingInvitationsCount = computed(
  () =>
    props.notifications.filter((n) => n.type === 'class-invitation' && n.status === 'pending')
      .length,
);

const generalNotificationsCount = computed(
  () => props.notifications.filter((n) => n.type === 'general').length,
);

const filteredNotifications = computed(() => {
  switch (activeFilter.value) {
  case 'pending':
    return props.notifications.filter((n) => n.status === 'pending');
  case 'invitations':
    return props.notifications.filter((n) => n.type === 'class-invitation');
  case 'general':
    return props.notifications.filter((n) => n.type === 'general');
  default:
    return props.notifications;
  }
});

const filters = computed(() => [
  { value: 'all', label: 'Todas', count: props.notifications.length },
  { value: 'pending', label: 'Pendientes', count: unreadCount.value },
  { value: 'invitations', label: 'Invitaciones', count: pendingInvitationsCount.value },
  { value: 'general', label: 'Generales', count: generalNotificationsCount.value },
]);

// Métodos auxiliares
const getStatusLabel = (status: string) => {
  switch (status) {
  case 'pending':
    return 'Pendiente';
  case 'accepted':
    return 'Aceptada';
  case 'rejected':
    return 'Rechazada';
  case 'read':
    return 'Leída';
  case 'unread':
    return 'Sin leer';
  default:
    return status;
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
  case 'pending':
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  case 'accepted':
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  case 'rejected':
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  case 'read':
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  case 'unread':
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  default:
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const formatNotificationTime = (date: Date | string | {toDate: () => Date}) => {
  const notificationDate =
    typeof date === 'string' ? new Date(date) : date instanceof Date ? date : date.toDate(); // Convert Timestamp-like objects to Date
  return formatDistanceToNow(notificationDate, { addSuffix: true, locale: es });
};
</script>

<style scoped>
/* Estilos adicionales si es necesario */
</style>
