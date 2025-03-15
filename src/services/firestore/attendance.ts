import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../firebase';

// Nombre de la colección
const COLLECTION_NAME = 'ASISTENCIAS';

/**
 * Interfaz para documento de asistencia
 */
export interface AttendanceDocument {
  date: string;
  class_id: string;
  teacher_id: string;
  attendance: {
    student_id: string;
    status: string;
    timestamp: string;
  }[];
}

/**
 * Obtiene los datos de asistencia para una fecha específica.
 * @param date - Fecha de la asistencia.
 * @returns Un documento de asistencia o null si no se encuentra.
 */
export const getAttendanceByDate = async (date: string): Promise<AttendanceDocument | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, date);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as AttendanceDocument) : null;
  } catch (error) {
    console.error(`Error al obtener la asistencia para la fecha ${date}:`, error);
    throw error;
  }
};

/**
 * Obtiene los datos de asistencia para un rango de fechas.
 * @param startDate - Fecha inicial del rango.
 * @param endDate - Fecha final del rango.
 * @returns Un array de documentos de asistencia.
 */
export const getAttendanceByDateRange = async (startDate: string, endDate: string): Promise<AttendanceDocument[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as AttendanceDocument);
  } catch (error) {
    console.error(`Error al obtener la asistencia entre ${startDate} y ${endDate}:`, error);
    throw error;
  }
};

/**
 * Envía datos de asistencia a un webhook.
 * @param date - Fecha de la asistencia.
 * @param classId - ID de la clase.
 * @param teacherId - ID del profesor.
 * @param studentAttendance - Mapeo de IDs de estudiantes a su estado de asistencia.
 */
export async function sendAttendanceToWebhook(
  date: string,
  classId: string,
  teacherId: string,
  studentAttendance: Record<string, string>
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const webhookData = {
      date,
      class_id: classId,
      teacher_id: teacherId,
      attendance: Object.entries(studentAttendance).map(([studentId, status]) => ({
        student_id: studentId,
        status,
        timestamp: now
      }))
    };
    
    await fetch('https://hook.us2.make.com/t2ockuc1vne58yqc68rjqp94njv1i3uo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData),
    });
  } catch (error) {
    console.error('Error enviando asistencia al webhook:', error);
  }
}