import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';

/**
 * Fetch attendance records for a specific date
 * 
 * @param date - Date in YYYY-MM-DD format
 * @returns Promise with array of attendance documents
 */
export async function fetchAttendanceByDateFirebase(date: string): Promise<any[]> {
  try {
    // Consulta los documentos de asistencia que coincidan con la fecha específica
    const querySnapshot = await getDocs(
      query(
        collection(db, 'ASISTENCIAS'),
        where('fecha', '==', date)
      )
    );

    // Mapea los documentos al formato requerido
    const documents = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        classId: data.classId,
        fecha: data.fecha,
        teacherId: data.teacherId,
        timestamp: data.timestamp,
        data: {
          presentes: data.data?.presentes || [],
          ausentes: data.data?.ausentes || [],
          tarde: data.data?.tarde || [],
          justificacion: data.data?.justificacion || [],
          observations: data.data?.observations || ''
        }
      };
    });

    return documents;
  } catch (error) {
    console.error('Error al obtener asistencia por fecha:', error);
    throw error;
  }
}
