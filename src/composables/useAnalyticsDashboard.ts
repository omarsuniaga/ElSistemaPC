import { ref, computed } from 'vue';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { format, parseISO, isValid } from 'date-fns';

export function useAnalyticsDashboard() {
  const attendanceStore = useAttendanceStore();
  const studentsStore = useStudentsStore();
  const classesStore = useClassesStore();

  // Rango de fechas seleccionado
  const startDate = ref('');
  const endDate = ref('');
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Cargar datos de asistencia para el rango
  async function fetchDataForRange() {
    isLoading.value = true;
    error.value = null;
    try {
      if (!startDate.value || !endDate.value) return;
      await attendanceStore.fetchAttendanceByDateRange(startDate.value, endDate.value);
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents?.(); // Si existe fetchStudents
      }
      if (classesStore.classes.length === 0) {
        await classesStore.fetchClasses();
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar datos';
    } finally {
      isLoading.value = false;
    }
  }

  // Asistencia promedio global en el rango
  const averageAttendance = computed(() => {
    const records = attendanceStore.records.filter((r) => {
      return r.Fecha >= startDate.value && r.Fecha <= endDate.value;
    });
    if (!records.length) return 0;
    const present = records.filter(
      (r) => r.status === 'Presente' || r.status === 'Justificado',
    ).length;
    return Math.round((present / records.length) * 100);
  });

  // Distribución de alumnos por instrumento
  const instrumentDistribution = computed(() => {
    const instrumentCount: Record<string, number> = {};
    classesStore.classes.forEach((cls) => {
      if (cls.instrument && Array.isArray(cls.studentIds)) {
        if (!instrumentCount[cls.instrument]) instrumentCount[cls.instrument] = 0;
        instrumentCount[cls.instrument] += cls.studentIds.length;
      }
    });
    return Object.entries(instrumentCount).map(([instrument, count]) => ({ instrument, count }));
  });

  // 3. Distribución de alumnos por nivel
  const levelDistribution = computed(() => {
    const levelCount: Record<string, number> = {};
    classesStore.classes.forEach((cls) => {
      if (cls.level && Array.isArray(cls.studentIds)) {
        if (!levelCount[cls.level]) levelCount[cls.level] = 0;
        levelCount[cls.level] += cls.studentIds.length;
      }
    });
    return Object.entries(levelCount).map(([level, count]) => ({ level, count }));
  });

  // 4. Tendencia de asistencia diaria (porcentaje de asistencia por día)
  const attendanceTrend = computed(() => {
    // Agrupar por fecha
    const trendMap: Record<string, {present: number; total: number}> = {};
    attendanceStore.records.forEach((r) => {
      if (!trendMap[r.Fecha]) trendMap[r.Fecha] = { present: 0, total: 0 };
      if (r.status === 'Presente' || r.status === 'Justificado') trendMap[r.Fecha].present++;
      trendMap[r.Fecha].total++;
    });
    return Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { present, total }]) => ({
        date,
        attendanceRate: total ? Math.round((present / total) * 100) : 0,
      }));
  });

  // 5. Clases con mayor y menor asistencia (ranking)
  const classAttendanceRanking = computed(() => {
    // Agrupar por clase
    const classMap: Record<string, {present: number; total: number}> = {};
    attendanceStore.records.forEach((r) => {
      if (!classMap[r.classId]) classMap[r.classId] = { present: 0, total: 0 };
      if (r.status === 'Presente' || r.status === 'Justificado') classMap[r.classId].present++;
      classMap[r.classId].total++;
    });
    // Mapear a nombre de clase
    return Object.entries(classMap)
      .map(([classId, { present, total }]) => {
        const cls =
          classesStore.getClassById?.(classId) || classesStore.classes.find((c) => c.id === classId);
        return {
          classId,
          className: cls?.name || classId,
          attendanceRate: total ? Math.round((present / total) * 100) : 0,
          total,
        };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  });

  // 6. Maestros con más clases asignadas
  const teacherClassCount = computed(() => {
    const teacherMap: Record<string, number> = {};
    classesStore.classes.forEach((cls) => {
      if (cls.teacherId) {
        if (!teacherMap[cls.teacherId]) teacherMap[cls.teacherId] = 0;
        teacherMap[cls.teacherId]++;
      }
    });
    return Object.entries(teacherMap).map(([teacherId, count]) => ({
      teacherId,
      count,
    }));
  });

  // Alumnos con más inasistencias en el rango
  const mostAbsentStudents = computed(() => {
    // Usar el método del store para obtener los IDs y cantidad de ausencias
    const absences = attendanceStore.calculateAbsentStudents(10);
    // Mapear a datos completos del alumno
    return absences.map((abs) => {
      const student =
        studentsStore.getStudentById?.(abs.studentId) ||
        studentsStore.students.find((s) => s.id === abs.studentId);
      return {
        id: abs.studentId,
        nombre: student?.nombre || student?.name || 'Desconocido',
        apellido: student?.apellido || '',
        absences: abs.absences,
        attendanceRate: abs.attendanceRate,
        lastAttendance: abs.lastAttendance,
      };
    });
  });

  return {
    startDate,
    endDate,
    isLoading,
    error,
    fetchDataForRange,
    averageAttendance,
    instrumentDistribution,
    levelDistribution,
    attendanceTrend,
    classAttendanceRanking,
    teacherClassCount,
    mostAbsentStudents,
  };
}
