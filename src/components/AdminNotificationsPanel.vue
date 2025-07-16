<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col"
  >
    <!-- Header -->
    <div
      class="p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0"
    >
      <div class="flex items-center">
        <svg
          class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-5 5v-5zM21 7l-5-5v5h5z"
          />
        </svg>
        <span class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white"
          >Panel de Notificaciones</span
        >
        <span
          v-if="state.unreadCount > 0"
          class="ml-2 sm:ml-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium"
        >
          {{ state.unreadCount }}
        </span>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Toggle mostrar solo no leídas -->
        <button
          :class="[
            'p-2 rounded-md transition-colors',
            state.showUnreadOnly ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100',
          ]"
          :title="state.showUnreadOnly ? 'Mostrar todas' : 'Solo no leídas'"
          @click="toggleShowUnreadOnly"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>

        <!-- Marcar todas como leídas -->
        <button
          :disabled="state.unreadCount === 0"
          class="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Marcar todas como leídas"
          @click="markAllAsRead"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        <!-- Limpiar todas -->
        <button
          :disabled="state.notifications.length === 0"
          class="p-2 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Eliminar todas las notificaciones"
          @click="clearAllNotifications"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>

        <!-- Refresh -->
        <button
          :disabled="state.isLoading"
          class="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Actualizar"
          @click="loadNotifications"
        >
          <svg
            class="w-5 h-5"
            :class="{'animate-spin': state.isLoading}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div v-if="state.stats.total > 0" class="px-6 py-3 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center justify-between text-sm text-gray-600">
        <span>Total: {{ state.stats.total }}</span>
        <span>No leídas: {{ state.stats.unread }}</span>
        <span v-if="hasHighUrgencyNotifications" class="text-red-600 flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          Urgentes
        </span>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="state.isLoading && state.notifications.length === 0"
      class="flex-1 flex items-center justify-center p-8"
    >
      <div class="text-center">
        <svg
          class="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <p class="text-gray-600">Cargando notificaciones...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="state.error" class="m-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <div class="flex">
        <svg
          class="w-5 h-5 text-red-600 mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <p class="text-red-800">{{ state.error }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredNotifications.length === 0"
      class="flex-1 flex items-center justify-center p-8"
    >
      <div class="text-center">
        <svg
          class="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-5 5v-5zM21 7l-5-5v5h5z"
          />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ state.showUnreadOnly ? "No hay notificaciones no leídas" : "No hay notificaciones" }}
        </h3>
        <p class="text-gray-600">
          {{
            state.showUnreadOnly
              ? "Todas las notificaciones han sido leídas"
              : "Las notificaciones aparecerán aquí"
          }}
        </p>
      </div>
    </div>

    <!-- Lista de notificaciones -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="divide-y divide-gray-200">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          :class="[
            'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
            !notification.read && 'bg-blue-50 border-l-4 border-blue-500',
            notification.urgency === 'high' && 'border-l-4 border-red-500',
          ]"
          @click="selectNotification(notification)"
        >
          <div class="flex items-start space-x-4">
            <!-- Avatar con icono -->
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                getUrgencyColorClasses(notification.urgency),
              ]"
            >
              <span class="text-lg">{{ getNotificationIcon(notification.type) }}</span>
            </div>

            <!-- Contenido principal -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900 truncate">
                  {{ notification.title }}
                  <span
                    v-if="!notification.read"
                    class="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    Nuevo
                  </span>
                </h4>

                <!-- Acciones -->
                <div class="flex items-center space-x-1 ml-4">
                  <!-- Marcar como leída/no leída -->
                  <button
                    :class="[
                      'p-1 rounded transition-colors',
                      notification.read
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-blue-600 hover:bg-blue-50',
                    ]"
                    :title="notification.read ? 'Leída' : 'Marcar como leída'"
                    @click.stop="markAsRead(notification.id)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        v-if="notification.read"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7"
                      />
                      <path
                        v-else
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M9 12l2 2 4-4"
                      />
                    </svg>
                  </button>

                  <!-- Eliminar -->
                  <button
                    class="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar"
                    @click.stop="deleteNotification(notification.id)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <p class="text-sm text-gray-600 mt-1 break-words">
                {{ notification.message }}
              </p>

              <!-- Metadata -->
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-gray-500">
                  {{ formatNotificationTime(notification.timestamp) }}
                </span>

                <div class="flex items-center space-x-2">
                  <!-- Chip de urgencia -->
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium border',
                      getUrgencyChipClasses(notification.urgency),
                    ]"
                  >
                    {{ notification.urgency }}
                  </span>

                  <!-- Tipo -->
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300"
                  >
                    {{ getTypeLabel(notification.type) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAdminNotifications } from '@/composables/useAdminNotifications';

// Composable
const {
  state,
  filteredNotifications,
  hasHighUrgencyNotifications,
  loadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  selectNotification,
  toggleShowUnreadOnly,
  getNotificationIcon,
  formatNotificationTime,
} = useAdminNotifications();

// Estado local del componente
const showNotificationDetails = ref(false);

// Computed para mostrar el dialog
const selectedNotification = computed(() => state.selectedNotification);

// Watch para mostrar detalles cuando se selecciona una notificación
watch(
  selectedNotification,
  (newValue) => {
    if (newValue) {
      showNotificationDetails.value = true;
    }
  },
  { immediate: false },
);

// Función para obtener etiquetas de tipo
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    teacher_login: 'Login Profesor',
    attendance_report: 'Asistencia',
    student_observation: 'Observación',
    system_notification: 'Sistema',
  };
  return labels[type] || type;
};

// Funciones para clases de Tailwind CSS basadas en urgencia
const getUrgencyColorClasses = (urgency: string): string => {
  const classes: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };
  return classes[urgency] || 'bg-gray-100 text-gray-800';
};

const getUrgencyChipClasses = (urgency: string): string => {
  const classes: Record<string, string> = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    low: 'bg-green-50 text-green-700 border-green-200',
  };
  return classes[urgency] || 'bg-gray-50 text-gray-700 border-gray-200';
};
</script>

<style scoped>
/* Los estilos están manejados por Tailwind CSS */
</style>
