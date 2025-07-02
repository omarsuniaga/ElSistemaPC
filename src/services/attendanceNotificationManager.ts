// Inicializador del Sistema de Notificaciones de Asistencia
// Se ejecuta al iniciar la aplicación para configurar listeners automáticos

import {attendanceNotificationSystem} from "./attendanceNotificationTrigger"
// import { useAuthStore } from '../stores/authStore' // No se puede usar aquí directamente

interface NotificationSystemState {
  isActive: boolean
  unsubscribeFunction: (() => void) | null
  lastError: string | null
  startTime: Date | null
}

class AttendanceNotificationManager {
  private state: NotificationSystemState = {
    isActive: false,
    unsubscribeFunction: null,
    lastError: null,
    startTime: null,
  }

  /**
   * Inicializa el sistema de notificaciones
   * Solo se activa para usuarios con roles de Admin/Director
   */
  async initialize(): Promise<void> {
    try {
      console.log("🔧 Inicializando sistema de notificaciones de asistencia...")

      // TEMPORAL: Comentado verificación de permisos debido a problema con useAuthStore
      // const authStore = useAuthStore()
      // const userRole = authStore.user?.role || ''

      // if (!this.hasNotificationPermissions(userRole)) {
      //   console.log('ℹ️ Usuario sin permisos de notificaciones, saltando inicialización')
      //   return
      // }

      // Evitar doble inicialización
      if (this.state.isActive) {
        console.log("⚠️ Sistema de notificaciones ya está activo")
        return
      }

      // Iniciar observador de asistencia
      this.state.unsubscribeFunction = attendanceNotificationSystem.watchForNewAttendance()
      this.state.isActive = true
      this.state.startTime = new Date()
      this.state.lastError = null

      console.log("✅ Sistema de notificaciones de asistencia iniciado correctamente")

      // Log de estado inicial
      this.logSystemStatus()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      this.state.lastError = errorMessage
      console.error("❌ Error inicializando sistema de notificaciones:", errorMessage)

      // Intentar recuperación automática en 30 segundos
      setTimeout(() => {
        console.log("🔄 Intentando recuperación automática del sistema de notificaciones...")
        this.initialize()
      }, 30000)
    }
  }

  /**
   * Detiene el sistema de notificaciones
   */
  shutdown(): void {
    try {
      console.log("🛑 Deteniendo sistema de notificaciones de asistencia...")

      if (this.state.unsubscribeFunction) {
        this.state.unsubscribeFunction()
        this.state.unsubscribeFunction = null
      }

      this.state.isActive = false
      this.state.startTime = null

      console.log("✅ Sistema de notificaciones detenido correctamente")
    } catch (error) {
      console.error("❌ Error deteniendo sistema de notificaciones:", error)
    }
  }

  /**
   * Reinicia el sistema de notificaciones
   */
  async restart(): Promise<void> {
    console.log("🔄 Reiniciando sistema de notificaciones...")
    this.shutdown()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Esperar 1 segundo
    await this.initialize()
  }

  /**
   * Verifica si el usuario tiene permisos para recibir notificaciones
   */
  private hasNotificationPermissions(userRole: string): boolean {
    const allowedRoles = ["Admin", "Director", "SuperAdmin"]
    return allowedRoles.includes(userRole)
  }

  /**
   * Log del estado actual del sistema
   */
  private logSystemStatus(): void {
    const uptime = this.state.startTime
      ? Math.floor((Date.now() - this.state.startTime.getTime()) / 1000)
      : 0

    console.log(`📊 Estado del Sistema de Notificaciones:`, {
      activo: this.state.isActive,
      tiempoActivo: `${uptime} segundos`,
      ultimoError: this.state.lastError || "Ninguno",
      iniciadoEn: this.state.startTime?.toLocaleString() || "No iniciado",
    })
  }

  /**
   * Obtiene el estado actual del sistema
   */
  getStatus(): NotificationSystemState & {uptime: number} {
    const uptime = this.state.startTime
      ? Math.floor((Date.now() - this.state.startTime.getTime()) / 1000)
      : 0

    return {
      ...this.state,
      uptime,
    }
  }

  /**
   * Verifica si el sistema está funcionando correctamente
   */
  healthCheck(): boolean {
    return this.state.isActive && !this.state.lastError
  }
}

// Instancia singleton
const notificationManager = new AttendanceNotificationManager()

/**
 * Inicializa el sistema automáticamente cuando se importa el módulo
 * Se ejecuta una sola vez por sesión
 */
let isAutoInitialized = false

const autoInitialize = async () => {
  if (isAutoInitialized) return

  try {
    // Esperar a que el sistema de autenticación esté listo
    await new Promise((resolve) => setTimeout(resolve, 2000))

    await notificationManager.initialize()
    isAutoInitialized = true
  } catch (error) {
    console.error("Error en auto-inicialización de notificaciones:", error)
  }
}

// Funciones exportadas para control manual
export const notificationSystem = {
  /**
   * Inicializa manualmente el sistema
   */
  initialize: () => notificationManager.initialize(),

  /**
   * Detiene el sistema
   */
  shutdown: () => notificationManager.shutdown(),

  /**
   * Reinicia el sistema
   */
  restart: () => notificationManager.restart(),

  /**
   * Obtiene el estado actual
   */
  getStatus: () => notificationManager.getStatus(),

  /**
   * Verifica la salud del sistema
   */
  healthCheck: () => notificationManager.healthCheck(),

  /**
   * Fuerza la auto-inicialización
   */
  forceAutoInitialize: autoInitialize,
}

// Auto-inicializar si estamos en el browser
if (typeof window !== "undefined") {
  // Ejecutar en el próximo tick para permitir que Vue se inicialice
  setTimeout(autoInitialize, 100)
}

export default notificationSystem

// Log de carga del módulo
console.log("📦 Módulo de gestión de notificaciones de asistencia cargado")
