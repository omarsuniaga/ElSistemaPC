// src/modulos/Attendance/composables/useAttendanceJustifications.ts
import { ref, computed } from 'vue';
import attendanceService from '../service/attendanceService';
import { useAuthStore } from '../../../stores/auth';
import type { JustificationData } from '../types/attendance';

export function useAttendanceJustifications() {
  const justifications = ref<JustificationData[]>([]);

  const getJustificationsByStudent = computed(() => {
    return (
      studentId: string,
      classId?: string,
      fecha?: string,
    ) => {
      return justifications.value.filter(
        (just) =>
          just.studentId === studentId &&
          (!classId || just.classId === classId) &&
          (!fecha || just.fecha === fecha),
      );
    };
  });

  const addJustification = async (
    justification: Omit<JustificationData, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    try {
      // Assuming addJustificationFirebase is part of attendanceService or a new firebase service
      // For now, I'll use a placeholder or assume it's handled by attendanceService
      // const newJustification = await attendanceService.addJustificationFirebase(justification);
      console.warn('addJustification: Placeholder for Firebase call');
      // Simulate adding to local state
      const newJustification = { ...justification, id: `temp-just-${Date.now()}` } as JustificationData;
      justifications.value.push(newJustification);
      return newJustification;
    } catch (err) {
      console.error('Error al agregar la justificación:', err);
      throw err;
    }
  };

  const fetchJustifications = async (studentId: string, classId?: string, date?: string) => {
    try {
      // Assuming fetchJustificationsFirebase is part of attendanceService
      // const fetchedJustifications = await attendanceService.fetchJustificationsFirebase(studentId, classId, date);
      console.warn('fetchJustifications: Placeholder for Firebase call');
      const fetchedJustifications: JustificationData[] = []; // Simulate empty fetch
      justifications.value = fetchedJustifications;
      return fetchedJustifications;
    } catch (err) {
      console.error('Error al cargar las justificaciones:', err);
      throw err;
    }
  };

  const addJustificationToAttendance = async (
    studentId: string,
    fecha: string,
    classId: string,
    reason: string,
    _file?: File,
  ) => {
    try {
      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;

      if (!teacherId) {
        throw new Error('Usuario no autenticado');
      }

      const justificationData: JustificationData = {
        id: studentId,
        studentId,
        classId,
        fecha,
        reason,
        documentUrl: '',
        approvalStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await attendanceService.addJustification(fecha, classId, justificationData, _file || null);
      console.log('Justificación guardada correctamente');
    } catch (err) {
      console.error('Error al guardar justificación:', err);
      throw err;
    }
  };

  return {
    justifications,
    getJustificationsByStudent,
    addJustification,
    fetchJustifications,
    addJustificationToAttendance,
  };
}
