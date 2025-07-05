// Configuración Centralizada para el Sistema de Validación y Seguridad
// Todas las configuraciones de validación, rate limiting y manejo de errores

export interface SystemConfig {
  validation: {
    phoneNumber: {
      enableValidation: boolean
      normalizeNumbers: boolean
      allowedCountryCodes: string[]
      requireAtLeastOneNumber: boolean
    }
    messages: {
      maxLength: number
      enableSpamDetection: boolean
      maxUrgenctKeywords: number
    }
    timing: {
      allowedHours: {
        start: number // 0-23
        end: number // 0-23
      }
      allowWeekends: boolean
      warnSuboptimalTiming: boolean
    }
  }
  rateLimit: {
    messages: {
      perMinute: number
      perHour: number
      perDay: number
    }
    cooldown: {
      betweenMessages: number // milliseconds
      afterFailure: number // milliseconds
    }
    batch: {
      maxSize: number
      optimalSize: number
    }
  }
  errorHandling: {
    retries: {
      maxAttempts: number
      baseDelay: number // milliseconds
      maxDelay: number // milliseconds
      backoffMultiplier: number
    }
    monitoring: {
      maxErrorHistorySize: number
      errorRetentionDays: number
      healthCheckInterval: number // milliseconds
    }
    alerts: {
      criticalErrorThreshold: number
      warningErrorThreshold: number
      enableAutoSuspension: boolean
    }
  }
  notifications: {
    defaultBatchSize: number
    enableDryRun: boolean
    enableProgressTracking: boolean
    enableDetailedLogging: boolean
  }
}

/**
 * Configuración por defecto del sistema
 */
export const defaultConfig: SystemConfig = {
  validation: {
    phoneNumber: {
      enableValidation: true,
      normalizeNumbers: true,
      allowedCountryCodes: ["+58"], // Venezuela
      requireAtLeastOneNumber: true,
    },
    messages: {
      maxLength: 4096, // Límite de WhatsApp
      enableSpamDetection: true,
      maxUrgenctKeywords: 2,
    },
    timing: {
      allowedHours: {
        start: 6, // 6:00 AM
        end: 23, // 11:00 PM
      },
      allowWeekends: true,
      warnSuboptimalTiming: true,
    },
  },
  rateLimit: {
    messages: {
      perMinute: 10,
      perHour: 100,
      perDay: 500,
    },
    cooldown: {
      betweenMessages: 2000, // 2 segundos
      afterFailure: 5000, // 5 segundos
    },
    batch: {
      maxSize: 50,
      optimalSize: 10,
    },
  },
  errorHandling: {
    retries: {
      maxAttempts: 3,
      baseDelay: 1000, // 1 segundo
      maxDelay: 30000, // 30 segundos
      backoffMultiplier: 2,
    },
    monitoring: {
      maxErrorHistorySize: 1000,
      errorRetentionDays: 7,
      healthCheckInterval: 300000, // 5 minutos
    },
    alerts: {
      criticalErrorThreshold: 50, // 50% de errores
      warningErrorThreshold: 20, // 20% de errores
      enableAutoSuspension: true,
    },
  },
  notifications: {
    defaultBatchSize: 10,
    enableDryRun: false,
    enableProgressTracking: true,
    enableDetailedLogging: true,
  },
}

/**
 * Configuración para entorno de desarrollo
 */
export const developmentConfig: Partial<SystemConfig> = {
  rateLimit: {
    messages: {
      perMinute: 5,
      perHour: 20,
      perDay: 50,
    },
    cooldown: {
      betweenMessages: 5000, // 5 segundos más lento
      afterFailure: 10000,
    },
    batch: {
      maxSize: 10,
      optimalSize: 3,
    },
  },
  notifications: {
    enableDryRun: true, // Por defecto en desarrollo
    enableDetailedLogging: true,
  },
}

/**
 * Configuración para entorno de producción
 */
export const productionConfig: Partial<SystemConfig> = {
  rateLimit: {
    messages: {
      perMinute: 15,
      perHour: 200,
      perDay: 1000,
    },
    cooldown: {
      betweenMessages: 1500, // Más rápido en producción
      afterFailure: 3000,
    },
  },
  errorHandling: {
    alerts: {
      enableAutoSuspension: true,
      criticalErrorThreshold: 30, // Más estricto
      warningErrorThreshold: 15,
    },
  },
  notifications: {
    enableDryRun: false,
    enableDetailedLogging: false, // Menos logs en producción
  },
}

/**
 * Configuración para testing
 */
export const testingConfig: Partial<SystemConfig> = {
  validation: {
    phoneNumber: {
      enableValidation: false, // Permitir números fake en tests
    },
    timing: {
      allowedHours: {
        start: 0,
        end: 23, // Permitir cualquier hora en tests
      },
    },
  },
  rateLimit: {
    messages: {
      perMinute: 1000, // Sin límites en tests
      perHour: 10000,
      perDay: 100000,
    },
    cooldown: {
      betweenMessages: 0, // Sin delays en tests
      afterFailure: 0,
    },
  },
  errorHandling: {
    retries: {
      maxAttempts: 1, // Sin reintentos en tests
    },
  },
  notifications: {
    enableDryRun: true, // Siempre dry run en tests
    enableProgressTracking: false,
  },
}

/**
 * Manager de configuración
 */
class ConfigManager {
  private currentConfig: SystemConfig
  private environment: "development" | "production" | "testing"

  constructor() {
    this.environment = this.detectEnvironment()
    this.currentConfig = this.loadConfig()
  }

  /**
   * Detecta el entorno actual
   */
  private detectEnvironment(): "development" | "production" | "testing" {
    if (typeof process !== "undefined") {
      if (process.env.NODE_ENV === "production") return "production"
      if (process.env.NODE_ENV === "test") return "testing"
    }

    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") return "development"
      if (window.location.hostname.includes("test")) return "testing"
    }

    return "development"
  }

  /**
   * Carga la configuración según el entorno
   */
  private loadConfig(): SystemConfig {
    let config = {...defaultConfig}

    switch (this.environment) {
      case "development":
        config = this.mergeConfigs(config, developmentConfig)
        break
      case "production":
        config = this.mergeConfigs(config, productionConfig)
        break
      case "testing":
        config = this.mergeConfigs(config, testingConfig)
        break
    }

    console.log(`⚙️ Config Manager - Configuración cargada para entorno: ${this.environment}`)
    return config
  }

  /**
   * Merge recursivo de configuraciones
   */
  private mergeConfigs(base: SystemConfig, override: Partial<SystemConfig>): SystemConfig {
    const result = {...base}

    for (const key in override) {
      const overrideValue = override[key as keyof SystemConfig]
      if (overrideValue && typeof overrideValue === "object" && !Array.isArray(overrideValue)) {
        result[key as keyof SystemConfig] = {
          ...result[key as keyof SystemConfig],
          ...overrideValue,
        } as any
      } else if (overrideValue !== undefined) {
        result[key as keyof SystemConfig] = overrideValue as any
      }
    }

    return result
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): SystemConfig {
    return {...this.currentConfig}
  }

  /**
   * Obtiene una sección específica de la configuración
   */
  getSection<T extends keyof SystemConfig>(section: T): SystemConfig[T] {
    return {...this.currentConfig[section]}
  }

  /**
   * Actualiza la configuración (solo para desarrollo/testing)
   */
  updateConfig(updates: Partial<SystemConfig>): void {
    if (this.environment === "production") {
      console.warn("⚠️ Config Manager - No se permite actualizar configuración en producción")
      return
    }

    this.currentConfig = this.mergeConfigs(this.currentConfig, updates)
    console.log("🔄 Config Manager - Configuración actualizada")
  }

  /**
   * Resetea a la configuración por defecto
   */
  resetConfig(): void {
    if (this.environment === "production") {
      console.warn("⚠️ Config Manager - No se permite resetear configuración en producción")
      return
    }

    this.currentConfig = this.loadConfig()
    console.log("🔄 Config Manager - Configuración reseteada")
  }

  /**
   * Obtiene el entorno actual
   */
  getEnvironment(): "development" | "production" | "testing" {
    return this.environment
  }

  /**
   * Valida la configuración actual
   */
  validateConfig(): {isValid: boolean; errors: string[]} {
    const errors: string[] = []
    const config = this.currentConfig

    // Validar rate limits
    if (config.rateLimit.messages.perMinute <= 0) {
      errors.push("Rate limit por minuto debe ser mayor a 0")
    }

    if (config.rateLimit.messages.perHour < config.rateLimit.messages.perMinute) {
      errors.push("Rate limit por hora debe ser mayor o igual al límite por minuto")
    }

    // Validar horarios
    if (config.validation.timing.allowedHours.start >= config.validation.timing.allowedHours.end) {
      errors.push("Hora de inicio debe ser menor a hora de fin")
    }

    // Validar reintentos
    if (config.errorHandling.retries.maxAttempts < 1) {
      errors.push("Máximo de intentos debe ser al menos 1")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// Instancia global del manager de configuración
export const configManager = new ConfigManager()

/**
 * Helpers para obtener configuración
 */
export const getConfig = () => configManager.getConfig()
export const getValidationConfig = () => configManager.getSection("validation")
export const getRateLimitConfig = () => configManager.getSection("rateLimit")
export const getErrorHandlingConfig = () => configManager.getSection("errorHandling")
export const getNotificationConfig = () => configManager.getSection("notifications")

export default {
  configManager,
  getConfig,
  getValidationConfig,
  getRateLimitConfig,
  getErrorHandlingConfig,
  getNotificationConfig,
  defaultConfig,
  developmentConfig,
  productionConfig,
  testingConfig,
}
