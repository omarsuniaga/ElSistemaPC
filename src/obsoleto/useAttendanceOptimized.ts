/**
 * 🚀 COMPOSABLE OPTIMIZADO PARA ASISTENCIA
 * Sistema de alto rendimiento con cache inteligente y actualizaciones reactivas
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useAuthStore } from '../stores/auth';
import { debounce } from 'lodash-es';
import type { AttendanceRecord, AttendanceStatus } from '../types/attendance';

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

export function useAttendanceOptimized() {
  const attendanceStore = useAttendanceStore();
  const classesStore = useClassesStore();
  const studentsStore = useStudentsStore();
  const authStore = useAuthStore();

  // 🎯 Estado optimizado
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedDate = ref<string>('');
  const selectedClass = ref<string>('');

  // 📊 Cache inteligente con TTL
  const cache = new Map<string, CacheEntry<any>>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // 🔄 Queue de actualizaciones pendientes
  const pendingUpdates = ref(new Set<string>());
  const updateQueue = ref<Array<{type: string; data: any; timestamp: number}>>([]);

  /**
   * 🧠 Sistema de cache inteligente
   */
  const setCache = <T>(key: string, data: T, customTTL?: number): void => {
    const ttl = customTTL || CACHE_TTL;
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });
  };

  const getCache = <T>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      cache.delete(key);
      return null;
    }

    return entry.data as T;
  };

  const clearExpiredCache = () => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiry) {
        cache.delete(key);
      }
    }
  };

  /**
   * 🎯 Búsqueda optimizada de documentos de asistencia
   */
  const fetchAttendanceOptimized = async (
    date: string,
    classId: string,
    useCache = true,
  ): Promise<AttendanceRecord[]> => {
    const cacheKey = `attendance_${date}_${classId}`;

    // 💾 Verificar cache primero
    if (useCache) {
      const cached = getCache<AttendanceRecord[]>(cacheKey);
      if (cached) {
        console.log('📊 [AttendanceOptimized] Cache hit:', cacheKey);
        return cached;
      }
    }

    try {
      loading.value = true;
      error.value = null;

      console.log('🔍 [AttendanceOptimized] Fetching from source:', { date, classId });

      // 🔄 Usar método optimizado del store
      await attendanceStore.fetchAttendanceDocument(date, classId);
      const records = attendanceStore.records || [];

      // 💾 Guardar en cache
      setCache(cacheKey, records);

      return records;
    } catch (err) {
      console.error('❌ [AttendanceOptimized] Error fetching attendance:', err);
      error.value = 'Error al cargar asistencia';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 🚀 Actualización optimizada de asistencia (con debounce)
   */
  const updateAttendanceOptimized = debounce(
    async (studentId: string, newStatus: AttendanceStatus, date: string, classId: string) => {
      const updateKey = `${date}_${classId}_${studentId}`;

      try {
        pendingUpdates.value.add(updateKey);

        // 🔄 Actualizar cache inmediatamente para UI responsiva
        const cacheKey = `attendance_${date}_${classId}`;
        const cached = getCache<AttendanceRecord[]>(cacheKey);

        if (cached) {
          const updatedRecords = cached.map((record) =>
            record.studentId === studentId
              ? { ...record, status: newStatus, updatedAt: new Date() }
              : record,
          );
          setCache(cacheKey, updatedRecords);
        }

        // 📊 Actualizar store
        attendanceStore.attendanceRecords[studentId] = newStatus;

        // 💾 Persistir cambios
        await attendanceStore.saveAttendanceDocument({
          id: `${date}_${classId}`,
          uid: `${date}_${classId}`, // UID para identificación única
          fecha: date,
          classId,
          teacherId: authStore.user?.uid || '',
          data: {
            presentes: Object.entries(attendanceStore.attendanceRecords)
              .filter(([_, status]) => status === 'Presente')
              .map(([id]) => id),
            ausentes: Object.entries(attendanceStore.attendanceRecords)
              .filter(([_, status]) => status === 'Ausente')
              .map(([id]) => id),
            tarde: Object.entries(attendanceStore.attendanceRecords)
              .filter(([_, status]) => status === 'Tardanza')
              .map(([id]) => id),
            justificacion: Object.entries(attendanceStore.attendanceRecords)
              .filter(([_, status]) => status === 'Justificado')
              .map(([id]) => ({
                id: `${id}_${date}_${classId}`,
                studentId: id,
                reason: '',
                fecha: date,
                classId,
                approvalStatus: 'pending' as const,
                createdAt: new Date(),
                timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días para justificar
              })),
            observación: '', // Observación general opcional
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log('✅ [AttendanceOptimized] Updated successfully:', updateKey);
      } catch (err) {
        console.error('❌ [AttendanceOptimized] Error updating:', err);
        error.value = 'Error al actualizar asistencia';
        throw err;
      } finally {
        pendingUpdates.value.delete(updateKey);
      }
    },
    500,
  ); // Debounce de 500ms

  /**
   * 📊 Estadísticas optimizadas con cache
   */
  const getAttendanceStats = async (startDate: string, endDate: string, classId?: string) => {
    const cacheKey = `stats_${startDate}_${endDate}_${classId || 'all'}`;

    // 💾 Verificar cache
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      loading.value = true;

      const stats = await attendanceStore.updateAnalytics(false);

      // 💾 Cache con TTL más largo para estadísticas
      setCache(cacheKey, stats, 10 * 60 * 1000); // 10 minutos

      return stats;
    } catch (err) {
      console.error('❌ [AttendanceOptimized] Error getting stats:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 🎯 Búsqueda inteligente de estudiantes ausentes
   */
  const getAbsentStudentsOptimized = async (startDate: string, endDate: string, limit = 10) => {
    const cacheKey = `absent_${startDate}_${endDate}_${limit}`;

    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const teacherId = authStore.user?.uid;
      if (!teacherId) throw new Error('Usuario no autenticado');

      const absentees = await attendanceStore.fetchTopAbsentStudentsByTeacher(
        startDate,
        endDate,
        teacherId,
        limit,
      );

      setCache(cacheKey, absentees);
      return absentees;
    } catch (err) {
      console.error('❌ [AttendanceOptimized] Error getting absent students:', err);
      throw err;
    }
  };

  /**
   * 🔄 Precargar datos críticos
   */
  const preloadCriticalData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Precargar clases del profesor
      const teacherId = authStore.user?.uid;
      if (teacherId) {
        await Promise.all([
          classesStore.fetchClasses(),
          studentsStore.fetchStudents(),
          attendanceStore.fetchAttendanceDocuments(weekAgo, today),
        ]);
      }
    } catch (err) {
      console.warn('⚠️ [AttendanceOptimized] Error preloading data:', err);
    }
  };

  /**
   * 🎯 Computed properties optimizadas
   */
  const currentAttendanceRecords = computed(() => {
    if (!selectedDate.value || !selectedClass.value) return {};

    const cacheKey = `attendance_${selectedDate.value}_${selectedClass.value}`;
    const cached = getCache<AttendanceRecord[]>(cacheKey);

    if (cached) {
      return cached.reduce(
        (acc, record) => {
          acc[record.studentId] = record.status;
          return acc;
        },
        {} as Record<string, AttendanceStatus>,
      );
    }

    return attendanceStore.attendanceRecords;
  });

  const isUpdatePending = computed(() => {
    return (studentId: string) => {
      const updateKey = `${selectedDate.value}_${selectedClass.value}_${studentId}`;
      return pendingUpdates.value.has(updateKey);
    };
  });

  const cacheStats = computed(() => ({
    size: cache.size,
    pendingUpdates: pendingUpdates.value.size,
    queueLength: updateQueue.value.length,
  }));

  /**
   * 📅 Datos del calendario con indicadores de actividad ESPECÍFICOS DEL MAESTRO ACTIVO
   */
  const calendarActivityData = computed(() => {
    const teacherId = authStore.user?.uid;
    if (!teacherId) return {};

    // Filtrar solo las fechas donde ESTE maestro específico ha registrado
    const teacherActivities: Record<string, {type: string; count: number}> = {};

    // Solo incluir documentos del maestro actual
    attendanceStore.attendanceDocuments.forEach((doc) => {
      if (doc.teacherId === teacherId && doc.fecha) {
        teacherActivities[doc.fecha] = {
          type: 'attendance',
          count: (teacherActivities[doc.fecha]?.count || 0) + 1,
        };
      }
    });

    return teacherActivities;
  });

  /**
   * 🔄 Cargar datos para el calendario con indicadores DEL MAESTRO ACTIVO
   */
  const loadCalendarData = async (startDate: string, endDate: string) => {
    const teacherId = authStore.user?.uid;
    if (!teacherId) {
      console.warn('🚫 [AttendanceOptimized] No hay maestro autenticado');
      return {};
    }

    const cacheKey = `calendar_${teacherId}_${startDate}_${endDate}`;

    // 💾 Verificar cache primero
    const cached = getCache(cacheKey);
    if (cached) {
      console.log('📅 [AttendanceOptimized] Calendar cache hit for teacher:', teacherId);
      return cached;
    }

    try {
      loading.value = true;
      console.log('🔍 [AttendanceOptimized] Loading calendar data for teacher:', {
        teacherId,
        startDate,
        endDate,
      });

      // Cargar documentos de asistencia específicos del maestro
      await attendanceStore.fetchAttendanceDocumentsByTeacher(teacherId, startDate, endDate);

      // Construir datos de actividad específicos del maestro
      const teacherActivityData: Record<
        string,
        {type: string; count: number; hasRegistered: boolean}
      > = {};

      attendanceStore.attendanceDocuments.forEach((doc) => {
        if (doc.teacherId === teacherId && doc.fecha) {
          if (!teacherActivityData[doc.fecha]) {
            teacherActivityData[doc.fecha] = {
              type: 'attendance',
              count: 0,
              hasRegistered: false,
            };
          }
          teacherActivityData[doc.fecha].count++;
          teacherActivityData[doc.fecha].hasRegistered = true;
        }
      });

      // 💾 Guardar en cache con TTL de 2 minutos para calendario
      setCache(cacheKey, teacherActivityData, 2 * 60 * 1000);

      console.log('📅 [AttendanceOptimized] Teacher calendar data loaded:', teacherActivityData);
      return teacherActivityData;
    } catch (err) {
      console.error('❌ [AttendanceOptimized] Error loading teacher calendar data:', err);
      error.value = 'Error al cargar datos del calendario del maestro';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 🎯 Verificar si el MAESTRO ACTIVO tiene actividades registradas en una fecha
   */
  const hasActivityOnDate = (date: string): boolean => {
    const teacherId = authStore.user?.uid;
    if (!teacherId) return false;

    const activityData = calendarActivityData.value;
    return !!(activityData[date] && activityData[date].count > 0);
  };

  /**
   * 📊 Obtener conteo de registros del MAESTRO ACTIVO para una fecha
   */
  const getActivityCountForDate = (date: string): number => {
    const teacherId = authStore.user?.uid;
    if (!teacherId) return 0;

    const activityData = calendarActivityData.value;
    return activityData[date]?.count || 0;
  };

  /**
   * 🎯 Obtener detalles de las clases registradas por el MAESTRO ACTIVO en una fecha
   */
  const getTeacherClassesForDate = async (date: string) => {
    const teacherId = authStore.user?.uid;
    if (!teacherId) return { registered: [], pending: [], total: 0 };

    try {
      // Obtener todas las clases del maestro
      // Primero asegurar que el store tenga datos
      if (classesStore.classes.length === 0) {
        await classesStore.fetchClasses();
      }

      // Obtener clases del maestro (primarias y compartidas)
      const allClasses = classesStore.getAllTeacherClasses(teacherId);

      // Filtrar clases que tienen horarios para esta fecha específica (día de la semana)
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay(); // 0 = domingo, 1 = lunes, etc.
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const dayName = dayNames[dayOfWeek];

      const classesForDate = allClasses.filter((classItem) => {
        if (!classItem.schedule) return false;
        
        // El schedule puede ser un objeto con slots o un slot directo
        const schedule = classItem.schedule as any;
        
        if (Array.isArray(schedule.slots)) {
          // Estructura con slots array
          return schedule.slots.some((slot: any) => {
            if (typeof slot.day === 'string') {
              return slot.day.toLowerCase() === dayName.toLowerCase();
            } else if (typeof slot.day === 'number') {
              return slot.day === dayOfWeek;
            }
            return false;
          });
        } else if (schedule.day) {
          // Estructura de slot directo
          if (typeof schedule.day === 'string') {
            return schedule.day.toLowerCase() === dayName.toLowerCase();
          } else if (typeof schedule.day === 'number') {
            return schedule.day === dayOfWeek;
          }
        }
        
        return false;
      });

      console.log(`📅 [AttendanceOptimized] Classes found for ${dayName} (${date}):`, {
        totalTeacherClasses: allClasses.length,
        classesForThisDay: classesForDate.length,
        teacherId,
      });

      // Obtener documentos de asistencia registrados por este maestro en esa fecha
      const registeredDocs = attendanceStore.attendanceDocuments.filter(
        (doc) => doc.fecha === date && doc.teacherId === teacherId,
      );

      const registeredClassIds = new Set(registeredDocs.map((doc) => doc.classId));

      const registered = classesForDate.filter((cls) => registeredClassIds.has(cls.id));
      const pending = classesForDate.filter((cls) => !registeredClassIds.has(cls.id));

      console.log(`📊 [AttendanceOptimized] Classes for ${date}:`, {
        registered: registered.length,
        pending: pending.length,
        teacherId,
        registeredClasses: registered,
        pendingClasses: pending,
      });

      return { registered, pending, total: classesForDate.length };
    } catch (err) {
      console.error('❌ [AttendanceOptimized] Error getting teacher classes for date:', err);
      return { registered: [], pending: [], total: 0 };
    }
  };

  /**
   * 🧹 Limpieza automática
   */
  const cleanup = () => {
    clearExpiredCache();
    updateQueue.value = updateQueue.value.filter(
      (item) => Date.now() - item.timestamp < 30000, // 30 segundos
    );
  };

  // 🔄 Watchers optimizados
  watch(
    [selectedDate, selectedClass],
    async ([date, classId]) => {
      if (date && classId) {
        await fetchAttendanceOptimized(date, classId);
      }
    },
    { immediate: true },
  );

  // 🚀 Lifecycle
  onMounted(() => {
    preloadCriticalData();

    // Limpieza periódica cada 2 minutos
    const cleanupInterval = setInterval(cleanup, 2 * 60 * 1000);

    onUnmounted(() => {
      clearInterval(cleanupInterval);
    });
  });

  return {
    // Estado
    loading,
    error,
    selectedDate,
    selectedClass,
    currentAttendanceRecords,

    // Métodos optimizados
    fetchAttendanceOptimized,
    updateAttendanceOptimized,
    getAttendanceStats,
    getAbsentStudentsOptimized,
    preloadCriticalData,

    // 📅 Métodos de calendario ESPECÍFICOS DEL MAESTRO
    loadCalendarData,
    hasActivityOnDate,
    getActivityCountForDate,
    getTeacherClassesForDate,
    calendarActivityData,

    // Utilidades
    isUpdatePending,
    cacheStats,
    clearExpiredCache,

    // Métodos de limpieza
    cleanup,
  };
}
