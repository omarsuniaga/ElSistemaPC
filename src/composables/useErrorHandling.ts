/**
 * Composable para manejo de errores unificado
 * @fileoverview Proporciona funcionalidades de manejo de errores de forma consistente
 */

import { ref } from 'vue';

export interface ErrorState {
  message: string | null
  type?: 'error' | 'warning' | 'info'
  details?: any
}

export function useErrorHandling() {
  const error = ref<ErrorState | null>(null);
  const isLoading = ref(false);

  /**
   * Maneja un error de forma segura
   * @param err - El error capturado
   * @param context - Contexto adicional del error
   * @returns El mensaje de error formateado
   */
  const handleError = (err: any, context?: string): string => {
    console.error(context ? `[${context}]` : '[Error]', err);

    let message = 'Ha ocurrido un error inesperado';

    if (typeof err === 'string') {
      message = err;
    } else if (err?.message) {
      message = err.message;
    } else if (err?.code) {
      // Firebase errors
      switch (err.code) {
      case 'permission-denied':
        message = 'No tienes permisos para realizar esta acción';
        break;
      case 'not-found':
        message = 'El recurso solicitado no fue encontrado';
        break;
      case 'network-request-failed':
        message = 'Error de conexión. Verifica tu internet';
        break;
      default:
        message = err.message || 'Error desconocido';
      }
    }

    error.value = {
      message,
      type: 'error',
      details: err,
    };

    return message;
  };

  /**
   * Limpia el estado de error
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * Establece el estado de carga
   * @param loading - Estado de carga
   */
  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  /**
   * Ejecuta una operación asíncrona con manejo de errores
   * @param operation - Función asíncrona a ejecutar
   * @param context - Contexto del error
   * @returns El resultado de la operación o null si falla
   */
  const executeWithErrorHandling = async <T>(
    operation: () => Promise<T>,
    context?: string,
  ): Promise<T | null> => {
    try {
      setLoading(true);
      clearError();
      const result = await operation();
      return result;
    } catch (err) {
      handleError(err, context);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Muestra una advertencia
   * @param message - Mensaje de advertencia
   */
  const showWarning = (message: string) => {
    error.value = {
      message,
      type: 'warning',
    };
  };

  /**
   * Muestra información
   * @param message - Mensaje informativo
   */
  const showInfo = (message: string) => {
    error.value = {
      message,
      type: 'info',
    };
  };

  return {
    // Estado
    error,
    isLoading,

    // Métodos
    handleError,
    clearError,
    setLoading,
    executeWithErrorHandling,
    showWarning,
    showInfo,
  };
}

// Re-exportar para compatibilidad
export { useErrorHandling as useErrorHandler };
