// src/stores/attendance.ts
import { defineStore } from 'pinia';
import { computed } from 'vue';

// Importamos los nuevos composables
import { useAttendanceDocuments } from '../composables/useAttendanceDocuments';
import { useAttendanceAnalytics } from '../composables/useAttendanceAnalytics';
import { useAttendanceObservations } from '../composables/useAttendanceObservations';
import { useAttendanceJustifications } from '../composables/useAttendanceJustifications';

import { useAuthStore } from '../../../stores/auth';
import { useClassesStore } from '../../Classes/store/classes';

import type {
  AttendanceDocument,
  JustificationData,
  AttendanceRecord,
  ClassObservation,
  AttendanceStatus,
  AttendanceAnalytics,
} from '../types/attendance';

export const useAttendanceStore = defineStore('attendance', () => {
  // Usar los composables para gestionar las diferentes responsabilidades
  const attendanceDocumentsComposable = useAttendanceDocuments();
  const attendanceAnalyticsComposable = useAttendanceAnalytics();
  const attendanceObservationsComposable = useAttendanceObservations();
  const attendanceJustificationsComposable = useAttendanceJustifications();

  // Exponer todas las propiedades y métodos de los composables
  return {
    ...attendanceDocumentsComposable,
    ...attendanceAnalyticsComposable,
    ...attendanceObservationsComposable,
    ...attendanceJustificationsComposable,

    // Propiedades y métodos que aún podrían ser específicos del store si no se mueven a un composable
    // Por ejemplo, si `currentClassAttendance` o `attendanceRecords` son estados globales que orquestan
    // la UI de múltiples componentes, podrían quedarse aquí o ser parte de un composable de estado global.
    // Por ahora, los mantendré aquí para que el `AttendanceFormView` pueda seguir funcionando.
    // Idealmente, `currentClassAttendance`, `attendanceRecords`, `records` se manejarían dentro de `useAttendanceFormLogic`
    // o en un composable de estado de UI más específico.
    currentClassAttendance: computed(() => {
      const doc = attendanceDocumentsComposable.currentAttendanceDoc.value;
      if (doc) {
        const attendanceData: Record<string, { status: AttendanceStatus; justification: string; observation: string }> = {};
        doc.data.presentes?.forEach(sId => attendanceData[sId] = { status: 'Presente', justification: '', observation: '' });
        doc.data.ausentes?.forEach(sId => attendanceData[sId] = { status: 'Ausente', justification: '', observation: '' });
        doc.data.tarde?.forEach(sId => attendanceData[sId] = { status: 'Tardanza', justification: '', observation: '' });
        doc.data.justificacion?.forEach((j: JustificationData) => attendanceData[j.studentId!] = { status: 'Justificado', justification: j.reason || '', observation: '' });
        
        return { ...attendanceData, observation: doc.data.observación || '' };
      }
      return null;
    }),
    attendanceRecords: computed(() => {
      // Esto es un placeholder. La lógica real de `attendanceRecords` debería estar en `useAttendanceFormLogic`
      // o en un composable que prepare los datos para la tabla.
      return {};
    }),
    records: computed(() => {
      // Esto es un placeholder. La lógica real de `records` debería estar en `useAttendanceFormLogic`
      // o en un composable que prepare los datos para la tabla.
      return [];
    }),

    // Getters que dependen de estados que aún no se han movido completamente
    getAttendanceForClass: computed(() => {
      return (date: string, classId: string) => {
        const key = `${date}_${classId}`;
        const doc = attendanceDocumentsComposable.currentAttendanceDoc.value;
        if (doc && doc.fecha === date && doc.classId === classId) {
          const attendanceData: Record<string, { status: AttendanceStatus; justification: string; observation: string }> = {};
          doc.data.presentes?.forEach(sId => attendanceData[sId] = { status: 'Presente', justification: '', observation: '' });
          doc.data.ausentes?.forEach(sId => attendanceData[sId] = { status: 'Ausente', justification: '', observation: '', });
          doc.data.tarde?.forEach(sId => attendanceData[sId] = { status: 'Tardanza', justification: '', observation: '', });
          doc.data.justificacion?.forEach((j: JustificationData) => attendanceData[j.studentId!] = { status: 'Justificado', justification: j.reason || '', observation: '', });
          
          return { ...attendanceData, observation: doc.data.observación || '' };
        }
        return null;
      };
    }),

    getObservations: computed(() => {
      const observacion = attendanceDocumentsComposable.currentAttendanceDoc.value?.data?.observación;
      if (!observacion) return '';
      if (Array.isArray(observacion)) {
        return observacion.join('\n');
      }
      return observacion;
    }),

    // Acciones que orquestan o son de alto nivel
    async saveAttendance(payload: {
      date: string;
      classId: string;
      attendance?: Record<string, { status: AttendanceStatus; justification: string }>;
      observation?: string;
      presentes?: string[];
      ausentes?: string[];
      tarde?: string[];
      justificacion?: any[];
      observations?: string;
    }) {
      const authStore = useAuthStore();
      const teacherId = authStore.user?.uid;
      if (!teacherId) {
        throw new Error('User not authenticated.');
      }

      const attendanceDoc: AttendanceDocument = {
        id: `${payload.date}_${payload.classId}`,
        fecha: payload.date,
        classId: payload.classId,
        teacherId,
        uid: teacherId,
        data: {
          presentes: payload.presentes || [],
          ausentes: payload.ausentes || [],
          tarde: payload.tarde || [],
          justificacion: payload.justificacion || [],
          observación: payload.observations || payload.observation || '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docId = await attendanceDocumentsComposable.saveAttendanceDocument(attendanceDoc);
      return { success: true, message: 'Asistencia guardada correctamente', documentId: docId };
    },

    async fetchAttendanceForClass(date: string, classId: string) {
      await attendanceDocumentsComposable.fetchAttendanceDocument(date, classId);
    },

    validateAttendanceDate: (date: string): boolean => {
      const selectedDate = new Date(date);
      const today = new Date();
      return selectedDate <= today && !isNaN(selectedDate.getTime());
    },

    getClassScheduleDays: (classId: string): string[] => {
      const classesStore = useClassesStore();
      const classData = classesStore.getClassById?.(classId);

      if (classData?.schedule) {
        if ('slots' in classData.schedule && Array.isArray(classData.schedule.slots)) {
          return classData.schedule.slots.map((slot: any) => slot.day) || [];
        }
        if ('day' in classData.schedule) {
          return [(classData.schedule as any).day];
        }
      }
      return [];
    },

    async debugAttendanceSystem(date: string, classId: string, teacherId: string) {
      console.log('  - ClassId:', classId);
      console.log('  - TeacherId:', teacherId);

      if (!teacherId) {
        console.error('❌ No hay teacherId - usuario no autenticado');
        return;
      }

      console.log('\n1. Probando método original getAttendanceDocument...');
      const originalResult = await attendanceDocumentsComposable.fetchAttendanceDocument(
        attendanceDocumentsComposable.normalizeDate(date),
        classId,
        teacherId,
      );
      console.log('   Resultado:', originalResult ? 'ENCONTRADO' : 'NO ENCONTRADO');
      if (originalResult) {
        console.log('   Documento ID:', originalResult.id);
        console.log('   TeacherId del documento:', originalResult.teacherId);
        console.log('   Datos de asistencia:', {
          presentes: originalResult.data.presentes?.length || 0,
          ausentes: originalResult.data.ausentes?.length || 0,
          tarde: originalResult.data.tarde?.length || 0,
          justificacion: originalResult.data.justificacion?.length || 0,
        });
      }

      console.log('\n2. Probando búsqueda por fecha sin filtros...');
      const dateDocuments = await attendanceDocumentsComposable.getAttendanceDocumentsByDate(
        attendanceDocumentsComposable.normalizeDate(date),
        teacherId
      );
      console.log(`   Documentos encontrados para la fecha: ${dateDocuments.length}`);
      dateDocuments.forEach((doc, index) => {
        console.log(`   Documento ${index + 1}:`, {
          id: doc.id,
          classId: doc.classId,
          teacherId: doc.teacherId,
          fecha: doc.fecha,
          estudiantesTotal:
            (doc.data.presentes?.length || 0) +
            (doc.data.ausentes?.length || 0) +
            (doc.data.tarde?.length || 0) +
            (doc.data.justificacion?.length || 0),
        });
      });

      console.log('\n3. Probando búsqueda por teacherId...');
      const teacherDocuments = await attendanceDocumentsComposable.fetchAttendanceDocumentsByTeacher(
        teacherId,
        attendanceDocumentsComposable.normalizeDate(date),
        attendanceDocumentsComposable.normalizeDate(date),
      );
      console.log(`   Documentos encontrados para el profesor: ${teacherDocuments.length}`);
      teacherDocuments.forEach((doc, index) => {
        console.log(`   Documento ${index + 1}:`, {
          id: doc.id,
          classId: doc.classId,
          teacherId: doc.teacherId,
          esLaClaseCorrecta: doc.classId === classId,
        });
      });

      const targetDocument = teacherDocuments.find((doc) => doc.classId === classId);
      if (targetDocument) {
        console.log('\n✅ DOCUMENTO OBJETIVO ENCONTRADO:');
        console.log('   ID:', targetDocument.id);
        console.log('   Estados de estudiantes:', {
          presentes: targetDocument.data.presentes,
          ausentes: targetDocument.data.ausentes,
          tarde: targetDocument.data.tarde,
          justificados: targetDocument.data.justificacion?.map((j: any) => j.id || j.studentId),
        });
      } else {
        console.log('\n❌ NO SE ENCONTRÓ DOCUMENTO PARA ESTA COMBINACIÓN ESPECÍFICA');
        console.log('   Verificar que existe un documento de asistencia para:');
        console.log('   - Fecha:', attendanceDocumentsComposable.normalizeDate(date));
        console.log('   - Clase:', classId);
        console.log('   - Profesor:', teacherId);
      }

      console.log('=== FIN DEBUG ===\n');

      return {
        originalResult,
        dateDocuments,
        teacherDocuments,
        targetDocument,
      };
    },

    async getStudentAbsencesByDateRange(
      studentId: string,
      startDate: string,
      endDate: string,
    ) {
      const attendanceDocs = await attendanceDocumentsComposable.fetchAttendanceDocuments(startDate, endDate);
      const absences = attendanceDocs.filter((doc) => {
        const studentRecord = doc.students?.[studentId];
        return (
          studentRecord &&
          (studentRecord.status === 'Ausente' || studentRecord.status === 'Justificado')
        );
      });

      const result = absences
        .map((doc) => {
          const studentRecord = doc.students?.[studentId];
          if (!studentRecord) return null;

          return {
            id: doc.id,
            date: doc.fecha,
            classId: doc.classId,
            status: studentRecord.status,
            reason: studentRecord.justification || null,
            createdAt: doc.createdAt || null,
          };
        })
        .filter(Boolean);

      console.log(`[Attendance] Found ${result.length} absences for student ${studentId}`);
      return result;
    },

    async getStudentAttendanceByDateRange(
      studentId: string,
      startDate: string,
      endDate: string,
      classId?: string,
    ) {
      const documents = await attendanceDocumentsComposable.fetchAttendanceDocuments(startDate, endDate);
      const studentRecords: AttendanceRecord[] = [];

      documents.forEach((doc) => {
        if (classId && doc.classId !== classId) {
          return;
        }

        if (doc.data.presentes?.includes(studentId)) {
          studentRecords.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_presente`,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: 'Presente',
            createdAt: doc.createdAt || new Date(),
          });
        }

        if (doc.data.ausentes?.includes(studentId)) {
          const justification = doc.data.justificacion?.find((j) => j.id === studentId);
          studentRecords.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_ausente`,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: justification ? 'Justificado' : 'Ausente',
            justification: justification?.reason,
            createdAt: doc.createdAt || new Date(),
          });
        }

        if (doc.data.tarde?.includes(studentId)) {
          const justification = doc.data.justificacion?.find((j) => j.id === studentId);
          studentRecords.push({
            id: `${doc.fecha}_${doc.classId}_${studentId}_tarde`,
            fecha: doc.fecha,
            classId: doc.classId,
            studentId,
            status: justification ? 'Justificado' : 'Tardanza',
            justification: justification?.reason,
            createdAt: doc.createdAt || new Date(),
          });
        }
      });

      studentRecords.sort((a, b) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });

      console.log(`[Attendance] Found ${studentRecords.length} records for student ${studentId}`);
      return studentRecords;
    },

    async fetchAttendanceByDateRange(
      startDate: string,
      endDate: string,
      teacherId?: string,
    ): Promise<AttendanceRecord[]> {
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('La fecha inicial debe ser anterior o igual a la fecha final');
      }
      const recordsData = await attendanceDocumentsComposable.fetchAttendanceDocuments(startDate, endDate);
      const filteredRecords = teacherId
        ? recordsData.filter((record) => record.classId && record.classId.includes(teacherId))
        : recordsData;
      return filteredRecords;
    },

    async fetchAttendanceByDateRangeAndClasses(
      startDate: string,
      endDate: string,
      classIds: string[],
    ): Promise<AttendanceRecord[]> {
      console.log(
        `🔍 Obteniendo asistencias para ${classIds.length} clases entre ${startDate} y ${endDate}`,
      );
      const attendanceRecords = await attendanceDocumentsComposable.fetchAttendanceDocuments(startDate, endDate);
      // Filter by classIds here if the base fetch doesn't support it directly
      return attendanceRecords.filter(record => classIds.includes(record.classId));
    },
  };
});