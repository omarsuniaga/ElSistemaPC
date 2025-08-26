/**
 * 📊 COMPOSABLE DE REPORTES SEMANALES
 * Lógica principal para generar reportes profesionales de asistencia
 */

import { ref, computed, reactive } from 'vue';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getWeek, getYear, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Stores
import { useClassesStore } from '../../../Classes/store/classes';
import { useStudentsStore } from '../../../Students/store/students';
import { useAttendanceStore } from '../../store/attendance';

// Types
import type {
  WeeklyReportData,
  DailyAttendanceStats,
  StudentAbsenceInfo,
  AbsenceDetail,
  ClassDayInfo,
  ReportFilters
} from '../../types/reports';

export function useWeeklyReport() {
  const classesStore = useClassesStore();
  const studentsStore = useStudentsStore();
  const attendanceStore = useAttendanceStore();

  // Estado reactivo
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentWeekData = ref<WeeklyReportData | null>(null);
  
  const filters = reactive<ReportFilters>({
    weekStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    classIds: [],
    instrumentFilter: undefined,
    levelFilter: undefined,
    teacherFilter: undefined,
    absenceThreshold: 1,
    justificationStatus: 'all',
    notificationStatus: 'all'
  });

  /**
   * 🎯 FUNCIÓN PRINCIPAL: Generar reporte semanal completo
   */
  const generateWeeklyReport = async (weekStartDate?: string): Promise<WeeklyReportData> => {
    isLoading.value = true;
    error.value = null;

    try {
      const startDate = weekStartDate || filters.weekStartDate;
      const weekStart = new Date(startDate);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      console.log('📊 Generando reporte semanal:', { startDate, weekEnd });

      // Obtener días de la semana (Lunes a Sábado)
      const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 5) });

      // Cargar datos necesarios
      await Promise.all([
        classesStore.fetchClasses(),
        studentsStore.fetchStudents(),
      ]);

      // Generar estadísticas diarias
      const dailyStats: DailyAttendanceStats[] = [];
      let totalExpected = 0;
      let totalActual = 0;

      for (const day of weekDays) {
        const dayStats = await calculateDailyStats(format(day, 'yyyy-MM-dd'));
        dailyStats.push(dayStats);
        totalExpected += dayStats.expectedStudents;
        totalActual += dayStats.actualAttendance;
      }

      // Calcular ausencias por estudiante
      const absencesByStudent = await calculateStudentAbsences(
        format(weekStart, 'yyyy-MM-dd'),
        format(weekEnd, 'yyyy-MM-dd')
      );

      const reportData: WeeklyReportData = {
        weekStartDate: format(weekStart, 'yyyy-MM-dd'),
        weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
        weekNumber: getWeek(weekStart),
        year: getYear(weekStart),
        dailyStats,
        totalExpected,
        totalActual,
        overallAttendanceRate: totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0,
        absencesByStudent
      };

      currentWeekData.value = reportData;
      return reportData;

    } catch (err: any) {
      error.value = `Error generando reporte semanal: ${err.message}`;
      console.error('❌ Error en generateWeeklyReport:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 📅 Calcular estadísticas para un día específico
   */
  const calculateDailyStats = async (date: string): Promise<DailyAttendanceStats> => {
    const dayOfWeek = new Date(date).getDay();
    const dayName = format(new Date(date), 'EEEE', { locale: es });
    
    // Obtener clases programadas para este día
    const classesForDay = getClassesForDay(dayOfWeek);
    
    let expectedStudents = 0;
    let actualAttendance = 0;
    const classesByDay: ClassDayInfo[] = [];
    const absenceDetails: AbsenceDetail[] = [];

    for (const classData of classesForDay) {
      const classStudents = studentsStore.getStudentsByClass(classData.id);
      const expectedCount = classStudents.length;
      expectedStudents += expectedCount;

      // Obtener registros de asistencia para esta clase y fecha
      const attendanceRecords = await attendanceStore.getAttendanceByClassAndDate(classData.id, date);
      
      const presentCount = attendanceRecords?.filter(record => 
        record.status === 'Presente' || record.status === 'Tardanza'
      ).length || 0;
      
      actualAttendance += presentCount;

      // Información de la clase
      const classInfo: ClassDayInfo = {
        classId: classData.id,
        className: classData.name,
        teacherId: classData.teacherId,
        teacherName: classData.teacherName || 'Sin asignar',
        expectedStudents: expectedCount,
        actualAttendance: presentCount,
        studentIds: classStudents.map(s => s.id),
        timeSlot: getClassTimeSlot(classData),
        instrument: classData.instrument || 'General',
        level: classData.level || 'Básico'
      };
      classesByDay.push(classInfo);

      // Detalles de ausencias
      const absentStudents = classStudents.filter(student => {
        const record = attendanceRecords?.find(r => r.studentId === student.id);
        return !record || record.status === 'Ausente';
      });

      for (const student of absentStudents) {
        const absenceDetail: AbsenceDetail = {
          studentId: student.id,
          studentName: `${student.nombre} ${student.apellido}`,
          classId: classData.id,
          className: classData.name,
          parentContact: student.contactoEmergencia || student.telefono || 'No disponible',
          previousAbsences: await getStudentWeeklyAbsences(student.id, date),
          totalAbsences: await getStudentTotalAbsences(student.id),
          lastAbsenceDate: date,
          isJustified: false, // Determinar si está justificada
          requiresNotification: true
        };
        absenceDetails.push(absenceDetail);
      }
    }

    return {
      date,
      dayName,
      expectedStudents,
      actualAttendance,
      absentStudents: expectedStudents - actualAttendance,
      attendanceRate: expectedStudents > 0 ? Math.round((actualAttendance / expectedStudents) * 100) : 0,
      classesByDay,
      absenceDetails
    };
  };

  /**
   * 👥 Calcular ausencias por estudiante en el período
   */
  const calculateStudentAbsences = async (startDate: string, endDate: string): Promise<StudentAbsenceInfo[]> => {
    const students = studentsStore.students;
    const absenceInfo: StudentAbsenceInfo[] = [];

    for (const student of students) {
      const weeklyAbsences = await getStudentWeeklyAbsences(student.id, startDate);
      const totalAbsences = await getStudentTotalAbsences(student.id);
      
      if (weeklyAbsences >= (filters.absenceThreshold || 1)) {
        const info: StudentAbsenceInfo = {
          studentId: student.id,
          studentName: `${student.nombre} ${student.apellido}`,
          parentName: student.nombreRepresentante || 'No registrado',
          parentPhone: student.telefonoRepresentante || student.telefono || '',
          weeklyAbsences,
          totalAbsences,
          consecutiveAbsences: await getConsecutiveAbsences(student.id),
          lastAttendanceDate: await getLastAttendanceDate(student.id),
          absencesByClass: await getAbsencesByClass(student.id, startDate, endDate),
          justifiedAbsences: await getJustifiedAbsences(student.id, startDate, endDate),
          unjustifiedAbsences: weeklyAbsences - await getJustifiedAbsences(student.id, startDate, endDate),
          requiresUrgentNotification: weeklyAbsences >= 3 || await getConsecutiveAbsences(student.id) >= 3,
          notificationsSent: []
        };
        absenceInfo.push(info);
      }
    }

    return absenceInfo.sort((a, b) => b.weeklyAbsences - a.weeklyAbsences);
  };

  /**
   * 🏫 Obtener clases programadas para un día de la semana
   */
  const getClassesForDay = (dayOfWeek: number) => {
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const targetDay = dayNames[dayOfWeek].toLowerCase();

    return classesStore.classes.filter(classData => {
      const schedule = classData.schedule as any;
      if (!schedule?.slots) return false;

      return schedule.slots.some((slot: any) => 
        slot.day?.toLowerCase() === targetDay
      );
    });
  };

  /**
   * ⏰ Obtener horario de una clase
   */
  const getClassTimeSlot = (classData: any): string => {
    const schedule = classData.schedule as any;
    if (!schedule?.slots?.[0]) return 'Sin horario';
    
    const slot = schedule.slots[0];
    return `${slot.startTime || ''} - ${slot.endTime || ''}`.trim();
  };

  /**
   * 📊 Funciones auxiliares para conteo de ausencias
   */
  const getStudentWeeklyAbsences = async (studentId: string, weekDate: string): Promise<number> => {
    // Implementar lógica para contar ausencias de la semana
    // Esto requerirá consultar la base de datos de asistencias
    return 0; // Placeholder
  };

  const getStudentTotalAbsences = async (studentId: string): Promise<number> => {
    // Implementar lógica para contar ausencias totales
    return 0; // Placeholder
  };

  const getConsecutiveAbsences = async (studentId: string): Promise<number> => {
    // Implementar lógica para ausencias consecutivas
    return 0; // Placeholder
  };

  const getLastAttendanceDate = async (studentId: string): Promise<string> => {
    // Implementar lógica para última fecha de asistencia
    return format(new Date(), 'yyyy-MM-dd'); // Placeholder
  };

  const getAbsencesByClass = async (studentId: string, startDate: string, endDate: string) => {
    // Implementar lógica para ausencias por clase
    return []; // Placeholder
  };

  const getJustifiedAbsences = async (studentId: string, startDate: string, endDate: string): Promise<number> => {
    // Implementar lógica para ausencias justificadas
    return 0; // Placeholder
  };

  // Computed properties
  const hasData = computed(() => currentWeekData.value !== null);
  
  const weekSummary = computed(() => {
    if (!currentWeekData.value) return null;
    
    const data = currentWeekData.value;
    return {
      week: `Semana ${data.weekNumber}, ${data.year}`,
      period: `${format(new Date(data.weekStartDate), 'dd MMM', { locale: es })} - ${format(new Date(data.weekEndDate), 'dd MMM', { locale: es })}`,
      attendanceRate: data.overallAttendanceRate,
      totalExpected: data.totalExpected,
      totalActual: data.totalActual,
      absentStudentsCount: data.absencesByStudent.length
    };
  });

  const criticalAbsences = computed(() => {
    if (!currentWeekData.value) return [];
    
    return currentWeekData.value.absencesByStudent.filter(student => 
      student.requiresUrgentNotification
    );
  });

  return {
    // Estado
    isLoading,
    error,
    currentWeekData,
    filters,

    // Funciones principales
    generateWeeklyReport,
    calculateDailyStats,

    // Computed
    hasData,
    weekSummary,
    criticalAbsences,

    // Utilidades
    getClassesForDay,
    calculateStudentAbsences
  };
}