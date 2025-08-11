// src/modulos/Attendance/composables/useAttendanceObservations.ts
import { ref, computed } from 'vue';
import attendanceService from '../service/attendanceService';
import type { ClassObservation, ClassObservationData, AttendanceDocument } from '../types/attendance';

export function useAttendanceObservations() {
  const observations = ref<ClassObservation[]>([]);
  const observationsHistory = ref<ClassObservation[]>([]);
  const observationsCache = ref<Record<string, { data: ClassObservation[]; lastFetch: number }>>({});

  const getObservationsByClass = computed(() => {
    return (classId: string, fecha?: string) => {
      return observations.value.filter(
        (obs) => obs.classId === classId && (!fecha || obs.fecha === fecha),
      );
    };
  });

  const addObservationToHistory = async (
    observation: Omit<ClassObservation, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    try {
      // Assuming addClassObservationFirebase is part of attendanceService or a new firebase service
      // For now, I'll use a placeholder or assume it's handled by attendanceService
      // await attendanceService.addClassObservationFirebase(observation);
      console.warn('addObservationToHistory: Placeholder for Firebase call');
      // Simulate adding to local state
      const newObservation = { ...observation, id: `temp-obs-${Date.now()}` } as ClassObservation;
      observations.value.push(newObservation);
      return newObservation;
    } catch (err) {
      console.error('Error al agregar la observación:', err);
      throw err;
    }
  };

  const fetchClassObservations = async (classId: string, date?: string) => {
    try {
      // Assuming getClassObservationsFirebase is part of attendanceService
      // const fetchedObservations = await attendanceService.getClassObservationsFirebase(classId, date);
      console.warn('fetchClassObservations: Placeholder for Firebase call');
      const fetchedObservations: ClassObservation[] = []; // Simulate empty fetch
      observations.value = fetchedObservations;
      return fetchedObservations;
    } catch (err) {
      console.error('Error al cargar las observaciones:', err);
      throw err;
    }
  };

  const updateClassObservation = async (observation: ClassObservation) => {
    try {
      // Assuming updateClassObservationFirebase is part of attendanceService
      // const updatedObservation = await attendanceService.updateClassObservationFirebase(observation);
      console.warn('updateClassObservation: Placeholder for Firebase call');
      const updatedObservation = { ...observation } as ClassObservation; // Simulate update

      const index = observations.value.findIndex((obs) => obs.id === observation.id);
      if (index !== -1) {
        observations.value[index] = updatedObservation;
      }

      return updatedObservation;
    } catch (err) {
      console.error('Error al actualizar la observación:', err);
      throw err;
    }
  };

  const deleteObservation = async (observationId: string) => {
    try {
      // Assuming deleteClassObservationFirebase is part of attendanceService
      // await attendanceService.deleteClassObservationFirebase(observationId);
      console.warn('deleteObservation: Placeholder for Firebase call');
      observations.value = observations.value.filter((obs) => obs.id !== observationId);
      return true;
    } catch (err) {
      console.error('Error al eliminar la observación:', err);
      throw err;
    }
  };

  const fetchAllObservationsForTeacher = async (
    teacherId: string,
    classId?: string,
    force = false,
  ) => {
    try {
      const cacheKey = classId ? `${teacherId}_${classId}` : `${teacherId}_ALL`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
      const now = Date.now();

      if (
        !force &&
        observationsCache.value[cacheKey] &&
        now - observationsCache.value[cacheKey].lastFetch < CACHE_TTL
      ) {
        observationsHistory.value = observationsCache.value[cacheKey].data;
        console.log(`[useAttendanceObservations] Usando observaciones cacheadas para ${cacheKey}`);
        return observationsCache.value[cacheKey].data;
      }

      console.log(
        `[useAttendanceObservations] Fetching all observations for teacher: ${teacherId}${classId ? ', class: ' + classId : ''}`,
      );
      const allDocuments = await attendanceService.findAttendanceDocuments({
        teacherId,
        ...(classId ? { classId } : {}),
      });
      console.log(`[useAttendanceObservations] Found ${allDocuments.length} attendance documents for teacher`);
      const allObservations: ClassObservation[] = [];
      for (const doc of allDocuments) {
        try {
          const structuredObs = await attendanceService.getStructuredObservations(
            doc.fecha,
            doc.classId,
            teacherId,
          );
          const classObservations: ClassObservation[] = structuredObs.map((obs) => ({
            id: obs.id || `obs-${Date.now()}-${Math.random()}`,
            classId: doc.classId,
            date: doc.fecha,
            fecha: doc.fecha,
            type:
              (obs.type as 'general' | 'comportamiento' | 'logro' | 'contenido' | 'dinamica') ||
              'general',
            content: {
              text: obs.content || '',
              bulletPoints: [],
              taggedStudents: obs.tags || [],
              works: [],
              classDynamics: [],
            },
            author: obs.author,
            authorId: teacherId,
            createdAt: obs.timestamp || new Date(),
            updatedAt: obs.timestamp || new Date(),
            priority: 'media' as const,
            requiresFollowUp: false,
            text: obs.content || '',
          }));
          allObservations.push(...classObservations);
        } catch (obsError) {
          console.warn(
            `[useAttendanceObservations] Error processing observations for document ${doc.id}:`,
            obsError,
          );
          if (doc.data.observación && typeof doc.data.observación === 'string') {
            const legacyObservation: ClassObservation = {
              id: `legacy-${doc.id}`,
              classId: doc.classId,
              date: doc.fecha,
              fecha: doc.fecha,
              type: 'general',
              content: {
                text: doc.data.observación,
                bulletPoints: [],
                taggedStudents: [],
                works: [],
                classDynamics: [],
              },
              author: teacherId,
              authorId: teacherId,
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date(),
              priority: 'media',
              requiresFollowUp: false,
              text: doc.data.observación,
            };
            allObservations.push(legacyObservation);
          }
        }
      }
      console.log(`[useAttendanceObservations] Processed ${allObservations.length} total observations`);
      observationsHistory.value = allObservations;
      observationsCache.value[cacheKey] = {
        data: allObservations,
        lastFetch: now,
      };
      return allObservations;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchObservationsForClass = async (classId: string, force = false) => {
    try {
      const cacheKey = `CLASS_${classId}`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
      const now = Date.now();

      if (
        !force &&
        observationsCache.value[cacheKey] &&
        now - observationsCache.value[cacheKey].lastFetch < CACHE_TTL
      ) {
        const cachedData = observationsCache.value[cacheKey].data;
        console.log(
          `[useAttendanceObservations] Usando observaciones cacheadas para clase ${classId}:`,
          cachedData,
        );
        return cachedData;
      }

      console.log(`[useAttendanceObservations] Fetching ALL observations for class: ${classId}`);

      const allDocuments = await attendanceService.findAttendanceDocuments({
        classId,
      });

      console.log(
        `[useAttendanceObservations] Found ${allDocuments.length} attendance documents for class ${classId}`,
      );

      const allObservations: ClassObservation[] = [];
      for (const doc of allDocuments) {
        try {
          const structuredObs = await attendanceService.getStructuredObservations(
            doc.fecha,
            doc.classId,
            doc.teacherId,
          );
          if (structuredObs && Array.isArray(structuredObs)) {
            const transformedObs: ClassObservation[] = structuredObs.map((obs) => ({
              id: obs.id || `${doc.fecha}-${doc.classId}-${Date.now()}`,
              classId: obs.classId || doc.classId,
              date: obs.fecha || doc.fecha,
              fecha: obs.fecha || doc.fecha,
              type: obs.type || 'general',
              content: obs.content || { text: obs.text || '' },
              author: obs.author || 'Usuario del Sistema',
              authorId: obs.authorId || doc.teacherId || 'sistema',
              authorName: obs.author || 'Usuario del Sistema',
              createdAt: obs.createdAt || new Date(),
              updatedAt: obs.updatedAt || new Date(),
              priority: obs.priority || 'media',
              requiresFollowUp: obs.requiresFollowUp || false,
              text: obs.content?.text || obs.text || '',
              studentId: obs.studentId,
              studentName: obs.studentName,
              tags: obs.tags,
              images: obs.images || [],
            }));
            allObservations.push(...transformedObs);
          }
        } catch (obsErr) {
          console.warn(
            `[useAttendanceObservations] Error getting observations from document ${doc.fecha}-${doc.classId}-${doc.teacherId}:`,
            obsErr,
          );
        }
      }

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

      console.log(
        `[useAttendanceObservations] Successfully processed ${allObservations.length} total observations for class ${classId}`,
      );

      observationsCache.value[cacheKey] = {
        data: allObservations,
        lastFetch: now,
      };

      return allObservations;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    observations,
    observationsHistory,
    observationsCache,
    getObservationsByClass,
    addObservationToHistory,
    fetchClassObservations,
    updateClassObservation,
    deleteObservation,
    fetchAllObservationsForTeacher,
    fetchObservationsForClass,
  };
}
