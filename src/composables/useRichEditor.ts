import {ref} from "vue"
import {useSmartDictionary} from "./useSmartDictionary"
import {useBulletList} from "./useBulletList"
import {useStudentTags} from "./useStudentTags"
import {useEditorHelp} from "./useEditorHelp"
import {useImageHandler} from "./useImageHandler"

/**
 * Composable principal que integra todas las funcionalidades del editor
 */
export function useRichEditor() {
  const smartDictionary = useSmartDictionary()
  const bulletList = useBulletList()
  const studentTags = useStudentTags()
  const editorHelp = useEditorHelp()
  const imageHandler = useImageHandler()
  const observationTextarea = ref<HTMLTextAreaElement | null>(null)
  const newObservation = ref<string>("") // Explicitly type as string

  /**
   * Manejador principal para eventos de teclado en el textarea
   * @param event - Evento del teclado
   */ const handleTextareaKeydown = (event: KeyboardEvent) => {
    if (!observationTextarea.value) return

    const textarea = event.target as HTMLTextAreaElement
    const cursorPos = textarea.selectionStart || 0
    const text = String(newObservation.value || "")
    const textBeforeCursor = text.substring(0, cursorPos)
    const textAfterCursor = text.substring(cursorPos)

    // Prevenir comportamiento predeterminado para Tab
    if (event.key === "Tab") {
      event.preventDefault()
    }

    // Autocompletado con Tab cuando hay una sugerencia activa
    if (event.key === "Tab" && smartDictionary.suggestionActive.value) {
      event.preventDefault()

      // Aplicar sugerencia
      const result = smartDictionary.applySuggestion(textBeforeCursor, textAfterCursor)
      if (result) {
        // Actualizar el modelo
        newObservation.value = result.text

        // Colocar cursor al final de la sugerencia
        setTimeout(() => {
          if (textarea) {
            textarea.focus()
            textarea.setSelectionRange(result.cursorPos, result.cursorPos)
          }
        }, 50)
      }
      return
    }

    // Rechazar sugerencia con Escape
    if (event.key === "Escape" && smartDictionary.suggestionActive.value) {
      event.preventDefault()
      smartDictionary.rejectSuggestion()
      return
    }

    // Detectar entrada de # para etiquetado de estudiantes
    if (studentTags.handleTagTrigger(event, cursorPos)) {
      return
    }
    // Manejar inserción de viñetas
    if (event.key === "Enter") {
      const result = bulletList.handleBulletInsertion(event, text, cursorPos)
      if (result.shouldInsert) {
        event.preventDefault()

        // Insertar viñeta (asegurarse de que text no sea undefined)
        newObservation.value = result.text || text

        // Posicionar el cursor después de la viñeta
        setTimeout(() => {
          if (textarea && typeof result.newCursorPos === "number") {
            textarea.focus()
            textarea.setSelectionRange(result.newCursorPos, result.newCursorPos)
          }
        }, 50)

        // Desactivar cualquier sugerencia activa
        smartDictionary.rejectSuggestion()
      }
    } else {
      // Para cualquier otra tecla, buscar sugerencias después de un tiempo
      smartDictionary.setTypingTimeout(textBeforeCursor)
    }
  }
  /**
   * Insertar una etiqueta de estudiante seleccionada
   */
  const insertStudentTag = (student: any) => {
    if (!observationTextarea.value) return

    const result = studentTags.insertStudentTag(
      student,
      String(newObservation.value || ""),
      observationTextarea.value
    )

    if (result && result.text) {
      newObservation.value = result.text

      // Si es una inserción nueva (no una edición), posicionar el cursor
      if (!result.isEdit && result.cursorPos !== undefined) {
        setTimeout(() => {
          if (observationTextarea.value && typeof result.cursorPos === "number") {
            observationTextarea.value.focus()
            observationTextarea.value.setSelectionRange(result.cursorPos, result.cursorPos)
          }
        }, 50)
      }

      // Actualizar etiquetas encontradas
      studentTags.findTaggedStudents(String(newObservation.value || ""))
    }
  }
  // Observar cambios en el texto para detectar etiquetas
  const watchObservationText = () => {
    if (newObservation.value !== undefined && newObservation.value !== null) {
      studentTags.findTaggedStudents(String(newObservation.value))
    }
  }

  /**
   * Inicializar componentes al montar
   */
  const initializeEditor = async () => {
    // Cargar el diccionario de frases guardado
    smartDictionary.loadSavedDictionary()

    // Comprobar si se debe mostrar la ayuda en la primera visita
    await editorHelp.checkFirstVisitHelp()

    // Detectar etiquetas existentes
    watchObservationText()
  }
  /**
   * Guardar la observación con análisis de texto y referencias a imágenes
   */
  const prepareObservationForSave = () => {
    const observationText = String(newObservation.value || "")

    // Analizar el texto para el diccionario inteligente
    smartDictionary.analyzeText(observationText)

    // Preparar observación con referencias a imágenes
    return imageHandler.prepareObservationWithImages(observationText)
  }
  return {
    // Estado general
    observationTextarea,
    newObservation,

    // Smart Dictionary
    suggestionActive: smartDictionary.suggestionActive,
    currentSuggestion: smartDictionary.currentSuggestion,

    // Student Tags
    showTagModal: studentTags.showTagModal,
    taggedStudents: studentTags.taggedStudents,
    editStudentTag: studentTags.editStudentTag,
    closeTagModal: studentTags.closeTagModal,

    // Bullets
    // (No explicit bullet state needed to expose)

    // Help
    showHelp: editorHelp.showHelp,
    openHelp: editorHelp.openHelp,
    closeHelp: editorHelp.closeHelp,

    // Images
    showImageUpload: imageHandler.showImageUpload,
    imageUrls: imageHandler.imageUrls,
    isUploadingImage: imageHandler.isUploadingImage,
    uploadProgress: imageHandler.uploadProgress,
    showImageGallery: imageHandler.showImageGallery,
    selectedImageIndex: imageHandler.selectedImageIndex,
    openImageUpload: imageHandler.openImageUpload,
    closeImageUpload: imageHandler.closeImageUpload,
    handleImageUploadSuccess: imageHandler.handleImageUploadSuccess,
    handleImageUploadError: imageHandler.handleImageUploadError,
    handleImageUploadProgress: imageHandler.handleImageUploadProgress,
    openImageGallery: imageHandler.openImageGallery,
    closeImageGallery: imageHandler.closeImageGallery,
    nextImage: imageHandler.nextImage,
    prevImage: imageHandler.prevImage,
    removeImage: imageHandler.removeImage,

    // Methods
    handleTextareaKeydown,
    insertStudentTag,
    watchObservationText,
    initializeEditor,
    prepareObservationForSave,
  }
}
