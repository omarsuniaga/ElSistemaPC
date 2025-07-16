/**
 * 🔔 SISTEMA DE NOTIFICACIONES
 * Manejo centralizado de notificaciones en la PWA
 * Incluye notificaciones push y toast
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// ==================== TIPOS ====================

interface Notification {
  id: string
  title: string
  message?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
  timestamp: Date
}

interface NotificationAction {
  label: string
  action: () => void
  color?: string
}

interface ToastOptions {
  title?: string
  message?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
}

// ==================== STORE DE NOTIFICACIONES ====================

export const useNotificationStore = defineStore('notifications', () => {
  // Estado
  const notifications = ref<Notification[]>([]);
  const isSupported = ref(false);
  const permission = ref<NotificationPermission>('default');

  // Computed
  const activeNotifications = computed(() =>
    notifications.value.filter((n) => n.persistent || isWithinDuration(n)),
  );

  const hasActiveNotifications = computed(() => activeNotifications.value.length > 0);

  const unreadCount = computed(() => activeNotifications.value.length);

  // ==================== INICIALIZACIÓN ====================

  function initialize() {
    // Verificar soporte para notificaciones
    isSupported.value = 'Notification' in window;

    if (isSupported.value) {
      permission.value = Notification.permission;
      console.log('🔔 Sistema de notificaciones inicializado');
    } else {
      console.log('⚠️ Notificaciones no soportadas en este navegador');
    }
  }

  // ==================== PERMISOS ====================

  async function requestPermission(): Promise<boolean> {
    if (!isSupported.value) return false;

    try {
      const result = await Notification.requestPermission();
      permission.value = result;
      return result === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
      return false;
    }
  }

  // ==================== NOTIFICACIONES TOAST ====================

  function showToast(title: string, options: ToastOptions = {}): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification: Notification = {
      id,
      title,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      actions: options.actions,
      timestamp: new Date(),
    };

    notifications.value.push(notification);

    // Auto-remover si no es persistente
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    console.log(`📱 Toast mostrado: ${title}`);
    return id;
  }

  function showSuccess(title: string, message?: string, duration = 3000): string {
    return showToast(title, { message, type: 'success', duration });
  }

  function showError(title: string, message?: string, persistent = false): string {
    return showToast(title, {
      message,
      type: 'error',
      persistent,
      duration: persistent ? undefined : 8000,
    });
  }

  function showWarning(title: string, message?: string, duration = 5000): string {
    return showToast(title, { message, type: 'warning', duration });
  }

  function showInfo(title: string, message?: string, duration = 4000): string {
    return showToast(title, { message, type: 'info', duration });
  }

  // ==================== NOTIFICACIONES PUSH ====================

  async function showPushNotification(
    title: string,
    options: {
      body?: string
      icon?: string
      badge?: string
      tag?: string
      requireInteraction?: boolean
      actions?: Array<{action: string; title: string; icon?: string}>
    } = {},
  ): Promise<boolean> {
    if (!isSupported.value || permission.value !== 'granted') {
      console.log('⚠️ No se pueden mostrar notificaciones push');
      return false;
    }

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192.png',
        badge: options.badge || '/icons/icon-72.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: {
          timestamp: Date.now(),
          source: 'music-academy-pwa',
        },
      });

      // Manejar click en notificación
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      console.log(`🔔 Notificación push enviada: ${title}`);
      return true;
    } catch (error) {
      console.error('Error mostrando notificación push:', error);
      return false;
    }
  }

  // ==================== GESTIÓN DE NOTIFICACIONES ====================

  function removeNotification(id: string) {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  }

  function clearAllNotifications() {
    notifications.value = [];
  }

  function clearNotificationsByType(type: Notification['type']) {
    notifications.value = notifications.value.filter((n) => n.type !== type);
  }

  function markAsRead(id: string) {
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      removeNotification(id);
    }
  }

  // ==================== UTILIDADES ====================

  function isWithinDuration(notification: Notification): boolean {
    if (notification.persistent || !notification.duration) return true;

    const elapsed = Date.now() - notification.timestamp.getTime();
    return elapsed < notification.duration;
  }

  function getNotificationIcon(type: Notification['type']): string {
    switch (type) {
    case 'success':
      return 'mdi-check-circle';
    case 'error':
      return 'mdi-alert-circle';
    case 'warning':
      return 'mdi-alert';
    case 'info':
    default:
      return 'mdi-information';
    }
  }

  function getNotificationColor(type: Notification['type']): string {
    switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'info';
    }
  }

  // ==================== NOTIFICACIONES ESPECÍFICAS DE LA APP ====================

  function notifyOfflineMode() {
    return showWarning(
      'Modo Offline',
      'La aplicación está funcionando sin conexión. Los datos se sincronizarán cuando se restaure la conexión.',
      8000,
    );
  }

  function notifyOnlineMode() {
    return showSuccess(
      'Conexión Restaurada',
      'La aplicación está de nuevo online. Sincronizando datos...',
      3000,
    );
  }

  function notifySyncCompleted(count: number) {
    return showSuccess(
      'Sincronización Completada',
      `${count} operación${count !== 1 ? 'es' : ''} sincronizada${count !== 1 ? 's' : ''} exitosamente.`,
      4000,
    );
  }

  function notifySyncError(error: string) {
    return showError(
      'Error de Sincronización',
      error,
      true, // Persistente para que el usuario pueda leer el error
    );
  }

  function notifyDataSaved(type: string, offline = false) {
    const message = offline
      ? `${type} guardado offline. Se sincronizará automáticamente.`
      : `${type} guardado exitosamente.`;

    return showSuccess(`${type} Guardado`, message, 3000);
  }

  function notifyUpdateAvailable() {
    return showToast('Actualización Disponible', {
      message: 'Una nueva versión de la aplicación está disponible.',
      type: 'info',
      persistent: true,
      actions: [
        {
          label: 'Actualizar',
          action: () => {
            // Esta función será implementada por el componente que use las notificaciones
            window.location.reload();
          },
          color: 'primary',
        },
        {
          label: 'Más tarde',
          action: () => {
            // Solo cerrar la notificación
          },
        },
      ],
    });
  }

  // ==================== RETURN ====================

  return {
    // Estado
    notifications,
    isSupported,
    permission,

    // Computed
    activeNotifications,
    hasActiveNotifications,
    unreadCount,

    // Métodos básicos
    initialize,
    requestPermission,

    // Toast notifications
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Push notifications
    showPushNotification,

    // Gestión
    removeNotification,
    clearAllNotifications,
    clearNotificationsByType,
    markAsRead,

    // Utilidades
    getNotificationIcon,
    getNotificationColor,

    // Notificaciones específicas
    notifyOfflineMode,
    notifyOnlineMode,
    notifySyncCompleted,
    notifySyncError,
    notifyDataSaved,
    notifyUpdateAvailable,
  };
});

// ==================== COMPOSABLE ====================

export function useNotifications() {
  const store = useNotificationStore();

  // Inicializar el store si no ha sido inicializado
  if (typeof window !== 'undefined') {
    store.initialize();
  }

  // Alias para compatibilidad
  function showNotification(
    title: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    options: Omit<ToastOptions, 'type'> = {},
  ) {
    return store.showToast(title, { ...options, type });
  }

  return {
    ...store,
    showNotification, // Alias para compatibilidad con código existente
  };
}
