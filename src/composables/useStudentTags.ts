import { ref, Ref, watch } from 'vue';

type Student = {
  id: string;
  nombre: string;
  apellido: string;
};

/**
 * Composable para manejar etiquetas de estudiantes en texto
 */
export function useStudentTags() {
  const showTagModal = ref(false);
  const cursorPosition = ref(0);
  const tagSearchText = ref('');
  const editingTagName = ref('');
  const taggedStudents = ref<string[]>([]);

  /**
   * Encuentra las etiquetas de estudiantes en el texto
   * @param text - Texto en el que buscar etiquetas
   */
  const findTaggedStudents = (text: string) => {
    const regex = /@([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)/g;
    const matches = [...text.matchAll(regex)];
    taggedStudents.value = matches.map(match => match[1]);
  };

  /**
   * Maneja la tecla # para mostrar el modal de etiquetas
   * @param event - Evento del teclado
   * @param cursorPos - Posición actual del cursor
   */
  const handleTagTrigger = (event: KeyboardEvent, cursorPos: number) => {
    if (event.key === '#') {
      // Guardar la posición actual del cursor
      cursorPosition.value = cursorPos + 1; // +1 para incluir el # que se va a escribir
      
      // Programar mostrar el modal después de que el # se haya escrito
      setTimeout(() => {
        showTagModal.value = true;
      }, 50);
      
      return true;
    }
    return false;
  };

  /**
   * Inicia la edición de una etiqueta existente
   * @param studentName - Nombre del estudiante a editar
   */
  const editStudentTag = (studentName: string) => {
    editingTagName.value = studentName;
    showTagModal.value = true;
  };

  /**
   * Inserta una etiqueta de estudiante en el texto
   * @param student - Datos del estudiante seleccionado
   * @param text - Texto actual
   * @param textarea - Elemento textarea para manipular el cursor
   */
  const insertStudentTag = (student: Student, text: string, textarea: HTMLTextAreaElement | null) => {
    const nombreCompleto = `${student.nombre} ${student.apellido}`;
    
    if (editingTagName.value) {
      // Editar una etiqueta existente
      const oldTag = `@${editingTagName.value}`;
      const newTag = `@${nombreCompleto}`;
      
      const updatedText = text.replace(oldTag, newTag);
      
      // Resetear el estado de edición
      editingTagName.value = '';
      
      // Cerrar el modal
      showTagModal.value = false;
      
      return {
        text: updatedText,
        isEdit: true
      };
    } else if (textarea) {
      // Insertar nueva etiqueta
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      
      // Eliminar el # que activó el modal
      const beforeCursor = text.substring(0, startPos - 1);
      const afterCursor = text.substring(endPos);
      
      // Insertar el nombre con formato @
      const updatedText = `${beforeCursor}@${nombreCompleto}${afterCursor}`;
      
      // Calcular la nueva posición del cursor
      const newCursorPos = beforeCursor.length + nombreCompleto.length + 1; // +1 por el @
      
      // Cerrar el modal
      showTagModal.value = false;
      
      return {
        text: updatedText,
        cursorPos: newCursorPos,
        isEdit: false
      };
    }
    
    // Si no hay textarea, solo cerramos el modal
    showTagModal.value = false;
    return { isEdit: false };
  };

  /**
   * Cierra el modal de etiquetas sin hacer cambios
   */
  const closeTagModal = () => {
    showTagModal.value = false;
    editingTagName.value = '';
  };

  return {
    showTagModal,
    cursorPosition,
    taggedStudents,
    editingTagName,
    findTaggedStudents,
    handleTagTrigger,
    editStudentTag,
    insertStudentTag,
    closeTagModal
  };
}
