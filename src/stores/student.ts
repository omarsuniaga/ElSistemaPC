import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  classIds: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export const useStudentStore = defineStore('student', {
  state: () => ({
    students: [] as Student[],
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    getStudentById: (state) => (id: string) =>
      state.students.find(s => s.id === id),
    
    getActiveStudents: (state) =>
      state.students.filter(s => s.status === 'active'),
    
    getStudentsByClass: (state) => (classId: string) =>
      state.students.filter(s => s.classIds.includes(classId))
  },

  actions: {
    async fetchStudents() {
      this.isLoading = true;
      this.error = null;
      try {
        const q = query(
          collection(db, 'ALUMNOS'),
        );
        const snapshot = await getDocs(q);
        this.students = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Student[];
      } catch (error) {
        this.error = 'Error al cargar los estudiantes';
        throw error;
      } finally {
        this.isLoading = false;
      }
    }, 
    async assignClass(studentId: string, classId: string) {
      const student = this.students.find(s => s.id === studentId);
      if (student?.classIds.includes(classId)) {
        throw new Error('El alumno ya está inscrito en esta clase');
      }
      await updateDoc(doc(db, 'ALUMNOS', studentId), {
        classIds: arrayUnion(classId)
      });
    },

    async getAttendanceReport() {
      const q = query(collection(db, 'ASISTENCIAS'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    }
  }
});
