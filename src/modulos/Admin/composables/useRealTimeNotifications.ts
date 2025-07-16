// src/modulos/Admin/composables/useRealTimeNotifications.ts
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { db } from '../../../firebase/config';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

export interface AdminNotification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  source: 'system' | 'user' | 'attendance' | 'classes' | 'students'
  actionUrl?: string
  metadata?: Record<string, any>
}

export function useRealTimeNotifications() {
  const notifications = ref<AdminNotification[]>([]);
  const unreadCount = ref(0);
  const isConnected = ref(false);
  const unsubscribe = ref<(() => void) | null>(null);
  // Computed
  const criticalNotifications = computed(() =>
    notifications.value.filter((n) => n.priority === 'critical' && !n.isRead),
  );
  const recentNotifications = computed(() =>
    notifications.value.slice(0, 10).map((n) => ({
      ...n,
      read: n.isRead, // Add read property for compatibility
    })),
  );

  // Methods
  const subscribeToNotifications = () => {
    const q = query(collection(db, 'ADMIN_NOTIFICATIONS'), orderBy('timestamp', 'desc'), limit(50));

    unsubscribe.value = onSnapshot(
      q,
      (snapshot) => {
        const newNotifications: AdminNotification[] = [];

        snapshot.forEach((doc) => {
          newNotifications.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          } as AdminNotification);
        });

        notifications.value = newNotifications;
        unreadCount.value = newNotifications.filter((n) => !n.isRead).length;
        isConnected.value = true;
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        isConnected.value = false;
      },
    );
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'ADMIN_NOTIFICATIONS', notificationId), {
        isRead: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.value.filter((n) => !n.isRead);

    try {
      await Promise.all(unreadNotifications.map((notification) => markAsRead(notification.id)));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const createNotification = async (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'ADMIN_NOTIFICATIONS'), {
        ...notification,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'ADMIN_NOTIFICATIONS', notificationId), {
        isRead: true,
        dismissed: true,
        dismissedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Lifecycle
  onMounted(() => {
    subscribeToNotifications();
  });

  onUnmounted(() => {
    if (unsubscribe.value) {
      unsubscribe.value();
    }
  });

  return {
    notifications,
    unreadCount,
    isConnected,
    criticalNotifications,
    recentNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    dismissNotification,
  };
}
