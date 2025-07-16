import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  deleteQualificationFromFirebase,
  addQualificationToFirebase,
  updateQualificationInFirebase,
  fetchQualificationsByClass,
} from '../../../services/firestore/qualification';
import type {
  QualificationCard,
  QualificationIndicator,
  QualificationData,
} from '../../../types/qualification';

export const useQualificationStore = defineStore('qualification', () => {
  // Estado: variables reactivas para almacenar las calificaciones, estado de carga, errores y la clase seleccionada
  const qualifications = ref<QualificationCard[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const selectedClassId = ref<string>('');

  // Getters: funciones computadas para filtrar o buscar calificaciones según criterios
  const getQualificationsByClass = computed(() => {
    return (classId: string) => {
      // Devuelve las calificaciones filtradas por el ID de la clase
      return qualifications.value.filter((q: QualificationCard) => q.classId === classId);
    };
  });

  const getQualificationById = computed(() => {
    return (id: string) => {
      // Devuelve una calificación según su ID o null si no se encuentra
      return (
        qualifications.value.find((q: QualificationCard) => q.id === id) ||
        (null as QualificationCard | null)
      );
    };
  });

  /**
   * Función helper para formatear una calificación, asegurando que tenga todos los campos requeridos.
   * Esto ayuda a evitar datos incompletos y facilita el mapeo tanto al obtener como al guardar.
   *
   * @param q - Objeto de calificación a formatear.
   * @returns Una calificación formateada de tipo QualificationCard.
   */
  function formatQualification(q: any): QualificationCard {
    return {
      id: q.id || '',
      classId: q.classId || '',
      contentTitle: q.contentTitle || '',
      contentSubtitle: q.contentSubtitle || '',
      date: q.date || new Date().toISOString(),
      group: q.group || [],
      indicators: q.indicators || [],
      locked: q.locked ?? false,
      hideProgress: q.hideProgress ?? false,
      comments: q.comments ?? '',
    };
  }

  /**
   * Función helper que centraliza el manejo de errores y el estado de carga.
   * Ejecuta una acción asíncrona y captura errores de forma centralizada.
   *
   * @param action - Función asíncrona que representa la acción a ejecutar.
   * @param errorMessage - Mensaje de error personalizado en caso de fallo.
   * @returns El valor devuelto por la acción.
   */
  async function executeAction<T>(action: () => Promise<T>, errorMessage: string): Promise<T> {
    try {
      isLoading.value = true;
      error.value = null;
      return await action();
    } catch (err) {
      console.error(errorMessage, err);
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Acciones: funciones para interactuar con los datos de las calificaciones

  /**
   * Obtiene las calificaciones para un curso específico y actualiza el estado.
   * @param classId - El ID de la clase.
   * @returns Las calificaciones obtenidas.
   */
  async function fetchQualifications(classId: string) {
    selectedClassId.value = classId;
    return await executeAction(async () => {
      // Se utiliza la función importada para obtener las calificaciones desde Firebase
      const fetchedQualifications = await fetchQualificationsByClass(classId);
      // Se mapean las calificaciones usando la función helper para asegurar todos los campos
      qualifications.value = fetchedQualifications.map((q) => formatQualification(q));
      return qualifications.value;
    }, 'Error al obtener las calificaciones');
  }

  /**
   * Guarda una nueva calificación en Firebase y la agrega al estado local.
   * @param qualificationData - Los datos de la calificación a guardar.
   * @returns El ID generado para la calificación.
   */
  async function saveQualification(qualificationData: QualificationData) {
    // TODO: Agregar validaciones adicionales de los datos, si es necesario
    return await executeAction(async () => {
      // Guarda la calificación en Firebase y obtiene el ID generado
      const result = await addQualificationToFirebase(qualificationData);
      const id = typeof result === 'string' ? result : result.id;

      // Construye el objeto de calificación utilizando la función helper para aplicar valores por defecto
      const newQualification: QualificationCard = formatQualification({
        ...qualificationData,
        id,
        classId: qualificationData.classId || selectedClassId.value,
      });
      qualifications.value.push(newQualification);
      return id;
    }, 'Error al guardar la calificación');
  }

  /**
   * Actualiza una calificación existente y sincroniza los datos en el estado local.
   * Se asignan valores por defecto en caso de faltar alguna propiedad.
   *
   * @param id - El ID de la calificación a actualizar.
   * @param qualificationData - Los nuevos datos para la calificación.
   * @returns True si la actualización fue exitosa.
   */
  async function updateQualification(id: string, qualificationData: Partial<QualificationData>) {
    return await executeAction(async () => {
      // Prepara el objeto de actualización combinando los datos existentes y los nuevos valores
      const updateData: QualificationData = formatQualification({
        ...qualificationData,
        id,
        classId: qualificationData.classId || selectedClassId.value,
      });

      // Actualiza la calificación en Firebase
      await updateQualificationInFirebase(updateData);

      // Actualiza la calificación en el estado local
      const index: number = qualifications.value.findIndex((q: QualificationCard) => q.id === id);
      if (index !== -1) {
        qualifications.value[index] = {
          ...qualifications.value[index],
          ...updateData,
        };
      }
      return true;
    }, 'Error al actualizar la calificación');
  }

  /**
   * Elimina una calificación de Firebase y la remueve del estado local.
   * @param id - El ID de la calificación a eliminar.
   * @returns True si la eliminación fue exitosa.
   */
  async function deleteQualification(id: string) {
    return await executeAction(async () => {
      await deleteQualificationFromFirebase(id);
      // Remueve la calificación del estado local
      qualifications.value = qualifications.value.filter((q: QualificationCard) => q.id !== id);
      return true;
    }, 'Error al eliminar la calificación');
  }

  /**
   * Alterna el estado de bloqueo de una calificación.
   * @param id - El ID de la calificación.
   * @param locked - Nuevo estado de bloqueo (true o false).
   * @returns Resultado de la actualización.
   */
  async function toggleQualificationLock(id: string, locked: boolean) {
    return updateQualification(id, { locked });
  }

  /**
   * Alterna la visibilidad del progreso de una calificación.
   * @param id - El ID de la calificación.
   * @param hideProgress - Indica si se debe ocultar el progreso (true o false).
   * @returns Resultado de la actualización.
   */
  async function toggleProgressVisibility(id: string, hideProgress: boolean) {
    return updateQualification(id, { hideProgress });
  }

  /**
   * Actualiza los indicadores de una calificación.
   * @param id - El ID de la calificación.
   * @param indicators - Los nuevos indicadores.
   * @returns Resultado de la actualización.
   */
  async function updateQualificationIndicators(id: string, indicators: QualificationIndicator[]) {
    return updateQualification(id, { indicators });
  }

  /**
   * Actualiza los comentarios de una calificación.
   * @param id - El ID de la calificación.
   * @param comments - Los nuevos comentarios.
   * @returns Resultado de la actualización.
   */
  async function updateQualificationComments(id: string, comments: string) {
    return updateQualification(id, { comments });
  }

  /**
   * Reinicia el estado de las calificaciones y las variables de control.
   */
  function reset() {
    qualifications.value = [];
    isLoading.value = false;
    error.value = null;
    selectedClassId.value = '';
  }

  // Se retornan el estado, los getters y las acciones para ser utilizados en los componentes
  return {
    // Estado
    qualifications,
    isLoading,
    error,
    selectedClassId,

    // Getters
    getQualificationsByClass,
    getQualificationById,

    // Acciones
    fetchQualifications,
    saveQualification,
    updateQualification,
    deleteQualification,
    toggleQualificationLock,
    toggleProgressVisibility,
    updateQualificationIndicators,
    updateQualificationComments,
    reset,
  };
});
