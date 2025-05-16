import { ref, computed, type Ref } from 'vue';
import type { AttendanceStatus } from '../types/attendance';
import type { Student } from '../../Students/types/student';
import { useAttendanceStore, type AttendanceRecord as StoreAttendanceRecord } from '../store/attendance';

/**
 * Composable que proporciona toda la lógica de acciones para la gestión de asistencia
 * Esto incluye: marcar estudiantes, guardar cambios, justificaciones, etc.
 */
export function useAttendanceActions(options: {
  localStudents: Ref<Student[]>;
  localAttendanceRecords: Ref<Record<string, AttendanceStatus>>;
  pendingChanges: Ref<Set<string>>;
  pendingJustifications: Ref<Map<string, { reason?: string; documentURL?: string }>>;
  displayToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  isProcessing: Ref<boolean>;
  selectedDate: Ref<string>;
  selectedClass: Ref<string>;
}) {
  const {
    localStudents,
    localAttendanceRecords,
    pendingChanges,
    pendingJustifications,
    displayToast,
    isProcessing,
    selectedDate,
    selectedClass
  } = options;

  const attendanceStore = useAttendanceStore();

  // Computed properties
  const pendingChangesCount = computed(() => {
    return pendingChanges.value.size;
  });
  
  const hasPendingChanges = computed(() => pendingChangesCount.value > 0 || pendingJustifications.value.size > 0 );

  /**
   * Función principal para guardar todos los cambios pendientes
   * Esta es la función que se debe llamar desde los botones de UI
   */
  const saveAllPendingChanges = async (dateToSave: string, classIdToSave: string) => {
    if (pendingChanges.value.size === 0 && pendingJustifications.value.size === 0) {
      displayToast('No hay cambios pendientes para guardar', 'info');
      return;
    }

    if (!dateToSave || !classIdToSave) {
      displayToast('Error: No se pudo determinar la fecha o clase para guardar', 'error');
      console.error('saveAllPendingChanges: dateToSave or classIdToSave is missing', { dateToSave, classIdToSave });
      return;
    }

    console.log(`Guardando ${pendingChanges.value.size} cambios de estado y ${pendingJustifications.value.size} justificaciones para Fecha: ${dateToSave}, Clase: ${classIdToSave}`);
    displayToast(`Guardando cambios...`, 'info');
    isProcessing.value = true;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Process students with status changes
      for (const studentId of pendingChanges.value) {
        const student = localStudents.value.find((s: Student) => s.id === studentId);
        if (!student) {
          console.warn(`Estudiante con ID ${studentId} no encontrado en localStudents.`);
          continue;
        }

        const status = localAttendanceRecords.value[studentId];
        if (!status) {
          console.warn(`Estado de asistencia no encontrado para ${studentId} en localAttendanceRecords.`);
          continue;
        }

        const existingRecord = attendanceStore.records.find(
          r => r.studentId === studentId && r.Fecha === dateToSave && r.classId === classIdToSave
        );

        let justificationPayload: StoreAttendanceRecord['justification'] = undefined;
        const justificationData = pendingJustifications.value.get(studentId);

        if (status === 'Justificado' || justificationData) {
          justificationPayload = {
            reason: justificationData?.reason || (status === 'Justificado' ? 'Justificación registrada' : ''),
            documentURL: justificationData?.documentURL || undefined,
            timestamp: new Date().toISOString(),
          };
        }

        try {
          if (existingRecord && existingRecord.id) {
            const recordToUpdate: StoreAttendanceRecord = {
              ...existingRecord,
              status: status,
              justification: justificationPayload,
              updatedAt: new Date().toISOString(),
            };
            await attendanceStore.updateAttendanceRecord(recordToUpdate);
            console.log(`Registro actualizado para ${studentId}:`, recordToUpdate);
          } else {
            const recordToAdd: Omit<StoreAttendanceRecord, 'id'> = {
              classId: classIdToSave,
              studentId: studentId,
              Fecha: dateToSave,
              status: status,
              justification: justificationPayload,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await attendanceStore.addAttendanceRecord(recordToAdd);
            console.log(`Nuevo registro añadido para ${studentId}:`, recordToAdd);
          }
          successCount++;
        } catch (e) {
          errorCount++;
          console.error(`Error al guardar el registro para el estudiante ${studentId}:`, e);
          displayToast(`Error al guardar para ${student?.nombre || studentId}`, 'error');
        }
      }
      
      // Process justifications for students not in pendingChanges (e.g., status already 'Justificado' but adding/modifying justification)
      for (const [studentId, justificationData] of pendingJustifications.value) {
        if (pendingChanges.value.has(studentId)) continue; // Already processed

        const student = localStudents.value.find((s: Student) => s.id === studentId);
        const currentStatusInLocal = localAttendanceRecords.value[studentId];

        const existingRecord = attendanceStore.records.find(
          r => r.studentId === studentId && r.Fecha === dateToSave && r.classId === classIdToSave
        );
        
        const justificationPayloadUpdate: StoreAttendanceRecord['justification'] = {
            reason: justificationData.reason || '',
            documentURL: justificationData.documentURL || undefined,
            timestamp: new Date().toISOString(),
        };

        try {
            if (existingRecord && existingRecord.id) {
                const recordToUpdate: StoreAttendanceRecord = {
                  ...existingRecord,
                  justification: justificationPayloadUpdate,
                  status: currentStatusInLocal || existingRecord.status,
                  updatedAt: new Date().toISOString(),
              };
              await attendanceStore.updateAttendanceRecord(recordToUpdate);
              console.log(`Justificación actualizada para ${studentId} (sin cambio de estado):`, recordToUpdate);
              successCount++;
            } else if (currentStatusInLocal) { // New record, but only justification was pending
                 const recordToAdd: Omit<StoreAttendanceRecord, 'id'> = {
                    classId: classIdToSave,
                    studentId: studentId,
                    Fecha: dateToSave,
                    status: currentStatusInLocal, // Status from local map
                    justification: justificationPayloadUpdate,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                await attendanceStore.addAttendanceRecord(recordToAdd);
                console.log(`Nuevo registro añadido para ${studentId} (solo con justificación pendiente):`, recordToAdd);
                successCount++;
            } else {
                 console.warn(`No se pudo procesar justificación para ${studentId} sin estado o registro existente.`);
            }
        } catch (e) {
            errorCount++;
            console.error(`Error al guardar justificación para ${studentId}:`, e);
            displayToast(`Error al guardar justificación para ${student?.nombre || studentId}`, 'error');
        }
      }

      if (errorCount > 0) {
        displayToast(`${successCount} cambios guardados, ${errorCount} errores.`, 'warning');
      } else if (successCount > 0) {
        displayToast('Todos los cambios guardados correctamente.', 'success');
      } else if (pendingChanges.value.size > 0 || pendingJustifications.value.size > 0) {
        displayToast('No se procesaron cambios.', 'info');
      }

      pendingChanges.value.clear();
      pendingJustifications.value.clear();

    } catch (error) {
      console.error('Error general en el proceso de guardado saveAllPendingChanges:', error);
      displayToast('Error al procesar los cambios de asistencia.', 'error');
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Actualiza el estado de asistencia de un estudiante y lo añade a pendingChanges.
   * Nota: Esta función ahora SOLO actualiza el estado local y marca como pendiente.
   * El guardado real se hace con saveAllPendingChanges.
   */
  const updateStudentStatus = (studentId: string, newStatus: AttendanceStatus) => {
    if (!selectedDate.value || !selectedClass.value) {
      displayToast('Seleccione una fecha y clase primero.', 'warning');
      return;
    }
    localAttendanceRecords.value[studentId] = newStatus;
    pendingChanges.value.add(studentId);
    // console.log(`Status updated for ${studentId} to ${newStatus}. Pending: ${pendingChanges.value.size}`);
  };
  
  /**
  * Añade o actualiza una justificación para un estudiante y la marca como pendiente.
  */
  const addOrUpdateJustification = (studentId: string, reason?: string, documentURL?: string) => {
    if (!selectedDate.value || !selectedClass.value) {
        displayToast('Seleccione una fecha y clase primero.', 'warning');
        return;
    }
    const currentJustification = pendingJustifications.value.get(studentId) || {};
    pendingJustifications.value.set(studentId, { 
        reason: reason !== undefined ? reason : currentJustification.reason,
        documentURL: documentURL !== undefined ? documentURL : currentJustification.documentURL 
    });
    
    // Ensure student is marked for change if only justification is added/updated
    // and their status is already 'Justificado' or will become 'Justificado'
    const currentStatus = localAttendanceRecords.value[studentId];
    if (currentStatus === 'Justificado') { 
        pendingChanges.value.add(studentId); 
    }
     displayToast('Justificación actualizada y pendiente de guardar.', 'info');
  };


  /**
   * Marca a todos los estudiantes como presentes
   */
  const markAllAsPresent = () => {
    if (!localStudents.value || localStudents.value.length === 0) {
      displayToast('No hay estudiantes para marcar.', 'info');
      return;
    }
    localStudents.value.forEach(student => {
      if (student && student.id) updateStudentStatus(student.id, 'Presente');
    });
    displayToast('Todos los estudiantes marcados como Presente (pendientes de guardar).', 'info');
  };

  /**
   * Marca a todos los estudiantes como ausentes
   */
  const markAllAsAbsent = () => {
    if (!localStudents.value || localStudents.value.length === 0) {
      displayToast('No hay estudiantes para marcar.', 'info');
      return;
    }
    localStudents.value.forEach(student => {
      if (student && student.id) updateStudentStatus(student.id, 'Ausente');
    });
    displayToast('Todos los estudiantes marcados como Ausente (pendientes de guardar).', 'info');
  };

  /**
   * Marca a todos los estudiantes como tardanza
   */
  const markAllAsLate = () => {
    if (!localStudents.value || localStudents.value.length === 0) {
      displayToast('No hay estudiantes para marcar.', 'info');
      return;
    }
    localStudents.value.forEach(student => {
      if (student && student.id) updateStudentStatus(student.id, 'Tardanza');
    });
    displayToast('Todos los estudiantes marcados como Tardanza (pendientes de guardar).', 'info');
  };

  /**
   * Restablece los estados de asistencia a los valores guardados en el store para la fecha y clase seleccionadas.
   */
  const resetAllStatuses = async () => {
    if (!selectedDate.value || !selectedClass.value) {
      displayToast('Seleccione una fecha y clase para recargar.', 'error');
      return;
    }
    isProcessing.value = true;
    try {
      // Fetch fresh records for the current context
      // This assumes fetchAttendanceRecords updates attendanceStore.records reactively
      await attendanceStore.fetchAttendanceRecords({ 
        classId: selectedClass.value, 
        // Ensure dates are in YYYY-MM-DD or Date objects as expected by the store action
        startDate: selectedDate.value, 
        endDate: selectedDate.value 
      });

      const freshRecordsForView = attendanceStore.getAttendanceMapForSelectedScope;
      localAttendanceRecords.value = { ...freshRecordsForView }; // Create a new object for reactivity

      pendingChanges.value.clear();
      pendingJustifications.value.clear();
      displayToast('Estados de asistencia reestablecidos.', 'info');
    } catch (error) {
      console.error('Error al reestablecer estados:', error);
      displayToast('Error al reestablecer estados.', 'error');
    } finally {
      isProcessing.value = false;
    }
  };

  // Retornar todas las funciones y propiedades computadas
  return {
    saveAllPendingChanges,
    updateStudentStatus,
    addOrUpdateJustification,
    markAllAsPresent,
    markAllAsAbsent,
    markAllAsLate,
    resetAllStatuses,
    pendingChangesCount,
    hasPendingChanges,
  };
}
