// Archivo para acciones relacionadas con la obtención (fetching) de datos de asistencia
import { parseISO, isValid } from 'date-fns';
import { useAuthStore } from '../../../Auth/store/auth';
import { saveToLocalStorage } from '../../../../utils/localStorageUtils';
import { LOCAL_STORAGE_KEYS } from '../../../../constants/localStorage';

import {
  getAllAttendanceDocumentsFirebase,
  getAttendancesFirebase,
  getAttendanceDocumentFirebase,
  fetchAttendanceByDateRangeFirebase,
  getAllObservationsFirebase,
  getAttendanceByDateAndClassFirebase,
  getAttendanceStatusFirebase,
} from '../../service/attendance';

// Importar tipos principales
import type {
  AttendanceRecord,
  AttendanceDocument,
} from '../../types/attendance';
import type { ClassObservation } from '../../types';

// Definición local para el item de justificación según AttendanceDocument.data.justificacion
interface JustificationItemInDoc {
  id: string; // Corresponde a studentId
  reason: string;
  documentURL?: string;
  approved?: boolean;
  timestamp?: string;
  status?: string; // e.g., 'pending', 'approved', 'rejected'
}

// Definir tipos locales para el estado y el store
type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | string;

export interface AttendanceStoreState { // Added export
  isLoading: boolean;
  error: string | null;
  attendanceDocuments: AttendanceDocument[];
  records: AttendanceRecord[]; // Raw records from getAttendancesFirebase
  selectedClass: string | null;
  currentAttendanceDoc: AttendanceDocument | null;
  attendanceRecords: Record<string, AttendanceStatus>; // StudentID -> Status for current view
  datesWithRecords: string[];
  observationsHistory: ClassObservation[];
  activeStudents: string[];
  lastFetch: Date | null;
  cacheExpiryMinutes: number;
  lastFetchParams: any | null;

  // Métodos que se espera que existan en el store o sean parte de estas acciones
  initActiveStudents(): void;
  _updateAttendanceRecordsFromDocument(document: AttendanceDocument): void;
  fetchAttendanceDocument(fecha: string, classId: string, forceReload?: boolean): Promise<AttendanceDocument | null>;
  fetchAttendanceByClassAndDate(classId: string, date: string): Promise<Record<string, string>>;
  fetchAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]>;
}

function initActiveStudents(this: AttendanceStoreState): void {
  const activeStudentIds = new Set<string>();
  this.attendanceDocuments.forEach(doc => {
    if (doc.data) {
      doc.data.presentes?.forEach(studentId => activeStudentIds.add(studentId));
      doc.data.ausentes?.forEach(studentId => activeStudentIds.add(studentId));
      doc.data.tarde?.forEach(studentId => activeStudentIds.add(studentId));
      
      if (Array.isArray(doc.data.justificacion)) {
        (doc.data.justificacion as JustificationItemInDoc[]).forEach(justification => {
          if (justification && justification.id) {
            activeStudentIds.add(justification.id);
          }
        });
      } else if (doc.data.justificacion && typeof doc.data.justificacion === 'object') {
        // Fallback for potentially incorrect structure (object map instead of array)
        Object.keys(doc.data.justificacion).forEach(studentId => activeStudentIds.add(studentId));
      }
    }
  });
  this.records.forEach(record => {
    if (record.studentId) {
      activeStudentIds.add(record.studentId);
    }
  });
  this.activeStudents = Array.from(activeStudentIds);
}

function _updateAttendanceRecordsFromDocument(this: AttendanceStoreState, document: AttendanceDocument) {
  this.attendanceRecords = {};
  if (!document || !document.data) {
    console.warn('⚠️ Documento de asistencia vacío o sin datos para _updateAttendanceRecordsFromDocument');
    return;
  }

  const data = document.data;
  data.presentes = Array.isArray(data.presentes) ? data.presentes : [];
  data.ausentes = Array.isArray(data.ausentes) ? data.ausentes : [];
  data.tarde = Array.isArray(data.tarde) ? data.tarde : [];
  data.observations = typeof data.observations === 'string' ? data.observations : '';

  const justifiedStudentIds = new Set<string>();
  let justificationsToProcess: JustificationItemInDoc[] = [];

  if (Array.isArray(data.justificacion)) {
    justificationsToProcess = data.justificacion as JustificationItemInDoc[];
  } else if (data.justificacion && typeof data.justificacion === 'object') {
    console.warn('⚠️ Justificaciones en formato de objeto no estándar detectado en _updateAttendanceRecordsFromDocument. Intentando convertir.', data.justificacion);
    justificationsToProcess = Object.entries(data.justificacion as Record<string, Omit<JustificationItemInDoc, 'id'>>)
      .map(([key, value]) => ({ ...value, id: key }));
  }

  justificationsToProcess.forEach(justification => {
    if (justification.id && (justification.approved || justification.status === 'approved')) {
      this.attendanceRecords[justification.id] = 'Justificado';
      justifiedStudentIds.add(justification.id);
    }
  });

  data.presentes.forEach(studentId => {
    if (!this.attendanceRecords[studentId]) this.attendanceRecords[studentId] = 'Presente';
  });
  data.ausentes.forEach(studentId => {
    if (!this.attendanceRecords[studentId] && !justifiedStudentIds.has(studentId)) {
      this.attendanceRecords[studentId] = 'Ausente';
    }
  });
  data.tarde.forEach(studentId => {
    if (!this.attendanceRecords[studentId] && !justifiedStudentIds.has(studentId)) {
      this.attendanceRecords[studentId] = 'Tardanza';
    }
  });

  justifiedStudentIds.forEach(studentId => {
    if (this.attendanceRecords[studentId] !== 'Justificado') {
      console.warn(`⚠️ Corrigiendo inconsistencia en _updateAttendanceRecordsFromDocument: Estudiante ${studentId} con justificación aprobada no marcado como Justificado. Forzando.`);
      this.attendanceRecords[studentId] = 'Justificado';
    }
  });
}

async function loadAttendanceDataForCalendar(this: AttendanceStoreState) {
  this.isLoading = true;
  this.error = null;
  try {
    const docs = await getAllAttendanceDocumentsFirebase();
    const dates = docs.map(doc => doc.fecha).filter(Boolean);
    const uniqueDates = [...new Set(dates)];
    const validDates = uniqueDates.filter(dateString => {
      const parsedDate = parseISO(dateString);
      return isValid(parsedDate) && parsedDate <= new Date();
    });
    this.datesWithRecords = validDates;
    if (import.meta.env.DEV) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS, validDates);
    }
  } catch (error: any) {
    this.error = `Error loading data for calendar: ${error.message || String(error)}`;
    console.error('Error loading data for calendar:', error);
    throw error;
  } finally {
    this.isLoading = false;
  }
}

async function fetchAttendanceDocuments(this: AttendanceStoreState): Promise<AttendanceDocument[]> { // Renamed back from fetchAttendanceRecords
  this.isLoading = true;
  this.error = null;
  try {
    const fetchedRecords = await getAttendancesFirebase();
    this.records = fetchedRecords;
    const documentMap = new Map<string, AttendanceDocument>();
    const authStore = useAuthStore();

    fetchedRecords.forEach(record => {
      const key = `${record.Fecha}_${record.classId}`;
      if (!documentMap.has(key)) {
        documentMap.set(key, {
          id: `doc-${key}-${Date.now()}`,
          fecha: record.Fecha,
          classId: record.classId,
          teacherId: authStore.user?.uid || '',
          data: { presentes: [], ausentes: [], tarde: [], justificacion: [], observations: '' },
        });
      }
      const doc = documentMap.get(key)!;
      if (!Array.isArray(doc.data.justificacion)) doc.data.justificacion = [];
      const justificationsArray = doc.data.justificacion as JustificationItemInDoc[];

      switch (record.status) {
        case 'Presente': doc.data.presentes.push(record.studentId); break;
        case 'Ausente': doc.data.ausentes.push(record.studentId); break;
        case 'Tardanza': doc.data.tarde.push(record.studentId); break;
        case 'Justificado':
          if (!justificationsArray.find(j => j.id === record.studentId)) {
            justificationsArray.push({
              id: record.studentId,
              reason: 'Justificado vía registro de asistencia',
              timestamp: new Date().toISOString(),
              approved: true,
              status: 'approved'
            });
          }
          break;
      }
    });
    this.attendanceDocuments = Array.from(documentMap.values());
    initActiveStudents.call(this);
    return this.attendanceDocuments;
  } catch (error: any) {
    this.error = `Error fetching attendance documents: ${error.message || String(error)}`;
    console.error('Error en fetchAttendanceDocuments:', error);
    return [];
  } finally {
    this.isLoading = false;
  }
}

async function fetchAttendanceDocument(
  this: AttendanceStoreState,
  fecha: string,
  classId: string,
  forceReload = false
): Promise<AttendanceDocument | null> {
  this.isLoading = true;
  this.error = null;
  const now = new Date();
  const currentParams = { fecha, classId };

  if (!forceReload && this.currentAttendanceDoc && 
      this.currentAttendanceDoc.fecha === fecha && // Ensure cache is for the exact same date and class
      this.currentAttendanceDoc.classId === classId &&
      JSON.stringify(this.lastFetchParams) === JSON.stringify(currentParams) &&
      this.lastFetch && (now.getTime() - this.lastFetch.getTime()) < (this.cacheExpiryMinutes * 60 * 1000)) {
    console.log(`[FetchActionsDebug] fetchAttendanceDocument: Returning cached document for ${fecha} - ${classId}`);
    this.isLoading = false;
    // Ensure attendanceRecords are up-to-date with this cached doc
    if (this.currentAttendanceDoc.data) { // Check if data exists
        _updateAttendanceRecordsFromDocument.call(this, this.currentAttendanceDoc);
    } else {
        this.attendanceRecords = {}; // Clear if cached doc has no data
    }
    return this.currentAttendanceDoc;
  }

  try {
    console.log(`[FetchActionsDebug] fetchAttendanceDocument: Fetching from Firebase for ${fecha} - ${classId}`);
    const document = await getAttendanceDocumentFirebase(fecha, classId);
    console.log(`[FetchActionsDebug] fetchAttendanceDocument: getAttendanceDocumentFirebase returned:`, document ? JSON.parse(JSON.stringify(document)) : null);
    if (document && document.data) { // Ensure document and document.data exist
      this.currentAttendanceDoc = document;
      this.lastFetch = now;
      this.lastFetchParams = currentParams;
      _updateAttendanceRecordsFromDocument.call(this, document);
      const index = this.attendanceDocuments.findIndex(doc => doc.id === document.id || (doc.fecha === document.fecha && doc.classId === document.classId));
      if (index !== -1) {
        this.attendanceDocuments[index] = document;
      } else {
        this.attendanceDocuments.push(document);
      }
      initActiveStudents.call(this); // Recalculate active students
    } else {
      console.warn(`[FetchActionsDebug] fetchAttendanceDocument: No document found or document.data is missing for ${fecha} - ${classId}. Clearing current doc and records.`);
      this.currentAttendanceDoc = null;
      this.attendanceRecords = {}; // Clear records if no doc found or doc.data is missing
    }
    return this.currentAttendanceDoc; // Return the potentially updated currentAttendanceDoc
  } catch (error: any) {
    this.error = `Error al buscar documento de asistencia: ${error.message || String(error)}`;
    this.currentAttendanceDoc = null;
    this.attendanceRecords = {};
    return null;
  } finally {
    this.isLoading = false;
  }
}

async function fetchAttendanceByClassAndDate(
  this: AttendanceStoreState,
  classId: string,
  date: string
): Promise<Record<string, string>> { // Return type is Record<string, string> (studentId -> status)
  this.isLoading = true;
  this.error = null;
  try {
    // This service function returns AttendanceRecord[]
    const fetchedFirebaseRecords: AttendanceRecord[] = await getAttendanceByDateAndClassFirebase(date, classId);
    
    const studentStatusMap: Record<string, string> = {};
    fetchedFirebaseRecords.forEach(record => {
      studentStatusMap[record.studentId] = record.status;
    });

    this.attendanceRecords = { ...studentStatusMap }; // Update store's immediate attendance records

    // Try to find an existing document in the local store to update
    let docInStore = this.attendanceDocuments.find(d => d.fecha === date && d.classId === classId);

    if (docInStore) {
      // Update existing document based on fetchedFirebaseRecords
      docInStore.data.presentes = [];
      docInStore.data.ausentes = [];
      docInStore.data.tarde = [];
      
      // Ensure docInStore.data.justificacion is an array of JustificationItemInDoc
      let currentJustifications: JustificationItemInDoc[] = 
        Array.isArray(docInStore.data.justificacion) 
          ? docInStore.data.justificacion as JustificationItemInDoc[] 
          : [];
      
      const updatedJustifications: JustificationItemInDoc[] = [];

      fetchedFirebaseRecords.forEach(record => {
        const studentId = record.studentId;
        const status = record.status;

        if (status === 'Presente') {
          docInStore!.data.presentes.push(studentId);
        } else if (status === 'Ausente') {
          docInStore!.data.ausentes.push(studentId);
        } else if (status === 'Tardanza') {
          docInStore!.data.tarde.push(studentId);
        } else if (status === 'Justificado') {
          // Student is justified, ensure they are in ausentes and have a justification entry
          if (!docInStore!.data.ausentes.includes(studentId)) {
            docInStore!.data.ausentes.push(studentId);
          }
          
          let justRec = currentJustifications.find(j => j.id === studentId);
          if (justRec) {
            justRec.approved = true;
            justRec.status = 'approved'; // Ensure status reflects approval
            justRec.reason = record.justification?.reason || justRec.reason || 'Justificado (actualizado)';
            justRec.documentURL = record.justification?.documentURL || justRec.documentURL;
            updatedJustifications.push(justRec);
          } else {
            updatedJustifications.push({
              id: studentId,
              reason: record.justification?.reason || 'Justificado (derivado de fetch)',
              documentURL: record.justification?.documentURL,
              timestamp: new Date().toISOString(), // Add timestamp for new entries
              approved: true,
              status: 'approved'
            });
          }
        }
      });

      // Consolidate justifications: keep existing ones not overwritten, add new/updated ones
      const finalJustifications = new Map<string, JustificationItemInDoc>();
      currentJustifications.forEach(j => finalJustifications.set(j.id, j));
      updatedJustifications.forEach(j => finalJustifications.set(j.id, j));
      docInStore.data.justificacion = Array.from(finalJustifications.values());

      // Ensure justified students are ONLY in 'ausentes' and not in 'presentes' or 'tarde'
      const justifiedIds = new Set(updatedJustifications.map(j => j.id));
      docInStore.data.presentes = docInStore.data.presentes.filter(id => !justifiedIds.has(id));
      docInStore.data.tarde = docInStore.data.tarde.filter(id => !justifiedIds.has(id));
      // Ensure all justified students are in ausentes
      justifiedIds.forEach(id => {
        if (!docInStore!.data.ausentes.includes(id)) {
          docInStore!.data.ausentes.push(id);
        }
      });


      this.currentAttendanceDoc = { ...docInStore }; // Create a new object reference for reactivity
      const docIndex = this.attendanceDocuments.findIndex(d => d.id === docInStore!.id);
      if (docIndex !== -1) {
        this.attendanceDocuments[docIndex] = this.currentAttendanceDoc;
      } else {
        // This case should ideally not happen if docInStore was found
        this.attendanceDocuments.push(this.currentAttendanceDoc);
      }

    } else {
      // Create a new document if it doesn't exist locally
      const authStore = useAuthStore();
      const newDocId = `generated-${classId}-${date}-${Date.now()}`; // Or use a more stable ID if possible
      const newPresentes: string[] = [];
      const newAusentes: string[] = [];
      const newTarde: string[] = [];
      const newJustificationsData: JustificationItemInDoc[] = [];

      fetchedFirebaseRecords.forEach(record => {
        const studentId = record.studentId;
        const status = record.status;
        if (status === 'Presente') newPresentes.push(studentId);
        else if (status === 'Ausente') newAusentes.push(studentId);
        else if (status === 'Tardanza') newTarde.push(studentId);
        else if (status === 'Justificado') {
          if(!newAusentes.includes(studentId)) newAusentes.push(studentId); // Justified students are marked absent
          newJustificationsData.push({
            id: studentId,
            reason: record.justification?.reason || 'Justificado (derivado de fetch)',
            documentURL: record.justification?.documentURL,
            timestamp: new Date().toISOString(),
            approved: true,
            status: 'approved'
          });
        }
      });
      
      // Ensure justified students are not in presentes or tarde for the new doc
      const justifiedIdsForNewDoc = new Set(newJustificationsData.map(j => j.id));
      const finalPresentes = newPresentes.filter(id => !justifiedIdsForNewDoc.has(id));
      const finalTarde = newTarde.filter(id => !justifiedIdsForNewDoc.has(id));


      const newDoc: AttendanceDocument = {
        id: newDocId,
        fecha: date,
        classId: classId,
        teacherId: authStore.user?.uid || '', // Get current user's ID
        data: {
          presentes: finalPresentes,
          ausentes: newAusentes, // Includes justified students
          tarde: finalTarde,
          justificacion: newJustificationsData,
          observations: '' // Default empty observations
        },
      };
      this.attendanceDocuments.push(newDoc);
      this.currentAttendanceDoc = newDoc;
    }
    
    // After updating/creating the document, re-initialize active students if necessary
    // and update the immediate attendanceRecords from the potentially modified currentAttendanceDoc
    if (this.currentAttendanceDoc) {
        _updateAttendanceRecordsFromDocument.call(this, this.currentAttendanceDoc);
    }
    initActiveStudents.call(this); 

    return this.attendanceRecords; // Return the updated map
  } catch (error: any) {
    this.error = `Error fetching attendance for class ${classId} on ${date}: ${error.message || String(error)}`;
    console.error("Error in fetchAttendanceByClassAndDate:", this.error, error);
    this.attendanceRecords = {}; // Clear records on error
    return {}; // Return empty map on error
  } finally {
    this.isLoading = false;
  }
}

async function fetchAttendanceByDateRange(
  this: AttendanceStoreState,
  startDate: string,
  endDate: string,
  teacherId?: string
): Promise<AttendanceRecord[]> {
  this.isLoading = true;
  this.error = null;
  
  // Validar que las fechas sean válidas
  if (new Date(startDate) > new Date(endDate)) {
    this.error = 'La fecha inicial debe ser anterior o igual a la fecha final';
    this.isLoading = false;
    return [];
  }
  
  try {
    const records = await fetchAttendanceByDateRangeFirebase(startDate, endDate);
    
    // Filtrar por profesor si se proporciona teacherId
    const filteredRecords = teacherId 
      ? records.filter(record => record.classId && record.classId.includes(teacherId))
      : records;
    
    // Actualizar los registros en el estado del store
    // Primero eliminar registros existentes en el mismo rango de fechas para evitar duplicados
    const existingRecords = this.records.filter(
      record => !(record.date >= startDate && record.date <= endDate)
    );
    
    // Combinar los registros existentes (de otras fechas) con los nuevos
    this.records = [...existingRecords, ...filteredRecords];
    
    return filteredRecords;
  } catch (error: any) {
    this.error = `Error fetching attendance by date range: ${error.message || String(error)}`;
    return [];
  } finally {
    this.isLoading = false;
  }
}

async function fetchAllClassObservations(this: AttendanceStoreState): Promise<ClassObservation[]> {
  this.isLoading = true;
  this.error = null;
  try {
    const observations = await getAllObservationsFirebase();
    this.observationsHistory = observations;
    return observations;
  } catch (error: any) {
    this.error = `Error fetching class observations: ${error.message || String(error)}`;
    return [];
  } finally {
    this.isLoading = false;
  }
}

async function getStudentAttendanceStatus(this: any, studentId: string, date: string, classId?: string): Promise<string> {
  try {
    // 1. Check current view's live records (this.attendanceRecords)
    //    This is the most up-to-date for the currently viewed class/date.
    if (this.currentAttendanceDoc && 
        this.currentAttendanceDoc.fecha === date &&
        (!classId || this.currentAttendanceDoc.classId === classId) && // if classId is provided, it must match
        this.attendanceRecords && 
        this.attendanceRecords[studentId]) {
      return this.attendanceRecords[studentId];
    }

    // 2. Check the broader cache of AttendanceDocument objects (this.attendanceDocuments)
    //    This covers documents loaded for other views or the calendar.
    const relevantDoc = this.attendanceDocuments.find(
      (doc: AttendanceDocument) => doc.fecha === date && (!classId || doc.classId === classId)
    );
    if (relevantDoc && relevantDoc.data) {
      const tempRecords: Record<string, string> = {};
      const data = relevantDoc.data;
      const justifiedStudentIds = new Set<string>();

      if (Array.isArray(data.justificacion)) {
        (data.justificacion as JustificationItemInDoc[]).forEach(j => {
          if (j.id && (j.approved || j.status === 'approved')) { // Check for approval
            tempRecords[j.id] = 'Justificado';
            justifiedStudentIds.add(j.id);
          }
        });
      }
      
      data.presentes?.forEach((id: string) => { if (!tempRecords[id]) tempRecords[id] = 'Presente'; });
      data.ausentes?.forEach((id: string) => { if (!tempRecords[id] && !justifiedStudentIds.has(id)) tempRecords[id] = 'Ausente'; });
      data.tarde?.forEach((id: string) => { if (!tempRecords[id] && !justifiedStudentIds.has(id)) tempRecords[id] = 'Tardanza'; });
      
      if (tempRecords[studentId]) {
        return tempRecords[studentId];
      }
    }
    
    // 3. Fallback to Firebase as the source of truth if not found locally or if classId is different
    const statusFromFirebase = await getAttendanceStatusFirebase(studentId, date, classId);
    return statusFromFirebase;

  } catch (error: any) {
    console.error(`Error getting student attendance status for ${studentId} on ${date} (clase ${classId || 'N/A'}): ${error.message}`);
    return 'Ausente'; // Default to 'Ausente' in case of error
  }
}

export const fetchActions = {
  initActiveStudents,
  _updateAttendanceRecordsFromDocument,
  loadAttendanceDataForCalendar,
  fetchAttendanceDocuments, // Renamed back from fetchAttendanceRecords
  fetchAttendanceDocument,
  fetchAttendanceByClassAndDate,
  fetchAttendanceByDateRange,
  fetchAllClassObservations,
  getStudentAttendanceStatus,
};
