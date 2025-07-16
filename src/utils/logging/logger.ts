// src/utils/logging/logger.ts
/**
 * Sistema de logging avanzado para Music Academy Manager
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: Date
  level: LogLevel
  module: string
  message: string
  data?: any
  userId?: string
  sessionId?: string
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDev = import.meta.env.DEV;
  private isProd = import.meta.env.PROD;

  private constructor() {
    // Limpiar logs antiguos periódicamente
    if (this.isProd) {
      setInterval(() => this.cleanOldLogs(), 300000); // 5 minutos
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private cleanOldLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private createLogEntry(level: LogLevel, module: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date(),
      level,
      module,
      message,
      data,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Obtener usuario actual del store de auth
      const authStore = JSON.parse(localStorage.getItem('auth') || '{}');
      return authStore.user?.uid;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('music-academy-session');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('music-academy-session', sessionId);
    }
    return sessionId;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDev) return true;

    // En producción, solo logs importantes
    return ['warn', 'error'].includes(level);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    return `[${timestamp}] [${level}] [${entry.module}] ${entry.message}`;
  }

  debug(module: string, message: string, data?: any) {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', module, message, data);
    this.logs.push(entry);

    if (this.isDev) {
      // console.log(`🔍 ${this.formatMessage(entry)}`, data || "")
    }
  }

  info(module: string, message: string, data?: any) {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', module, message, data);
    this.logs.push(entry);

    if (this.isDev) {
      console.info(`ℹ️ ${this.formatMessage(entry)}`, data || '');
    }
  }

  warn(module: string, message: string, data?: any) {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', module, message, data);
    this.logs.push(entry);

    // console.warn(`⚠️ ${this.formatMessage(entry)}`, data || "")
  }

  error(module: string, message: string, error?: any) {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', module, message, error);
    this.logs.push(entry);

    console.error(`❌ ${this.formatMessage(entry)}`, error || '');

    // En producción, enviar a servicio de monitoreo
    if (this.isProd) {
      this.reportToMonitoring(entry);
    }
  }

  private async reportToMonitoring(entry: LogEntry) {
    try {
      // Aquí podrías integrar con servicios como Sentry, LogRocket, etc.
      // Por ahora, simplemente guardamos en localStorage para análisis
      const errorReports = JSON.parse(localStorage.getItem('error-reports') || '[]');
      errorReports.push(entry);

      // Mantener solo los últimos 50 errores
      if (errorReports.length > 50) {
        errorReports.splice(0, errorReports.length - 50);
      }

      localStorage.setItem('error-reports', JSON.stringify(errorReports));
    } catch (monitoringError) {
      console.error('Error al reportar a monitoreo:', monitoringError);
    }
  }

  // Métodos de utilidad
  getLogs(level?: LogLevel, module?: string): LogEntry[] {
    return this.logs.filter((log) => {
      if (level && log.level !== level) return false;
      if (module && log.module !== module) return false;
      return true;
    });
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('error-reports');
  }

  // Métodos específicos para módulos
  firebase(message: string, data?: any) {
    this.debug('FIREBASE', message, data);
  }

  auth(message: string, data?: any) {
    this.info('AUTH', message, data);
  }

  api(message: string, data?: any) {
    this.debug('API', message, data);
  }

  performance(message: string, data?: any) {
    this.info('PERFORMANCE', message, data);
  }
}

// Exportar instancia singleton
export const logger = Logger.getInstance();

// Función helper para logging rápido
export function log(level: LogLevel, module: string, message: string, data?: any) {
  logger[level](module, message, data);
}

// Decorador para logging automático de funciones
export function loggedFunction(module: string, functionName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = functionName || propertyKey;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();

      logger.debug(module, `Iniciando ${name}`, { args });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;

        logger.debug(module, `${name} completado en ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error(module, `Error en ${name} después de ${duration.toFixed(2)}ms`, error);
        throw error;
      }
    };

    return descriptor;
  };
}
