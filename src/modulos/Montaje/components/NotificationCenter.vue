<template>
  <div class="space-y-4">
    <!-- Notification Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Notificaciones ({{ unreadCount }})</h3>
      <div class="flex items-center space-x-2">
        <button
          v-if="unreadCount > 0"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
          @click="markAllAsRead"
        >
          Marcar todas como leídas
        </button>
        <button
          class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          @click="refreshNotifications"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- Filter Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="filter in filterOptions"
          :key="filter.value"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="
            currentFilter === filter.value
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          "
          @click="currentFilter = filter.value"
        >
          {{ filter.label }}
          <span
            v-if="filter.count > 0"
            class="ml-2 py-0.5 px-2 rounded-full text-xs"
            :class="
              currentFilter === filter.value
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            "
          >
            {{ filter.count }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Notifications List -->
    <div v-if="filteredNotifications.length === 0" class="text-center py-8">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-5 5-5-5h5V6a1 1 0 112 0v11z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay notificaciones</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{
          currentFilter === "all"
            ? "No tienes notificaciones"
            : "No hay notificaciones en esta categoría"
        }}
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer"
        :class="{'bg-blue-50 border-blue-200': !notification.leida}"
        @click="markAsRead(notification)"
      >
        <div class="flex items-start space-x-3">
          <!-- Notification Icon -->
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            :class="getNotificationIconClass(notification.tipo)"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                v-if="notification.tipo === 'evaluacion'"
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
              <path
                v-else-if="notification.tipo === 'vencimiento'"
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"
              />
              <path
                v-else-if="notification.tipo === 'recordatorio'"
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
              <path
                v-else
                fill-rule="evenodd"
                d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <!-- Notification Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.titulo }}
              </p>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500">
                  {{ formatDate(notification.fechaCreacion) }}
                </span>
                <div v-if="!notification.leida" class="w-2 h-2 bg-blue-500 rounded-full" />
              </div>
            </div>
            <p class="text-sm text-gray-600 mt-1">
              {{ notification.mensaje }}
            </p>

            <!-- Related Entity Info -->
            <div
              v-if="notification.entidadRelacionada"
              class="mt-2 flex items-center text-xs text-gray-500"
            >
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 01-1-1V5a1 1 0 011-1h4z"
                />
              </svg>
              {{ getEntityTypeLabel(notification.entidadRelacionada.tipo) }}:
              {{ notification.entidadRelacionada.nombre }}
            </div>

            <!-- Priority Indicator -->
            <div v-if="notification.prioridad !== 'media'" class="mt-2">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="getPriorityClass(notification.prioridad)"
              >
                {{ getPriorityLabel(notification.prioridad) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex-shrink-0 flex items-center space-x-2">
            <button
              v-if="notification.accionesDisponibles.includes('ver_detalle')"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              @click.stop="viewDetails(notification)"
            >
              Ver
            </button>
            <button
              class="text-gray-400 hover:text-gray-600"
              @click.stop="dismissNotification(notification)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMoreNotifications" class="text-center pt-4">
      <button
        :disabled="isLoadingMore"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        @click="loadMoreNotifications"
      >
        <svg
          v-if="isLoadingMore"
          class="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {{ isLoadingMore ? "Cargando..." : "Cargar más" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { NotificacionMontaje } from '../types';
import { formatDate } from '../utils';

interface Props {
  notifications: NotificacionMontaje[]
  hasMoreNotifications?: boolean
  isLoadingMore?: boolean
}

interface Emits {
  (e: 'mark-as-read', notification: NotificacionMontaje): void
  (e: 'mark-all-as-read'): void
  (e: 'dismiss', notification: NotificacionMontaje): void
  (e: 'view-details', notification: NotificacionMontaje): void
  (e: 'load-more'): void
  (e: 'refresh'): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const currentFilter = ref('all');

const filterOptions = computed(() => {
  const all = props.notifications.length;
  const unread = props.notifications.filter((n) => !n.leida).length;
  const evaluations = props.notifications.filter((n) => n.tipo === 'evaluacion').length;
  const deadlines = props.notifications.filter((n) => n.tipo === 'vencimiento').length;
  const reminders = props.notifications.filter((n) => n.tipo === 'recordatorio').length;

  return [
    { value: 'all', label: 'Todas', count: all },
    { value: 'unread', label: 'No leídas', count: unread },
    { value: 'evaluacion', label: 'Evaluaciones', count: evaluations },
    { value: 'vencimiento', label: 'Vencimientos', count: deadlines },
    { value: 'recordatorio', label: 'Recordatorios', count: reminders },
  ];
});

const filteredNotifications = computed(() => {
  let filtered = props.notifications;

  switch (currentFilter.value) {
  case 'unread':
    filtered = filtered.filter((n) => !n.leida);
    break;
  case 'evaluacion':
  case 'vencimiento':
  case 'recordatorio':
    filtered = filtered.filter((n) => n.tipo === currentFilter.value);
    break;
  }

  return filtered.sort((a, b) => {
    // Sort by read status first (unread first), then by date
    if (!a.leida && b.leida) return -1;
    if (a.leida && !b.leida) return 1;
    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
  });
});

const unreadCount = computed(() => {
  return props.notifications.filter((n) => !n.leida).length;
});

const getNotificationIconClass = (type: string) => {
  switch (type) {
  case 'evaluacion':
    return 'bg-green-100 text-green-600';
  case 'vencimiento':
    return 'bg-red-100 text-red-600';
  case 'recordatorio':
    return 'bg-yellow-100 text-yellow-600';
  default:
    return 'bg-blue-100 text-blue-600';
  }
};

const getPriorityClass = (priority: string) => {
  switch (priority) {
  case 'baja':
    return 'bg-gray-100 text-gray-800';
  case 'alta':
    return 'bg-orange-100 text-orange-800';
  case 'critica':
    return 'bg-red-100 text-red-800';
  default:
    return 'bg-yellow-100 text-yellow-800';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
  case 'baja':
    return 'Baja';
  case 'alta':
    return 'Alta';
  case 'critica':
    return 'Crítica';
  default:
    return 'Media';
  }
};

const getEntityTypeLabel = (type: string) => {
  switch (type) {
  case 'obra':
    return 'Obra';
  case 'plan':
    return 'Plan';
  case 'frase':
    return 'Frase';
  default:
    return type;
  }
};

const markAsRead = (notification: NotificacionMontaje) => {
  if (!notification.leida) {
    emit('mark-as-read', notification);
  }
};

const markAllAsRead = () => {
  emit('mark-all-as-read');
};

const dismissNotification = (notification: NotificacionMontaje) => {
  emit('dismiss', notification);
};

const viewDetails = (notification: NotificacionMontaje) => {
  emit('view-details', notification);
};

const loadMoreNotifications = () => {
  emit('load-more');
};

const refreshNotifications = () => {
  emit('refresh');
};
</script>
