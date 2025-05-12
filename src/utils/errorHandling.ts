/**
 * Utilidades para manejo de errores en la aplicación
 */

/**
 * Función para manejar errores de carga de módulos
 * @param error - El error capturado
 * @param router - Instancia del router para redireccionar si es necesario
 * @returns true si se manejó el error, false si no
 */
export const handleModuleLoadingError = (error: any, router: any): boolean => {
  // Detectar errores de carga de módulos (JS inválido, HTML en lugar de JS, etc.)
  if (error instanceof SyntaxError || 
      (error.message && (
        error.message.includes('Unexpected token') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('dynamically imported module')
      ))) {
    console.error('Error de carga de módulo detectado:', error);
    
    // Intentar obtener la ruta actual
    try {
      const currentPath = router.currentRoute.value?.fullPath || window.location.pathname;
      
      // Si es una ruta de clases, intentar redirigir a la vista de maestros
      if (currentPath.includes('/classes/')) {
        const classId = currentPath.split('/').pop();
        if (classId) {
          console.log('Redirigiendo a vista alternativa para clase:', classId);
          router.push({
            name: 'TeacherClassDetail',
            params: { id: classId }
          }).catch(() => {
            // Si falla, ir al dashboard
            router.push('/dashboard');
          });
          return true;
        }
      }
      
      // Si llegamos aquí, el manejo específico falló, redirigir al dashboard
      router.push('/dashboard');
      return true;
      
    } catch (redirectError) {
      console.error('Error al redirigir:', redirectError);
      // Último recurso: recargar la página
      window.location.href = '/dashboard';
      return true;
    }
  }
  
  return false; // No se manejó el error
};

/**
 * Registra un error en la consola y opcionalmente en un servicio de monitoreo
 */
export const logError = (context: string, error: any, additionalInfo = {}): void => {
  console.error(`[${context}]`, error, additionalInfo);
  
  // Aquí se podría integrar con un servicio como Sentry, LogRocket, etc.
};
