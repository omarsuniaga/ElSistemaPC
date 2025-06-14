<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  EyeIcon,
  MusicalNoteIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  ClockIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  PrinterIcon
} from '@heroicons/vue/24/outline';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { useStudentsStore } from '../../../modulos/Students/store/students';
import { useTeachersStore } from '../store/teachers';
import { useTeacherCollaboration } from '../../../modulos/Classes/composables/useTeacherCollaboration';
import { useAuthStore } from '../../../stores/auth';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ShareClassModal from './ShareClassModal.vue';

const props = defineProps({
  classData: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'card', // 'card' | 'list'
    validator: (value: string) => ['card', 'list'].includes(value)
  }
});

const emit = defineEmits(['view', 'edit', 'delete', 'manage-students', 'take-attendance', 'view-history', 'collaboration-updated']);

// Stores
const studentsStore = useStudentsStore();
const teachersStore = useTeachersStore();
const authStore = useAuthStore();
const { inviteAssistant } = useTeacherCollaboration();

// Router para la navegación
const router = useRouter();

// Estados para modales
const showStudentsModal = ref(false);
const showShareModal = ref(false);
const showPermissionsModal = ref(false);
const showManageCollaboratorsModal = ref(false);
const selectedTeacherId = ref('');
const isExpanded = ref(false);

// Permisos para maestros asistentes
const assistantPermissions = ref({
  canTakeAttendance: true,
  canAddObservations: true,
  canViewAttendanceHistory: false
});

// Estado de carga
const isLoading = ref(false);

// Verificación segura para validar studentIds
const hasStudentIds = computed(() => {
  return Array.isArray(props.classData.studentIds) && props.classData.studentIds.length > 0;
});

// Determinar si es clase compartida (el usuario actual es asistente)
const isSharedClass = computed(() => {
  return props.classData.myRole === 'assistant';
});

// Obtener el nombre del maestro principal para clases compartidas
const leadTeacherName = computed(() => {
  if (isSharedClass.value && props.classData.leadTeacher) {
    return props.classData.leadTeacher.name || 'Maestro Principal';
  }
  return '';
});

// Verificar si el usuario actual puede compartir la clase (solo maestros principales)
const canShareClass = computed(() => {
  return props.classData.myRole === 'lead' || 
         (!props.classData.myRole && props.classData.teacherId === authStore.user?.uid);
});

// Verificar si la clase tiene colaboradores (maestros asistentes)
const hasAssistants = computed(() => {
  return props.classData.assistantTeachers && props.classData.assistantTeachers.length > 0;
});

// Obtener los permisos específicos del usuario actual en la clase
const myPermissions = computed(() => {
  if (isSharedClass.value && props.classData.myPermissions) {
    return props.classData.myPermissions;
  }
  // Si es maestro principal, tiene todos los permisos
  if (canShareClass.value) {
    return {
      canTakeAttendance: true,
      canAddObservations: true,
      canViewAttendanceHistory: true,
      canManageStudents: true,
      canEditClass: true
    };
  }
  return {};
});

// Obtener el indicador de rol
const roleIndicator = computed(() => {
  if (isSharedClass.value) {
    return {
      text: 'Asistente',
      icon: '👥',
      class: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
  } else if (hasAssistants.value) {
    return {
      text: 'Principal',
      icon: '👑',
      class: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    };
  } else {
    return {
      text: 'Titular',
      icon: '🎓',
      class: 'bg-green-100 text-green-800 border border-green-200'
    };
  }
});

// Formatear horarios para mostrar
const formatSchedule = computed(() => {
  if (props.classData.horarios && props.classData.horarios.length > 0) {
    return props.classData.horarios.map(h => 
      `${h.day}: ${h.startTime} - ${h.endTime}`
    ).join(', ');
  }
  if (props.classData.startTime && props.classData.endTime) {
    return `${props.classData.startTime} - ${props.classData.endTime}`;
  }
  return 'Sin horario definido';
});
const hasCollaborators = computed(() => {
  return canShareClass.value && 
         props.classData.assistantTeachers && 
         props.classData.assistantTeachers.length > 0;
});

// Obtener lista de colaboradores para mostrar
const collaboratorsList = computed(() => {
  if (!hasCollaborators.value) return [];
  return props.classData.assistantTeachers?.map(teacher => teacher.name || 'Maestro') || [];
});

// Función para obtener el color del día
const getDayColor = computed(() => {
  if (!props.classData.schedule?.slots?.[0]?.day) {
    return {
      border: 'border-t-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-300',
      accent: 'accent-gray-500',
      shadow: 'shadow-gray-200'
    };
  }
  
  const day = props.classData.schedule.slots[0].day;
  const dayColors = {
    // Lunes - Azul
    'lunes': { border: 'border-t-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', accent: 'accent-blue-500', shadow: 'shadow-blue-200' },
    'lun': { border: 'border-t-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', accent: 'accent-blue-500', shadow: 'shadow-blue-200' },
    'monday': { border: 'border-t-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', accent: 'accent-blue-500', shadow: 'shadow-blue-200' },
    '1': { border: 'border-t-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', accent: 'accent-blue-500', shadow: 'shadow-blue-200' },
    
    // Martes - Verde
    'martes': { border: 'border-t-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', accent: 'accent-green-500', shadow: 'shadow-green-200' },
    'mar': { border: 'border-t-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', accent: 'accent-green-500', shadow: 'shadow-green-200' },
    'tuesday': { border: 'border-t-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', accent: 'accent-green-500', shadow: 'shadow-green-200' },
    '2': { border: 'border-t-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', accent: 'accent-green-500', shadow: 'shadow-green-200' },
    
    // Miércoles - Amarillo/Ámbar
    'miércoles': { border: 'border-t-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', accent: 'accent-amber-500', shadow: 'shadow-amber-200' },
    'miercoles': { border: 'border-t-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', accent: 'accent-amber-500', shadow: 'shadow-amber-200' },
    'mié': { border: 'border-t-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', accent: 'accent-amber-500', shadow: 'shadow-amber-200' },
    'wednesday': { border: 'border-t-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', accent: 'accent-amber-500', shadow: 'shadow-amber-200' },
    '3': { border: 'border-t-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', accent: 'accent-amber-500', shadow: 'shadow-amber-200' },
    
    // Jueves - Púrpura
    'jueves': { border: 'border-t-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', accent: 'accent-purple-500', shadow: 'shadow-purple-200' },
    'jue': { border: 'border-t-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', accent: 'accent-purple-500', shadow: 'shadow-purple-200' },
    'thursday': { border: 'border-t-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', accent: 'accent-purple-500', shadow: 'shadow-purple-200' },
    '4': { border: 'border-t-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', accent: 'accent-purple-500', shadow: 'shadow-purple-200' },
    
    // Viernes - Rosa
    'viernes': { border: 'border-t-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', accent: 'accent-pink-500', shadow: 'shadow-pink-200' },
    'vie': { border: 'border-t-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', accent: 'accent-pink-500', shadow: 'shadow-pink-200' },
    'friday': { border: 'border-t-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', accent: 'accent-pink-500', shadow: 'shadow-pink-200' },
    '5': { border: 'border-t-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', accent: 'accent-pink-500', shadow: 'shadow-pink-200' },
    
    // Sábado - Índigo
    'sábado': { border: 'border-t-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', accent: 'accent-indigo-500', shadow: 'shadow-indigo-200' },
    'sabado': { border: 'border-t-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', accent: 'accent-indigo-500', shadow: 'shadow-indigo-200' },
    'sáb': { border: 'border-t-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', accent: 'accent-indigo-500', shadow: 'shadow-indigo-200' },
    'saturday': { border: 'border-t-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', accent: 'accent-indigo-500', shadow: 'shadow-indigo-200' },
    '6': { border: 'border-t-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', accent: 'accent-indigo-500', shadow: 'shadow-indigo-200' },
    
    // Domingo - Rojo
    'domingo': { border: 'border-t-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', accent: 'accent-red-500', shadow: 'shadow-red-200' },
    'dom': { border: 'border-t-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', accent: 'accent-red-500', shadow: 'shadow-red-200' },
    'sunday': { border: 'border-t-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', accent: 'accent-red-500', shadow: 'shadow-red-200' },
    '0': { border: 'border-t-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', accent: 'accent-red-500', shadow: 'shadow-red-200' }
  };
  
  const normalizedDay = typeof day === 'string' ? day.toLowerCase().trim() : day.toString();
  return dayColors[normalizedDay] || { border: 'border-t-gray-400', bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', accent: 'accent-gray-500', shadow: 'shadow-gray-200' };
});

// Formatear nombre del día
const formatDayName = (day: string) => {
  const dayNames: Record<string, string> = {
    'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
    'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo'
  };
  return dayNames[day.toLowerCase()] || day;
};

// Formatear el horario de la clase
const formattedSchedule = computed(() => {
  if (!props.classData.schedule?.slots?.length) {
    return 'Sin horario definido';
  }
  
  const slot = props.classData.schedule.slots[0];
  const dayName = formatDayName(slot.day);
  return `${dayName} de ${slot.startTime} a ${slot.endTime}`;
});

// Obtener maestros disponibles para compartir
const availableTeachers = computed(() => {
  return teachersStore.teachers.filter(teacher => 
    teacher.id !== props.classData.teacherId // Excluir al maestro principal
  );
});

// Obtiene los tres primeros estudiantes para mostrar en la tarjeta
const topStudents = computed(() => {
  if (!hasStudentIds.value) return [];

  const result = [];
  const sliceLength = Math.min(3, props.classData.studentIds.length);
  
  for (let i = 0; i < sliceLength; i++) {
    const id = props.classData.studentIds[i];
    const student = studentsStore.getStudentById(id);
    
    if (student) {
      result.push(`${student.nombre || ''} ${student.apellido || ''}`.trim() || 'Sin nombre');
    } else {
      result.push(`Estudiante ${id}`);
    }
  }
  
  return result;
});

// Calcula el número de estudiantes adicionales
const additionalStudents = computed(() => {
  if (!hasStudentIds.value) return 0;
  return Math.max(0, props.classData.studentIds.length - 3);
});

// Obtiene todos los estudiantes para el modal
const allStudents = computed(() => {
  if (!hasStudentIds.value) return [];

  return props.classData.studentIds.map(id => {
    const student = studentsStore.getStudentById(id);
    return {
      id: student?.id || id,
      name: student ? `${student.nombre || ''} ${student.apellido || ''}`.trim() : `Estudiante ${id}`,
      instrument: student?.instrumento || 'No especificado',
      age: student?.edad || 'N/A'
    };  });
});

// Manejadores de eventos
const handleView = () => {
  try {
    // Obtener información de rol de usuario desde localStorage o del store de autenticación
    let userRole;
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userRole = userData.role;
      }
    } catch (e) {
      console.warn('No se pudo obtener el rol de usuario desde localStorage');
    }
    
    // Si es maestro, utilizar la ruta específica para evitar problemas
    if (userRole === 'Maestro') {
      router.push({
        name: 'TeacherClassDetail',
        params: { id: props.classData.id }
      }).catch(error => {
        console.error('Error al navegar a vista de maestro:', error);
        // Como fallback, emitir el evento original
        emit('view', props.classData.id);
      });
    } else {
      // Para directores y admin, usar la vista regular de clase
      router.push({
        name: 'ClassDetail',
        params: { id: props.classData.id }
      }).catch(error => {
        console.error('Error al navegar a vista general:', error);
        // Como fallback, emitir el evento original
        emit('view', props.classData.id);
      });
    }
  } catch (error) {
    console.error('Error al manejar navegación:', error);
    // En caso de cualquier error, usar el método de emisión de evento
    emit('view', props.classData.id);
  }
};

const handleEdit = () => emit('edit', props.classData.id);
const handleDelete = () => emit('delete', props.classData.id);
const handleManageStudents = () => emit('manage-students', props.classData.id);

const handleTakeAttendance = () => {
  // Verificar permisos antes de proceder
  if (isSharedClass.value && !myPermissions.value.canTakeAttendance) {
    console.warn('No tienes permisos para tomar asistencia en esta clase');
    return;
  }
  
  const today = new Date();
  const dateString = format(today, 'yyyyMMdd');
  
  router.push({
    name: 'AttendanceList',
    params: {
      classId: props.classData.id,
      date: dateString
    }
  });
};

const handleViewHistory = () => {
  emit('view-history', props.classData.id);
};

// Mostrar modal de estudiantes
const handleShowStudents = () => {
  showStudentsModal.value = true;
};

// Función para generar PDF de la clase
const handlePrintClass = async () => {
  try {
    const doc = new jsPDF();
    
    // Título principal
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Reporte de Clase', 20, 30);
    
    // Información básica de la clase
    doc.setFontSize(16);
    doc.text(`Clase: ${props.classData.name}`, 20, 50);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Descripción: ${props.classData.description || 'Sin descripción'}`, 20, 65);
    
    // Obtener información del maestro
    const teacher = teachersStore.getTeacherById(props.classData.teacherId);
    doc.text(`Maestro: ${teacher?.name || 'No asignado'}`, 20, 80);
    
    doc.text(`Horario: ${formattedSchedule.value}`, 20, 95);
    doc.text(`Salón: ${props.classData.classroom || 'Sin asignar'}`, 20, 110);
    doc.text(`Total de estudiantes: ${hasStudentIds.value ? props.classData.studentIds.length : 0}`, 20, 125);
    
    // Lista de estudiantes en tabla
    if (hasStudentIds.value && props.classData.studentIds.length > 0) {
      const studentRows = [];
      
      for (const studentId of props.classData.studentIds) {
        const student = studentsStore.getStudentById(studentId);
        if (student) {
          studentRows.push([
            student.id || studentId,
            `${student.nombre || ''} ${student.apellido || ''}`.trim() || 'Sin nombre',
            student.edad || 'N/A',
            student.phone || 'Sin teléfono'
          ]);
        }
      }
      
      // Añadir tabla con autoTable
      (doc as any).autoTable({
        head: [['ID', 'Nombre Completo', 'Edad', 'Teléfono']],
        body: studentRows,
        startY: 140,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Añadir fecha de generación
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm');
    doc.setFontSize(8);
    doc.text(`Generado el: ${currentDate}`, 20, doc.internal.pageSize.height - 20);
    
    // Guardar el PDF
    const fileName = `Clase_${props.classData.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
  }
};

// Manejar compartir clase
const handleShare = () => {
  showShareModal.value = true;
};

const selectTeacher = (teacherId: string) => {
  selectedTeacherId.value = teacherId;
  showShareModal.value = false;
  showPermissionsModal.value = true;
};

const confirmShare = async () => {
  if (!selectedTeacherId.value) return;
  
  isLoading.value = true;
  try {
    await inviteAssistant({
      classId: props.classData.id,
      teacherId: selectedTeacherId.value,
      permissions: assistantPermissions.value
    });
    
    showPermissionsModal.value = false;
    selectedTeacherId.value = '';
    
    alert('Maestro asistente invitado exitosamente');
  } catch (error) {
    console.error('Error inviting teacher:', error);
    alert('Error al invitar maestro asistente');
  } finally {
    isLoading.value = false;
  }
};

const cancelShare = () => {
  showPermissionsModal.value = false;
  showShareModal.value = false;
  selectedTeacherId.value = '';
};

// Manejar invitación enviada
const handleInvitationSent = () => {
  // Opcional: Actualizar el estado local o mostrar confirmación
  console.log('Invitación enviada correctamente');
};

// Manejar abandono de colaboración (maestro asistente)
const handleLeaveCollaboration = async () => {
  if (!confirm('¿Estás seguro de que quieres abandonar esta colaboración?')) {
    return;
  }

  isLoading.value = true;
  try {
    const { removeAssistant } = useTeacherCollaboration();
    await removeAssistant(props.classData.id, authStore.user?.uid || '');
    
    alert('Has abandonado la colaboración exitosamente');
    
    // Emitir evento para que el padre actualice la lista
    emit('collaboration-updated');
  } catch (error) {
    console.error('Error abandonando colaboración:', error);
    alert('Error al abandonar la colaboración');
  } finally {
    isLoading.value = false;
  }
};

// Remover colaborador (maestro principal)
const removeCollaborator = async (teacherId: string) => {
  if (!confirm('¿Estás seguro de que quieres remover este colaborador?')) {
    return;
  }

  isLoading.value = true;
  try {
    const { removeAssistant } = useTeacherCollaboration();
    await removeAssistant(props.classData.id, teacherId);
    
    alert('Colaborador removido exitosamente');
    showManageCollaboratorsModal.value = false;
    
    // Emitir evento para que el padre actualice la lista
    emit('collaboration-updated');
  } catch (error) {
    console.error('Error removiendo colaborador:', error);
    alert('Error al remover colaborador');
  } finally {
    isLoading.value = false;
  }
};

// Cargar datos al montar
onMounted(async () => {
  if (!studentsStore.students.length) {
    await studentsStore.fetchStudents();
  }
  if (!teachersStore.teachers.length) {
    await teachersStore.fetchTeachers();
  }
});
</script>

<template>  <div 
    :class="[
      'relative bg-white dark:bg-gray-800 rounded-xl shadow-md transition-all duration-500 overflow-visible border-t-4 teacher-class-card',
      getDayColor.border,
      getDayColor.shadow,
      viewMode === 'list' ? 'flex items-center p-4 space-x-4 mb-2 list-view-card' : ''
    ]"
  >
    <!-- Vista de Lista -->
    <template v-if="viewMode === 'list'">
      <!-- Indicador de día (banda lateral izquierda) -->
      <div :class="['w-1 h-full rounded-full', getDayColor.bg]"></div>
        <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center min-w-0">
        <!-- Información básica -->
        <div class="sm:col-span-1 lg:col-span-2 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {{ classData.name }}
            </h3>
            <span :class="['px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0', getDayColor.bg, getDayColor.text]">
              {{ formatDayName(props.classData.schedule?.slots?.[0]?.day || '') }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
            {{ classData.description || 'Sin descripción' }}
          </p>
        </div>
        
        <!-- Horario -->
        <div class="sm:col-span-1 lg:col-span-1">
          <div class="flex items-center text-gray-600 dark:text-gray-400">
            <ClockIcon class="h-4 w-4 mr-2 flex-shrink-0" />
            <span class="text-sm font-medium truncate">{{ formattedSchedule }}</span>
          </div>
        </div>
        
        <!-- Salón -->
        <div class="sm:col-span-1 lg:col-span-1">
          <div class="flex items-center text-gray-600 dark:text-gray-400">
            <BuildingOfficeIcon class="h-4 w-4 mr-2 flex-shrink-0" />
            <span class="text-sm truncate">{{ classData.classroom || 'Sin salón' }}</span>
          </div>
        </div>
        
        <!-- Estudiantes -->
        <div class="sm:col-span-1 lg:col-span-1">
          <div class="flex items-center text-gray-600 dark:text-gray-400">
            <UserGroupIcon class="h-4 w-4 mr-2 flex-shrink-0" />
            <span class="text-sm font-medium whitespace-nowrap">{{ hasStudentIds ? classData.studentIds.length : 0 }} estudiantes</span>
          </div>
        </div>
        
        <!-- Badges adicionales para clases compartidas -->
        <div class="sm:col-span-2 lg:col-span-1 flex gap-1">
          <!-- Badge para clase compartida (maestro asistente) -->
          <span 
            v-if="isSharedClass" 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
            title="Eres maestro asistente en esta clase"
          >
            Asistente
          </span>
          
          <!-- Badge para clase con colaboradores (maestro principal) -->
          <span 
            v-else-if="hasCollaborators" 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            title="Esta clase tiene maestros colaboradores"
          >
            Colaborativa
          </span>
        </div>
      </div>
        <!-- Acciones (vista lista) -->
      <div class="flex items-center space-x-2">        <!-- Menú hamburguesa -->
        <Menu as="div" class="relative menu-container">
          <MenuButton class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <EllipsisVerticalIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </MenuButton>
          
          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >            <MenuItems class="menu-dropdown absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-600">
              <div class="py-1">
                <MenuItem v-if="canShareClass" v-slot="{ active }">
                  <button
                    @click="handleShare"
                    :class="[
                      active ? 'bg-gray-50 dark:bg-gray-700' : '',
                      'group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full text-left'
                    ]"
                  >
                    <ShareIcon class="mr-3 h-4 w-4" />
                    Compartir
                  </button>
                </MenuItem>
                
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleView"
                    :class="[
                      active ? 'bg-gray-50 dark:bg-gray-700' : '',
                      'group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full text-left'
                    ]"
                  >
                    <EyeIcon class="mr-3 h-4 w-4" />
                    Ver clase
                  </button>
                </MenuItem>
                
                <MenuItem v-if="!isSharedClass || myPermissions.canEditClass" v-slot="{ active }">
                  <button
                    @click="handleEdit"
                    :class="[
                      active ? 'bg-gray-50 dark:bg-gray-700' : '',
                      'group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full text-left'
                    ]"
                  >
                    <PencilIcon class="mr-3 h-4 w-4" />
                    Editar clase
                  </button>
                </MenuItem>
                
                <MenuItem v-if="canShareClass" v-slot="{ active }">
                  <button
                    @click="handleDelete"
                    :class="[
                      active ? 'bg-red-50 dark:bg-red-900/20' : '',
                      'group flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 w-full text-left'
                    ]"
                  >
                    <TrashIcon class="mr-3 h-4 w-4" />
                    Eliminar clase
                  </button>                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>        <!-- Botones de acción rápida -->
        <button
          v-if="!isSharedClass || myPermissions.canManageStudents"
          @click="handleManageStudents"
          class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          title="Gestionar Alumnos"
        >
          <UserPlusIcon class="h-4 w-4" />
        </button>
        
        <button
          v-if="!isSharedClass || myPermissions.canTakeAttendance"
          @click="handleTakeAttendance"
          class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
          title="Tomar Asistencia"
        >
          <ClipboardDocumentCheckIcon class="h-4 w-4" />
        </button>
        
        <button
          v-if="!isSharedClass || myPermissions.canViewAttendanceHistory"
          @click="handleViewHistory"
          class="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
          title="Historial"
        >
          <DocumentTextIcon class="h-4 w-4" />
        </button>
      </div>
    </template>

    <!-- Vista de Tarjeta -->
    <template v-else>
      <!-- Capa decorativa con gradiente sutil -->
      <div class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] dark:to-white/[0.02] pointer-events-none"></div>
        <!-- Header con menú hamburguesa -->
      <div class="relative flex justify-between items-start p-6 pb-3">        <div class="flex-1 pr-4">
          <!-- Badge del día con animación y badge de clase compartida -->
          <div class="flex items-center gap-3 mb-3">
            <span :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300',
              'ring-1 ring-inset',
              getDayColor.bg,
              getDayColor.text,
              'hover:scale-105 cursor-default'
            ]">
              <MusicalNoteIcon class="w-3 h-3 mr-1.5 animate-pulse" />
              {{ formatDayName(props.classData.schedule?.slots?.[0]?.day || '') }}
            </span>
              <!-- Badge para clase compartida (maestro asistente) -->
            <span 
              v-if="isSharedClass"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 ring-1 ring-orange-500/20"
              title="Eres maestro asistente en esta clase"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Asistente
            </span>

            <!-- Badge para clase con colaboradores (maestro principal) -->
            <span 
              v-if="hasCollaborators"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 ring-1 ring-blue-500/20"
              title="Esta clase tiene maestros colaboradores"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Colaborativa
            </span>
          </div>
          
          <!-- Título mejorado -->
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {{ classData.name }}
          </h3>
            <!-- Información del maestro principal para clases compartidas -->
          <div v-if="isSharedClass" class="mb-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              <span class="font-medium">Maestro Principal:</span> {{ leadTeacherName }}
            </p>
          </div>

          <!-- Información de colaboradores para clases principales -->
          <div v-if="hasCollaborators" class="mb-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              <span class="font-medium">Colaboradores:</span> 
              <span class="text-blue-600 dark:text-blue-400">
                {{ collaboratorsList.slice(0, 2).join(', ') }}
                <span v-if="collaboratorsList.length > 2">
                  y {{ collaboratorsList.length - 2 }} más
                </span>
              </span>
            </p>
          </div>
          
          <!-- Subtítulo/Descripción mejorado --><p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
            {{ classData.description || 'Sin descripción disponible' }}
          </p>
        </div>
        
        <!-- Menú hamburguesa mejorado -->
        <Menu as="div" class="relative z-10">
          <MenuButton class="group p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 hover:rotate-90">
            <EllipsisVerticalIcon class="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
          </MenuButton>
          
          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems class="absolute right-0 z-30 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">              <div class="p-1">                
                <!-- Compartir clase - solo para maestros principales -->
                <MenuItem v-if="canShareClass" v-slot="{ active }">
                  <button
                    @click="handleShare"
                    :class="[
                      active ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300',
                      'group flex items-center px-4 py-3 text-sm font-medium w-full text-left rounded-lg transition-all duration-200 hover:scale-[1.02]'
                    ]"
                  >
                    <ShareIcon class="mr-3 h-4 w-4 transition-transform group-hover:rotate-12" />
                    Compartir clase
                  </button>
                </MenuItem>

                <!-- Gestionar colaboradores - solo para maestros principales con colaboradores -->
                <MenuItem v-if="hasCollaborators" v-slot="{ active }">
                  <button
                    @click="showManageCollaboratorsModal = true"
                    :class="[
                      active ? 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300',
                      'group flex items-center px-4 py-3 text-sm font-medium w-full text-left rounded-lg transition-all duration-200 hover:scale-[1.02]'
                    ]"
                  >
                    <UserGroupIcon class="mr-3 h-4 w-4 transition-transform group-hover:rotate-12" />
                    Gestionar colaboradores
                  </button>
                </MenuItem>

                <!-- Abandonar colaboración - solo para maestros asistentes -->
                <MenuItem v-if="isSharedClass" v-slot="{ active }">
                  <button
                    @click="handleLeaveCollaboration"
                    :class="[
                      active ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300',
                      'group flex items-center px-4 py-3 text-sm font-medium w-full text-left rounded-lg transition-all duration-200 hover:scale-[1.02]'
                    ]"
                  >
                    <XMarkIcon class="mr-3 h-4 w-4 transition-transform group-hover:rotate-12" />
                    Abandonar colaboración
                  </button>
                </MenuItem>

                <div v-if="canShareClass || isSharedClass" class="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleEdit"
                    :class="[
                      active ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300',
                      'group flex items-center px-4 py-3 text-sm font-medium w-full text-left rounded-lg transition-all duration-200 hover:scale-[1.02]'
                    ]"
                  >
                    <PencilIcon class="mr-3 h-4 w-4 transition-transform group-hover:rotate-12" />
                    Editar clase
                  </button>
                </MenuItem>
                
                <div class="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleDelete"
                    :class="[
                      active ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400',
                      'group flex items-center px-4 py-3 text-sm font-medium w-full text-left rounded-lg transition-all duration-200 hover:scale-[1.02]'
                    ]"
                  >
                    <TrashIcon class="mr-3 h-4 w-4 transition-transform group-hover:rotate-12" />
                    Eliminar clase
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>      <!-- Cuerpo de la card mejorado -->
      <div class="px-6 pb-4 space-y-4">
        <!-- Grid de información principal -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Horarios -->
          <div class="flex items-center text-gray-600 dark:text-gray-400 group/item hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <div :class="['flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all group-hover/item:scale-110', getDayColor.bg]">
              <ClockIcon class="h-4 w-4" />
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"> </div>
              <span class="text-sm font-medium">{{ formattedSchedule }}</span>
            </div>
          </div>

          <!-- Salón -->
          <div class="flex items-center text-gray-600 dark:text-gray-400 group/item hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <div :class="['flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all group-hover/item:scale-110', getDayColor.bg]">
              <BuildingOfficeIcon class="h-4 w-4" />
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"></div>
              <span class="text-sm font-medium">{{ classData.classroom || 'Sin asignar' }}</span>
            </div>
          </div>
        </div>

        <!-- Separador decorativo -->
        <div class="flex items-center my-4">
          <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
          <MusicalNoteIcon class="w-4 h-4 mx-4 text-gray-400 dark:text-gray-500" />
          <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
        </div>        <!-- Total de estudiantes con indicador visual (clickeable) -->        <button
          @click="handleShowStudents"
          class="w-full flex items-center justify-between p-3 rounded-xl
           bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 
           dark:to-gray-600/50 border border-gray-200/50 dark:border-gray-600/50 
           hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 
           dark:hover:to-blue-800/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 group/students cursor-pointer"
          title="Ver lista de estudiantes"
          style="pointer-events: auto; position: relative; z-index: 5;"
        >
          <div class="flex items-center">
            <div :class="['flex items-center justify-center w-10 h-10 rounded-full mr-3 ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover/students:scale-110 transition-transform', getDayColor.bg]">
              <UserGroupIcon class="h-5 w-5" />
            </div>
            <div class="text-left">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estudiantes</div>
              <span class="text-lg font-bold text-gray-900 dark:text-white">{{ hasStudentIds ? classData.studentIds.length : 0 }}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
              <div class="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
              Lista completa
            </div>
          </div>
        </button><!-- Lista de estudiantes mejorada -->
       
      </div>      <!-- Footer con botones de acción mejorados (solo iconos) -->
      <div class="px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-700/30 dark:via-gray-800/50 dark:to-gray-700/30 border-t border-gray-100 dark:border-gray-700/50">
        <div class="flex justify-center space-x-4">          <button
            @click="handleView"
            class="action-button group flex items-center justify-center w-12 h-12 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            title="Ver Detalles"
            style="pointer-events: auto; position: relative; z-index: 10;"
          >
            <EyeIcon class="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            @click="handleManageStudents"
            class="action-button group flex items-center justify-center w-12 h-12 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            title="Gestionar Estudiantes"
            style="pointer-events: auto; position: relative; z-index: 10;"
          >
            <UserPlusIcon class="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </button>
          
          <button
            @click="handleTakeAttendance"
            class="action-button group flex items-center justify-center w-12 h-12 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            title="Tomar Asistencia"
            style="pointer-events: auto; position: relative; z-index: 10;"
          >
            <ClipboardDocumentCheckIcon class="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </button>
          
          <button
            @click="handleViewHistory"
            class="action-button group flex items-center justify-center w-12 h-12 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            title="Ver Historial"
            style="pointer-events: auto; position: relative; z-index: 10;"
          >
            <DocumentTextIcon class="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </button>

          <!-- Botón de compartir clase (solo para maestros principales) -->
          <button
            v-if="canShareClass"
            @click="showShareModal = true"
            class="action-button group flex items-center justify-center w-12 h-12 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            title="Compartir Clase"
            style="pointer-events: auto; position: relative; z-index: 10;"
          >
            <ShareIcon class="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </button>
          
          <button
            @click="handlePrintClass"
            class="action-button group flex items-center justify-center w-12 h-12 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            title="Imprimir Reporte"
            style="pointer-events: auto; position: relative; z-index: 10;"
          >
            <PrinterIcon class="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>
    </template>

    <!-- Modal de estudiantes -->
    <TransitionRoot appear :show="showStudentsModal" as="template">
      <Dialog as="div" @close="showStudentsModal = false" class="relative z-50">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                  Lista de Estudiantes - {{ classData.name }}
                </DialogTitle>
                
                <div class="space-y-3 max-h-64 overflow-y-auto">
                  <div
                    v-for="student in allStudents"
                    :key="student.id"
                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">{{ student.name }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ student.instrument }}</div>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">{{ student.age }} años</span>
                  </div>
                </div>

                <div class="mt-4 flex justify-end">
                  <button
                    @click="showStudentsModal = false"
                    class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cerrar
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Modal para compartir clase -->
    <TransitionRoot appear :show="showShareModal" as="template">
      <Dialog as="div" @close="showShareModal = false" class="relative z-50">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                  Seleccionar Maestro Asistente
                </DialogTitle>
                
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  <button
                    v-for="teacher in availableTeachers"
                    :key="teacher.id"
                    @click="selectTeacher(teacher.id)"
                    class="w-full p-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div class="font-medium text-gray-900 dark:text-white">{{ teacher.name }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ teacher.email || 'Sin email' }}</div>
                  </button>
                </div>

                <div class="mt-4 flex justify-end space-x-3">
                  <button
                    @click="showShareModal = false"
                    class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancelar
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Modal para configurar permisos -->
    <TransitionRoot appear :show="showPermissionsModal" as="template">
      <Dialog as="div" @close="cancelShare" class="relative z-50">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                  Configurar Permisos
                </DialogTitle>
                
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tomar asistencia
                    </label>
                    <input
                      v-model="assistantPermissions.canTakeAttendance"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Agregar observaciones
                    </label>
                    <input
                      v-model="assistantPermissions.canAddObservations"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ver historial de asistencia
                    </label>
                    <input
                      v-model="assistantPermissions.canViewAttendanceHistory"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div class="mt-6 flex justify-end space-x-3">
                  <button
                    @click="cancelShare"
                    class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    @click="confirmShare"
                    :disabled="isLoading"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
                  >
                    {{ isLoading ? 'Invitando...' : 'Invitar' }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>        </div>
      </Dialog>
    </TransitionRoot>    <!-- Modal de compartir clase -->
    <ShareClassModal
      :show="showShareModal"
      :class-data="{
        id: classData.id,
        name: classData.name,
        teacherId: classData.teacherId
      }"
      @close="showShareModal = false"
      @invitation-sent="handleInvitationSent"
    />

    <!-- Modal de gestionar colaboradores -->
    <TransitionRoot appear :show="showManageCollaboratorsModal" as="template">
      <Dialog as="div" @close="showManageCollaboratorsModal = false" class="relative z-50">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                  Gestionar Colaboradores: {{ classData.name }}
                </DialogTitle>

                <div v-if="hasCollaborators" class="space-y-3">
                  <div
                    v-for="teacher in classData.assistantTeachers"
                    :key="teacher.teacherId"
                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ teacher.name || 'Maestro' }}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Permisos: 
                        {{ teacher.permissions?.canTakeAttendance ? 'Asistencia' : '' }}
                        {{ teacher.permissions?.canAddObservations ? ', Observaciones' : '' }}
                      </p>
                    </div>
                    <button
                      @click="removeCollaborator(teacher.teacherId)"
                      class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Remover colaborador"
                    >
                      <XMarkIcon class="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div v-else class="text-center py-4">
                  <p class="text-gray-500 dark:text-gray-400">No hay colaboradores en esta clase.</p>
                </div>

                <div class="mt-6 flex justify-end">
                  <button
                    type="button"
                    class="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    @click="showManageCollaboratorsModal = false"
                  >
                    Cerrar
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<style scoped>
/* Custom scrollbar para la lista de estudiantes */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgb(241 245 249);
  border-radius: 2px;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgb(55 65 81);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(148 163 184);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(100 116 139);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(75 85 99);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(107 114 128);
}

/* Responsive adjustments mejorados */
@media (max-width: 640px) {
  .text-sm {
    font-size: 0.8125rem;
    line-height: 1.25rem;
  }
  .text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
  .text-xl {
    font-size: 1.125rem;
    line-height: 1.5rem;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .text-xs {
    font-size: 0.7rem;
    line-height: 1rem;
  }
  .text-sm {
    font-size: 0.8rem;
    line-height: 1.2rem;
  }
  .text-xl {
    font-size: 1.25rem;
    line-height: 1.6rem;
  }
}

/* Asegurar que todos los botones de acción sean clickeables */
.action-button {
  pointer-events: auto !important;
  position: relative;
  z-index: 10;
}

.action-button:hover {
  cursor: pointer !important;
}

/* Animación para los badges del día */
@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Efecto hover mejorado para las cards */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

.group:hover .group-hover\:rotate-12 {
  transform: rotate(12deg);
}

/* Line clamp utility para la descripción */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Transiciones suaves para estados de hover */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Grid responsive mejorado */
@media (max-width: 640px) {
  .grid-cols-1.sm\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .grid-cols-1.sm\:grid-cols-3 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

@media (min-width: 640px) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .sm\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Mejora visual para los indicadores de estado */
.animate-pulse-subtle {
  animation: pulse-glow 3s ease-in-out infinite;
}

/* Hover effects para elementos interactivos */
.hover\:scale-\[1\.02\]:hover {
  transform: scale(1.02);
}

.hover\:scale-\[1\.03\]:hover {
  transform: scale(1.03);
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}

.hover\:-translate-y-1:hover {
  transform: translateY(-0.25rem);
}

/* Transiciones más suaves para elementos específicos */
.group\/item:hover .group-hover\/item\:scale-110 {
  transform: scale(1.1);
}

.group\/expand:hover .group-hover\/expand\:rotate-180 {
  transform: rotate(180deg);
}

.group\/expand:hover .group-hover\/expand\:text-gray-700 {
  color: rgb(55 65 81);
}

.dark .group\/expand:hover .group-hover\/expand\:text-gray-300 {
  color: rgb(209 213 219);
}

/* Contenedor del menú con aislamiento */
.menu-container {
  isolation: isolate;
  z-index: 200;
}

/* Dropdown del menú con z-index máximo */
.menu-dropdown {
  z-index: 99999 !important;
  position: absolute !important;
  isolation: isolate;
}

/* Estilos específicos para vista de lista y menús */
.list-view-card {
  position: relative;
  z-index: 1;
}

.list-view-card:hover {
  z-index: 100;
}

.list-view-card .menu-container {
  z-index: 300;
}

.list-view-card .menu-dropdown {
  z-index: 99999 !important;
}

/* Asegurar que los menús siempre estén en la parte superior */
.teacher-class-card [role="menu"] {
  position: absolute !important;
  z-index: 99999 !important;
  isolation: isolate;
  transform: translateZ(0); /* Forzar aceleración de hardware */
}

/* Prevenir que otros elementos interfieran con los menús */
.teacher-class-card .relative {
  isolation: isolate;
}

/* Mejorar la visibilidad de los menús en vista lista */
.list-view-card [role="menu"] {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
  backdrop-filter: blur(10px);
}

.dark .list-view-card [role="menu"] {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
}
</style>
