/**
 * Common error handling utilities
 * Provides standardized error handling across the application
 */

import { ref } from 'vue';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ErrorState {
  error: AppError | null;
  loading: boolean;
}

/**
 * Creates a reactive error state object
 */
export function createErrorState(): ErrorState {
  return {
    error: null,
    loading: false
  };
}

/**
 * Firebase error code mappings to user-friendly messages
 */
const errorMessages: Record<string, string> = {
  // Authentication errors
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/email-already-in-use': 'El correo electrónico ya está en uso',
  'auth/weak-password': 'La contraseña es muy débil',
  'auth/invalid-email': 'Correo electrónico inválido',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  
  // Firestore errors
  'firestore/permission-denied': 'No tienes permisos para esta operación',
  'firestore/not-found': 'Documento no encontrado',
  'firestore/already-exists': 'El documento ya existe',
  'firestore/aborted': 'Operación cancelada',
  'firestore/deadline-exceeded': 'Tiempo de espera agotado',
  
  // Network errors
  'network/offline': 'Sin conexión a internet',
  'network/timeout': 'Tiempo de espera agotado',
  
  // Validation errors
  'validation/required-field': 'Este campo es requerido',
  'validation/invalid-format': 'Formato inválido',
  'validation/date-range': 'Rango de fechas inválido',
  
  // Default error
  'unknown': 'Ha ocurrido un error inesperado'
};

/**
 * Handles errors consistently across the application
 */
export class ErrorHandler {
  static handleError(error: any, context?: string): AppError {
    console.error(`[ErrorHandler] ${context || 'Unknown context'}:`, error);
    
    let code = 'unknown';
    let message = errorMessages.unknown;
    
    // Firebase errors
    if (error?.code) {
      code = error.code;
      message = errorMessages[code] || error.message || message;
    }
    // Network errors
    else if (error?.name === 'NetworkError' || !navigator.onLine) {
      code = 'network/offline';
      message = errorMessages[code];
    }
    // Custom app errors
    else if (error?.message) {
      message = error.message;
    }
    
    return {
      code,
      message,
      details: error,
      timestamp: new Date()
    };
  }
  
  /**
   * Wraps async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<{ data: T | null; error: AppError | null }> {
    try {
      const data = await operation();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error, context) };
    }
  }
  
  /**
   * Creates a composable error handler for Vue components
   */
  static useErrorHandler() {
    const errorState = ref<ErrorState>({
      error: null,
      loading: false
    });
    
    const clearError = () => {
      errorState.value.error = null;
    };
    
    const setLoading = (loading: boolean) => {
      errorState.value.loading = loading;
    };
    
    const handleError = (error: any, context?: string) => {
      errorState.value.error = ErrorHandler.handleError(error, context);
      errorState.value.loading = false;
    };
    
    const executeWithErrorHandling = async <T>(
      operation: () => Promise<T>,
      context?: string
    ): Promise<T | null> => {
      try {
        errorState.value.loading = true;
        errorState.value.error = null;
        
        const result = await operation();
        errorState.value.loading = false;
        return result;
      } catch (error) {
        handleError(error, context);
        return null;
      }
    };
    
    return {
      errorState,
      clearError,
      setLoading,
      handleError,
      executeWithErrorHandling
    };  }
}

/**
 * Composable export for compatibility
 */
export const useErrorHandler = ErrorHandler.useErrorHandler;

/**
 * Logging utility with environment-aware output
 */
export class Logger {
  private static isDev = import.meta.env.DEV;
  private static isProduction = import.meta.env.PROD;
  
  static debug(message: string, ...args: any[]) {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
  
  static info(message: string, ...args: any[]) {
    if (this.isDev) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
  
  static warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${message}`, ...args);
  }
  
  static error(message: string, error?: any, ...args: any[]) {
    console.error(`[ERROR] ${message}`, error, ...args);
    
    // In production, you might want to send errors to a logging service
    if (this.isProduction) {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { message, ...args });
    }
  }
}

/**
 * Validation utilities
 */
export class Validator {
  static isRequired(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }
  
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static isDateRange(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }
  
  static validateRequired(fields: Record<string, any>): AppError[] {
    const errors: AppError[] = [];
    
    for (const [fieldName, value] of Object.entries(fields)) {
      if (!this.isRequired(value)) {
        errors.push({
          code: 'validation/required-field',
          message: `${fieldName} es requerido`,
          timestamp: new Date()
        });
      }
    }
    
    return errors;
  }
}
