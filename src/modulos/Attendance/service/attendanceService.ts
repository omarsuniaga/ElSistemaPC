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
  checkAttendanceDocumentExists,
  getTeacherAttendanceDocsFirebase,
  fetchAttendanceByDateRangeAndClassesFirebase,
} from './firebase/attendanceFirebase';

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
   * @param fecha - La fecha del documento
   * @param classId - El ID de la clase
   * @param teacherId - El ID del profesor (opcional)
   */
  async getAttendanceDocument(fecha: string, classId: string, teacherId?: string): Promise<AttendanceDocument | null> {
    return await getAttendanceDocumentFirebase(fecha, classId, teacherId);
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
    file: File | null = null
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
    // Si se proporciona teacherId, usar la función optimizada para maestros
    if (teacherId) {
      return await getTeacherAttendanceDocsFirebase(teacherId, startDate, endDate);
    } else {
      // Si no hay teacherId, usar la función general y luego agrupar
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
            uid: record.teacherId || '',
            teacherId: record.teacherId || '',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            data: {
              presentes: [],
              ausentes: [],
              tarde: [],
              justificacion: [],
              observación: '',
              fechaRegistro: new Date(),
              maestro: record.teacherId || ''
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
  }
  
  /**
   * Obtiene las fechas registradas para asistencia
   */
  async getRegisteredAttendanceDates(teacherId?: string): Promise<string[]> {
    // Implementación básica - puede expandirse para filtrar por teacherId
    try {
      const records = await this.getAllAttendances(); // Usar el método del propio servicio
      const uniqueDates = new Set<string>();
      
      records.forEach(record => {
        // Asegurarse de que el campo 'fecha' existe y es una cadena
        if (record.fecha && typeof record.fecha === 'string') {
          // Si se proporciona teacherId, filtrar por él
          if (!teacherId || record.teacherId === teacherId) {
            uniqueDates.add(record.fecha);
          }
        }
      });
      
      return Array.from(uniqueDates);
    } catch (error) {
      console.error('Error al obtener fechas registradas:', error);
      return [];
    }
  }
  
  /**
   * Obtiene documentos de asistencia para una fecha específica
   */
  async getAttendanceDocumentsByDate(date: string, teacherId?: string): Promise<AttendanceDocument[]> {
    // Esta función es similar a getAttendanceDocumentsByDateRange pero para una sola fecha
    // Podríamos reutilizar la lógica de fetchAttendanceByDateRangeFirebase o crear una específica
    const records = await fetchAttendanceByDateRangeFirebase(date, date); // Obtener registros para un solo día
    
    const documentsMap = new Map<string, AttendanceDocument>();
    
    records.forEach(record => {
      // Filtrar por teacherId si se proporciona
      if (teacherId && record.teacherId !== teacherId) {
        return; // Saltar este registro si no coincide con el teacherId
      }

      const docId = `${record.fecha}_${record.classId}`;
      
      if (!documentsMap.has(docId)) {
        documentsMap.set(docId, {
          id: docId,
          fecha: record.fecha,
          classId: record.classId,
          uid: record.teacherId || '',
          teacherId: record.teacherId || '',
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          data: {
            presentes: [],
            ausentes: [],
            tarde: [],
            justificacion: [],
            observación: '',
            fechaRegistro: new Date(),
            maestro: record.teacherId || ''
          }
        } as AttendanceDocument);
      }
      
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

  /**
   * Obtiene estadísticas de asistencia para una clase específica en un rango de fechas.
   * Esta es una implementación de ejemplo y puede requerir lógica más compleja
   * para calcular estadísticas reales basadas en los documentos de asistencia.
   */
  async getAttendanceStats(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const attendanceRecords = await fetchAttendanceByDateRangeAndClassesFirebase(
        startDate,
        endDate,
        [classId]
      );

      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      let totalJustified = 0;
      const uniqueStudents = new Set<string>();

      attendanceRecords.forEach(record => {
        uniqueStudents.add(record.studentId);
        switch (record.status) {
          case 'Presente':
            totalPresent++;
            break;
          case 'Ausente':
            totalAbsent++;
            break;
          case 'Tardanza':
            totalLate++;
            break;
          case 'Justificado':
            totalJustified++;
            break;
        }
      });

      const totalStudentsInClass = uniqueStudents.size; // Esto es una aproximación
      const totalRecords = attendanceRecords.length;

      return {
        classId,
        startDate,
        endDate,
        totalPresent,
        totalAbsent,
        totalLate,
        totalJustified,
        totalRecords,
        totalStudentsInClass,
        // Puedes añadir más estadísticas aquí, como porcentaje de asistencia, etc.
      };
    } catch (error) {
      console.error('Error calculating attendance stats:', error);
      throw error;
    }
  }

  /**
   * Busca documentos de asistencia basados en criterios.
   * @param criteria Objeto con criterios de búsqueda (teacherId, classId).
   * @returns Array de documentos de asistencia.
   */
  async findAttendanceDocuments(criteria: { teacherId?: string; classId?: string }): Promise<AttendanceDocument[]> {
    try {
      let q = collection(getFirestore(), 'ASISTENCIAS');

      if (criteria.teacherId) {
        q = query(q, where('teacherId', '==', criteria.teacherId));
      }
      if (criteria.classId) {
        q = query(q, where('classId', '==', criteria.classId));
      }

      const querySnapshot = await getDocs(q);
      const documents: AttendanceDocument[] = [];
      querySnapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() } as AttendanceDocument);
      });
      return documents;
    } catch (error) {
      console.error('Error finding attendance documents:', error);
      throw error;
    }
  }

  /**
   * Obtiene observaciones estructuradas de un documento de asistencia.
   * Asume que las observaciones están en el campo `data.observations` como un array de objetos.
   * Si `data.observación` es un string, lo convierte a un formato estructurado básico.
   */
  async getStructuredObservations(
    fecha: string,
    classId: string,
    teacherId: string
  ): Promise<ClassObservationData[]> {
    try {
      const doc = await this.getAttendanceDocument(fecha, classId, teacherId);
      if (!doc || !doc.data) {
        return [];
      }

      if (Array.isArray(doc.data.observations)) {
        return doc.data.observations as ClassObservationData[];
      } else if (typeof doc.data.observación === 'string' && doc.data.observación.trim() !== '') {
        // Convertir observación antigua (string) a formato estructurado básico
        return [
          {
            id: `legacy-obs-${doc.id}`,
            type: 'general',
            content: { text: doc.data.observación },
            author: doc.teacherId || doc.uid || 'Desconocido',
            authorId: doc.teacherId || doc.uid || 'Desconocido',
            createdAt: doc.updatedAt || doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || doc.createdAt || new Date(),
            priority: 'media',
            requiresFollowUp: false,
            text: doc.data.observación, // Para compatibilidad con la interfaz
          },
        ];
      }
      return [];
    } catch (error) {
      console.error('Error getting structured observations:', error);
      throw error;
    }
  }
}

// Singleton del servicio
export const attendanceService = new AttendanceService();
export default attendanceService;