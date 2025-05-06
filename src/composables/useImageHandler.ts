import { ref } from 'vue';

/**
 * Composable para manejar imágenes (carga, visualización, eliminación)
 */
export function useImageHandler() {
  const showImageUpload = ref(false);
  const imageUrls = ref<string[]>([]);
  const isUploadingImage = ref(false);
  const uploadProgress = ref(0);
  const showImageGallery = ref(false);
  const selectedImageIndex = ref(0);

  /**
   * Abre el modal de subida de imágenes
   */
  const openImageUpload = () => {
    showImageUpload.value = true;
  };

  /**
   * Cierra el modal de subida de imágenes
   */
  const closeImageUpload = () => {
    showImageUpload.value = false;
  };

  /**
   * Maneja el evento de éxito en la subida de imágenes
   * @param url - URL de la imagen subida
   */
  const handleImageUploadSuccess = (url: string) => {
    imageUrls.value.push(url);
    isUploadingImage.value = false;
    showImageUpload.value = false;
  };

  /**
   * Maneja el evento de error en la subida de imágenes
   * @param error - Mensaje de error
   */
  const handleImageUploadError = (error: string) => {
    console.error('Error al subir la imagen:', error);
    isUploadingImage.value = false;
  };

  /**
   * Actualiza el progreso de subida de la imagen
   * @param progress - Porcentaje de progreso (0-100)
   */
  const handleImageUploadProgress = (progress: number) => {
    uploadProgress.value = progress;
  };

  /**
   * Abre la galería de imágenes
   * @param index - Índice de la imagen a mostrar inicialmente
   */
  const openImageGallery = (index: number = 0) => {
    if (imageUrls.value.length > 0) {
      selectedImageIndex.value = index;
      showImageGallery.value = true;
    }
  };

  /**
   * Cierra la galería de imágenes
   */
  const closeImageGallery = () => {
    showImageGallery.value = false;
  };

  /**
   * Navega a la siguiente imagen en la galería
   */
  const nextImage = () => {
    selectedImageIndex.value = (selectedImageIndex.value + 1) % imageUrls.value.length;
  };

  /**
   * Navega a la imagen anterior en la galería
   */
  const prevImage = () => {
    selectedImageIndex.value = (selectedImageIndex.value - 1 + imageUrls.value.length) % imageUrls.value.length;
  };

  /**
   * Elimina una imagen de la galería
   * @param index - Índice de la imagen a eliminar
   */
  const removeImage = (index: number) => {
    imageUrls.value.splice(index, 1);
    if (imageUrls.value.length === 0) {
      showImageGallery.value = false;
    } else if (index <= selectedImageIndex.value) {
      selectedImageIndex.value = Math.max(0, Math.min(selectedImageIndex.value - 1, imageUrls.value.length - 1));
    }
  };
  /**
   * Preparar observación con referencias a imágenes para guardar
   * @param text - Texto original de la observación
   * @returns Objeto con el texto formateado y metadatos
   */
  const prepareObservationWithImages = (text: string) => {
    // Asegurar que text es un string
    const safeText = typeof text === 'string' ? text : '';
    let observationContent = safeText;
    
    // Si hay imágenes, añadir una sección al final del texto con las referencias
    if (imageUrls.value.length > 0) {
      observationContent += '\n\n--- Imágenes adjuntas ---\n';      imageUrls.value.forEach((_, index) => {
        observationContent += `[Imagen ${index + 1}]\n`;
      });
    }
    
    // Preparar datos completos de la observación
    return {
      text: safeText,
      formattedText: observationContent,
      images: imageUrls.value,
      timestamp: new Date()
    };
  };

  return {
    showImageUpload,
    imageUrls,
    isUploadingImage,
    uploadProgress,
    showImageGallery,
    selectedImageIndex,
    openImageUpload,
    closeImageUpload,
    handleImageUploadSuccess,
    handleImageUploadError,
    handleImageUploadProgress,
    openImageGallery,
    closeImageGallery,
    nextImage,
    prevImage,
    removeImage,
    prepareObservationWithImages
  };
}
