// src/modulos/Classes/composables/useScheduleValidation.ts

import { ref, computed } from 'vue';
import type { TimeSlot, ScheduleConflict, ScheduleValidationResult } from '../../../utils/scheduleConflicts';
import { validateScheduleConflicts } from '../service/classes';
import { suggestAlternativeSlots } from '../../../utils/scheduleConflicts';

export const useScheduleValidation = () => {
  const isValidating = ref(false);
  const validationResult = ref<ScheduleValidationResult>({
    hasConflicts: false,
    conflicts: [],
    warnings: []
  });

  // Estado para sugerencias de horarios alternativos
  const suggestions = ref<TimeSlot[]>([]);
  const showSuggestions = ref(false);

  /**
   * Valida conflictos de horarios para una clase
   */
  const validateSchedule = async (classData: {
    id?: string;
    teacherId?: string;
    studentIds?: string[];
    classroom?: string;
    schedule?: {
      slots: TimeSlot[];
    };
  }) => {
    isValidating.value = true;
    
    try {
      const result = await validateScheduleConflicts(classData);
      validationResult.value = result;
      
      // Si hay conflictos, generar sugerencias
      if (result.hasConflicts && classData.schedule?.slots) {
        generateSuggestions(classData.schedule.slots[0]); // Sugerir para el primer slot
      }
      
      return result;
    } catch (error) {
      console.error('Error validating schedule:', error);
      validationResult.value = {
        hasConflicts: false,
        conflicts: [],
        warnings: []
      };
    } finally {
      isValidating.value = false;
    }
  };

  /**
   * Genera sugerencias de horarios alternativos
   */
  const generateSuggestions = (originalSlot: TimeSlot) => {
    const conflictingSlots = validationResult.value.conflicts.map(c => c.conflictingSlot);
    suggestions.value = suggestAlternativeSlots(originalSlot, conflictingSlots);
    showSuggestions.value = suggestions.value.length > 0;
  };

  /**
   * Limpia el estado de validación
   */
  const clearValidation = () => {
    validationResult.value = {
      hasConflicts: false,
      conflicts: [],
      warnings: []
    };
    suggestions.value = [];
    showSuggestions.value = false;
  };

  // Computed properties para facilitar el uso en templates
  const hasErrors = computed(() => 
    validationResult.value.conflicts.some(c => c.severity === 'error')
  );

  const hasWarnings = computed(() => 
    validationResult.value.conflicts.some(c => c.severity === 'warning') ||
    validationResult.value.warnings.length > 0
  );

  const errorMessages = computed(() => 
    validationResult.value.conflicts
      .filter(c => c.severity === 'error')
      .map(c => c.message)
  );

  const warningMessages = computed(() => 
    [
      ...validationResult.value.conflicts.filter(c => c.severity === 'warning'),
      ...validationResult.value.warnings
    ].map(c => c.message)
  );

  /**
   * Obtiene conflictos agrupados por tipo
   */
  const conflictsByType = computed(() => {
    const grouped = {
      teacher: [] as ScheduleConflict[],
      student: [] as ScheduleConflict[],
      classroom: [] as ScheduleConflict[]
    };

    validationResult.value.conflicts.forEach(conflict => {
      if (conflict.type in grouped) {
        grouped[conflict.type].push(conflict);
      }
    });

    return grouped;
  });

  /**
   * Verifica si se puede guardar la clase (sin errores críticos)
   */
  const canSave = computed(() => !hasErrors.value);

  /**
   * Aplica una sugerencia de horario
   */
  const applySuggestion = (suggestion: TimeSlot) => {
    showSuggestions.value = false;
    return suggestion;
  };

  return {
    // Estado
    isValidating,
    validationResult,
    suggestions,
    showSuggestions,

    // Métodos
    validateSchedule,
    generateSuggestions,
    clearValidation,
    applySuggestion,

    // Computed
    hasErrors,
    hasWarnings,
    errorMessages,
    warningMessages,
    conflictsByType,
    canSave
  };
};
