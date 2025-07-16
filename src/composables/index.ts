/**
 * @fileoverview Barrel file para centralizar todas las utilidades de manejo de errores
 * Este archivo unifica todas las exportaciones relacionadas con error handling
 */

// Exportaciones del composable principal
export { useErrorHandling, useErrorHandler } from './useErrorHandling';

// Exportaciones del composable específico para admin
export { useAdminErrorHandling } from './useAdminErrorHandling';
export type { AdminError } from './useAdminErrorHandling';

// Exportaciones de las utilidades de error handler
export {
  ErrorHandler,
  Logger,
  Validator,
  useErrorHandler as useErrorHandlerUtil,
} from '../utils/errorHandler';
export type { AppError, ErrorState } from '../utils/errorHandler';

// Exportaciones de las utilidades de debug
export { debug, debugManager, debugInfo } from '../utils/debug';

// Exportaciones de utilidades generales de error handling
export { handleModuleLoadingError, logError } from '../utils/errorHandling';

// Exportaciones de composables de Firestore
export { useFirestore } from './useFirestore';
export type { FirestoreComposable } from './useFirestore';

// Alias para compatibilidad hacia atrás
export { useErrorHandling as useErrorHandlingComposable } from './useErrorHandling';
