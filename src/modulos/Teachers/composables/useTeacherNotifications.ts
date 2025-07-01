import {ref, computed, onMounted, onUnmounted, watch} from "vue"
import {useAuthStore} from "../../../stores/auth"
import {
  type TeacherNotification,
  getTeacherNotifications,
  getPendingInvitations,
  acceptClassInvitation,
  rejectClassInvitation,
  markNotificationAsRead,
  deleteNotification,
  subscribeToTeacherNotifications,
  filterValidTeacherNotifications,
} from "../services/teacherNotifications"

export function useTeacherNotifications() {
  const authStore = useAuthStore()

  // Estado reactivo
  const notifications = ref<TeacherNotification[]>([])
  const pendingInvitations = ref<TeacherNotification[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Listener para notificaciones en tiempo real
  let unsubscribe: (() => void) | null = null
  // Computed properties
  const validNotifications = computed(() => filterValidTeacherNotifications(notifications.value))
  const validPendingInvitations = computed(() =>
    filterValidTeacherNotifications(pendingInvitations.value)
  )

  const unreadCount = computed(
    () =>
      validNotifications.value.filter((n) => n.status === "unread" || n.status === "pending").length
  )

  const pendingInvitationsCount = computed(
    () => validPendingInvitations.value.filter((n) => n.status === "pending").length
  )

  const hasNewInvitations = computed(() => pendingInvitationsCount.value > 0)

  /**
   * Cargar todas las notificaciones del maestro
   */
  const loadNotifications = async () => {
    if (!authStore.user?.uid) return

    isLoading.value = true
    error.value = null

    try {
      const teacherNotifications = await getTeacherNotifications(authStore.user.uid)
      notifications.value = teacherNotifications
    } catch (err: any) {
      error.value = err.message || "Error al cargar notificaciones"
      console.error("Error loading notifications:", err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cargar invitaciones pendientes
   */
  const loadPendingInvitations = async () => {
    if (!authStore.user?.uid) return

    try {
      const invitations = await getPendingInvitations(authStore.user.uid)
      pendingInvitations.value = invitations
    } catch (err: any) {
      console.error("Error loading pending invitations:", err)
    }
  }
  /**
   * Configurar escucha en tiempo real
   */
  const setupRealtimeListener = () => {
    if (!authStore.user?.uid) return

    console.log("Configurando listener en tiempo real para:", authStore.user.uid)
    unsubscribe = subscribeToTeacherNotifications(authStore.user.uid, (teacherNotifications) => {
      console.log("Notificaciones recibidas en composable:", teacherNotifications.length)

      notifications.value = teacherNotifications

      // Limpiar notificaciones inválidas
      cleanInvalidNotifications()

      // Filtrar invitaciones pendientes
      const pendingInvites = notifications.value.filter(
        (n) => n.type === "class-invitation" && n.status === "pending"
      )

      console.log("Invitaciones pendientes encontradas:", pendingInvites.length)

      pendingInvitations.value = pendingInvites
    })
  }
  /**
   * Aceptar una invitación de clase
   */
  const acceptInvitation = async (notificationId: string) => {
    isLoading.value = true
    error.value = null

    try {
      await acceptClassInvitation(notificationId)

      // Actualizar estado local
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification) {
        notification.status = "accepted"
      }

      // Remover de invitaciones pendientes
      pendingInvitations.value = pendingInvitations.value.filter((n) => n.id !== notificationId)

      return {success: true}
    } catch (err: any) {
      error.value = err.message || "Error al aceptar invitación"
      console.error("Error accepting invitation:", err)
      // Si el error es porque la clase no existe, la notificación ya fue marcada como inválida
      // Forzar recarga de notificaciones para actualizar el estado local
      if (err.message && err.message.includes("no existe en el sistema")) {
        console.log("Clase no existe, recargando notificaciones para actualizar UI...")

        // Marcar la notificación como inválida localmente también
        const notification = notifications.value.find((n) => n.id === notificationId)
        if (notification) {
          notification.status = "invalid"
        }

        // Remover de invitaciones pendientes inmediatamente
        pendingInvitations.value = pendingInvitations.value.filter((n) => n.id !== notificationId)

        // Recargar notificaciones para sincronizar con el backend
        await loadNotifications()
        await loadPendingInvitations()

        // Cambiar el mensaje de error por uno más amigable
        error.value = "Esta clase ya no existe. La invitación ha sido eliminada automáticamente."
      }

      return {success: false, error: error.value}
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Rechazar una invitación de clase
   */
  const rejectInvitation = async (notificationId: string, reason?: string) => {
    isLoading.value = true
    error.value = null

    try {
      await rejectClassInvitation(notificationId, reason)

      // Actualizar estado local
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification) {
        notification.status = "rejected"
      }

      // Remover de invitaciones pendientes
      pendingInvitations.value = pendingInvitations.value.filter((n) => n.id !== notificationId)

      return {success: true}
    } catch (err: any) {
      error.value = err.message || "Error al rechazar invitación"
      console.error("Error rejecting invitation:", err)
      return {success: false, error: error.value}
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Marcar notificación como leída
   */
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)

      // Actualizar estado local
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification) {
        notification.status = "read"
      }
    } catch (err: any) {
      console.error("Error marking notification as read:", err)
    }
  }

  /**
   * Eliminar notificación
   */
  const deleteNotificationItem = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)

      // Remover del estado local
      notifications.value = notifications.value.filter((n) => n.id !== notificationId)
      pendingInvitations.value = pendingInvitations.value.filter((n) => n.id !== notificationId)
    } catch (err: any) {
      console.error("Error deleting notification:", err)
    }
  }

  /**
   * Filtrar y limpiar notificaciones inválidas
   */
  const cleanInvalidNotifications = () => {
    // Filtrar notificaciones que no tengan status 'invalid'
    notifications.value = notifications.value.filter((notification) => {
      if (notification.status === "invalid") {
        console.log("🗑️ Filtrando notificación inválida:", notification.id)
        return false
      }
      return true
    })

    // También filtrar invitaciones pendientes
    pendingInvitations.value = pendingInvitations.value.filter((notification) => {
      if (notification.status === "invalid") {
        return false
      }
      return true
    })
  }

  /**
   * Obtener la notificación de invitación más reciente
   */
  const getLatestInvitation = computed(() => {
    return pendingInvitations.value.length > 0 ? pendingInvitations.value[0] : null
  })

  /**
   * Limpiar error
   */
  const clearError = () => {
    error.value = null
  }
  // Función para inicializar el composable cuando hay un usuario autenticado
  const initializeNotifications = () => {
    if (authStore.user?.uid) {
      console.log("Inicializando notificaciones para maestro:", authStore.user.uid)
      loadNotifications()
      loadPendingInvitations()
      setupRealtimeListener()
    }
  }
  // Observar cambios en el estado de autenticación
  const authWatch = computed(() => authStore.user?.uid)
  watch(
    authWatch,
    (newUserId: string | undefined) => {
      // Si cambia el usuario, limpiar listener anterior
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }

      // Si hay nuevo usuario, inicializar
      if (newUserId) {
        initializeNotifications()
      } else {
        // Limpiar estado si no hay usuario
        notifications.value = []
        pendingInvitations.value = []
      }
    },
    {immediate: true}
  )

  // Lifecycle hooks
  onMounted(() => {
    initializeNotifications()
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })
  return {
    // Estado
    notifications: validNotifications,
    pendingInvitations: validPendingInvitations,
    isLoading,
    error,

    // Computed
    unreadCount,
    pendingInvitationsCount,
    hasNewInvitations,
    getLatestInvitation,

    // Métodos
    loadNotifications,
    loadPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    markAsRead,
    deleteNotificationItem,
    clearError,
    setupRealtimeListener,
    cleanInvalidNotifications,
  }
}
