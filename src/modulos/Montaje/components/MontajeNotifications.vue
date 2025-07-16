<template>
  <div class="relative">
    <!-- Notification Bell -->
    <button
      class="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      @click="toggleNotifications"
    >
      <span class="text-xl">🔔</span>
      <span 
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Notifications Dropdown -->
    <div 
      v-if="showNotifications"
      class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
    >
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Notificaciones</h3>
          <div class="flex gap-2">
            <button
              class="text-sm text-blue-600 hover:text-blue-800"
              @click="markAllAsRead"
            >
              Marcar todas
            </button>
            <button
              class="text-sm text-gray-600 hover:text-gray-800"
              @click="showSettings = true"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <!-- Notification Filters -->
      <div class="p-3 border-b border-gray-100 bg-gray-50">
        <div class="flex gap-2 text-xs">
          <button
            v-for="filter in notificationFilters"
            :key="filter.key"
            :class="[
              'px-2 py-1 rounded-full transition-colors',
              activeFilter === filter.key 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
            @click="activeFilter = filter.key"
          >
            {{ filter.label }} ({{ getFilterCount(filter.key) }})
          </button>
        </div>
      </div>

      <div class="max-h-80 overflow-y-auto">
        <div 
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
          :class="{ 'bg-blue-50 border-l-4 border-l-blue-500': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start gap-3">
            <span class="text-lg flex-shrink-0">{{ getNotificationIcon(notification.type) }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                <span 
                  class="text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2"
                  :class="getPriorityColor(notification.priority)"
                >
                  {{ getPriorityText(notification.priority) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
              <div class="flex items-center justify-between mt-2">
                <p class="text-xs text-gray-500">{{ formatTime(notification.createdAt) }}</p>
                <div class="flex gap-1">
                  <span 
                    v-if="!notification.read"
                    class="w-2 h-2 bg-blue-500 rounded-full"
                  ></span>
                  <button
                    v-if="notification.actionUrl"
                    class="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {{ notification.actionLabel || 'Ver' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 bg-gray-50">
        <button
          class="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          @click="viewAllNotifications"
        >
          Ver todas las notificaciones ({{ notifications.length }})
        </button>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">⚙️ Configuración de Notificaciones</h3>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700">Notificaciones por email</span>
            <input v-model="settings.email" type="checkbox" class="rounded">
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700">Notificaciones push</span>
            <input v-model="settings.push" type="checkbox" class="rounded">
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700">Recordatorios de evaluación</span>
            <input v-model="settings.evaluationReminders" type="checkbox" class="rounded">
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700">Alertas de progreso</span>
            <input v-model="settings.progressAlerts" type="checkbox" class="rounded">
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            @click="saveSettings"
          >
            Guardar
          </button>
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            @click="showSettings = false"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div 
      v-if="showNotifications"
      class="fixed inset-0 z-40"
      @click="showNotifications = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { MontajeNotification } from '../types/notifications';

const showNotifications = ref(false);
const showSettings = ref(false);
const activeFilter = ref('all');
const notifications = ref<MontajeNotification[]>([]);

const settings = ref({
  email: true,
  push: true,
  evaluationReminders: true,
  progressAlerts: true,
});

const notificationFilters = [
  { key: 'all', label: 'Todas' },
  { key: 'evaluation', label: 'Evaluaciones' },
  { key: 'session', label: 'Ensayos' },
  { key: 'progress', label: 'Progreso' },
  { key: 'system', label: 'Sistema' },
];

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length,
);

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'all') {
    return notifications.value.slice(0, 10);
  }
  return notifications.value
    .filter(n => n.category === activeFilter.value)
    .slice(0, 10);
});

const getFilterCount = (filterKey: string): number => {
  if (filterKey === 'all') return notifications.value.length;
  return notifications.value.filter(n => n.category === filterKey).length;
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const markAllAsRead = async () => {
  notifications.value.forEach(n => n.read = true);
  // Save to backend
};

const handleNotificationClick = (notification: MontajeNotification) => {
  if (!notification.read) {
    notification.read = true;
    // Save to backend
  }
  
  if (notification.actionUrl) {
    // Navigate to the action URL
    console.log('Navigate to:', notification.actionUrl);
  }
  
  showNotifications.value = false;
};

const getNotificationIcon = (type: string): string => {
  const icons = {
    'evaluation_due': '📋',
    'session_reminder': '🎼',
    'milestone_reached': '🎯',
    'performance_alert': '⚠️',
    'member_joined': '👋',
    'work_updated': '📝',
    'report_ready': '📊',
    'system_update': '⚙️',
    'deadline_approaching': '⏰',
    'achievement_unlocked': '🏆',
  };
  return icons[type] || '📢';
};

const getPriorityColor = (priority: string): string => {
  const colors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  };
  return colors[priority] || 'bg-gray-100 text-gray-600';
};

const getPriorityText = (priority: string): string => {
  const texts = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return texts[priority] || priority;
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

const viewAllNotifications = () => {
  showNotifications.value = false;
  // Navigate to notifications page
};

const saveSettings = () => {
  // Save settings to backend
  showSettings.value = false;
};

const loadNotifications = () => {
  // Mock notifications with enhanced data
  notifications.value = [
    {
      id: '1',
      userId: 'user_1',
      projectId: 'project_1',
      type: 'evaluation_due',
      title: 'Evaluación Semanal Pendiente',
      message: 'La evaluación semanal de "Sinfonía No. 40" está pendiente desde hace 2 días',
      priority: 'high',
      category: 'evaluation',
      data: { workId: 'work_1' },
      read: false,
      actionUrl: '/evaluations/weekly',
      actionLabel: 'Evaluar Ahora',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      userId: 'user_1',
      projectId: 'project_1',
      type: 'milestone_reached',
      title: '🎯 Meta Alcanzada',
      message: 'La sección de cuerdas ha alcanzado el 80% de progreso en memorización',
      priority: 'medium',
      category: 'progress',
      data: { workId: 'work_1', milestone: 'memorization_80' },
      read: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3',
      userId: 'user_1',
      projectId: 'project_1',
      type: 'session_reminder',
      title: 'Ensayo Programado',
      message: 'Ensayo general mañana a las 19:00 en la Sala Principal',
      priority: 'medium',
      category: 'session',
      data: { sessionId: 'session_1' },
      read: false,
      actionUrl: '/calendar',
      actionLabel: 'Ver Calendario',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: '4',
      userId: 'user_1',
      projectId: 'project_1',
      type: 'performance_alert',
      title: '⚠️ Alerta de Rendimiento',
      message: 'Los vientos muestran una tendencia descendente en afinación (-15% esta semana)',
      priority: 'high',
      category: 'progress',
      data: { section: 'winds', metric: 'afinacion' },
      read: true,
      actionUrl: '/analytics',
      actionLabel: 'Ver Análisis',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '5',
      userId: 'user_1',
      projectId: 'project_1',
      type: 'member_joined',
      title: 'Nuevo Miembro',
      message: 'María González se ha unido como violinista segunda',
      priority: 'low',
      category: 'social',
      data: { memberId: 'member_5' },
      read: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
};

onMounted(() => {
  loadNotifications();
});
</script>