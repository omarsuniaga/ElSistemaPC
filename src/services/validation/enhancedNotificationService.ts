// Servicio de Notificaciones Mejorado con Validación, Rate Limiting y Manejo de Errores
// Integra todos los servicios de validación para un sistema robusto

import {
  validateStudentsForBulkNotification,
  validateNotificationRequest,
} from "./attendanceValidator"
import {sendBatchWithRateLimit} from "./rateLimitManager"
import {executeWithErrorHandling, getSystemHealthReport} from "./errorManager"

// Interfaces mejoradas
interface EnhancedNotificationResult {
  success: boolean
  summary: {
    total: number
    successful: number
    failed: number
    rateLimited: number
    invalid: number
  }
  validation: {
    validStudents: number
    invalidStudents: number
    recommendations: string[]
  }
  performance: {
    totalDuration: number
    averageTimePerMessage: number
    retryAttempts: number
  }
  healthStatus: {
    systemStatus: "HEALTHY" | "WARNING" | "CRITICAL"
    canContinue: boolean
    warnings: string[]
  }
  detailedResults: Array<{
    studentId: string
    studentName: string
    phoneNumbers: string[]
    success: boolean
    error?: string
    escalationLevel?: number
  }>
}

interface NotificationOptions {
  validateBeforeSend?: boolean
  respectRateLimit?: boolean
  enableRetries?: boolean
  maxRetryAttempts?: number
  dryRun?: boolean
  batchSize?: number
  onProgress?: (progress: {
    completed: number
    total: number
    currentStudent: string
    phase: "validation" | "sending" | "completed"
  }) => void
}

/**
 * SERVICIO PRINCIPAL: Notificaciones con validación completa
 */
export class EnhancedNotificationService {
  private options: Required<NotificationOptions> = {
    validateBeforeSend: true,
    respectRateLimit: true,
    enableRetries: true,
    maxRetryAttempts: 3,
    dryRun: false,
    batchSize: 10,
    onProgress: () => {},
  }

  constructor(options?: Partial<NotificationOptions>) {
    this.options = {...this.options, ...options}
  }

  /**
   * Envío de notificaciones con validación completa
   */
  async sendNotifications(request: {
    studentIds: string[]
    messageType: "tardanza" | "ausencia_justificada" | "inasistencia" | "custom"
    customMessage?: string
    getStudentData: (id: string) => Promise<any>
    getMessageTemplate: (type: string, escalationLevel?: number) => string
    sendWhatsAppMessage: (phone: string, message: string) => Promise<boolean>
    escalationLevels?: Record<string, number> // studentId -> level
  }): Promise<EnhancedNotificationResult> {
    const startTime = Date.now()

    console.log(
      `🚀 Enhanced Notifications - Iniciando proceso mejorado para ${request.studentIds.length} estudiantes`
    )

    // Inicializar resultado
    const result: EnhancedNotificationResult = {
      success: false,
      summary: {
        total: request.studentIds.length,
        successful: 0,
        failed: 0,
        rateLimited: 0,
        invalid: 0,
      },
      validation: {
        validStudents: 0,
        invalidStudents: 0,
        recommendations: [],
      },
      performance: {
        totalDuration: 0,
        averageTimePerMessage: 0,
        retryAttempts: 0,
      },
      healthStatus: {
        systemStatus: "HEALTHY",
        canContinue: true,
        warnings: [],
      },
      detailedResults: [],
    }

    try {
      // Fase 1: Verificar salud del sistema
      this.updateProgress(
        "validation",
        0,
        request.studentIds.length,
        "Verificando salud del sistema"
      )

      const healthReport = getSystemHealthReport()
      result.healthStatus.systemStatus = healthReport.status
      result.healthStatus.warnings = healthReport.recommendations

      if (healthReport.status === "CRITICAL") {
        result.healthStatus.canContinue = false
        throw new Error("Sistema en estado crítico. Suspendiendo envíos automáticos.")
      }

      // Fase 2: Validación completa
      this.updateProgress(
        "validation",
        0,
        request.studentIds.length,
        "Validando datos de estudiantes"
      )

      const validationResult = await executeWithErrorHandling(
        () =>
          validateNotificationRequest({
            studentIds: request.studentIds,
            messageType: request.messageType,
            customMessage: request.customMessage,
            getStudentData: request.getStudentData,
          }),
        "Validación de notificación"
      )

      if (!validationResult.success || !validationResult.result) {
        throw new Error(`Error en validación: ${validationResult.error}`)
      }

      const validation = validationResult.result
      result.validation.validStudents = validation.studentValidation.valid.length
      result.validation.invalidStudents = validation.studentValidation.invalid.length
      result.validation.recommendations = validation.recommendations
      result.summary.invalid = validation.studentValidation.invalid.length

      // Agregar estudiantes inválidos al resultado detallado
      validation.studentValidation.invalid.forEach((student) => {
        result.detailedResults.push({
          studentId: student.id,
          studentName: student.name,
          phoneNumbers: student.phoneNumbers,
          success: false,
          error: student.errors.join(", "),
        })
      })

      if (!validation.canProceed) {
        throw new Error("Validación falló: " + validation.recommendations.join(", "))
      }

      // Fase 3: Preparar mensajes
      this.updateProgress("validation", 25, request.studentIds.length, "Preparando mensajes")

      const messages: Array<{
        phoneNumber: string
        message: string
        messageType: string
        studentId: string
        studentName: string
      }> = []

      for (const student of validation.studentValidation.valid) {
        const escalationLevel = request.escalationLevels?.[student.id]
        const messageTemplate = request.getMessageTemplate(request.messageType, escalationLevel)

        for (const phoneNumber of student.phoneNumbers) {
          messages.push({
            phoneNumber,
            message: messageTemplate.replace(/{studentName}/g, student.name),
            messageType: request.messageType,
            studentId: student.id,
            studentName: student.name,
          })
        }
      }

      // Modo dry run
      if (this.options.dryRun) {
        console.log("🧪 Dry Run - No se enviarán mensajes reales")
        result.success = true
        result.summary.successful = messages.length
        return result
      }

      // Fase 4: Envío con rate limiting
      this.updateProgress("sending", 50, request.studentIds.length, "Enviando notificaciones")

      const batchResult = await sendBatchWithRateLimit(
        messages,
        request.sendWhatsAppMessage,
        (completed, total, current) => {
          this.updateProgress(
            "sending",
            50 + (completed / total) * 45,
            request.studentIds.length,
            current
          )
        }
      )

      // Procesar resultados
      const studentResults = new Map<
        string,
        {
          studentId: string
          studentName: string
          phoneNumbers: string[]
          success: boolean
          error?: string
          escalationLevel?: number
        }
      >()

      // Inicializar todos los estudiantes válidos
      validation.studentValidation.valid.forEach((student) => {
        studentResults.set(student.id, {
          studentId: student.id,
          studentName: student.name,
          phoneNumbers: student.phoneNumbers,
          success: true, // Asumimos éxito inicialmente
          escalationLevel: request.escalationLevels?.[student.id],
        })
      })

      // Actualizar con resultados reales
      batchResult.results.forEach((msgResult, index) => {
        const message = messages[index]
        const studentResult = studentResults.get(message.studentId)

        if (studentResult) {
          if (!msgResult.success) {
            studentResult.success = false
            studentResult.error = msgResult.error || "Error desconocido"
          }
        }
      })

      // Convertir a array y actualizar resumen
      result.detailedResults.push(...Array.from(studentResults.values()))
      result.summary.successful = batchResult.summary.successful
      result.summary.failed = batchResult.summary.failed
      result.summary.rateLimited = batchResult.summary.rateLimited

      // Fase 5: Finalización
      this.updateProgress("completed", 100, request.studentIds.length, "Proceso completado")

      result.success = batchResult.summary.successful > 0
      result.performance.totalDuration = Date.now() - startTime
      result.performance.averageTimePerMessage = result.performance.totalDuration / messages.length

      console.log(
        `✅ Enhanced Notifications - Proceso completado: ${result.summary.successful} éxitos, ${result.summary.failed} fallos`
      )

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("❌ Enhanced Notifications - Error en proceso:", errorMessage)

      result.success = false
      result.performance.totalDuration = Date.now() - startTime
      result.healthStatus.warnings.push(errorMessage)

      return result
    }
  }

  /**
   * Notificación de progreso
   */
  private updateProgress(
    phase: "validation" | "sending" | "completed",
    percentage: number,
    total: number,
    currentOperation: string
  ): void {
    this.options.onProgress({
      completed: Math.floor((percentage / 100) * total),
      total,
      currentStudent: currentOperation,
      phase,
    })
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getSystemStatistics(): Promise<{
    health: ReturnType<typeof getSystemHealthReport>
    // rateLimits: ReturnType<typeof getRateLimitStatistics>
    // errors: ReturnType<typeof getErrorStatistics>
  }> {
    return {
      health: getSystemHealthReport(),
      // rateLimits: getRateLimitStatistics(),
      // errors: getErrorStatistics()
    }
  }

  /**
   * Configurar opciones del servicio
   */
  configure(options: Partial<NotificationOptions>): void {
    this.options = {...this.options, ...options}
  }
}

/**
 * Instancia global del servicio mejorado
 */
export const enhancedNotificationService = new EnhancedNotificationService()

/**
 * Función helper para migrar desde el servicio anterior
 */
export const sendNotificationsWithValidation = (
  studentIds: string[],
  messageType: "tardanza" | "ausencia_justificada" | "inasistencia",
  options?: {
    onProgress?: (completed: number, total: number, current: string) => void
    dryRun?: boolean
  }
) => {
  // Esta función será implementada para integrar con el servicio existente
  console.log("🔄 Migración pendiente - Usar enhancedNotificationService directamente")
}

export default {
  EnhancedNotificationService,
  enhancedNotificationService,
  sendNotificationsWithValidation,
}
