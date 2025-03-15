import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase';

// Nombre de la colección para las observaciones
const COLLECTION_NAME = 'OBSERVACIONES';

/**
 * Obtiene las observaciones relacionadas con un registro de asistencia.
 * @param attendanceId ID del registro de asistencia.
 * @returns Lista de observaciones ordenadas por fecha (descendente).
 */
export const getObservations = async (attendanceId: string): Promise<any[]> => {
  try {
    // Intenta primero con la consulta ordenada
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('asistenciaId', '==', attendanceId),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (indexError: any) {
      // Si el error es por falta de índice, usar consulta alternativa sin ordenamiento
      if (indexError?.message?.includes('requires an index')) {
        console.warn('Se requiere un índice para esta consulta. Usando consulta alternativa sin ordenamiento.');
        console.warn('Cree el índice en: https://console.firebase.google.com/v1/r/project/orquestapuntacana/firestore/indexes');
        
        // Consulta alternativa sin ordenamiento
        const q = query(
          collection(db, COLLECTION_NAME),
          where('asistenciaId', '==', attendanceId)
        );
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenar manualmente los resultados
        return results.sort((a, b) => {
          const dateA = new Date(a.fecha).getTime();
          const dateB = new Date(b.fecha).getTime();
          return dateB - dateA; // Orden descendente
        });
      } else {
        // Si es otro tipo de error, relanzarlo
        throw indexError;
      }
    }
  } catch (error) {
    console.error('Error al obtener observaciones:', error);
    throw error;
  }
};

/**
 * Agrega una nueva observación.
 * @param observation Datos de la observación a agregar.
 * @returns La observación creada con su ID.
 */
export const addObservation = async (observation: any): Promise<any> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...observation,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...observation };
  } catch (error) {
    console.error('Error al agregar observación:', error);
    throw error;
  }
};

/**
 * Elimina una observación por su ID.
 * @param observationId ID de la observación a eliminar.
 */
export const deleteObservation = async (observationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, observationId));
  } catch (error) {
    console.error('Error al eliminar observación:', error);
    throw error;
  }
};