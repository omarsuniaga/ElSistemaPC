// Composable para el Panel de Notificaciones Administrativas
// Gestiona el estado y las operaciones de notificaciones en tiempo real

import { ref, reactive, computed, onMounted, onUnmounted, readonly } from 'vue';
import { adminNotificationService } from '@/services/adminNotificationService';

// Tipos para el composable
interface NotificationState {
  notifications: any[]
  unreadCount: number
  stats: {
    total: number
    unread: number
    byType: Record<string, number>
    byUrgency: Record<string, number>
  }
  isLoading: boolean
  error: string | null
  selectedNotification: any | null
  showUnreadOnly: boolean
}

export const useAdminNotifications = () => {
  // Estado reactivo
  const state = reactive<NotificationState>({
    notifications: [],
    unreadCount: 0,
    stats: {
      total: 0,
      unread: 0,
      byType: {},
      byUrgency: {},
    },
    isLoading: false,
    error: null,
    selectedNotification: null,
    showUnreadOnly: false,
  });

  // Referencias para el listener
  let unsubscribeListener: (() => void) | null = null;

  // Computed properties
  const filteredNotifications = computed(() => {
    if (state.showUnreadOnly) {
      return state.notifications.filter((n) => !n.read);
    }
    return state.notifications;
  });

  const notificationsByType = computed(() => {
    const byType: Record<string, any[]> = {};
    filteredNotifications.value.forEach((notification) => {
      const type = notification.type || 'other';
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(notification);
    });
    return byType;
  });

  const hasHighUrgencyNotifications = computed(() => {
    return filteredNotifications.value.some((n) => n.urgency === 'high' && !n.read);
  });

  // Funciones de utilidad
  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      teacher_login: '👨‍🏫',
      attendance_report: '📊',
      student_observation: '📝',
      system_notification: '⚙️',
    };
    return icons[type] || '📢';
  };

  const getUrgencyColor = (urgency: string): string => {
    const colors: Record<string, string> = {
      high: 'error',
      medium: 'warning',
      low: 'info',
    };
    return colors[urgency] || 'info';
  };

  const formatNotificationTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} días`;
    
    return timestamp.toLocaleDateString();
  };

  // Operaciones principales
  const loadNotifications = async (): Promise<void> => {
    try {
      state.isLoading = true;
      state.error = null;

      // Cargar notificaciones y estadísticas en paralelo
      const [notifications, stats] = await Promise.all([
        adminNotificationService.getAllNotifications(100),
        adminNotificationService.getNotificationStats(),
      ]);

      state.notifications = notifications;
      state.stats = stats;
      state.unreadCount = stats.unread;

      console.log(`📊 Cargadas ${notifications.length} notificaciones`);
    } catch (error) {
      state.error = 'Error cargando notificaciones';
      console.error('Error cargando notificaciones:', error);
    } finally {
      state.isLoading = false;
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      await adminNotificationService.markNotificationAsRead(notificationId);
      
      // Actualizar el estado local
      const notification = state.notifications.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.stats.unread = Math.max(0, state.stats.unread - 1);
      }

      console.log(`✅ Notificación ${notificationId} marcada como leída`);
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      state.isLoading = true;
      await adminNotificationService.markAllNotificationsAsRead();
      
      // Actualizar el estado local
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
      state.stats.unread = 0;

      console.log('✅ Todas las notificaciones marcadas como leídas');
    } catch (error) {
      state.error = 'Error marcando todas como leídas';
      console.error('Error marcando todas las notificaciones como leídas:', error);
    } finally {
      state.isLoading = false;
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      await adminNotificationService.deleteNotification(notificationId);
      
      // Actualizar el estado local
      const index = state.notifications.findIndex((n) => n.id === notificationId);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.stats.unread = Math.max(0, state.stats.unread - 1);
        }
        state.notifications.splice(index, 1);
        state.stats.total = Math.max(0, state.stats.total - 1);
      }

      console.log(`✅ Notificación ${notificationId} eliminada`);
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      if (!confirm('¿Estás seguro de que quieres eliminar TODAS las notificaciones? Esta acción no se puede deshacer.')) {
        return;
      }

      state.isLoading = true;
      await adminNotificationService.clearAllNotifications();
      
      // Limpiar el estado local
      state.notifications = [];
      state.unreadCount = 0;
      state.stats = {
        total: 0,
        unread: 0,
        byType: {},
        byUrgency: {},
      };

      console.log('✅ Todas las notificaciones eliminadas');
    } catch (error) {
      state.error = 'Error limpiando todas las notificaciones';
      console.error('Error limpiando todas las notificaciones:', error);
    } finally {
      state.isLoading = false;
    }
  };

  const selectNotification = (notification: any): void => {
    state.selectedNotification = notification;
    
    // Marcar como leída automáticamente al seleccionar
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const toggleShowUnreadOnly = (): void => {
    state.showUnreadOnly = !state.showUnreadOnly;
  };

  // Configurar listener en tiempo real
  const setupRealtimeListener = (): void => {
    if (unsubscribeListener) {
      unsubscribeListener();
    }

    unsubscribeListener = adminNotificationService.watchNotifications((notifications) => {
      state.notifications = notifications;
      state.unreadCount = notifications.filter((n) => !n.read).length;
      
      // Actualizar estadísticas
      state.stats.total = notifications.length;
      state.stats.unread = state.unreadCount;
      
      console.log(`🔄 Notificaciones actualizadas en tiempo real: ${notifications.length} total, ${state.unreadCount} no leídas`);
    });
  };

  // Funciones de filtro adicionales
  const getNotificationsByType = (type: string): any[] => {
    return state.notifications.filter((n) => n.type === type);
  };

  const getNotificationsByUrgency = (urgency: string): any[] => {
    return state.notifications.filter((n) => n.urgency === urgency);
  };

  // Lifecycle hooks
  onMounted(async () => {
    console.log('🔔 Inicializando panel de notificaciones administrativas...');
    await loadNotifications();
    setupRealtimeListener();
  });

  onUnmounted(() => {
    if (unsubscribeListener) {
      unsubscribeListener();
      console.log('🛑 Listener de notificaciones desconectado');
    }
  });

  // Retornar la API del composable
  return {
    // Estado
    state: readonly(state),
    
    // Computed
    filteredNotifications,
    notificationsByType,
    hasHighUrgencyNotifications,
    
    // Operaciones principales
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    selectNotification,
    toggleShowUnreadOnly,
    
    // Utilidades
    getNotificationIcon,
    getUrgencyColor,
    formatNotificationTime,
    getNotificationsByType,
    getNotificationsByUrgency,
    
    // Control del listener
    setupRealtimeListener,
  };
};
