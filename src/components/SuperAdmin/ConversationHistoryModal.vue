<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Historial de Comunicación</h3>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <p>Cargando historial...</p>
        </div>
        <div v-else-if="timeline.length === 0" class="empty-state">
          <p>No hay comunicaciones registradas para este estudiante.</p>
        </div>
        <div v-else class="timeline">
          <div
            v-for="item in timeline"
            :key="item.id"
            class="timeline-item"
            :class="item.direction"
          >
            <div class="timeline-content">
              <p class="message">{{ item.message }}</p>
              <span class="timestamp">{{ formatDate(item.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { NotificationHistory } from '../../types/notificationHistory';
import type { Conversation } from '../../types/conversation';

interface TimelineItem {
  id: string
  message: string
  timestamp: Date
  direction: 'incoming' | 'outgoing'
}

export default defineComponent({
  name: 'ConversationHistoryModal',
  props: {
    studentId: {
      type: String,
      required: true,
    },
    visible: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const loading = ref(false);
    const timeline = ref<TimelineItem[]>([]);

    const fetchHistory = async () => {
      if (!props.studentId) return;

      loading.value = true;
      const allItems: TimelineItem[] = [];

      try {
        // Fetch notifications (outgoing)
        const notificationsQuery = query(
          collection(db, 'notification_history'),
          where('studentId', '==', props.studentId),
          orderBy('timestamp', 'asc'),
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        notificationsSnapshot.forEach((doc) => {
          const data = doc.data() as NotificationHistory;
          allItems.push({
            id: doc.id,
            message: data.messageContent,
            timestamp: (data.timestamp as any).toDate(),
            direction: 'outgoing',
          });
        });

        // Fetch conversations (incoming)
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('studentId', '==', props.studentId),
          orderBy('timestamp', 'asc'),
        );
        const conversationsSnapshot = await getDocs(conversationsQuery);
        conversationsSnapshot.forEach((doc) => {
          const data = doc.data() as Conversation;
          allItems.push({
            id: doc.id,
            message: data.message,
            timestamp: (data.timestamp as any).toDate(),
            direction: 'incoming',
          });
        });

        // Sort all items by timestamp
        timeline.value = allItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      } catch (error) {
        console.error('Error fetching communication history:', error);
      } finally {
        loading.value = false;
      }
    };

    watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          fetchHistory();
        }
      },
    );

    const closeModal = () => {
      emit('close');
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    };

    return {
      loading,
      timeline,
      closeModal,
      formatDate,
    };
  },
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-item {
  display: flex;
}

.timeline-item.outgoing {
  justify-content: flex-end;
}

.timeline-item.incoming {
  justify-content: flex-start;
}

.timeline-content {
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
}

.timeline-item.outgoing .timeline-content {
  background-color: #dcf8c6;
  color: #333;
}

.timeline-item.incoming .timeline-content {
  background-color: #f1f1f1;
  color: #333;
}

.message {
  margin: 0;
  white-space: pre-wrap;
}

.timestamp {
  display: block;
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.5rem;
  text-align: right;
}
</style>
