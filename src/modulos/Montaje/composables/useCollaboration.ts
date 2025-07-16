import { ref, computed } from 'vue';
import type {
  MensajeColaboracion,
  TipoMensaje,
  PrioridadMensaje,
  Notificacion,
  TipoNotificacion,
  EstadoNotificacion,
} from '../types';
import montajeService from '../service/montajeService';

export function useCollaboration() {
  const messages = ref<MensajeColaboracion[]>([]);
  const notifications = ref<Notificacion[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Filtros para mensajes
  const messageFilters = ref({
    tipo: '' as TipoMensaje | '',
    prioridad: '' as PrioridadMensaje | '',
    autor: '',
    search: '',
  });

  // Filtros para notificaciones
  const notificationFilters = ref({
    tipo: '' as TipoNotificacion | '',
    estado: '' as EstadoNotificacion | '',
    search: '',
  });

  const filteredMessages = computed(() => {
    return messages.value.filter((message) => {
      const { tipo, prioridad, autor, search } = messageFilters.value;

      const matchesType = !tipo || message.tipo === tipo;
      const matchesPriority = !prioridad || message.prioridad === prioridad;
      const matchesAuthor = !autor || message.autor.toLowerCase().includes(autor.toLowerCase());
      const matchesSearch =
        !search ||
        message.titulo.toLowerCase().includes(search.toLowerCase()) ||
        message.contenido.toLowerCase().includes(search.toLowerCase());

      return matchesType && matchesPriority && matchesAuthor && matchesSearch;
    });
  });

  const filteredNotifications = computed(() => {
    return notifications.value.filter((notification) => {
      const { tipo, estado, search } = notificationFilters.value;

      const matchesType = !tipo || notification.tipo === tipo;
      const matchesStatus = !estado || notification.estado === estado;
      const matchesSearch =
        !search ||
        notification.titulo.toLowerCase().includes(search.toLowerCase()) ||
        notification.mensaje.toLowerCase().includes(search.toLowerCase());

      return matchesType && matchesStatus && matchesSearch;
    });
  });

  const unreadNotifications = computed(() => {
    return notifications.value.filter((n) => n.estado === 'NO_LEIDA');
  });

  const priorityMessages = computed(() => {
    return messages.value.filter((m) => m.prioridad === 'ALTA' || m.prioridad === 'URGENTE');
  });

  // Gestión de Mensajes
  const loadMessages = async (contextId?: string, contextType?: string) => {
    loading.value = true;
    error.value = null;

    try {
      messages.value = await montajeService.getMensajesColaboracion(contextId, contextType);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading messages';
      console.error('Error loading messages:', err);
    } finally {
      loading.value = false;
    }
  };

  const createMessage = async (messageData: Omit<MensajeColaboracion, 'id' | 'fechaCreacion'>) => {
    try {
      const newMessage: MensajeColaboracion = {
        ...messageData,
        id: Date.now().toString(),
        fechaCreacion: new Date(),
        likes: 0,
        respuestas: [],
      };

      const createdMessage = await montajeService.createMensajeColaboracion(newMessage);
      messages.value.unshift(createdMessage);

      return createdMessage;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating message';
      throw err;
    }
  };

  const replyToMessage = async (messageId: string, contenido: string, autor: string) => {
    try {
      const reply = {
        id: Date.now().toString(),
        contenido,
        autor,
        fechaCreacion: new Date(),
      };

      const message = messages.value.find((m) => m.id === messageId);
      if (message) {
        if (!message.respuestas) message.respuestas = [];
        message.respuestas.push(reply);

        await montajeService.updateMensajeColaboracion(messageId, {
          respuestas: message.respuestas,
        });
      }

      return reply;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error replying to message';
      throw err;
    }
  };

  const likeMessage = async (messageId: string) => {
    try {
      const message = messages.value.find((m) => m.id === messageId);
      if (message) {
        message.likes = (message.likes || 0) + 1;
        await montajeService.updateMensajeColaboracion(messageId, {
          likes: message.likes,
        });
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error liking message';
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await montajeService.deleteMensajeColaboracion(messageId);
      const index = messages.value.findIndex((m) => m.id === messageId);
      if (index > -1) {
        messages.value.splice(index, 1);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting message';
      throw err;
    }
  };

  // Gestión de Notificaciones
  const loadNotifications = async (userId?: string) => {
    loading.value = true;
    error.value = null;

    try {
      notifications.value = await montajeService.getNotificaciones(userId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading notifications';
      console.error('Error loading notifications:', err);
    } finally {
      loading.value = false;
    }
  };

  const createNotification = async (
    notificationData: Omit<Notificacion, 'id' | 'fechaCreacion'>,
  ) => {
    try {
      const newNotification: Notificacion = {
        ...notificationData,
        id: Date.now().toString(),
        fechaCreacion: new Date(),
        estado: 'NO_LEIDA',
      };

      const createdNotification = await montajeService.createNotificacion(newNotification);
      notifications.value.unshift(createdNotification);

      return createdNotification;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating notification';
      throw err;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.value.find((n) => n.id === notificationId);
      if (notification) {
        notification.estado = 'LEIDA';
        notification.fechaLectura = new Date();

        await montajeService.updateNotificacion(notificationId, {
          estado: 'LEIDA',
          fechaLectura: notification.fechaLectura,
        });
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error marking notification as read';
      throw err;
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadIds = unreadNotifications.value.map((n) => n.id);

      for (const id of unreadIds) {
        await markNotificationAsRead(id);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error marking all notifications as read';
      throw err;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await montajeService.deleteNotificacion(notificationId);
      const index = notifications.value.findIndex((n) => n.id === notificationId);
      if (index > -1) {
        notifications.value.splice(index, 1);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting notification';
      throw err;
    }
  };

  // Utilidades
  const getMessageStats = computed(() => {
    const stats = {
      total: messages.value.length,
      byType: {} as Record<TipoMensaje, number>,
      byPriority: {} as Record<PrioridadMensaje, number>,
      byAuthor: {} as Record<string, number>,
    };

    messages.value.forEach((message) => {
      stats.byType[message.tipo] = (stats.byType[message.tipo] || 0) + 1;
      stats.byPriority[message.prioridad] = (stats.byPriority[message.prioridad] || 0) + 1;
      stats.byAuthor[message.autor] = (stats.byAuthor[message.autor] || 0) + 1;
    });

    return stats;
  });

  const getNotificationStats = computed(() => {
    const stats = {
      total: notifications.value.length,
      unread: unreadNotifications.value.length,
      byType: {} as Record<TipoNotificacion, number>,
      byStatus: {} as Record<EstadoNotificacion, number>,
    };

    notifications.value.forEach((notification) => {
      stats.byType[notification.tipo] = (stats.byType[notification.tipo] || 0) + 1;
      stats.byStatus[notification.estado] = (stats.byStatus[notification.estado] || 0) + 1;
    });

    return stats;
  });

  const sendSystemNotification = async (
    titulo: string,
    mensaje: string,
    tipo: TipoNotificacion,
    destinatarios: string[],
    metadata?: Record<string, any>,
  ) => {
    try {
      const notifications = destinatarios.map((destinatario) => ({
        titulo,
        mensaje,
        tipo,
        destinatario,
        metadata,
      }));

      for (const notificationData of notifications) {
        await createNotification(notificationData);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error sending system notification';
      throw err;
    }
  };

  const exportMessages = (format: 'csv' | 'json' = 'csv') => {
    if (format === 'csv') {
      const headers = ['Fecha', 'Autor', 'Tipo', 'Prioridad', 'Título', 'Contenido'];
      const rows = filteredMessages.value.map((message) => [
        new Date(message.fechaCreacion).toLocaleString(),
        message.autor,
        message.tipo,
        message.prioridad,
        message.titulo,
        message.contenido.replace(/"/g, '""'),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mensajes_colaboracion_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(filteredMessages.value, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mensajes_colaboracion_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    // State
    messages,
    notifications,
    loading,
    error,
    messageFilters,
    notificationFilters,

    // Computed
    filteredMessages,
    filteredNotifications,
    unreadNotifications,
    priorityMessages,
    getMessageStats,
    getNotificationStats,

    // Message Methods
    loadMessages,
    createMessage,
    replyToMessage,
    likeMessage,
    deleteMessage,

    // Notification Methods
    loadNotifications,
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    sendSystemNotification,

    // Utilities
    exportMessages,
  };
}
