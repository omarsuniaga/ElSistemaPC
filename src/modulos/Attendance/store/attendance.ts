// src/stores/attendance.ts
import { defineStore } from 'pinia';
import { query, collection, where, getDocs, DocumentData, doc, getDoc } from 'firebase/firestore';
import { db } from "../../../firebase"; // Assuming firebase.ts is in src/
import { ATTENDANCE_COLLECTION } from '../service/attendance'; // Adjusted path
import { format } from 'date-fns';
import { useAuthStore } from '../../Auth/store/auth';
import { useClassesStore } from '../../Classes/store/classes';
import { ref, computed } from 'vue';

// Importar tipos desde el archivo central de tipos
import type { 
  AttendanceRecord, 
  ClassObservation, 
  JustificationData,
  AttendanceStatus,
  AttendanceDocument 
} from '../types/attendance';

// Importar el servicio centralizado
import * as attendanceService from '../../../service/attendance';
import { useStudentsStore } from '../../Students/store/students'; // Assuming path to students store

import { 
  addClassObservationFirebase, 
  addJustificationFirebase, 
  getClassObservationsFirebase,
  updateClassObservationFirebase
} from '../services/attendance';

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
  lastUpdated?: Date; // Optional for caching optimization
}

// Interface definitions moved to types file to avoid duplication

// Re-export types from action files - these might be reviewed later
export type { AttendanceStoreState as FetchActionsState } from './actions/fetchActions';
export type { AttendanceStoreState as ReportActionsState, AbsentStudentInfo, AttendanceReport } from './actions/reportActions';


export const useAttendanceStore = defineStore('attendance', () => {
  // Estado
  const attendanceRecords = ref<Record<string, AttendanceStatus>>({});
  const records = ref<AttendanceRecord[]>([]);
  const observations = ref<ClassObservation[]>([]);
  const observationsHistory = ref<ClassObservation[]>([]);
  const justifications = ref<JustificationData[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedDate = ref<string>('');
  const selectedClass = ref<string>('');
  const attendanceDocuments = ref<AttendanceDocument[]>([]);
  const currentAttendanceDoc = ref<AttendanceDocument | null>(null);
  const datesWithRecords = ref<string[]>([]);
  const analytics = ref<AttendanceAnalytics | null>(null);
  // Nuevo: cache de observaciones por clase y usuario
  const observationsCache = ref<Record<string, { data: ClassObservation[]; lastFetch: number }>>({});

  // Getters
  const getAttendanceByDateAndClass = computed(() => {
    return (fecha: string, classId: string) => {
      const doc = attendanceDocuments.value.find(doc => 
        doc.fecha === fecha && doc.classId === classId
      );
      return doc ? [doc] : [];
    };
  });

  const getObservationsByClass = computed(() => {
    return (classId: string, fecha?: string) => {
      return observations.value.filter(obs => 
        obs.classId === classId && (!fecha || obs.fecha === fecha)
      );
    };
  });

  const getJustificationsByStudent = computed(() => {
    return (studentId: string, classId?: string, fecha?: string) => {
      return justifications.value.filter(just => 
        just.studentId === studentId && 
        (!classId || just.classId === classId) && 
        (!fecha || just.fecha === fecha)
      );
    };
  });

  // Getter para las fechas con actividades registradas
  const dateAttendanceStatuses = computed(() => {
    const statusMap = new Map<string, { type: string; count: number }>();
    
    attendanceDocuments.value.forEach(doc => {
      if (doc.fecha) {
        const status = statusMap.get(doc.fecha) || { type: 'attendance', count: 0 };
        status.count++;
        statusMap.set(doc.fecha, status);
      }
    });
    
    return Object.fromEntries(statusMap);
  });

  // Getter para observaciones del documento actual
  const getObservations = computed(() => {
    const observacion = currentAttendanceDoc.value?.data?.observación;
    if (!observacion) return '';
    
    // Si es un array, unir con saltos de línea
    if (Array.isArray(observacion)) {
      return observacion.join('\n');
    }
    
    // Si es string, devolverlo directamente
    return observacion;
  });

  // Acciones
  const normalizeDate = (date: string): string => {
    try {
      // Si la fecha está en formato YYYYMMDD
      if (/^\d{8}$/.test(date)) {
        return `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
      }
      // Si ya está en formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Si es una fecha válida, formatearla
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return format(dateObj, 'yyyy-MM-dd');
      }
      throw new Error('Formato de fecha inválido');
    } catch (error) {
      console.error('Error al normalizar fecha:', error);
      throw error;
    }
  };

  // Método de compatibilidad - alias para fetchAttendanceDocuments
  const fetchAttendance = async (startDate?: string, endDate?: string) => {
    return await fetchAttendanceDocuments(startDate, endDate);
  };

  const fetchAttendanceDocuments = async (startDate?: string, endDate?: string) => {
    try {
      loading.value = true;
      error.value = null;

      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;

      if (!teacherId) {
        throw new Error('No hay usuario autenticado');
      }

      let documents: AttendanceDocument[] = [];
      
      if (startDate && endDate) {
        // Usar el servicio centralizado para obtener documentos por rango de fechas
        documents = await attendanceService.getAttendanceDocumentsByDateRange(
          startDate, 
          endDate, 
          teacherId
        );
      } else {
        // Para compatibilidad, obtener todas las fechas registradas
        const registeredDates = await attendanceService.getRegisteredAttendanceDates(teacherId);
        
        // Filtrar solo fechas válidas (no IDs) 
        const validDates = registeredDates.filter(date => {
          // Verificar que es una fecha válida en formato YYYY-MM-DD
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(date)) {
            console.warn(`Fecha inválida encontrada: ${date}`);
            return false;
          }
          return true;
        });
        
        if (validDates.length === 0) {
          documents = [];
        } else {
          // Obtener documentos para todas las fechas válidas
          const promises = validDates.map(date => 
            attendanceService.getAttendanceDocumentsByDate(date, teacherId)
          );
          
          const results = await Promise.all(promises);
          documents = results.flat();
        }
      }

      attendanceDocuments.value = documents;
      return documents;
    } catch (err) {
      error.value = 'Error al cargar los documentos de asistencia';
      console.error('Error en fetchAttendanceDocuments:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchAttendanceDocument = async (date: string, classId: string, _forceReload = false) => {
    try {
      const formattedDate = normalizeDate(date);
      const debugEnabled = typeof window !== 'undefined' && window.localStorage.getItem('attendance-debug') === 'true';
      
      if (debugEnabled) {
        console.log('[AttendanceDebug] fetchAttendanceDocument: Buscando documento para fecha:', formattedDate, 'clase:', classId);
      }
      
      // Obtener el teacherId del usuario autenticado
      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;
      
      if (!teacherId) {
        throw new Error('No hay usuario autenticado para cargar asistencia');
      }
      
      if (debugEnabled) {
        console.log('[AttendanceDebug] fetchAttendanceDocument: TeacherId:', teacherId);
      }
      
      // Usar el servicio centralizado con teacherId
      const document = await attendanceService.getAttendanceDocument(formattedDate, classId, teacherId);
      
      if (document) {
        if (debugEnabled) {
          console.log('[AttendanceDebug] fetchAttendanceDocument: Documento encontrado:', JSON.parse(JSON.stringify(document)));
        }
        
        // Verificar que el documento pertenece al profesor correcto
        if (document.teacherId !== teacherId) {
          console.warn('[AttendanceDebug] fetchAttendanceDocument: Documento pertenece a otro profesor:', document.teacherId, 'vs', teacherId);
          currentAttendanceDoc.value = null;
          attendanceRecords.value = {};
          records.value = [];
          return null;
        }
        
        // Convertir los arrays de IDs a un objeto de estados de manera más precisa
        const attendanceRecordsData: Record<string, AttendanceStatus> = {};
        
        // Primero, procesar todos los estudiantes con justificación para identificarlos
        const justifiedStudents = new Set<string>();
        document.data.justificacion?.forEach((justification: any) => {
          if (justification.id || justification.studentId) {
            const studentId = justification.id || justification.studentId;
            justifiedStudents.add(studentId);
            attendanceRecordsData[studentId] = 'Justificado';
          }
        });
        
        // Procesar presentes (solo si no están justificados)
        document.data.presentes?.forEach((studentId: string) => {
          if (!justifiedStudents.has(studentId)) {
            attendanceRecordsData[studentId] = 'Presente';
          }
        });
        
        // Procesar tardanzas (solo si no están justificados)
        document.data.tarde?.forEach((studentId: string) => {
          if (!justifiedStudents.has(studentId)) {
            attendanceRecordsData[studentId] = 'Tardanza';
          }
        });
        
        // Procesar ausentes (solo si no están justificados ni tienen otro estado)
        document.data.ausentes?.forEach((studentId: string) => {
          if (!justifiedStudents.has(studentId) && !attendanceRecordsData[studentId]) {
            attendanceRecordsData[studentId] = 'Ausente';
          }
        });
        
        console.log('[AttendanceDebug] fetchAttendanceDocument: Registros de asistencia procesados:', attendanceRecordsData);
        
        // Actualizar el documento actual y los registros de asistencia
        currentAttendanceDoc.value = document;
        attendanceRecords.value = attendanceRecordsData;
        
        // Convertir a formato AttendanceRecord[] para compatibilidad con useAttendanceActions
        const recordsData: AttendanceRecord[] = Object.entries(attendanceRecordsData).map(([studentId, status]) => ({
          id: `${formattedDate}_${classId}_${studentId}`,
          studentId,
          classId,
          fecha: formattedDate,
          status,
          createdAt: document.createdAt || new Date(),
          updatedAt: document.updatedAt || new Date()
        }));
        
        records.value = recordsData;
        
        // Registros finales con debugging condicional
        if (debugEnabled) {
          console.log('[AttendanceDebug] fetchAttendanceDocument: Records finales:', recordsData);
        }
        
        // Esto permite que los componentes accedan a los datos normalizados
        return document;
      } else {
        if (debugEnabled) {
          console.log('[AttendanceDebug] fetchAttendanceDocument: No se encontró documento - limpiando datos');
        }
        // Limpiar datos si no se encuentra documento
        currentAttendanceDoc.value = null;
        attendanceRecords.value = {};
        records.value = [];
        return null;
      }
    } catch (error) {
      console.error('[AttendanceDebug] fetchAttendanceDocument: Error:', error);
      throw error;
    }
  };

  const loadAttendanceDataForCalendar = async (startDate: string, endDate: string) => {
    try {
      loading.value = true;
      error.value = null;
      const authStore = useAuthStore();
      if (!authStore.user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener documentos de asistencia
      await fetchAttendanceDocuments(startDate, endDate);

      // Retornar las fechas con actividades usando el getter
      return Object.entries(dateAttendanceStatuses.value).map(([date, status]) => ({
        date,
        type: status.type,
        count: status.count
      }));
    } catch (err) {
      error.value = 'Error al cargar los datos de asistencia';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const addObservationToHistory = async (observation: Omit<ClassObservation, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      loading.value = true;
      error.value = null;
      const newObservation = await addClassObservationFirebase(observation);
      observations.value.push(newObservation);
      return newObservation;
    } catch (err) {
      error.value = 'Error al agregar la observación';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const addJustification = async (justification: Omit<JustificationData, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      loading.value = true;
      error.value = null;
      const newJustification = await addJustificationFirebase(justification);
      justifications.value.push(newJustification);
      return newJustification;
    } catch (err) {
      error.value = 'Error al agregar la justificación';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchClassObservations = async (classId: string, date?: string) => {
    try {
      loading.value = true;
      error.value = null;
      const fetchedObservations = await getClassObservationsFirebase(classId, date);
      observations.value = fetchedObservations;
      return fetchedObservations;
    } catch (err) {
      error.value = 'Error al cargar las observaciones';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const updateClassObservation = async (observation: ClassObservation) => {
    try {
      loading.value = true;
      error.value = null;
      const updatedObservation = await updateClassObservationFirebase(observation);
      
      // Actualiza la observación en el array local
      const index = observations.value.findIndex(obs => obs.id === observation.id);
      if (index !== -1) {
        observations.value[index] = updatedObservation;
      }
      
      return updatedObservation;
    } catch (err) {
      error.value = 'Error al actualizar la observación';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchJustifications = async (studentId: string, classId?: string, date?: string) => {
    try {
      loading.value = true;
      error.value = null;
      // Aquí iría la llamada al servicio para obtener las justificaciones
      // Por ahora retornamos un array vacío
      console.log('Fetching justifications for:', studentId, classId, date);
      return [];
    } catch (err) {
      error.value = 'Error al cargar las justificaciones';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Función para validar la fecha de asistencia
  const validateAttendanceDate = (date: string): boolean => {
    try {
      const selectedDate = new Date(date);
      const today = new Date();
      
      // La fecha no puede ser en el futuro
      if (selectedDate > today) {
        return false;
      }
      
      // La fecha debe ser válida
      if (isNaN(selectedDate.getTime())) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al validar fecha:', error);
      return false;
    }
  };

  // Función optimizada para actualizar las analíticas - solo cuando se necesite
  const updateAnalytics = async (skipIfRecentlyUpdated = true): Promise<void> => {
    try {
      // Check if analytics were recently updated to avoid redundant calls
      if (skipIfRecentlyUpdated && analytics.value) {
        const lastUpdate = analytics.value.lastUpdated;
        if (lastUpdate && (Date.now() - lastUpdate.getTime()) < 300000) { // 5 minutes
          return; // Skip update if analytics are fresh
        }
      }

      loading.value = true;
      error.value = null;

      // Use cached documents if available instead of fetching again
      if (attendanceDocuments.value.length === 0) {
        // Only fetch if we don't have documents
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');

        // Use simpler query without teacherId filter to avoid index issues
        try {
          await fetchAttendanceDocuments(formattedStartDate, formattedEndDate);
        } catch (fetchError) {
          console.warn('[Analytics] Error fetching documents for analytics, using cached data:', fetchError);
          // Continue with existing cached data
        }
      }

      // Calcular estadísticas usando documentos disponibles
      const stats = {
        totalClasses: 0,
        totalStudents: 0,
        averageAttendance: 0,
        absentStudents: [],
        lastUpdated: new Date(),
        byClass: {} as Record<string, {
          present: number;
          absent: number;
          delayed: number;
          justified: number;
          total: number;
        }>
      };

      // Procesar documentos para obtener estadísticas
      attendanceDocuments.value.forEach(doc => {
        if (doc.data) {
          stats.totalClasses++;
          
          const classStats = stats.byClass[doc.classId] || {
            present: 0,
            absent: 0,
            delayed: 0,
            justified: 0,
            total: 0
          };

          // Contar presentes
          classStats.present += doc.data.presentes?.length || 0;
          
          // Contar ausentes
          classStats.absent += doc.data.ausentes?.length || 0;
          
          // Contar tardanzas
          classStats.delayed += doc.data.tarde?.length || 0;
          
          // Contar justificados
          classStats.justified += doc.data.justificacion?.length || 0;
          
          // Total de estudiantes
          classStats.total = classStats.present + classStats.absent + classStats.delayed + classStats.justified;
          
          stats.byClass[doc.classId] = classStats;
        }
      });

      // Calcular promedio de asistencia
      if (stats.totalClasses > 0) {
        const totalPresent = Object.values(stats.byClass).reduce((sum, classStat) => sum + classStat.present, 0);
        const totalStudents = Object.values(stats.byClass).reduce((sum, classStat) => sum + classStat.total, 0);
        stats.averageAttendance = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;
      }

      // Actualizar el estado
      analytics.value = stats;
    } catch (err) {
      error.value = 'Error al actualizar analíticas';
      console.error('Error en updateAnalytics:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Función para guardar documento de asistencia
  const saveAttendanceDocument = async (attendanceDoc: AttendanceDocument): Promise<string> => {
    try {
      loading.value = true;
      error.value = null;
      
      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;
      
      if (!teacherId) {
        throw new Error('Usuario no autenticado');
      }
      
      // Asegurar que el documento tiene teacherId y uid
      const documentToSave = {
        ...attendanceDoc,
        teacherId,
        uid: teacherId
      };
      
      // Usar el servicio centralizado para guardar
      const docId = await attendanceService.saveAttendanceDocument(documentToSave);
      
      // Actualizar el store local
      const existingIndex = attendanceDocuments.value.findIndex(
        doc => doc.fecha === attendanceDoc.fecha && doc.classId === attendanceDoc.classId
      );
      
      if (existingIndex !== -1) {
        attendanceDocuments.value[existingIndex] = documentToSave;
      } else {
        attendanceDocuments.value.push(documentToSave);
      }
      
      return docId;
    } catch (err) {
      error.value = 'Error al guardar documento de asistencia';
      console.error('Error en saveAttendanceDocument:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Función para actualizar observaciones
  const updateObservations = async (fecha: string, classId: string, observations: string): Promise<string> => {
    try {
      loading.value = true;
      error.value = null;
      
      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;
      
      if (!teacherId) {
        throw new Error('Usuario no autenticado');
      }
      
      // Usar el servicio centralizado
      const docId = await attendanceService.updateObservations(fecha, classId, observations, teacherId);
      
      // Actualizar el store local
      const existingIndex = attendanceDocuments.value.findIndex(
        doc => doc.fecha === fecha && doc.classId === classId
      );
      
      if (existingIndex !== -1) {
        // Actualizar documento existente
        if (!attendanceDocuments.value[existingIndex].data.observación) {
          attendanceDocuments.value[existingIndex].data.observación = [];
        }
        // Si observación es un array, añadir la nueva observación
        if (Array.isArray(attendanceDocuments.value[existingIndex].data.observación)) {
          (attendanceDocuments.value[existingIndex].data.observación as any[]).push({
            text: observations,
            timestamp: new Date().toISOString(),
            author: authStore.user?.displayName || authStore.user?.email || 'Usuario'
          });
        } else {
          // Si es string, convertir a array
          attendanceDocuments.value[existingIndex].data.observación = [observations];
        }
      } else {
        // Crear nuevo documento local si no existe
        const newDoc: AttendanceDocument = {
          id: docId,
          fecha,
          classId,
          teacherId,
          uid: teacherId,
          data: {
            presentes: [],
            ausentes: [],
            tarde: [],
            justificacion: [],
            observación: [observations]
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        attendanceDocuments.value.push(newDoc);
      }
      
      return docId;
    } catch (err) {
      error.value = 'Error al actualizar observaciones';
      console.error('Error en updateObservations:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Función para obtener fechas con registros
  const fetchAllAttendanceDates = async (): Promise<string[]> => {
    try {
      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;
      
      const dates = await attendanceService.getRegisteredAttendanceDates(teacherId);
      datesWithRecords.value = dates;
      return dates;
    } catch (err) {
      console.error('Error al obtener fechas registradas:', err);
      return [];
    }
  };

  // Función para verificar si una clase está registrada en una fecha
  const isClassRegistered = (fecha: string, classId: string): boolean => {
    return attendanceDocuments.value.some(
      doc => doc.fecha === fecha && doc.classId === classId
    );
  };
  
  // Función que verifica en Firestore si existe un registro de asistencia
  // para una fecha y clase específicas
  const checkAttendanceExists = async (fecha: string, classId: string): Promise<boolean> => {
    try {
      console.log(`[AttendanceStore] Verificando existencia de registro para fecha ${fecha} y clase ${classId}`)
      // Primero verificamos en el store si ya tenemos el documento cargado
      const existsInStore = isClassRegistered(fecha, classId)
      if (existsInStore) {
        console.log('[AttendanceStore] Registro encontrado en el store local')
        return true
      }
      
      // Si no está en el store, consultamos directamente a Firestore
      const docId = `${fecha}_${classId}`
      const docRef = doc(db, ATTENDANCE_COLLECTION, docId)
      const docSnap = await getDoc(docRef)
      
      const exists = docSnap.exists()
      console.log(`[AttendanceStore] Verificación en Firestore: ${exists ? 'Registro encontrado' : 'No hay registro'}`)
      return exists
    } catch (error) {
      console.error('Error al verificar existencia de registro de asistencia:', error)
      return false
    }
  };

  // Función para obtener clases registradas en una fecha
  const getRegisteredClassesForDate = (fecha: string): string[] => {
    return attendanceDocuments.value
      .filter(doc => doc.fecha === fecha)
      .map(doc => doc.classId);
  };

  // Función para obtener estadísticas de una clase
  const getClassStats = async (classId: string, startDate: string, endDate: string) => {
    try {
      return await attendanceService.getAttendanceStats(classId, startDate, endDate);
    } catch (err) {
      console.error('Error al obtener estadísticas de clase:', err);
      throw err;
    }
  };

  // Función para obtener información completa de clases en una fecha
  const getDateClassInfo = (fecha: string, teacherId: string) => {
    // Normalizar la fecha
    const normalizedDate = fecha.replace(/\//g, '-');
    
    // Obtener clases registradas en esta fecha
    const registeredClasses = attendanceDocuments.value
      .filter(doc => doc.fecha === normalizedDate && doc.teacherId === teacherId)
      .map(doc => ({ 
        classId: doc.classId, 
        hasRecord: true,
        document: doc 
      }));

    // Obtener todas las clases del profesor desde classesStore
    const classesStore = useClassesStore();
    const allTeacherClasses = classesStore.getClassesByTeacherId?.(teacherId) || [];
    
    // Determinar clases no registradas
    const registeredClassIds = registeredClasses.map(rc => rc.classId);
    const unregisteredClasses = allTeacherClasses
      .filter(cls => !registeredClassIds.includes(cls.id || cls.name))
      .map(cls => ({ 
        classId: cls.id || cls.name, 
        hasRecord: false,
        className: cls.name 
      }));

    return {
      registeredClasses,
      unregisteredClasses,
      totalClasses: registeredClasses.length + unregisteredClasses.length,
      hasRegistrations: registeredClasses.length > 0
    };
  };

  // Función para obtener los días programados de una clase
  const getClassScheduleDays = (classId: string): string[] => {
    // Esta función debería obtener los días desde el store de clases
    const classesStore = useClassesStore();
    const classData = classesStore.getClassById?.(classId);
    return classData?.schedule?.slots?.map(slot => slot.day) || [];
  };

  // Función para agregar justificación con archivo
  const addJustificationToAttendance = async (
    studentId: string,
    fecha: string,
    classId: string,
    reason: string,
    _file?: File // TODO: Implementar subida de archivo (prefixed with _ to indicate unused)
  ) => {
    try {
      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;
      
      if (!teacherId) {
        throw new Error('Usuario no autenticado');
      }
      
      // Crear objeto JustificationData
      const justificationData: JustificationData = {
        id: studentId,
        studentId,
        classId,
        fecha,
        reason,
        documentUrl: '', // Se actualizará después de subir el archivo
        approvalStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días desde ahora
      };
      
      // Implementar subida de archivo y guardado de justificación
      await attendanceService.addJustification(fecha, classId, justificationData, teacherId);
      console.log('Justificación guardada correctamente');
    } catch (err) {
      console.error('Error al guardar justificación:', err);
    }
  };

  // Función de debugging avanzado para el sistema de asistencia
  const debugAttendanceSystem = async (date: string, classId: string, teacherId: string) => {
    try {
      console.log('  - ClassId:', classId);
      console.log('  - TeacherId:', teacherId);
      
      if (!teacherId) {
        console.error('❌ No hay teacherId - usuario no autenticado');
        return;
      }
      
      // Probar el método original
      console.log('\n1. Probando método original getAttendanceDocument...');
      const originalResult = await attendanceService.getAttendanceDocument(normalizeDate(date), classId, teacherId);
      console.log('   Resultado:', originalResult ? 'ENCONTRADO' : 'NO ENCONTRADO');
      if (originalResult) {
        console.log('   Documento ID:', originalResult.id);
        console.log('   TeacherId del documento:', originalResult.teacherId);
        console.log('   Datos de asistencia:', {
          presentes: originalResult.data.presentes?.length || 0,
          ausentes: originalResult.data.ausentes?.length || 0,
          tarde: originalResult.data.tarde?.length || 0,
          justificacion: originalResult.data.justificacion?.length || 0
        });
      }
      
      // Probar búsqueda por todos los documentos de la fecha
    
      console.log('\n2. Probando búsqueda por fecha sin filtros...');
      const dateDocuments = await attendanceService.getAttendanceDocumentsByDate(normalizeDate(date));
      console.log(`   Documentos encontrados para la fecha: ${dateDocuments.length}`);
      dateDocuments.forEach((doc, index) => {
        console.log(`   Documento ${index + 1}:`, {
          id: doc.id,
          classId: doc.classId,
          teacherId: doc.teacherId,
          fecha: doc.fecha,
          estudiantesTotal: (doc.data.presentes?.length || 0) + (doc.data.ausentes?.length || 0) + (doc.data.tarde?.length || 0) + (doc.data.justificacion?.length || 0)
        });
      });
      
      // Probar búsqueda por profesor
      console.log('\n3. Probando búsqueda por teacherId...');
      const teacherDocuments = await attendanceService.getAttendanceDocumentsByDate(normalizeDate(date), teacherId);
      console.log(`   Documentos encontrados para el profesor: ${teacherDocuments.length}`);
      teacherDocuments.forEach((doc, index) => {
        console.log(`   Documento ${index + 1}:`, {
          id: doc.id,
          classId: doc.classId,
          teacherId: doc.teacherId,
          esLaClaseCorrecta: doc.classId === classId
        });
      });
      
      // Verificar si existe un documento para esta clase específica del profesor
      const targetDocument = teacherDocuments.find(doc => doc.classId === classId);
      if (targetDocument) {
        console.log('\n✅ DOCUMENTO OBJETIVO ENCONTRADO:');
        console.log('   ID:', targetDocument.id);
        console.log('   Estados de estudiantes:', {
          presentes: targetDocument.data.presentes,
          ausentes: targetDocument.data.ausentes,
          tarde: targetDocument.data.tarde,
          justificados: targetDocument.data.justificacion?.map((j: any) => j.id || j.studentId)
        });
      } else {
        console.log('\n❌ NO SE ENCONTRÓ DOCUMENTO PARA ESTA COMBINACIÓN ESPECÍFICA');
        console.log('   Verificar que existe un documento de asistencia para:');
        console.log('   - Fecha:', normalizeDate(date));
        console.log('   - Clase:', classId);
        console.log('   - Profesor:', teacherId);
      }
      
      console.log('=== FIN DEBUG ===\n');
      
      return {
        originalResult,
        dateDocuments,
        teacherDocuments,
        targetDocument
      };
    } 
    catch (error) {
      console.error('Error en debugging:', error);
      throw error;
    } finally {
      // Intentionally empty finally block to satisfy parser
    }
    
  }

  /**
   * Función para obtener todas las ausencias de un estudiante en un rango de fechas
   */
  const getStudentAbsencesByDateRange = async (studentId: string, startDate: string, endDate: string) => {
    try {
      loading.value = true;
      error.value = null;
      
      console.log(`[Attendance] Fetching absences for student ${studentId} from ${startDate} to ${endDate}`);
      
      // Get all attendance documents in date range
      const attendanceDocs = await fetchAttendanceDocuments(startDate, endDate);
      
      // Filter for absences for this student
      const absences = attendanceDocs.filter(doc => {
        const studentRecord = doc.students?.[studentId];
        return studentRecord && 
               (studentRecord.status === 'Ausente' || 
                studentRecord.status === 'Justificado');
      });
      
      // Format the results
      const result = absences.map(doc => {
        const studentRecord = doc.students?.[studentId];
        if (!studentRecord) return null;
        
        return {
          id: doc.id,
          date: doc.fecha,
          classId: doc.classId,
          status: studentRecord.status,
          reason: studentRecord.justification || null,
          createdAt: doc.createdAt || null
        };
      }).filter(Boolean); // Remove any null entries
      
      console.log(`[Attendance] Found ${result.length} absences for student ${studentId}`);
      return result;
      
    } catch (err) {
      error.value = 'Error fetching student absences';
      console.error('[Attendance] Error in getStudentAbsencesByDateRange:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Obtiene registros de asistencia de un estudiante específico en un rango de fechas
   * usando consulta optimizada a Firestore
   */
  const getStudentAttendanceByDateRange = async (
    studentId: string, 
    startDate: string, 
    endDate: string, 
    classId?: string
  ) => {
    try {
      loading.value = true;
      error.value = null;
      
      console.log(`[Attendance] Fetching attendance for student ${studentId} from ${startDate} to ${endDate}`);
      
      // Usar consulta optimizada por rango de fechas
      const documents = await fetchAttendanceDocuments(startDate, endDate);
      
      // Procesar documentos para extraer registros del estudiante
      const studentRecords: AttendanceRecord[] = [];
      
      documents.forEach(doc => {
        // Verificar si hay filtro de clase
        if (classId && doc.classId !== classId) {
          return;
        }
        
        // Verificar en presentes
        if (doc.data.presentes?.includes(studentId)) {
          studentRecords.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_presente`,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: 'Presente',
            createdAt: doc.createdAt || new Date()
          });
        }
        
        // Verificar en ausentes
        if (doc.data.ausentes?.includes(studentId)) {
          const justification = doc.data.justificacion?.find(j => j.id === studentId);
          studentRecords.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_ausente`,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: justification ? 'Justificado' : 'Ausente',
            justification: justification?.reason,
            createdAt: doc.createdAt || new Date()
          });
        }
        
        // Verificar en tarde
        if (doc.data.tarde?.includes(studentId)) {
          const justification = doc.data.justificacion?.find(j => j.id === studentId);
          studentRecords.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_tarde`,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: justification ? 'Justificado' : 'Tardanza',
            justification: justification?.reason,
            createdAt: doc.createdAt || new Date()
          });
        }
      });
      
      // Ordenar por fecha (más reciente primero)
      studentRecords.sort((a, b) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });
      
      console.log(`[Attendance] Found ${studentRecords.length} records for student ${studentId}`);
      return studentRecords;
      
    } catch (err) {
      error.value = 'Error fetching student attendance by date range';
      console.error('[Attendance] Error in getStudentAttendanceByDateRange:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Función para obtener todas las observaciones de un maestro
   * Usa el servicio de attendance para obtener observaciones estructuradas
   */
  const fetchAllObservationsForTeacher = async (teacherId: string, classId?: string, force = false) => {
    try {
      loading.value = true;
      error.value = null;
      const cacheKey = classId ? `${teacherId}_${classId}` : `${teacherId}_ALL`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
      const now = Date.now();

      // Si hay datos en caché y no han expirado, usarlos
      if (!force && observationsCache.value[cacheKey] && (now - observationsCache.value[cacheKey].lastFetch < CACHE_TTL)) {
        observationsHistory.value = observationsCache.value[cacheKey].data;
        console.log(`[AttendanceStore] Usando observaciones cacheadas para ${cacheKey}`);
        return observationsCache.value[cacheKey].data;
      }

      console.log(`[AttendanceStore] Fetching all observations for teacher: ${teacherId}${classId ? ', class: ' + classId : ''}`);
      // Obtener todas las observaciones usando el servicio mejorado
      const allDocuments = await attendanceService.findAttendanceDocuments({
        teacherId: teacherId,
        ...(classId ? { classId } : {})
      });
      console.log(`[AttendanceStore] Found ${allDocuments.length} attendance documents for teacher`);
      const allObservations: ClassObservation[] = [];
      for (const doc of allDocuments) {
        try {
          const structuredObs = await attendanceService.getStructuredObservations(
            doc.fecha, 
            doc.classId, 
            teacherId
          );
          const classObservations: ClassObservation[] = structuredObs.map(obs => ({
            id: obs.id || `obs-${Date.now()}-${Math.random()}`,
            classId: doc.classId,
            date: doc.fecha, // Campo obligatorio
            fecha: doc.fecha,
            type: (obs.type as 'general' | 'comportamiento' | 'logro' | 'contenido' | 'dinamica') || 'general',
            content: {
              text: obs.content || '',
              bulletPoints: [],
              taggedStudents: obs.tags || [],
              works: [],
              classDynamics: []
            },
            author: obs.author,
            authorId: teacherId, // Campo obligatorio
            createdAt: obs.timestamp || new Date(),
            updatedAt: obs.timestamp || new Date(),
            priority: 'media' as const,
            requiresFollowUp: false,
            text: obs.content || '' // Campo obligatorio
          }));
          allObservations.push(...classObservations);
        } catch (obsError) {
          console.warn(`[AttendanceStore] Error processing observations for document ${doc.id}:`, obsError);
          if (doc.data.observación && typeof doc.data.observación === 'string') {
            const legacyObservation: ClassObservation = {
              id: `legacy-${doc.id}`,
              classId: doc.classId,
              date: doc.fecha, // Campo obligatorio
              fecha: doc.fecha,
              type: 'general',
              content: {
                text: doc.data.observación,
                bulletPoints: [],
                taggedStudents: [],
                works: [],
                classDynamics: []
              },
              author: teacherId,
              authorId: teacherId, // Campo obligatorio
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date(),
              priority: 'media',
              requiresFollowUp: false,
              text: doc.data.observación // Campo obligatorio
            };
            allObservations.push(legacyObservation);
          }
        }
      }
      console.log(`[AttendanceStore] Processed ${allObservations.length} total observations`);
      // Actualizar el estado y el caché
      observationsHistory.value = allObservations;
      observationsCache.value[cacheKey] = {
        data: allObservations,
        lastFetch: now
      };
      return allObservations;
    } catch (err) {
      error.value = 'Error al cargar el historial de observaciones del maestro';
      console.error('[AttendanceStore] Error in fetchAllObservationsForTeacher:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Función para obtener todas las observaciones de una clase específica
   * Obtiene observaciones de TODOS los profesores para esa clase
   */
  const fetchObservationsForClass = async (classId: string, force = false) => {
    try {
      loading.value = true;
      error.value = null;
      const cacheKey = `CLASS_${classId}`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
      const now = Date.now();

      // Si hay datos en caché y no han expirado, usarlos
      if (!force && observationsCache.value[cacheKey] && (now - observationsCache.value[cacheKey].lastFetch < CACHE_TTL)) {
        const cachedData = observationsCache.value[cacheKey].data;
        console.log(`[AttendanceStore] Usando observaciones cacheadas para clase ${classId}:`, cachedData);
        return cachedData;
      }

      console.log(`[AttendanceStore] Fetching ALL observations for class: ${classId}`);
      
      // Obtener todas las observaciones de la clase usando el servicio mejorado
      const allDocuments = await attendanceService.findAttendanceDocuments({
        classId: classId
        // No filtrar por teacherId para obtener observaciones de todos los profesores
      });
      
      console.log(`[AttendanceStore] Found ${allDocuments.length} attendance documents for class ${classId}`);
      
      const allObservations: ClassObservation[] = [];
      for (const doc of allDocuments) {
        try {
          const structuredObs = await attendanceService.getStructuredObservations(
            doc.fecha, 
            doc.classId, 
            doc.teacherId
          );
          if (structuredObs && Array.isArray(structuredObs)) {
            // Transformar las observaciones estructuradas para cumplir con la interfaz ClassObservation
            const transformedObs: ClassObservation[] = structuredObs.map(obs => ({
              id: obs.id || `${doc.fecha}-${doc.classId}-${Date.now()}`,
              classId: obs.classId || doc.classId,
              date: obs.fecha || doc.fecha, // Campo obligatorio
              fecha: obs.fecha || doc.fecha, // Compatibilidad
              type: obs.type || 'general',
              content: obs.content || { text: obs.text || '' },
              author: obs.author || 'Usuario del Sistema',
              authorId: obs.authorId || doc.teacherId || 'sistema', // Campo obligatorio
              authorName: obs.author || 'Usuario del Sistema',
              createdAt: obs.createdAt || new Date(),
              updatedAt: obs.updatedAt || new Date(),
              priority: obs.priority || 'media',
              requiresFollowUp: obs.requiresFollowUp || false,
              text: obs.content?.text || obs.text || '', // Campo obligatorio
              studentId: obs.studentId,
              studentName: obs.studentName,
              tags: obs.tags,
              images: obs.images || []
            }));
            allObservations.push(...transformedObs);
          }
        } catch (obsErr) {
          console.warn(`[AttendanceStore] Error getting observations from document ${doc.fecha}-${doc.classId}-${doc.teacherId}:`, obsErr);
          // Continuar con el siguiente documento en caso de error
        }
      }

      // Ordenar por fecha/hora de creación
      allObservations.sort((a, b) => {
        const getDate = (obs: ClassObservation): Date => {
          if (obs.createdAt) {
            if (typeof obs.createdAt === 'string') return new Date(obs.createdAt);
            if (obs.createdAt instanceof Date) return obs.createdAt;
            if (typeof obs.createdAt === 'object' && 'seconds' in obs.createdAt) {
              return new Date((obs.createdAt as any).seconds * 1000);
            }
          }
          if (obs.fecha) return new Date(obs.fecha);
          return new Date();
        };
        return getDate(b).getTime() - getDate(a).getTime();
      });

      console.log(`[AttendanceStore] Successfully processed ${allObservations.length} total observations for class ${classId}`);

      // Guardar en caché
      observationsCache.value[cacheKey] = {
        data: allObservations,
        lastFetch: now
      };

      return allObservations;
    } catch (err) {
      error.value = 'Error al cargar las observaciones de la clase';
      console.error('[AttendanceStore] Error in fetchObservationsForClass:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTopAbsentStudentsByRange = async(
    startDate: string,
    endDate: string,
    limit: number,
    classId?: string
  ): Promise<Array<{ studentId: string; studentName: string; absences: number; percentage: number; totalPossibleClasses: number }>> => {
    loading.value = true;
    error.value = null;
    try {
      console.log(`[AttendanceStore] Fetching top absent students for range: ${startDate} - ${endDate}, class: ${classId || 'all'}, limit: ${limit}`);
      const normalizedStartDate = normalizeDate(startDate);
      const normalizedEndDate = normalizeDate(endDate);

      let queryRef = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('fecha', '>=', normalizedStartDate),
        where('fecha', '<=', normalizedEndDate)
      );

      if (classId) {
        queryRef = query(queryRef, where('classId', '==', classId));
      }

      const querySnapshot = await getDocs(queryRef);
      const attendanceDocs: AttendanceDocument[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        attendanceDocs.push({ id: doc.id, ...doc.data() } as AttendanceDocument);
      });

      console.log(`[AttendanceStore] Found ${attendanceDocs.length} attendance documents for the range.`);

      const studentAbsenceMap: Map<string, { absences: number; totalPossibleClasses: number }> = new Map();
      const classDatesMap = new Map<string, Set<string>>(); // classId -> Set<date>

      attendanceDocs.forEach(doc => {
        if (!classDatesMap.has(doc.classId)) {
          classDatesMap.set(doc.classId, new Set());
        }
        classDatesMap.get(doc.classId)!.add(doc.fecha);

        doc.data.ausentes?.forEach(studentId => {
          const current = studentAbsenceMap.get(studentId) || { absences: 0, totalPossibleClasses: 0 };
          studentAbsenceMap.set(studentId, { ...current, absences: current.absences + 1 });
        });
      });
      
      let totalUniqueClassSessions = 0;
      classDatesMap.forEach(dates => {
        totalUniqueClassSessions += dates.size;
      });

      studentAbsenceMap.forEach((stats, studentId) => {
          if (classId && classDatesMap.has(classId)) {
             studentAbsenceMap.set(studentId, { ...stats, totalPossibleClasses: classDatesMap.get(classId)!.size });
          } else if (!classId) {
            // If no specific classId, this is complex. For now, use total sessions as a proxy.
            // This needs refinement based on actual student enrollment per class.
            studentAbsenceMap.set(studentId, { ...stats, totalPossibleClasses: totalUniqueClassSessions });
          } else {
            // classId provided, but no records for it, so student couldn't have attended.
            studentAbsenceMap.set(studentId, { ...stats, totalPossibleClasses: 0 });
          }
      });

      const studentsStore = useStudentsStore();
      const topAbsentees = Array.from(studentAbsenceMap.entries())
        .map(([studentId, stats]) => {
          const student = studentsStore.getStudentById(studentId);
          const studentName = student ? `${student.nombre} ${student.apellido}` : 'Unknown Student';
          const percentage = stats.totalPossibleClasses > 0 ? (stats.absences / stats.totalPossibleClasses) * 100 : 0;
          return {
            studentId,
            studentName,
            absences: stats.absences,
            percentage: parseFloat(percentage.toFixed(2)),
            totalPossibleClasses: stats.totalPossibleClasses
          };
        })
        .filter(s => s.absences > 0)
        .sort((a, b) => b.absences - a.absences || b.percentage - a.percentage)
        .slice(0, limit);

      console.log('[AttendanceStore] Top absent students:', topAbsentees);
      return topAbsentees;
    } catch (err) {
      console.error('[AttendanceStore] Error in fetchTopAbsentStudentsByRange:', err);
      error.value = 'Error al calcular los estudiantes más ausentes.';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // Estado
    attendanceRecords,
    records,
    observations,
    observationsHistory,
    justifications,
    loading,
    error,
    selectedDate,
    selectedClass,
    attendanceDocuments,
    currentAttendanceDoc,
    datesWithRecords,
    analytics,

    // Getters
    getAttendanceByDateAndClass,
    getObservationsByClass,
    getJustificationsByStudent,
    dateAttendanceStatuses,
    getObservations,

    // Acciones
    fetchAttendance,
    fetchAttendanceDocuments,
    fetchAttendanceDocument,
    getStudentAbsencesByDateRange,
    loadAttendanceDataForCalendar,
    addObservationToHistory,
    addJustification,
    fetchClassObservations,
    updateClassObservation,
    fetchAllObservationsForTeacher,
    fetchObservationsForClass,
    fetchJustifications,
    validateAttendanceDate,
    updateAnalytics,
    saveAttendanceDocument,
    updateObservations,
    fetchAllAttendanceDates,
    isClassRegistered,
    checkAttendanceExists,
    getRegisteredClassesForDate,
    getClassStats,
    getDateClassInfo,
    getClassScheduleDays,
    addJustificationToAttendance,
    debugAttendanceSystem,
    fetchTopAbsentStudentsByRange,
    getStudentAttendanceByDateRange
  };
});
