// No imports needed

/**
 * Composable para manejar la creación automática de viñetas y listas
 */
export function useBulletList() {
  /**
   * Verifica si se debe insertar una viñeta basado en la entrada del usuario
   * @param event - Evento del teclado
   * @param text - Texto actual
   * @param cursorPos - Posición actual del cursor
   * @returns Objeto con información si se debe insertar una viñeta y el texto actualizado
   */ const handleBulletInsertion = (
    event: KeyboardEvent,
    text: string | unknown,
    cursorPos: number,
  ) => {
    // Solo procesamos si se presiona Enter
    if (event.key !== 'Enter') {
      return { shouldInsert: false };
    }

    // Asegurar que text sea una cadena
    const safeText = typeof text === 'string' ? text : '';
    const textBeforeCursor = safeText.substring(0, cursorPos);
    // Verificar si el último carácter antes del cursor es un punto o dos puntos
    if (textBeforeCursor.endsWith('.') || textBeforeCursor.endsWith(':')) {
      // Insertar una nueva línea con viñeta
      const bullet = '\n• ';
      const newText = safeText.substring(0, cursorPos) + bullet + safeText.substring(cursorPos);

      // Calcular la nueva posición del cursor después de la viñeta
      const newPos = cursorPos + bullet.length;

      return {
        shouldInsert: true,
        text: newText,
        newCursorPos: newPos,
      };
    }

    return { shouldInsert: false };
  };

  return {
    handleBulletInsertion,
  };
}
