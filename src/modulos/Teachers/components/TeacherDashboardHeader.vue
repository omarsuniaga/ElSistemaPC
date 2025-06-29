<script setup lang="ts">
import { type FunctionalComponent, computed } from 'vue';
import { BookOpenIcon, ChartBarSquareIcon, CalendarIcon, ClockIcon, BellIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { useGeneralNotifications } from '../composables/useGeneralNotifications';
import { useAuthStore } from '../../../stores/auth';
import { useTeachersStore } from '../store/teachers';

const props = defineProps<{
  activeTab: string;
}>();

const emit = defineEmits(['set-active-tab']);

// Usar el store de autenticación y maestros
const authStore = useAuthStore();
const teachersStore = useTeachersStore();

// Usar el composable de notificaciones para obtener el contador
const { unreadCount } = useGeneralNotifications();

// Computed values for notifications
const hasNotifications = computed(() => unreadCount.value > 0);
const notificationCount = computed(() => unreadCount.value);

// Computed para obtener información del maestro actual
const currentTeacher = computed(() => {
  const teacherData = teachersStore.getTeacherById(authStore.user?.uid || '');
  return {
    name: teacherData?.name || authStore.user?.email?.split('@')[0] || 'Maestro'
  };
});

const tabs: Array<{ name: string; value: string; icon: FunctionalComponent }> = [
  { name: 'Mis Clases', value: 'classes', icon: BookOpenIcon },
  { name: 'Clases Emergentes', value: 'emergency', icon: ExclamationTriangleIcon },
  { name: 'Notificaciones', value: 'notifications', icon: BellIcon },
  { name: 'Métricas', value: 'overview', icon: ChartBarSquareIcon },
  { name: 'Ausentes', value: 'schedule', icon: CalendarIcon }, // Renamed
  { name: 'Observaciones', value: 'upcoming', icon: ClockIcon }, // Renamed
];

const setActiveTab = (tab: string) => {
  emit('set-active-tab', tab);
};
</script>

<template>
  <header class="dashboard-header bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow mb-4 md:mb-6">
    <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
      <!-- nombre del maestro -->
       {{ currentTeacher.name }}
    </h1>
    <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">Aquí puedes gestionar y visualizar información relevante sobre tus clases y estudiantes.</p>    <!-- Tabs de navegación -->
    <div class="flex mt-4 md:mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="setActiveTab(tab.value)"
        class="flex-shrink-0 px-3 md:px-4 py-2 font-medium text-xs md:text-sm focus:outline-none whitespace-nowrap relative"
        :class="{
          'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === tab.value,
          'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== tab.value,
          'tab-notifications-active': tab.value === 'notifications' && hasNotifications
        }"
      >
        <div class="flex items-center gap-1 relative">
          <component :is="tab.icon" class="h-3 w-3 md:h-4 md:w-4" />
          {{ tab.name }}          <!-- Badge de notificaciones con animación -->
          <span 
            v-if="tab.value === 'notifications' && hasNotifications && notificationCount > 0"
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold notification-badge"
          >
            {{ notificationCount > 99 ? '99+' : notificationCount }}
          </span>
          
          <!-- Indicador de punto rojo simple (alternativo) -->
          <span 
            v-else-if="tab.value === 'notifications' && hasNotifications"
            class="absolute -top-1 -right-1 bg-red-500 rounded-full h-3 w-3 notification-dot"
          ></span>
        </div>
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Animaciones para el badge de notificaciones */
.notification-badge {
  animation: pulse-notification 2s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  border: 2px solid white;
  position: relative;
}

.notification-dot {
  animation: pulse-notification 2s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  border: 1px solid white;
  position: relative;
}

/* Efecto de onda expansiva */
.notification-badge::before,
.notification-dot::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.3);
  transform: translate(-50%, -50%) scale(1);
  animation: ripple-notification 2s ease-out infinite;
  z-index: -1;
}

@keyframes pulse-notification {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
}

@keyframes ripple-notification {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* Variación para modo oscuro */
.dark .notification-badge,
.dark .notification-dot {
  border-color: rgb(31, 41, 55); /* gray-800 */
}

.dark .notification-badge::before,
.dark .notification-dot::before {
  background: rgba(239, 68, 68, 0.4);
}

/* Efecto hover en la tab de notificaciones cuando hay notificaciones */
.tab-notifications-active:hover .notification-badge,
.tab-notifications-active:hover .notification-dot {
  animation-duration: 1s;
}

.tab-notifications-active:hover .notification-badge::before,
.tab-notifications-active:hover .notification-dot::before {
  animation-duration: 1s;
}

/* Efecto de brillo sutil en la tab cuando hay notificaciones */
.tab-notifications-active {
  position: relative;
}

.tab-notifications-active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(239, 68, 68, 0.05), transparent);
  border-radius: 4px;
  opacity: 0;
  animation: glow-tab 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes glow-tab {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
</style>