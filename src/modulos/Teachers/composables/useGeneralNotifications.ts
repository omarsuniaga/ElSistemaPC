import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import {
  type GeneralNotification,
  getGeneralNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  dismissNotification,
  markActionTaken,
  deleteGeneralNotification,
  subscribeToGeneralNotifications,
  filterValidNotifications
} from '../services/generalNotifications';

export function useGeneralNotifications() {
  const authStore = useAuthStore();
  
  // Estado reactivo
  const notifications = ref<GeneralNotification[]>([]);
  const unreadNotifications = ref<GeneralNotification[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // Listener para notificaciones en tiempo real
  let unsubscribe: (() => void) | null = null;  // Computed properties
  const validNotifications = computed(() => filterValidNotifications(notifications.value));
  
  const unreadCount = computed(() => 
    validNotifications.value.filter(n => n.status === 'unread').length
  );

  const studentRegistrationNotifications = computed(() =>
    validNotifications.value.filter(n => n.type === 'student-registration' && n.status === 'unread')
  );

  const generalAnnouncements = computed(() =>
    validNotifications.value.filter(n => n.type === 'general-announcement')
  );

  const hasUnreadNotifications = computed(() => unreadCount.value > 0);

  /**
   * Cargar todas las notificaciones del maestro
   */
  const loadNotifications = async () => {
    if (!authStore.user?.uid) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      console.log('Cargando notificaciones generales para:', authStore.user.uid);
      const generalNotifications = await getGeneralNotifications(authStore.user.uid);
      notifications.value = generalNotifications;
    } catch (err: any) {
      error.value = err.message || 'Error al cargar notificaciones';
      console.error('Error loading general notifications:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cargar notificaciones no leídas
   */
  const loadUnreadNotifications = async () => {
    if (!authStore.user?.uid) return;
    
    try {
      const unreadList = await getUnreadNotifications(authStore.user.uid);
      unreadNotifications.value = unreadList;
    } catch (err: any) {
      console.error('Error loading unread notifications:', err);
    }
  };

  /**
   * Configurar escucha en tiempo real
   */
  const setupRealtimeListener = () => {
    if (!authStore.user?.uid) return;

    console.log('Configurando listener en tiempo real para notificaciones generales:', authStore.user.uid);
    
    unsubscribe = subscribeToGeneralNotifications(
      authStore.user.uid,
      (generalNotifications) => {
        console.log('Notificaciones generales recibidas en composable:', generalNotifications.length);
        
        notifications.value = generalNotifications;
        
        // Filtrar no leídas
        const unreadList = generalNotifications.filter(n => n.status === 'unread');
        console.log('Notificaciones no leídas encontradas:', unreadList.length);
        
        unreadNotifications.value = unreadList;
      }
    );
  };

  /**
   * Marcar notificación como leída
   */
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Actualizar estado local
      const notification = notifications.value.find(n => n.id === notificationId);
      if (notification) {
        notification.status = 'read';
      }
      
      // Remover de no leídas
      unreadNotifications.value = unreadNotifications.value.filter(n => n.id !== notificationId);
      
      return { success: true };
    } catch (err: any) {
      error.value = err.message || 'Error al marcar como leída';
      console.error('Error marking notification as read:', err);
      return { success: false, error: error.value };
    }
  };

  /**
   * Desestimar notificación
   */
  const dismiss = async (notificationId: string) => {
    try {
      await dismissNotification(notificationId);
      
      // Actualizar estado local
      const notification = notifications.value.find(n => n.id === notificationId);
      if (notification) {
        notification.status = 'dismissed';
      }
      
      // Remover de no leídas
      unreadNotifications.value = unreadNotifications.value.filter(n => n.id !== notificationId);
      
      return { success: true };
    } catch (err: any) {
      error.value = err.message || 'Error al desestimar notificación';
      console.error('Error dismissing notification:', err);
      return { success: false, error: error.value };
    }
  };

  /**
   * Marcar que se tomó acción
   */
  const takeAction = async (notificationId: string, actionDetails?: any) => {
    try {
      await markActionTaken(notificationId, actionDetails);
      
      // Actualizar estado local
      const notification = notifications.value.find(n => n.id === notificationId);
      if (notification) {
        notification.status = 'action-taken';
      }
      
      // Remover de no leídas
      unreadNotifications.value = unreadNotifications.value.filter(n => n.id !== notificationId);
      
      return { success: true };
    } catch (err: any) {
      error.value = err.message || 'Error al marcar acción tomada';
      console.error('Error marking action taken:', err);
      return { success: false, error: error.value };
    }
  };

  /**
   * Eliminar notificación
   */
  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteGeneralNotification(notificationId);
      
      // Remover del estado local
      notifications.value = notifications.value.filter(n => n.id !== notificationId);
      unreadNotifications.value = unreadNotifications.value.filter(n => n.id !== notificationId);
      
      return { success: true };
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar notificación';
      console.error('Error deleting notification:', err);
      return { success: false, error: error.value };
    }
  };

  /**
   * Función para inicializar el composable cuando hay un usuario autenticado
   */
  const initializeNotifications = () => {
    if (authStore.user?.uid) {
      console.log('Inicializando notificaciones generales para maestro:', authStore.user.uid);
      loadNotifications();
      loadUnreadNotifications();
      setupRealtimeListener();
    }
  };

  /**
   * Limpiar error
   */
  const clearError = () => {
    error.value = null;
  };

  // Observar cambios en el estado de autenticación
  const authWatch = computed(() => authStore.user?.uid);
  watch(authWatch, (newUserId: string | undefined) => {
    // Si cambia el usuario, limpiar listener anterior
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    
    // Si hay nuevo usuario, inicializar
    if (newUserId) {
      initializeNotifications();
    } else {
      // Limpiar estado si no hay usuario
      notifications.value = [];
      unreadNotifications.value = [];
    }
  }, { immediate: true });

  // Lifecycle hooks
  onMounted(() => {
    initializeNotifications();
  });

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
  return {
    // Estado
    notifications: validNotifications,
    unreadNotifications,
    isLoading,
    error,
    
    // Computed
    unreadCount,
    studentRegistrationNotifications,
    generalAnnouncements,
    hasUnreadNotifications,
    
    // Métodos
    loadNotifications,
    loadUnreadNotifications,
    markAsRead,
    dismiss,
    takeAction,
    deleteNotification,
    clearError,
    setupRealtimeListener
  };
}
