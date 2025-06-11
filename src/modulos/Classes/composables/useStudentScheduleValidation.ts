// src/modulos/Classes/composables/useStudentScheduleValidation.ts

import { ref, computed } from 'vue';
import type { TimeSlot, ScheduleConflict } from '../../../utils/scheduleConflicts';
import { 
  validateStudentScheduleConflicts, 
  getStudentScheduleSummary 
} from '../service/classes';

export const useStudentScheduleValidation = () => {
  const isValidating = ref(false);
  const studentConflicts = ref<Map<string, ScheduleConflict[]>>(new Map());
  const conflictSummary = ref<string[]>([]);
  const studentSchedules = ref<Map<string, any>>(new Map());

  /**
   * Valida conflictos específicamente desde la perspectiva del estudiante
   */
  const validateStudentConflicts = async (classData: {
    id?: string;
    studentIds?: string[];
    schedule?: {
      slots: TimeSlot[];
    };
  }) => {
    isValidating.value = true;
    
    try {
      const result = await validateStudentScheduleConflicts(classData);
      studentConflicts.value = result.conflictsByStudent;
      conflictSummary.value = result.summary;
      
      return result;
    } catch (error) {
      console.error('Error validating student conflicts:', error);
      return {
        hasConflicts: false,
        conflictsByStudent: new Map(),
        summary: []
      };
    } finally {
      isValidating.value = false;
    }
  };

  /**
   * Obtiene el horario completo de un estudiante
   */
  const getStudentFullSchedule = async (studentId: string) => {
    try {
      const schedule = await getStudentScheduleSummary(studentId);
      studentSchedules.value.set(studentId, schedule);
      return schedule;
    } catch (error) {
      console.error('Error getting student schedule:', error);
      return null;
    }
  };

  /**
   * Verifica si hay estudiantes con conflictos
   */
  const hasStudentConflicts = computed(() => studentConflicts.value.size > 0);

  /**
   * Obtiene la lista de estudiantes con conflictos
   */
  const conflictedStudents = computed(() => {
    const conflicts: Array<{
      studentId: string;
      conflicts: ScheduleConflict[];
    }> = [];

    studentConflicts.value.forEach((conflictList, studentId) => {
      conflicts.push({
        studentId,
        conflicts: conflictList
      });
    });

    return conflicts;
  });

  /**
   * Obtiene todos los mensajes de conflicto de estudiantes
   */
  const studentConflictMessages = computed(() => {
    const messages: string[] = [];
    
    studentConflicts.value.forEach((conflictList) => {
      conflictList.forEach(conflict => {
        messages.push(conflict.message);
      });
    });

    return messages;
  });

  /**
   * Cuenta el total de conflictos de estudiantes
   */
  const totalStudentConflicts = computed(() => {
    let total = 0;
    studentConflicts.value.forEach((conflictList) => {
      total += conflictList.length;
    });
    return total;
  });

  /**
   * Verifica si un estudiante específico tiene conflictos
   */
  const studentHasConflicts = (studentId: string) => {
    return studentConflicts.value.has(studentId);
  };

  /**
   * Obtiene los conflictos de un estudiante específico
   */
  const getStudentConflicts = (studentId: string) => {
    return studentConflicts.value.get(studentId) || [];
  };

  /**
   * Limpia todos los datos de validación
   */
  const clearStudentValidation = () => {
    studentConflicts.value.clear();
    conflictSummary.value = [];
    studentSchedules.value.clear();
  };

  /**
   * Formatea un mensaje amigable para mostrar conflictos de estudiante
   */
  const formatStudentConflictSummary = computed(() => {
    if (!hasStudentConflicts.value) {
      return "✅ Ningún estudiante tiene conflictos de horario";
    }

    const conflictCount = totalStudentConflicts.value;
    const studentCount = studentConflicts.value.size;
    
    return `⚠️ ${conflictCount} conflicto(s) detectado(s) en ${studentCount} estudiante(s). Ningún alumno puede estar en más de una clase al mismo tiempo.`;
  });

  return {
    // Estado
    isValidating,
    studentConflicts,
    conflictSummary,
    studentSchedules,

    // Métodos
    validateStudentConflicts,
    getStudentFullSchedule,
    clearStudentValidation,
    studentHasConflicts,
    getStudentConflicts,

    // Computed
    hasStudentConflicts,
    conflictedStudents,
    studentConflictMessages,
    totalStudentConflicts,
    formatStudentConflictSummary
  };
};
