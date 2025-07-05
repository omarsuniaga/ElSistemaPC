// Servicio de Manejo de Errores y Reintentos para Notificaciones
// Implementa estrategias de reintento y logging robusto

interface RetryConfig {
  maxAttempts: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
  retryableErrors: string[]
}

interface AttemptResult {
  success: boolean
  attempt: number
  timestamp: number
  error?: string
  duration: number
}

interface RetryResult {
  success: boolean
  totalAttempts: number
  totalDuration: number
  attempts: AttemptResult[]
  finalError?: string
}

interface ErrorStats {
  totalErrors: number
  errorsByType: Record<string, number>
  recentErrors: Array<{
    timestamp: number
    error: string
    context: string
  }>
  retryStats: {
    totalRetries: number
    successAfterRetry: number
    permanentFailures: number
  }
}

class ErrorManager {
  private errorHistory: Array<{
    timestamp: number
    error: string
    context: string
    resolved: boolean
  }> = []

  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      "NETWORK_ERROR",
      "TIMEOUT",
      "RATE_LIMITED",
      "TEMPORARY_UNAVAILABLE",
      "CONNECTION_RESET",
      "SERVICE_UNAVAILABLE",
    ],
  }

  /**
   * Determina si un error es reintentable
   */
  private isRetryableError(error: string): boolean {
    return this.retryConfig.retryableErrors.some((retryableError) =>
      error.toUpperCase().includes(retryableError)
    )
  }

  /**
   * Calcula el delay para el siguiente intento usando backoff exponencial
   */
  private calculateDelay(attempt: number): number {
    const delay =
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1)
    return Math.min(delay, this.retryConfig.maxDelay)
  }

  /**
   * Registra un error en el historial
   */
  logError(error: string, context: string): void {
    this.errorHistory.push({
      timestamp: Date.now(),
      error,
      context,
      resolved: false,
    })

    // Mantener solo los últimos 1000 errores
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000)
    }

    console.error(`🚨 Error Manager - Error registrado: ${context} - ${error}`)
  }

  /**
   * Marca un error como resuelto
   */
  markErrorResolved(errorContext: string): void {
    const recentErrors = this.errorHistory
      .filter((e) => e.context === errorContext && !e.resolved)
      .slice(-5) // Solo los 5 más recientes

    recentErrors.forEach((error) => {
      error.resolved = true
    })

    console.log(`✅ Error Manager - Errores marcados como resueltos para: ${errorContext}`)
  }

  /**
   * Ejecuta una función con reintentos automáticos
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult & {result?: T}> {
    const config = {...this.retryConfig, ...customConfig}
    const attempts: AttemptResult[] = []
    let lastError: string | undefined

    console.log(`🔄 Error Manager - Iniciando operación con reintentos: ${context}`)

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      const startTime = Date.now()

      try {
        console.log(`📝 Error Manager - Intento ${attempt}/${config.maxAttempts} para: ${context}`)

        const result = await operation()
        const duration = Date.now() - startTime

        attempts.push({
          success: true,
          attempt,
          timestamp: startTime,
          duration,
        })

        // Marcar errores previos como resueltos
        if (attempt > 1) {
          this.markErrorResolved(context)
        }

        console.log(`✅ Error Manager - Operación exitosa en intento ${attempt}: ${context}`)

        return {
          success: true,
          totalAttempts: attempt,
          totalDuration: Date.now() - attempts[0].timestamp,
          attempts,
          result,
        }
      } catch (error) {
        const duration = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : String(error)
        lastError = errorMessage

        attempts.push({
          success: false,
          attempt,
          timestamp: startTime,
          error: errorMessage,
          duration,
        })

        this.logError(errorMessage, context)

        // Si es el último intento o el error no es reintentable, terminar
        if (attempt === config.maxAttempts || !this.isRetryableError(errorMessage)) {
          console.error(
            `❌ Error Manager - Operación falló definitivamente: ${context} - ${errorMessage}`
          )
          break
        }

        // Calcular delay y esperar antes del siguiente intento
        const delay = this.calculateDelay(attempt)
        console.log(`⏳ Error Manager - Esperando ${delay}ms antes del siguiente intento...`)

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    return {
      success: false,
      totalAttempts: attempts.length,
      totalDuration: Date.now() - attempts[0].timestamp,
      attempts,
      finalError: lastError,
    }
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStatistics(): ErrorStats {
    const now = Date.now()
    const last24Hours = now - 24 * 60 * 60 * 1000

    const recentErrors = this.errorHistory.filter((e) => e.timestamp > last24Hours)
    const errorsByType: Record<string, number> = {}

    recentErrors.forEach((error) => {
      const errorType = this.categorizeError(error.error)
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1
    })

    const retryAttempts = recentErrors.filter((e) => e.context.includes("Intento"))
    const resolvedErrors = recentErrors.filter((e) => e.resolved)

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      recentErrors: recentErrors.slice(-10).map((e) => ({
        timestamp: e.timestamp,
        error: e.error,
        context: e.context,
      })),
      retryStats: {
        totalRetries: retryAttempts.length,
        successAfterRetry: resolvedErrors.length,
        permanentFailures: recentErrors.filter((e) => !e.resolved).length,
      },
    }
  }

  /**
   * Categoriza errores para estadísticas
   */
  private categorizeError(error: string): string {
    const upperError = error.toUpperCase()

    if (upperError.includes("NETWORK") || upperError.includes("CONNECTION")) {
      return "NETWORK_ERRORS"
    }
    if (upperError.includes("TIMEOUT")) {
      return "TIMEOUT_ERRORS"
    }
    if (upperError.includes("RATE") || upperError.includes("LIMIT")) {
      return "RATE_LIMIT_ERRORS"
    }
    if (upperError.includes("AUTH") || upperError.includes("UNAUTHORIZED")) {
      return "AUTH_ERRORS"
    }
    if (upperError.includes("VALIDATION") || upperError.includes("INVALID")) {
      return "VALIDATION_ERRORS"
    }
    if (upperError.includes("SERVER") || upperError.includes("500")) {
      return "SERVER_ERRORS"
    }

    return "OTHER_ERRORS"
  }

  /**
   * Limpia el historial de errores antiguos
   */
  cleanOldErrors(): void {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const initialLength = this.errorHistory.length

    this.errorHistory = this.errorHistory.filter((error) => error.timestamp > oneWeekAgo)

    const removedCount = initialLength - this.errorHistory.length
    if (removedCount > 0) {
      console.log(`🧹 Error Manager - Limpiados ${removedCount} errores antiguos`)
    }
  }

  /**
   * Genera reporte de salud del sistema
   */
  generateHealthReport(): {
    status: "HEALTHY" | "WARNING" | "CRITICAL"
    details: {
      errorRate: number
      recentFailures: number
      retrySuccessRate: number
      criticalErrors: string[]
    }
    recommendations: string[]
  } {
    const stats = this.getErrorStatistics()
    const recommendations: string[] = []
    let status: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY"

    // Calcular tasa de errores
    const totalOperations = stats.totalErrors + stats.retryStats.successAfterRetry
    const errorRate = totalOperations > 0 ? (stats.totalErrors / totalOperations) * 100 : 0

    // Tasa de éxito de reintentos
    const retrySuccessRate =
      stats.retryStats.totalRetries > 0
        ? (stats.retryStats.successAfterRetry / stats.retryStats.totalRetries) * 100
        : 0

    // Errores críticos
    const criticalErrors = Object.entries(stats.errorsByType)
      .filter(([type, count]) => count > 10 || type === "AUTH_ERRORS")
      .map(([type]) => type)

    // Determinar estado del sistema
    if (errorRate > 50 || criticalErrors.length > 0) {
      status = "CRITICAL"
      recommendations.push("Revisar inmediatamente los errores críticos")
      recommendations.push("Considerar suspender envíos automáticos")
    } else if (errorRate > 20 || retrySuccessRate < 50) {
      status = "WARNING"
      recommendations.push("Monitorear de cerca el sistema")
      recommendations.push("Considerar ajustar configuración de reintentos")
    }

    // Recomendaciones específicas
    if (stats.errorsByType.NETWORK_ERRORS > 5) {
      recommendations.push("Revisar conectividad de red")
    }
    if (stats.errorsByType.RATE_LIMIT_ERRORS > 3) {
      recommendations.push("Ajustar límites de velocidad de envío")
    }
    if (stats.retryStats.permanentFailures > 10) {
      recommendations.push("Revisar datos de contacto inválidos")
    }

    return {
      status,
      details: {
        errorRate,
        recentFailures: stats.retryStats.permanentFailures,
        retrySuccessRate,
        criticalErrors,
      },
      recommendations,
    }
  }
}

// Instancia global del error manager
const globalErrorManager = new ErrorManager()

/**
 * Wrapper para ejecutar operaciones con manejo de errores
 */
export const executeWithErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  options?: {
    maxAttempts?: number
    customRetryLogic?: (error: Error, attempt: number) => boolean
  }
): Promise<{success: boolean; result?: T; error?: string; attempts: number}> => {
  try {
    const result = await globalErrorManager.executeWithRetry(operation, context, {
      maxAttempts: options?.maxAttempts,
    })

    return {
      success: result.success,
      result: result.result,
      error: result.finalError,
      attempts: result.totalAttempts,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    globalErrorManager.logError(errorMessage, context)

    return {
      success: false,
      error: errorMessage,
      attempts: 1,
    }
  }
}

/**
 * Obtiene estadísticas del sistema de errores
 */
export const getErrorStatistics = () => {
  return globalErrorManager.getErrorStatistics()
}

/**
 * Genera reporte de salud del sistema
 */
export const getSystemHealthReport = () => {
  return globalErrorManager.generateHealthReport()
}

/**
 * Limpia errores antiguos del historial
 */
export const cleanErrorHistory = () => {
  globalErrorManager.cleanOldErrors()
}

/**
 * Registra un error manualmente
 */
export const logError = (error: string, context: string) => {
  globalErrorManager.logError(error, context)
}

export default {
  executeWithErrorHandling,
  getErrorStatistics,
  getSystemHealthReport,
  cleanErrorHistory,
  logError,
  ErrorManager,
}
