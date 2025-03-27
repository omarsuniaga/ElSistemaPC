import { ref, computed } from "vue";
import { useClassesStore } from "../modulos/Classes/store/classes";
import { useTeachersStore } from "../modulos/Teachers/store/teachers";
import { useStudentsStore } from "../modulos/Students/store/students";
import { parse, isWithinInterval, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function useSchedule() {
  const classesStore = useClassesStore();
  const teachersStore = useTeachersStore();
  const studentsStore = useStudentsStore();

  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const loadingCount = ref(0);

  // Stats
  const classStats = computed(() => ({
    total: classesStore.classes.length,
    scheduled: classesStore.classes.filter(c => c.schedule).length,
    unscheduled: classesStore.classes.filter(c => !c.schedule).length,
    withoutTeacher: classesStore.classes.filter(c => !c.teacherId).length,
    withoutStudents: classesStore.classes.filter(c => !c.studentIds || c.studentIds.length === 0).length,
  }));

  // Enhanced classes with additional information
  const enhancedClasses = computed(() => classesStore.classes.map(classItem => {
    const teacher = teachersStore.teachers.find(t => t.id === classItem.teacherId);
    const students = studentsStore.students.filter(s => classItem.studentIds?.includes(s.id));

    const status = !classItem.schedule
      ? 'not_scheduled'
      : !classItem.teacherId
        ? 'no_teacher'
        : (!classItem.studentIds || classItem.studentIds.length === 0)
          ? 'no_students'
          : 'ready';

    return {
      ...classItem,
      teacherName: teacher?.name || 'Sin asignar',
      studentCount: classItem.studentIds?.length || 0,
      students,
      status,
      formattedSchedule: formatScheduleDisplay(classItem.schedule)
    };
  }));

  // Format schedules
  const formatScheduleDisplay = (schedule: any) => {
    if (!schedule) return { days: [], startTime: '', endTime: '' };
    if (typeof schedule === 'string') {
      const [day, start, , end] = schedule.split(' ');
      return { days: [day || ''], startTime: start || '', endTime: end || '' };
    }
    return schedule;
  };

  // Load data
  const loadData = async () => {
    try {
      isLoading.value = true;
      loadingCount.value++;
      error.value = null;
      await Promise.all([
        classesStore.fetchClasses(),
        teachersStore.fetchTeachers(),
        studentsStore.fetchStudents(),
      ]);
    } catch (err: any) {
      error.value = err.message || 'Error al cargar datos';
    } finally {
      isLoading.value = false;
      loadingCount.value--;
    }
  };

  // Schedule validation
  const validateSchedule = (date: string, schedule: any): boolean => {
    if (!date || !schedule) return false;

    const dayOfWeek = format(parseISO(date), 'EEEE', { locale: es }).toLowerCase();
    
    if (typeof schedule === 'string') {
      const scheduledDay = schedule.split(' ')[0].toLowerCase();
      return dayOfWeek === scheduledDay;
    }
    
    if (typeof schedule === 'object') {
      if (Array.isArray(schedule.days)) {
        return schedule.days.map((day: string) => day.toLowerCase()).includes(dayOfWeek);
      }
      if (schedule.slots) {
        return schedule.slots.some((slot: any) => slot.day.toLowerCase() === dayOfWeek);
      }
    }
    
    return false;
  };

  // Time conflict validation
  const hasTimeConflict = (schedule1: any, schedule2: any) => {
    // Convertir los horarios al formato correcto para comparación
    const formatScheduleTime = (schedule: any) => {
      if (typeof schedule === 'string') {
        const [day, startTime, , endTime] = schedule.split(' ');
        return { day, startTime, endTime };
      }
      return schedule;
    };

    const s1 = formatScheduleTime(schedule1);
    const s2 = formatScheduleTime(schedule2);

    // Si son en diferentes días, no hay conflicto
    if (s1.day !== s2.day) return false;

    // Convertir horas a objetos Date para comparación
    const baseDate = new Date();
    const s1Start = parse(s1.startTime, 'HH:mm', baseDate);
    const s1End = parse(s1.endTime, 'HH:mm', baseDate);
    const s2Start = parse(s2.startTime, 'HH:mm', baseDate);
    const s2End = parse(s2.endTime, 'HH:mm', baseDate);

    // Verificar superposición de intervalos
    return (
      isWithinInterval(s1Start, { start: s2Start, end: s2End }) ||
      isWithinInterval(s1End, { start: s2Start, end: s2End }) ||
      isWithinInterval(s2Start, { start: s1Start, end: s1End }) ||
      isWithinInterval(s2End, { start: s1Start, end: s1End })
    );
  };

  // Schedule conflict validation
  const validateScheduleConflicts = (schedule: any, classId?: string, teacherId?: string) => {
    const conflicts: {
      type: 'teacher' | 'room' | 'student';
      message: string;
      details?: string;
    }[] = [];

    const currentClasses = classesStore.classes.filter(c => c.id !== classId);

    // Helper function to check time conflicts
    const checkTimeConflict = (existingSchedule: any, newSchedule: any) => {
      if (typeof newSchedule === 'string') {
        return hasTimeConflict(existingSchedule, newSchedule);
      } else if (newSchedule.times) {
        return newSchedule.times.some((time: any) => 
          hasTimeConflict(existingSchedule, `${time.day} ${time.startTime} - ${time.endTime}`)
        );
      }
      return false;
    };

    // Check teacher conflicts
    if (teacherId) {
      const teacherClasses = currentClasses.filter(c => c.teacherId === teacherId);
      teacherClasses.forEach(teacherClass => {
        if (checkTimeConflict(teacherClass.schedule, schedule)) {
          conflicts.push({
            type: 'teacher',
            message: 'El profesor ya tiene una clase programada en este horario',
            details: `Conflicto con la clase: ${teacherClass.name}`
          });
        }
      });
    }

    // Check room conflicts
    if (typeof schedule === 'object' && schedule.classroom) {
      const roomClasses = currentClasses.filter(c => 
        c.classroom === schedule.classroom
      );
      roomClasses.forEach(roomClass => {
        if (checkTimeConflict(roomClass.schedule, schedule)) {
          conflicts.push({
            type: 'room',
            message: 'El aula ya está ocupada en este horario',
            details: `Conflicto con la clase: ${roomClass.name}`
          });
        }
      });
    }

    // Verificar conflictos de estudiantes (si se proporcionan)
    if (schedule.studentIds?.length > 0) {
      currentClasses.forEach(existingClass => {
        const hasCommonStudents = existingClass.studentIds?.some(
          (id: string) => schedule.studentIds.includes(id)
        );
        
        if (hasCommonStudents && checkTimeConflict(existingClass.schedule, schedule)) {
          conflicts.push({
            type: 'student',
            message: 'Hay estudiantes que ya tienen clase en este horario',
            details: `Conflicto con la clase: ${existingClass.name}`
          });
        }
      });
    }

    return conflicts;
  };

  return {
    isLoading,
    error,
    loadingCount,
    classStats,
    enhancedClasses,
    formatScheduleDisplay,
    loadData,
    validateSchedule,
    validateScheduleConflicts,
    hasTimeConflict
  };
}