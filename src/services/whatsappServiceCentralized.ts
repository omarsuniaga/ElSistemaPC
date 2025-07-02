import {ref} from "vue"

/**
 * Servicio centralizado para comunicación con Firebase Functions WhatsApp
 * Maneja la comunicación entre Netlify frontend y Firebase Functions backend
 */

interface WhatsAppApiResponse {
  success?: boolean
  status: string
  message?: string
  timestamp: string
  hasQR?: boolean
  qr_data?: string
  error?: string
}

interface SendMessageRequest {
  number: string
  message: string
}

interface SendMessageResponse {
  success: boolean
  message: string
  timestamp: string
  error?: string
}

interface WhatsAppConfig {
  apiBaseUrl: string
  retryAttempts: number
  retryDelay: number
  healthCheckInterval: number
}

class WhatsAppService {
  private config: WhatsAppConfig
  private connectionStatus = ref<"connected" | "disconnected" | "error" | "checking">("checking")
  private isHealthChecking = ref(false)
  private healthCheckInterval: NodeJS.Timeout | null = null
  private lastSuccessfulCheck = ref<Date | null>(null)

  constructor() {
    this.config = {
      apiBaseUrl: "https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi",
      retryAttempts: 3,
      retryDelay: 2000,
      healthCheckInterval: 30000, // 30 segundos
    }

    // Iniciar health check automático
    this.startHealthCheck()
  }

  /**
   * Realizar petición HTTP con reintentos automáticos
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiBaseUrl}${endpoint}`

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`📡 [WhatsApp API] ${options.method || "GET"} ${endpoint} (attempt ${attempt})`)

        const response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...options.headers,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("✅ [WhatsApp API] Success:", data)

        this.connectionStatus.value = "connected"
        this.lastSuccessfulCheck.value = new Date()

        return data
      } catch (error) {
        console.error(`❌ [WhatsApp API] Attempt ${attempt} failed:`, error)

        if (attempt === this.config.retryAttempts) {
          this.connectionStatus.value = "error"
          throw error
        }

        // Esperar antes del siguiente intento
        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay))
      }
    }

    throw new Error("Max retry attempts reached")
  }

  /**
   * Verificar estado del servicio WhatsApp
   */
  async checkStatus(): Promise<WhatsAppApiResponse> {
    try {
      const response = await this.makeRequest<WhatsAppApiResponse>("/status")
      return response
    } catch (error) {
      console.error("Error checking WhatsApp status:", error)
      throw error
    }
  }

  /**
   * Inicializar WhatsApp
   */
  async initialize(): Promise<WhatsAppApiResponse> {
    try {
      const response = await this.makeRequest<WhatsAppApiResponse>("/init", {
        method: "POST",
      })
      return response
    } catch (error) {
      console.error("Error initializing WhatsApp:", error)
      throw error
    }
  }

  /**
   * Obtener código QR
   */
  async getQRCode(): Promise<string> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/qr`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Si la respuesta es una imagen, convertirla a Data URL
      if (response.headers.get("content-type")?.includes("image")) {
        const blob = await response.blob()
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } else {
        // Si es JSON, procesar como antes
        const data = await response.json()
        return data.qr_data || ""
      }
    } catch (error) {
      console.error("Error getting QR code:", error)
      throw error
    }
  }

  /**
   * Enviar mensaje
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await this.makeRequest<SendMessageResponse>("/send-message", {
        method: "POST",
        body: JSON.stringify({
          number: request.number,
          message: request.message,
        }),
      })
      return response
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  /**
   * Reiniciar WhatsApp
   */
  async restart(): Promise<WhatsAppApiResponse> {
    try {
      const response = await this.makeRequest<WhatsAppApiResponse>("/restart", {
        method: "POST",
      })
      return response
    } catch (error) {
      console.error("Error restarting WhatsApp:", error)
      throw error
    }
  }

  /**
   * Health check automático
   */
  private startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.isHealthChecking.value) return

      this.isHealthChecking.value = true
      try {
        await this.checkStatus()
        console.log("💓 [WhatsApp Health Check] Service is healthy")
      } catch (error) {
        console.warn("⚠️ [WhatsApp Health Check] Service check failed:", error)
        this.connectionStatus.value = "error"
      } finally {
        this.isHealthChecking.value = false
      }
    }, this.config.healthCheckInterval)
  }

  /**
   * Detener health check
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * Obtener estado de conexión reactivo
   */
  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      lastCheck: this.lastSuccessfulCheck,
      isHealthy: this.connectionStatus.value === "connected",
    }
  }

  /**
   * Configurar URL base personalizada (para desarrollo/staging)
   */
  setApiBaseUrl(url: string) {
    this.config.apiBaseUrl = url
  }
}

// Instancia singleton
const whatsappService = new WhatsAppService()

export {
  whatsappService,
  type WhatsAppApiResponse,
  type SendMessageRequest,
  type SendMessageResponse,
}
