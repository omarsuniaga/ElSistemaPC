import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../firebase';

// Interfaces
export interface IStudentLateHistory {
  studentId: string;
  thisWeek: number;
  thisMonth: number;
  total: number;
  recentDates: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ILateAttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  time: string;
  className: string;
  teacherName: string;
}

/**
 * Obtiene el historial de tardanzas de un estudiante
 */
export const getStudentLateHistory = async (studentId: string): Promise<IStudentLateHistory> => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query para obtener tardanzas del estudiante
    const attendanceRef = collection(db, 'ATTENDANCE');
    const lateQuery = query(
      attendanceRef,
      where('studentId', '==', studentId),
      where('status', '==', 'Tardanza'),
      where('date', '>=', Timestamp.fromDate(oneMonthAgo)),
      orderBy('date', 'desc'),
      firestoreLimit(50),
    );

    const querySnapshot = await getDocs(lateQuery);
    const records: ILateAttendanceRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        studentId: data.studentId || '',
        date: data.date?.toDate?.()?.toISOString() || data.date || '',
        time: data.time || '',
        className: data.className || '',
        teacherName: data.teacherName || '',
      });
    });

    // Calcular estadísticas
    const thisWeek = records.filter((r) =>
      new Date(r.date) >= oneWeekAgo,
    ).length;

    const thisMonth = records.length;

    // Obtener fechas recientes (últimas 5)
    const recentDates = records
      .slice(0, 5)
      .map((r) => r.date);

    // Determinar severidad basada en tardanzas de la semana
    let severity: IStudentLateHistory['severity'] = 'low';
    if (thisWeek >= 4) severity = 'critical';
    else if (thisWeek >= 3) severity = 'high';
    else if (thisWeek >= 2) severity = 'medium';

    return {
      studentId,
      thisWeek,
      thisMonth,
      total: thisMonth, // Para ahora, total = thisMonth
      recentDates,
      severity,
    };

  } catch (error) {
    console.error('Error getting student late history:', error);
    
    // Return default values in case of error
    return {
      studentId,
      thisWeek: 0,
      thisMonth: 0,
      total: 0,
      recentDates: [],
      severity: 'low',
    };
  }
};

/**
 * Obtiene el historial de tardanzas para múltiples estudiantes
 */
export const getBulkStudentLateHistory = async (
  studentIds: string[],
): Promise<Record<string, IStudentLateHistory>> => {
  try {
    const historyPromises = studentIds.map((id) => getStudentLateHistory(id));
    const histories = await Promise.all(historyPromises);

    const result: Record<string, IStudentLateHistory> = {};
    histories.forEach((history) => {
      result[history.studentId] = history;
    });

    return result;
  } catch (error) {
    console.error('Error getting bulk student late history:', error);
    
    // Return default values for all students
    const result: Record<string, IStudentLateHistory> = {};
    studentIds.forEach((id) => {
      result[id] = {
        studentId: id,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
        recentDates: [],
        severity: 'low',
      };
    });

    return result;
  }
};

/**
 * Genera un mensaje personalizado basado en el historial de tardanzas
 */
export const generateLateMessage = (
  studentName: string,
  lateTime: string,
  history: IStudentLateHistory,
  customTemplate?: string,
): string => {
  const date = new Date().toLocaleDateString('es-ES');
  const time = new Date(lateTime).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Si hay una plantilla personalizada, usarla
  if (customTemplate) {
    return customTemplate
      .replace(/{NOMBRE}/g, studentName)
      .replace(/{FECHA}/g, date)
      .replace(/{HORA}/g, time)
      .replace(/{TARDANZAS_SEMANA}/g, history.thisWeek.toString())
      .replace(/{TARDANZAS_MES}/g, history.thisMonth.toString());
  }

  // Mensajes escalonados según la severidad
  const templates = {
    low: `Estimados padres de ${studentName},

Queremos informarles que ${studentName} llegó tarde hoy ${date} a las ${time} horas.

Esta es su ${history.thisWeek}ª tardanza esta semana. Les recordamos la importancia de la puntualidad para el buen desarrollo de las clases.

Agradecemos su comprensión y colaboración.

Saludos cordiales,
Academia de Música`,

    medium: `Estimados padres de ${studentName},

Les escribimos para informarles que ${studentName} ha llegado tarde nuevamente hoy ${date} a las ${time} horas.

Con ${history.thisWeek} tardanzas esta semana, consideramos importante que reforcemos juntos la importancia de la puntualidad.

Les solicitamos mayor atención a los horarios de clase para evitar interrupciones en el aprendizaje.

Gracias por su colaboración.

Academia de Música`,

    high: `Estimados padres de ${studentName},

Nos dirigimos a ustedes con preocupación debido a las tardanzas recurrentes de ${studentName}.

Hoy ${date} llegó tarde a las ${time} horas, siendo ya ${history.thisWeek} tardanzas esta semana y ${history.thisMonth} este mes.

Esta situación está afectando el desarrollo normal de las clases. Les solicitamos encarecidamente que nos expliquen las razones y tomen las medidas necesarias.

Esperamos su pronta respuesta y mejora inmediata.

Academia de Música`,

    critical: `Estimados padres de ${studentName},

La situación de tardanzas de ${studentName} ha alcanzado un nivel crítico que requiere acción inmediata.

Con ${history.thisWeek} tardanzas esta semana y ${history.thisMonth} este mes, es imperativo que programemos una reunión urgente para abordar esta situación.

Les solicitamos contactarnos inmediatamente para coordinar una cita. De no hacerlo, nos veremos obligados a tomar medidas disciplinarias.

Esta es una notificación formal que requiere respuesta inmediata.

Academia de Música`,
  };

  return templates[history.severity];
};

/**
 * Formatea la información de tardanzas para mostrar en la UI
 */
export const formatLateInfo = (history: IStudentLateHistory): string => {
  const { thisWeek, thisMonth, severity } = history;
  
  if (thisWeek === 0) return 'Sin tardanzas esta semana';
  
  const weekText = thisWeek === 1 ? 'tardanza' : 'tardanzas';
  const monthText = thisMonth === 1 ? 'tardanza' : 'tardanzas';
  
  return `${thisWeek} ${weekText} esta semana, ${thisMonth} ${monthText} este mes (${severity.toUpperCase()})`;
};

/**
 * Obtiene el color del badge según la severidad
 */
export const getSeverityColor = (severity: IStudentLateHistory['severity']): string => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800', 
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  
  return colors[severity];
};

/**
 * Obtiene el texto de severidad en español
 */
export const getSeverityText = (severity: IStudentLateHistory['severity']): string => {
  const texts = {
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto', 
    critical: 'Crítico',
  };
  
  return texts[severity];
};
