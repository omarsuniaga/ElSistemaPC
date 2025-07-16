import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import type { NotificationHistory } from '../types/notificationHistory';
import type { Conversation } from '../types/conversation';

export const useCommunicationStore = defineStore('communication', () => {
  const notificationsHistory = ref<NotificationHistory[]>([]);
  const conversations = ref<Conversation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const totalSentNotifications = computed(() => notificationsHistory.value.length);
  const totalRepliesReceived = computed(() => conversations.value.length);

  const getNotificationCategories = computed(() => {
    const categories = new Map<string, number>();
    notificationsHistory.value.forEach((notif) => {
      const type = notif.type || 'General';
      categories.set(type, (categories.get(type) || 0) + 1);
    });
    return Array.from(categories.entries()).map(([name, count]) => ({ name, count }));
  });

  const getStudentCommunicationHistory = computed(() => (studentId: string) => {
    const allItems: Array<NotificationHistory | Conversation> = [
      ...notificationsHistory.value.filter((item) => item.studentId === studentId),
      ...conversations.value.filter((item) => item.studentId === studentId),
    ];
    // Sort by timestamp
    return allItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  });

  // Actions
  const fetchCommunicationData = async (days: number = 30) => {
    loading.value = true;
    error.value = null;
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Fetch Notification History
      const notificationsQuery = query(
        collection(db, 'notification_history'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      notificationsHistory.value = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate(),
      })) as NotificationHistory[];

      // Fetch Conversations
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      conversations.value = conversationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate(),
      })) as Conversation[];
    } catch (err: any) {
      error.value = err.message || 'Error al cargar datos de comunicación';
      console.error('Error fetching communication data:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    notificationsHistory,
    conversations,
    loading,
    error,
    totalSentNotifications,
    totalRepliesReceived,
    getNotificationCategories,
    getStudentCommunicationHistory,
    fetchCommunicationData,
  };
});
