/**
 * Debug utilities for controlling logging in production
 * Provides environment-aware debugging capabilities
 */

// Environment detection
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD
const debugMode = import.meta.env.VITE_DEBUG_MODE === "true"

export interface DebugConfig {
  enableConsole: boolean
  enableFirebaseLogging: boolean
  enablePerformanceTracking: boolean
  enableErrorTracking: boolean
  logLevel: "debug" | "info" | "warn" | "error"
}

// Default configuration based on environment
const defaultConfig: DebugConfig = {
  enableConsole: isDevelopment || debugMode,
  enableFirebaseLogging: isDevelopment,
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  logLevel: isDevelopment ? "debug" : "error",
}

class DebugManager {
  private config: DebugConfig
  private performanceMarks: Map<string, number> = new Map()

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = {...defaultConfig, ...config}
  }

  // Console logging methods
  debug(message: string, ...args: any[]) {
    if (this.config.enableConsole && this.shouldLog("debug")) {
      console.log(`🐛 [DEBUG] ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]) {
    if (this.config.enableConsole && this.shouldLog("info")) {
      console.info(`ℹ️ [INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.config.enableConsole && this.shouldLog("warn")) {
      console.warn(`⚠️ [WARN] ${message}`, ...args)
    }
  }

  error(message: string, error?: any, ...args: any[]) {
    if (this.config.enableConsole && this.shouldLog("error")) {
      console.error(`❌ [ERROR] ${message}`, error, ...args)
    }

    // Always track errors in production for monitoring
    if (this.config.enableErrorTracking && isProduction) {
      this.trackError(message, error, ...args)
    }
  }

  // Firebase-specific logging
  firebaseLog(operation: string, data?: any) {
    if (this.config.enableFirebaseLogging) {
      console.log(`🔥 [FIREBASE] ${operation}`, data)
    }
  }

  // Performance tracking
  startPerformanceTimer(label: string) {
    if (this.config.enablePerformanceTracking) {
      this.performanceMarks.set(label, performance.now())
      if (isDevelopment) {
        console.time(`⏱️ [PERF] ${label}`)
      }
    }
  }

  endPerformanceTimer(label: string) {
    if (this.config.enablePerformanceTracking) {
      const startTime = this.performanceMarks.get(label)
      if (startTime) {
        const duration = performance.now() - startTime
        this.performanceMarks.delete(label)

        if (isDevelopment) {
          console.timeEnd(`⏱️ [PERF] ${label}`)
          console.log(`⏱️ [PERF] ${label} took ${duration.toFixed(2)}ms`)
        }

        // Track slow operations
        if (duration > 1000) {
          this.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
        }
      }
    }
  }

  // Group logging for related operations
  group(label: string, collapsed = false) {
    if (this.config.enableConsole && isDevelopment) {
      if (collapsed) {
        console.groupCollapsed(`📁 [GROUP] ${label}`)
      } else {
        console.group(`📁 [GROUP] ${label}`)
      }
    }
  }

  groupEnd() {
    if (this.config.enableConsole && isDevelopment) {
      console.groupEnd()
    }
  }

  // Table logging for structured data
  table(data: any, label?: string) {
    if (this.config.enableConsole && isDevelopment) {
      if (label) {
        console.log(`📊 [TABLE] ${label}`)
      }
      console.table(data)
    }
  }

  // Conditional logging
  assert(condition: boolean, message: string, ...args: any[]) {
    if (this.config.enableConsole) {
      console.assert(condition, `❌ [ASSERT] ${message}`, ...args)
    }
  }

  // Configuration methods
  updateConfig(newConfig: Partial<DebugConfig>) {
    this.config = {...this.config, ...newConfig}
  }

  getConfig(): DebugConfig {
    return {...this.config}
  }

  // Private helper methods
  private shouldLog(level: DebugConfig["logLevel"]): boolean {
    const levels: Record<DebugConfig["logLevel"], number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }

    return levels[level] >= levels[this.config.logLevel]
  }

  private trackError(message: string, error?: any, ...args: any[]) {
    // In a real application, you would send this to an error tracking service
    // like Sentry, LogRocket, or similar

    const errorData = {
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData: args,
    }

    // Example: Send to error tracking service
    // errorTrackingService.captureException(errorData);

    // For now, just store in localStorage for debugging
    if (isDevelopment) {
      const errors = JSON.parse(localStorage.getItem("debug_errors") || "[]")
      errors.push(errorData)
      localStorage.setItem("debug_errors", JSON.stringify(errors.slice(-50))) // Keep last 50 errors
    }
  }
}

// Export singleton instance
export const debugManager = new DebugManager()

// Convenience exports with proper binding
export const debug = (...args: Parameters<typeof debugManager.debug>) => debugManager.debug(...args)
export const info = (...args: Parameters<typeof debugManager.info>) => debugManager.info(...args)
export const warn = (...args: Parameters<typeof debugManager.warn>) => debugManager.warn(...args)
export const error = (...args: Parameters<typeof debugManager.error>) => debugManager.error(...args)
export const firebaseLog = (...args: Parameters<typeof debugManager.firebaseLog>) =>
  debugManager.firebaseLog(...args)
export const startPerformanceTimer = (
  ...args: Parameters<typeof debugManager.startPerformanceTimer>
) => debugManager.startPerformanceTimer(...args)
export const endPerformanceTimer = (...args: Parameters<typeof debugManager.endPerformanceTimer>) =>
  debugManager.endPerformanceTimer(...args)
export const group = (...args: Parameters<typeof debugManager.group>) => debugManager.group(...args)
export const groupEnd = (...args: Parameters<typeof debugManager.groupEnd>) =>
  debugManager.groupEnd(...args)
export const table = (...args: Parameters<typeof debugManager.table>) => debugManager.table(...args)
export const assert = (...args: Parameters<typeof debugManager.assert>) =>
  debugManager.assert(...args)

// Performance decorator for methods
export function withPerformanceTracking(label: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      debugManager.startPerformanceTimer(`${target.constructor.name}.${propertyName}(${label})`)

      try {
        const result = await method.apply(this, args)
        debugManager.endPerformanceTimer(`${target.constructor.name}.${propertyName}(${label})`)
        return result
      } catch (error) {
        debugManager.endPerformanceTimer(`${target.constructor.name}.${propertyName}(${label})`)
        debugManager.error(`Error in ${target.constructor.name}.${propertyName}`, error)
        throw error
      }
    }
  }
}

// Environment information
export const debugInfo = {
  isDevelopment,
  isProduction,
  debugMode,
  version: import.meta.env.VITE_APP_VERSION || "unknown",
  buildTime: import.meta.env.VITE_BUILD_TIME || "unknown",
}

// Global debug utilities (only in development)
if (isDevelopment) {
  ;(window as any).__DEBUG__ = {
    debugManager,
    debugInfo,
    getErrors: () => JSON.parse(localStorage.getItem("debug_errors") || "[]"),
    clearErrors: () => localStorage.removeItem("debug_errors"),
    config: debugManager.getConfig(),
  }
}
