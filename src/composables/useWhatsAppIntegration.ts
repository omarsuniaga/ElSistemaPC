import {ref, computed, onMounted, onUnmounted} from "vue"
import {
  whatsappService,
  type WhatsAppApiResponse,
  type SendMessageRequest,
} from "../services/whatsappServiceCentralized"

/**
 * Composable para gestión integral de WhatsApp
 * Proporciona una interfaz reactiva para el frontend Netlify
 */

export function useWhatsAppIntegration() {
  // Estados reactivos
  const isInitializing = ref(false)
  const isLoadingQR = ref(false)
  const isSendingMessage = ref(false)
  const qrCodeDataUrl = ref<string>("")
  const lastError = ref<string | null>(null)
  const notifications = ref<
    Array<{id: string; type: "success" | "error" | "warning"; message: string}>
  >([])

  // Obtener estado de conexión del servicio
  const connectionState = whatsappService.getConnectionStatus()

  // Estados computados
  const isConnected = computed(() => connectionState.isHealthy)
  const connectionStatus = computed(() => connectionState.status.value)
  const lastHealthCheck = computed(() => connectionState.lastCheck.value)

  const canSendMessages = computed(
    () => connectionStatus.value === "connected" && !isInitializing.value
  )

  const statusMessage = computed(() => {
    switch (connectionStatus.value) {
      case "connected":
        return "🟢 WhatsApp conectado y funcionando"
      case "disconnected":
        return "🔴 WhatsApp desconectado"
      case "error":
        return "❌ Error en la conexión de WhatsApp"
      case "checking":
        return "🔄 Verificando estado..."
      default:
        return "Estado desconocido"
    }
  })

  // Funciones de utilidad
  const addNotification = (type: "success" | "error" | "warning", message: string) => {
    const id = Date.now().toString()
    notifications.value.unshift({id, type, message})

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value.length = 0
  }

  const clearError = () => {
    lastError.value = null
  }

  // Funciones principales
  const checkStatus = async (): Promise<WhatsAppApiResponse | null> => {
    try {
      clearError()
      const response = await whatsappService.checkStatus()
      addNotification("success", "Estado verificado correctamente")
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      lastError.value = errorMessage
      addNotification("error", `Error al verificar estado: ${errorMessage}`)
      return null
    }
  }

  const initializeWhatsApp = async (): Promise<boolean> => {
    if (isInitializing.value) return false

    isInitializing.value = true
    try {
      clearError()
      addNotification("warning", "Inicializando WhatsApp...")

      const response = await whatsappService.initialize()

      if (response.success) {
        addNotification("success", "WhatsApp inicializado correctamente")
        // Intentar cargar QR automáticamente
        setTimeout(() => {
          loadQRCode()
        }, 2000)
        return true
      } else {
        throw new Error(response.message || "Error al inicializar")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      lastError.value = errorMessage
      addNotification("error", `Error al inicializar: ${errorMessage}`)
      return false
    } finally {
      isInitializing.value = false
    }
  }

  const loadQRCode = async (): Promise<boolean> => {
    if (isLoadingQR.value) return false

    isLoadingQR.value = true
    try {
      clearError()
      const dataUrl = await whatsappService.getQRCode()
      qrCodeDataUrl.value = dataUrl
      addNotification("success", "Código QR cargado")
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      lastError.value = errorMessage
      addNotification("error", `Error al cargar QR: ${errorMessage}`)
      return false
    } finally {
      isLoadingQR.value = false
    }
  }

  const refreshQRCode = async (): Promise<boolean> => {
    qrCodeDataUrl.value = ""
    return await loadQRCode()
  }

  const sendMessage = async (request: SendMessageRequest): Promise<boolean> => {
    if (isSendingMessage.value) return false
    if (!canSendMessages.value) {
      addNotification("error", "WhatsApp no está conectado")
      return false
    }

    isSendingMessage.value = true
    try {
      clearError()
      const response = await whatsappService.sendMessage(request)

      if (response.success) {
        addNotification("success", `Mensaje enviado a ${request.number}`)
        return true
      } else {
        throw new Error(response.message || "Error al enviar mensaje")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      lastError.value = errorMessage
      addNotification("error", `Error al enviar mensaje: ${errorMessage}`)
      return false
    } finally {
      isSendingMessage.value = false
    }
  }

  const restartWhatsApp = async (): Promise<boolean> => {
    try {
      clearError()
      qrCodeDataUrl.value = ""
      addNotification("warning", "Reiniciando WhatsApp...")

      const response = await whatsappService.restart()

      if (response.success) {
        addNotification("success", "WhatsApp reiniciado correctamente")
        // Cargar nuevo QR después del reinicio
        setTimeout(() => {
          loadQRCode()
        }, 3000)
        return true
      } else {
        throw new Error(response.message || "Error al reiniciar")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      lastError.value = errorMessage
      addNotification("error", `Error al reiniciar: ${errorMessage}`)
      return false
    }
  }

  // Auto-inicialización y cleanup
  onMounted(async () => {
    // Verificar estado inicial
    await checkStatus()

    // Si está desconectado, intentar auto-inicializar
    if (connectionStatus.value === "disconnected") {
      console.log("🚀 Auto-inicializando WhatsApp...")
      await initializeWhatsApp()
    }
  })

  onUnmounted(() => {
    // Cleanup del servicio si es necesario
    clearNotifications()
  })

  // API pública del composable
  return {
    // Estados
    isInitializing,
    isLoadingQR,
    isSendingMessage,
    isConnected,
    connectionStatus,
    statusMessage,
    lastHealthCheck,
    canSendMessages,
    qrCodeDataUrl,
    lastError,
    notifications,

    // Acciones
    checkStatus,
    initializeWhatsApp,
    loadQRCode,
    refreshQRCode,
    sendMessage,
    restartWhatsApp,

    // Utilidades
    addNotification,
    removeNotification,
    clearNotifications,
    clearError,

    // Configuración
    setApiUrl: whatsappService.setApiBaseUrl,
  }
}
