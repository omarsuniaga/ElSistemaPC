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
  ArrowDownOnSquareIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'
import './AttendanceList.css'
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
import { useAttendanceStore } from '../store/attendance'
import { useRoute } from 'vue-router'
import { useAttendanceState } from '../composables/useAttendanceState'
import ClassObservationBadge from './ClassObservationBadge.vue'
import Toast from '../../../components/Toast.vue'

// Props y emits
const props = defineProps<{
  selectedClassName?: string; // Nombre de la clase seleccionada
  initialClassId?: string;
  students: Student[];
  attendanceRecords: Record<string, AttendanceStatus>;
  isDisabled?: boolean; // Para deshabilitar botones en fechas no editables
}>()

const {
  selectedDate,
  selectedClass,
  view,
  loading,
  init,
  setDate,
  setClass,
  loadCurrent
} = useAttendanceState('maestro')

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

// Estado local
const students = ref<Student[]>([])
const pendingChanges = ref<Set<string>>(new Set()); // Registro de IDs de estudiantes con cambios pendientes
const localAttendanceRecords = ref<Record<string, string>>({}); // Estado local para gestionar cambios antes de guardar
const selectedStudentForJustification = ref<{ id: string; nombre: string; apellido: string } | null>(null);

// Estado para el toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success');

// Watch para inicializar el estado local cuando cambian los attendanceRecords
watch(() => props.attendanceRecords, (newRecords) => {
  localAttendanceRecords.value = { ...newRecords };
}, { immediate: true, deep: true });

// Removidas funciones no utilizadas para obtener información de justificación
// Si se necesitan en el futuro, pueden ser reintroducidas

// Función para mostrar el toast
const displayToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

// Manejar actualización de estado de asistencia
const handleUpdateStatus = (studentId: string, status: string) => {
  // Si es una operación de guardar todos los cambios pendientes
  if (studentId === 'all' && status === 'save') {
    classesStore.getClassesByDay(todayIndex.value).forEach((classObj) => {
      // Guardar cambios pendientes para cada clase
      const classId = classObj.id;
      const attendanceDoc = attendanceStore.attendanceDocuments.find(doc => doc.classId === classId && doc.fecha === attendanceStore.selectedDate);
      if (attendanceDoc) {
        attendanceStore.saveAttendanceDocument(attendanceDoc);
      }
    });
    // Guardar todos los cambios pendientes
    saveAllPendingChanges();
    return;
  }
  
  // Asegúrate de que el ID del estudiante y el estado sean válidos
  if (!studentId || !status) return;
  
  // Actualizar el registro local
  localAttendanceRecords.value[studentId] = status as AttendanceStatus;
  
  // Registrar este cambio como pendiente
  pendingChanges.value.add(studentId);
  
  // Mostrar toast indicando el cambio
  const studentName = students.value.find(s => s.id === studentId)?.nombre || 'Estudiante';
  displayToast(`${studentName}: ${status}`, 'info');
  
};

// Función para guardar todos los cambios pendientes
const saveAllPendingChanges = async () => {
  if (pendingChanges.value.size === 0) return;
  try {
    // Preparar el documento de asistencia con la estructura correcta
    const attendanceDoc = {
      fecha: attendanceStore.selectedDate || new Date().toISOString().split('T')[0],
      classId: selectedClass.value,
      data: {
        presentes: [] as string[],
        ausentes: [] as string[],
        tarde: [] as string[],
        justificacion: attendanceStore.currentAttendanceDoc?.data.justificacion || [],
        observations: attendanceStore.currentAttendanceDoc?.data.observations || ''
      }
    };
    
    // Agrupar estudiantes por estado - sólo se incluyen los estudiantes con un estado asignado explícitamente
    Object.entries(localAttendanceRecords.value).forEach(([studentId, status]) => {
      if (status === 'Presente') {
        attendanceDoc.data.presentes.push(studentId);
      } else if (status === 'Ausente') {
        attendanceDoc.data.ausentes.push(studentId);
      } else if (status === 'Tardanza') {
        attendanceDoc.data.tarde.push(studentId);
      } else if (status === 'Justificado') {
        // Los justificados deben estar en la lista de tarde
        attendanceDoc.data.tarde.push(studentId);
        
        // Si ya existe una justificación, se mantiene, si no, se crea una básica
        if (!attendanceDoc.data.justificacion.some(j => j.id === studentId)) {
          attendanceDoc.data.justificacion.push({
            id: studentId,
            reason: 'Justificación pendiente de detalles'
          });
        }
      }
    });
    
    // Guardar en Firestore usando el método del store
    await attendanceStore.saveAttendanceDocument(attendanceDoc);
    await attendanceStore.fetchAttendanceDocuments();
    // Emitir evento global para actualizar monitoreo
    window.dispatchEvent(new Event('attendance-updated'));
    // Mostrar toast de éxito
    displayToast(`¡Asistencia guardada! ${pendingChanges.value.size} registro(s) actualizados.`, 'success');
    
    // Limpiar los cambios pendientes después de guardar
    pendingChanges.value.clear();
    
  } catch (error) {
    // Mostrar toast de error
    displayToast('Error al guardar los cambios de asistencia', 'error');
    console.error("Error al guardar los cambios de asistencia:", error);
  }
};

// Event handlers para abrir modales
const handleOpenJustification = (student: any) => {
  // Actualizar inmediatamente el estado visual a "Justificado"
  if (student && student.id) {
    // Solo aplicamos el estado visual si no está deshabilitada la edición
    if (!props.isDisabled) {
      // Actualizamos el estado local
      localAttendanceRecords.value[student.id] = 'Justificado';
      
      // Marcamos como pendiente de guardar
      pendingChanges.value.add(student.id);
      
      // Notificar al componente padre sobre el cambio de estado
      emit('update-status', student.id, 'Justificado');
    }
  }
  
  // Luego abrimos el modal de justificación
  selectedStudentForJustification.value = student ? 
    { id: student.id, nombre: student.nombre, apellido: student.apellido } : null;
  emit('open-justification', student);

  // Mostrar toast
  if (student && !props.isDisabled) {
    displayToast(`Añadiendo justificación para ${student.nombre}`, 'info');
  }
};

const handleOpenObservation = () => {
  emit('open-observation', null);
};

// Funciones de utilidad originales
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
  ]
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  return colors[hash % colors.length]
}

// Función getStatusClass removida porque no se utiliza

// Cargar las clases si no están ya cargadas
onMounted(async () => {
  try {
    // Verificar si tenemos claseId y fecha en la URL
    if (route.params.classId && route.params.date) {
      const classId = route.params.classId as string;
      selectedClass.value = classId;

      // Cargar estudiantes para la clase
      await loadStudentsForClass(classId);
    }

    // cargar clases desde el store si es necesario
    if (!classesStore.classes.length) {
      await classesStore.fetchClasses();
    }
    
    // cargar estudiantes desde el store si es necesario
    if (!studentsStore.students.length) {
      await studentsStore.fetchStudents();
    }
  } catch (error) {
    console.error("Error en onMounted:", error);
  }
});

const loadStudentsForClass = async (classId: string) => {
  try {
    // Obtener la clase del store
    const classObj = classesStore.classes.find(c => c.id === classId);
    
    if (!classObj) {
      console.error('Clase no encontrada:', classId);
      return;
    }
    
    
    // Verificar si la clase tiene studentIds
    if (classObj.studentIds && Array.isArray(classObj.studentIds)) {
      
      // Almacenar los IDs en una variable local para que TypeScript sepa que está definido
      const studentIds = classObj.studentIds;
      
      // Obtener los estudiantes correspondientes a los IDs
      const studentsForClass = studentsStore.students.filter(student =>
        studentIds.includes(student.id)
      );
      
      students.value = studentsForClass;
    } else {
      console.warn('No se encontraron IDs de estudiantes en la clase:', classObj);
      students.value = [];
    }
  } catch (error) {
    console.error("Error al cargar estudiantes para la clase:", error);
  }
};

// Verificar si hay cambios sin guardar
const hasPendingChanges = computed(() => pendingChanges.value.size > 0);

// Obtener el índice del día actual (0 para domingo, 1 para lunes, etc.)
const todayIndex = computed(() => {
  return new Date().getDay();
});

</script>
<template>
  <div class="space-y-4">
    <!-- Toast component -->
    <Toast
      v-model:show="showToast"
      :message="toastMessage"
      :type="toastType"
      position="top-right"
      :duration="3000"
    />

    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
      <div class="flex items-center space-x-2">
        <!-- Indicador de observaciones de clase -->
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
          :disabled="isDisabled || !hasPendingChanges"
          :class="{'opacity-50': !hasPendingChanges}"
        >
          <ArrowDownOnSquareIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          <span class="hidden xs:inline">Guardar{{hasPendingChanges ? ' (' + pendingChanges.size + ')' : ''}}</span>
          <span class="xs:hidden">Guardar{{hasPendingChanges ? ' (' + pendingChanges.size + ')' : ''}}</span>
        </button>
        <button class="btn btn-secondary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none" @click="emit('open-export')">
          <ArrowDownTrayIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          <span class="hidden xs:inline">Exportar</span>
          <span class="xs:hidden">Export</span>
        </button>
        <button 
          class="btn btn-info btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none" 
          @click="emit('open-observation', null)"
          :disabled="isDisabled"
        >
          <ChatBubbleLeftRightIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          <span class="hidden xs:inline">Observaciones</span>
          <span class="xs:hidden">Observaciones</span>
        </button>
      </div>
    </div>

    <div v-if="students.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p class="text-gray-500 dark:text-gray-400">
        {{ selectedClassName ? `No hay estudiantes en la clase ${selectedClassName}` : 'Seleccione una clase para ver los estudiantes' }}
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
          <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                  <!-- Indicador de cambio pendiente -->
                <div v-if="pendingChanges.has(student.id)" class="flex items-center">
                  <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                </div>
          <button 
                  @click="handleUpdateStatus(student.id, 'Presente')"
                  :class="[
                    'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                    localAttendanceRecords[student.id] === 'Presente' ? 'btn-success-active' : 'btn-success'
                  ]"
                  :disabled="isDisabled"
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
                  :disabled="isDisabled"
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
                  :disabled="isDisabled"
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
                  :disabled="isDisabled"
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