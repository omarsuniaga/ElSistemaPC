import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Student } from '@/types';
import { getStudentsFirebase } from '@/modulos/Students/service/students';

interface StudentFilters {
  search: string
  status: string
  grade: string
  instrument: string
  class: string
}

interface StudentStats {
  total: number
  active: number
  inactive: number
  pending: number
  newThisMonth: number
  byGrade: Record<string, number>
  byInstrument: Record<string, number>
}

export const useAdminStudentsStore = defineStore('adminStudents', () => {
  // State
  const students = ref<Student[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<StudentFilters>({
    search: '',
    status: '',
    grade: '',
    instrument: '',
    class: '',
  });
  // Getters
  const studentStats = computed((): StudentStats => {
    const stats: StudentStats = {
      total: students.value.length,
      active: 0,
      inactive: 0,
      pending: 0,
      newThisMonth: 0,
      byGrade: {},
      byInstrument: {},
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    students.value.forEach((student) => {
      // Status counts - usando el campo 'activo' de la estructura real
      if (student.activo) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Si hay un campo status específico, usarlo
      if (student.status === 'pending') {
        stats.pending++;
      }

      // New this month - usando fecInscripcion
      if (student.fecInscripcion) {
        const enrollmentDate = new Date(student.fecInscripcion);
        if (enrollmentDate >= startOfMonth) {
          stats.newThisMonth++;
        }
      }

      // By instrument - usando el campo 'instrumento'
      if (student.instrumento) {
        stats.byInstrument[student.instrumento] = (stats.byInstrument[student.instrumento] || 0) + 1;
      }
    });

    return stats;
  });
  const filteredStudents = computed(() => {
    let filtered = [...students.value];

    // Search filter - usando campos reales de la estructura Student
    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.nombre?.toLowerCase().includes(searchTerm) ||
          student.apellido?.toLowerCase().includes(searchTerm) ||
          student.email?.toLowerCase().includes(searchTerm) ||
          student.tlf?.includes(searchTerm) ||
          student.madre?.toLowerCase().includes(searchTerm) ||
          student.padre?.toLowerCase().includes(searchTerm),
      );
    }

    // Status filter - usando campo 'activo'
    if (filters.value.status) {
      if (filters.value.status === 'active') {
        filtered = filtered.filter((student) => student.activo === true);
      } else if (filters.value.status === 'inactive') {
        filtered = filtered.filter((student) => student.activo === false);
      } else if (filters.value.status === 'pending') {
        filtered = filtered.filter((student) => student.status === 'pending');
      }
    }

    // Instrument filter - usando campo 'instrumento'
    if (filters.value.instrument) {
      filtered = filtered.filter((student) => student.instrumento === filters.value.instrument);
    }

    // Class filter - usando campo 'grupo' o 'clase'
    if (filters.value.class) {
      filtered = filtered.filter((student) => {
        if (student.grupo && Array.isArray(student.grupo)) {
          return student.grupo.includes(filters.value.class);
        }
        return student.clase === filters.value.class;
      });
    }

    return filtered;
  });
  const activeStudents = computed(() => students.value.filter((student) => student.activo === true));

  const recentStudents = computed(() =>
    students.value
      .filter((student) => student.fecInscripcion)
      .sort((a, b) => new Date(b.fecInscripcion!).getTime() - new Date(a.fecInscripcion!).getTime())
      .slice(0, 10),
  );
  // Actions
  const loadStudents = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      // Usar el servicio existente que ya maneja la estructura correcta
      const studentsData = await getStudentsFirebase();
      students.value = studentsData;

      console.log('✅ Students loaded from admin store:', students.value.length);
    } catch (err: any) {
      console.error('❌ Error loading students in admin store:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };
  const getStudent = async (studentId: string): Promise<Student | null> => {
    try {
      const docRef = doc(db, 'ALUMNOS', studentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          fechaNacimiento: data.fechaNacimiento?.toDate() || data.fechaNacimiento,
          createdAt: data.createdAt?.toDate() || data.createdAt,
          updatedAt: data.updatedAt?.toDate() || data.updatedAt,
        } as Student;
      }

      return null;
    } catch (err: any) {
      console.error('❌ Error getting student:', err);
      throw err;
    }
  };
  const createStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const docRef = await addDoc(collection(db, 'ALUMNOS'), {
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newStudent: Student = {
        id: docRef.id,
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      students.value.push(newStudent);
      console.log('✅ Student created:', newStudent.nombre);

      return newStudent;
    } catch (err: any) {
      console.error('❌ Error creating student:', err);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const docRef = doc(db, 'ALUMNOS', studentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });

      // Update local state
      const index = students.value.findIndex((s) => s.id === studentId);
      if (index !== -1) {
        students.value[index] = {
          ...students.value[index],
          ...updates,
          updatedAt: new Date(),
        };
      }

      console.log('✅ Student updated:', studentId);
    } catch (err: any) {
      console.error('❌ Error updating student:', err);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateStudentStatus = async (studentId: string, status: Student['status']) => {
    await updateStudent(studentId, { status });
  };

  const deleteStudent = async (studentId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      await deleteDoc(doc(db, 'ALUMNOS', studentId));

      // Remove from local state
      students.value = students.value.filter((s) => s.id !== studentId);

      console.log('✅ Student deleted:', studentId);
    } catch (err: any) {
      console.error('❌ Error deleting student:', err);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  const searchStudents = async (searchTerm: string) => {
    try {
      if (!searchTerm.trim()) {
        return students.value;
      }

      const searchQuery = searchTerm.toLowerCase();
      return students.value.filter(
        (student) =>
          student.nombre?.toLowerCase().includes(searchQuery) ||
          student.apellido?.toLowerCase().includes(searchQuery) ||
          student.email?.toLowerCase().includes(searchQuery) ||
          student.tlf?.includes(searchQuery) ||
          student.madre?.toLowerCase().includes(searchQuery) ||
          student.padre?.toLowerCase().includes(searchQuery),
      );
    } catch (err: any) {
      console.error('❌ Error searching students:', err);
      throw err;
    }
  };
  const getStudentsByClass = async (classId: string) => {
    try {
      const studentsQuery = query(
        collection(db, 'ALUMNOS'),
        where('grupo', 'array-contains', classId),
      );

      const snapshot = await getDocs(studentsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fechaNacimiento: doc.data().fechaNacimiento?.toDate() || doc.data().fechaNacimiento,
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate() || doc.data().updatedAt,
      })) as Student[];
    } catch (err: any) {
      console.error('❌ Error getting students by class:', err);
      throw err;
    }
  };
  const getStudentsByInstrument = async (instrument: string) => {
    try {
      const studentsQuery = query(collection(db, 'ALUMNOS'), where('instrumento', '==', instrument));

      const snapshot = await getDocs(studentsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fechaNacimiento: doc.data().fechaNacimiento?.toDate() || doc.data().fechaNacimiento,
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate() || doc.data().updatedAt,
      })) as Student[];
    } catch (err: any) {
      console.error('❌ Error getting students by instrument:', err);
      throw err;
    }
  };
  const exportStudents = (studentsToExport: Student[] = students.value) => {
    try {
      const csvContent = [
        // Headers
        'Nombre,Apellido,Email,Teléfono,Fecha Nacimiento,Madre,Padre,Teléfono Madre,Teléfono Padre,Instrumento,Estado,Fecha Inscripción,Grupo',
        // Data
        ...studentsToExport.map((student) =>
          [
            student.nombre || '',
            student.apellido || '',
            student.email || '',
            student.tlf || '',
            student.fechaNacimiento ? new Date(student.fechaNacimiento).toLocaleDateString() : '',
            student.madre || '',
            student.padre || '',
            student.tlf_madre || '',
            student.tlf_padre || '',
            student.instrumento || '',
            student.activo ? 'Activo' : 'Inactivo',
            student.fecInscripcion || '',
            Array.isArray(student.grupo)
              ? student.grupo.join('; ')
              : student.grupo || student.clase || '',
          ].join(','),
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Students exported:', studentsToExport.length);
    } catch (err: any) {
      console.error('❌ Error exporting students:', err);
      throw err;
    }
  };
  const assignStudentToClass = async (studentId: string, classId: string) => {
    try {
      const student = students.value.find((s) => s.id === studentId);
      if (!student) throw new Error('Student not found');

      // Usar el campo 'grupo' como array
      let updatedGroups: string[] = [];
      if (Array.isArray(student.grupo)) {
        updatedGroups = [...student.grupo, classId];
      } else if (student.grupo) {
        updatedGroups = [student.grupo, classId];
      } else {
        updatedGroups = [classId];
      }

      await updateStudent(studentId, { grupo: updatedGroups });

      console.log('✅ Student assigned to class:', { studentId, classId });
    } catch (err: any) {
      console.error('❌ Error assigning student to class:', err);
      throw err;
    }
  };

  const removeStudentFromClass = async (studentId: string, classId: string) => {
    try {
      const student = students.value.find((s) => s.id === studentId);
      if (!student) throw new Error('Student not found');

      // Usar el campo 'grupo' como array
      let updatedGroups: string[] = [];
      if (Array.isArray(student.grupo)) {
        updatedGroups = student.grupo.filter((id) => id !== classId);
      } else if (student.grupo && student.grupo !== classId) {
        updatedGroups = [student.grupo];
      }

      await updateStudent(studentId, { grupo: updatedGroups });

      console.log('✅ Student removed from class:', { studentId, classId });
    } catch (err: any) {
      console.error('❌ Error removing student from class:', err);
      throw err;
    }
  };

  // Bulk operations
  const bulkUpdateStudents = async (studentIds: string[], updates: Partial<Student>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const promises = studentIds.map((id) => updateStudent(id, updates));
      await Promise.all(promises);

      console.log('✅ Bulk update completed:', studentIds.length);
    } catch (err: any) {
      console.error('❌ Error in bulk update:', err);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const bulkDeleteStudents = async (studentIds: string[]) => {
    try {
      isLoading.value = true;
      error.value = null;

      const promises = studentIds.map((id) => deleteStudent(id));
      await Promise.all(promises);

      console.log('✅ Bulk delete completed:', studentIds.length);
    } catch (err: any) {
      console.error('❌ Error in bulk delete:', err);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Filters
  const setFilters = (newFilters: Partial<StudentFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const clearFilters = () => {
    filters.value = {
      search: '',
      status: '',
      grade: '',
      instrument: '',
      class: '',
    };
  };

  // Reset function
  const $reset = () => {
    students.value = [];
    isLoading.value = false;
    error.value = null;
    clearFilters();
  };

  // ==========================================
  // FUNCIONES AVANZADAS - FASE 1
  // ==========================================

  // IMPORTACIÓN DE DATOS
  const importStudentsFromCSV = async (file: File): Promise<ImportResult> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await advancedStudentsService.importStudentsFromCSV(file);

      // Recargar estudiantes si hubo importaciones exitosas
      if (result.imported > 0) {
        await loadStudents();
      }

      return result;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const importStudentsFromExcel = async (file: File): Promise<ImportResult> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await advancedStudentsService.importStudentsFromExcel(file);

      if (result.imported > 0) {
        await loadStudents();
      }

      return result;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // COMUNICACIÓN MASIVA
  const sendBulkEmailToStudents = async (
    studentIds: string[],
    message: EmailMessage,
  ): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      await advancedStudentsService.sendBulkEmailToStudents(studentIds, message);

      console.log('✅ Emails enviados exitosamente:', studentIds.length);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const sendWhatsAppToParents = async (studentIds: string[], message: string): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      await advancedStudentsService.sendWhatsAppToParents(studentIds, message);

      console.log('✅ WhatsApp enviados exitosamente:', studentIds.length);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // REPORTES AVANZADOS
  const generateStudentProgressReport = async (studentId: string): Promise<ProgressReport> => {
    try {
      isLoading.value = true;
      error.value = null;

      const report = await advancedStudentsService.generateStudentProgressReport(studentId);

      console.log('✅ Reporte de progreso generado:', report.studentName);
      return report;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const generateClassRosterPDF = async (classId: string): Promise<Blob> => {
    try {
      isLoading.value = true;
      error.value = null;

      const pdfBlob = await advancedStudentsService.generateClassRosterPDF(classId);

      console.log('✅ PDF de lista de clase generado');
      return pdfBlob;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const generateAttendanceCertificate = async (studentId: string): Promise<Blob> => {
    try {
      isLoading.value = true;
      error.value = null;

      const certificateBlob = await advancedStudentsService.generateAttendanceCertificate(studentId);

      console.log('✅ Certificado de asistencia generado');
      return certificateBlob;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ANÁLISIS Y MÉTRICAS
  const getStudentRetentionRate = async (period: {start: Date; end: Date}): Promise<number> => {
    try {
      isLoading.value = true;
      error.value = null;

      const retentionRate = await advancedStudentsService.getStudentRetentionRate(period);

      console.log('✅ Tasa de retención calculada:', retentionRate + '%');
      return retentionRate;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getStudentSatisfactionMetrics = async (): Promise<SatisfactionMetrics> => {
    try {
      isLoading.value = true;
      error.value = null;

      const metrics = await advancedStudentsService.getStudentSatisfactionMetrics();

      console.log('✅ Métricas de satisfacción obtenidas:', metrics.averageRating);
      return metrics;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const predictStudentChurn = async (studentId: string): Promise<ChurnPrediction> => {
    try {
      isLoading.value = true;
      error.value = null;

      const prediction = await advancedStudentsService.predictStudentChurn(studentId);

      console.log('✅ Predicción de deserción generada:', prediction.riskLevel);
      return prediction;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // GESTIÓN DE DOCUMENTOS
  const uploadStudentDocument = async (
    studentId: string,
    document: File,
  ): Promise<StudentDocument> => {
    try {
      isLoading.value = true;
      error.value = null;

      const uploadedDoc = await advancedStudentsService.uploadStudentDocument(studentId, document);

      console.log('✅ Documento subido:', uploadedDoc.name);
      return uploadedDoc;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getStudentDocuments = async (studentId: string): Promise<StudentDocument[]> => {
    try {
      isLoading.value = true;
      error.value = null;

      const documents = await advancedStudentsService.getStudentDocuments(studentId);

      console.log('✅ Documentos obtenidos:', documents.length);
      return documents;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  return {
    // State
    students,
    isLoading,
    error,
    filters,

    // Getters
    studentStats,
    filteredStudents,
    activeStudents,
    recentStudents,

    // Actions
    loadStudents,
    getStudent,
    createStudent,
    updateStudent,
    updateStudentStatus,
    deleteStudent,
    searchStudents,
    getStudentsByClass,
    getStudentsByInstrument,
    exportStudents,
    assignStudentToClass,
    removeStudentFromClass,
    bulkUpdateStudents,
    bulkDeleteStudents,
    setFilters,
    clearFilters,
    $reset,
  };
});

export type { Student, StudentFilters, StudentStats };
