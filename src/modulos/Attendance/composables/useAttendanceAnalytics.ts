// src/modulos/Attendance/composables/useAttendanceAnalytics.ts
import { ref } from 'vue';
import { format } from 'date-fns';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';

import { db } from '../../../firebase';
import { ATTENDANCE_COLLECTION } from '../service/firebase/attendanceFirebase'; // Importar la colección desde el nuevo archivo Firebase
import { useClassesStore } from '../../Classes/store/classes';
import { useStudentsStore } from '../../Students/store/students';

import type { AttendanceDocument, AttendanceAnalytics } from '../types/attendance';

export function useAttendanceAnalytics() {
  const analytics = ref<AttendanceAnalytics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Utility function (copied from useAttendanceDocuments for now, could be shared)
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
      // Fallback for other date formats, assuming parseISO and format are available
      // For simplicity, directly return if not standard format, or add date-fns imports
      return date; // This might need proper date-fns parsing if other formats are expected
    } catch (error) {
      console.error('Error al normalizar fecha:', error);
      throw error;
    }
  };

  const updateAnalytics = async (skipIfRecentlyUpdated = true): Promise<void> => {
    try {
      if (skipIfRecentlyUpdated && analytics.value) {
        const lastUpdate = analytics.value.lastUpdated;
        if (lastUpdate && Date.now() - lastUpdate.getTime() < 300000) {
          return; // Skip update if analytics are fresh (5 minutes)
        }
      }

      loading.value = true;
      error.value = null;

      // Fetch all attendance documents for analytics calculation
      // This might need to be optimized for large datasets, e.g., by fetching only recent data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Last 30 days

      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // Directly query Firestore for attendance documents
      const q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('fecha', '>=', formattedStartDate),
        where('fecha', '<=', formattedEndDate),
      );
      const querySnapshot = await getDocs(q);
      const attendanceDocs: AttendanceDocument[] = [];
      querySnapshot.forEach((doc) => {
        attendanceDocs.push({ id: doc.id, ...doc.data() } as AttendanceDocument);
      });

      const stats = {
        totalClasses: 0,
        totalStudents: 0,
        averageAttendance: 0,
        absentStudents: [], // This will be populated by fetchTopAbsentStudentsByRange
        lastUpdated: new Date(),
        byClass: {} as Record<
          string,
          {
            present: number;
            absent: number;
            delayed: number;
            justified: number;
            total: number;
          }
        >,
      };

      attendanceDocs.forEach((doc) => {
        if (doc.data) {
          stats.totalClasses++;

          const classStats = stats.byClass[doc.classId] || {
            present: 0,
            absent: 0,
            delayed: 0,
            justified: 0,
            total: 0,
          };

          classStats.present += doc.data.presentes?.length || 0;
          classStats.absent += doc.data.ausentes?.length || 0;
          classStats.delayed += doc.data.tarde?.length || 0;
          classStats.justified += doc.data.justificacion?.length || 0;

          classStats.total =
            classStats.present + classStats.absent + classStats.delayed + classStats.justified;

          stats.byClass[doc.classId] = classStats;
        }
      });

      if (stats.totalClasses > 0) {
        const totalPresent = Object.values(stats.byClass).reduce(
          (sum, classStat) => sum + classStat.present,
          0,
        );
        const totalStudents = Object.values(stats.byClass).reduce(
          (sum, classStat) => sum + classStat.total,
          0,
        );
        stats.averageAttendance = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;
      }

      analytics.value = stats;
    } catch (err) {
      error.value = 'Error al actualizar analíticas';
      console.error('Error en updateAnalytics:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTopAbsentStudentsByRange = async (
    startDate: string,
    endDate: string,
    limit: number,
    classId?: string,
    teacherId?: string,
  ): Promise<
    Array<{
      studentId: string;
      studentName: string;
      absences: number;
      percentage: number;
      totalPossibleClasses: number;
    }>
  > => {
    loading.value = true;
    error.value = null;
    try {
      console.log(
        `[AttendanceAnalytics] Fetching top absent students for range: ${startDate} - ${endDate}, class: ${classId || 'all'}, teacher: ${teacherId || 'all'}, limit: ${limit}`,
      );
      const normalizedStartDate = normalizeDate(startDate);
      const normalizedEndDate = normalizeDate(endDate);

      let validClassIds: string[] = [];

      if (teacherId) {
        const classesStore = useClassesStore();
        const teacherClasses = classesStore.getClassesByTeacher(teacherId);
        validClassIds = teacherClasses.map((c) => c.id);

        if (validClassIds.length === 0) {
          console.log(`[AttendanceAnalytics] No classes found for teacher ${teacherId}`);
          return [];
        }

        console.log(
          `[AttendanceAnalytics] Found ${validClassIds.length} classes for teacher ${teacherId}`,
        );
      }

      let queryRef = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('fecha', '>=', normalizedStartDate),
        where('fecha', '<=', normalizedEndDate),
      );

      if (classId) {
        queryRef = query(queryRef, where('classId', '==', classId));
      } else if (teacherId && validClassIds.length > 0) {
        if (validClassIds.length <= 10) {
          queryRef = query(queryRef, where('classId', 'in', validClassIds));
        } else {
          console.log(
            `[AttendanceAnalytics] Teacher has ${validClassIds.length} classes, will use post-filtering`,
          );
        }
      }

      const querySnapshot = await getDocs(queryRef);
      let attendanceDocs: AttendanceDocument[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        attendanceDocs.push({ id: doc.id, ...doc.data() } as AttendanceDocument);
      });

      if (teacherId && validClassIds.length > 10) {
        attendanceDocs = attendanceDocs.filter((doc) => validClassIds.includes(doc.classId));
      }

      console.log(
        `[AttendanceAnalytics] Found ${attendanceDocs.length} attendance documents for the range.`,
      );

      const studentAbsenceMap: Map<string, { absences: number; totalPossibleClasses: number }> =
        new Map();
      const classDatesMap = new Map<string, Set<string>>(); // classId -> Set<date>

      attendanceDocs.forEach((doc) => {
        if (!classDatesMap.has(doc.classId)) {
          classDatesMap.set(doc.classId, new Set());
        }
        classDatesMap.get(doc.classId)!.add(doc.fecha);

        doc.data.ausentes?.forEach((studentId) => {
          const current = studentAbsenceMap.get(studentId) || { absences: 0, totalPossibleClasses: 0 };
          studentAbsenceMap.set(studentId, { ...current, absences: current.absences + 1 });
        });
      });

      let totalUniqueClassSessions = 0;
      classDatesMap.forEach((dates) => {
        totalUniqueClassSessions += dates.size;
      });

      studentAbsenceMap.forEach((stats, studentId) => {
        if (classId && classDatesMap.has(classId)) {
          studentAbsenceMap.set(studentId, {
            ...stats,
            totalPossibleClasses: classDatesMap.get(classId)!.size,
          });
        } else if (!classId) {
          studentAbsenceMap.set(studentId, {
            ...stats,
            totalPossibleClasses: totalUniqueClassSessions,
          });
        } else {
          studentAbsenceMap.set(studentId, { ...stats, totalPossibleClasses: 0 });
        }
      });

      const studentsStore = useStudentsStore();
      const topAbsentees = Array.from(studentAbsenceMap.entries())
        .map(([studentId, stats]) => {
          const student = studentsStore.getStudentById(studentId);
          const studentName = student ? `${student.nombre} ${student.apellido}` : 'Unknown Student';
          const percentage =
            stats.totalPossibleClasses > 0 ? (stats.absences / stats.totalPossibleClasses) * 100 : 0;
          return {
            studentId,
            studentName,
            absences: stats.absences,
            percentage: parseFloat(percentage.toFixed(2)),
            totalPossibleClasses: stats.totalPossibleClasses,
          };
        })
        .filter((s) => s.absences > 0)
        .sort((a, b) => b.absences - a.absences || b.percentage - a.percentage)
        .slice(0, limit);

      console.log('[AttendanceAnalytics] Top absent students:', topAbsentees);
      return topAbsentees;
    } catch (err) {
      console.error('[AttendanceAnalytics] Error in fetchTopAbsentStudentsByRange:', err);
      error.value = 'Error al calcular los estudiantes más ausentes.';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTopAbsentStudentsByTeacher = async (
    startDate: string,
    endDate: string,
    teacherId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      studentId: string;
      studentName: string;
      absences: number;
      percentage: number;
      totalPossibleClasses: number;
    }>
  > => {
    console.log(
      `[AttendanceAnalytics] Fetching top absent students for teacher ${teacherId} from ${startDate} to ${endDate}`,
    );

    return await fetchTopAbsentStudentsByRange(
      startDate,
      endDate,
      limit,
      undefined, // classId
      teacherId, // teacherId
    );
  };

  return {
    analytics,
    loading,
    error,
    updateAnalytics,
    fetchTopAbsentStudentsByRange,
    fetchTopAbsentStudentsByTeacher,
  };
}
