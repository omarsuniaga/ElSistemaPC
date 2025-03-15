import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../firebase';
import type { Student } from '../../types';

const COLLECTION_NAME = 'ALUMNOS';

/**
 * Obtiene todos los estudiantes de un grupo/clase específico.
 * @param className Nombre del grupo/clase.
 * @returns Lista de estudiantes en el grupo.
 */
export const getStudentsByClass = async (className: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('grupo', 'array-contains', className)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener estudiantes por clase:', error);
    throw error;
  }
};