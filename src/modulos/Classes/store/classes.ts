// src/modulos/Classes/store/classes.ts
import { defineStore } from 'pinia';
import {
  fetchClassesFirestore,
  addClassFirestore,
  updateClassFirestore,
  removeClassFirestore,
  getClassByIdFirestore,
  fetchClassesByStudentIdFirestore,
  getTeacherClasses,
  inviteAssistantTeacher,
  removeAssistantTeacher,
  updateAssistantPermissions,
  checkTeacherPermission,
} from '../service/classes';
import type { ClassData, ClassCreate } from '../types/class';
import { useQualificationStore } from '../../Qualifications/store/qualification';

export const useClassesStore = defineStore('classes', {
  state: () => ({
    classes: [] as ClassData[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null,
    // Caché específico para clases de maestros (usando objeto en lugar de Map para compatibilidad con Pinia)
    teacherClassesCache: {} as Record<string, {data: any[]; lastSync: Date}>,
  }),

  getters: {
    // Retorna todas las clases sin filtrar
    getAllClasses: (state) => state.classes,
    // Retorna la clase por id
    getClassById: (state) => (id: string) => state.classes.find((classItem) => classItem.id === id),
    // Filtra clases por nivel
    getClassesByLevel: (state) => (level: string) =>
      state.classes.filter((classItem) => classItem.level === level),
    // Filtra clases por instrumento
    getClassesByInstrument: (state) => (instrument: string) =>
      state.classes.filter((classItem) => classItem.instrument === instrument),
    // Filtra clases por maestro
    getClassesByTeacher: (state) => (teacherId: string) => {
      return state.classes.filter((classItem) => {
        if (classItem.teacherId !== teacherId) return false;
        const schedule = classItem.schedule as {slots?: any[]};
        return schedule && Array.isArray(schedule.slots) && schedule.slots.length > 0;
      });
    },
    // Filtra clases por alumno
    getClassesByStudent: (state) => (studentId: string) =>
      state.classes.filter(
        (classItem) => classItem.studentIds && classItem.studentIds.includes(studentId),
      ),
    // Retorna clases que tienen definido un horario
    getScheduledClasses: (state) => state.classes.filter((classItem) => classItem.schedule),
    // Retorna clases sin horario definido
    getUnscheduledClasses: (state) => state.classes.filter((classItem) => !classItem.schedule),
    // This getter was causing conflicts with the action method
    // It has been removed and replaced with the action method only

    // Nueva implementación del getter studentClasses para resolver el conflicto de nombres
    studentClasses: (state) => (studentId: string) => {
      if (!studentId) return [];
      return state.classes.filter(
        (classItem) =>
          classItem.studentIds &&
          Array.isArray(classItem.studentIds) &&
          classItem.studentIds.includes(studentId),
      );
    },

    // obtener clases por dias de la semana
    getClassByDaysAndTeacher: (state) => (teacherId: string, day: string) => {
      return state.classes.filter((classItem) => {
        if (classItem.teacherId !== teacherId) return false;
        const schedule = classItem.schedule as {slots?: any[]};
        return (
          schedule &&
          Array.isArray(schedule.slots) &&
          schedule.slots.some((slot: any) => slot.day === day)
        );
      });
    },
    // Clases filtradas por ID de maestro
    getClassesByTeacherId: (state) => (teacherId: string) => {
      if (!teacherId) return [];
      return state.classes.filter((c) => c.teacherId === teacherId);
    },

    // Clases programadas filtradas por ID de maestro
    getScheduledClassesByTeacherId: (state) => (teacherId: string) => {
      if (!teacherId) return [];
      return state.classes.filter((c) => {
        if (c.teacherId !== teacherId) return false;
        const schedule = c.schedule as {slots?: any[]};
        return schedule && Array.isArray(schedule.slots) && schedule.slots.length > 0;
      });
    }, // Clases por día de la semana filtradas por ID de maestro
    getClassesByDayAndTeacherId: (state) => (day: string | number, teacherId: string) => {
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      let dayIndex: number;

      if (typeof day === 'string') {
        dayIndex = dayNames.indexOf(day.toLowerCase());
      } else {
        dayIndex = day >= 0 && day <= 6 ? day : -1;
      }

      if (!teacherId || dayIndex === -1) return [];

      return state.classes.filter((c) => {
        if (c.teacherId !== teacherId) return false;
        const schedule = c.schedule as {slots?: any[]};
        if (!schedule || !Array.isArray(schedule.slots)) return false;
        return schedule.slots.some((slot: any) => {
          if (typeof slot.day === 'number') {
            return slot.day === dayIndex;
          } else if (typeof slot.day === 'string') {
            return dayNames[dayIndex] === slot.day.toLowerCase();
          }
          return false;
        });
      });
    },

    /* ===== GETTERS PARA COLABORACION ===== */

    /**
     * Obtiene clases donde el maestro es encargado
     */
    getLeadClasses: (state) => (teacherId: string) => {
      if (!teacherId) return [];
      return state.classes.filter((c: ClassData) => c.teacherId === teacherId);
    },

    /**
     * Obtiene clases donde el maestro es asistente
     */
    getAssistantClasses: (state) => (teacherId: string) => {
      if (!teacherId) return [];
      return state.classes.filter(
        (c: ClassData) =>
          c.teachers &&
          c.teachers.some(
            (teacher: any) => teacher.teacherId === teacherId && teacher.role === 'assistant',
          ),
      );
    },

    /**
     * Obtiene todas las clases del maestro (encargado + asistente)
     */
    getAllTeacherClasses: (state) => (teacherId: string) => {
      if (!teacherId) return [];
      return state.classes.filter(
        (c: ClassData) =>
          c.teacherId === teacherId ||
          (c.teachers && c.teachers.some((teacher: any) => teacher.teacherId === teacherId)),
      );
    },

    /**
     * Obtiene una clase por ID si el maestro tiene acceso (como titular o asistente)
     */
    getClassByIdForTeacher: (state) => (classId: string, teacherId: string) => {
      if (!classId || !teacherId) return null;
      return state.classes.find(
        (c: ClassData) =>
          c.id === classId &&
          (c.teacherId === teacherId ||
            (c.teachers && c.teachers.some((teacher: any) => teacher.teacherId === teacherId))),
      );
    },

    /**
     * Verifica si un maestro tiene acceso a una clase específica
     */
    hasTeacherAccessToClass: (state) => (classId: string, teacherId: string) => {
      if (!classId || !teacherId) return false;
      const classData = state.classes.find((c) => c.id === classId);
      if (!classData) return false;
      return (
        classData.teacherId === teacherId ||
        (classData.teachers &&
          classData.teachers.some((teacher: any) => teacher.teacherId === teacherId))
      );
    },

    /**
     * Obtiene el número de clases activas.
     */
    activeClasses: (state) => {
      return state.classes.filter((c) => c.isActive).length;
    },
  },
  // Actions para manejar la lógica de negocio y la comunicación con Firestore

  actions: {
    /**
     * Normaliza la data de una clase para asegurar que el campo "schedule" tenga la estructura esperada.
     */
    normalizeClassData(classItem: any): ClassData {
      // Helpers localized to this function to avoid changing module-level API
      const pad = (n: number) => `${n}`.padStart(2, '0');
      const toHHMM = (val: any): string => {
        if (!val && val !== 0) return '';
        // If already a string like "HH:MM"
        if (typeof val === 'string') {
          const m = val.match(/^(\d{1,2}):(\d{2})/);
          if (m) return `${pad(Number(m[1]))}:${pad(Number(m[2]))}`;
          // Try parseable date strings (ISO, etc.)
          const d = new Date(val);
          if (!isNaN(d.getTime())) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          // Fallback: return original string (best-effort)
          return val;
        }
        if (typeof val === 'number') {
          const d = new Date(val);
          if (!isNaN(d.getTime())) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return '';
        }
        if (val instanceof Date) {
          return `${pad(val.getHours())}:${pad(val.getMinutes())}`;
        }
        // Firestore Timestamp-like objects
        if (val && typeof val.toDate === 'function') {
          const d = val.toDate();
          return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
        return '';
      };

      const makeSlot = (raw: any, idx = 0) => {
        const day = raw?.day ?? raw?.dayOfWeek ?? raw?.weekday ?? raw?.dia ?? '';
        const startTime = toHHMM(raw?.startTime ?? raw?.start ?? raw?.horaInicio ?? raw?.hora ?? '');
        const endTime = toHHMM(raw?.endTime ?? raw?.end ?? raw?.horaFin ?? raw?.fin ?? '');
        const id = raw?.id ?? `${classItem?.id ?? 'c'}-slot-${idx}-${Math.random().toString(36).slice(2, 8)}`;
        // Preserve other slot properties (location, room, etc.) but ensure core fields exist
        return {
          id,
          day,
          startTime,
          endTime,
          ...raw,
        };
      };

      // Build slots from many possible legacy shapes
      let slots: any[] = [];

      try {
        if (classItem && classItem.schedule) {
          const s = classItem.schedule;
          if (Array.isArray(s.slots)) {
            slots = s.slots.map((r: any, i: number) => makeSlot(r, i));
          } else if (Array.isArray(s)) {
            // schedule was stored as array directly
            slots = s.map((r: any, i: number) => makeSlot(r, i));
          } else if (s && (s.day || s.startTime || s.endTime || s.dayOfWeek)) {
            slots = [makeSlot(s, 0)];
          }
        }

        // Legacy/alternative fields: horarios, horario, dia, startTime/endTime at root
        if (slots.length === 0) {
          if (Array.isArray(classItem.horarios)) {
            slots = classItem.horarios.map((r: any, i: number) => makeSlot(r, i));
          } else if (Array.isArray(classItem.horario)) {
            slots = classItem.horario.map((r: any, i: number) => makeSlot(r, i));
          } else if (classItem.horario && typeof classItem.horario === 'object') {
            slots = [makeSlot(classItem.horario, 0)];
          } else if (classItem.day || classItem.startTime || classItem.endTime) {
            slots = [
              makeSlot(
                {
                  day: classItem.day,
                  startTime: classItem.startTime,
                  endTime: classItem.endTime,
                },
                0,
              ),
            ];
          }
        }
      } catch (err) {
        // Defensive: if something unexpected happens, fallback to empty slots
        console.warn('[ClassStore] normalizeClassData: error normalizing schedule', err);
        slots = [];
      }

      // Ensure slots is an array
      if (!Array.isArray(slots)) slots = [];

      const normalizedSchedule = { slots };

      return {
        ...classItem,
        id: String(classItem.id),
        studentIds: Array.isArray(classItem.studentIds)
          ? classItem.studentIds
          : classItem.studentIds
          ? [classItem.studentIds]
          : [],
        schedule: normalizedSchedule,
      } as ClassData;
    },

    /**
     * Helper para gestionar el estado "loading" y errores durante una acción asíncrona.
     */
    async withLoading<T>(action: () => Promise<T>): Promise<T> {
      this.loading = true;
      this.error = null;
      try {
        return await action();
      } catch (error: any) {
        this.error = error.message || 'Error inesperado';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ===== CRUDE BASICO ===== */

    /**
     * Obtiene todas las clases desde Firestore y actualiza el store.
     */
    async fetchClasses() {
      return await this.withLoading(async () => {
        const classes = await fetchClassesFirestore();
        this.classes = classes.map((classItem: any) => this.normalizeClassData(classItem));
        this.lastSync = new Date();
        return this.classes;
      });
    },
    /**
     * Agrega una nueva clase en Firestore.
     * Se espera que se provea la data de la clase sin el campo "id".
     * Además, se asume que se incluye el teacherId (por ejemplo, del maestro creador).
     */
    async addClass(classData: ClassCreate) {
      return await this.withLoading(async () => {
        const newClassId = await addClassFirestore(classData);
        const createdClass: ClassData = {
          ...classData,
          id: newClassId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const normalizedClass = this.normalizeClassData(createdClass);
        this.classes.push(normalizedClass);
        return normalizedClass;
      });
    } /**
     * Actualiza una clase existente en Firestore.
     * Soporta dos formas de llamada:
     * 1. updateClass(id, updates) - ID y actualizaciones por separado
     * 2. updateClass({id, ...updates}) - Objeto con ID y actualizaciones
     */,
    async updateClass(
      idOrUpdates: string | (Partial<ClassData> & {id: string}),
      maybeUpdates?: Partial<ClassData>,
    ) {
      return await this.withLoading(async () => {
        let classId: string;
        let updates: Partial<ClassData>;

        // Determinar forma de llamada y extraer id y updates
        if (typeof idOrUpdates === 'string' && maybeUpdates) {
          // Forma: updateClass(id, updates)
          classId = idOrUpdates;
          updates = maybeUpdates;
        } else if (typeof idOrUpdates === 'object' && idOrUpdates.id) {
          // Forma: updateClass({id, ...updates})
          classId = idOrUpdates.id;
          updates = idOrUpdates;
        } else {
          throw new Error('ID de clase indefinido o formato de llamada incorrecto');
        }

        // Asegurarnos de que tenemos un ID válido
        if (!classId) {
          throw new Error('ID de clase indefinido');
        }
        // Obtener datos actuales de la clase para gestionar relaciones bidireccionales
        const currentClass = this.getClassById(classId);

        // Comprobar si hay cambios en la lista de estudiantes
        if (updates.studentIds && currentClass) {
          const previousStudentIds = currentClass.studentIds || [];
          const newStudentIds = updates.studentIds;

          // Identificar cambios
          const addedStudents = newStudentIds.filter((id) => !previousStudentIds.includes(id));
          const removedStudents = previousStudentIds.filter((id) => !newStudentIds.includes(id));

          try {
            // Importamos el store de estudiantes si hay cambios que procesar
            if (addedStudents.length > 0 || removedStudents.length > 0) {
              // Usamos import dinámico para evitar dependencias circulares
              const { useStudentsStore } = await import('../../Students/store/students');
              const studentsStore = useStudentsStore();

              // Actualizar los estudiantes añadidos para que tengan esta clase en su grupo
              for (const studentId of addedStudents) {
                try {
                  const student = studentsStore.getStudentById(studentId);
                  if (student) {
                    const currentGrupos = Array.isArray(student.grupo)
                      ? [...student.grupo]
                      : student.grupo
                        ? [student.grupo]
                        : [];

                    if (!currentGrupos.includes(classId)) {
                      await studentsStore.updateStudent(studentId, {
                        grupo: [...currentGrupos, classId],
                      });
                      console.log(`Actualizado estudiante ${studentId}: añadido a clase ${classId}`);
                    }
                  }
                } catch (err) {
                  console.error(`Error actualizando grupos del estudiante ${studentId}:`, err);
                  // Continuamos con los demás estudiantes
                }
              }

              // Actualizar los estudiantes eliminados para quitar esta clase de su grupo
              for (const studentId of removedStudents) {
                try {
                  const student = studentsStore.getStudentById(studentId);
                  if (student && student.grupo) {
                    const currentGrupos = Array.isArray(student.grupo)
                      ? [...student.grupo]
                      : student.grupo
                        ? [student.grupo]
                        : [];

                    const updatedGrupos = currentGrupos.filter((g) => g !== classId);

                    if (currentGrupos.length !== updatedGrupos.length) {
                      await studentsStore.updateStudent(studentId, {
                        grupo: updatedGrupos,
                      });
                      console.log(
                        `Actualizado estudiante ${studentId}: eliminado de clase ${classId}`,
                      );
                    }
                  }
                } catch (err) {
                  console.error(`Error actualizando grupos del estudiante ${studentId}:`, err);
                  // Continuamos con los demás estudiantes
                }
              }
            }
          } catch (err) {
            console.error('Error actualizando referencias estudiantes-clases:', err);
            // No bloqueamos la actualización principal por errores en las referencias
          }
        }

        // Actualizar en Firestore
        await updateClassFirestore(classId, updates);

        // Actualizar estado local
        const index = this.classes.findIndex((c) => c.id === classId);
        let updatedData: ClassData;

        if (index !== -1) {
          updatedData = this.normalizeClassData({
            ...this.classes[index],
            ...updates,
            id: classId, // Asegurar que el ID esté presente
          });
          this.classes[index] = updatedData;
        } else {
          // Si la clase no existe en el estado local, pero existe en Firestore
          if ('id' in updates) {
            updatedData = this.normalizeClassData(updates as ClassData);
          } else {
            updatedData = this.normalizeClassData({
              ...updates,
              id: classId,
            } as ClassData);
          }
          this.classes.push(updatedData);
        }

        return true;
      });
    },

    /**
     * Elimina una clase de Firestore.
     */
    async removeClass(classId: string) {
      return await this.withLoading(async () => {
        await removeClassFirestore(classId);
        this.classes = this.classes.filter((c) => c.id !== classId);
        return { success: true };
      });
    },

    /**
     * Obtiene los detalles de una clase por su ID, normalizándola e integrándola en el store.
     */
    async getClassDetails(classId: string) {
      return await this.withLoading(async () => {
        const classItem = await getClassByIdFirestore(classId);
        if (!classItem) throw new Error('Clase no encontrada');
        const normalizedClass = this.normalizeClassData(classItem);
        const index = this.classes.findIndex((c) => c.id === classId);
        if (index === -1) {
          this.classes.push(normalizedClass);
        } else {
          this.classes[index] = normalizedClass;
        }
        return normalizedClass;
      });
    },

    /**
     * Obtiene una clase específica por ID desde Firestore
     * Esta función es útil para clases compartidas donde el maestro asistente
     * necesita acceso a clases que no están en su lista personal
     */
    async fetchClassById(classId: string): Promise<ClassData | null> {
      if (!classId) {
        console.error('[ClassStore] No se puede obtener clase sin ID');
        return null;
      }

      try {
        console.log(`[ClassStore] Obteniendo clase por ID: ${classId}`);
        const classData = await getClassByIdFirestore(classId);

        if (classData) {
          const normalizedClass = this.normalizeClassData(classData);

          // Agregar o actualizar la clase en el store si no existe
          const existingIndex = this.classes.findIndex((c) => c.id === classId);
          if (existingIndex >= 0) {
            this.classes[existingIndex] = normalizedClass;
          } else {
            this.classes.push(normalizedClass);
          }

          console.log(`[ClassStore] ✅ Clase obtenida: "${normalizedClass.name}"`);
          return normalizedClass;
        } else {
          console.log(`[ClassStore] ❌ No se encontró clase con ID: ${classId}`);
          return null;
        }
      } catch (error) {
        console.error(`[ClassStore] Error al obtener clase ${classId}:`, error);
        return null;
      }
    },

    /**
     * Alias para fetchClassById para compatibilidad con código existente
     */
    async getClass(classId: string): Promise<ClassData | null> {
      return await this.fetchClassById(classId);
    },

    /* ===== FUNCIONES AUXILIARES ===== */

    /**
     * Asigna un maestro a una clase.
     */
    async assignTeacher(classId: string, teacherId: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        return await this.updateClass({ ...classData, teacherId });
      });
    },

    /**
     * Asigna un alumno a una clase.
     */
    async assignStudent(classId: string, studentId: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        const studentIds = [...(classData.studentIds || [])];
        if (!studentIds.includes(studentId)) studentIds.push(studentId);
        return await this.updateClass({ ...classData, studentIds });
      });
    },
    async deleteClass(classId: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        return await this.removeClass(classId);
      });
    },

    /**
     * Remueve un alumno de una clase.
     */
    async removeStudent(classId: string, studentId: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        const studentIds = (classData.studentIds || []).filter((id) => id !== studentId);
        return await this.updateClass({ ...classData, studentIds });
      });
    },

    /**
     * Actualiza el horario de una clase y opcionalmente el salón.
     * El horario debe tener la estructura adecuada según la interfaz ClassData.
     */
    async scheduleClass(
      classId: string,
      scheduleData:
        | {
            day: string
            startTime: string
            endTime: string
          }
        | {
            day: string
            startTime: string
            endTime: string
          }[],
      classroom?: string,
    ) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');

        // Normalizar el formato del horario según la interfaz ClassData
        const normalizedSchedule = {
          slots: Array.isArray(scheduleData) ? scheduleData : [scheduleData],
        };

        return await this.updateClass({
          ...classData,
          schedule: normalizedSchedule,
          classroom: classroom || classData.classroom,
        });
      });
    },

    /**
     * Obtiene el horario de una clase por Dias y Maestro.
     */
    async getClassByDayAndTeacher(day: string, teacherId: string) {
      return await this.withLoading(async () => {
        const classData = this.classes.filter((classItem) => {
          // First check teacher match
          if (classItem.teacherId !== teacherId) return false;

          // Then check schedule match based on structure
          if (!classItem.schedule) return false;

          if ('slots' in classItem.schedule && Array.isArray(classItem.schedule.slots)) {
            // Handle structure with slots array
            return classItem.schedule.slots.some((slot) => slot.day === day);
          } else if ('day' in classItem.schedule) {
            // Handle direct day property structure
            return classItem.schedule.day === day;
          }

          return false;
        });
        return classData;
      });
    },
    /**
     * Agrega un nuevo slot de horario a una clase existente
     */
    async addScheduleSlot(
      classId: string,
      slot: {
        day: string
        startTime: string
        endTime: string
      },
    ) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');

        const currentSchedule = classData.schedule || { slots: [] };
        const updatedSchedule = {
          slots: [...currentSchedule.slots, slot],
        };

        return await this.updateClass({
          ...classData,
          schedule: updatedSchedule,
        });
      });
    },

    /**
     * Elimina un slot de horario de una clase existente
     */
    async removeScheduleSlot(classId: string, slotIndex: number) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        if (!classData.schedule || !classData.schedule.slots) {
          throw new Error('La clase no tiene horarios definidos');
        }

        const updatedSlots = [...classData.schedule.slots];
        if (slotIndex < 0 || slotIndex >= updatedSlots.length) {
          throw new Error('Índice de horario inválido');
        }

        updatedSlots.splice(slotIndex, 1);

        return await this.updateClass({
          ...classData,
          schedule: { slots: updatedSlots },
        });
      });
    },

    /**
     * Forzar sincronización con Firebase y limpiar caché local.
     * Útil cuando queremos asegurarnos de obtener los datos más recientes.
     */
    async forceSync() {
      return await this.withLoading(async () => {
        try {
          // Limpiar caché local si estamos en desarrollo
          if (process.env.NODE_ENV === 'development') {
            localStorage.removeItem('classes');
          }

          // Cargar datos frescos desde Firebase
          const classes = await fetchClassesFirestore();
          this.classes = classes.map((classItem: any) => this.normalizeClassData(classItem));
          this.lastSync = new Date();

          return this.classes;
        } catch (error) {
          console.error('❌ Error forzando sincronización:', error);
          throw error;
        }
      });
    },

    /**
     * Check if a student meets criteria to advance to next level
     */
    async checkStudentProgression(studentId: string, classId: string) {
      const classData = this.getClassById(classId);
      if (!classData) throw new Error('Clase no encontrada');

      // Get attendance rate from attendance store
      // const attendanceStore = useAttendanceStore(); // Removed as per modular design
      // const attendanceRate = attendanceStore.getStudentAttendanceRate(studentId, classId); // Removed as per modular design

      // Get performance metrics
      const qualificationStore = useQualificationStore();
      const qualifications = await qualificationStore.fetchQualifications(classId);
      const studentQualifications = qualifications.filter((q) => q.group.includes(studentId));
      const averageScore =
        studentQualifications.reduce((acc, q) => {
          // Calculate average score for this qualification's indicators
          const qualificationScore =
            q.indicators.length > 0
              ? q.indicators.reduce((iAcc, indicator) => iAcc + indicator.score, 0) /
                q.indicators.length
              : 0;
          return acc + qualificationScore;
        }, 0) / (studentQualifications.length || 1); // Avoid division by zero

      // Criteria for advancement:
      // - Average score >= 80%
      // - Minimum number of classes attended
      const meetsPerformanceCriteria = averageScore >= 80;
      const hasMinimumClasses = studentQualifications.length >= 20;

      return {
        canAdvance: meetsPerformanceCriteria && hasMinimumClasses,
        metrics: {
          averageScore,
          classesAttended: studentQualifications.length,
        },
      };
    },
    /**
     * Promote a student to the next level class
     */
    async promoteStudent(studentId: string, currentClassId: string) {
      const currentClass = this.getClassById(currentClassId);
      if (!currentClass) throw new Error('Clase actual no encontrada');
      if (!currentClass.level) throw new Error('La clase actual no tiene un nivel definido');

      // Find next level class
      const nextLevel = this.getNextLevel(currentClass.level);
      const nextLevelClasses = this.classes.filter(
        (c) => c.level === nextLevel && c.instrument === currentClass.instrument,
      );

      if (nextLevelClasses.length === 0) {
        throw new Error('No hay clases disponibles del siguiente nivel');
      }

      // Select the class with fewest students
      const targetClass = nextLevelClasses.reduce((a, b) =>
        (a.studentIds?.length || 0) <= (b.studentIds?.length || 0) ? a : b,
      );

      // Remove from current class
      await this.removeStudent(currentClassId, studentId);

      // Add to new class
      await this.assignStudent(targetClass.id, studentId);

      return targetClass;
    },

    /**
     * Get the next level based on current level
     */
    getNextLevel(currentLevel: string): string {
      const levels = ['Principiante', 'Intermedio', 'Avanzado'];
      const currentIndex = levels.indexOf(currentLevel);
      if (currentIndex === -1 || currentIndex === levels.length - 1) {
        throw new Error('No hay siguiente nivel disponible');
      }
      return levels[currentIndex + 1];
    },

    /**
     * Acción para obtener clases por día de la semana (igual que el getter, pero como método).
     */
    getClassesByDay(day: string | number) {
      const daysEs = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const daysEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      let dayIndex: number | null = null;
      let dayLower = '';
      if (typeof day === 'number') {
        dayIndex = day;
        dayLower = daysEs[day] || daysEn[day] || '';
      } else if (typeof day === 'string') {
        dayLower = day.toLowerCase();
        dayIndex = daysEs.indexOf(dayLower);
        if (dayIndex === -1) dayIndex = daysEn.indexOf(dayLower);
      }
      return this.classes.filter(
        (classItem) =>
          classItem.schedule &&
          Array.isArray(classItem.schedule.slots) &&
          classItem.schedule.slots.some((slot) => {
            if (typeof slot.day === 'string') {
              const slotDayLower = slot.day.toLowerCase();
              return (
                slotDayLower === dayLower ||
                daysEs.indexOf(slotDayLower) === dayIndex ||
                daysEn.indexOf(slotDayLower) === dayIndex
              );
            } else if (typeof slot.day === 'number') {
              return slot.day === dayIndex;
            }
            return false;
          }),
      );
    },

    /**
     * Obtiene y carga las clases específicas para un estudiante
     * @param studentId ID del estudiante
     */
    async fetchClassesByStudentId(studentId: string) {
      return await this.withLoading(async () => {
        if (!studentId) return [];

        const classes = await fetchClassesByStudentIdFirestore(studentId);

        // Procesamos cada clase obtenida
        const normalizedClasses = classes.map((classItem) => this.normalizeClassData(classItem));

        // Actualizamos el store con estas clases
        normalizedClasses.forEach((classItem) => {
          const index = this.classes.findIndex((c) => c.id === classItem.id);
          if (index >= 0) {
            // Actualizamos la clase existente
            this.classes[index] = classItem;
          } else {
            // Agregamos la nueva clase
            this.classes.push(classItem);
          }
        });
        return normalizedClasses;
      });
    },

    /**
     * Obtiene y carga las clases específicas para un maestro
     * @param teacherId ID del maestro
     */
    async fetchClassesByTeacher(teacherId: string) {
      return await this.withLoading(async () => {
        if (!teacherId) return [];
        // Si tienes un método Firestore específico, úsalo aquí. Si no, filtra localmente después de fetchClassesFirestore
        let classes: any[] = [];
        if (typeof fetchClassesFirestore === 'function') {
          classes = await fetchClassesFirestore();
        }
        // Filtrar por teacherId
        const filtered = classes.filter((classItem: any) => classItem.teacherId === teacherId);
        const normalizedClasses = filtered.map((classItem) => this.normalizeClassData(classItem));
        // Actualizar el store
        normalizedClasses.forEach((classItem) => {
          const index = this.classes.findIndex((c) => c.id === classItem.id);
          if (index >= 0) {
            this.classes[index] = classItem;
          } else {
            this.classes.push(classItem);
          }
        });
        return normalizedClasses;
      });
    } /**
     * Compatibility function for old code that uses getClassesByStudentId as a method
     */,
    getClassesByStudentId(studentId: string) {
      if (!studentId) return [];
      return this.classes.filter(
        (classItem) =>
          classItem.studentIds &&
          Array.isArray(classItem.studentIds) &&
          classItem.studentIds.includes(studentId),
      );
    },

    /* ===== COLABORACION ENTRE MAESTROS ===== */

    /**
     * Obtiene todas las clases del maestro (como encargado y asistente)
     */
    async fetchTeacherClasses(teacherId: string) {
      return await this.withLoading(async () => {
        if (!teacherId) return [];

        // Importar función del servicio
        // getTeacherClasses ya está importado estáticamente
        const teacherClasses = await getTeacherClasses(teacherId);

        // Actualizar clases en el store
        teacherClasses.forEach((classView) => {
          const existingIndex = this.classes.findIndex((c) => c.id === classView.id);
          if (existingIndex >= 0) {
            this.classes[existingIndex] = classView;
          } else {
            this.classes.push(classView);
          }
        });

        return teacherClasses;
      });
    },

    /**
     * Invita a un maestro como asistente
     */
    async inviteAssistant(inviteData: any) {
      return await this.withLoading(async () => {
        // inviteAssistantTeacher ya está importado estáticamente
        await inviteAssistantTeacher(inviteData);

        // Actualizar la clase en el store
        const classIndex = this.classes.findIndex((c) => c.id === inviteData.classId);
        if (classIndex >= 0) {
          // Recargar la clase desde Firestore para obtener los datos actualizados
          // getClassByIdFirestore ya está importado estáticamente
          const updatedClass = await getClassByIdFirestore(inviteData.classId);
          if (updatedClass) {
            this.classes[classIndex] = this.normalizeClassData(updatedClass);
          }
        }
      });
    },

    /**
     * Remueve a un maestro asistente
     */
    async removeAssistant(classId: string, assistantId: string, removedBy: string) {
      return await this.withLoading(async () => {
        // removeAssistantTeacher ya está importado estáticamente
        await removeAssistantTeacher(classId, assistantId, removedBy);

        // Actualizar la clase en el store
        const classIndex = this.classes.findIndex((c) => c.id === classId);
        if (classIndex >= 0) {
          // getClassByIdFirestore ya está importado estáticamente
          const updatedClass = await getClassByIdFirestore(classId);
          if (updatedClass) {
            this.classes[classIndex] = this.normalizeClassData(updatedClass);
          }
        }
      });
    },

    /**
     * Actualiza permisos de un maestro asistente
     */
    async updateAssistantPermissions(
      classId: string,
      assistantId: string,
      permissions: any,
      updatedBy: string,
    ) {
      return await this.withLoading(async () => {
        // updateAssistantPermissions ya está importado estáticamente
        await updateAssistantPermissions(classId, assistantId, permissions, updatedBy);

        // Actualizar la clase en el store
        const classIndex = this.classes.findIndex((c) => c.id === classId);
        if (classIndex >= 0) {
          // getClassByIdFirestore ya está importado estáticamente
          const updatedClass = await getClassByIdFirestore(classId);
          if (updatedClass) {
            this.classes[classIndex] = this.normalizeClassData(updatedClass);
          }
        }
      });
    },

    /**
     * Verifica si un maestro tiene permisos específicos en una clase
     */
    async checkTeacherPermission(classId: string, teacherId: string, permission: string) {
      // checkTeacherPermission ya está importado estáticamente
      return await checkTeacherPermission(classId, teacherId, permission);
    },

    /**
     * Obtiene todas las clases desde Firestore y actualiza el store SOLO si es necesario.
     * Si ya hay datos y lastSync es reciente, retorna los datos cacheados.
     */
    async fetchClassesIfNeeded() {
      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (
        this.classes.length > 0 &&
        this.lastSync &&
        now - new Date(this.lastSync).getTime() < FIVE_MINUTES
      ) {
        // Retornar datos cacheados
        return this.classes;
      }
      // Si no hay datos o están desactualizados, hace fetch
      await this.fetchClasses();
      return this.classes;
    },

    /**
     * Obtiene las clases de un maestro específico usando caché inteligente
     * Si ya hay datos cacheados y son recientes, los retorna sin consultar Firestore
     */
    async fetchTeacherClassesIfNeeded(teacherId: string) {
      if (!teacherId) return [];

      const now = new Date();
      const FIVE_MINUTES = 5 * 60 * 1000;

      // Verificar si tenemos datos cacheados para este maestro
      const cachedData = this.teacherClassesCache[teacherId];
      if (cachedData && now.getTime() - new Date(cachedData.lastSync).getTime() < FIVE_MINUTES) {
        console.log(`[ClassesStore] Usando caché para maestro ${teacherId}`);
        return cachedData.data;
      }

      // Si no hay caché o está desactualizado, consultar servicio
      console.log(`[ClassesStore] Consultando Firestore para maestro ${teacherId}`);
      try {
        let teacherClasses;

        // Intentar usar el servicio específico de maestros primero
        try {
          teacherClasses = await getTeacherClasses(teacherId);
        } catch (serviceError) {
          console.warn(
            '[ClassesStore] Servicio getTeacherClasses falló, usando fallback:',
            serviceError,
          );

          // Fallback: obtener todas las clases y filtrar localmente
          await this.fetchClasses();
          teacherClasses = this.getAllTeacherClasses(teacherId);
        }

        // Actualizar caché
        this.teacherClassesCache[teacherId] = {
          data: teacherClasses,
          lastSync: now,
        };

        console.log(
          `[ClassesStore] ✅ Clases del maestro ${teacherId} cargadas: ${teacherClasses.length}`,
        );
        return teacherClasses;
      } catch (error) {
        console.error('Error fetching teacher classes:', error);
        throw error;
      }
    },

    /**
     * Fuerza la actualización del caché para un maestro específico
     */
    async refreshTeacherClassesCache(teacherId: string) {
      if (!teacherId) return [];

      console.log(`[ClassesStore] Forzando actualización de caché para maestro ${teacherId}`);
      delete this.teacherClassesCache[teacherId]; // Eliminar caché existente

      try {
        return await this.fetchTeacherClassesIfNeeded(teacherId);
      } catch (error) {
        console.error(`[ClassesStore] Error al refrescar caché para maestro ${teacherId}:`, error);

        // Fallback: intentar obtener del caché local existente
        const localClasses = this.getAllTeacherClasses(teacherId);
        console.log(
          `[ClassesStore] Usando datos locales como fallback: ${localClasses.length} clases`,
        );
        return localClasses;
      }
    },

    /**
     * Limpia todo el caché de clases de maestros
     */
    clearTeacherClassesCache() {
      console.log('[ClassesStore] Limpiando caché de clases de maestros');
      this.teacherClassesCache = {};
    },

    /**
     * Obtiene clases del caché local del store usando getters
     * Sin hacer consultas a Firestore
     */
    getCachedTeacherClasses(teacherId: string) {
      if (!teacherId) return [];

      // Primero intentar obtener del caché específico de maestros
      const cachedData = this.teacherClassesCache[teacherId];
      if (cachedData) {
        const now = new Date();
        const FIVE_MINUTES = 5 * 60 * 1000;
        if (now.getTime() - new Date(cachedData.lastSync).getTime() < FIVE_MINUTES) {
          return cachedData.data;
        }
      }

      // Si no hay caché específico, usar los getters locales como fallback
      return this.getAllTeacherClasses(teacherId);
    },

    /**
     * Busca una clase por ID en clases regulares y emergentes
     * Extiende la funcionalidad para incluir clases emergentes
     */
    async findClassById(id: string) {
      // Primero buscar en clases regulares
      const regularClass = this.getClassById(id);
      if (regularClass) {
        return regularClass;
      }

      // Si no se encuentra en clases regulares, buscar en clases emergentes
      try {
        const { getEmergencyClassByIdFirebase } = await import(
          '../../Attendance/service/emergencyClass'
        );
        const emergencyClass = await getEmergencyClassByIdFirebase(id);

        if (emergencyClass) {
          // Convertir la clase emergente al formato completo esperado por AttendanceList
          const normalizedEmergencyClass = this.normalizeEmergencyClassData(emergencyClass);
          return normalizedEmergencyClass;
        }
      } catch (error) {
        console.error(`Error buscando clase emergente ${id}:`, error);
      }

      return null;
    },

    /**
     * Normaliza los datos de una clase emergente para que sea compatible con ClassData
     * y el componente AttendanceList
     */
    normalizeEmergencyClassData(emergencyClass: any): ClassData & {isEmergencyClass: boolean} {
      // Asegurar que tenemos todos los campos requeridos
      const normalizedClass = {
        // Campos básicos requeridos por ClassData
        id: emergencyClass.id,
        name:
          emergencyClass.className || `Clase Emergente ${emergencyClass.id?.substring(0, 8) || ''}`,
        className:
          emergencyClass.className || `Clase Emergente ${emergencyClass.id?.substring(0, 8) || ''}`, // Para compatibilidad
        teacherId: emergencyClass.teacherId || '',
        studentIds: Array.isArray(emergencyClass.selectedStudents)
          ? emergencyClass.selectedStudents
          : [],

        // Campos descriptivos
        description: this.buildEmergencyDescription(emergencyClass),
        level: 'Emergencia',
        instrument: emergencyClass.instrument || 'Múltiples instrumentos',

        // Horario simulado basado en la fecha de la clase emergente
        schedule: this.buildEmergencySchedule(emergencyClass),

        // Estados y fechas
        isActive: emergencyClass.status === 'active' || emergencyClass.isActive !== false,
        createdAt: this.parseDate(emergencyClass.createdAt),
        updatedAt: this.parseDate(emergencyClass.updatedAt),

        // Campos adicionales para compatibilidad completa
        capacity: emergencyClass.selectedStudents?.length || 0,
        maxCapacity: emergencyClass.selectedStudents?.length || 50,
        location: emergencyClass.location || 'Aula a determinar',
        notes: emergencyClass.notes || emergencyClass.reason || '',

        // Campos opcionales que podrían estar presentes
        teachers: emergencyClass.assistantTeachers || [],
        subject: emergencyClass.subject || 'Ensayo/Práctica',
        academicYear: new Date().getFullYear().toString(),
        semester: this.getCurrentSemester(),

        // Marcador especial para identificar clases emergentes
        isEmergencyClass: true,

        // Datos específicos de la clase emergente (para debugging y referencia)
        emergencyData: {
          originalId: emergencyClass.id,
          date: emergencyClass.date,
          startTime: emergencyClass.startTime,
          endTime: emergencyClass.endTime,
          reason: emergencyClass.reason,
          status: emergencyClass.status,
          location: emergencyClass.location,
        },
      } as ClassData & {
        isEmergencyClass: boolean
        className: string
        emergencyData: any
      };

      console.log('[ClassStore] Clase emergente normalizada:', {
        id: normalizedClass.id,
        name: normalizedClass.name,
        studentCount: normalizedClass.studentIds.length,
        teacherId: normalizedClass.teacherId,
      });

      return normalizedClass;
    },

    /**
     * Construye una descripción informativa para la clase emergente
     */
    buildEmergencyDescription(emergencyClass: any): string {
      const parts = ['Clase emergente'];

      if (emergencyClass.reason) {
        parts.push(`- ${emergencyClass.reason}`);
      }

      if (emergencyClass.date) {
        const date = new Date(emergencyClass.date);
        parts.push(`- Fecha: ${date.toLocaleDateString('es-ES')}`);
      }

      if (emergencyClass.startTime && emergencyClass.endTime) {
        parts.push(`- Horario: ${emergencyClass.startTime} - ${emergencyClass.endTime}`);
      }

      if (emergencyClass.location) {
        parts.push(`- Ubicación: ${emergencyClass.location}`);
      }

      return parts.join(' ');
    },

    /**
     * Construye un objeto de horario simulado para la clase emergente
     */
    buildEmergencySchedule(emergencyClass: any): any {
      const emergencyDate = emergencyClass.date
        ? new Date(`${emergencyClass.date}T00:00:00`)
        : new Date();
      const dayName = emergencyDate.toLocaleDateString('es-ES', { weekday: 'long' });

      return {
        slots: [
          {
            id: `emergency-${emergencyClass.id}`,
            day: dayName,
            dayOfWeek: emergencyDate.getDay(),
            startTime: emergencyClass.startTime || '09:00',
            endTime: emergencyClass.endTime || '12:00',
            location: emergencyClass.location || 'Aula Principal',
            isEmergency: true,
          },
        ],
        isEmergencySchedule: true,
        emergencyDate: emergencyClass.date,
      };
    },

    /**
     * Parsea una fecha de diferentes formatos
     */
    parseDate(dateValue: any): Date {
      if (!dateValue) return new Date();

      if (dateValue instanceof Date) return dateValue;

      if (typeof dateValue === 'string') {
        // Si es una cadena YYYY-MM-DD, se le añade la hora para evitar problemas de UTC.
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          const parsed = new Date(`${dateValue}T00:00:00`);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        }
        // Para otros formatos de string (ej. ISO con timezone)
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      }

      if (typeof dateValue === 'number') {
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      }

      // Si es un timestamp de Firebase
      if (dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
      }

      return new Date();
    },

    /**
     * Obtiene el semestre actual
     */
    getCurrentSemester(): string {
      const month = new Date().getMonth() + 1; // getMonth() returns 0-11
      return month <= 6 ? 'Primer Semestre' : 'Segundo Semestre';
    },
  },
  persist: true,
});
