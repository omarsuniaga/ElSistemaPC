import { ref, Ref } from 'vue';

/**
 * Composable para manejar un diccionario inteligente de sugerencias de texto
 * basado en patrones de texto previo
 */
export function useSmartDictionary() {
  const phraseDictionary = ref<{[key: string]: string[]}>({});
  const suggestionActive = ref(false);
  const currentSuggestion = ref('');
  const typingTimeout = ref<number | null>(null);

  /**
   * Analiza el texto para construir un diccionario de frases
   * @param text - Texto a analizar
   */
  const analyzeText = (text: string) => {
    const words = text.split(/\s+/);
    
    // Construir diccionario basado en secuencias de 3 palabras
    for (let i = 0; i < words.length - 3; i++) {
      const trigram = words.slice(i, i + 3).join(' ').toLowerCase();
      const nextWords = words.slice(i + 3).join(' ');
      
      if (trigram && nextWords) {
        if (!phraseDictionary.value[trigram]) {
          phraseDictionary.value[trigram] = [];
        }
        // Limitar la cantidad de sugerencias
        if (phraseDictionary.value[trigram].length < 5 && !phraseDictionary.value[trigram].includes(nextWords)) {
          phraseDictionary.value[trigram].push(nextWords);
        }
      }
    }
    
    // Guardar el diccionario en localStorage
    try {
      localStorage.setItem('observationsDictionary', JSON.stringify(phraseDictionary.value));
    } catch (e) {
      console.error('Error guardando diccionario en localStorage', e);
    }
  };

  /**
   * Carga el diccionario de frases guardado en localStorage
   */
  const loadSavedDictionary = () => {
    try {
      const saved = localStorage.getItem('observationsDictionary');
      if (saved) {
        phraseDictionary.value = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error cargando diccionario desde localStorage', e);
    }
  };

  /**
   * Busca una sugerencia basada en las últimas palabras escritas
   * @param text - Texto actual hasta el cursor
   */
  const findSuggestion = (text: string) => {
    // Obtener las últimas palabras hasta el cursor
    const words = text.trim().split(/\s+/);
    
    // Si tenemos al menos 3 palabras, buscar en el diccionario
    if (words.length >= 3) {
      const lastThreeWords = words.slice(-3).join(' ').toLowerCase();
      const suggestions = phraseDictionary.value[lastThreeWords];
      
      if (suggestions && suggestions.length > 0) {
        // Usar la primera sugerencia encontrada
        currentSuggestion.value = suggestions[0];
        suggestionActive.value = true;
        return;
      }
    }
    
    // Si no hay sugerencias, limpiar
    suggestionActive.value = false;
    currentSuggestion.value = '';
  };

  /**
   * Aplica la sugerencia actual al texto
   * @param textBeforeCursor - Texto antes del cursor
   * @param textAfterCursor - Texto después del cursor
   * @returns - Nuevo texto con la sugerencia aplicada
   */
  const applySuggestion = (textBeforeCursor: string, textAfterCursor: string) => {
    if (!suggestionActive.value || !currentSuggestion.value) {
      return null;
    }
    
    const words = textBeforeCursor.trim().split(/\s+/);
    const preserveText = words.slice(0, Math.max(0, words.length - 3)).join(' ');  
    const suggestion = words.slice(-3).join(' ') + ' ' + currentSuggestion.value;
    
    const newText = (preserveText ? preserveText + ' ' : '') + 
      suggestion + textAfterCursor;
    
    // Calcular la nueva posición del cursor
    const newCursorPos = (preserveText ? preserveText.length + 1 : 0) + suggestion.length;
    
    // Desactivar sugerencia
    suggestionActive.value = false;
    currentSuggestion.value = '';
    
    return {
      text: newText,
      cursorPos: newCursorPos
    };
  };

  /**
   * Rechaza la sugerencia actual
   */
  const rejectSuggestion = () => {
    suggestionActive.value = false;
    currentSuggestion.value = '';
  };

  /**
   * Configura un temporizador para buscar sugerencias después de escribir
   * @param text - El texto actual
   * @param delay - Retraso en ms antes de buscar sugerencias
   */
  const setTypingTimeout = (text: string, delay = 500) => {
    if (typingTimeout.value) {
      window.clearTimeout(typingTimeout.value);
    }
    
    typingTimeout.value = window.setTimeout(() => {
      findSuggestion(text);
    }, delay);
  };

  return {
    suggestionActive,
    currentSuggestion,
    analyzeText,
    loadSavedDictionary,
    findSuggestion,
    applySuggestion,
    rejectSuggestion,
    setTypingTimeout
  };
}
