import {computed, onMounted, onUnmounted, ref} from "vue"
import {whatsappService, type SendMessageRequest} from "@/services/whatsappService"

/**
 * Composable para usar WhatsApp Service en componentes Vue
 * Proporciona estado reactivo y funciones para la UI
 */
export function useWhatsApp() {
  // Estados locales del composable
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const qrCodeUrl = ref<string>("")

  // Estados del servicio (reactivos)
  const connectionState = whatsappService.getConnectionStatus()

  // Estados computados
  const isConnected = computed(() => connectionState.isHealthy)
  const connectionStatus = computed(() => connectionState.status.value)
  const lastCheck = computed(() => connectionState.lastCheck.value)

  const statusDisplay = computed(() => {
    switch (connectionStatus.value) {
      case "connected":
        return {
          color: "green",
          icon: "🟢",
          message: "WhatsApp conectado",
        }
      case "checking":
        return {
          color: "yellow",
          icon: "🔄",
          message: "Verificando conexión...",
        }
      case "error":
        return {
          color: "red",
          icon: "❌",
          message: "Error de conexión",
        }
      default:
        return {
          color: "gray",
          icon: "🔴",
          message: "Desconectado",
        }
    }
  })

  // Funciones principales
  const checkStatus = async () => {
    try {
      isLoading.value = true
      error.value = null
      await whatsappService.checkStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Error desconocido"
    } finally {
      isLoading.value = false
    }
  }

  const initialize = async () => {
    try {
      isLoading.value = true
      error.value = null
      const result = await whatsappService.initialize()

      if (result.success) {
        // Auto-cargar QR después de inicializar
        setTimeout(loadQR, 2000)
      }

      return result.success
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Error al inicializar"
      return false
    } finally {
      isLoading.value = false
    }
  }

  const loadQR = async () => {
    try {
      error.value = null
      const qrData = await whatsappService.getQRCode()
      qrCodeUrl.value = qrData
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Error cargando QR"
      return false
    }
  }

  const sendMessage = async (request: SendMessageRequest) => {
    try {
      isLoading.value = true
      error.value = null
      const result = await whatsappService.sendMessage(request)
      return result.success
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Error enviando mensaje"
      return false
    } finally {
      isLoading.value = false
    }
  }

  const restart = async () => {
    try {
      isLoading.value = true
      error.value = null
      qrCodeUrl.value = ""

      const result = await whatsappService.restart()

      if (result.success) {
        // Auto-cargar QR después de reiniciar
        setTimeout(loadQR, 3000)
      }

      return result.success
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Error al reiniciar"
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Auto-inicialización
  onMounted(async () => {
    await checkStatus()

    // Si está desconectado, auto-inicializar
    if (connectionStatus.value === "disconnected") {
      await initialize()
    }
  })

  // Cleanup
  onUnmounted(() => {
    // El servicio maneja su propio cleanup
  })

  return {
    // Estados
    isLoading,
    error,
    qrCodeUrl,
    isConnected,
    connectionStatus,
    statusDisplay,
    lastCheck,

    // Acciones
    checkStatus,
    initialize,
    loadQR,
    sendMessage,
    restart,
    clearError,

    // Utilidades
    formatTime: (date: Date | null) => (date ? date.toLocaleTimeString("es-ES") : "Nunca"),
  }
}
