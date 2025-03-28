<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/vue/24/outline';
import { useStudentsStore } from '../../../modulos/Students/store/students';
import { format } from 'date-fns';

// Interface for schedule slot
interface ScheduleSlot {
    day: number;
    startTime: string;
    endTime: string;
}

// Interface for class schedule
interface ClassSchedule {
    slots: ScheduleSlot[];
}

const props = defineProps({
  classData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view', 'edit', 'delete', 'manage-students']);

// Uso del store de estudiantes para obtener nombres
const studentsStore = useStudentsStore();

// Router para redireccionar a la página de asistencia
const router = useRouter();

// Verifica si hay un array de estudiantes
const hasStudents = computed(() => {
  return Array.isArray(props.classData.studentIds) && props.classData.studentIds.length > 0;
});

// Obtiene los nombres de los estudiantes de forma segura
const studentDisplayNames = computed(() => {
  if (!hasStudents.value) return [];
  
  // Lista de hasta 3 estudiantes
  const result = [];
  const limit = Math.min(3, props.classData.studentIds.length);
  
  for (let i = 0; i < limit; i++) {
    try {
      const id = props.classData.studentIds[i];
      if (!id) continue;
      
      const student = studentsStore.getStudentById(String(id));
      if (student && student.nombre) {
        result.push(`${student.nombre} ${student.apellido || ''}`.trim());
      } else {
        result.push('Estudiante desconocido');
      }
    } catch (err) {
      result.push('Error al cargar estudiante');
    }
  }
  
  return result;
});

// Calcula el número de estudiantes adicionales
const additionalStudents = computed(() => {
  if (!hasStudents.value) return 0;
  return Math.max(0, props.classData.studentIds.length - 3);
});

// Cuenta de estudiantes segura
const studentCount = computed(() => {
  if (!hasStudents.value) return 0;
  return props.classData.studentIds.length;
});

// Parse para día de la semana
const parseDay = (day) => {
  if (day === undefined || day === null) return 1;
  
  if (typeof day === 'number' && day >= 0 && day <= 6) {
    return day;
  }
  
  if (typeof day === 'string') {
    const dayNum = parseInt(day, 10);
    if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
      return dayNum;
    }
    
    const dayLower = day.toLowerCase();
    const dayMap = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 
      'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6,
      'dom': 0, 'lun': 1, 'mar': 2, 'mié': 3, 'mie': 3, 
      'jue': 4, 'vie': 5, 'sáb': 6, 'sab': 6
    };
    
    if (dayMap[dayLower] !== undefined) {
      return dayMap[dayLower];
    }
  }
  
  return 1;
};

// Formatea los horarios de clase para mostrar en la tarjeta
const formatSchedule = computed(() => {
  try {
    const hasValidSchedule = 
      props.classData.schedule && 
      Array.isArray(props.classData.schedule.slots) && 
      props.classData.schedule.slots.length > 0;
      
    if (!hasValidSchedule) {
      return 'Sin horario asignado';
    }

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return props.classData.schedule.slots.map(slot => {
      const dayIndex = parseDay(slot.day);
      return `${dayNames[dayIndex]} ${slot.startTime}-${slot.endTime}`;
    }).join(', ');
  } catch (error) {
    console.error('Error al formatear horario:', error);
    return 'Error al cargar horario';
  }
});

// Manejadores de eventos
const handleView = () => {
  emit('view', props.classData.id);
};

const handleEdit = (e) => {
  e.stopPropagation();
  emit('edit', props.classData.id);
};

const handleDelete = (e) => {
  e.stopPropagation();
  emit('delete', props.classData.id);
};

const handleManageStudents = (e) => {
  e.stopPropagation();
  emit('manage-students', props.classData.id);
};

// Función para gestionar la redirección a la toma de asistencia
const handleAttendance = (e) => {
  e.stopPropagation(); // Evitar que se active el evento del card
  
  // Obtener la fecha actual en formato YYYYMMDD para la URL
  const currentDate = format(new Date(), 'yyyyMMdd');
  
  // Redireccionar a la página de asistencia con la clase ya preseleccionada
  router.push(`/attendance/${currentDate}/${props.classData.id}`);
};
</script>

<template>
  <div 
    @click="handleView" 
    class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
  >
    <!-- Cabecera con color según nivel -->
    <div 
      class="h-2"
      :class="{
        'bg-green-500': classData.level === 'Básico',
        'bg-blue-500': classData.level === 'Intermedio',
        'bg-purple-500': classData.level === 'Avanzado',
        'bg-gray-500': !classData.level
      }"
    ></div>

    <div class="p-4">
      <!-- Nombre y nivel -->
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-medium text-gray-900 dark:text-white">{{ classData.name || 'Sin nombre' }}</h3>
          <span class="text-sm text-gray-600 dark:text-gray-400 block">
            {{ classData.level || 'Sin nivel' }}
            <span v-if="classData.instrument"> - {{ classData.instrument }}</span>
          </span>
        </div>
        <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
          {{ studentCount }} estudiantes
        </span>
      </div>

      <!-- Información adicional -->
      <div class="space-y-2 mb-4">
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <CalendarIcon class="h-4 w-4 mr-2" />
          <span>{{ formatSchedule }}</span>
        </div>
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPinIcon class="h-4 w-4 mr-2" />
          <span>{{ classData.classroom || 'Sin aula asignada' }}</span>
        </div>
      </div>

      <!-- Lista de estudiantes -->
      <div class="mb-3">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Estudiantes:</div>
        <div v-if="hasStudents" class="space-y-1">
          <div 
            v-for="(student, index) in studentDisplayNames" 
            :key="index" 
            class="flex items-center text-sm text-gray-700 dark:text-gray-300"
          >
            <UserGroupIcon class="h-3 w-3 mr-2 text-gray-500" />
            <span class="truncate">{{ student }}</span>
          </div>
          <div v-if="additionalStudents > 0" class="text-xs text-gray-500 dark:text-gray-400">
            Y {{ additionalStudents }} estudiante(s) más...
          </div>
        </div>
        <div v-else class="text-sm text-gray-500 dark:text-gray-400">
          No hay estudiantes inscritos
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button 
          @click="handleAttendance" 
          class="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-md"
          title="Tomar Asistencia"
        >
          <ClipboardDocumentCheckIcon class="h-5 w-5" />
        </button>
        <button 
          @click="handleManageStudents" 
          class="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md"
          title="Gestionar estudiantes"
        >
          <UserPlusIcon class="h-5 w-5" />
        </button>
        <button 
          @click="handleEdit" 
          class="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
          title="Editar clase"
        >
          <PencilIcon class="h-5 w-5" />
        </button>
        <button 
          @click="handleDelete" 
          class="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md"
          title="Eliminar clase"
        >
          <TrashIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>
