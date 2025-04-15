import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  visible: boolean;
  timeout?: number;
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'visible'>) => {
    const id = Date.now().toString();
    
    const newNotification = {
      ...notification,
      id,
      visible: true,
      timeout: notification.timeout || 5000, // Default timeout: 5 seconds
    };
    
    notifications.value.push(newNotification);
    
    // Auto-dismiss after timeout
    if (newNotification.timeout !== 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, newNotification.timeout);
    }
    
    return id;
  };
  
  const dismissNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value[index].visible = false;
      
      // Remove from array after animation completes
      setTimeout(() => {
        notifications.value = notifications.value.filter(n => n.id !== id);
      }, 500);
    }
  };
  
  const clearNotifications = () => {
    notifications.value = [];
  };
  
  const notify = {
    success: (title: string, message: string, timeout?: number) => 
      addNotification({ title, message, type: 'success', timeout }),
    
    info: (title: string, message: string, timeout?: number) => 
      addNotification({ title, message, type: 'info', timeout }),
    
    warning: (title: string, message: string, timeout?: number) => 
      addNotification({ title, message, type: 'warning', timeout }),
    
    error: (title: string, message: string, timeout?: number) => 
      addNotification({ title, message, type: 'error', timeout }),
  };
  
  return {
    notifications,
    addNotification,
    dismissNotification,
    clearNotifications,
    notify,
  };
});
