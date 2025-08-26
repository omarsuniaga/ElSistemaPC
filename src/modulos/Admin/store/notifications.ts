import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'student' | 'class' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  actionUrl?: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  expires?: Date;
}

export interface NotificationFilters {
  type?: string;
  read?: boolean;
  category?: string;
  priority?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  todayCount: number;
  weekCount: number;
}

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<NotificationFilters>({});
  const realTimeListener = ref<(() => void) | null>(null);

  // Getters
  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  );

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read)
  );

  const filteredNotifications = computed(() => {
    let filtered = [...notifications.value];

    // Type filter
    if (filters.value.type) {
      filtered = filtered.filter(n => n.type === filters.value.type);
    }

    // Read status filter
    if (filters.value.read !== undefined) {
      filtered = filtered.filter(n => n.read === filters.value.read);
    }

    // Category filter
    if (filters.value.category) {
      filtered = filtered.filter(n => n.category === filters.value.category);
    }

    // Priority filter
    if (filters.value.priority) {
      filtered = filtered.filter(n => n.priority === filters.value.priority);
    }

    // Date range filter
    if (filters.value.dateRange) {
      const { start, end } = filters.value.dateRange;
      filtered = filtered.filter(n => {
        const createdAt = new Date(n.createdAt);
        return createdAt >= start && createdAt <= end;
      });
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  const notificationStats = computed((): NotificationStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats: NotificationStats = {
      total: notifications.value.length,
      unread: unreadCount.value,
      byType: {},
      byPriority: {},
      todayCount: 0,
      weekCount: 0,
    };

    notifications.value.forEach(notification => {
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

      // Count by priority
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;

      // Count today's notifications
      if (new Date(notification.createdAt) >= today) {
        stats.todayCount++;
      }

      // Count this week's notifications
      if (new Date(notification.createdAt) >= weekAgo) {
        stats.weekCount++;
      }
    });

    return stats;
  });

  const urgentNotifications = computed(() =>
    notifications.value
      .filter(n => n.priority === 'urgent' && !n.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );

  // Actions
  const loadNotifications = async (userId?: string, limitCount = 50) => {
    try {
      isLoading.value = true;
      error.value = null;

      const constraints = [];
      
      if (userId) {
        constraints.push(where('userId', '==', userId));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      
      if (limitCount > 0) {
        constraints.push(limit(limitCount));
      }

      const notificationsQuery = query(
        collection(db, 'NOTIFICATIONS'),
        ...constraints
      );

      const snapshot = await getDocs(notificationsQuery);
      
      notifications.value = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          expires: data.expires?.toDate() || undefined,
        } as Notification;
      });

      console.log('✅ Notifications loaded:', notifications.value.length);
    } catch (err: any) {
      console.error('❌ Error loading notifications:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'NOTIFICATIONS'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newNotification: Notification = {
        id: docRef.id,
        ...notificationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      notifications.value.unshift(newNotification);
      
      console.log('✅ Notification created:', newNotification.title);
      return docRef.id;
    } catch (err: any) {
      console.error('❌ Error creating notification:', err);
      error.value = err.message;
      throw err;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const docRef = doc(db, 'NOTIFICATIONS', notificationId);
      await updateDoc(docRef, {
        read: true,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        notification.updatedAt = new Date();
      }

      console.log('✅ Notification marked as read:', notificationId);
    } catch (err: any) {
      console.error('❌ Error marking notification as read:', err);
      error.value = err.message;
      throw err;
    }
  };

  const markAllAsRead = async (userId?: string) => {
    try {
      const unreadNotifs = notifications.value.filter(n => !n.read);
      if (unreadNotifs.length === 0) return;

      const updatePromises = unreadNotifs.map(notification => {
        const docRef = doc(db, 'NOTIFICATIONS', notification.id);
        return updateDoc(docRef, {
          read: true,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);

      // Update local state
      unreadNotifs.forEach(notification => {
        notification.read = true;
        notification.updatedAt = new Date();
      });

      console.log('✅ All notifications marked as read:', unreadNotifs.length);
    } catch (err: any) {
      console.error('❌ Error marking all notifications as read:', err);
      error.value = err.message;
      throw err;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'NOTIFICATIONS', notificationId));

      // Remove from local state
      const index = notifications.value.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        notifications.value.splice(index, 1);
      }

      console.log('✅ Notification deleted:', notificationId);
    } catch (err: any) {
      console.error('❌ Error deleting notification:', err);
      error.value = err.message;
      throw err;
    }
  };

  const deleteOldNotifications = async (olderThanDays = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldNotificationsQuery = query(
        collection(db, 'NOTIFICATIONS'),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(oldNotificationsQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));

      await Promise.all(deletePromises);

      // Update local state
      notifications.value = notifications.value.filter(
        n => new Date(n.createdAt) >= cutoffDate
      );

      console.log('✅ Old notifications deleted:', snapshot.docs.length);
      return snapshot.docs.length;
    } catch (err: any) {
      console.error('❌ Error deleting old notifications:', err);
      error.value = err.message;
      throw err;
    }
  };

  const setFilters = (newFilters: Partial<NotificationFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const clearFilters = () => {
    filters.value = {};
  };

  const startRealTimeListener = (userId?: string) => {
    if (realTimeListener.value) {
      stopRealTimeListener();
    }

    const constraints = [];
    
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(100));

    const notificationsQuery = query(
      collection(db, 'NOTIFICATIONS'),
      ...constraints
    );

    realTimeListener.value = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        notifications.value = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            expires: data.expires?.toDate() || undefined,
          } as Notification;
        });

        console.log('🔄 Real-time notifications updated:', notifications.value.length);
      },
      (err) => {
        console.error('❌ Real-time notifications error:', err);
        error.value = err.message;
      }
    );
  };

  const stopRealTimeListener = () => {
    if (realTimeListener.value) {
      realTimeListener.value();
      realTimeListener.value = null;
    }
  };

  // Utility functions for creating common notification types
  const createStudentNotification = async (
    userId: string,
    title: string,
    message: string,
    studentData: any,
    priority: Notification['priority'] = 'normal'
  ) => {
    return await createNotification({
      userId,
      type: 'student',
      title,
      message,
      read: false,
      actionUrl: `/admin/students/${studentData.id}`,
      data: { student: studentData },
      priority,
      category: 'students',
    });
  };

  const createClassNotification = async (
    userId: string,
    title: string,
    message: string,
    classData: any,
    priority: Notification['priority'] = 'normal'
  ) => {
    return await createNotification({
      userId,
      type: 'class',
      title,
      message,
      read: false,
      actionUrl: `/admin/classes/${classData.id}`,
      data: { class: classData },
      priority,
      category: 'classes',
    });
  };

  const createPaymentNotification = async (
    userId: string,
    title: string,
    message: string,
    paymentData: any,
    priority: Notification['priority'] = 'normal'
  ) => {
    return await createNotification({
      userId,
      type: 'payment',
      title,
      message,
      read: false,
      actionUrl: `/admin/payments/${paymentData.id}`,
      data: { payment: paymentData },
      priority,
      category: 'payments',
    });
  };

  const createSystemNotification = async (
    userId: string,
    title: string,
    message: string,
    priority: Notification['priority'] = 'normal',
    actionUrl?: string
  ) => {
    return await createNotification({
      userId,
      type: 'system',
      title,
      message,
      read: false,
      actionUrl,
      priority,
      category: 'system',
    });
  };

  // Reset function
  const $reset = () => {
    notifications.value = [];
    isLoading.value = false;
    error.value = null;
    filters.value = {};
    stopRealTimeListener();
  };

  return {
    // State
    notifications,
    isLoading,
    error,
    filters,

    // Getters
    unreadCount,
    unreadNotifications,
    filteredNotifications,
    notificationStats,
    urgentNotifications,

    // Actions
    loadNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteOldNotifications,
    setFilters,
    clearFilters,
    startRealTimeListener,
    stopRealTimeListener,

    // Utility functions
    createStudentNotification,
    createClassNotification,
    createPaymentNotification,
    createSystemNotification,

    // Reset
    $reset,
  };
});

export type { NotificationFilters, NotificationStats };