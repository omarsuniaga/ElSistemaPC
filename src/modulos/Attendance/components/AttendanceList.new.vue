<script setup lang="ts">
/*******************************************************
 * AttendanceList Component
 * 
 * Este componente maneja la gestión de asistencia diaria,
 * incluyendo estados de estudiantes (presente, ausente, tardanza, justificado)
 * y la persistencia de estos datos en Firebase.
 *******************************************************/

// Importaciones de Vue y tipos
import { ref, computed, watch } from 'vue'
import type { AttendanceStatus, JustificationData } from '../types/attendance'
import type { Student } from '../../Students/types/student'

// Stores y router
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
import { useAttendanceStore } from '../store/attendance'
import { useRoute } from 'vue-router'

// Importamos el composable de acciones de asistencia
import { useAttendanceActions } from '../composables/useAttendanceActions'

// Componentes
import Toast from '../../../components/Toast.vue'
import AttendanceHeader from './AttendanceHeader.vue'
import AttendanceSummary from './AttendanceSummary.vue'
import AttendanceTable from './AttendanceTable.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import ErrorMessage from './ErrorMessage.vue'
import { DocumentArrowDownIcon, PlusIcon } from '@heroicons/vue/24/outline'

// Props y emits
const props = defineProps<{
  selectedClassName?: string;
  initialClassId?: string; // Usado para cargar datos si se accede por URL
  date?: string; // Usado para cargar datos si se accede por URL
  students?: Student[]; // Opcional, con default
  attendanceRecords?: Record<string, AttendanceStatus>; // Opcional, con default
  isDisabled?: boolean;
}>()

const emit = defineEmits([
  'navigate-to-class-selector',
  'navigate-to-calendar',
  'open-justification',
  'save-justification',
  'update-status',
  'open-observation',
  'save-observation',
  'open-export'
])

// Stores
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const route = useRoute();

// Estado local para datos y carga
const localStudents = ref<Student[]>([]);
const localAttendanceRecords = ref<Record<string, AttendanceStatus>>({});
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const pendingChanges = ref<Set<string>>(new Set());
const pendingJustifications = ref<Map<string, {id?: string, reason: string, documentURL?: string, timestamp?: Date}>>(new Map());
const justificationsModalOpen = ref<boolean>(false);
const currentStudent = ref<Student | null>(null);
const isProcessing = ref<boolean>(false);
const tableData = ref<Student[]>([]);
const observationsModalOpen = ref<boolean>(false);
const currentJustificationReason = ref<string>('');

// Almacén para estudiantes justificados - usamos esto para mantener el estado visual
const justifiedStudentsMap = ref<Record<string, boolean>>({});
const selectedStudentForJustification = ref<{ id: string; nombre: string; apellido: string } | null>(null);

// Estado para el toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success');

// Función para mostrar el toast
const displayToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

// Integración con el composable de acciones de asistencia
const attendanceActions = useAttendanceActions({
  localStudents,
  localAttendanceRecords,
  pendingChanges,
  pendingJustifications,
  displayToast,
  isProcessing
});

// Computed para obtener el tamaño del set pendingChanges
const pendingChangesCount = computed(() => attendanceActions.pendingChangesCount.value);
const hasPendingChanges = computed(() => attendanceActions.hasPendingChanges.value);

// Computed properties para observaciones
const hasObservations = computed(() => {
  const observations = attendanceStore.getObservations;
  return observations && typeof observations === 'string' && observations.trim().length > 0;
});

const shouldAnimateObservationsButton = computed(() => {
  // Animar botón de observaciones solo si:
  // 1. No hay observaciones para la clase y fecha actual
  // 2. Hay estudiantes cargados (significa que la clase existe y requiere asistencia)
  return effectiveStudents.value.length > 0 && !hasObservations.value;
});

// Usando props si están disponibles, de lo contrario, usando datos locales
const effectiveStudents = computed(() => {
  return props.students && props.students.length > 0 ? props.students : localStudents.value;
});

const effectiveAttendanceRecords = computed(() => {
  if (pendingChangesCount.value > 0) {
    return localAttendanceRecords.value;
  }
  return props.attendanceRecords && Object.keys(props.attendanceRecords).length > 0
    ? props.attendanceRecords
    : localAttendanceRecords.value;
});

// Función para cargar datos para el componente
const fetchDataForComponent = async (dateParam: string, classIdParam: string) => {
  if (!dateParam || !classIdParam) {
    console.warn('No hay fecha o clase para cargar datos');
    return;
  }
  
  try {
    isLoading.value = true;
    
    // Cargar estudiantes y registros de asistencia
    const students = await studentsStore.fetchActiveStudents();
    localStudents.value = [...students];
    
    // Cargar registros de asistencia específicos
    const records = await attendanceStore.getRecordsByDateAndClass(dateParam, classIdParam);
    
    if (records && records.length > 0) {
      // Construir registros de asistencia locales
      const formattedRecords: Record<string, AttendanceStatus> = {};
      
      records.forEach(record => {
        if (record.studentId && record.status) {
          formattedRecords[record.studentId] = record.status as AttendanceStatus;
        }
      });
      
      // Actualizar registros locales
      localAttendanceRecords.value = formattedRecords;
      
      console.log(`Cargados ${records.length} registros de asistencia para la fecha ${dateParam} y clase ${classIdParam}`);
    } else {
      console.log(`No hay registros de asistencia para la fecha ${dateParam} y clase ${classIdParam}`);
      localAttendanceRecords.value = {};
    }
    
  } catch (error) {
    console.error('Error al cargar datos para el componente:', error);
    errorMessage.value = 'Error al cargar datos de asistencia';
  } finally {
    isLoading.value = false;
  }
};

// Inicializar cuando cambian las props
watch(
  () => [props.date, props.initialClassId],
  async ([newDate, newClassId]) => {
    if (newDate && newClassId) {
      await fetchDataForComponent(newDate, newClassId);
    }
  },
  { immediate: true }
);

// Watch para inicializar el estado local cuando cambian los attendanceRecords
watch(
  () => props.attendanceRecords,
  (newRecords) => {
    if (pendingChangesCount.value === 0 && newRecords) {
      console.log('Recibiendo nuevos registros de asistencia vía props');
      localAttendanceRecords.value = { ...newRecords };
    } else if (pendingChangesCount.value > 0) {
      console.log(`No se actualizarán los registros porque hay ${pendingChangesCount.value} cambios pendientes`);
    }
  },
  { immediate: false, deep: true }
);

// Watch para inicializar estudiantes locales cuando cambian props
watch(
  () => props.students,
  (newStudents) => {
    if (!isLoading.value && newStudents) {
      localStudents.value = [...newStudents];
    }
  },
  { immediate: true, deep: true }
);

// Manejar actualización de estado de asistencia
const handleUpdateStatus = (studentId: string, status: string) => {
  if (studentId === 'all' && status === 'save') {
    // Guardar todos los cambios pendientes
    const dateToSave = route.params.date as string || props.date || attendanceStore.selectedDate || '';
    const classIdToSave = route.params.classId as string || props.initialClassId || '';
    attendanceActions.saveAllPendingChanges(dateToSave, classIdToSave);
    return;
  }
  
  // Delegar al composable para actualizar estado
  attendanceActions.updateStudentStatus(studentId, status);
  
  // Si el estudiante estaba justificado y ahora cambia a otro estado, mantener registro
  const previousStatus = localAttendanceRecords.value[studentId];
  if (previousStatus === 'Justificado' && status !== 'Justificado') {
    console.log(`Cambiando estudiante ${studentId} de Justificado a ${status}`);
  }
  
  // Si el estudiante cambia a Justificado, manejar la justificación
  if (status === 'Justificado') {
    handleOpenJustification({
      id: studentId,
      ...localStudents.value.find(s => s.id === studentId)
    });
  }
};

// Función para gestionar la apertura del modal de justificación
const handleOpenJustification = async (student: any) => {
  try {
    console.log('[Justificación] Iniciando proceso de justificación para estudiante:', student);
    
    // Verificar si tenemos toda la información necesaria
    if (!student || !student.id) {
      console.error('[Justificación] Error: Datos de estudiante inválidos', student);
      displayToast('Error: Datos de estudiante inválidos', 'error');
      return;
    }

    // Obtener la fecha y clase actual
    const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
    const classIdToUse = route.params.classId as string || props.initialClassId || attendanceStore.selectedClass;

    if (!dateToUse || !classIdToUse) {
      console.error('[Justificación] Error: Fecha o clase no disponible', {
        date: dateToUse,
        classId: classIdToUse
      });
      displayToast('Error: Información de fecha o clase no disponible', 'error');
      return;
    }

    // Actualizar el estado local
    selectedStudentForJustification.value = {
      id: student.id,
      nombre: student.nombre || 'Estudiante',
      apellido: student.apellido || ''
    };

    console.log('[Justificación] Estado local actualizado:', selectedStudentForJustification.value);

    // Marcar al estudiante como justificado en el mapa local
    justifiedStudentsMap.value[student.id] = true;

    // Actualizar el estado de asistencia local a 'Justificado'
    if (localAttendanceRecords.value) {
      const previousStatus = localAttendanceRecords.value[student.id];
      localAttendanceRecords.value[student.id] = 'Justificado';
      console.log(`[Justificación] Estado de asistencia actualizado localmente de ${previousStatus} a Justificado`);

      // Si el estudiante no tenía un estado previo o era diferente de 'Justificado',
      // agregarlo a los cambios pendientes
      if (!previousStatus || previousStatus !== 'Justificado') {
        pendingChanges.value.add(student.id);
        console.log('[Justificación] Cambio pendiente registrado');
        
        // Crear una justificación pendiente si no existe
        if (!pendingJustifications.value.has(student.id)) {
          pendingJustifications.value.set(student.id, {
            reason: '',
            timestamp: new Date()
          });
          console.log('[Justificación] Justificación pendiente creada automáticamente');
        }
      }
    } else {
      // Si no hay registros locales, crear uno nuevo
      localAttendanceRecords.value = { [student.id]: 'Justificado' };
      pendingChanges.value.add(student.id);
      console.log('[Justificación] Nuevo registro local creado');
      
      // Asegurar que exista una justificación pendiente
      if (!pendingJustifications.value.has(student.id)) {
        pendingJustifications.value.set(student.id, {
          reason: '',
          timestamp: new Date()
        });
        console.log('[Justificación] Justificación pendiente creada para nuevo registro');
      }
    }

    // Buscar si ya existe una justificación para este estudiante
    const existingJustification = attendanceStore.getJustification(student.id);

    // Si ya existe una justificación, usarla como pendiente
    if (existingJustification) {
      console.log(`[Justificación] Justificación existente encontrada para ${student.nombre}:`, existingJustification);
      pendingJustifications.value.set(student.id, {
        reason: existingJustification.reason || '',
        documentURL: existingJustification.documentURL,
        timestamp: new Date()
      });
    } else if (!pendingJustifications.value.has(student.id)) {
      // Si no hay justificación existente ni pendiente, crear una nueva
      pendingJustifications.value.set(student.id, {
        reason: '',
        timestamp: new Date()
      });
      console.log('[Justificación] Nueva justificación pendiente creada');
    }

    // Emitir el evento al componente padre
    console.log('[Modal] Emitiendo evento open-justification al componente padre');
    emit('open-justification', {
      ...student,
      classId: classIdToUse,
      date: dateToUse
    });

    // Notificar al usuario
    displayToast(`Añadiendo justificación para ${student.nombre || 'Estudiante'}`, 'info');

  } catch (error) {
    console.error('[Justificación] Error en el proceso de justificación:', error);
    displayToast('Error al procesar la justificación', 'error');
  }
};

const handleSaveJustification = (data: { studentId: string, reason: string, documentURL?: string, file?: File }) => {
  console.log('Guardando justificación:', data);
  
  // Verificar que tenemos los datos necesarios
  if (!data.studentId || !data.reason) {
    console.error('Datos incompletos para guardar justificación:', data);
    displayToast('Error: Datos incompletos para la justificación', 'error');
    return;
  }

  // Guardar la justificación en el mapa de justificaciones pendientes
  pendingJustifications.value.set(data.studentId, {
    reason: data.reason,
    documentURL: data.documentURL,
    timestamp: new Date()
  });

  // Asegurarse de que el estudiante esté marcado como justificado
  if (localAttendanceRecords.value) {
    localAttendanceRecords.value[data.studentId] = 'Justificado';
    pendingChanges.value.add(data.studentId);
  }

  // Notificar al usuario
  displayToast('Justificación guardada correctamente', 'success');

  // Limpiar el estado de justificación actual
  selectedStudentForJustification.value = null;
  currentJustificationReason.value = '';

  console.log('Justificación guardada:', {
    studentId: data.studentId,
    reason: data.reason,
    documentURL: data.documentURL
  });
  
  // Actualizar la UI inmediatamente para mostrar el estado "Justificado"
  localAttendanceRecords.value = { ...localAttendanceRecords.value };
  
  // Notificar al usuario que la justificación fue guardada pero los cambios de asistencia aún deben guardarse
  displayToast('Justificación guardada. Recuerde guardar los cambios generales de asistencia.', 'info');
};

// Función para manejar el clic en el botón de guardar observación
const handleOpenObservation = () => {
  emit('open-observation');
};

// Funciones para navegación
const navigateToWorkspace = () => {
  console.log('Emitiendo navigate-to-class-selector desde AttendanceList');
  emit('navigate-to-class-selector');
};

const handleNavigateToCalendar = () => {
  console.log('Emitiendo navigate-to-calendar desde AttendanceList');
  emit('navigate-to-calendar');
};

const handleNavigateToClassSelector = () => {
  console.log('Emitiendo navigate-to-class-selector desde AttendanceList');
  emit('navigate-to-class-selector');
};

// Funciones simplificadas para marcar todos los estudiantes
const markAllAsPresent = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsPresent(effectiveStudents.value);
};

const markAllAsAbsent = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsAbsent(effectiveStudents.value);
};

const markAllAsLate = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsLate(effectiveStudents.value);
};

// Función simplificada para resetear todos los estados
const resetAllStatuses = async () => {
  if (props.isDisabled) return;
  
  if (confirm('¿Estás seguro de que quieres reestablecer el estado de todos los estudiantes a su último estado guardado?')) {
    // Obtener la fecha y clase actual
    const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
    const classIdToUse = route.params.classId as string || props.initialClassId;
    
    // Usar el composable para reestablecer estados
    await attendanceActions.resetAllStatuses(dateToUse, classIdToUse);
  }
};

// Utilidades para avatares
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
}

const getAvatarColor = (name: string) => {
  if (!name) return 'bg-gray-500';
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
  ];
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
}

// Estudiantes ordenados por nombre
const sortedStudents = computed(() => {
  return [...effectiveStudents.value].sort((a, b) => {
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
});
</script>

<template>
  <div class="attendance-list">
    <Toast 
      v-if="showToast" 
      :message="toastMessage" 
      :type="toastType" 
      @close="showToast = false" 
    />
    
    <LoadingOverlay v-if="isLoading" message="Cargando datos de asistencia..." />
    
    <div v-else-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">{{ errorMessage }}</span>
    </div>
    
    <div>
      <!-- Header with action buttons -->
      <AttendanceHeader 
        :class-name="props.selectedClassName" 
        :pending-changes-count="pendingChangesCount"
        :is-disabled="props.isDisabled"
        :observations="attendanceStore.getObservations"
        :should-animate-observations-button="shouldAnimateObservationsButton"
        :has-observations="hasObservations"
        @navigate-to-workspace="navigateToWorkspace"
        @save="handleUpdateStatus('all', 'save')"
        @open-export="emit('open-export')"
        @open-observation="handleOpenObservation"
        @navigate-to-calendar="handleNavigateToCalendar"
        @navigate-to-class-selector="handleNavigateToClassSelector"
      />
      
      <AttendanceSummary 
        :attendance-records="effectiveAttendanceRecords"
        :pending-changes-count="pendingChangesCount"
        :has-pending-changes="hasPendingChanges"
        :on-save="() => handleUpdateStatus('all', 'save')"
      />
      
      <AttendanceTable 
        :students="effectiveStudents"
        :attendance-records="effectiveAttendanceRecords"
        :is-disabled="props.isDisabled"
        :pending-changes="pendingChanges"
        @update-status="handleUpdateStatus"
        @open-justification="handleOpenJustification"
        @mark-all-present="markAllAsPresent"
        @mark-all-absent="markAllAsAbsent"
        @mark-all-late="markAllAsLate"
        @reset-all="resetAllStatuses"
      />
    </div>
  </div>
</template>

<style>
/* Make buttons smaller on mobile */
.btn-xs {
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
  line-height: 1.2;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.3;
}

/* Add a custom breakpoint for extra small screens */
@media (min-width: 480px) {
  .xs\:inline {
    display: inline;
  }
  .xs\:hidden {
    display: none;
  }
}

/* Enhanced responsive styles for buttons */
@media (max-width: 480px) {
  .flex-1 {
    min-width: 0;
  }
}

@media (max-width: 350px) {
  .justify-center {
    justify-content: center;
  }
  .flex-1 {
    flex-basis: 40%;
  }
}

/* Button hover animation */
button:not(:disabled) {
  transition: transform 0.15s ease-in-out, background-color 0.15s ease-in-out;
}
button:not(:disabled):hover {
  transform: translateY(-1px);
}
button:not(:disabled):active {
  transform: translateY(0);
}

/* Define button status classes that will be used by child components */
.btn-success-active {
  background-color: theme('colors.green.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.green.300');
}

.btn-success {
  background-color: theme('colors.green.200');
  color: theme('colors.green.700');
}

.btn-success:hover {
  background-color: theme('colors.green.300');
}

.btn-danger-active {
  background-color: theme('colors.red.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.red.300');
}

.btn-danger {
  background-color: theme('colors.red.200');
  color: theme('colors.red.700');
}

.btn-danger:hover {
  background-color: theme('colors.red.300');
}

.btn-warning-active {
  background-color: theme('colors.yellow.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.yellow.300');
}

.btn-warning {
  background-color: theme('colors.yellow.200');
  color: theme('colors.yellow.700');
}

.btn-warning:hover {
  background-color: theme('colors.yellow.300');
}

.btn-info-active {
  background-color: theme('colors.blue.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.blue.300');
}

.btn-info {
  background-color: theme('colors.blue.200');
  color: theme('colors.blue.700');
}

.btn-info:hover {
  background-color: theme('colors.blue.300');
}

/* Button disabled state */
button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
