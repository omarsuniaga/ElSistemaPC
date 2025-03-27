import { defineStore } from 'pinia';
import { 
  fetchClassesFirestore,
  addClassFirestore,
  updateClassFirestore,
  removeClassFirestore,
  getClassByIdFirestore
} from "../service/classes";
import { ClassData } from "../types/class";

export const useClassesStore = defineStore('classes', {
  state: () => ({
    classes: [] as ClassData[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null
  }),

  getters: {
    getClassById: (state) => (id: string) => state.classes.find(classItem => classItem.id === id),
    getClassesByLevel: (state) => (level: string) => state.classes.filter(classItem => classItem.level === level),
    getClassesByInstrument: (state) => (instrument: string) => state.classes.filter(classItem => classItem.instrument === instrument),
    getClassesByTeacher: (state) => (teacherId: string) => state.classes.filter(classItem => classItem.teacherId === teacherId),
    getClassesByStudent: (state) => (studentId: string) => state.classes.filter(classItem => classItem.studentIds && classItem.studentIds.includes(studentId)),
    getScheduledClasses: (state) => state.classes.filter(classItem => classItem.schedule),
    getUnscheduledClasses: (state) => state.classes.filter(classItem => !classItem.schedule)
  },

  actions: {
    // Normaliza la data de una clase para asegurar un formato consistente
    normalizeClassData(classItem: any): ClassData {
      return {
        ...classItem,
        id: String(classItem.id),
        schedule: (classItem.schedule && Array.isArray(classItem.schedule.slots))
          ? classItem.schedule
          : { slots: classItem.schedule
              ? [{
                  day: classItem.schedule.days || '',
                  startTime: classItem.schedule.startTime || '',
                  endTime: classItem.schedule.endTime || ''
                }]
              : [] },
      };
    },

    // Helper para gestionar loading y errores
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

    async fetchClasses() {
      return await this.withLoading(async () => {
        const classes = await fetchClassesFirestore();
        this.classes = classes.map((classItem: any) => this.normalizeClassData(classItem));
        this.lastSync = new Date();
        return this.classes;
      });
    },

    async addClass(classData: { contentIds: string[] } & Omit<ClassData, 'id'>) {
      console.log("add class", classData)
      return
      // return await this.withLoading(async () => {
      //   const newClassId = await addClassFirestore(classData);
      //   const createdClass: ClassData = {
      //     ...classData,
      //     id: newClassId,
      //     contentIds: classData.contentIds,
      //     createdAt: new Date(),
      //     updatedAt: new Date()
      //   };
      //   const normalizedClass = this.normalizeClassData(createdClass);
      //   this.classes.push(normalizedClass);
      //   return normalizedClass;
      // });
    },

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

    async removeClass(classId: string) {
      return await this.withLoading(async () => {
        await removeClassFirestore(classId);
        this.classes = this.classes.filter(c => c.id !== classId);
        return { success: true };
      });
    },

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

    async assignTeacher(classId: string, teacherId: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        return await this.updateClass({ ...classData, teacherId });
      });
    },

    async assignStudent(classId: string, studentId: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        const studentIds = [...(classData.studentIds || [])];
        if (!studentIds.includes(studentId)) studentIds.push(studentId);
        return await this.updateClass({ ...classData, studentIds });
      });
    },

    async removeStudent(classId: string, studentId: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        const studentIds = (classData.studentIds || []).filter(id => id !== studentId);
        return await this.updateClass({ ...classData, studentIds });
      });
    },

    async scheduleClass(classId: string, schedule: string | { days: string[], startTime: string, endTime: string }, classroom?: string) {
      return await this.withLoading(async () => {
        const classData = this.getClassById(classId);
        if (!classData) throw new Error('Clase no encontrada');
        return await this.updateClass({
          ...classData,
          schedule,
          classroom: classroom || classData.classroom
        });
      });
    }
  }
});
