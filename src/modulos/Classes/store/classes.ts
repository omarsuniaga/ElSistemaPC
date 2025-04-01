// src/modulos/Classes/store/classes.ts
import { defineStore } from 'pinia';
import { 
  fetchClassesFirestore,
  addClassFirestore,
  updateClassFirestore,
  removeClassFirestore,
  getClassByIdFirestore
} from "../service/classes";
import type { ClassData, ClassCreate } from "../types/class";

export const useClassesStore = defineStore('classes', {
  state: () => ({
    classes: [] as ClassData[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null
  }),

  getters: {
    // Retorna la clase por id
    getClassById: (state) => (id: string) => state.classes.find(classItem => classItem.id === id),
    // Filtra clases por nivel
    getClassesByLevel: (state) => (level: string) => state.classes.filter(classItem => classItem.level === level),
    // Filtra clases por instrumento
    getClassesByInstrument: (state) => (instrument: string) => state.classes.filter(classItem => classItem.instrument === instrument),
    // Filtra clases por maestro
    getClassesByTeacher: (state) => (teacherId: string) => state.classes.filter(classItem => classItem.teacherId === teacherId),
    // Filtra clases por alumno
    getClassesByStudent: (state) => (studentId: string) => state.classes.filter(classItem => classItem.studentIds && classItem.studentIds.includes(studentId)),
    // Retorna clases que tienen definido un horario
    getScheduledClasses: (state) => state.classes.filter(classItem => classItem.schedule),
    // Retorna clases sin horario definido
    getUnscheduledClasses: (state) => state.classes.filter(classItem => !classItem.schedule)
  },

  actions: {
    /**
     * Normaliza la data de una clase para asegurar que el campo "schedule" tenga la estructura esperada.
     */
    normalizeClassData(classItem: any): ClassData {
      return {
        ...classItem,
        id: String(classItem.id),
        // Normalizar studentIds para garantizar que siempre sea un array
        studentIds: Array.isArray(classItem.studentIds) 
          ? classItem.studentIds 
          : (classItem.studentIds ? [classItem.studentIds] : []),
        schedule: (classItem.schedule && classItem.schedule.slots && Array.isArray(classItem.schedule.slots))
          ? classItem.schedule
          : {
              slots: classItem.schedule
                ? [{
                    day: classItem.schedule.days || '',
                    startTime: classItem.schedule.startTime || '',
                    endTime: classItem.schedule.endTime || ''
                  }]
                : []
            },
      };
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
          updatedAt: new Date()
        };
        const normalizedClass = this.normalizeClassData(createdClass);
        this.classes.push(normalizedClass);
        return normalizedClass;
      });
    },

    /**
     * Actualiza una clase existente en Firestore.
     */
    async updateClass(updatedClass: Partial<ClassData> & { id: string }) {
      return await this.withLoading(async () => {
        await updateClassFirestore(updatedClass.id, updatedClass);
        const index = this.classes.findIndex(c => c.id === updatedClass.id);
        let updatedData: ClassData;
        if (index !== -1) {
          updatedData = this.normalizeClassData({ ...this.classes[index], ...updatedClass });
          this.classes[index] = updatedData;
        } else {
          updatedData = this.normalizeClassData(updatedClass);
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
        this.classes = this.classes.filter(c => c.id !== classId);
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
        const index = this.classes.findIndex(c => c.id === classId);
        if (index === -1) {
          this.classes.push(normalizedClass);
        } else {
          this.classes[index] = normalizedClass;
        }
        return normalizedClass;
      });
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

    /**
     * Remueve un alumno de una clase.
     */
    async removeStudent(classId: string, studentId: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        const studentIds = (classData.studentIds || []).filter(id => id !== studentId);
        return await this.updateClass({ ...classData, studentIds });
      });
    },

    /**
     * Actualiza el horario de una clase y opcionalmente el salón.
     * El horario debe tener la estructura adecuada según la interfaz ClassData.
     */
    async scheduleClass(
      classId: string, 
      scheduleData: {
        day: string,
        startTime: string,
        endTime: string
      } | {
        day: string,
        startTime: string,
        endTime: string
      }[], 
      classroom?: string
    ) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        
        // Normalizar el formato del horario según la interfaz ClassData
        const normalizedSchedule = {
          slots: Array.isArray(scheduleData) 
            ? scheduleData 
            : [scheduleData]
        };
        
        return await this.updateClass({
          ...classData,
          schedule: normalizedSchedule,
          classroom: classroom || classData.classroom
        });
      });
    },
    
    /**
     * Agrega un nuevo slot de horario a una clase existente
     */
    async addScheduleSlot(
      classId: string,
      slot: {
        day: string,
        startTime: string,
        endTime: string
      }
    ) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        
        const currentSchedule = classData.schedule || { slots: [] };
        const updatedSchedule = {
          slots: [...currentSchedule.slots, slot]
        };
        
        return await this.updateClass({
          ...classData,
          schedule: updatedSchedule
        });
      });
    },
    
    /**
     * Elimina un slot de horario de una clase existente
     */
    async removeScheduleSlot(
      classId: string,
      slotIndex: number
    ) {
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
          schedule: { slots: updatedSlots }
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
    }
  }
});
