// src/stores/attendance.ts
import { defineStore } from 'pinia'
import { format, parseISO, isValid, isWithinInterval } from 'date-fns'
import { db } from '../../../firebase'
import { useClassesStore } from '../../Classes/store/classes'
import { useAuthStore } from '../../../stores/auth'
import { 
  // fetchAttendanceRecords, 
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
  getAttendanceByDateAndClassFirebase,
  updateObservationsFirebase, // Add import for updateObservationsFirebase
  registerAttendanceFirebase, // Import the new Firebase service function
  updateAttendanceFirebase, // Import the new Firebase service function
  fetchAttendanceByDateFirebase // Import the new Firebase service function
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
  justification?: string | {reason: string};
  documentUrl?: string;
}

// Define the attendance document type
interface AttendanceDocument {
  id?: string;
  fecha: string; // Date in YYYY-MM-DD format
  classId: string;
  teacherId: string;
  data: {
    presentes: string[];
    ausentes: string[];
    tarde: string[];
    justificacion: Array<{id: string; reason: string; documentURL?: string}>;
    observations: string;
  };
}

// Attendance statistics type
interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  justified: number;
  total: number;
}

// Define additional types used throughout the store
type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | string;

interface AttendanceAnalytics {
  totalClasses: number;
  totalStudents: number;
  averageAttendance: number;
  absentStudents: any[]; 
  byClass: Record<string, {
    present: number;
    absent: number;
    delayed: number;
    justified: number;
    total: number;
  }>;
}

interface ClassObservation {
  id?: string;
  classId: string;
  date: string;
  text: string;
  author: string;
  createdAt?: any;
}

interface FetchAttendanceRecordsParams {
  classId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
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

    // Add cache indicators 
    ,lastFetch: null as Date | null,
    lastFetchParams: null as any | null,
    cacheExpiryMinutes: 10, // Cache expires after 10 minutes
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
    /**
     * Returns the days of the week when a class is scheduled
     * @param classId - The ID of the class to check
     * @returns Array of day numbers (0-6, where 0 = Sunday)
     */
    getClassScheduleDays: (state) => (classId: string): number[] => {
      // If no classId provided, return empty array
      if (!classId) return [];
      
      // Find the class in the classes store
      const classesStore = useClassesStore();
      const classData = classesStore.classes.find(c => c.id === classId);
      
      // If class not found or no schedule, return empty array
      if (!classData || !classData.schedule || !classData.schedule.slots) {
        return [];
      }
      
      // Extract day numbers from the schedule
      const days = classData.schedule.slots.map(slot => {
        // Handle both numeric days and string days
        if (typeof slot.day === 'number') {
          return slot.day;
        } else if (typeof slot.day === 'string') {
          // Convert day name to number (0 = Sunday, 1 = Monday, etc.)
          const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
          return dayNames.findIndex(d => d.toLowerCase() === slot.day.toLowerCase());
        }
        return -1;
      }).filter(day => day >= 0);
      
      return days;
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
        // Buscar primero en la estructura de documento currentAttendanceDoc
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
        // Asegurar que siempre devuelve un string
        const observations = state.currentAttendanceDoc.data.observations;
        return typeof observations === 'string' ? observations : '';
      }
      // Asegurar que siempre devuelve un string cuando usa observations del state
      return typeof state.observations === 'string' ? state.observations : '';
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
    isCacheValid: (state) => {
      if (!state.lastFetch) return false;
      const now = new Date();
      const diffMs = now.getTime() - state.lastFetch.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins < state.cacheExpiryMinutes;
    }
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
          const errorMessage = error instanceof Error ? error.message : (error ? error.toString() : 'Unknown error');
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
          // Guardar en localStorage si estamos en desarrollo
          if (process.env.NODE_ENV === 'development') {
            saveToLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS, documents);
          }
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
        const errorMessage = error instanceof Error ? error.message : (error ? error.toString() : 'Unknown error');
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
        // Log antes de guardar para verificación
        console.log('Guardando documento con los siguientes datos:', {
          fecha: document.fecha,
          classId: document.classId,
          presentes: document.data.presentes.length,
          ausentes: document.data.ausentes.length,
          tarde: document.data.tarde.length,
          justificacion: document.data.justificacion?.length || 0
        });

        // Asegurar que no eliminamos estudiantes por error
        const totalEstudiantes = (
          (document.data.presentes?.length || 0) +
          (document.data.ausentes?.length || 0) +
          (document.data.tarde?.length || 0)
        );

        if (totalEstudiantes === 0) {
          console.warn('⚠️ Advertencia: Se intenta guardar un documento sin estudiantes!');
        }
        
        // Clean up obsolete justifications
        this._cleanJustifications(document);
        
        // Asegurar que todos los campos del documento estén inicializados correctamente
        // Firebase rechaza valores undefined
        if (!document.data.presentes) document.data.presentes = [];
        if (!document.data.ausentes) document.data.ausentes = [];
        if (!document.data.tarde) document.data.tarde = [];
        if (!document.data.justificacion) document.data.justificacion = [];
        
        // Inicializar otros campos que pueden ser undefined
        if (!document.teacherId) document.teacherId = '';
        if (!document.observations) document.observations = '';
        if (!document.data.observations) document.data.observations = '';
        
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

    _cleanJustifications(document: AttendanceDocument) {
      if (document.data.justificacion && document.data.justificacion.length > 0) {
        document.data.justificacion = document.data.justificacion.filter(justificacion => {
          // Solo mantener justificaciones para estudiantes que:
          // 1. Están en la lista 'ausentes' (esto es lo correcto)
          // 2. Tienen estado 'Justificado' en attendanceRecords
          const isInAusentes = document.data.ausentes.includes(justificacion.id);
          const isJustificado = this.attendanceRecords[justificacion.id] === 'Justificado';
          
          return isInAusentes && isJustificado;
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
     * @param text - Observation text or object with formatted text
     * @param author - Author name or identifier
     */
    async addObservationToHistory(classId: string, date: string, text: string | any, author: string): Promise<void> {
      // Manejar tanto texto como objetos
      let textToSave: string;
      
      if (typeof text === 'string') {
        textToSave = text;
      } else if (text && typeof text === 'object') {
        // Si es un objeto, intentar extraer el texto formateado
        textToSave = text.formattedText || text.text || JSON.stringify(text);
      } else {
        console.warn('Se recibió un tipo de dato no válido para la observación');
        return;
      }
      
      // Verificar que tenemos texto para guardar
      if (!textToSave || !textToSave.trim()) {
        console.warn('No hay texto válido para guardar como observación');
        return;
      }
      
      try {
        console.log('Guardando observación:', { classId, date, textToSave, author });
        // Use service function instead of direct Firebase calls
        await addObservationToHistoryFirebase(classId, date, textToSave, author);
        
        // Update current document if it exists
        if (this.currentAttendanceDoc && 
            this.currentAttendanceDoc.fecha === date &&
            this.currentAttendanceDoc.classId === classId) {
          
          this.currentAttendanceDoc.data.observations = textToSave;
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
          // Update the observations in the current attendance document if it needs to change
          this.currentAttendanceDoc.data.observations = text;
        }
      } catch (error) {
        console.error('Error al actualizar observaciones:', error);
        this.error = 'Error al actualizar las observaciones';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Update the observations for a specific class and date
     * 
     * @param classId - The class ID
     * @param date - The date in YYYY-MM-DD format
     * @param observations - The observations text
     * @returns Promise that resolves when observations have been updated
     */
    async updateObservations(classId: string, date: string, observations: string): Promise<void> {
      this.isLoading = true;
      this.error = null;
      
      try {
        // Call the Firebase service to update observations
        await updateObservationsFirebase(date, classId, observations);
        
        // If we have the current attendance document loaded and it matches this class/date
        // update it in local state as well
        if (this.currentAttendanceDoc && 
            this.currentAttendanceDoc.classId === classId && 
            this.currentAttendanceDoc.fecha === date) {
          this.currentAttendanceDoc.data.observations = observations;
        }
      } catch (error) {
        console.error('Error actualizando observaciones:', error);
        this.error = 'Error al actualizar las observaciones';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetch attendance records for a specific class and date
     * 
     * @param classId - The class ID to fetch records for
     * @param date - The date to fetch records for in format 'YYYY-MM-DD'
     * @returns Promise with the attendance records
     */
    async fetchAttendanceByClassAndDate(classId: string, date: string): Promise<Record<string, string>> {
      this.isLoading = true;
      this.error = null;
      
      try {
        // First get the attendance document directly
        const document = await getAttendanceDocumentFirebase(date, classId);
        
        if (document) {
          // Document exists, update our local state with it
          this.currentAttendanceDoc = document;
          this._updateAttendanceRecordsFromDocument(document);
          return this.attendanceRecords;
        }
        
        // If no document was found, initialize empty records
        this.attendanceRecords = {};
        return this.attendanceRecords;
      } catch (error) {
        console.error('Error fetching attendance by class and date:', error);
        this.error = 'Error al cargar los datos de asistencia';
        return {};
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Get observations history for a specific class, optionally filtered by date
     * 
     * @param classId - Optional class identifier, if not provided returns all observations
     * @param date - Optional date filter in YYYY-MM-DD format
     * @returns Observations history
     */
    async getObservationsHistory(classId?: string, date?: string) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // Use the service function to get observations history
        const observations = await getObservationsHistoryFirebase(classId, date);
        
        // Store the observations in the store for access elsewhere
        this.observationsHistory = observations;
        
        return observations;
      } catch (error) {
        console.error('Error getting observations history:', error);
        this.error = 'Error al cargar las observaciones';
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Validates if a date is valid for attendance registration (not in the future)
     * @param date The date to validate in YYYY-MM-DD format
     * @returns Boolean indicating if the date is valid for attendance
     */
    validateAttendanceDate(date: string): boolean {
      if (!date || typeof date !== 'string') {
        console.error('Formato de fecha inválido:', date);
        return false;
      }
      
      // Convert to a Date object
      const parsedDate = parseISO(date);
      
      // Check if date is valid using isValid from date-fns
      if (!isValid(parsedDate)) {
        return false;
      }
      
      // Compare with current date
      const today = format(new Date(), 'yyyy-MM-dd');
      const dateIsValid = date <= today;
      
      if (!dateIsValid) {
        console.warn(`La fecha ${date} es posterior a hoy (${today})`);
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
      this.error = `Failed to generate report: ${error instanceof Error ? error.message : (error ? error.toString() : 'Unknown error')}`;
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
        const errorMessage = error instanceof Error ? error.message : (error ? error.toString() : 'Unknown error');
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
        
        // Filtrar por studentId si se proporciona
        const filteredRecords = studentId 
          ? records.filter(record => record.studentId === studentId)
          : records;
        
        // Procesar los registros para generar el reporte
        const reportData = filteredRecords.map((record: AttendanceRecord) => {
          // Ensure proper type handling for justification
          let justificationText = '';
          
          if (record.justification) {
            justificationText = typeof record.justification === 'string' 
              ? record.justification 
              : (record.justification.reason || '');
          }
          
          return {
            studentId: record.studentId,
            status: record.status,
            date: record.Fecha,
            classId: record.classId,
            justification: justificationText
          };
        });
        
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
     * @param date - Date string in YYYY-MM-DD or YYYYMMDD format
     * @param classId - Class identifier
     * @returns Array of attendance records
     */
    async getAttendanceByDateAndClass(date: string, classId: string): Promise<AttendanceRecord[]> {
      try {
        // Normalizar formato de fecha
        let formattedDate = date;
        const dateRegexCompact = /^\d{8}$/;
        if (dateRegexCompact.test(date)) {
          // Convertir de YYYYMMDD a YYYY-MM-DD
          formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
        }
        
        // First check if we already have this document in our store
        const existingDoc = this.attendanceDocuments.find(
          doc => doc.fecha === formattedDate && doc.classId === classId
        );
        
        if (existingDoc) {
          // Convert document structure to array of attendance records
          const records: AttendanceRecord[] = [];
            // Process students present
          existingDoc.data.presentes.forEach(studentId => {
            records.push({
              studentId,
              classId,
              Fecha: formattedDate,
              status: 'Presente'
            });
          });
          
          // Process students absent
          existingDoc.data.ausentes.forEach(studentId => {
            records.push({
              studentId,
              classId,
              Fecha: formattedDate,
              status: 'Ausente'
            });
          });
          
          // Process students late
          existingDoc.data.tarde.forEach(studentId => {
            const isJustified = existingDoc.data.justificacion?.some(j => j.id === studentId);
            records.push({
              studentId,
              classId,
              Fecha: formattedDate,
              status: isJustified ? 'Justificado' : 'Tardanza'
            });
          });
          
          return records;
        }
          // If not found in store, fetch from Firebase
        return await getAttendanceByDateAndClassFirebase(formattedDate, classId);
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
},    // REMOVE THIS FUNCTION FROM ACTIONS - It's now in getters
    /* 
    getStudentAttendanceRate(studentId: string, classId?: string, startDate?: string, endDate?: string): number {
      // This version should be removed - it's now in getters
    }
    */
    
    /**
     * Obtiene documentos de asistencia para una fecha específica
     * 
     * @param date - Fecha en formato 'yyyy-MM-dd'
     * @returns Promise que resuelve a un array de documentos de asistencia
     */
    async fetchAttendanceByDate(date: string) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // Obtener documentos de asistencia solo para la fecha específica
        const documents = await fetchAttendanceByDateFirebase(date);
        
        // Actualizar solo los documentos para esta fecha específica
        // Mantendremos los documentos existentes para otras fechas
        const existingDocs = this.attendanceDocuments.filter(doc => doc.fecha !== date);
        this.attendanceDocuments = [...existingDocs, ...documents];
        
        // Actualizar la variable attendanceDocs para que esté disponible en los componentes
        const attendanceDocs = documents;
        
        return attendanceDocs;
      } catch (error) {
        console.error('Error obteniendo asistencia por fecha:', error);
        this.error = 'Error al obtener registros de asistencia para esta fecha';
        return [];      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Updates the attendance analytics metrics
     * This analyzes attendance records and calculates statistics
     * @returns Promise that resolves when analytics have been updated
     */
    async updateAnalytics(): Promise<void> {
      try {
        this.isLoading = true;
        
        if (!this.attendanceDocuments || this.attendanceDocuments.length === 0) {
          await this.fetchAttendanceDocuments();
        }
        
        // Calculate basic stats
        const totalClasses = this.attendanceDocuments.length;
        const uniqueStudents = new Set();
        let totalPresentCount = 0;
        
        // Per-class analytics
        const byClass: Record<string, {
          present: number;
          absent: number;
          delayed: number;
          justified: number;
          total: number;
        }> = {};
        
        // Calculate absences by student
        const absencesByStudent: Record<string, number> = {};
        const lastAttendanceByStudent: Record<string, string> = {};
        
        // Process attendance documents to build analytics
        for (const doc of this.attendanceDocuments) {
          if (!doc.data) continue;
          
          // Initialize class stats if not exists
          if (!byClass[doc.classId]) {
            byClass[doc.classId] = {
              present: 0,
              absent: 0,
              delayed: 0,
              justified: 0,
              total: 0
            };
          }
          
          // Count present students
          const presentCount = doc.data.presentes?.length || 0;
          byClass[doc.classId].present += presentCount;
          byClass[doc.classId].total += presentCount;
          totalPresentCount += presentCount;
          
          // Add to unique students
          doc.data.presentes?.forEach(id => uniqueStudents.add(id));
          
          // Count late students
          const lateCount = (doc.data.tarde?.length || 0);
          byClass[doc.classId].delayed += lateCount;
          byClass[doc.classId].total += lateCount;
          
          // Add to unique students
          doc.data.tarde?.forEach(id => uniqueStudents.add(id));
          
          // Track justified students
          const justifiedStudentIds = new Set(
            (doc.data.justificacion || []).map(j => j.id)
          );
          
          // Count absent students (including justified)
          const absentCount = doc.data.ausentes?.length || 0;
          byClass[doc.classId].absent += absentCount;
          byClass[doc.classId].total += absentCount;
          
          // Track justified count separately
          const justifiedCount = doc.data.ausentes?.filter(id => justifiedStudentIds.has(id)).length || 0;
          byClass[doc.classId].justified += justifiedCount;
          
          // Add to unique students
          doc.data.ausentes?.forEach(id => {
            uniqueStudents.add(id);
            
            // Track absences by student
            absencesByStudent[id] = (absencesByStudent[id] || 0) + 1;
            
            // Track last attendance date
            if (!lastAttendanceByStudent[id] || doc.fecha > lastAttendanceByStudent[id]) {
              lastAttendanceByStudent[id] = doc.fecha;
            }
          });
        }
        
        // Calculate top absent students
        const absentStudents = Object.entries(absencesByStudent)
          .map(([studentId, absences]) => ({
            studentId,
            absences,
            lastAttendance: lastAttendanceByStudent[studentId] || ''
          }))
          .sort((a, b) => b.absences - a.absences)
          .slice(0, 10); // Top 10 absent students
        
        // Calculate average attendance
        const totalStudents = uniqueStudents.size;
        const averageAttendance = totalStudents > 0 
          ? Math.round((totalPresentCount / (totalClasses * totalStudents)) * 100) 
          : 0;
        
        // Set analytics in store
        this.analytics = {
          totalClasses,
          totalStudents,
          averageAttendance,
          absentStudents,
          byClass
        };
        
        console.log('Analytics updated:', this.analytics);
      } catch (error) {
        console.error('Error updating analytics:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    }  }
});

