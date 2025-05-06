import { ref, Ref } from 'vue';

/**
 * Composable para manejar la ayuda/documentación del editor
 */
export function useEditorHelp() {
  const showHelp = ref(false);

  /**
   * Muestra el diálogo de ayuda
   */
  const openHelp = () => {
    showHelp.value = true;
  };

  /**
   * Cierra el diálogo de ayuda
   */
  const closeHelp = () => {
    showHelp.value = false;
  };

  /**
   * Verifica si se debe mostrar la ayuda automáticamente (primera visita)
   * @returns Promise que resuelve si se mostró la ayuda o no
   */
  const checkFirstVisitHelp = (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const hasSeenHelp = localStorage.getItem('observationsHelp');
        if (!hasSeenHelp) {
          // Esperamos un momento para que primero se cargue el componente
          setTimeout(() => {
            showHelp.value = true;
            // Guardar que el usuario ha visto la ayuda
            localStorage.setItem('observationsHelp', 'true');
            resolve(true);
          }, 500);
        } else {
          resolve(false);
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
        resolve(false);
      }
    });
  };

  return {
    showHelp,
    openHelp,
    closeHelp,
    checkFirstVisitHelp
  };
}
