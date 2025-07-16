import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';

/**
 * Función para obtener los documentos de asistencia para una fecha específica
 *
 * @param date - Fecha en formato 'yyyy-MM-dd'
 * @returns Promise que resuelve a un array de documentos de asistencia
 */
export async function fetchAttendanceByDateFirebase(date: string): Promise<any[]> {
  try {
    // Consultar los documentos de asistencia que coincidan con la fecha específica
    const querySnapshot = await getDocs(
      query(collection(db, 'ASISTENCIAS'), where('fecha', '==', date)),
    );

    // Mapear los documentos al formato requerido
    const documents = querySnapshot.docs.map((doc) => {
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
          observations: data.data?.observations || '',
        },
      };
    });

    return documents;
  } catch (error) {
    console.error('Error al obtener asistencia por fecha:', error);
    throw error;
  }
}
