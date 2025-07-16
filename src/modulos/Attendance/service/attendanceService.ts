// src/modulos/Attendance/service/attendanceService.ts
import {
  getAttendanceDocumentFirebase,
  saveAttendanceDocumentFirebase,
  addJustificationToAttendanceFirebase,
  updateObservationsFirebase,
  getAttendancesFirebase,
  getAttendanceByDateAndClassFirebase,
  updateAttendanceFirebase,
  fetchAttendanceByDateRangeFirebase,
  addObservationToHistoryFirebase,
  getObservationsHistoryFirebase,
  updateObservationInHistoryFirebase,
  checkAttendanceDocumentExists
} from './attendance';

import type {
  AttendanceDocument,
  JustificationData,
  AttendanceRecord,
  ClassObservationData,
  ObservationRecord
} from '../types/attendance';

/**
 * Servicio que actúa como interfaz para las operaciones de asistencia en Firebase
 */
class AttendanceService {
  /**
   * Obtiene un documento de asistencia por fecha y clase
   */
  async getAttendanceDocument(fecha: string, classId: string): Promise<AttendanceDocument | null> {
    return await getAttendanceDocumentFirebase(fecha, classId);
  }

  /**
   * Guarda un documento de asistencia
   */
  async saveAttendanceDocument(attendanceDoc: AttendanceDocument): Promise<string> {
    return await saveAttendanceDocumentFirebase(attendanceDoc);
  }

  /**
   * Añade justificación a un registro de asistencia
   */
  async addJustification(
    fecha: string,
    classId: string,
    justification: JustificationData,
    file: File | null
  ): Promise<string> {
    return await addJustificationToAttendanceFirebase(fecha, classId, justification, file);
  }

  /**
   * Actualiza las observaciones de un documento de asistencia
   */
  async updateObservations(
    fecha: string,
    classId: string,
    observations: string | ClassObservationData[]
  ): Promise<string> {
    return await updateObservationsFirebase(fecha, classId, observations);
  }

  /**
   * Obtiene todos los registros de asistencia
   */
  async getAllAttendances(): Promise<AttendanceRecord[]> {
    return await getAttendancesFirebase();
  }

  /**
   * Obtiene registros de asistencia por fecha y clase
   */
  async getAttendanceByDateAndClass(
    fecha?: string,
    classId?: string
  ): Promise<AttendanceRecord[]> {
    return await getAttendanceByDateAndClassFirebase(fecha, classId);
  }

  /**
   * Actualiza un registro de asistencia
   */
  async updateAttendance(attendanceData: AttendanceRecord): Promise<string> {
    return await updateAttendanceFirebase(attendanceData);
  }

  /**
   * Obtiene asistencias por rango de fechas
   */
  async getAttendanceDocumentsByDateRange(
    startDate: string,
    endDate: string,
    teacherId?: string
  ): Promise<AttendanceDocument[]> {
    // Implementación temporal - usar fetchAttendanceByDateRangeFirebase y convertir
    const records = await fetchAttendanceByDateRangeFirebase(startDate, endDate);
    
    // Agrupar registros por documento
    const documentsMap = new Map<string, AttendanceDocument>();
    
    records.forEach(record => {
      const docId = `${record.fecha}_${record.classId}`;
      
      if (!documentsMap.has(docId)) {
        // Crear estructura base del documento
        documentsMap.set(docId, {
          id: docId,
          fecha: record.fecha,
          classId: record.classId,
          uid: teacherId || '',
          teacherId: teacherId || '',
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          data: {
            presentes: [],
            ausentes: [],
            tarde: [],
            justificacion: [],
            observación: '',
            fechaRegistro: new Date(),
            maestro: teacherId || ''
          }
        } as AttendanceDocument);
      }
      
      // Añadir estudiante a la lista correspondiente según su estado
      const doc = documentsMap.get(docId)!;
      
      if (record.status === 'Presente' && !doc.data.presentes.includes(record.studentId)) {
        doc.data.presentes.push(record.studentId);
      } else if (record.status === 'Ausente' && !doc.data.ausentes.includes(record.studentId)) {
        doc.data.ausentes.push(record.studentId);
      } else if (record.status === 'Tardanza' && !doc.data.tarde.includes(record.studentId)) {
        doc.data.tarde.push(record.studentId);
      } else if (record.status === 'Justificado') {
        const justificacionExistente = doc.data.justificacion.find(j => 
          typeof j === 'object' && j.studentId === record.studentId
        );
        
        if (!justificacionExistente) {
          doc.data.justificacion.push({
            studentId: record.studentId,
            reason: record.justification?.reason || ''
          });
        }
      }
    });
    
    return Array.from(documentsMap.values());
  }
  
  /**
   * Obtiene las fechas registradas para asistencia
   */
  async getRegisteredAttendanceDates(teacherId?: string): Promise<string[]> {
    // Implementación básica - puede expandirse para filtrar por teacherId
    try {
      const records = await getAttendancesFirebase();
      const uniqueDates = new Set<string>();
      
      records.forEach(record => {
        if (record.fecha && (!teacherId || record.teacherId === teacherId)) {
          uniqueDates.add(record.fecha);
        }
      });
      
      return Array.from(uniqueDates);
    } catch (error) {
      console.error('Error al obtener fechas registradas:', error);
      return [];
    }
  }
  
  /**
   * Verifica si existe un documento de asistencia
   */
  async checkAttendanceExists(fecha: string, classId: string): Promise<boolean> {
    return await checkAttendanceDocumentExists(fecha, classId);
  }

  /**
   * Añade una observación al historial
   */
  async addObservationToHistory(
    classId: string,
    date: string,
    text: string,
    author: string,
    studentId?: string
  ): Promise<void> {
    await addObservationToHistoryFirebase(classId, date, text, author, studentId);
  }

  /**
   * Obtiene el historial de observaciones
   */
  async getObservationsHistory(
    classId?: string,
    specificDate?: string
  ): Promise<ObservationRecord[]> {
    return await getObservationsHistoryFirebase(classId, specificDate);
  }

  /**
   * Actualiza una observación existente
   */
  async updateObservation(observationId: string, text: string): Promise<void> {
    await updateObservationInHistoryFirebase(observationId, text);
  }
}

// Singleton del servicio
export const attendanceService = new AttendanceService();
export default attendanceService;
