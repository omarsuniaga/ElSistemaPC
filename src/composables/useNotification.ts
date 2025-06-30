import { ref } from 'vue';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  timeout?: number;
}

export function useNotification() {
  const notifications = ref<Notification[]>([]);
  let nextId = 0;

  const showNotification = (
    message: string, 
    type: NotificationType = 'info', 
    timeout: number = 3000
  ) => {
    const id = nextId++;
    const notification: Notification = {
      id,
      message,
      type,
      timeout
    };

    notifications.value.push(notification);

    // Auto-remove notification after timeout
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    return id;
  };

  const removeNotification = (id: number) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  const clearAllNotifications = () => {
    notifications.value = [];
  };

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  };
}

// Para usar con provide/inject
export const notificationKey = Symbol('notification');

// Para usar con app.config.globalProperties
declare module 'vue' {
  interface ComponentCustomProperties {
    $notify: typeof showNotification;
  }
}
