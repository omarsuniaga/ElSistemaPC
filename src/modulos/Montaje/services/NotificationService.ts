import { firebaseService } from './FirebaseService';

export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
  tag?: string
  timestamp?: number
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

class NotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';
  private fcmToken: string | null = null;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  async initialize() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      // Request permission
      await this.requestPermission();
      
      // Get FCM token
      this.fcmToken = await firebaseService.requestNotificationPermission();
      
      // Listen for foreground messages
      firebaseService.onMessage((payload) => {
        this.showNotification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon,
          data: payload.data,
        });
      });

      return true;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async showNotification(title: string, options: PushNotification = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Notifications not permitted');
      return;
    }

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        tag: options.tag,
        timestamp: options.timestamp || Date.now(),
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.data?.url) {
          window.open(options.data.url, '_blank');
        }
        
        notification.close();
      };

      // Auto close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Show notification error:', error);
    }
  }

  // Predefined notification types for Montaje
  async showEvaluationReminder(workName: string, instrumentName: string) {
    return this.showNotification('📋 Evaluación Pendiente', {
      body: `Recuerda evaluar ${instrumentName} en "${workName}"`,
      icon: '/icons/evaluation-icon.png',
      tag: 'evaluation-reminder',
      requireInteraction: true,
      data: {
        type: 'evaluation_reminder',
        workName,
        instrumentName,
      },
    });
  }

  async showSessionReminder(sessionTitle: string, startTime: string) {
    return this.showNotification('🎼 Ensayo Próximo', {
      body: `${sessionTitle} comienza a las ${startTime}`,
      icon: '/icons/session-icon.png',
      tag: 'session-reminder',
      requireInteraction: true,
      data: {
        type: 'session_reminder',
        sessionTitle,
        startTime,
      },
    });
  }

  async showMilestoneAchieved(workName: string, milestone: string) {
    return this.showNotification('🎯 Meta Alcanzada', {
      body: `¡Felicidades! Has alcanzado "${milestone}" en "${workName}"`,
      icon: '/icons/achievement-icon.png',
      tag: 'milestone-achieved',
      data: {
        type: 'milestone_achieved',
        workName,
        milestone,
      },
    });
  }

  async showProgressAlert(instrumentName: string, alertType: 'improvement' | 'decline') {
    const emoji = alertType === 'improvement' ? '📈' : '📉';
    const message = alertType === 'improvement' 
      ? `¡Excelente progreso en ${instrumentName}!`
      : `${instrumentName} necesita atención`;

    return this.showNotification(`${emoji} Alerta de Progreso`, {
      body: message,
      icon: '/icons/progress-icon.png',
      tag: 'progress-alert',
      data: {
        type: 'progress_alert',
        instrumentName,
        alertType,
      },
    });
  }

  // Schedule notifications
  async scheduleNotification(
    title: string, 
    options: PushNotification, 
    delay: number,
  ) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.showNotification(title, options));
      }, delay);
    });
  }

  // Batch notifications
  async showBatchNotifications(notifications: Array<{
    title: string
    options: PushNotification
    delay?: number
  }>) {
    const promises = notifications.map((notif, index) => {
      const delay = notif.delay || (index * 1000); // 1 second between notifications
      return this.scheduleNotification(notif.title, notif.options, delay);
    });

    return Promise.all(promises);
  }

  // Clear notifications
  clearNotificationsByTag(tag: string) {
    // This would require service worker implementation for full functionality
    console.log(`Clearing notifications with tag: ${tag}`);
  }

  clearAllNotifications() {
    // This would require service worker implementation for full functionality
    console.log('Clearing all notifications');
  }

  // Getters
  get isPermissionGranted() {
    return this.permission === 'granted';
  }

  get token() {
    return this.fcmToken;
  }

  get supported() {
    return this.isSupported;
  }
}

export const notificationService = new NotificationService();
export default notificationService;