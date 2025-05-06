// src/stores/attendance.ts
import { defineStore } from 'pinia'
import { format, parseISO, isValid, isWithinInterval } from 'date-fns'
import { db } from '../../../firebase'
import { useClassesStore } from '../../Classes/store/classes'
import { useAuthStore } from '../../../stores/auth'
import { 
  fetchAttendanceRecords, 
  addAttendanceRecord, 
  updateAttendanceRecord, 
  deleteAttendanceRecord,
  getAttendanceDocumentFirebase,
  saveAttendanceDocumentFirebase,
  addJustificationToAttendanceFirebase,
  getAllObservationsFirebase,
  getAttendanceStatusFirebase,
  fetchAttendanceByDateRangeFirebase,
  getAllAttendanceDocumentsFirebase,
  addObservationToHistoryFirebase,
  updateObservationInHistoryFirebase,
  getObservationsHistoryFirebase,
  getAttendancesFirebase,
  getAttendanceByDateAndClassFirebase // <-- Add the missing function import
} from '../service/attendance'
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../../../utils/localStorageUtils'

// Define the attendance record type
interface AttendanceRecord {
  id?: string;
  studentId: string;
  classId: string;
  Fecha: string; // Format: YYYY-MM-DD
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | string;
  notes?: string;
}

// Attendance statistics type
interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  justified: number;
  total: number;
}

// Student absence record
interface StudentAbsenceRecord {
  studentId: string;
  absences: number;
  lastAttendance: string;
}

const LOCAL_STORAGE_KEYS = {
  ATTENDANCE: 'attendance',
  ATTENDANCE_DOCUMENTS: 'attendance_documents'
};

// Tipo para el mapeo de días
type DayMap = Record<string, number>;
const DAY_MAP: DayMap = { 
  'lunes': 1, 
  'martes': 2, 
  'miércoles': 3, 
  'jueves': 4, 
  'viernes': 5, 
  'sábado': 6, 
  'domingo': 0 
};

// Helper function to fetch attendance items with optional filtering
interface FetchItemsOptions {
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  refresh?: boolean;
}

/**
 * Attendance Store - Manages attendance records, documents, and analytics.
 * 
 * This store handles:
 * - Loading/saving attendance records from Firebase
 * - Managing attendance status for students
 * - Tracking observations and justifications
 * - Generating attendance reports and analytics
 */
export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    // Records are individual attendance entries (student-date-class)
    records: [] as AttendanceRecord[],
    // Documents are grouped attendance data by class and date
    attendanceDocuments: [] as AttendanceDocument[],
    selectedDate: format(new Date(), 'yyyy-MM-dd'),
    selectedClass: '',
    currentAttendanceDoc: null as AttendanceDocument | null,
    isLoading: false,
    error: null as string | null,
    analytics: null as AttendanceAnalytics | null,
    // Current attendance status for UI display
    attendanceRecords: {} as Record<string, AttendanceStatus>,
    levelOptions: ['Básico', 'Intermedio', 'Avanzado'],
    cachedJustifications: {} as Record<string, {
      reason: string,
      file: File | null,
      documentUrl?: string
    }>,
    // Storing calendar dates with records for efficient display
    datesWithRecords: [] as string[],
    observationsHistory: [] as ClassObservation[],
    activeStudents: [] as string[] // Array of active student IDs
  }),
  
  getters: {
     getMarkedDatesForCalendar: (state) => {
      return state.datesWithRecords
},
    getAttendanceStats: (state) => {
      const totalClasses = state.attendanceDocuments.length;
      const totalStudents = new Set(state.records.map(record => record.studentId)).size;
      const averageAttendance = state.analytics?.averageAttendance || 0;
      
      return {
        totalClasses,
        totalStudents,
        averageAttendance
      };
    },
    
    // Getters mejorados con tipado explícito
    getAttendanceByClass: (state) => {
      // obtener asistencias por clase
      return (className: string): AttendanceRecord[] => 
        state.records.filter(record => record.classId === className);
    },
    getClassNameByClassId: (state) => {
      return (classId: string): string => {
        const classesStore = useClassesStore()
        const classItem = classesStore.classes.find(c => c.id === classId)
        return classItem ? classItem.name : 'Clase no encontrada'
      }
    },
    dateAttendanceStatuses: (state) => {
      const auth = useAuthStore()
      const classesStore = useClassesStore()
      const teacherId = auth.user?.uid

      // 1) Filtrar solo los docs de clases del maestro actual
      const teacherClassIds = classesStore.classes
        .filter(c => c.teacherId === teacherId)
        .map(c => c.id)

      // 2) Agrupar docs por fecha solo si pertenecen al maestro
      const byDate: Record<string, string[]> = {}
      state.attendanceDocuments.forEach(doc => {
        if (
          typeof doc.fecha === 'string' &&
          doc.fecha.trim() &&
          teacherClassIds.includes(doc.classId)
        ) {
          byDate[doc.fecha] = byDate[doc.fecha] || []
          if (!byDate[doc.fecha].includes(doc.classId)) {
            byDate[doc.fecha].push(doc.classId)
          }
        }
      })

      // 3) Para cada fecha, comparar clases programadas vs registradas
      return Object.entries(byDate).map(([fecha, recordedClassIds]) => {
        const d = new Date(`${fecha}T00:00:00`)
        if (isNaN(d.getTime())) {
          return { date: fecha, status: 'none' as const }
        }
        const dayIndex = d.getDay()
        // Clases programadas para el maestro ese día
        const scheduled = classesStore.classes.filter(c => {
          if (c.teacherId !== teacherId || !c.schedule?.slots) return false
          return c.schedule.slots.some(slot => {
            if (typeof slot.day === 'number') {
              return slot.day === dayIndex
            } else if (typeof slot.day === 'string') {
              return slot.day.toLowerCase() === ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][dayIndex]
            }
            return false
          })
        })
        const total = scheduled.length
        const recorded = recordedClassIds.length
        let status: 'registered' | 'none' | 'partial' = 'none'
        if (recorded === 0) status = 'none'
        else if (recorded >= total && total > 0) status = 'registered'
        else if (recorded > 0 && recorded < total) status = 'partial'
        return { date: fecha, status }
      })
    },

    getAttendanceByStudent: (state) => {
      // obtener asistencias por estudiante
      return (studentId: string): AttendanceRecord[] => 
        state.records.filter(record => record.studentId === studentId);
    },
    
    getAttendanceByDate: (state) => {
      // obtener asistencias por fecha
      return (date: string): AttendanceRecord[] => 
        state.records.filter(record => record.Fecha === date);
    },
    
    getRecordsByDate: (state) => {
      // obtener registros por fecha
      return (date: string): AttendanceRecord[] => 
        state.records.filter(record => record.Fecha === date);
    },
    
    getRecordsByDateAndClass: (state) => {
      // obtener registros por fecha y clase
      return (date: string, className: string): AttendanceRecord[] => 
        state.records.filter(record => 
          record.Fecha === date && record.classId === className
        );
    },
    
    getDatesWithRecords: (state): string[] => {
      // Obtener fechas únicas de los registros
      return [...new Set(state.records.map(record => record.Fecha))];
    },
    
    getStudentStatus: (state) => {
      // Obtener el estado de asistencia de un estudiante
      return (studentId: string, date: string, className: string): AttendanceStatus => {
        // Buscar primero en la estructura de documento actual
        if (state.currentAttendanceDoc && 
            state.currentAttendanceDoc.fecha === date && 
            state.currentAttendanceDoc.classId === className) {
          
          // Verificar si tiene justificación
          const hasJustification = state.currentAttendanceDoc.data.justificacion?.some(j => j.id === studentId);
          if (hasJustification) {
            return 'Justificado';
          }
          if (state.currentAttendanceDoc.data.presentes.includes(studentId)) {
            return 'Presente';
          }
          if (state.currentAttendanceDoc.data.ausentes.includes(studentId)) {
            return 'Ausente';
          }
          if (state.currentAttendanceDoc.data.tarde.includes(studentId)) {
            return 'Tardanza';
          }
          // Si no está en ninguna lista, considerarlo ausente por defecto
          return 'Ausente';
        }
        // Buscar en el registro antiguo como respaldo
        const record = state.records.find(r => 
          r.studentId === studentId && 
          r.Fecha === date && 
          r.classId === className
        );
        return record?.status || 'Ausente';
      }
    },
    classWithRecords: (state) => {
      // Obtener clases con registros de asistencia
      return (className: string): AttendanceRecord[] => {
        return state.records.filter(record => record.classId === className);
      }
    },

    // Check if a student has a justification
    hasJustification: (state) => {
      return (studentId: string): boolean => {
    if (!state.currentAttendanceDoc) return false;
    
    return state.currentAttendanceDoc.data.justificacion?.some(
      j => j.id === studentId
    ) || false;
  }
},

// Get justification for a student
getJustification: (state) => {
  return (studentId: string) => {
    if (!state.currentAttendanceDoc) return null;
    
    return state.currentAttendanceDoc.data.justificacion?.find(
      j => j.id === studentId
    ) || null;
  }
},
    
    getObservations: (state): string => {
      // Get observations for current class date
      if (state.currentAttendanceDoc && state.currentAttendanceDoc.data && state.currentAttendanceDoc.data.observations) {
        return state.currentAttendanceDoc.data.observations;
      }
      return state.observations || '';
    },

    // IMPORTANT: Move getStudentAttendanceRate from actions to getters
    // This fixes the 'set on proxy' error
    getStudentAttendanceRate: (state) => {
      return (studentId: string, classId?: string, startDate?: string, endDate?: string): number => {
        try {
          // Filter records by student
          let records = state.records.filter(record => record.studentId === studentId);
          
          // Filter by class if specified
          if (classId) {
            records = records.filter(record => record.classId === classId);
          }
          
          // Further filter by date range if provided
          if (startDate && endDate) {
            records = records.filter(record => {
              const recordDate = record.Fecha;
              return recordDate >= startDate && recordDate <= endDate;
            });
          }
          
          // No records means no attendance
          if (records.length === 0) return 0;
          
          // Count present days (including late arrivals and justified absences)
          const presentDays = records.filter(record => 
            record.status === 'Presente' || 
            record.status === 'Tardanza' || 
            record.status === 'Justificado'
          ).length;
          
          // Calculate percentage
          return Math.round((presentDays / records.length) * 100);
        } catch (error) {
          console.error('Error calculating student attendance rate:', error);
          return 0;
        }
      }
    },
    
    // Add a getter to safely access activeStudents array
    getActiveStudents: (state) => {
      return state.activeStudents || [];
    },
  },
  
  actions: {

    // Basic setters
    setSelectedClass(classId: string): void {
      this.selectedClass = classId;
    },

    setSelectedDate(date: string): void {
      this.selectedDate = date;
    },
     async loadAttendanceDataForCalendar(teacherId: string) {
       this.isLoading = true;
       this.error = null;
       try {
        //  console.log('⏳ Loading attendance data for calendar...');
         // Ensure attendance documents are loaded
         const data = await getAllAttendanceDocumentsFirebase(teacherId);
        //  iterar y obtener un array de fechas
          const dates = data.map(doc => doc.fecha);
          // filtrar fechas únicas
          const uniqueDates = [...new Set(dates)];
          // filtrar fechas válidas
          const validDates = uniqueDates.filter(date => {
            const parsedDate = parseISO(date);
            return isValid(parsedDate) && parsedDate <= new Date(); // Solo fechas pasadas o presentes
          });
          // mostrar en consola resultado
          // Guardar fechas en el estado
          this.datesWithRecords = validDates;
          // Guardar en localStorage (solo desarrollo)
          if (process.env.NODE_ENV === 'development') {
            saveToLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS, validDates);
          }
          // Devolver fechas válidas
       } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.error = `Error loading data for calendar: ${errorMessage}`;
          console.error('Error loading data for calendar:', error);
          throw error; // Re-throw
        } finally {
         this.isLoading = false;
       }
     },

    /**
     * Fetch attendance documents from Firebase or local storage cache
     * 
     * @returns Promise resolving to array of AttendanceDocument objects
     */
    async fetchAttendanceDocuments(): Promise<AttendanceDocument[]> {
      this.isLoading = true;
      this.error = null;
      try {
        console.log('📂 Iniciando fetchAttendanceDocuments()');
        
        // FORZAR CARGA DESDE FIREBASE - IGNORAR CACHÉ
        const documents = await getAttendancesFirebase() as any;
        
        console.log(`📊 Documentos obtenidos: ${documents?.length || 0}`);
        if (documents && documents.length > 0) {
          console.log('📄 Muestra primer documento:', {
        fecha: documents[0].fecha || documents[0].Fecha || documents[0].date,
        classId: documents[0].classId,
        estructura: Object.keys(documents[0])
      });
        }
        
        // Asegurar que tenemos un array válido
        this.attendanceDocuments = Array.isArray(documents) ? documents : [];
        
        // Initialize active students list
        try {
          this.initActiveStudents();
        } catch (e) {
          console.error('Error inicializando estudiantes activos:', e);
        }
        
        return this.attendanceDocuments;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.error = `Error al cargar los documentos de asistencia: ${errorMessage}`;
        console.error('❌ Error al obtener documentos de asistencia:', error);
        
        // Devolver un array vacío en lugar de lanzar error
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Initialize active students array from attendance records
     * Collects unique student IDs from all attendance documents
     */
    initActiveStudents(): void {
      // Set of unique student IDs that have attendance records
      const activeStudentIds = new Set<string>();
      
      // Add student IDs from attendance documents
      this.attendanceDocuments.forEach(doc => {
        if (doc.data) {
          // Add all present students
          if (Array.isArray(doc.data.presentes)) {
            doc.data.presentes.forEach(studentId => activeStudentIds.add(studentId));
          }
          
          // Add all absent students
          if (Array.isArray(doc.data.ausentes)) {
            doc.data.ausentes.forEach(studentId => activeStudentIds.add(studentId));
          }
          
          // Add all late students
          if (Array.isArray(doc.data.tarde)) {
            doc.data.tarde.forEach(studentId => activeStudentIds.add(studentId));
          }
          
          // Add all justified students
          if (Array.isArray(doc.data.justificacion)) {
            doc.data.justificacion.forEach(justification => {
              if (justification && justification.id) {
                activeStudentIds.add(justification.id);
              }
            });
          }
        }
      });
      
      // Add student IDs from older record format
      this.records.forEach(record => {
        if (record.studentId) {
          activeStudentIds.add(record.studentId);
        }
      });
      
      // Convert set to array and update state
      this.activeStudents = Array.from(activeStudentIds);
    },

    /**
     * Fetch a specific attendance document by date and class
     * 
     * @param fecha - Date string in YYYY-MM-DD format
     * @param classId - Class identifier
     * @returns The attendance document or null if not found
     */
    async fetchAttendanceDocument(fecha: string, classId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        // Check if document is already in local state
        let document = this.attendanceDocuments.find(
          doc => doc.fecha === fecha && doc.classId === classId
        );
        
        // If not found locally, fetch from Firebase
        if (!document) {
          const result = await getAttendanceDocumentFirebase(fecha, classId);
          document = result || undefined;
        }
        
        if (document) {
          // Update current document and populate attendance records for UI
          this.currentAttendanceDoc = document;
          this._updateAttendanceRecordsFromDocument(document);
          return document;
        }
        
        // Create an empty document if none exists
        this.currentAttendanceDoc = {
          fecha,
          classId,
          teacherId: useAuthStore().user?.uid || '',
          data: {
            presentes: [],
            ausentes: [],
            tarde: [],
            justificacion: [],
            observations: ''
          }
        };
        
        this.attendanceRecords = {};
        return null;
      } catch (error) {
        this.error = 'Error al cargar el documento de asistencia';
        console.error('Error al obtener documento de asistencia:', error);
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Helper method to update attendance records from a document
     * Centralizes the logic for consistent state updates
     * 
     * @param document - The attendance document to process
     */
    _updateAttendanceRecordsFromDocument(document: AttendanceDocument) {
      this.attendanceRecords = {};
      
      // Process justifications first (they take precedence)
      if (document.data.justificacion && Array.isArray(document.data.justificacion)) {
        document.data.justificacion.forEach(justification => {
          if (justification && justification.id) {
            this.attendanceRecords[justification.id] = 'Justificado';
          }
        });
      }
      
      // Then process other statuses
      document.data.presentes.forEach(studentId => {
        if (!this.attendanceRecords[studentId]) {
          this.attendanceRecords[studentId] = 'Presente';
        }
      });
      
      document.data.ausentes.forEach(studentId => {
        if (!this.attendanceRecords[studentId]) {
          this.attendanceRecords[studentId] = 'Ausente';
        }
      });
      
      document.data.tarde.forEach(studentId => {
        const hasJustification = document.data.justificacion?.some(j => j.id === studentId);
        if (!this.attendanceRecords[studentId]) {
          this.attendanceRecords[studentId] = hasJustification ? 'Justificado' : 'Tardanza';
        }
      });
    },

    /**
     * Save attendance document to Firebase and update local state
     * 
     * @param document - The document to save
     * @returns The saved document
     */
    async saveAttendanceDocument(document: AttendanceDocument) {
      // Get and assign current teacher ID
      const currentTeacherId = useAuthStore().user?.uid;
      document.teacherId = currentTeacherId || '';
      
      this.isLoading = true;
      this.error = null;
      
      try {
        // Clean up obsolete justifications
        this._cleanJustifications(document);
        
        // Save to Firebase via service layer
        await saveAttendanceDocumentFirebase(document);
        
        // Update local state
        this.currentAttendanceDoc = document;
        this._updateAttendanceRecordsFromDocument(document);
        
        // Update document collection
        this._updateAttendanceDocumentsArray(document);
        
        // Clear cache in development mode
        if (process.env.NODE_ENV === 'development') {
          clearLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS);
        }
        
        return document;
      } catch (error) {
        this.error = 'Error al guardar el documento de asistencia';
        console.error('Error al guardar documento de asistencia:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Helper method to clean up invalid justifications in an attendance document
     * 
     * @param document - The document to clean
     */
    _cleanJustifications(document: AttendanceDocument) {
      if (document.data.justificacion && document.data.justificacion.length > 0) {
        document.data.justificacion = document.data.justificacion.filter(justificacion => {
          // Only keep justifications for students who are both:
          // 1. In the tarde list AND
          // 2. Have Justificado status in attendanceRecords
          const isInTarde = document.data.tarde.includes(justificacion.id);
          const isJustificado = this.attendanceRecords[justificacion.id] === 'Justificado';
          
          return isInTarde && isJustificado;
        });
      }
    },

    /**
     * Helper method to update the attendanceDocuments array with a document
     * Adds new or updates existing document
     * 
     * @param document - The document to update or add
     */
    _updateAttendanceDocumentsArray(document: AttendanceDocument) {
      const index = this.attendanceDocuments.findIndex(
        doc => doc.fecha === document.fecha && doc.classId === document.classId
      );
      
      if (index !== -1) {
        this.attendanceDocuments[index] = document;
      } else {
        this.attendanceDocuments.push(document);
      }
    },

    /**
     * Add a justification to an attendance record
     * 
     * @param studentId - Student identifier
     * @param date - Date string in YYYY-MM-DD format
     * @param classId - Class identifier
     * @param reason - Justification reason
     * @param file - Optional file attachment
     * @returns Promise resolving to boolean success indicator
     */
    async addJustificationToAttendance(
      studentId: string,
      date: string,
      classId: string,
      reason: string,
      file: File | null
    ) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const justification = { id: studentId, reason };
        
        // Save to Firebase via service layer
        await addJustificationToAttendanceFirebase(date, classId, justification, file);
        
        // Update local state immediately for responsive UI
        this.attendanceRecords[studentId] = 'Justificado';
        
        // Update current document if it matches
        if (this.currentAttendanceDoc &&
            this.currentAttendanceDoc.fecha === date &&
            this.currentAttendanceDoc.classId === classId) {
          
          // Ensure student is in the tarde list
          if (!this.currentAttendanceDoc.data.tarde.includes(studentId)) {
            this.currentAttendanceDoc.data.tarde.push(studentId);
          }
          
          // Remove from other lists
          this.currentAttendanceDoc.data.ausentes = 
            this.currentAttendanceDoc.data.ausentes.filter(id => id !== studentId);
          
          this.currentAttendanceDoc.data.presentes = 
            this.currentAttendanceDoc.data.presentes.filter(id => id !== studentId);
          
          // Add or update justification
          if (!this.currentAttendanceDoc.data.justificacion) {
            this.currentAttendanceDoc.data.justificacion = [];
          }
          
          const existingJustIndex = this.currentAttendanceDoc.data.justificacion.findIndex(j => j.id === studentId);
          if (existingJustIndex !== -1) {
            this.currentAttendanceDoc.data.justificacion[existingJustIndex].reason = reason;
          } else {
            this.currentAttendanceDoc.data.justificacion.push(justification);
          }
          
          // Update documents array
          this._updateAttendanceDocumentsArray(this.currentAttendanceDoc);
        }
        
        // Clear cache
        if (process.env.NODE_ENV === 'development') {
          clearLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS);
        }
        
        return true;
      } catch (error) {
        this.error = 'Error al añadir justificación';
        console.error('Error al añadir justificación:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Add a class observation to history
     * 
     * @param classId - Class identifier
     * @param date - Date string in YYYY-MM-DD format
     * @param text - Observation text
     * @param author - Author name or identifier
     */
    async addObservationToHistory(classId: string, date: string, text: string, author: string): Promise<void> {
      if (!text.trim()) return;
      
      try {
        // Use service function instead of direct Firebase calls
        await addObservationToHistoryFirebase(classId, date, text, author);
        
        // Update current document if it exists
        if (this.currentAttendanceDoc && 
            this.currentAttendanceDoc.fecha === date &&
            this.currentAttendanceDoc.classId === classId) {
          
          this.currentAttendanceDoc.data.observations = text;
          await this.saveAttendanceDocument(this.currentAttendanceDoc);
        }
      } catch (error) {
        console.error('Error adding observation to history:', error);
        throw error;
      }
    },
    
    /**
     * Update an existing observation
     * 
     * @param observationId - Observation document ID
     * @param text - Updated observation text
     */
    async updateObservationInHistory(observationId: string, text: string): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
        // Use service function instead of direct Firebase calls
        await updateObservationInHistoryFirebase(observationId, text);
        
        // Reflect the change in current attendance document if relevant
        if (this.currentAttendanceDoc) {
          this.currentAttendanceDoc.data.observations = text;
          await this.saveAttendanceDocument(this.currentAttendanceDoc);
        }
      } catch (error) {
        console.error('Error updating observation in history:', error);
        this.error = 'Error al actualizar observación';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Get observations history for a class, optionally filtered by date
     * 
     * @param classId - Class identifier
     * @param specificDate - Optional date filter
     * @returns Promise resolving to array of observation objects
     */
    async getObservationsHistory(classId: string, specificDate?: string): Promise<any[]> {
      try {
        // Use service function instead of direct Firebase calls
        return await getObservationsHistoryFirebase(classId, specificDate);
      } catch (error) {
        console.error('Error getting observations history:', error);
        return [];
      }
    },

    // Cargar registros de asistencia desde Firebase
    async fetchItems(options: FetchItemsOptions = {}): Promise<AttendanceRecord[]> {
      this.isLoading = true;
      this.error = null;
      try {
        // If refresh requested or no records loaded, fetch records first
        if (options.refresh || this.records.length === 0) {
          await this.fetchAttendance();
        }
        
        // If we need documents by date range, fetch them
        if (options.startDate && options.endDate) {
          await this.fetchAttendanceByDateRange(options.startDate, options.endDate);
        }
        // If we need a specific date and class, fetch that document
        else if (options.date && options.classId) {
          await this.fetchAttendanceByClassAndDate(options.classId, options.date);
        }
        
        // Filter records based on provided options
        let filteredRecords = this.records;
        
        if (options.classId) {
          filteredRecords = filteredRecords.filter(record => record.classId === options.classId);
        }
        
        if (options.studentId) {
          filteredRecords = filteredRecords.filter(record => record.studentId === options.studentId);
        }
        
        if (options.date) {
          filteredRecords = filteredRecords.filter(record => record.Fecha === options.date);
        }
        
        if (options.startDate && !options.endDate) {
          const startDate = options.startDate; // Capture in a local variable to satisfy TypeScript
          filteredRecords = filteredRecords.filter(record => record.Fecha >= startDate);
        }
        
        if (options.endDate && !options.startDate) {
          const endDate = options.endDate; // Capture in a local variable to satisfy TypeScript
          filteredRecords = filteredRecords.filter(record => record.Fecha <= endDate);
        }
        
        if (options.status) {
          filteredRecords = filteredRecords.filter(record => record.status === options.status);
        }
        
        return filteredRecords;
      } catch (error) {
        this.error = 'Error al obtener los registros de asistencia';
        console.error('Error fetching attendance items:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    async fetchAttendance() {
      this.isLoading = true
      this.error = null
      try {
        // Mover la lógica de caché desde services/attendance.ts
        // Si estamos en desarrollo, intentar obtener de localStorage primero
        // if (process.env.NODE_ENV === 'development') {
          const cachedAttendance = getFromLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE);
          if (cachedAttendance) {
            this.records = cachedAttendance;
            return cachedAttendance;
          }
        // }
        
        // Si no hay caché o estamos en producción, obtener de Firestore
        const attendances = await getAttendancesFirebase();
        
        // Guardar en localStorage si estamos en desarrollo
        // if (process.env.NODE_ENV === 'development') {
          saveToLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE, attendances);
        // }
        
        this.records = attendances;
        
        // Initialize active students list from records
        if (attendances && attendances.length > 0) {
          const studentIds = new Set(attendances.map(record => record.studentId));
          this.activeStudents = Array.from(studentIds);
        }
        
        return attendances;
      } catch (error) {
        this.error = 'Error al cargar las asistencias'
        console.error('Error al obtener registros de asistencia:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchAttendanceByClassAndDate(className: string, Fecha: string) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // console.log(`🔍 Buscando registros de asistencia para clase ${className} en fecha ${Fecha}`);
        
        // Limpiar los registros anteriores
        this.attendanceRecords = {};
        
        // Cargar el documento de asistencia primero
        await this.fetchAttendanceDocument(Fecha, className);
        
        // Si no encontramos un documento, intentar obtener registros individuales (sistema antiguo)
        if (!this.currentAttendanceDoc) {
          const records = await getAttendanceByDateAndClassFirebase(Fecha, className);
          
          if (records && records.length > 0) {
            records.forEach((record: AttendanceRecord) => {
              this.attendanceRecords[record.studentId] = record.status;
            });
          }
        }
        
        // Verificar si la fecha es futura
        const isFutureDate = !this.validateAttendanceDate(Fecha);
        if (isFutureDate) {
          console.warn(`⚠️ ${Fecha} es una fecha futura. No se permite registro de asistencia.`);
        }
        
        return this.attendanceRecords;
      } catch (error) {
        this.error = 'Error al cargar registros de asistencia';
        console.error('❌ Error:', error);
        return {};
      } finally {
        this.isLoading = false;
      }
    },

    async saveAttendance(record: AttendanceRecord) {
      this.isLoading = true
      try {
        // console.log('📝 Verificando registro de asistencia:', JSON.stringify(record, null, 2));
        
        // Sanitizar datos
        const sanitizedRecord = {
          ...record,
          justification: record.justification || undefined
        };

        // Primero buscar si existe un documento para esta fecha y clase
        const existingDoc = await this.fetchAttendanceDocument(record.Fecha, record.classId);
        
        if (existingDoc) {
          // Si existe el documento, actualizar según el nuevo estado
          if (existingDoc.data) {
            // Quitar el estudiante de todas las listas primero
            existingDoc.data.presentes = existingDoc.data.presentes.filter(id => id !== record.studentId);
            existingDoc.data.ausentes = existingDoc.data.ausentes.filter(id => id !== record.studentId);
            existingDoc.data.tarde = existingDoc.data.tarde.filter(id => id !== record.studentId);
            
            // Añadirlo a la lista correspondiente
            switch (record.status) {
              case 'Presente':
                existingDoc.data.presentes.push(record.studentId);
                break;
              case 'Ausente':
                existingDoc.data.ausentes.push(record.studentId);
                break;
              case 'Tardanza':
                existingDoc.data.tarde.push(record.studentId);
                break;
              case 'Justificado':
                existingDoc.data.tarde.push(record.studentId);
                
                
                // Añadir justificación si es necesario
                if (record.justification) {
                  const justIndex = existingDoc.data.justificacion?.findIndex(j => j.id === record.studentId);
                  
                  if (justIndex !== -1 && existingDoc.data.justificacion) {
                    // Check if justification is an object or string before accessing properties
                    if (typeof record.justification === 'object' && record.justification !== null) {
                      existingDoc.data.justificacion[justIndex].reason = record.justification.reason || '';
                    } else if (typeof record.justification === 'string') {
                      existingDoc.data.justificacion[justIndex].reason = record.justification;
                    }
                    if (record.documentUrl) {
                      existingDoc.data.justificacion[justIndex].documentURL = record.documentUrl;
                    }
                  } else {
                    if (!existingDoc.data.justificacion) {
                      existingDoc.data.justificacion = [];
                    }
                    existingDoc.data.justificacion.push({
                      id: record.studentId,
                      reason: typeof record.justification === 'string' ? record.justification : (record.justification?.reason || ''),
                      documentURL: record.documentUrl
                    });
                  }
                }
                break;
            }
            
            // Guardar el documento actualizado
            await this.saveAttendanceDocument(existingDoc);
          }
        } else {
          // Si no existe, crear un nuevo documento
          const newDoc: AttendanceDocument = {
            fecha: record.Fecha,
            classId: record.classId,
            teacherId: useAuthStore().user?.uid || '',
            data: {
              presentes: [],
              ausentes: [],
              tarde: [],
              justificacion: [],
              observations: ''
            }
          };
          
          // Añadir el estudiante a la lista correspondiente
          switch (record.status) {
            case 'Presente':
              newDoc.data.presentes.push(record.studentId);
              break;
            case 'Ausente':
              newDoc.data.ausentes.push(record.studentId);
              break;
            case 'Tardanza':
              newDoc.data.tarde.push(record.studentId);
              break;
            case 'Justificado':
              newDoc.data.tarde.push(record.studentId);
              
              // Añadir justificación si es necesario
              if (record.justification) {
                newDoc.data.justificacion.push({
                  id: record.studentId,
                  reason: typeof record.justification === 'string' ? record.justification : record.justification?.reason || '',
                  documentURL: record.documentUrl
                });
              }
              break;
          }
          
          // Guardar el nuevo documento
          await this.saveAttendanceDocument(newDoc);
        }
        
        // Actualizar también el almacenamiento antiguo para compatibilidad
        const existingRecords = await getAttendanceByDateAndClassFirebase(record.Fecha, record.classId);
        const existingRecord = existingRecords.find(r => r.studentId === record.studentId);

        let recordId;
        
        if (existingRecord) {
          // Si existe, actualizar el registro
          // console.log('🔄 Encontrado registro existente, actualizando...');
          recordId = await updateAttendanceFirebase(sanitizedRecord);
        } else {
          // Si no existe, crear nuevo registro
          // console.log('➕ No se encontró registro existente, creando nuevo...');
          recordId = await registerAttendanceFirebase(sanitizedRecord);
        }
        
        // Limpiar caché si estamos en desarrollo
        if (process.env.NODE_ENV === 'development') {
          clearLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE);
          clearLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS);
        }
        
        // console.log('✅ Registro guardado exitosamente');
        await this.fetchAttendance(); // Recargar datos
        return recordId;
      } catch (error) {
        this.error = 'Error al guardar la asistencia'
        console.error(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateAnalytics() {
      try {
        // Inicializar objeto de analíticas
        const analytics: AttendanceAnalytics = {
          totalClasses: 0,
          totalStudents: 0,
          averageAttendance: 0,
          absentStudents: [],
          byClass: {}
        };
        
        // Asegurarse de que los datos estén cargados
        if (this.attendanceDocuments.length === 0) {
          await this.fetchAttendanceDocuments();
        }
        
        if (this.records.length === 0) {
          await this.fetchAttendance();
        }
        
        // Obtener clases únicas de los documentos
        const classesSet = new Set<string>();
        const studentsSet = new Set<string>();
        
        // Obtener el store de clases para acceder a la información de las clases
        const classesStore = useClassesStore();
        
        // Crear un mapa de ID a nombre de clase
        const classNameMap = new Map<string, string>();
        
        // Si no hay clases cargadas en el store, cargarlas
        if (!classesStore.classes.length) {
          await classesStore.fetchClasses();
        }
        
        // Crear el mapa de ID a nombre de clase
        classesStore.classes.forEach(classItem => {
          classNameMap.set(classItem.id, classItem.name);
        });
        
        // IMPORTANTE: Verificar que cada elemento en attendanceDocuments sea realmente un documento
        // y no un registro individual
        this.attendanceDocuments = this.attendanceDocuments.filter(doc => {
          // Un documento válido debe tener classId, fecha, y data con arrays
          return doc && doc.classId && doc.fecha && doc.data &&
                 (Array.isArray(doc.data.presentes) || 
                  Array.isArray(doc.data.ausentes) || 
                  Array.isArray(doc.data.tarde));
        });
        
        // Primero analizar datos de la nueva estructura de documentos
        this.attendanceDocuments.forEach(doc => {
          if (!doc || !doc.classId || !doc.data) {
            console.warn('Documento de asistencia inválido o incompleto:', doc);
            return; // Skip this document
          }
          
          // Añadir la clase a las clases únicas
          classesSet.add(doc.classId);
          
          // Obtener el nombre de la clase (o usar el ID si no se encuentra)
          const className = classNameMap.get(doc.classId) || doc.classId;
          
          // Inicializar analytics para esta clase si no existe
          if (!analytics.byClass[className]) {
            analytics.byClass[className] = {
              present: 0,
              absent: 0,
              delayed: 0,
              justified: 0,
              total: 0
            };
          }
          
          // Garantizar que todas las propiedades existan
          const presentes = doc.data.presentes || [];
          const ausentes = doc.data.ausentes || [];
          const tarde = doc.data.tarde || [];
          const justificacion = doc.data.justificacion || [];
          
          // Procesar presentes
          presentes.forEach(studentId => {
            if (!studentId) return;
            studentsSet.add(studentId);
            analytics.byClass[className].present++;
            analytics.byClass[className].total++;
          });
          
          // Procesar ausentes
          ausentes.forEach(studentId => {
            if (!studentId) return;
            studentsSet.add(studentId);
            analytics.byClass[className].absent++;
            analytics.byClass[className].total++;
          });
          
          // Procesar tarde y justificados
          tarde.forEach(studentId => {
            if (!studentId) return;
            studentsSet.add(studentId);
            
            // Verificar si tiene justificación
            const isJustified = justificacion.some(j => j && j.id === studentId);
            
            if (isJustified) {
              analytics.byClass[className].justified++;
            } else {
              analytics.byClass[className].delayed++;
            }
            
            analytics.byClass[className].total++;
          });
        });
        
        // Procesar registros antiguos que no están presentes en la nueva estructura
        const processedClasses = new Set<string>();
        const processedStudents = new Map<string, Set<string>>();
        
      }catch (error) {
        this.error = 'Error al actualizar analíticas de asistencia';
        console.error('Error al actualizar analíticas:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
      },

// Fetch attendance records for multiple classes, students, or both
async fetchRecordsForMultipleEntities({ 
  classIds = [], 
  studentIds = [], 
  startDate, 
  endDate, 
  refresh = false 
}: { 
  classIds?: string[]; 
  studentIds?: string[]; 
  startDate: string; 
  endDate?: string; 
  refresh?: boolean 
}): Promise<AttendanceRecord[]> {
  this.isLoading = true;
  this.error = null;
  
  try {
    // If refresh requested or no records loaded, fetch records first
    if (refresh || this.records.length === 0) {
      await this.fetchAttendance();
    }
    
    // If we need documents by date range, fetch them
    if (startDate && endDate) {
      await this.fetchAttendanceByDateRange(startDate, endDate);
    }
    
    // Filter records based on provided parameters
    let filteredRecords = this.records;
    
    // Filter by date range
    if (startDate) {
      filteredRecords = filteredRecords.filter(record => record.Fecha >= startDate);
    }
    
    if (endDate) {
      filteredRecords = filteredRecords.filter(record => record.Fecha <= endDate);
    }
    
    // Filter by multiple class IDs if provided
    if (classIds.length > 0) {
      filteredRecords = filteredRecords.filter(record => classIds.includes(record.classId));
    }
    
    // Filter by multiple student IDs if provided
    if (studentIds.length > 0) {
      filteredRecords = filteredRecords.filter(record => studentIds.includes(record.studentId));
    }
    
    // Ensure we have all necessary attendance documents for these records
    const uniqueCombinations = new Set<string>();
    filteredRecords.forEach(record => {
      uniqueCombinations.add(`${record.Fecha}_${record.classId}`);
    });
    
    // Fetch any missing attendance documents
    const fetchPromises = Array.from(uniqueCombinations).map(async combo => {
      const [fecha, classId] = combo.split('_');
      if (!this.attendanceDocuments.some(doc => doc.fecha === fecha && doc.classId === classId)) {
        await this.fetchAttendanceDocument(fecha, classId);
      }
    });
    
    await Promise.all(fetchPromises);
    
    return filteredRecords;
  } catch (error) {
    this.error = 'Error al obtener los registros de asistencia para múltiples entidades';
    console.error('Error fetching attendance records for multiple entities:', error);
    throw error;
  } finally {
    this.isLoading = false;
  }
},

    // Método para calcular los estudiantes con más ausencias
    calculateAbsentStudents(limit: number = 10) {
      const absencesMap: Record<string, { 
        absences: number, 
        lastAttendance: string, 
        attendanceRate: number, 
        totalAttendance: number 
      }> = {};
      
      // Filtrar documentos inválidos antes de procesar
      const validDocuments = this.attendanceDocuments.filter(doc => {
        return doc && doc.classId && doc.fecha && doc.data &&
               (Array.isArray(doc.data.presentes) || 
                Array.isArray(doc.data.ausentes) || 
                Array.isArray(doc.data.tarde));
      });
      
      // Primero analizar los documentos nuevos
      validDocuments.forEach(doc => {
        // Verificar que el documento tenga la estructura de datos esperada
        if (!doc || !doc.data) {
          return; // Skip this document
        }
        
        // Asegurarnos de que todas las propiedades necesarias existan
        const ausentes = doc.data.ausentes || [];
        const presentes = doc.data.presentes || [];
        const tarde = doc.data.tarde || [];
        
        // Procesar ausentes
        ausentes.forEach(studentId => {
          if (!studentId) return; // Ignorar IDs inválidos
          
          if (!absencesMap[studentId]) {
            absencesMap[studentId] = {
              absences: 0,
              lastAttendance: doc.fecha,
              attendanceRate: 0,
              totalAttendance: 0
            };
          }
          
          absencesMap[studentId].absences++;
          absencesMap[studentId].totalAttendance++;
          
          // Actualizar última fecha solo si es más reciente
          if (doc.fecha > absencesMap[studentId].lastAttendance) {
            absencesMap[studentId].lastAttendance = doc.fecha;
          }
        });
        
        // Procesar presentes y tarde para contabilidad total
        [...presentes, ...tarde].forEach(studentId => {
          if (!studentId) return; // Ignorar IDs inválidos
          
          if (!absencesMap[studentId]) {
            absencesMap[studentId] = {
              absences: 0,
              lastAttendance: doc.fecha,
              attendanceRate: 0,
              totalAttendance: 0
            };
          }
          
          absencesMap[studentId].totalAttendance++;
          
          // Actualizar última fecha solo si es más reciente
          if (doc.fecha > absencesMap[studentId].lastAttendance) {
            absencesMap[studentId].lastAttendance = doc.fecha;
          }
        });
      });
      
      // Calcular tasas de asistencia
      Object.entries(absencesMap).forEach(([studentId, data]) => {
        if (data.totalAttendance > 0) {
          data.attendanceRate = ((data.totalAttendance - data.absences) / data.totalAttendance) * 100;
        }
      });
      
      // Ordenar por cantidad de ausencias y limitar
      return Object.entries(absencesMap)
        .sort(([, a], [, b]) => b.absences - a.absences)
        .slice(0, limit)
        .map(([studentId, data]) => ({
          studentId,
          absences: data.absences,
          lastAttendance: data.lastAttendance,
          attendanceRate: data.attendanceRate
        }));
    },

    // Método directo para validar fechas (alternativa al getter)
    validateAttendanceDate(Fecha: string): boolean {
      if (!Fecha || typeof Fecha !== 'string') {
        console.error('Formato de fecha inválido:', Fecha);
        return false;
      }
      
      // Convertir la fecha a un objeto Date
      const parsedDate = parseISO(Fecha);
      
      // Verificar si la fecha es válida usando isValid from date-fns
      if (!isValid(parsedDate)) {
        // console.error('Fecha inválida:', Fecha);
        return false;
      }
      
      // Comparar con la fecha actual
      const today = format(new Date(), 'yyyy-MM-dd');
      const dateIsValid = Fecha <= today;
      
      if (!dateIsValid) {
        console.warn(`La fecha ${Fecha} es posterior a hoy (${today})`);
      }
      
      return dateIsValid;
    },

    /**
     * Generates an attendance report based on provided criteria.
     * @param params - Report parameters including date range, optional classId, optional studentId.
     * @returns A structured report object or throws an error.
     */
    async generateReport(params: { 
      classId?: string; 
      studentId?: string; 
      startDate: string; 
      endDate: string; 
    }): Promise<any> { // Consider defining a specific Report interface later
      this.isLoading = true;
      this.error = null;
      
      try {
      const { classId, studentId, startDate, endDate } = params;
      
      // 1. Fetch relevant attendance data & related info
      // Ensure attendance documents are loaded. A more robust implementation 
      // might fetch specifically for the date range if data isn't guaranteed locally.
      if (this.attendanceDocuments.length === 0) {
        await this.fetchAttendanceDocuments(); 
      }
      
      // Fetch class details for names
      const classesStore = useClassesStore();
      if (!classesStore.classes.length) {
        await classesStore.fetchClasses();
      }
      const classNameMap = new Map(classesStore.classes.map(c => [c.id, c.name]));

      // Placeholder for student names - requires integrating useStudentsStore
      // const studentsStore = useStudentsStore(); 
      // if (!studentsStore.students.length) { 
      //   await studentsStore.fetchStudents(); 
      // }
      // const studentNameMap = new Map(studentsStore.students.map(s => [s.id, s.name]));

      // 2. Filter documents based on parameters
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      if (!isValid(start) || !isValid(end)) {
        throw new Error('Invalid start or end date provided for the report.');
      }

      const filteredDocs = this.attendanceDocuments.filter(doc => {
        const docDate = parseISO(doc.fecha);
        if (!isValid(docDate)) return false; // Skip invalid document dates
        
        const isWithinDateRange = docDate >= start && docDate <= end;
        const matchesClass = !classId || doc.classId === classId;
        
        return isWithinDateRange && matchesClass;
      });

      // 3. Process filtered data to build the report details
      const reportDetails: Array<{ 
        date: string; 
        studentId: string; 
        studentName?: string; // Placeholder
        classId: string; 
        className?: string; 
        status: AttendanceStatus; 
        justification?: string 
      }> = [];
      
      let presentCount = 0;
      let absentCount = 0;
      let tardyCount = 0; // Non-justified tardiness
      let justifiedCount = 0; // Justified tardiness counts as attended but tracked separately
      const uniqueClassDays = new Set<string>(); // Track unique class instances within the scope

      filteredDocs.forEach(doc => {
         uniqueClassDays.add(`${doc.fecha}-${doc.classId}`); // Count each class held on a specific day
         const className = classNameMap.get(doc.classId) || doc.classId;

         // Helper to process each student status within the document
         const processStudent = (sId: string, status: AttendanceStatus, justification?: { reason?: string }) => {
         // Filter by studentId if provided
         if (!studentId || sId === studentId) {
          // Replace placeholder when student store is available
          // const studentName = studentNameMap.get(sId) || `Unknown (${sId.substring(0,5)})`; 
          const studentName = `Student (${sId.substring(0, 5)}...)`; // Placeholder name

          reportDetails.push({
            date: doc.fecha,
            studentId: sId,
            studentName: studentName, 
            classId: doc.classId,
            className: className,
            status: status,
            justification: justification?.reason
          });

          // Increment summary counts
          switch (status) {
            case 'Presente': presentCount++; break;
            case 'Ausente': absentCount++; break;
            case 'Tardanza': tardyCount++; break; // Non-justified
            case 'Justificado': justifiedCount++; break; // Justified
          }
         }
         };

         // Iterate through student lists in the document data
         doc.data.presentes?.forEach(sId => processStudent(sId, 'Presente'));
         doc.data.ausentes?.forEach(sId => processStudent(sId, 'Ausente'));
         doc.data.tarde?.forEach(sId => {
         const just = doc.data.justificacion?.find(j => j.id === sId);
         if (just) {
           processStudent(sId, 'Justificado', just); // Process as Justified
         } else {
           processStudent(sId, 'Tardanza'); // Process as Tardy (non-justified)
         }
         });
      });

      // 4. Calculate summary statistics
      const totalRecordsProcessed = reportDetails.length; // Total entries matching criteria
      // Attendance rate considers Presente + Justificado as attended for rate calculation
      const attendedCount = presentCount + justifiedCount; 
      // Avoid division by zero if no relevant records found
      const attendanceRate = totalRecordsProcessed > 0 ? (attendedCount / totalRecordsProcessed) * 100 : 0;

      // 5. Structure the final report object
      const report = {
        parameters: { 
        startDate, 
        endDate, 
        classId: classId || 'All', 
        className: classId ? (classNameMap.get(classId) || classId) : 'All Classes',
        studentId: studentId || 'All',
        // studentName: studentId ? studentNameMap.get(studentId) : 'All Students' // Add when available
        },
        summary: {
        totalClassInstancesInScope: uniqueClassDays.size, // Number of unique class sessions in the date range/filter
        totalAttendanceRecords: totalRecordsProcessed, // Total individual student records in the report
        presentCount: presentCount,
        absentCount: absentCount,
        tardyCount: tardyCount, // Non-justified tardiness
        justifiedTardyCount: justifiedCount, // Justified tardiness
        overallAttendanceRate: parseFloat(attendanceRate.toFixed(2)), // Percentage
        },
        // Sort details for readability
        details: reportDetails.sort((a, b) => { 
         if (a.date !== b.date) return a.date.localeCompare(b.date);
         if (a.className !== b.className) return (a.className || '').localeCompare(b.className || '');
         return (a.studentName || '').localeCompare(b.studentName || '');
        }),
      };

      // console.log('Generated Report:', report);
      return report;

      } catch (error) {
      console.error('Error generating attendance report:', error);
      this.error = `Failed to generate report: ${error instanceof Error ? error.message : String(error)}`;
      throw error; // Re-throw the error for the calling component to handle
      } finally {
      this.isLoading = false;
      }
    },
    
   
    /**
     * Fetch attendance records within a specific date range.
     * 
     * @param startDate - Start date in 'YYYY-MM-DD' format
     * @param endDate - End date in 'YYYY-MM-DD' format
     * @returns Array of AttendanceRecord objects
     */
    async fetchAttendanceByDateRange(startDate: string, endDate: string) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // Use service layer to fetch data - centralize Firebase interactions
        const records = await fetchAttendanceByDateRangeFirebase(startDate, endDate);
        
        // Update the records in the store
        this.records = records;
        
        // Reconstruct attendance documents from records to maintain consistency
        // between the two data sources
        const documentMap = new Map<string, AttendanceDocument>();
        
        // Group by date and class to rebuild attendance documents
        records.forEach(record => {
          const key = `${record.Fecha}_${record.classId}`;
          
          // Create a new document if this combination doesn't exist yet
          if (!documentMap.has(key)) {
            documentMap.set(key, {
              fecha: record.Fecha,
              classId: record.classId,
              teacherId: useAuthStore().user?.uid || '',
              data: {
                presentes: [],
                ausentes: [],
                tarde: [],
                justificacion: [],
                observations: ''
              }
            });
          }
          
          const doc = documentMap.get(key)!;
          
          // Add student to the appropriate list based on attendance status
          switch (record.status) {
            case 'Presente':
              if (!doc.data.presentes.includes(record.studentId)) {
                doc.data.presentes.push(record.studentId);
              }
              break;
            case 'Ausente':
              if (!doc.data.ausentes.includes(record.studentId)) {
                doc.data.ausentes.push(record.studentId);
              }
              break;
            case 'Tardanza':
              if (!doc.data.tarde.includes(record.studentId)) {
                doc.data.tarde.push(record.studentId);
              }
              break;
            case 'Justificado':
              if (!doc.data.tarde.includes(record.studentId)) {
                doc.data.tarde.push(record.studentId);
              }
              
              // Add justification if it exists
              if (record.justification) {
                doc.data.justificacion.push({
                  id: record.studentId,
                  reason: typeof record.justification === 'string' ? 
                    record.justification : 
                    record.justification.reason || ''
                });
              }
              break;
          }
        });
        
        // Update attendance documents
        this.attendanceDocuments = Array.from(documentMap.values());
        
        return records;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.error = `Error al cargar los datos de asistencia: ${errorMessage}`;
        console.error('Error al obtener asistencias por rango de fechas:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Add a new method to get attendance status directly
    async getStudentAttendanceStatus(studentId: string, date: string, classId?: string): Promise<string> {
      try {
        // First check if we already have this data in our store
        if (this.records.length > 0) {
          const existing = this.records.find(r => 
            r.studentId === studentId && 
            r.Fecha === date && 
            (!classId || r.classId === classId)
          );
          
          if (existing) {
            return existing.status;
          }
        }
        
        // Otherwise fetch from Firebase
        return await getAttendanceStatusFirebase(studentId, date, classId);
      } catch (error) {
        console.error('Error getting student attendance status:', error);
        return 'Ausente'; // Default fallback
      }
    },
    // Método para obtener registros de asistencia por clase y fecha
    async fetchAttendanceRecords(params: FetchAttendanceRecordsParams | string): Promise<Record<string, AttendanceStatus>> {
      this.isLoading = true;
      this.error = null;
      try {
        // Si recibimos solo un string (forma antigua de llamar a la función), manejarlo como formato 'yyyy-MM'
        if (typeof params === 'string') {
          // console.log('fetchAttendanceRecords recibido como string:', params);
          // Si solo tenemos un string 'yyyy-MM', convertirlo a objeto de parámetros
          return this.fetchAttendanceRecords({
            classId: this.selectedClass || 'all',
            startDate: `${params}-01`, // Añadir día 01 para formar una fecha válida
            endDate: new Date()
          });
        }
        
        // Manejo de objeto params
        const { classId, startDate } = params;
        
        // Si no tenemos classId, utilizar el classId seleccionado actualmente o 'all'
        const effectiveClassId = classId || this.selectedClass || 'all';
        
        // Si startDate es undefined o nulo, usar la fecha actual
        if (!startDate) {
          console.warn('startDate es undefined, usando fecha actual');
          const today = new Date();
          const formattedDate = format(today, 'yyyy-MM-dd');
          await this.fetchAttendanceByClassAndDate(effectiveClassId, formattedDate);
          return this.attendanceRecords;
        }

        // Si startDate es un string, necesitamos procesarlo
        if (typeof startDate === 'string') {
          let parsedDate;
          
          // Detectar si es formato 'yyyy-MM' o 'yyyy-MM-dd'
          if (startDate.match(/^\d{4}-\d{2}$/)) {
            // Formato año-mes, añadir día 01
            parsedDate = parseISO(`${startDate}-01`);
          } else {
            // Asumir que es formato completo yyyy-MM-dd
            parsedDate = parseISO(startDate);
          }
          
          if (!isValid(parsedDate)) {
            throw new Error(`Formato de fecha inválido: ${startDate}`);
          }
          
          const formattedDate = format(parsedDate, 'yyyy-MM-dd');
          await this.fetchAttendanceByClassAndDate(effectiveClassId, formattedDate);
          return this.attendanceRecords;
        } 
        // Si startDate es un objeto Date
        if (startDate instanceof Date) {
          if (!isValid(startDate)) {
            throw new Error(`Objeto de fecha inválido: ${startDate}`);
          }
          
          const formattedDate = format(startDate, 'yyyy-MM-dd');
          await this.fetchAttendanceByClassAndDate(effectiveClassId, formattedDate);
          return this.attendanceRecords;
        }
        
        throw new Error(`Tipo de fecha no soportado: ${typeof startDate}`);
        
      } catch (error) {
        this.error = 'Error al cargar los registros de asistencia';
        console.error('Error loading attendance records:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    // Método para obtener la asistencia de un estudiante en una fecha específica
    async generateProfessionalReport (params: {
      classId?: string;
      studentId?: string;
      startDate: string;
      endDate: string;
    }): Promise<any> {
      this.isLoading = true;
      this.error = null;
      try {
        const { classId, studentId, startDate, endDate } = params;
        
        // Validar fechas
        if (!isValid(parseISO(startDate)) || (endDate && !isValid(parseISO(endDate)))) {
          throw new Error('Fechas inválidas proporcionadas para el reporte.');
        }
        
        // Obtener registros de asistencia filtrados por clase y fecha
        const records = await this.fetchAttendanceRecords({ classId, startDate, endDate });
        
        // Procesar los registros para generar el reporte
        const reportData = records.map(record => ({
          studentId: record.studentId,
          status: record.status,
          date: record.Fecha,
          classId: record.classId,
          justification: record.justification || ''
        }));
        
        return reportData;
      } catch (error) {
        this.error = 'Error al generar el reporte profesional';
        console.error('Error generating professional report:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Fetch all observations from the database
     * 
     * @returns Promise resolving to array of ClassObservation objects
     */
    async fetchObservations() {
      this.isLoading = true;
      this.error = null;
      try {
        // Get all observations via service layer
        const observations = await getAllObservationsFirebase();
        
        // Update local state
        this.observationsHistory = observations;
        
        return observations;
      } catch (error) {
        this.error = 'Error al cargar observaciones';
        console.error('Error al cargar observaciones:', error);
        return [];
      } finally {
        this.isLoading = false;
      }
    },

        /**
     * Gets attendance records for a specific class and date
     * @param date - Date string in YYYY-MM-DD format
     * @param classId - Class identifier
     * @returns Array of attendance records
     */
    async getAttendanceByDateAndClass(date: string, classId: string): Promise<AttendanceRecord[]> {
      try {
        // First check if we already have this document in our store
        const existingDoc = this.attendanceDocuments.find(
          doc => doc.fecha === date && doc.classId === classId
        );
        
        if (existingDoc) {
          // Convert document structure to array of attendance records
          const records: AttendanceRecord[] = [];
          
          // Process students present
          existingDoc.data.presentes.forEach(studentId => {
            records.push({
              studentId,
              classId,
              Fecha: date,
              status: 'Presente'
            });
          });
          
          // Process students absent
          existingDoc.data.ausentes.forEach(studentId => {
            records.push({
              studentId,
              classId,
              Fecha: date,
              status: 'Ausente'
            });
          });
          
          // Process students late
          existingDoc.data.tarde.forEach(studentId => {
            const isJustified = existingDoc.data.justificacion?.some(j => j.id === studentId);
            records.push({
              studentId,
              classId,
              Fecha: date,
              status: isJustified ? 'Justificado' : 'Tardanza'
            });
          });
          
          return records;
        }
        
        // If not found in store, fetch from Firebase
        return await getAttendanceByDateAndClassFirebase(date, classId);
      } catch (error) {
        console.error('Error getting attendance by date and class:', error);
        return [];
      }
    },

    // Nueva acción para obtener las ausencias de los estudiantes en un rango de fechas
async getStudentAbsencesByDateRange(startDate: string, endDate: string, classId?: string, limit: number = 15) {
  try {
    // Get all attendance records within this date range if not already loaded
    if (!this.lastFetch || this.records.length === 0) {
      await this.fetchAttendanceByDateRange(startDate, endDate);
    }
    
    // Track absences per student
    const studentAbsences: Record<string, number> = {};
    const studentLastAttendance: Record<string, string> = {};
    
    // Filter records to the requested date range
    const filteredRecords = this.records.filter(record => {
      const recordDate = record.Fecha;
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    // Go through all the records and count absences
    for (const record of filteredRecords) {
      // Skip if we're filtering by classId and this record is for a different class
      if (classId && record.classId !== classId) continue;
      
      const { studentId, Fecha: date, status } = record;
      
      // Initialize student tracking if not exists
      if (!studentAbsences[studentId]) {
        studentAbsences[studentId] = 0;
        studentLastAttendance[studentId] = date;
      }
      
      // Count absences
      if (status === 'Ausente') {
        studentAbsences[studentId]++;
      } else {
        // Update last attendance date if this is a present record and newer
        if ((status === 'Presente' || status === 'Tardanza' || status === 'Justificado') && 
            date > studentLastAttendance[studentId]) {
          studentLastAttendance[studentId] = date;
        }
      }
    }
    
    // Update active students list - ensure it's an array even if empty
    this.activeStudents = this.activeStudents || [];
    this.activeStudents = Object.keys(studentAbsences);
    
    // Convert to array and sort by absences (descending)
    const result: StudentAbsenceRecord[] = Object.keys(studentAbsences).map(studentId => ({
      studentId,
      absences: studentAbsences[studentId],
      lastAttendance: studentLastAttendance[studentId] || startDate
    }));
    
    // Sort by number of absences (most first)
    result.sort((a, b) => b.absences - a.absences);
    
    // Return limited number of results
    return result.slice(0, limit);
  } catch (error) {
    console.error('Error getting student absences by date range:', error);
    this.activeStudents = this.activeStudents || []; // Ensure it's never undefined
    throw error;
  }
},

    // REMOVE THIS FUNCTION FROM ACTIONS - It's now in getters
    /* 
    getStudentAttendanceRate(studentId: string, classId?: string, startDate?: string, endDate?: string): number {
      // This version should be removed - it's now in getters
    }
    */
  }
});

function eachDayOfInterval(arg0: { start: Date; end: Date }) {
  throw new Error('Function not implemented.')
}

