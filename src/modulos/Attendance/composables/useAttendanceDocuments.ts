// src/modulos/Attendance/composables/useAttendanceDocuments.ts
import { ref, computed } from 'vue';
import { format, parseISO, isValid } from 'date-fns';

import attendanceService from '../service/attendanceService';
import { useAuthStore } from '../../../stores/auth';
import { useClassesStore } from '../../Classes/store/classes'; 

import type { AttendanceDocument, AttendanceRecord, AttendanceStatus } from '../types/attendance';

export function useAttendanceDocuments() {
  const attendanceDocuments = ref<AttendanceDocument[]>([]);
  const currentAttendanceDoc = ref<AttendanceDocument | null>(null);
  const datesWithRecords = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const getAttendanceByDateAndClass = computed(() => {
    return (fecha: string, classId: string) => {
      const doc = attendanceDocuments.value.find(
        (doc) => doc.fecha === fecha && doc.classId === classId,
      );
      return doc ? [doc] : [];
    };
  });

  const dateAttendanceStatuses = computed(() => {
    const statusMap = new Map<string, { type: string; count: number }>();

    attendanceDocuments.value.forEach((doc) => {
      if (doc.fecha) {
        const status = statusMap.get(doc.fecha) || { type: 'attendance', count: 0 };
        status.count++;
        statusMap.set(doc.fecha, status);
      }
    });

    return Object.fromEntries(statusMap);
  });

  // Utility function (could be in a separate utils file)
  const normalizeDate = (date: string | undefined | null): string => {
    try {
      if (!date || typeof date !== 'string') {
        throw new Error('Fecha es nula, indefinida o no es string');
      }
      const cleanDate = date.trim();
      if (!cleanDate) {
        throw new Error('Fecha vacía después de limpiar espacios');
      }
      if (/^\d{8}$/.test(cleanDate)) {
        return `${cleanDate.substring(0, 4)}-${cleanDate.substring(4, 6)}-${cleanDate.substring(6, 8)}`;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        return cleanDate;
      }
      const dateObj = parseISO(cleanDate);
      if (isValid(dateObj)) {
        return format(dateObj, 'yyyy-MM-dd');
      }
      throw new Error(`Formato de fecha inválido: "${cleanDate}"`);
    } catch (error) {
      console.error('Error al normalizar fecha:', error);
      console.error('Valor recibido:', date, 'Tipo:', typeof date);
      throw error;
    }
  };

  const fetchAttendanceDocuments = async (startDate?: string, endDate?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;

      if (!teacherId) {
        throw new Error('No hay usuario autenticado');
      }

      let documents: AttendanceDocument[] = [];

      if (startDate && endDate) {
        documents = await attendanceService.getAttendanceDocumentsByDateRange(
          startDate,
          endDate,
          teacherId,
        );
      } else {
        const registeredDates = await attendanceService.getRegisteredAttendanceDates(teacherId);
        const validDates = registeredDates.filter((date) => {
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
          const promises = validDates.map((date) =>
            attendanceService.getAttendanceDocumentsByDate(date, teacherId),
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
      const debugEnabled =
        typeof window !== 'undefined' && window.localStorage.getItem('attendance-debug') === 'true';

      if (debugEnabled) {
        console.log(
          '[AttendanceDebug] fetchAttendanceDocument: Buscando documento para fecha:',
          formattedDate,
          'clase:',
          classId,
        );
      }

      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;

      if (!teacherId) {
        throw new Error('No hay usuario autenticado para cargar asistencia');
      }

      if (debugEnabled) {
        console.log('[AttendanceDebug] fetchAttendanceDocument: TeacherId:', teacherId);
      }

      const document = await attendanceService.getAttendanceDocument(
        formattedDate,
        classId,
        teacherId,
      );

      if (document) {
        if (debugEnabled) {
          console.log(
            '[AttendanceDebug] fetchAttendanceDocument: Documento encontrado:',
            JSON.parse(JSON.stringify(document)),
          );
        }

        if (document.teacherId !== teacherId) {
          console.warn(
            '[AttendanceDebug] fetchAttendanceDocument: Documento pertenece a otro profesor:',
            document.teacherId,
            'vs',
            teacherId,
          );
          currentAttendanceDoc.value = null;
          return null;
        }

        currentAttendanceDoc.value = document;
        return document;
      } else {
        if (debugEnabled) {
          console.log(
            '[AttendanceDebug] fetchAttendanceDocument: No se encontró documento - limpiando datos',
          );
        }
        currentAttendanceDoc.value = null;
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

      await fetchAttendanceDocuments(startDate, endDate);

      return Object.entries(dateAttendanceStatuses.value).map(([date, status]) => ({
        date,
        type: status.type,
        count: status.count,
      }));
    } catch (err) {
      error.value = 'Error al cargar los datos de asistencia';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const saveAttendanceDocument = async (attendanceDoc: AttendanceDocument): Promise<string> => {
    try {
      loading.value = true;
      error.value = null;

      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;

      if (!teacherId) {
        throw new Error('Usuario no autenticado');
      }

      const documentToSave = {
        ...attendanceDoc,
        teacherId,
        uid: teacherId,
      };

      const docId = await attendanceService.saveAttendanceDocument(documentToSave);

      const existingIndex = attendanceDocuments.value.findIndex(
        (doc) => doc.fecha === attendanceDoc.fecha && doc.classId === attendanceDoc.classId,
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

  const updateObservations = async (
    fecha: string,
    classId: string,
    observations: string,
  ): Promise<string> => {
    try {
      loading.value = true;
      error.value = null;

      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;

      if (!teacherId) {
        throw new Error('Usuario no autenticado');
      }

      const docId = await attendanceService.updateObservations(
        fecha,
        classId,
        observations,
      );

      const existingIndex = attendanceDocuments.value.findIndex(
        (doc) => doc.fecha === fecha && doc.classId === classId,
      );

      if (existingIndex !== -1) {
        if (!attendanceDocuments.value[existingIndex].data.observación) {
          attendanceDocuments.value[existingIndex].data.observación = [];
        }
        if (Array.isArray(attendanceDocuments.value[existingIndex].data.observación)) {
          ;(attendanceDocuments.value[existingIndex].data.observación as any[]).push({
            text: observations,
            timestamp: new Date().toISOString(),
            author: authStore.user?.displayName || authStore.user?.email || 'Usuario',
          });
        } else {
          attendanceDocuments.value[existingIndex].data.observación = [observations];
        }
      } else {
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
            observación: [observations],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
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

  const saveAttendanceAndObservations = async (
    attendanceDoc: AttendanceDocument,
    observations: string
  ): Promise<string> => {
    try {
      loading.value = true;
      error.value = null;

      const docId = await saveAttendanceDocument(attendanceDoc);

      if (observations && observations.trim() !== '') {
        await updateObservations(attendanceDoc.fecha, attendanceDoc.classId, observations);
      }

      return docId;
    } catch (err) {
      error.value = 'Error al guardar asistencia y observaciones';
      console.error('Error en saveAttendanceAndObservations:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

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

  const isClassRegistered = (fecha: string, classId: string): boolean => {
    return attendanceDocuments.value.some((doc) => doc.fecha === fecha && doc.classId === classId);
  };

  const checkAttendanceExists = async (fecha: string, classId: string): Promise<boolean> => {
    try {
      console.log(
        `[AttendanceStore] Verificando existencia de registro para fecha ${fecha} y clase ${classId}`,
      );
      const existsInStore = isClassRegistered(fecha, classId);
      if (existsInStore) {
        console.log('[AttendanceStore] Registro encontrado en el store local');
        return true;
      }

      // Assuming ATTENDANCE_COLLECTION and db are accessible or passed
      // For now, directly call the service
      const exists = await attendanceService.checkAttendanceExists(fecha, classId);
      console.log(
        `[AttendanceStore] Verificación en Firestore: ${exists ? 'Registro encontrado' : 'No hay registro'}`,
      );
      return exists;
    } catch (error) {
      console.error('Error al verificar existencia de registro de asistencia:', error);
      return false;
    }
  };

  const getRegisteredClassesForDate = (fecha: string): string[] => {
    return attendanceDocuments.value.filter((doc) => doc.fecha === fecha).map((doc) => doc.classId);
  };

  const getDateClassInfo = (fecha: string, teacherId: string) => {
    const normalizedDate = fecha.replace(/\//g, '-');

    const registeredClasses = attendanceDocuments.value
      .filter((doc) => doc.fecha === normalizedDate && doc.teacherId === teacherId)
      .map((doc) => ({
        classId: doc.classId,
        hasRecord: true,
        document: doc,
      }));

    const classesStore = useClassesStore();
    const allTeacherClasses = classesStore.getClassesByTeacherId?.(teacherId) || [];

    const registeredClassIds = registeredClasses.map((rc) => rc.classId);
    const unregisteredClasses = allTeacherClasses
      .filter((cls) => !registeredClassIds.includes(cls.id || cls.name))
      .map((cls) => ({
        classId: cls.id || cls.name,
        hasRecord: false,
        className: cls.name,
      }));

    return {
      registeredClasses,
      unregisteredClasses,
      totalClasses: registeredClasses.length + unregisteredClasses.length,
      hasRegistrations: registeredClasses.length > 0,
    };
  };

  const fetchAttendanceDocumentsByTeacher = async (
    teacherId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    try {
      loading.value = true;
      error.value = null;

      if (!teacherId) {
        throw new Error('teacherId es requerido');
      }

      console.log(`🔍 Obteniendo documentos de asistencia para profesor: ${teacherId}`);

      let documents: AttendanceDocument[] = [];

      if (startDate && endDate) {
        console.log(`📅 Rango de fechas: ${startDate} a ${endDate}`);
        documents = await attendanceService.getAttendanceDocumentsByDateRange(
          startDate,
          endDate,
          teacherId,
        );
      } else {
        console.log('📅 Obteniendo todas las fechas registradas para el profesor');
        const registeredDates = await attendanceService.getRegisteredAttendanceDates(teacherId);

        const validDates = registeredDates.filter((date) => {
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
          const promises = validDates.map((date) =>
            attendanceService.getAttendanceDocumentsByDate(date, teacherId),
          );
          const results = await Promise.all(promises);
          documents = results.flat();
        }
      }

      console.log(`📄 Documentos obtenidos: ${documents.length}`);

      if (documents.length > 0) {
        console.log(
          '📊 Primeros 3 documentos:',
          documents.slice(0, 3).map((doc) => ({
            id: doc.id,
            fecha: doc.fecha,
            classId: doc.classId,
            teacherId: doc.teacherId || doc.uid,
          })),
        );
      }

      return documents;
    } catch (err) {
      const errorMessage = `Error al cargar documentos de asistencia para profesor ${teacherId}`;
      error.value = errorMessage;
      console.error('❌', errorMessage, err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Functions related to emergency classes (will keep here for now, might move later)
  // Assuming getEmergencyClassByIdFirebase is available globally or passed
  // For now, I'll assume it's imported from a service
  // import { getEmergencyClassByIdFirebase } from '../../Classes/service/classes'; // Placeholder, adjust path

  const getEmergencyClassStudents = async (emergencyClassId: string): Promise<string[]> => {
    try {
      console.log('[AttendanceStore] Obteniendo estudiantes de clase emergente:', emergencyClassId);

      const emergencyDoc = attendanceDocuments.value.find(
        (doc) =>
          doc.emergencyClassId === emergencyClassId ||
          (doc.isEmergencyClass && doc.classId === emergencyClassId),
      );

      if (emergencyDoc) {
        console.log('[AttendanceStore] Encontrado en documentos de asistencia:', emergencyDoc);
        const allStudents = [
          ...(emergencyDoc.data.presentes || []),
          ...(emergencyDoc.data.ausentes || []),
          ...(emergencyDoc.data.tarde || []),
          ...(emergencyDoc.data.justificacion?.map((j) => j.studentId) || []),
        ];
        return [...new Set(allStudents)];
      }

      let emergencyClassStudents: string[] = [];
      // Placeholder for actual import
      // const { getEmergencyClassByIdFirebase } = await import('../../Classes/service/classes');
      // try {
      //   const emergencyClass = await getEmergencyClassByIdFirebase(emergencyClassId);
      //   if (emergencyClass && emergencyClass.selectedStudents) {
      //     console.log(
      //       '[AttendanceStore] Estudiantes encontrados en EMERGENCY_CLASSES:',
      //       emergencyClass.selectedStudents,
      //     );
      //     emergencyClassStudents = emergencyClass.selectedStudents;
      //     return emergencyClassStudents;
      //   }
      // } catch (err) {
      //   console.warn(
      //     '[AttendanceStore] No se pudo obtener clase emergente de EMERGENCY_CLASSES:',
      //     err,
      //   );
      // }

      console.log(
        '[AttendanceStore] No se encontraron estudiantes para la clase emergente:',
        emergencyClassId,
      );
      return [];
    } catch (err) {
      console.error('[AttendanceStore] Error al obtener estudiantes de clase emergente:', err);
      return [];
    }
  };

  const isEmergencyClass = async (classId: string): Promise<boolean> => {
    try {
      // Placeholder for actual import
      // const { getEmergencyClassByIdFirebase } = await import('../../Classes/service/classes');
      // try {
      //   const emergencyClass = await getEmergencyClassByIdFirebase(classId);
      //   if (emergencyClass) {
      //     console.log(
      //       '[AttendanceStore] Clase emergente confirmada desde EMERGENCY_CLASSES:',
      //       classId,
      //     );
      //     return true;
      //   }
      // } catch (err) {
      //   console.log(
      //     '[AttendanceStore] No encontrado en EMERGENCY_CLASSES para verificación:',
      //     (err as Error).message || err,
      //   );
      // }

      const hasEmergencyDoc = attendanceDocuments.value.some(
        (doc) =>
          doc.isEmergencyClass === true &&
          (doc.classId === classId || doc.emergencyClassId === classId),
      );

      if (hasEmergencyDoc) {
        console.log(
          '[AttendanceStore] Clase emergente confirmada desde documentos de asistencia:',
          classId,
        );
        return true;
      }

      return false;
    } catch (err) {
      console.error('[AttendanceStore] Error verificando si es clase emergente:', err);
      return false;
    }
  };

  const getClassInfo = async (classId: string, date?: string) => {
    try {
      console.log('[AttendanceStore] Obteniendo información para clase:', classId, 'fecha:', date);

      // Placeholder for actual import
      // const { getEmergencyClassByIdFirebase } = await import('../../Classes/service/classes');
      // try {
      //   const emergencyClass = await getEmergencyClassByIdFirebase(classId);
      //   if (emergencyClass) {
      //     console.log(
      //       '[AttendanceStore] Clase emergente encontrada en EMERGENCY_CLASSES:',
      //       emergencyClass,
      //     );
      //     return {
      //       id: classId,
      //       name: emergencyClass.className,
      //       type: 'emergency',
      //       isEmergencyClass: true,
      //       students: emergencyClass.selectedStudents || [],
      //       teacherId: emergencyClass.teacherId,
      //       studentIds: emergencyClass.selectedStudents || [],
      //     };
      //   }
      // } catch (err) {
      //   console.log(
      //     '[AttendanceStore] No encontrado en EMERGENCY_CLASSES, verificando otras fuentes:',
      //     (err as Error).message || err,
      //   );
      // }

      const emergencyDoc = attendanceDocuments.value.find(
        (doc) =>
          doc.isEmergencyClass === true &&
          (doc.classId === classId || doc.emergencyClassId === classId),
      );

      if (emergencyDoc) {
        return {
          id: classId,
          name: emergencyDoc.classId, // Or a more descriptive name if available
          type: 'emergency',
          isEmergencyClass: true,
          students: [
            ...(emergencyDoc.data.presentes || []),
            ...(emergencyDoc.data.ausentes || []),
            ...(emergencyDoc.data.tarde || []),
            ...(emergencyDoc.data.justificacion?.map((j) => j.studentId) || []),
          ],
          teacherId: emergencyDoc.teacherId,
          studentIds: [
            ...(emergencyDoc.data.presentes || []),
            ...(emergencyDoc.data.ausentes || []),
            ...(emergencyDoc.data.tarde || []),
            ...(emergencyDoc.data.justificacion?.map((j) => j.studentId) || []),
          ],
        };
      }

      // Fallback to regular class info if not an emergency class
      // This part would typically come from a classes store/service
      // For now, return null or throw error if not found
      return null; // Or throw new Error('Class not found');
    } catch (err) {
      console.error('[AttendanceStore] Error obteniendo información de clase:', err);
      throw err;
    }
  };


  return {
    attendanceDocuments,
    currentAttendanceDoc,
    datesWithRecords,
    loading,
    error,
    getAttendanceByDateAndClass,
    dateAttendanceStatuses,
    fetchAttendanceDocuments,
    fetchAttendanceDocument,
    loadAttendanceDataForCalendar,
    saveAttendanceDocument,
    updateObservations,
    saveAttendanceAndObservations,
    fetchAllAttendanceDates,
    isClassRegistered,
    checkAttendanceExists,
    getRegisteredClassesForDate,
    getDateClassInfo,
    fetchAttendanceDocumentsByTeacher,
    getEmergencyClassStudents,
    isEmergencyClass,
    getClassInfo,
    normalizeDate, // Export normalizeDate as it's a utility used by other functions
  };
}
