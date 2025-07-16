// Servicio para el Reporte de Asistencia Diaria
// Conecta con Firebase para obtener datos reales de asistencia

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Interfaces
interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  className: string
  teacherName: string
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado'
  time: string
  observations: string
  reason?: string
}

interface AttendanceSummary {
  total: number
  presentes: number
  ausentes: number
  tarde: number
  justificados: number
}

interface StudentInfo {
  id: string
  nombre: string
  apellido: string
  tlf_madre?: string
  tlf_padre?: string
}

interface ClassInfo {
  id: string
  name: string
  teacherId: string
  teacherName?: string
}

// Colecciones Firebase
const ATTENDANCE_COLLECTION = 'ASISTENCIAS';
const STUDENTS_COLLECTION = 'ALUMNOS';
const CLASSES_COLLECTION = 'CLASES';
const TEACHERS_COLLECTION = 'users';

/**
 * Obtiene información de un estudiante
 */
const getStudentInfo = async (studentId: string): Promise<StudentInfo | null> => {
  try {
    const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
    if (studentDoc.exists()) {
      const data = studentDoc.data();
      return {
        id: studentId,
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        tlf_madre: data.tlf_madre || '',
        tlf_padre: data.tlf_padre || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo información del estudiante:', error);
    return null;
  }
};

/**
 * Obtiene información de una clase
 */
const getClassInfo = async (classId: string): Promise<ClassInfo | null> => {
  try {
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));
    if (classDoc.exists()) {
      const data = classDoc.data();

      // Obtener nombre del maestro
      let teacherName = 'Maestro no encontrado';
      if (data.teacherId) {
        try {
          const teacherDoc = await getDoc(doc(db, TEACHERS_COLLECTION, data.teacherId));
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            teacherName = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim();
          }
        } catch (teacherError) {
          console.warn('Error obteniendo maestro:', teacherError);
        }
      }

      return {
        id: classId,
        name: data.name || data.className || `Clase ${classId}`,
        teacherId: data.teacherId || '',
        teacherName,
      };
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo información de la clase:', error);
    return null;
  }
};

/**
 * Convierte documento de asistencia a registros individuales
 */
const processAttendanceDocument = async (attendanceDoc: any): Promise<AttendanceRecord[]> => {
  const records: AttendanceRecord[] = [];
  const data = attendanceDoc.data();

  if (!data.data) {
    console.warn('Documento de asistencia sin datos:', attendanceDoc.id);
    return records;
  }

  const classInfo = await getClassInfo(data.classId);
  const className = classInfo?.name || 'Clase desconocida';
  const teacherName = classInfo?.teacherName || 'Maestro desconocido';

  // Cache para información de estudiantes
  const studentsCache = new Map<string, StudentInfo>();

  const getStudentName = async (studentId: string): Promise<string> => {
    if (!studentsCache.has(studentId)) {
      const studentInfo = await getStudentInfo(studentId);
      if (studentInfo) {
        studentsCache.set(studentId, studentInfo);
      }
    }

    const student = studentsCache.get(studentId);
    return student ? `${student.nombre} ${student.apellido}`.trim() : `Estudiante ${studentId}`;
  };

  // Procesar estudiantes presentes
  if (data.data.presentes && Array.isArray(data.data.presentes)) {
    for (const studentId of data.data.presentes) {
      const studentName = await getStudentName(studentId);
      records.push({
        id: `${attendanceDoc.id}_${studentId}_presente`,
        studentId,
        studentName,
        className,
        teacherName,
        status: 'Presente',
        time: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        observations: '',
      });
    }
  }

  // Procesar estudiantes ausentes
  if (data.data.ausentes && Array.isArray(data.data.ausentes)) {
    for (const studentId of data.data.ausentes) {
      // Verificar si está justificado
      const justification = data.data.justificacion?.find(
        (j: any) => j.id === studentId || j.studentId === studentId,
      );

      const studentName = await getStudentName(studentId);
      records.push({
        id: `${attendanceDoc.id}_${studentId}_ausente`,
        studentId,
        studentName,
        className,
        teacherName,
        status: justification ? 'Justificado' : 'Ausente',
        time: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        observations: justification?.reason || '',
        reason: justification?.reason,
      });
    }
  }

  // Procesar estudiantes con tardanza
  if (data.data.tarde && Array.isArray(data.data.tarde)) {
    for (const studentId of data.data.tarde) {
      // Verificar si está justificado
      const justification = data.data.justificacion?.find(
        (j: any) => j.id === studentId || j.studentId === studentId,
      );

      const studentName = await getStudentName(studentId);
      records.push({
        id: `${attendanceDoc.id}_${studentId}_tarde`,
        studentId,
        studentName,
        className,
        teacherName,
        status: justification ? 'Justificado' : 'Tardanza',
        time: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        observations: justification?.reason || 'Llegada tarde',
        reason: justification?.reason,
      });
    }
  }

  return records;
};

/**
 * FUNCIÓN PRINCIPAL: Obtiene todos los datos de asistencia para una fecha específica
 */
export const getDailyAttendanceReport = async (
  date: string,
): Promise<{
  records: AttendanceRecord[]
  summary: AttendanceSummary
  success: boolean
  error?: string
}> => {
  try {
    console.log(`📊 Obteniendo reporte de asistencia para ${date}`);

    // Consultar documentos de asistencia para la fecha específica
    const attendanceQuery = query(collection(db, ATTENDANCE_COLLECTION), where('fecha', '==', date));

    const attendanceSnapshot = await getDocs(attendanceQuery);
    console.log(`📄 Encontrados ${attendanceSnapshot.size} documentos de asistencia`);

    if (attendanceSnapshot.empty) {
      return {
        records: [],
        summary: { total: 0, presentes: 0, ausentes: 0, tarde: 0, justificados: 0 },
        success: true,
      };
    }

    // Procesar cada documento de asistencia
    const allRecords: AttendanceRecord[] = [];

    for (const doc of attendanceSnapshot.docs) {
      try {
        const docRecords = await processAttendanceDocument(doc);
        allRecords.push(...docRecords);
      } catch (docError) {
        console.error(`Error procesando documento ${doc.id}:`, docError);
      }
    }

    // Calcular resumen
    const summary: AttendanceSummary = {
      total: allRecords.length,
      presentes: allRecords.filter((r) => r.status === 'Presente').length,
      ausentes: allRecords.filter((r) => r.status === 'Ausente').length,
      tarde: allRecords.filter((r) => r.status === 'Tardanza').length,
      justificados: allRecords.filter((r) => r.status === 'Justificado').length,
    };

    console.log('📈 Resumen de asistencia:', summary);

    // Ordenar registros por nombre del estudiante
    allRecords.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return {
      records: allRecords,
      summary,
      success: true,
    };
  } catch (error) {
    console.error('❌ Error obteniendo reporte de asistencia:', error);
    return {
      records: [],
      summary: { total: 0, presentes: 0, ausentes: 0, tarde: 0, justificados: 0 },
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

/**
 * Obtiene lista de estudiantes con tardanza para notificaciones
 */
export const getLateStudentsForNotification = async (
  date: string,
): Promise<
  {
    studentId: string
    studentName: string
    className: string
    phoneNumbers: string[]
  }[]
> => {
  try {
    const report = await getDailyAttendanceReport(date);

    if (!report.success) {
      throw new Error(report.error || 'Error obteniendo datos');
    }

    const lateStudents = report.records.filter((r) => r.status === 'Tardanza');
    const result = [];

    for (const record of lateStudents) {
      const studentInfo = await getStudentInfo(record.studentId);
      const phoneNumbers = [];

      if (studentInfo?.tlf_madre) phoneNumbers.push(studentInfo.tlf_madre);
      if (studentInfo?.tlf_padre) phoneNumbers.push(studentInfo.tlf_padre);

      if (phoneNumbers.length > 0) {
        result.push({
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.className,
          phoneNumbers,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error obteniendo estudiantes tardíos:', error);
    return [];
  }
};

/**
 * Obtiene lista de estudiantes con ausencias justificadas para notificaciones
 */
export const getJustifiedAbsencesForNotification = async (
  date: string,
): Promise<
  {
    studentId: string
    studentName: string
    className: string
    reason: string
    phoneNumbers: string[]
  }[]
> => {
  try {
    const report = await getDailyAttendanceReport(date);

    if (!report.success) {
      throw new Error(report.error || 'Error obteniendo datos');
    }

    const justifiedStudents = report.records.filter((r) => r.status === 'Justificado');
    const result = [];

    for (const record of justifiedStudents) {
      const studentInfo = await getStudentInfo(record.studentId);
      const phoneNumbers = [];

      if (studentInfo?.tlf_madre) phoneNumbers.push(studentInfo.tlf_madre);
      if (studentInfo?.tlf_padre) phoneNumbers.push(studentInfo.tlf_padre);

      if (phoneNumbers.length > 0) {
        result.push({
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.className,
          reason: record.reason || 'Sin motivo especificado',
          phoneNumbers,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error obteniendo ausencias justificadas:', error);
    return [];
  }
};

/**
 * Obtiene lista de estudiantes con ausencias injustificadas para notificaciones
 */
export const getUnexcusedAbsencesForNotification = async (
  date: string,
): Promise<
  {
    studentId: string
    studentName: string
    className: string
    phoneNumbers: string[]
  }[]
> => {
  try {
    const report = await getDailyAttendanceReport(date);

    if (!report.success) {
      throw new Error(report.error || 'Error obteniendo datos');
    }

    const absentStudents = report.records.filter((r) => r.status === 'Ausente');
    const result = [];

    for (const record of absentStudents) {
      const studentInfo = await getStudentInfo(record.studentId);
      const phoneNumbers = [];

      if (studentInfo?.tlf_madre) phoneNumbers.push(studentInfo.tlf_madre);
      if (studentInfo?.tlf_padre) phoneNumbers.push(studentInfo.tlf_padre);

      if (phoneNumbers.length > 0) {
        result.push({
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.className,
          phoneNumbers,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error obteniendo ausencias injustificadas:', error);
    return [];
  }
};

export default {
  getDailyAttendanceReport,
  getLateStudentsForNotification,
  getJustifiedAbsencesForNotification,
  getUnexcusedAbsencesForNotification,
};
