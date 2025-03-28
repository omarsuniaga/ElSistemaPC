<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  PaperClipIcon
} from '@heroicons/vue/24/outline'
import './AttendanceList.css'
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
import { useAttendanceStore } from '../store/attendance'
import { useRoute } from 'vue-router'

// Props y emits
const props = defineProps<{
  students: Student[];  // Estudiantes ya filtrados por la clase
  attendanceRecords: Record<string, string>;
  initialClassId?: string;
  selectedClassName?: string; // Nombre de la clase seleccionada
  isDisabled?: boolean; // Para deshabilitar botones en fechas no editables
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

// Estado local
const selectedClass = ref<string>(props.initialClassId || '');
const students = ref<Student[]>([])
const tempJustifications = ref<Record<string, string>>({});
const showJustifiedAbsenceModal = ref(false);
const selectedStudentForJustification = ref<Student | null>(null);
const pendingAttendanceChanges = ref<{ studentId: string, status: AttendanceStatus }[]>([]);
const warningMessage = ref<string | null>(null);
const activeStatus = ref<Record<string, AttendanceStatus>>({});

// Funciones para obtener información de justificación
const hasJustification = (studentId: string): boolean => {
  return attendanceStore.hasJustification(studentId);
};

const getJustificationReason = (studentId: string): string => {
  const justification = attendanceStore.getJustification(studentId);
  return justification?.reason || 'Sin detalle de justificación';
};

const getJustificationDocument = (studentId: string): string | undefined => {
  const justification = attendanceStore.getJustification(studentId);
  return justification?.documentURL;
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

const getStatusClass = (status: string) => {
  const classes = {
    'Presente': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    'Ausente': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    'Tardanza': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    'Justificado': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
}

// Event handlers
const handleUpdateStatus = async (studentId: string, status: AttendanceStatus | 'save') => {
  console.log('Actualizando estado de asistencia:', studentId, status)
  
  // No permitir cambios si la fecha es futura
  if (!props.isDisabled) {
    warningMessage.value = "No se puede modificar asistencia para fechas futuras";
    return;
  }
  
  if (status === 'save') {
    await saveAllAttendanceChanges();
    return;
  }
  
  // Actualizar el estado de asistencia localmente
  attendanceStore.attendanceRecords[studentId] = status;
  
  // Actualizar el estado activo localmente
  activeStatus.value = { ...activeStatus.value, [studentId]: status };
  
  // Si el estado es justificado y no hay justificación temporal, abrir el modal
  if (status === 'Justificado' && !tempJustifications.value[studentId]) {
    selectedStudentForJustification.value = props.students.find(s => s.id === studentId) || null;
    showJustifiedAbsenceModal.value = true;
    return;
  }
  
  // Añadir a la lista de cambios pendientes
  const existingChange = pendingAttendanceChanges.value.findIndex(c => c.studentId === studentId);
  if (existingChange !== -1) {
    pendingAttendanceChanges.value[existingChange].status = status;
  } else {
    pendingAttendanceChanges.value.push({ studentId, status });
  }
};

const handleJustificationSave = async (data: { reason: string, documentUrl?: string, file?: File }) => {
  try {
    if (!selectedStudentForJustification.value) return
    
    // Guardar la justificación temporalmente
    tempJustifications.value[selectedStudentForJustification.value.id] = data.reason;
    
    // Actualizar el estado de asistencia localmente a 'Justificado'
    handleUpdateStatus(selectedStudentForJustification.value.id, 'Justificado');
    
    // Cerrar el modal
    showJustifiedAbsenceModal.value = false
  } catch (err) {
    console.error('Error saving justification:', err)
  }
}

// Event handlers para abrir modales
const handleOpenJustification = (student: any) => {
  selectedStudentForJustification.value = student ? { id: student.id, nombre: student.nombre, apellido: student.apellido } : null
  showJustifiedAbsenceModal.value = true
}

const getButtonClass = (studentId: string, status: AttendanceStatus): string => {
  const isJustifiedWithReason = status === 'Justificado' && tempJustifications.value[studentId];
  const isActive = activeStatus.value[studentId] === status || (props.attendanceRecords[studentId] === status && !activeStatus.value[studentId]) || isJustifiedWithReason;
  
  let baseClass = 'btn btn-icon btn-sm sm:btn-sm';
  
  switch (status) {
    case 'Presente':
      baseClass += isActive ? ' btn-success-active' : ' btn-success';
      break;
    case 'Ausente':
      baseClass += isActive ? ' btn-danger-active' : ' btn-danger';
      break;
    case 'Tardanza':
      baseClass += isActive ? ' btn-warning-active' : ' btn-warning';
      break;
    case 'Justificado':
      baseClass += isActive ? ' btn-info-active' : ' btn-info';
      break;
  }
  
  return baseClass;
};

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
    
    console.log('Clase encontrada:', classObj);
    
    // Verificar si la clase tiene studentIds
    if (classObj.studentIds && Array.isArray(classObj.studentIds)) {
      console.log('IDs de estudiantes encontrados en la clase:', classObj.studentIds);
      
      // Obtener los estudiantes correspondientes a los IDs
      const studentsForClass = studentsStore.students.filter(student =>
        classObj.studentIds.includes(student.id)
      );
      
      students.value = studentsForClass;
      console.log('Estudiantes cargados para la clase:', studentsForClass);
    } else {
      console.warn('No se encontraron IDs de estudiantes en la clase:', classObj);
      students.value = [];
    }
  } catch (error) {
    console.error("Error al cargar estudiantes para la clase:", error);
  }
};
</script>
<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center mb-4">
      
      <div class="flex justify-end gap-1 sm:gap-2">
        <button 
          @click="$router.push('/workspace')"
          class="btn btn-primary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <ViewColumnsIcon class="w-5 h-5" />
          Area de Trabajo
        </button>
        <button 
          class="btn btn-primary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" 
          @click="emit('update-status', 'all', 'save')"
          :disabled="isDisabled"
        >
          <ArrowDownOnSquareIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          <span class="hidden xs:inline">Guardar</span>
          <span class="xs:hidden">G</span>
        </button>
        <button class="btn btn-secondary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" @click="emit('open-export')">
          <ArrowDownTrayIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          <span class="hidden xs:inline">Exportar</span>
          <span class="xs:hidden">E</span>
        </button>
        <button 
          class="btn btn-info btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" 
          @click="emit('open-observation', null)"
          :disabled="isDisabled"
        >
          <ChatBubbleLeftRightIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          <span class="hidden xs:inline">Observaciones</span>
          <span class="xs:hidden">O</span>
        </button>
      </div>
    </div>

    <div v-if="students.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p class="text-gray-500 dark:text-gray-400">
        {{ selectedClassName ? `No hay estudiantes en la clase ${selectedClassName}` : 'Seleccione una clase para ver los estudiantes' }}
      </p>
    </div>

    <div v-else class="w-full overflow-x-auto rounded-lg">
      <table class="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/2 sm:w-auto">
              Estudiante
            </th>
            <th class="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4 sm:w-auto">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="px-1 sm:px-4 py-2 sm:py-3">
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
                  <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ student.nombre }} {{ student.apellido }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-1 sm:px-4 py-2 sm:py-3 text-sm font-medium">
              <div class="flex no-wrap gap-2 justify-end">
                <button 
                  @click="handleUpdateStatus(student.id, 'Presente')"
                  :class="getButtonClass(student.id, 'Presente')"
                  :disabled="isDisabled"
                  title="Presente"
                >
                  <CheckCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button 
                  @click="handleUpdateStatus(student.id, 'Ausente')"
                  :class="getButtonClass(student.id, 'Ausente')"
                  :disabled="isDisabled"
                  title="Ausente"
                >
                  <XCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button 
                  @click="handleUpdateStatus(student.id, 'Tardanza')"
                  :class="getButtonClass(student.id, 'Tardanza')"
                  :disabled="isDisabled"
                  title="Tardanza"
                >
                  <ClockIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  @click="handleOpenJustification(student)"
                  :class="getButtonClass(student.id, 'Justificado')"
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
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
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
}

/* Estilos especiales para el estado Justificado */
.btn-info-active {
  @apply bg-blue-700 text-white ring-2 ring-blue-300 dark:ring-blue-700 !important;
}

.btn-info {
  @apply bg-blue-200 hover:bg-blue-300 text-blue-700 !important;
}
</style>