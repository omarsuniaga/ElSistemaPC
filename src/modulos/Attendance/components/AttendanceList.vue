<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { AttendanceStatus } from '../types/attendance'
import type { Student } from '../../Students/types/student'
import {
  CheckCircleIcon,
  XCircleIcon,
  ViewColumnsIcon,
  ClockIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownOnSquareIcon,  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import './AttendanceList.css'
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
import { useAttendanceStore } from '../store/attendance'
import { useRoute } from 'vue-router'
// import { useAttendanceState } from '../composables/useAttendanceState' // Comentado si no se usa directamente aquí
import ClassObservationBadge from './ClassObservationBadge.vue'
import Toast from '../../../components/Toast.vue'

// Props y emits
const props = defineProps<{
  selectedClassName?: string;
  initialClassId?: string; // Usado para cargar datos si se accede por URL
  date?: string; // Usado para cargar datos si se accede por URL
  students?: Student[]; // Ahora opcional, con default
  attendanceRecords?: Record<string, AttendanceStatus>; // Ahora opcional, con default
  isDisabled?: boolean;
}>()

const emit = defineEmits<{
  (e: 'update-status', studentId: string, status: AttendanceStatus | 'save'): void;
  (e: 'open-observation', student: Student | null): void;
  (e: 'open-justification', student: Student): void;
  (e: 'open-export'): void;
  (e: 'class-changed', classId: string): void;
}>()

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
const selectedStudentForJustification = ref<{ id: string; nombre: string; apellido: string } | null>(null);

// Estado para el toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success');

// Usar props si están disponibles, de lo contrario, usar datos locales
const effectiveStudents = computed(() => {
  return props.students && props.students.length > 0 ? props.students : localStudents.value;
});

const effectiveAttendanceRecords = computed(() => {
  // Prioriza los cambios locales no guardados, luego los props, luego los datos locales cargados
  if (pendingChanges.value.size > 0) {
    return localAttendanceRecords.value;
  }
  return props.attendanceRecords && Object.keys(props.attendanceRecords).length > 0
    ? props.attendanceRecords
    : localAttendanceRecords.value;
});

// Watch para inicializar el estado local cuando cambian los attendanceRecords de las props
// y no hay cambios pendientes
watch(
  () => props.attendanceRecords,
  (newRecords) => {
    if (pendingChanges.value.size === 0 && newRecords) {
      localAttendanceRecords.value = { ...newRecords };
    }
  },
  { immediate: true, deep: true }
);

// Watch para inicializar los estudiantes locales cuando cambian las props
// y no hay carga activa (para evitar sobrescribir datos cargados por URL)
watch(
  () => props.students,
  (newStudents) => {
    if (!isLoading.value && newStudents) {
      localStudents.value = [...newStudents];
    }
  },
  { immediate: true, deep: true }
);


const fetchDataForComponent = async (dateParam: string, classIdParam: string) => {
  try {
    isLoading.value = true;
    errorMessage.value = null;
    // Resetear estados previos
    localStudents.value = [];
    localAttendanceRecords.value = {};
    console.log(`Fetching data for date: ${dateParam}, classId: ${classIdParam}`);

    // Cargar estudiantes para la clase
    const classData = await classesStore.getClassById(classIdParam);
    if (classData && classData.studentIds && classData.studentIds.length > 0) {
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents();
      }
      localStudents.value = studentsStore.students.filter(student =>
        classData.studentIds.includes(student.id)
      );
    } else {
      localStudents.value = [];
      console.warn(`No students found for class ${classIdParam}`);
    }

    // Cargar registros de asistencia
    const records = await attendanceStore.getAttendanceByDateAndClass(dateParam, classIdParam);
    if (records && records.length > 0 && records[0].data) {
        // Reconstruir el formato Record<string, AttendanceStatus>
        const formattedRecords: Record<string, AttendanceStatus> = {};
        records[0].data?.presentes?.forEach(id => formattedRecords[id] = 'Presente');
        records[0].data?.ausentes?.forEach(id => formattedRecords[id] = 'Ausente');
        records[0].data?.tarde?.forEach(id => formattedRecords[id] = 'Tardanza');
        // Asumimos que los justificados también están en una de las listas anteriores (ej. tarde)
        // y el estado 'Justificado' se maneja visualmente o al abrir el modal.
        // Si 'Justificado' es un estado primario, necesitaría su propia lista en `records.data`.
        // Por ahora, si un estudiante está en `justificacion`, lo marcamos como 'Justificado'
        // si no tiene otro estado más específico.
         records?.forEach(record => record.data?.justificacion?.forEach(justification => {
            if (!formattedRecords[justification.id]) { // Solo si no tiene otro estado
                 formattedRecords[justification.id] = 'Justificado';
            } else if (formattedRecords[justification.id] === 'Tardanza' || formattedRecords[justification.id] === 'Ausente') {
                formattedRecords[justification.id] = 'Justificado';
            }
        }));  // Added closing parenthesis here
        localAttendanceRecords.value = formattedRecords;
    } else {
        localAttendanceRecords.value = {};
    }

    console.log('Data fetched:', { students: localStudents.value.length, records: Object.keys(localAttendanceRecords.value).length });

  } catch (error) {
    console.error("Error fetching data for AttendanceList:", error);
    errorMessage.value = "Error al cargar los datos de asistencia.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  const dateParam = route.params.date as string || props.date;
  const classIdParam = route.params.classId as string || props.initialClassId;

  if (dateParam && classIdParam) {
    // Solo cargar datos si las props no los proveyeron inicialmente
    const studentsProvided = props.students && props.students.length > 0;
    const recordsProvided = props.attendanceRecords && Object.keys(props.attendanceRecords).length > 0;

    if (!studentsProvided || !recordsProvided) {
      await fetchDataForComponent(dateParam, classIdParam);
    } else {
      // Si las props ya tienen datos, los usamos y actualizamos el estado local
      if (props.students) localStudents.value = [...props.students];
      if (props.attendanceRecords) localAttendanceRecords.value = { ...props.attendanceRecords };
    }
  } else {
    // Si no hay parámetros de ruta ni props iniciales, usar props si existen
     if (props.students) localStudents.value = [...props.students];
     if (props.attendanceRecords) localAttendanceRecords.value = { ...props.attendanceRecords };
     if (!props.students && !props.initialClassId) {
        console.warn("AttendanceList: No classId or students provided.");
        errorMessage.value = "No se especificó una clase para mostrar la asistencia.";
     }
  }
});

// Watch para cambios en la ruta si el componente permanece montado
watch(
  () => [route.params.date, route.params.classId],
  async ([newDate, newClassId]) => {
    if (newDate && newClassId) {
      await fetchDataForComponent(newDate.toString(), newClassId.toString());
      // Forzar actualización de datos locales
      localStudents.value = [...localStudents.value];
      localAttendanceRecords.value = {...localAttendanceRecords.value};
    }
  },
  { immediate: true, deep: true }
);
watch(
  () => props.attendanceRecords,
  (newRecords) => {
    // Only update from props if no local unsaved changes AND not currently fetching data
    if (pendingChanges.value.size === 0 && !isLoading.value && newRecords) { // Added !isLoading.value
      localAttendanceRecords.value = { ...newRecords };
    }
  },
  { immediate: true, deep: true }
);

// Función para mostrar el toast
const displayToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

// Manejar actualización de estado de asistencia
const handleUpdateStatus = (studentId: string, status: string) => {
  if (studentId === 'all' && status === 'save') {
    saveAllPendingChanges();
    return;
  }
  
  if (!studentId || !status) return;
  
  localAttendanceRecords.value[studentId] = status as AttendanceStatus;
  pendingChanges.value.add(studentId);
  
  const studentName = effectiveStudents.value.find(s => s.id === studentId)?.nombre || 'Estudiante';
  displayToast(`${studentName}: ${status}`, 'info');
};

// Función para guardar todos los cambios pendientes
const saveAllPendingChanges = async () => {
  if (pendingChanges.value.size === 0) return;

  const dateToSave = route.params.date as string || props.date || attendanceStore.selectedDate || new Date().toISOString().split('T')[0];
  const classIdToSave = route.params.classId as string || props.initialClassId || attendanceStore.currentAttendanceDoc?.classId;

  if (!dateToSave || !classIdToSave) {
    displayToast('Error: Fecha o ID de clase no definidos para guardar.', 'error');
    console.error('Error: Fecha o ID de clase no definidos para guardar.', { dateToSave, classIdToSave });
    return;
  }

  try {
    const attendanceDoc = {
      fecha: dateToSave,
      classId: classIdToSave,
      teacherId: attendanceStore.currentAttendanceDoc?.teacherId || classesStore.getClassById(classIdToSave)?.teacherId, // Asegurar teacherId
      timestamp: new Date().toISOString(),
      data: {
        presentes: [] as string[],
        ausentes: [] as string[],
        tarde: [] as string[],
        justificacion: attendanceStore.currentAttendanceDoc?.data.justificacion || [],
        observations: attendanceStore.currentAttendanceDoc?.data.observations || ''
      }
    };

    Object.entries(localAttendanceRecords.value).forEach(([studId, stat]) => {
      if (pendingChanges.value.has(studId) || !props.attendanceRecords || props.attendanceRecords[studId] !== stat) { // Guardar solo si cambió o es nuevo
        if (stat === 'Presente') attendanceDoc.data.presentes.push(studId);
        else if (stat === 'Ausente') attendanceDoc.data.ausentes.push(studId);
        else if (stat === 'Tardanza') attendanceDoc.data.tarde.push(studId);
        else if (stat === 'Justificado') {
          // Lógica para justificados: usualmente se marcan como tarde o ausente y se añade justificación
          // Aquí asumimos que si es 'Justificado', puede ir a una lista (ej. tarde) o solo tener la justificación
          // Por simplicidad, si es 'Justificado' y no otro estado, lo ponemos en 'tarde'
           if (!attendanceDoc.data.presentes.includes(studId) && !attendanceDoc.data.ausentes.includes(studId)) {
             attendanceDoc.data.tarde.push(studId);
           }
          if (!attendanceDoc.data.justificacion.some(j => j.id === studId)) {
            attendanceDoc.data.justificacion.push({ id: studId, reason: 'Justificación pendiente' });
          }
        }
      }
    });
    
    // Asegurar que los no modificados pero existentes en props.attendanceRecords se mantengan si no están en localAttendanceRecords
    if (props.attendanceRecords) {
        for (const studentId in props.attendanceRecords) {
            if (!localAttendanceRecords.value.hasOwnProperty(studentId)) { // Si fue borrado de local, no lo incluimos
                 // O si queremos mantenerlo:
                 // const existingStatus = props.attendanceRecords[studentId];
                 // if (existingStatus === 'Presente' && !attendanceDoc.data.presentes.includes(studentId)) attendanceDoc.data.presentes.push(studentId);
                 // ... etc. para otros estados
            }
        }
    }


    await attendanceStore.saveAttendanceDocument(attendanceDoc);
    await attendanceStore.fetchAttendanceDocuments(); // Refrescar
    window.dispatchEvent(new Event('attendance-updated'));
    displayToast(`¡Asistencia guardada! ${pendingChanges.value.size} registro(s) actualizados.`, 'success');
    pendingChanges.value.clear();
    
  } catch (error) {
    displayToast('Error al guardar los cambios de asistencia', 'error');
    console.error("Error al guardar los cambios de asistencia:", error);
  }
};

const handleOpenJustification = (student: Student) => {
  if (props.isDisabled) return;

  localAttendanceRecords.value[student.id] = 'Justificado';
  pendingChanges.value.add(student.id);
  // emit('update-status', student.id, 'Justificado'); // No es necesario si el padre no lo usa directamente

  selectedStudentForJustification.value = { id: student.id, nombre: student.nombre, apellido: student.apellido };
  emit('open-justification', student);
  displayToast(`Añadiendo justificación para ${student.nombre}`, 'info');
};

const handleOpenObservation = () => {
  // El prop student es Student | null, así que pasamos null
  emit('open-observation', null);
};

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

const hasPendingChanges = computed(() => pendingChanges.value.size > 0);

const sortedStudents = computed(() => {
  return [...effectiveStudents.value].sort((a, b) => {
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
});

</script>
<template>
  <div class="attendance-container">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>Cargando datos de asistencia...</p>
    </div>
    <div v-else-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">{{ errorMessage }}</span>
    </div>
    <div v-else>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div class="flex items-center space-x-2">
          <ClassObservationBadge 
            :observations="attendanceStore.getObservations"
            @click="handleOpenObservation"
            class="sm:text-base text-sm"
          />
        </div>
        
        <div class="flex flex-wrap justify-end gap-1 sm:gap-2 w-full sm:w-auto">
          <button 
            @click="$router.push('/workspace')"
            class="btn btn-primary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <ViewColumnsIcon class="w-4 h-4 sm:w-5 sm:h-5" />
            <span class="hidden xs:inline">Area de Trabajo</span>
            <span class="xs:hidden">Área</span>
          </button>
          <button 
            class="btn btn-primary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none" 
            @click="handleUpdateStatus('all', 'save')"
            :disabled="props.isDisabled || !hasPendingChanges"
            :class="{'opacity-50 cursor-not-allowed': props.isDisabled || !hasPendingChanges}"
          >
            <ArrowDownOnSquareIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="hidden xs:inline">Guardar{{hasPendingChanges ? ` (${pendingChanges.size})` : ''}}</span>
            <span class="xs:hidden">Guardar{{hasPendingChanges ? ` (${pendingChanges.size})` : ''}}</span>
          </button>
          <button class="btn btn-secondary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none" @click="emit('open-export')">
            <ArrowDownTrayIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="hidden xs:inline">Exportar</span>
            <span class="xs:hidden">Export</span>
          </button>
          <button 
            class="btn btn-info btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none" 
            @click="handleOpenObservation"
            :disabled="props.isDisabled"
          >
            <ChatBubbleLeftRightIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="hidden xs:inline">Observaciones</span>
            <span class="xs:hidden">Observaciones</span>
          </button>
        </div>
      </div>

      <div v-if="effectiveStudents.length === 0 && !isLoading" class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p class="text-gray-500 dark:text-gray-400">
          {{ props.selectedClassName ? `No hay estudiantes en la clase ${props.selectedClassName}` : 'No hay estudiantes para mostrar o la clase no está seleccionada.' }}
        </p>
      </div>

      <div v-else class="w-full overflow-x-auto rounded-lg">
        <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/2 sm:w-auto">
                Estudiante
              </th>
              <th class="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4 sm:w-auto">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="student in sortedStudents" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-1 sm:px-2 py-2 sm:py-3">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-7 w-7 sm:h-10 sm:w-10">
                    <div :class="[
                      'w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm', 
                      getAvatarColor(student.nombre)
                    ]">
                      {{ getInitials(student.nombre, student.apellido) }}
                    </div>
                  </div>
                  <div class="ml-2 sm:ml-4">
                    <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {{ student.nombre }} {{ student.apellido }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-1 sm:px-4 py-2 sm:py-3">
                <div class="flex gap-1 sm:mx-2 sm:gap-2 justify-end items-center">
                  <div v-if="pendingChanges.has(student.id)" class="flex items-center" title="Cambio pendiente">
                    <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  </div>
                  <button 
                    @click="handleUpdateStatus(student.id, 'Presente')"
                    :class="[
                      'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                      localAttendanceRecords[student.id] === 'Presente' ? 'btn-success-active' : 'btn-success'
                    ]"
                    :disabled="props.isDisabled"
                    title="Presente"
                  >
                    <CheckCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    @click="handleUpdateStatus(student.id, 'Ausente')"
                    :class="[
                      'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                      localAttendanceRecords[student.id] === 'Ausente' ? 'btn-danger-active' : 'btn-danger'
                    ]"
                    :disabled="props.isDisabled"
                    title="Ausente"
                  >
                    <XCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    @click="handleUpdateStatus(student.id, 'Tardanza')"
                    :class="[
                      'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                      localAttendanceRecords[student.id] === 'Tardanza' ? 'btn-warning-active' : 'btn-warning'
                    ]"
                    :disabled="props.isDisabled"
                    title="Tardanza"
                  >
                    <ClockIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    @click="handleOpenJustification(student)"
                    :class="[
                      'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                      localAttendanceRecords[student.id] === 'Justificado' ? 'btn-info-active' : 'btn-info'
                    ]"
                    :disabled="props.isDisabled"
                    title="Justificacion"
                  >
                    <DocumentCheckIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style>
/* stylelint-disable */
/* postcss-css-variables: true */
/* Add a custom breakpoint for extra small screens */
@media (min-width: 480px) {
  .xs\:inline {
    display: inline;
  }
  .xs\:hidden {
    display: none;
  }
}

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

/* Add overflow handling for tables */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

/* Ensure table doesn't overflow on small screens */
@media (max-width: 640px) {
  .min-w-full {
    min-width: 100%;
  }
  
  /* Make table more compact on mobile */
  table {
    table-layout: fixed;
  }
  
  /* Adjust button spacing in tight layouts */
  .btn-icon {
    min-width: 1.5rem;
    min-height: 1.5rem;
  }
  
  /* Improve text overflow handling */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* Estilos especiales para el estado Justificado */
.btn-info-active {
  @apply bg-blue-700 text-white ring-2 ring-blue-300 dark:ring-blue-700 !important;
}

.btn-info {
  @apply bg-blue-200 hover:bg-blue-300 text-blue-700 !important;
}

/* Estilos para estados activos */
.btn-success-active {
  @apply bg-green-700 text-white ring-2 ring-green-300 dark:ring-green-700 !important;
}

.btn-success {
  @apply bg-green-200 hover:bg-green-300 text-green-700 !important;
}

.btn-danger-active {
  @apply bg-red-700 text-white ring-2 ring-red-300 dark:ring-red-700 !important;
}

.btn-danger {
  @apply bg-red-200 hover:bg-red-300 text-red-700 !important;
}

.btn-warning-active {
  @apply bg-yellow-700 text-white ring-2 ring-yellow-300 dark:ring-yellow-700 !important;
}

.btn-warning {
  @apply bg-yellow-200 hover:bg-yellow-300 text-yellow-700 !important;
}
</style>