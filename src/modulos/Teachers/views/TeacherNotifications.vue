<template>
  <div class="notifications-page">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <BellIcon class="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
              Notificaciones
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona tus notificaciones y mantente al día
            </p>
          </div>

          <!-- Badge de contador -->
          <div v-if="unreadCount > 0" class="flex items-center">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            >
              {{ unreadCount }} sin leer
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-3">
        <div class="flex flex-wrap gap-2">
          <button
            :class="[
              'px-3 py-1 text-sm font-medium rounded-full transition-colors',
              selectedFilter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
            @click="selectedFilter = 'all'"
          >
            Todas ({{ notifications.length }})
          </button>

          <button
            :class="[
              'px-3 py-1 text-sm font-medium rounded-full transition-colors',
              selectedFilter === 'unread'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
            @click="selectedFilter = 'unread'"
          >
            Sin leer ({{ unreadCount }})
          </button>

          <button
            :class="[
              'px-3 py-1 text-sm font-medium rounded-full transition-colors',
              selectedFilter === 'student-registration'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
            @click="selectedFilter = 'student-registration'"
          >
            Nuevos Estudiantes ({{ studentRegistrationNotifications.length }})
          </button>

          <button
            :class="[
              'px-3 py-1 text-sm font-medium rounded-full transition-colors',
              selectedFilter === 'announcements'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
            @click="selectedFilter = 'announcements'"
          >
            Anuncios ({{ generalAnnouncements.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Lista de notificaciones -->
    <div class="flex-1 overflow-auto">
      <div class="p-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p class="text-gray-600 dark:text-gray-400 mt-2">Cargando notificaciones...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <ExclamationTriangleIcon class="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p class="text-red-600 dark:text-red-400">{{ error }}</p>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="loadNotifications"
          >
            Reintentar
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredNotifications.length === 0" class="text-center py-12">
          <BellIcon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ getEmptyStateMessage() }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ getEmptyStateSubMessage() }}
          </p>
        </div>

        <!-- Notifications List -->
        <div v-else class="space-y-4">
          <NotificationCard
            v-for="notification in filteredNotifications"
            :key="notification.id"
            :notification="notification"
            @mark-as-read="handleMarkAsRead"
            @dismiss="handleDismiss"
            @assign-to-class="handleAssignToClass"
            @action-taken="handleActionTaken"
          />
        </div>
      </div>
    </div>

    <!-- Modal para asignar estudiante a clase -->
    <AssignStudentToClassModal
      :show="showAssignModal"
      :student="selectedStudent"
      :notification="selectedNotification"
      @close="handleCloseAssignModal"
      @assigned="handleStudentAssigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { BellIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { useGeneralNotifications } from '../composables/useGeneralNotifications';
import { useToast } from '../../../composables/useToast';
import NotificationCard from '../components/NotificationCard.vue';
import AssignStudentToClassModal from '../components/AssignStudentToClassModal.vue';
import type { GeneralNotification } from '../services/generalNotifications';

// Composables
const toast = useToast();
const {
  notifications,
  unreadCount,
  studentRegistrationNotifications,
  generalAnnouncements,
  isLoading,
  error,
  loadNotifications,
  markAsRead,
  dismiss,
  takeAction,
} = useGeneralNotifications();

// Estado local
const selectedFilter = ref<'all' | 'unread' | 'student-registration' | 'announcements'>('all');
const showAssignModal = ref(false);
const selectedStudent = ref<any>(null);
const selectedNotification = ref<GeneralNotification | null>(null);

// Computed
const filteredNotifications = computed(() => {
  switch (selectedFilter.value) {
  case 'unread':
    return notifications.value.filter((n) => n.status === 'unread');
  case 'student-registration':
    return notifications.value.filter((n) => n.type === 'student-registration');
  case 'announcements':
    return notifications.value.filter((n) => n.type === 'general-announcement');
  default:
    return notifications.value;
  }
});

// Métodos
const getEmptyStateMessage = () => {
  switch (selectedFilter.value) {
  case 'unread':
    return 'No tienes notificaciones sin leer';
  case 'student-registration':
    return 'No hay registros de nuevos estudiantes';
  case 'announcements':
    return 'No hay anuncios disponibles';
  default:
    return 'No tienes notificaciones';
  }
};

const getEmptyStateSubMessage = () => {
  switch (selectedFilter.value) {
  case 'unread':
    return 'Todas tus notificaciones están marcadas como leídas.';
  case 'student-registration':
    return 'Cuando se registren nuevos estudiantes, aparecerán aquí.';
  case 'announcements':
    return 'Los anuncios importantes aparecerán en esta sección.';
  default:
    return 'Cuando recibas notificaciones, aparecerán aquí.';
  }
};

const handleMarkAsRead = async (notificationId: string) => {
  const result = await markAsRead(notificationId);
  if (result.success) {
    toast.success('Notificación marcada como leída');
  } else {
    toast.error(result.error || 'Error al marcar como leída');
  }
};

const handleDismiss = async (notificationId: string) => {
  const result = await dismiss(notificationId);
  if (result.success) {
    toast.info('Notificación desestimada');
  } else {
    toast.error(result.error || 'Error al desestimar');
  }
};

const handleAssignToClass = (notification: GeneralNotification) => {
  selectedNotification.value = notification;
  selectedStudent.value = notification.studentData;
  showAssignModal.value = true;
};

const handleActionTaken = async (notificationId: string, actionDetails?: any) => {
  const result = await takeAction(notificationId, actionDetails);
  if (result.success) {
    toast.success('Acción registrada correctamente');
  } else {
    toast.error(result.error || 'Error al registrar acción');
  }
};

const handleCloseAssignModal = () => {
  showAssignModal.value = false;
  selectedStudent.value = null;
  selectedNotification.value = null;
};

const handleStudentAssigned = async (assignmentData: any) => {
  if (selectedNotification.value?.id) {
    await handleActionTaken(selectedNotification.value.id, {
      action: 'student-assigned-to-class',
      classId: assignmentData.classId,
      className: assignmentData.className,
      assignedAt: new Date(),
    });
  }

  toast.success('Estudiante asignado a la clase exitosamente');
  handleCloseAssignModal();
};
</script>

<style scoped>
.notifications-page {
  @apply flex flex-col h-screen bg-gray-50 dark:bg-gray-900;
}
</style>
