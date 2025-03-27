// En src/stores/class.ts
import { defineStore } from 'pinia';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

interface Class {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

export const useClassStore = defineStore('class', {
  state: () => ({
    classes: [] as Class[],
    isLoading: false,
    error: null as string | null,
    cachedClasses: [] as Class[]
  }),

  getters: {
    getClassById: (state) => (id: string) => {
      return state.classes.find(cls => cls.id === id);
    }
  },

  actions: {
    async fetchClasses() {
      if (this.cachedClasses.length) return this.cachedClasses;
      this.isLoading = true;
      try {
        const q = query(collection(db, 'CLASES'), orderBy('name'));
        const snapshot = await getDocs(q);
        this.classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
        this.cachedClasses = this.classes;
      } catch (error) {
        this.error = 'Error al cargar las clases';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async validateSchedule(newClass: Class) {
      const q = query(
        collection(db, 'CLASES'),
        where('teacherId', '==', newClass.teacherId),
        where('schedule.days', 'array-contains-any', newClass.schedule.days)
      );
      const snapshot = await getDocs(q);
      return snapshot.empty; // True si no hay conflictos
    }
  }
});