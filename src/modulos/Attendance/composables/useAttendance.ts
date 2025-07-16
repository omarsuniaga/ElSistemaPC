// src/modulos/Attendance/composables/useAttendance.ts
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClassesStore } from '../../../stores/classes';
import { useStudentsStore } from '../../../modulos/Students/store/students'; // Ruta corregida
import { useAttendanceStore } from '../store/attendance';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AttendanceRecord, AttendanceStatus, JustificationData } from '../types/attendance';

// Tipos para mayor claridad
interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  status: 'complete' | 'partial' | 'scheduled' | 'none';
}

interface ClassInfoForModal {
  id: string;
  name: string;
  time: string;
  studentCount: number;
  hasAttendance: boolean;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  justified: number;
  late: number;
  attendanceRate: number;
}

interface ChartData {
  labels: string[];
  presentData: number[];
  absentData: number[];
  justifiedData: number[];
  lateData: number[];
  attendanceRateData: number[];
}

interface StudentAttendanceData {
  records: AttendanceRecord[];
  summary: AttendanceSummary;
  chartData: ChartData;
  recentRecords: FormattedAttendanceRecord[];
}

interface FormattedAttendanceRecord extends AttendanceRecord {
  className: string;
  teacherName: string;
  formattedDate: string;
  formattedDateCapitalized: string;
}

export function useAttendance() {
  // 1. STORES Y ROUTER
  const route = useRoute();
  const router = useRouter();
  const classesStore = useClassesStore();
  const studentsStore = useStudentsStore();
  const attendanceStore = useAttendanceStore();

  // 2. ESTADO REACTIVO PRINCIPAL
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentMonth = ref(new Date());
  const selectedDate = ref<Date | null>(null);
  const isModalOpen = ref(false);

  // 3. ESTADO COMPUTADO (VISTAS DERIVADAS DEL ESTADO)

  /**
     * Genera los días para el componente del calendario.
     * Cada día contiene su estado de asistencia (completo, parcial, etc.)
     */
  const calendarDays = computed<CalendarDay[]>(() => {
    const monthStart = startOfMonth(currentMonth.value);
    const monthEnd = endOfMonth(currentMonth.value);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Aquí iría la lógica para cruzar `days` con los datos de `classesStore` y `attendanceStore`
    // para calcular el `status` de cada día. Por simplicidad, se omite la lógica interna.
        
    return days.map(date => ({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: true, // Simplificado
      isToday: isToday(date),
      isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
      status: 'scheduled', // Placeholder
    }));
  });

  /**
     * Prepara la lista de clases para el modal del día seleccionado.
     */
  const classesForSelectedDay = computed<ClassInfoForModal[]>(() => {
    if (!selectedDate.value) return [];
    // Lógica para encontrar las clases programadas en `selectedDate`
    // y verificar si ya tienen un registro de asistencia.
    return []; // Placeholder
  });

  /**
     * Prepara la lista de estudiantes para la vista de `AttendanceList`.
     */
  const attendanceList = computed(() => {
    const classId = route.params.classId as string;
    const date = route.params.date as string;
    if (!classId || !date) return [];

    const students = studentsStore.getStudentsByClass(classId);
    const records = attendanceStore.attendanceRecords; // Asumiendo que esto tiene los datos para la clase/fecha

    return students.map(student => ({
      ...student,
      status: records[student.id] || 'Ausente',
    }));
  });

  // 4. FUNCIONES (ACCIONES DEL USUARIO Y LÓGICA DE NEGOCIO)

  function changeMonth(direction: 'prev' | 'next') {
    currentMonth.value = direction === 'prev' ? subMonths(currentMonth.value, 1) : addMonths(currentMonth.value, 1);
  }

  function openDayModal(date: Date) {
    selectedDate.value = date;
    isModalOpen.value = true;
  }

  function closeModal() {
    isModalOpen.value = false;
    selectedDate.value = null;
  }

  function goToAttendanceList(classId: string) {
    if (!selectedDate.value) return;
    const dateString = format(selectedDate.value, 'yyyy-MM-dd');
    router.push({ name: 'TeacherAttendanceDetail', params: { date: dateString, classId } });
  }

  async function updateStudentStatus(studentId: string, status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado') {
    const classId = route.params.classId as string;
    const date = route.params.date as string;
    // Lógica para actualizar el estado en `attendanceStore`
    // attendanceStore.updateRecord(date, classId, studentId, status);
  }

  async function saveAttendance() {
    isLoading.value = true;
    try {
      // Llama a la acción del store para guardar los cambios pendientes en Firestore
      // await attendanceStore.savePendingChanges();
    } catch (e) {
      error.value = 'Error al guardar la asistencia.';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetches and processes student attendance summary and records for a given date range.
   * @param studentId The ID of the student.
   * @param startDate The start date of the range (YYYY-MM-DD).
   * @param endDate The end date of the range (YYYY-MM-DD).
   * @returns An object containing attendance summary, chart data, and recent records.
   */
  async function fetchStudentAttendanceSummaryAndRecords(
    studentId: string,
    startDate: string,
    endDate: string,
  ): Promise<StudentAttendanceData> {
    isLoading.value = true;
    error.value = null;
    try {
      // Fetch raw attendance records for the student within the date range
      const rawRecords = await attendanceStore.getStudentAttendanceByDateRange(
        studentId,
        startDate,
        endDate,
      );

      // Initialize summary counts
      let total = 0;
      let present = 0;
      let absent = 0;
      let justified = 0;
      let late = 0;

      // Process records for summary and chart data
      const monthlyData: Record<string, { present: number; absent: number; justified: number; late: number; total: number }> = {};
      const formattedRecords: FormattedAttendanceRecord[] = [];

      rawRecords.forEach((record) => {
        total++;
        const status = record.status?.toLowerCase();

        if (status === 'presente' || status === 'present') {
          present++;
        } else if (status === 'ausente' || status === 'absent') {
          absent++;
          if (record.justification) {
            justified++;
          }
        } else if (status === 'tardanza' || status === 'tarde' || status === 'late') {
          late++;
        }

        // Populate monthly data for chart
        if (record.fecha) {
          const monthYear = format(new Date(record.fecha), 'MMM yyyy', { locale: es });
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { present: 0, absent: 0, justified: 0, late: 0, total: 0 };
          }
          monthlyData[monthYear].total++;
          if (status === 'presente' || status === 'present') {
            monthlyData[monthYear].present++;
          } else if (status === 'ausente' || status === 'absent') {
            monthlyData[monthYear].absent++;
            if (record.justification) {
              monthlyData[monthYear].justified++;
            }
          } else if (status === 'tardanza' || status === 'tarde' || status === 'late') {
            monthlyData[monthYear].late++;
          }
        }

        // Format record for display
        const classInfo = classesStore.getClassById(record.classId);
        const teacherInfo = classInfo?.teacherId ? studentsStore.getStudentById(classInfo.teacherId) : null; // Assuming teacher is also a student for simplicity

        formattedRecords.push({
          ...record,
          className: classInfo?.name || 'Clase desconocida',
          teacherName: teacherInfo?.nombre || 'Profesor desconocido',
          formattedDate: record.fecha ? format(new Date(record.fecha), 'EEEE d \'de\' MMMM yyyy', { locale: es }) : 'Fecha desconocida',
          formattedDateCapitalized: record.fecha ? format(new Date(record.fecha), 'EEEE d \'de\' MMMM yyyy', { locale: es }).replace(/^\w/, (c) => c.toUpperCase()) : 'Fecha desconocida',
        });
      });

      const attendedClasses = present + late;
      const attendanceRate = total > 0 ? Math.round((attendedClasses / total) * 100) : 0;

      const months = Object.keys(monthlyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const chartPresentData = months.map((m) => monthlyData[m].present);
      const chartAbsentData = months.map((m) => monthlyData[m].absent);
      const chartJustifiedData = months.map((m) => monthlyData[m].justified);
      const chartLateData = months.map((m) => monthlyData[m].late);
      const chartAttendanceRateData = months.map((m) => {
        const attended = monthlyData[m].present + monthlyData[m].late;
        return monthlyData[m].total > 0 ? Math.round((attended / monthlyData[m].total) * 100) : 0;
      });

      return {
        records: rawRecords,
        summary: {
          total,
          present,
          absent,
          justified,
          late,
          attendanceRate,
        },
        chartData: {
          labels: months,
          presentData: chartPresentData,
          absentData: chartAbsentData,
          justifiedData: chartJustifiedData,
          lateData: chartLateData,
          attendanceRateData: chartAttendanceRateData,
        },
        recentRecords: formattedRecords.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 10),
      };
    } catch (e) {
      error.value = 'Error al cargar los datos de asistencia del estudiante.';
      console.error(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  // 5. LIFECYCLE HOOKS Y WATCHERS

  // Carga inicial de datos necesarios para el módulo
  onMounted(async () => {
    isLoading.value = true;
    error.value = null;
    try {
      await Promise.all([
        classesStore.fetchClasses(),
        studentsStore.fetchStudents(),
        attendanceStore.fetchAttendanceDocuments(), // Carga los registros de asistencia
      ]);
    } catch (e) {
      error.value = 'Error al cargar los datos iniciales.';
    } finally {
      isLoading.value = false;
    }
  });

  // Reaccionar a cambios en la ruta para la vista de lista
  watch(() => [route.params.classId, route.params.date], ([newClassId, newDate]) => {
    if (newClassId && newDate && route.name === 'TeacherAttendanceDetail') {
      // Cargar los datos específicos para la clase y fecha si es necesario
      // attendanceStore.fetchAttendanceDocument(newDate, newClassId);
    }
  }, { immediate: true });

  // 6. API PÚBLICA DEL COMPOSABLE
  return {
    // Estado y Vistas Derivadas
    isLoading,
    error,
    calendarDays,
    currentMonth: computed(() => format(currentMonth.value, 'MMMM yyyy', { locale: es })),
    isModalOpen,
    classesForSelectedDay,
    attendanceList,

    // Funciones
    changeMonth,
    openDayModal,
    closeModal,
    goToAttendanceList,
    updateStudentStatus,
    saveAttendance,
    fetchStudentAttendanceSummaryAndRecords,
  };
}

