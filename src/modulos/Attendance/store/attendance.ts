//src/stores/attendance.ts
import { defineStore } from 'pinia'
import { format, parseISO, eachDayOfInterval, isValid } from 'date-fns' // Añadido isValid para validaciones
import { collection, getDocs, query, where } from 'firebase/firestore' // Añadidos métodos de consulta
import { db } from '../../../firebase'
import type { AttendanceRecord, AttendanceStatus, AttendanceAnalytics, AttendanceDocument } from '../types/attendance'
// Importar directamente desde firestore
import { 
  getAttendancesFirebase, 
  getAttendanceByDateAndClassFirebase, 
  updateAttendanceFirebase, 
  getAttendanceReport,
  registerAttendanceFirebase,
  getAttendanceDocumentFirebase,
  saveAttendanceDocumentFirebase,
  addJustificationToAttendanceFirebase,
  updateObservationsFirebase,
  getAllAttendanceDocumentsFirebase
} from '../service/attendance'
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
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
    datesWithRecords: [] as string[]
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
      return (className: string): AttendanceRecord[] => 
        state.records.filter(record => record.classId === className);
    },
    
    getAttendanceByStudent: (state) => {
      return (studentId: string): AttendanceRecord[] => 
        state.records.filter(record => record.studentId === studentId);
    },
    
    getAttendanceByDate: (state) => {
      return (date: string): AttendanceRecord[] => 
        state.records.filter(record => record.Fecha === date);
    },
    
    getRecordsByDate: (state) => {
      return (date: string): AttendanceRecord[] => 
        state.records.filter(record => record.Fecha === date);
    },
    
    getRecordsByDateAndClass: (state) => {
      return (date: string, className: string): AttendanceRecord[] => 
        state.records.filter(record => 
          record.Fecha === date && record.classId === className
        );
    },
    
    getDatesWithRecords: (state): string[] => {
      return [...new Set(state.records.map(record => record.Fecha))];
    },
    
    getStudentStatus: (state) => {
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
    
    // Get observations for current class date
    getObservations: (state): string => {
      return state.currentAttendanceDoc?.data.observations || state.observations || '';
    },

    getStudentAttendanceRate: (state) => {
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
      return (className: string): string[] => {
        const classesStore = useClassesStore();
        const classData = classesStore.classes.find(c => c.name === className || c.id === className);
        
        if (!classData) {
          console.warn(`Class not found: ${className}`);
          return [];
        }

        // Check if schedule exists
        if (!classData.schedule) {
          console.warn(`No schedule found for class: ${className}`);
          return [];
        }

        // Parse schedule depending on its type
        if (typeof classData.schedule === 'string') {
          const schedule = String(classData.schedule).toLowerCase();
          const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
          return days.filter(day => schedule.includes(day));
        } else if (classData.schedule && typeof classData.schedule === 'object') {
          if ('days' in classData.schedule && Array.isArray(classData.schedule.days)) {
            return classData.schedule.days;
          } else if ('slots' in classData.schedule && Array.isArray(classData.schedule.slots)) {
            // Extract days from slots array
            const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const result: string[] = [];
            
            classData.schedule.slots.forEach((slot: any) => {
              if (typeof slot.day === 'number' && slot.day >= 0 && slot.day < 7) {
                result.push(days[slot.day]);
              } else if (typeof slot.day === 'string') {
                result.push(slot.day.toLowerCase());
              }
            });
            
            return result;
          }
        }
        
        console.warn(`Could not parse schedule for class: ${className}`, classData.schedule);
        return [];
      }
    },

    getScheduledDatesForClass: () => {
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
    
    // Reemplazar el getter con una versión mejorada
    isValidAttendanceDate: () => {
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

    // Getter para obtener fechas con registros
    getDatesWithRecordsArray: (state): string[] => {
      return state.datesWithRecords || [];
    }
  },
  
  actions: {
    setSelectedClass(classId: string): void {
      this.selectedClass = classId;
    },

    // Cargar documentos de asistencia (nueva estructura)
    async fetchAttendanceDocuments(): Promise<AttendanceDocument[]> {
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
        const documents = await getAllAttendanceDocumentsFirebase();
        
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
        // Buscar primero en el caché local
        let document = this.attendanceDocuments.find(
          doc => doc.fecha === fecha && doc.classId === classId
        );
        
        if (!document) {
          // Si no está en caché, obtener de Firestore
          const result = await getAttendanceDocumentFirebase(fecha, classId);
          document = result || undefined;
        }
        
        // Si existe el documento, guardarlo en el estado
        if (document) {
          this.currentAttendanceDoc = document;
          
          // Actualizar los registros de asistencia para UI
          this.attendanceRecords = {};
          
          // Primero procesamos justificaciones para darles prioridad
          // y que no sean sobreescritas por otros estados
          if (document.data.justificacion && Array.isArray(document.data.justificacion)) {
            document.data.justificacion.forEach(justification => {
              if (justification && justification.id) {
                this.attendanceRecords[justification.id] = 'Justificado';
              }
            });
          }
          
          // Ahora procesamos el resto de estados respetando las justificaciones
          document.data.presentes.forEach(studentId => {
            // Solo asignamos si no es ya justificado
            if (!this.attendanceRecords[studentId]) {
              this.attendanceRecords[studentId] = 'Presente';
            }
          });
          
          document.data.ausentes.forEach(studentId => {
            // Solo asignamos si no es ya justificado
            if (!this.attendanceRecords[studentId]) {
              this.attendanceRecords[studentId] = 'Ausente';
            }
          });
          
          document.data.tarde.forEach(studentId => {
            // Para estudiantes en tarde, verificar si tienen justificación
            const hasJustification = document.data.justificacion?.some(j => j.id === studentId);
            
            // Solo asignamos si no es ya justificado
            if (!this.attendanceRecords[studentId]) {
              this.attendanceRecords[studentId] = hasJustification ? 'Justificado' : 'Tardanza';
            }
          });
          
          // Guardar las observaciones
          this.observations = document.data.observations || '';
          
          return document;
        }
        
        // Si no existe documento, crear una estructura vacía
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
        
        // Limpiar los registros de asistencia
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

    // Actualizar observaciones
    async updateObservations(date: string, classId: string, observations: string) {
      this.isLoading = true;
      this.error = null;
      try {
        await updateObservationsFirebase(date, classId, observations);
        
        // Actualizar localmente
        if (this.currentAttendanceDoc && 
            this.currentAttendanceDoc.fecha === date && 
            this.currentAttendanceDoc.classId === classId) {
          this.currentAttendanceDoc.data.observations = observations;
          this.observations = observations;
        }
        
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
        console.log(`🔍 Buscando registros de asistencia para clase ${className} en fecha ${Fecha}`);
        
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
        console.log('📝 Verificando registro de asistencia:', JSON.stringify(record, null, 2));
        
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
                    existingDoc.data.justificacion[justIndex].reason = record.justification.reason || '';
                    if (record.documentUrl) {
                      existingDoc.data.justificacion[justIndex].documentURL = record.documentUrl;
                    }
                  } else {
                    if (!existingDoc.data.justificacion) {
                      existingDoc.data.justificacion = [];
                    }
                    existingDoc.data.justificacion.push({
                      id: record.studentId,
                      reason: record.justification.reason || '',
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
          console.log('🔄 Encontrado registro existente, actualizando...');
          recordId = await updateAttendanceFirebase(sanitizedRecord);
        } else {
          // Si no existe, crear nuevo registro
          console.log('➕ No se encontró registro existente, creando nuevo...');
          recordId = await registerAttendanceFirebase(sanitizedRecord);
        }
        
        // Limpiar caché si estamos en desarrollo
        if (process.env.NODE_ENV === 'development') {
          clearLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE);
          clearLocalStorage(LOCAL_STORAGE_KEYS.ATTENDANCE_DOCUMENTS);
        }
        
        console.log('✅ Registro guardado exitosamente');
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
        console.log('📊 Actualizando analíticas de asistencia...');
        
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
          console.log('⚠️ No hay documentos de asistencia cargados, intentando cargar...');
          await this.fetchAttendanceDocuments();
        }
        
        // También asegurar que los registros antiguos estén disponibles para compatibilidad
        if (this.records.length === 0) {
          console.log('⚠️ No hay registros antiguos de asistencia cargados, intentando cargar...');
          await this.fetchAttendance();
        }
        
        // Obtener clases únicas de los documentos
        const classesSet = new Set<string>();
        const studentsSet = new Set<string>();
        
        // Primero analizar datos de la nueva estructura de documentos
        this.attendanceDocuments.forEach(doc => {
          // Añadir la clase a las clases únicas
          classesSet.add(doc.classId);
          
          // Inicializar analytics para esta clase si no existe
          if (!analytics.byClass[doc.classId]) {
            analytics.byClass[doc.classId] = {
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
            analytics.byClass[doc.classId].present++;
            analytics.byClass[doc.classId].total++;
          });
          
          // Procesar ausentes
          doc.data.ausentes.forEach(studentId => {
            studentsSet.add(studentId);
            analytics.byClass[doc.classId].absent++;
            analytics.byClass[doc.classId].total++;
          });
          
          // Procesar tarde y justificados
          doc.data.tarde.forEach(studentId => {
            studentsSet.add(studentId);
            
            // Verificar si tiene justificación
            const isJustified = doc.data.justificacion?.some(j => j.id === studentId);
            
            if (isJustified) {
              analytics.byClass[doc.classId].justified++;
            } else {
              analytics.byClass[doc.classId].delayed++;
            }
            
            analytics.byClass[doc.classId].total++;
          });
        });
        
        // Completar con datos de registros antiguos para compatibilidad
        this.records.forEach(record => {
          // Añadir a los sets
          classesSet.add(record.classId);
          studentsSet.add(record.studentId);
          
          // Si la clase no está en el análisis (posible si solo hay registros antiguos)
          if (!analytics.byClass[record.classId]) {
            analytics.byClass[record.classId] = {
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
            analytics.byClass[record.classId].total++;
            
            switch (record.status) {
              case 'Presente':
                analytics.byClass[record.classId].present++;
                break;
              case 'Ausente':
                analytics.byClass[record.classId].absent++;
                break;
              case 'Tardanza':
                analytics.byClass[record.classId].delayed++;
                break;
              case 'Justificado':
                analytics.byClass[record.classId].justified++;
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
        console.log('✅ Analíticas actualizadas:', analytics);
        
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
        console.error('Fecha inválida:', Fecha);
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
        });
        
        // Guardar las fechas en el estado del store
        this.datesWithRecords = Array.from(datesWithRecords).sort();
        
        console.log(`Fechas con registros cargadas: ${this.datesWithRecords.length}`);
        return this.datesWithRecords;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error al cargar fechas con registros: ${errorMessage}`);
        throw error;
      }
    },

    async fetchAttendanceRecords({ classId, startDate, endDate }: FetchAttendanceRecordsParams) {
      this.isLoading = true;
      this.error = null;
      try {
        // Usar el método existente fetchAttendanceByClassAndDate
        await this.fetchAttendanceByClassAndDate(classId, format(startDate, 'yyyy-MM-dd'));
        return this.attendanceRecords;
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