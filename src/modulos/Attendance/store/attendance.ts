// src/stores/attendance.ts
import { defineStore } from 'pinia'
import { format, parseISO, eachDayOfInterval, isValid } from 'date-fns'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../firebase'
import type { 
  AttendanceRecord, 
  AttendanceStatus, 
  AttendanceAnalytics, 
  AttendanceDocument, 
  ClassObservation
} from '../types/attendance'

// Interface for fetching attendance records
interface FetchAttendanceRecordsParams {
  classId?: string;
  startDate?: string | Date;
  endDate?: Date;
}
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
import { useClassesStore } from '../../Classes/store/classes'
// import { useStudentsStore } from '../../Students/store/students'
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../../../utils/localStorageUtils'

// Constantes
const ATTENDANCE_COLLECTION = 'ASISTENCIAS';
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
    setSelectedClass(classId: string): void {
      this.selectedClass = classId;
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
        const documents = await getAttendancesFirebase();
        
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
    async addObservationToHistory(classId: string, date: string, text: string, author: string) {
      this.isLoading = true;
      this.error = null;
      try {
        // console.log('Añadiendo observación al historial:', { classId, date, text, author });
        
        // Guardar en Firebase
        const observationId = await addClassObservationFirebase(classId, date, text, author);
        
        // Actualizar también la observación actual por compatibilidad
        this.observations = text;
        
        if (this.currentAttendanceDoc &&
            this.currentAttendanceDoc.fecha === date &&
            this.currentAttendanceDoc.classId === classId) {
          this.currentAttendanceDoc.data.observations = text;
        }
        
        // Recargar el historial
        await this.fetchObservationsHistory(classId);
        
        return observationId;
      } catch (error) {
        this.error = 'Error al añadir observación al historial';
        console.error('Error al añadir observación:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    // Cargar historial de observaciones para una clase
    async fetchObservationsHistory(classId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        // console.log('Cargando historial de observaciones para la clase:', classId);
        
        // Obtener historial de Firebase
        const observations = await getClassObservationsHistoryFirebase(classId);
        // Actualizar el state
        this.observationsHistory = observations;
        
        return observations;
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
        const author = 'Sistema'; // Ideal sería obtenerlo del usuario actual
        await this.addObservationToHistory(classId, date, observations, author);
        
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
        // console.log('📊 Actualizando analíticas de asistencia...');
        
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
          // console.log('⚠️ No hay documentos de asistencia cargados, intentando cargar...');
          await this.fetchAttendanceDocuments();
        }
        
        // También asegurar que los registros antiguos estén disponibles para compatibilidad
        if (this.records.length === 0) {
          // console.log('⚠️ No hay registros antiguos de asistencia cargados, intentando cargar...');
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
          // console.log('⚠️ No hay clases cargadas en el store, intentando cargar...');
          await classesStore.fetchClasses();
        }
        
        // Crear el mapa de ID a nombre de clase
        classesStore.classes.forEach(classItem => {
          classNameMap.set(classItem.id, classItem.name);
        });
        
        // Primero analizar datos de la nueva estructura de documentos
        this.attendanceDocuments.forEach(doc => {
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
          
          // Procesar presentes
          doc.data.presentes.forEach(studentId => {
            studentsSet.add(studentId);
            analytics.byClass[className].present++;
            analytics.byClass[className].total++;
          });
          
          // Procesar ausentes
          doc.data.ausentes.forEach(studentId => {
            studentsSet.add(studentId);
            analytics.byClass[className].absent++;
            analytics.byClass[className].total++;
          });
          
          // Procesar tarde y justificados
          doc.data.tarde.forEach(studentId => {
            studentsSet.add(studentId);
            
            // Verificar si tiene justificación
            const isJustified = doc.data.justificacion?.some(j => j.id === studentId);
            
            if (isJustified) {
              analytics.byClass[className].justified++;
            } else {
              analytics.byClass[className].delayed++;
            }
            
            analytics.byClass[className].total++;
          });
        });
        
        // Completar con datos de registros antiguos para compatibilidad
        this.records.forEach(record => {
          // Añadir a los sets
          classesSet.add(record.classId);
          studentsSet.add(record.studentId);
          
          // Obtener el nombre de la clase (o usar el ID si no se encuentra)
          const className = classNameMap.get(record.classId) || record.classId;
          
          // Si la clase no está en el análisis (posible si solo hay registros antiguos)
          if (!analytics.byClass[className]) {
            analytics.byClass[className] = {
              present: 0,
              absent: 0,
              delayed: 0,
              justified: 0,
              total: 0
            };
          }
          
          // Verificar si este registro ya fue contabilizado en la nueva estructura
          const isAlreadyCounted = this.attendanceDocuments.some(doc => 
            doc.fecha === record.Fecha && 
            doc.classId === record.classId && 
            (doc.data.presentes.includes(record.studentId) || 
             doc.data.ausentes.includes(record.studentId) || 
             doc.data.tarde.includes(record.studentId))
          );
          
          // Solo contabilizar si no ha sido contado
          if (!isAlreadyCounted) {
            analytics.byClass[className].total++;
            
            switch (record.status) {
              case 'Presente':
                analytics.byClass[className].present++;
                break;
              case 'Ausente':
                analytics.byClass[className].absent++;
                break;
              case 'Tardanza':
                analytics.byClass[className].delayed++;
                break;
              case 'Justificado':
                analytics.byClass[className].justified++;
                break;
            }
          }
        });
        
        // Calcular estudiantes con más ausencias
        const absentStudents = this.calculateAbsentStudents();
        analytics.absentStudents = absentStudents;
        
        // Calcular totales
        analytics.totalClasses = classesSet.size;
        analytics.totalStudents = studentsSet.size;
        
        // Calcular asistencia promedio
        let totalPresent = 0;
        let totalRecords = 0;
        
        Object.values(analytics.byClass).forEach(classStats => {
          totalPresent += classStats.present + classStats.justified;
          totalRecords += classStats.total;
        });
        
        analytics.averageAttendance = totalRecords > 0 
          ? (totalPresent / totalRecords) * 100 
          : 0;
        
        // Actualizar el estado
        this.analytics = analytics;
        // console.log('✅ Analíticas actualizadas:', analytics);
        
        return analytics;
      } catch (error) {
        console.error('❌ Error al actualizar analíticas:', error);
        throw error;
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
      
      // Primero analizar los documentos nuevos
      this.attendanceDocuments.forEach(doc => {
        // Procesar ausentes
        doc.data.ausentes.forEach(studentId => {
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
        [...doc.data.presentes, ...doc.data.tarde].forEach(studentId => {
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
      
      // Complementar con registros antiguos
      this.records.forEach(record => {
        // Verificar si este registro ya fue contabilizado en la nueva estructura
        const isAlreadyCounted = this.attendanceDocuments.some(doc => 
          doc.fecha === record.Fecha && 
          doc.classId === record.classId && 
          (doc.data.presentes.includes(record.studentId) || 
           doc.data.ausentes.includes(record.studentId) || 
           doc.data.tarde.includes(record.studentId))
        );
        
        if (!isAlreadyCounted) {
          if (!absencesMap[record.studentId]) {
            absencesMap[record.studentId] = {
              absences: 0,
              lastAttendance: record.Fecha,
              attendanceRate: 0,
              totalAttendance: 0
            };
          }
          
          absencesMap[record.studentId].totalAttendance++;
          
          if (record.status === 'Ausente') {
            absencesMap[record.studentId].absences++;
          }
          
          // Actualizar última fecha solo si es más reciente
          if (record.Fecha > absencesMap[record.studentId].lastAttendance) {
            absencesMap[record.studentId].lastAttendance = record.Fecha;
          }
        }
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
    
    console.log(`Registros de asistencia encontrados: ${records.length}`);
    
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
    }
  }
});