/**
 * Error handling utilities for Admin module
 * Provides consistent error handling and logging
 */

export interface ErrorContext {
  component: string;
  method?: string;
  data?: any;
  userId?: string;
}

export interface FormattedError {
  message: string;
  type: 'validation' | 'network' | 'auth' | 'permission' | 'data' | 'unknown';
  code?: string;
  details?: any;
}

/**
 * Safely formats error messages for user display
 */
export const formatErrorMessage = (error: any, context?: ErrorContext): FormattedError => {
  let message = 'Ha ocurrido un error inesperado';
  let type: FormattedError['type'] = 'unknown';
  let code: string | undefined;

  try {
    // Handle Firebase errors
    if (error?.code) {
      code = error.code;
      switch (error.code) {
        case 'permission-denied':
          message = 'No tienes permisos para realizar esta acción';
          type = 'permission';
          break;
        case 'unauthenticated':
          message = 'Debes iniciar sesión para continuar';
          type = 'auth';
          break;
        case 'not-found':
          message = 'El recurso solicitado no fue encontrado';
          type = 'data';
          break;
        case 'already-exists':
          message = 'El recurso ya existe';
          type = 'validation';
          break;
        case 'failed-precondition':
          message = 'No se cumplen las condiciones necesarias';
          type = 'validation';
          break;
        case 'resource-exhausted':
          message = 'Se ha excedido el límite de recursos';
          type = 'network';
          break;
        case 'deadline-exceeded':
        case 'unavailable':
          message = 'El servicio no está disponible temporalmente';
          type = 'network';
          break;
        default:
          message = error.message || message;
      }
    }
    // Handle validation errors
    else if (error?.name === 'ValidationError' || error?.type === 'validation') {
      message = error.message || 'Los datos proporcionados no son válidos';
      type = 'validation';
    }
    // Handle network errors
    else if (error?.name === 'NetworkError' || error?.type === 'network') {
      message = 'Error de conexión. Verifica tu conexión a internet';
      type = 'network';
    }
    // Handle generic Error objects
    else if (error instanceof Error) {
      message = error.message;
      // Try to infer type from message content
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('unauthorized')) {
        type = 'permission';
      } else if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection')) {
        type = 'network';
      } else if (message.toLowerCase().includes('validation') || message.toLowerCase().includes('invalid')) {
        type = 'validation';
      }
    }
    // Handle string errors
    else if (typeof error === 'string') {
      message = error;
    }
    // Handle object errors with message property
    else if (error?.message) {
      message = error.message;
    }

  } catch (formatError) {
    console.error('Error formatting error message:', formatError);
    message = 'Error interno del sistema';
  }

  // Log error for debugging
  if (context) {
    console.error(`[${context.component}${context.method ? `::${context.method}` : ''}] Error:`, {
      originalError: error,
      formattedMessage: message,
      type,
      code,
      context: context.data,
      userId: context.userId
    });
  }

  return {
    message,
    type,
    code,
    details: error
  };
};

/**
 * Safe function executor with error handling
 */
export const safeExecute = async <T>(
  fn: () => Promise<T> | T,
  context: ErrorContext,
  fallback?: T
): Promise<{ success: boolean; data?: T; error?: FormattedError }> => {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error) {
    const formattedError = formatErrorMessage(error, context);
    return { success: false, error: formattedError, data: fallback };
  }
};

/**
 * Validates form data with custom validation rules
 */
export const validateFormData = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => string | null>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  Object.entries(rules).forEach(([field, validator]) => {
    try {
      const error = validator(data[field]);
      if (error) {
        errors[field] = error;
      }
    } catch (validationError) {
      console.error(`Validation error for field ${field}:`, validationError);
      errors[field] = 'Error de validación';
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Common validation rules
 */
export const validationRules = {
  required: (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'Este campo es requerido';
    }
    return null;
  },
  
  email: (value: string) => {
    if (!value) return null; // Allow empty if not required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Ingrese un correo electrónico válido';
  },
  
  phone: (value: string) => {
    if (!value) return null; // Allow empty if not required
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, '')) ? null : 'Ingrese un número de teléfono válido';
  },
  
  minLength: (min: number) => (value: string) => {
    if (!value) return null; // Allow empty if not required
    return value.length >= min ? null : `Debe tener al menos ${min} caracteres`;
  },
  
  maxLength: (max: number) => (value: string) => {
    if (!value) return null; // Allow empty if not required
    return value.length <= max ? null : `No debe exceder ${max} caracteres`;
  },
  
  numeric: (value: string) => {
    if (!value) return null; // Allow empty if not required
    return !isNaN(Number(value)) ? null : 'Debe ser un número válido';
  },
  
  positiveNumber: (value: string | number) => {
    if (!value) return null; // Allow empty if not required
    const num = typeof value === 'string' ? Number(value) : value;
    return num > 0 ? null : 'Debe ser un número positivo';
  },
  
  date: (value: string) => {
    if (!value) return null; // Allow empty if not required
    const date = new Date(value);
    return !isNaN(date.getTime()) ? null : 'Ingrese una fecha válida';
  },
  
  futureDate: (value: string) => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    return date > now ? null : 'La fecha debe ser futura';
  },
  
  pastDate: (value: string) => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    return date < now ? null : 'La fecha debe ser pasada';
  }
};

/**
 * Handles async operations with loading states
 */
export const withLoading = async <T>(
  operation: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  context?: ErrorContext
): Promise<{ success: boolean; data?: T; error?: FormattedError }> => {
  setLoading(true);
  
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    const formattedError = formatErrorMessage(error, context);
    return { success: false, error: formattedError };
  } finally {
    setLoading(false);
  }
};

/**
 * Debounce function for search and input handlers
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Retry mechanism for failed operations
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: ErrorContext
): Promise<{ success: boolean; data?: T; error?: FormattedError }> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  const formattedError = formatErrorMessage(lastError, context);
  return { success: false, error: formattedError };
};

export default {
  formatErrorMessage,
  safeExecute,
  validateFormData,
  validationRules,
  withLoading,
  debounce,
  retryOperation
};