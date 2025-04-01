// src/stores/notifications.ts
import { defineStore } from 'pinia';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from './auth';

interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read?: boolean;
  createdAt?: Timestamp | string;
  recipientIds?: string[];  // User IDs who should receive this notification
  recipientRoles?: string[];  // User roles who should receive this notification
  link?: string;  // Optional link to navigate to when clicking the notification
  expires?: string;  // Optional expiration date
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    unreadCount: 0,
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    // Get unread notifications
    unreadNotifications: (state) => {
      return state.notifications.filter(n => !n.read);
    },
    
    // Get notifications by type
    getNotificationsByType: (state) => {
      return (type: string) => state.notifications.filter(n => n.type === type);
    }
  },

  actions: {
    // Fetch notifications for the current user
    async fetchNotifications() {
      this.isLoading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        if (!authStore.user) {
          throw new Error('No user logged in');
        }

        // Query notifications where the user is a recipient or their role is a recipient
        const userId = authStore.user.uid;
        const userRoles = authStore.user.userRoles as string[] || [];

        const q = query(
          collection(db, 'NOTIFICATIONS'),
          where('recipientIds', 'array-contains', userId),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const notifications: Notification[] = [];

        querySnapshot.forEach((doc) => {
          notifications.push({ id: doc.id, ...doc.data() } as Notification);
        });

        // For role-based notifications, we need a separate query
        if (userRoles.length > 0) {
          for (const role of userRoles) {
            const roleQuery = query(
              collection(db, 'NOTIFICATIONS'),
              where('recipientRoles', 'array-contains', role),
              orderBy('createdAt', 'desc')
            );
            
            const roleSnapshot = await getDocs(roleQuery);
            roleSnapshot.forEach((doc) => {
              // Check if we already have this notification (from user-specific query)
              const exists = notifications.some(n => n.id === doc.id);
              if (!exists) {
                notifications.push({ id: doc.id, ...doc.data() } as Notification);
              }
            });
          }
        }

        // Sort by creation date
        notifications.sort((a, b) => {
          const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt as string);
          const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt as string);
          return dateB.getTime() - dateA.getTime();
        });

        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
        
        return notifications;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        this.error = 'Failed to fetch notifications';
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    // Mark a notification as read
    async markAsRead(notificationId: string) {
      this.isLoading = true;
      try {
        // Update in Firestore
        const notificationRef = doc(db, 'NOTIFICATIONS', notificationId);
        await updateDoc(notificationRef, {
          read: true,
          updatedAt: serverTimestamp()
        });

        // Update local state
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          this.notifications[index].read = true;
          this.unreadCount = this.unreadCount > 0 ? this.unreadCount - 1 : 0;
        }

        return true;
      } catch (error) {
        console.error('Error marking notification as read:', error);
        this.error = 'Failed to mark notification as read';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Send a notification
    async sendNotification(notification: Notification) {
      this.isLoading = true;
      try {
        const newNotification = {
          ...notification,
          read: false,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'NOTIFICATIONS'), newNotification);
        
        return docRef.id;
      } catch (error) {
        console.error('Error sending notification:', error);
        this.error = 'Failed to send notification';
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
