// src/composables/useAdminErrorHandling.ts
import { ref } from 'vue';
import { useErrorHandler } from '../utils/errorHandler';
import { debug } from '../utils/debug';

export interface AdminError {
  id: string
  type: 'critical' | 'warning' | 'info'
  message: string
  details?: any
  timestamp: Date
  resolved: boolean
}

export function useAdminErrorHandling() {
  const { handleError, executeWithErrorHandling } = useErrorHandler();
  const createError = (code: string, message: string, details?: any) => ({ code, message, details });
  const errors = ref<AdminError[]>([]);
  const isLoading = ref(false);

  /**
   * Maneja errores específicos de vistas de admin
   */
  const handleAdminError = (
    error: any,
    context: string,
    type: AdminError['type'] = 'critical',
  ): AdminError => {
    const adminError: AdminError = {
      id: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message: error.message || 'Error desconocido',
      details: {
        context,
        originalError: error,
        stack: error.stack,
      },
      timestamp: new Date(),
      resolved: false,
    };

    errors.value.push(adminError);

    // Log the error using our debug utility
    debug.error(`Admin Error [${context}]`, {
      error: adminError,
      originalError: error,
    });

    // Use the global error handler for consistent error processing
    handleError(error, context);

    return adminError;
  };

  /**
   * Resuelve un error marcándolo como resuelto
   */
  const resolveError = (errorId: string) => {
    const error = errors.value.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      debug.info(`Admin Error resolved: ${errorId}`);
    }
  };

  /**
   * Limpia errores resueltos
   */
  const clearResolvedErrors = () => {
    const initialCount = errors.value.length;
    errors.value = errors.value.filter((e) => !e.resolved);
    const clearedCount = initialCount - errors.value.length;

    if (clearedCount > 0) {
      debug.info(`Cleared ${clearedCount} resolved admin errors`);
    }
  };

  /**
   * Ejecuta una operación async de forma segura
   */
  const safeAsyncOperation = async <T>(
    operation: () => Promise<T>,
    context: string,
    defaultValue?: T,
  ): Promise<T | undefined> => {
    isLoading.value = true;

    try {
      const result = await operation();
      debug.info(`Admin operation completed: ${context}`);
      return result;
    } catch (error) {
      handleAdminError(error, context);
      return defaultValue;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Valida datos antes de operaciones CRUD
   */
  const validateData = (data: any, requiredFields: string[], context: string): boolean => {
    const missingFields = requiredFields.filter((field) => {
      const value = data?.[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      const error = createError(
        'VALIDATION_ERROR',
        `Campos requeridos faltantes: ${missingFields.join(', ')}`,
        { missingFields, data, context },
      );
      handleAdminError(error, context, 'warning');
      return false;
    }

    return true;
  };

  /**
   * Obtiene errores no resueltos por tipo
   */
  const getErrorsByType = (type: AdminError['type']) => {
    return errors.value.filter((e) => e.type === type && !e.resolved);
  };

  /**
   * Obtiene errores críticos no resueltos
   */
  const getCriticalErrors = () => getErrorsByType('critical');

  /**
   * Verifica si hay errores críticos
   */
  const hasCriticalErrors = () => getCriticalErrors().length > 0;

  /**
   * Obtiene el conteo de errores por tipo
   */
  const getErrorCounts = () => ({
    critical: getErrorsByType('critical').length,
    warning: getErrorsByType('warning').length,
    info: getErrorsByType('info').length,
    total: errors.value.filter((e) => !e.resolved).length,
  });

  return {
    // Estado
    errors,
    isLoading,

    // Métodos principales
    handleAdminError,
    resolveError,
    clearResolvedErrors,
    safeAsyncOperation,
    validateData,

    // Consultas
    getErrorsByType,
    getCriticalErrors,
    hasCriticalErrors,
    getErrorCounts,
  };
}
