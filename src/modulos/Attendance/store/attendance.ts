// src/stores/attendance.ts
import { defineStore } from 'pinia'
import { format, parseISO, isValid } from 'date-fns'
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  getFirestore, 
  addDoc,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { useClassesStore } from '../../Classes/store/classes'
import { useAuthStore } from '../../../stores/auth'

import type { 
  AttendanceRecord, 
  AttendanceStatus, 
  AttendanceAnalytics, 
  AttendanceDocument, 
  ClassObservation
} from '../types/attendance'
import { 
  normalizeDate, 
  validateAttendanceDate, 
  calculateAbsentStudents, 
  generateAttendanceReport,
  cleanData,
  analyzeWeeklyAbsences,
  convertDocumentsToRecords
} from '../utils/attendanceAnalytics'

// Interface for fetching attendance records
interface FetchAttendanceRecordsParams {
  classId?: string;
  startDate?: string | Date;
  endDate?: Date;
}
import { dayName } from '../utils/dateUtils' 
import { 
  getAttendancesFirebase, 
  getAttendanceByDateAndClassFirebase, 
  updateAttendanceFirebase, 
  // getAttendanceReport,
  registerAttendanceFirebase,
  getAttendanceDocumentFirebase,
  saveAttendanceDocumentFirebase,
  addJustificationToAttendanceFirebase,
  // updateObservationsFirebase,
  getAttendanceStatusFirebase,
  fetchAttendanceByDateRangeFirebase,
  addClassObservationFirebase,
  getClassObservationsHistoryFirebase,
  getClassObservationsByDateFirebase
} from '../service/attendance'
// import { useStudentsStore } from '../../Students/store/students'
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../../../utils/localStorageUtils'

// Constantes
const ATTENDANCE_COLLECTION = 'ASISTENCIAS';
const OBSERVATIONS_COLLECTION = 'OBSERVACIONES';
const LOCAL_STORAGE_KEYS = {
  ATTENDANCE: 'attendance',
  ATTENDANCE_DOCUMENTS: 'attendance_documents'
};

// Interfaces
interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
}

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

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    records: [] as AttendanceRecord[],
    attendanceDocuments: [] as AttendanceDocument[],
    selectedDate: format(new Date(), 'yyyy-MM-dd'),
    selectedClass: '',
    currentAttendanceDoc: null as AttendanceDocument | null,
    isLoading: false,
    error: null as string | null,
    analytics: null as AttendanceAnalytics | null,
    attendanceRecords: {} as Record<string, AttendanceStatus>,
    levelOptions: ['Básico', 'Intermedio', 'Avanzado'],
    cachedJustifications: {} as Record<string, {
      reason: string,
      file: File | null,
      documentUrl?: string
    }>,
    observations: '' as string,
    datesWithRecords: [] as string[],
    observationsHistory: [] as ClassObservation[] // Nuevo campo para el historial de observaciones
  }),
  
  getters: {
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

    getStudentAttendanceRate: (state) => {
      // Calcular el porcentaje de asistencia de un estudiante en una clase
      return (studentId: string, className: string): number => {
        const studentRecords = state.records.filter(r => 
          r.studentId === studentId && r.classId === className
        );
        
        if (!studentRecords.length) return 0;
        
        const presentCount = studentRecords.filter(r => 
          r.status === 'Presente' || r.status === 'Justificado'
        ).length;

        return (presentCount / studentRecords.length) * 100;
      }
    },

    getMostAbsentStudents: (state) => {
      // Obtener los estudiantes más ausentes
      return (limit: number = 5) => {
        const absences = state.records.reduce((acc, record) => {
          if (record.status === 'Ausente') {
            if (!acc[record.studentId]) {
              acc[record.studentId] = {
                absences: 0,
                lastAttendance: record.Fecha,
                attendanceRate: 0
              };
            }
            acc[record.studentId].absences++;
            if (record.Fecha > acc[record.studentId].lastAttendance) {
              acc[record.studentId].lastAttendance = record.Fecha;
            }
          }
          return acc;
        }, {} as Record<string, { absences: number, lastAttendance: string, attendanceRate: number }>);

        // Calculate attendance rates
        Object.entries(absences).forEach(([studentId, data]) => {
          const totalRecords = state.records.filter(r => r.studentId === studentId).length;
          data.attendanceRate = ((totalRecords - data.absences) / totalRecords) * 100;
        });

        return Object.entries(absences)
          .sort(([, a], [, b]) => b.absences - a.absences)
          .slice(0, limit)
          .map(([studentId, data]) => ({
            studentId,
            ...data
          }));
      }
    },

    getClassScheduleDays: () => {
      // Obtener días de la semana para una clase
      return (className: string): string[] => {
        const classesStore = useClassesStore();
        const classData = classesStore.classes.find(c => c.name === className || c.id === className);
        
        if (!classData?.studentIds?.length) {
          return [];
        }

        if (!classData.schedule) {
          return [];
        }

        if (typeof classData.schedule === 'string') {
          const schedule = String(classData.schedule).toLowerCase();
          const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
          return days.filter(day => schedule.includes(day));
        } else if (classData.schedule && typeof classData.schedule === 'object' && classData.schedule.slots) {
          return classData.schedule.slots
            .filter(slot => slot.day && classData.studentIds && classData.studentIds.length > 0)
            .map(slot => slot.day);
        }
        return [];
      }
    },

    getScheduledDatesForClass: () => {
      // Obtener fechas programadas para una clase
      return (className: string, startDate: string, endDate: string): Date[] => {
        const scheduledDays = useAttendanceStore().getClassScheduleDays(className);
        const dayNumbers = scheduledDays.map(day => DAY_MAP[day.toLowerCase() as keyof typeof DAY_MAP] || -1);
        
        // Filtramos días inválidos (-1)
        if (dayNumbers.some(d => d === -1)) {
          console.warn('Algunos días del horario no son válidos:', scheduledDays);
        }
        
        const validDayNumbers = dayNumbers.filter(d => d !== -1);
        
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        
        // Validación de fechas
        if (!isValid(start) || !isValid(end)) {
          console.error('Fechas de rango inválidas:', { startDate, endDate });
          return [];
        }

        const dateRange = eachDayOfInterval({ start, end });
        return dateRange.filter(date => validDayNumbers.includes(date.getDay()));
      }
    },
    
    isValidAttendanceDate: () => {
      // Reemplazar el getter con una versión mejorada
      return (date: string): boolean => {
        // Validar formato de fecha
        if (!date || typeof date !== 'string') return false;
        
        const parsedDate = parseISO(date);
        if (!isValid(parsedDate)) return false;
        
        // Obtener fecha actual en formato YYYY-MM-DD
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Si la fecha es posterior a hoy, no es válida
        return date <= today;
      }
    },

    getDatesWithRecordsArray: (state): string[] => {
      // Getter para obtener fechas con registros
      return state.datesWithRecords || [];
    },

    getFormattedDatesForCalendar: (state): string[] => {
      // Getter para formatear las fechas para el calendario de manera optimizada
      // Filtrar fechas inválidas y convertir a formato entendible por el calendario
      return state.datesWithRecords.filter(dateStr => {
        const parsedDate = parseISO(dateStr);
        return isValid(parsedDate);
      });
    },

        // Getter para obtener las clases con registros de asistencia
    classesWithRecords: (state): string[] => {
      // Crear un conjunto para almacenar IDs únicos de clases con registros
      const classIdsSet = new Set<string>();
      
      // Agregar clases desde los documentos de asistencia
      state.attendanceDocuments.forEach(doc => {
        if (doc.classId) {
          classIdsSet.add(doc.classId);
        }
      });
      
      // Agregar clases desde records antiguos (si existen)
      if (state.records && Array.isArray(state.records)) {
        state.records.forEach(record => {
          if (record.classId) {
            classIdsSet.add(record.classId);
          }
        });
      }
      
      return Array.from(classIdsSet);
    },
  },
  
  actions: {
    // Cargar registros de asistencia desde Firebase
    setSelectedClass(classId: string): void {
      this.selectedClass = classId;
    },

    setSelectedDate(date: string): void {
      this.selectedDate = date;
    },

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
    
    async fetchAttendanceDocuments(): Promise<AttendanceDocument[]> {
      // Cargar documentos de asistencia (nueva estructura)
      this.isLoading = true;
      this.error = null;
      try {
        // Si estamos en desarrollo, intentar obtener de localStorage primero
        if (process.env.NODE_ENV === 'development') {
          const cachedAttendance = getFromLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS);
          if (cachedAttendance) {
            this.attendanceDocuments = cachedAttendance;
            return cachedAttendance;
          }
        }
        
        // Si no hay caché o estamos en producción, obtener de Firestore
        const documents = await getAttendancesFirebase() as any;
        
        // Guardar en localStorage si estamos en desarrollo
        if (process.env.NODE_ENV === 'development') {
          saveToLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS, documents);
        }
        
        this.attendanceDocuments = documents;
        
        return documents;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.error = `Error al cargar los documentos de asistencia: ${errorMessage}`;
        console.error('Error al obtener documentos de asistencia:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Cargar un documento de asistencia específico
    async fetchAttendanceDocument(fecha: string, classId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        let document = this.attendanceDocuments.find(
          doc => doc.fecha === fecha && doc.classId === classId
        );
        
        if (!document) {
          const result = await getAttendanceDocumentFirebase(fecha, classId);
          document = result || undefined;
        }
        
        if (document) {
          this.currentAttendanceDoc = document;
          this.attendanceRecords = {};
          
          if (document.data.justificacion && Array.isArray(document.data.justificacion)) {
            document.data.justificacion.forEach(justification => {
              if (justification && justification.id) {
                this.attendanceRecords[justification.id] = 'Justificado';
              }
            });
          }
          
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
          
          this.observations = document.data.observations || '';
          return document;
        }
        
        this.currentAttendanceDoc = {
          fecha,
          classId,
          data: {
            presentes: [],
            ausentes: [],
            tarde: [],
            justificacion: [],
            observations: ''
          }
        };
        
        this.attendanceRecords = {};
        this.observations = '';
        return null;
      } catch (error) {
        this.error = 'Error al cargar el documento de asistencia';
        console.error('Error al obtener documento de asistencia:', error);
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    // Guardar un documento de asistencia completo
    async saveAttendanceDocument(document: AttendanceDocument) {
      this.isLoading = true;
      this.error = null;
      try {
        // Verificar y limpiar justificaciones obsoletas
        // Si un alumno no está en "tarde" o su estado ya no es "Justificado",
        // debemos eliminar su justificación
        if (document.data.justificacion && document.data.justificacion.length > 0) {
          document.data.justificacion = document.data.justificacion.filter(justificacion => {
            // Verificar si el estudiante sigue en la lista de tarde
            const isInTarde = document.data.tarde.includes(justificacion.id);
            
            // Verificar si el estado del estudiante sigue siendo "Justificado"
            const isJustificado = this.attendanceRecords[justificacion.id] === 'Justificado';
            
            // Solo mantener justificaciones de estudiantes que siguen en tarde Y tienen estado "Justificado"
            return isInTarde && isJustificado;
          });
        }
        
        await saveAttendanceDocumentFirebase(document);
        
        // Actualizar el documento actual
        this.currentAttendanceDoc = document;
        
        // Actualizar los registros para UI
        this.attendanceRecords = {};
        
        document.data.presentes.forEach(studentId => {
          this.attendanceRecords[studentId] = 'Presente';
        });
        
        document.data.ausentes.forEach(studentId => {
          this.attendanceRecords[studentId] = 'Ausente';
        });
        
        document.data.tarde.forEach(studentId => {
          // Verificar si tiene justificación
          const hasJustification = document.data.justificacion?.some(j => j.id === studentId);
          this.attendanceRecords[studentId] = hasJustification ? 'Justificado' : 'Tardanza';
        });
        
        // Añadir/actualizar en attendanceDocuments
        const index = this.attendanceDocuments.findIndex(
          doc => doc.fecha === document.fecha && doc.classId === document.classId
        );
        
        if (index !== -1) {
          this.attendanceDocuments[index] = document;
        } else {
          this.attendanceDocuments.push(document);
        }
        
        // Limpiar caché
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

    // Añadir una justificación a un documento
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
        
        await addJustificationToAttendanceFirebase(date, classId, justification, file);
        
        // Actualizar inmediatamente el registro local
        this.attendanceRecords[studentId] = 'Justificado';
        
        // Actualizar el documento actual si existe
        if (this.currentAttendanceDoc &&
            this.currentAttendanceDoc.fecha === date &&
            this.currentAttendanceDoc.classId === classId) {
          
          // Asegurar que el estudiante esté en la lista de tarde
          if (!this.currentAttendanceDoc.data.tarde.includes(studentId)) {
            this.currentAttendanceDoc.data.tarde.push(studentId);
          }
          
          // Quitar de ausentes si está ahí
          this.currentAttendanceDoc.data.ausentes = 
            this.currentAttendanceDoc.data.ausentes.filter(id => id !== studentId);
          
          // Quitar de presentes si está ahí
          this.currentAttendanceDoc.data.presentes = 
            this.currentAttendanceDoc.data.presentes.filter(id => id !== studentId);
          
          // Añadir o actualizar la justificación
          if (!this.currentAttendanceDoc.data.justificacion) {
            this.currentAttendanceDoc.data.justificacion = [];
          }
          
          const existingJustIndex = this.currentAttendanceDoc.data.justificacion.findIndex(j => j.id === studentId);
          if (existingJustIndex !== -1) {
            this.currentAttendanceDoc.data.justificacion[existingJustIndex].reason = reason;
          } else {
            this.currentAttendanceDoc.data.justificacion.push(justification);
          }
        }
        
        // Actualizar el documento en el array de documentos
        const docIndex = this.attendanceDocuments.findIndex(
          doc => doc.fecha === date && doc.classId === classId
        );
        
        if (docIndex !== -1 && this.currentAttendanceDoc) {
          this.attendanceDocuments[docIndex] = { ...this.currentAttendanceDoc };
        }
        
        // Limpiar caché
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

    // Guardar una nueva observación en el historial
    async addObservationToHistory(classId: string, date: string, text: string, author: string): Promise<void> {
      if (!text.trim()) return;
      
      try {
        const observationData = {
          text,
          createdAt: new Date().toISOString(),
          author,
          classId,
          date
        };
        
        // Add to the observations collection
        await addDoc(collection(db, OBSERVATIONS_COLLECTION), observationData);
        
        // Also update the current attendance document if it exists
        if (this.currentAttendanceDoc) {
          this.currentAttendanceDoc.data.observations = text;
          await this.saveAttendanceDocument(this.currentAttendanceDoc);
        }
      } catch (error) {
        console.error('Error adding observation to history:', error);
        throw error;
      }
    },

    async getObservationsHistory(classId: string, specificDate?: string): Promise<any[]> {
      try {
        let q;
        
        if (specificDate) {
          // Get observations for a specific class and date
          q = query(
            collection(db, OBSERVATIONS_COLLECTION),
            where('classId', '==', classId),
            where('date', '==', specificDate),
            orderBy('createdAt', 'desc')
          );
        } else {
          // Get all observations for a class
          q = query(
            collection(db, OBSERVATIONS_COLLECTION),
            where('classId', '==', classId),
            orderBy('createdAt', 'desc')
          );
        }
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
          return {
            id: doc.id,
            ...doc.data()
          };
        });
      } catch (error) {
        console.error('Error getting observations history:', error);
        return [];
      }
    },

    // Cargar historial de observaciones para una clase
    async fetchObservationsHistory(teacherId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const classesStore = useClassesStore();
        if (!classesStore.classes.length) {
          await classesStore.fetchClasses();
        }
        
        // 1. Obtener todas las clases del maestro
        const teacherClasses = classesStore.classes.filter(c => c.teacherId === teacherId);
        // console.log("Cargando historial de observaciones para las clases del maestro:", teacherClasses.map(c => c.name));

        // 2. Para cada clase, obtener sus observaciones
        const allActivities: Array<{
          classId: string;
          className: string;
          activities: Array<{
            id: string;
            classId: string;
            className: string;
            observacion: string;
            fecha: string;
            presentCount: number;
            totalCount: number;
            author?: string;
            createdAt?: string;
          }>;
        }> = [];

        for (const classItem of teacherClasses) {
          const totalAlumnos = classItem?.studentIds?.length || 0;
          const className = classItem.name || 'Clase sin nombre';
          
          // Obtener observaciones de la colección OBSERVACIONES
          const observationsQuery = query(
            collection(db, OBSERVATIONS_COLLECTION),
            where('classId', '==', classItem.id)
          );
          
          const observationsSnapshot = await getDocs(observationsQuery);
          const activities = observationsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              classId: classItem.id,
              className,
              observacion: data.text || '',
              fecha: data.date || '',
              presentCount: 0, // Will be updated if we have attendance data
              totalCount: totalAlumnos,
              author: data.author || 'Sistema',
              createdAt: data.createdAt || '',
              // Add a hash for deduplication
              contentHash: `${data.date}-${(data.text || '').substring(0, 50)}`
            };
          });
          
          // Create a set of content hashes for deduplication
          const contentHashes = new Set(activities.map(a => a.contentHash));
          
          // Also check for observations in attendance documents (for backward compatibility)
          const attendanceQuery = query(
            collection(db, ATTENDANCE_COLLECTION),
            where('classId', '==', classItem.id)
          );
          
          const attendanceSnapshot = await getDocs(attendanceQuery);
          attendanceSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.data?.observations && data.data.observations.trim()) {
              const presentes = Array.isArray(data.data.presentes) ? data.data.presentes.length : 0;
              const tarde = Array.isArray(data.data.tarde) ? data.data.tarde.length : 0;
              
              // Create a content hash for deduplication
              const contentHash = `${data.fecha}-${data.data.observations.substring(0, 50)}`;
              
              // Only add if we don't already have this observation (prevent duplicates)
              if (!contentHashes.has(contentHash)) {
                activities.push({
                  id: `attendance-${doc.id}`,
                  classId: classItem.id,
                  className,
                  observacion: data.data.observations,
                  fecha: data.fecha || '',
                  presentCount: Number(presentes + tarde),
                  totalCount: totalAlumnos,
                  author: 'Sistema',
                  createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : new Date().toISOString(),
                  contentHash
                });
                
                // Add to hash set to prevent further duplicates
                contentHashes.add(contentHash);
              } else {
                // If we have a duplicate, we need to update the attendance counts
                // Find the existing entry and update its attendance counts
                const existingEntry = activities.find(a => a.contentHash === contentHash);
                if (existingEntry) {
                  existingEntry.presentCount = Number(presentes + tarde);
                }
              }
            }
          });
          
          // Remove the contentHash property before returning the results
          const cleanedActivities = activities.map(({ contentHash, ...item }) => item);
          
          // Ordenar por fecha descendente
          cleanedActivities.sort((a, b) => {
            if (!a.fecha || !b.fecha) return 0;
            return b.fecha.localeCompare(a.fecha);
          });
          
          if (cleanedActivities.length > 0) {
            allActivities.push({
              classId: classItem.id,
              className,
              activities: cleanedActivities,
            });
          }
        }

        // Ordenar clases por nombre
        allActivities.sort((a, b) => a.className.localeCompare(b.className));
        return allActivities;
      } catch (error) {
        this.error = 'Error al cargar historial de observaciones';
        console.error('Error al cargar historial de observaciones:', error);
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    // Cargar historial de observaciones para una clase en una fecha específica
    async fetchObservationsByDate(classId: string, date: string) {
      this.isLoading = true;
      this.error = null;
      try {
        // console.log('Cargando observaciones para la clase y fecha:', classId, date);
      
        // Obtener observaciones por fecha y clase
        const observations = await getClassObservationsByDateFirebase(classId, date);
        
        // No reemplazamos todo el historial, solo devolvemos las observaciones filtradas
        return observations;
      } catch (error) {
        this.error = 'Error al cargar observaciones por fecha';
        console.error('Error al cargar observaciones por fecha:', error);
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    // Actualizar observaciones
    async updateObservations(date: string, classId: string, observations: string) {
      this.isLoading = true;
      this.error = null;
      try {
        // console.log('Actualizando observaciones para fecha:', date, 'clase:', classId);
        
        // Primero añadir al historial (esto también actualiza la observación actual)
        // const author = 'Sistema'; // Ideal sería obtenerlo del usuario actual
        // await this.addObservationToHistory(classId, date, observations, author);
        
        // console.log('Observaciones actualizadas con éxito');
        
        // Limpiar caché
        if (process.env.NODE_ENV === 'development') {
          clearLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS);
        }
        
        return true;
      } catch (error) {
        this.error = 'Error al actualizar observaciones';
        console.error('Error al actualizar observaciones:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Métodos de compatibilidad con sistema antiguo
    async fetchAttendance() {
      this.isLoading = true
      this.error = null
      try {
        // Mover la lógica de caché desde services/attendance.ts
        // Si estamos en desarrollo, intentar obtener de localStorage primero
        if (process.env.NODE_ENV === 'development') {
          const cachedAttendance = getFromLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE);
          if (cachedAttendance) {
            this.records = cachedAttendance;
            return cachedAttendance;
          }
        }
        
        // Si no hay caché o estamos en producción, obtener de Firestore
        const attendances = await getAttendancesFirebase();
        
        // Guardar en localStorage si estamos en desarrollo
        if (process.env.NODE_ENV === 'development') {
          saveToLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE, attendances);
        }
        
        this.records = attendances;
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
     * Obtiene todas las fechas con registros de asistencia para marcar en el calendario
     * Mejorado para usar consultas más eficientes
     */
    async fetchAllAttendanceDates(): Promise<string[]> {
      try {
        // Consulta más eficiente para obtener solo datos necesarios
        const attendanceQuery = query(collection(db, ATTENDANCE_COLLECTION));
        const querySnapshot = await getDocs(attendanceQuery);
        
        // Conjunto para almacenar fechas únicas con registros
        const datesWithRecords = new Set<string>();
        
        // Extraer las fechas de cada documento
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.fecha && typeof data.fecha === 'string') {
            // Validar que es una fecha válida antes de añadirla
            const parsedDate = parseISO(data.fecha);
            if (isValid(parsedDate)) {
              datesWithRecords.add(data.fecha);
            }
          }
          // console.log('Fecha encontrada:', data.fecha);
        });
        
        // También extraer fechas de los registros antiguos para compatibilidad
        this.records.forEach(record => {
          if (record.Fecha) {
            const parsedDate = parseISO(record.Fecha);
            if (isValid(parsedDate)) {
              datesWithRecords.add(record.Fecha);
            }
          }
        });
        
        // Guardar las fechas en el estado del store
        this.datesWithRecords = Array.from(datesWithRecords).sort();
        
        // console.log(`✅ Fechas con registros cargadas: ${this.datesWithRecords.length}`);
        return this.datesWithRecords;
      } catch (error) {
        console.error('Error al cargar fechas con registros:', error);
        throw error;
      }
    },

    /**
     * Obtiene y agrupa todas las fechas con registros de asistencia por mes (YYYY-MM)
     * Útil para estadísticas, reportes y optimización del calendario
     */
    async fetchAndGroupAttendanceDates() {
      try {
        // Primero cargar todas las fechas con registros
        await this.fetchAllAttendanceDates();
        
        // Agrupar las fechas por mes (YYYY-MM)
        const groupedDates = this.datesWithRecords.reduce((acc, date) => {
          // Extraer el año y mes (YYYY-MM) de la fecha completa (YYYY-MM-DD)
          const yearMonth = date.substring(0, 7);
          
          if (!acc[yearMonth]) {
            acc[yearMonth] = [];
          }
          
          // Añadir la fecha al grupo correspondiente
          acc[yearMonth].push(date);
          
          return acc;
        }, {} as Record<string, string[]>);
        
        // Ordenar las fechas dentro de cada grupo
        Object.keys(groupedDates).forEach(yearMonth => {
          groupedDates[yearMonth].sort();
        });
        
        // console.log('✅ Fechas agrupadas por mes:', Object.keys(groupedDates).length, 'meses');
        
        return groupedDates;
      } catch (error) {
        console.error('❌ Error al agrupar fechas de asistencia:', error);
        this.error = 'Error al agrupar fechas de asistencia';
        throw error;
      }
    },
    // Update the fetchAttendanceByDateRange method
async fetchAttendanceByDateRange(startDate: string, endDate: string) {
  try {
    this.isLoading = true;
    
    // Use the dedicated service function
    const records = await fetchAttendanceByDateRangeFirebase(startDate, endDate);
    
    // console.log(`Registros de asistencia encontrados: ${records.length}`);
    
    // Update the records in the store
    this.records = records;
    
    // Also update the currentAttendanceDoc if needed
    const uniqueDocs = new Map();
    
    // Group by date and class to reconstruct attendance documents
    records.forEach(record => {
      const key = `${record.Fecha}_${record.classId}`;
      if (!uniqueDocs.has(key)) {
        uniqueDocs.set(key, {
          fecha: record.Fecha,
          classId: record.classId,
          data: {
            presentes: [],
            ausentes: [],
            tarde: [],
            justificacion: [],
            observations: ''
          }
        });
      }
      
      const doc = uniqueDocs.get(key);
      
      // Add student to the appropriate array based on status
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
    this.attendanceDocuments = Array.from(uniqueDocs.values());
    
    return records;
  } catch (error) {
    console.error('Error al obtener asistencias por rango de fechas:', error);
    this.error = `Error al cargar los datos de asistencia: ${error}`;
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
    // Método para obtener la asistencia de un estudiante en una fecha específica
  }
});
