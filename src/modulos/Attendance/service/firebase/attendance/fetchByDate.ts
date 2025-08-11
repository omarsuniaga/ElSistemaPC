import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../../firebase';

interface IAttendanceDocument {
  id: string;
  fecha: string;
  estudianteId: string;
  estado: 'presente' | 'ausente' | 'justificado' | 'tardanza';
  observaciones?: string;
  justificacion?: {
    motivo: string;
    fecha: string;
    adjunto?: string;
  };
  [key: string]: unknown;
}

/**
 * Obtiene los registros de asistencia para una fecha específica
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<IAttendanceDocument[]>} Promesa que resuelve con un array de documentos de asistencia
 * @throws {Error} Si ocurre un error al obtener los datos
 */
export const fetchAttendanceByDateFirebase = async (date: string): Promise<IAttendanceDocument[]> => {
  try {
    const q = query(
      collection(db, 'ASISTENCIAS'),
      where('fecha', '==', date),
    );
    
    const querySnapshot = await getDocs(q);
    const results: IAttendanceDocument[] = [];
    
    querySnapshot.forEach((doc) => {
      results.push({ 
        id: doc.id, 
        ...doc.data(), 
      });
    });
    
    return results;
  } catch (error) {
    const errorMessage = 'Error al obtener asistencias por fecha';
    console.error(`❌ [fetchByDate] ${errorMessage}:`, error);
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
  }
};
