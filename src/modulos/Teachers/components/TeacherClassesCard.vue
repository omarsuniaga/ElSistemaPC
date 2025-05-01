<script setup lang="ts">
// ../modulos/Teacher/components/TeacheClassesCard.vue
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  EyeIcon,
  MusicalNoteIcon
} from '@heroicons/vue/24/outline';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { useStudentsStore } from '../../../modulos/Students/store/students';
import { format } from 'date-fns';

const props = defineProps({
  classData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view', 'edit', 'delete', 'manage-students']);

// Referencia local para almacenar información de depuración
const debugInfo = ref({
  loaded: false,
  studentsCount: 0,
  foundStudents: 0,
  error: null as null | string
});

// Estado para el modal de estudiantes
const showStudentsModal = ref(false);

// Uso del store de estudiantes para obtener nombres
const studentsStore = useStudentsStore();

// Router para la navegación
const router = useRouter();

// Verificación segura para validar studentIds
const hasStudentIds = computed(() => {
  return Array.isArray(props.classData.studentIds) && props.classData.studentIds.length > 0;
});

// Obtiene los tres primeros estudiantes para mostrar en la tarjeta
const topStudents = computed(() => {
  if (!hasStudentIds.value) {
    return [];
  }

  const result = [];
  const sliceLength = Math.min(3, props.classData.studentIds.length);
  let foundStudents = 0;
  
  for (let i = 0; i < sliceLength; i++) {
    try {
      const id = props.classData.studentIds[i];
      if (!id) continue;
      
      const student = studentsStore.getStudentById(id);
      if (student) {
        foundStudents++;
        result.push(student.nombre ? `${student.nombre} ${student.apellido || ''}`.trim() : 'Nombre no disponible');
      } else {
        result.push(`Estudiante ID: ${id}`);
      }
    } catch (error) {
      console.error('Error procesando estudiante:', error);
      result.push('Error al cargar estudiante');
    }
  }
  
  // Actualizar información de depuración
  debugInfo.value.foundStudents = foundStudents;
  
  return result;
});

// Calcula el número de estudiantes adicionales que no se muestran en la tarjeta
const additionalStudents = computed(() => {
  if (!hasStudentIds.value) return 0;
  return Math.max(0, props.classData.studentIds.length - 3);
});

// Obtiene todos los estudiantes para mostrar en el modal
const allStudents = computed(() => {
  if (!hasStudentIds.value) {
    return [];
  }

  const result = [];
  
  for (let i = 0; i < props.classData.studentIds.length; i++) {
    try {
      const id = props.classData.studentIds[i];
      if (!id) continue;
      
      const student = studentsStore.getStudentById(id);
      if (student) {
        // Asegurar que se muestre nombre y apellido completos
        if (student.nombre || student.apellido) {
          result.push({
            id: student.id,
            name: `${student.nombre || ''} ${student.apellido || ''}`.trim(),
            instrument: student.instrumento || 'No especificado',
            age: student.edad || 'N/A'
          });
        } else {
          result.push({
            id: id,
            name: 'Estudiante sin nombre',
            instrument: 'No especificado',
            age: 'N/A'
          });
        }
      } else {
        result.push({
          id: id,
          name: `Estudiante ID: ${id}`,
          instrument: 'No disponible',
          age: 'N/A'
        });
      }
    } catch (error) {
      console.error('Error procesando estudiante:', error);
      result.push({
        id: 'error',
        name: 'Error al cargar estudiante',
        instrument: 'No disponible',
        age: 'N/A'
      });
    }
  }
  
  return result;
});

// Función para obtener el orden del día de la semana (para ordenamiento)
const getDayOrder = (dayString) => {
  if (!dayString) return 7; // Si no hay día, se coloca al final
  
  const dayOrder = {
    'domingo': 7, 'dom': 7, 'sunday': 7, 'sun': 7, '0': 7,
    'lunes': 1, 'lun': 1, 'monday': 1, 'mon': 1, '1': 1,
    'martes': 2, 'mar': 2, 'tuesday': 2, 'tue': 2, '2': 2,
    'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3, 'wednesday': 3, 'wed': 3, '3': 3,
    'jueves': 4, 'jue': 4, 'thursday': 4, 'thu': 4, '4': 4,
    'viernes': 5, 'vie': 5, 'friday': 5, 'fri': 5, '5': 5,
    'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6, 'saturday': 6, 'sat': 6, '6': 6
  };
  
  // Normalizar e intentar mapear la cadena a un orden
  const normalizedDay = typeof dayString === 'string' 
    ? dayString.toLowerCase().trim() 
    : dayString.toString();
  
  return normalizedDay in dayOrder 
    ? dayOrder[normalizedDay] 
    : (typeof dayString === 'number' && dayString >= 0 && dayString <= 6 
        ? dayString + 1 // Para que domingo (0) sea 1 y así sucesivamente
        : 7); // Valor por defecto si no se puede determinar
};

// Computed property para obtener el orden del día de la clase actual
const currentClassDayOrder = computed(() => {
  const dayString = props.classData.schedule?.slots?.[0]?.day;
  return getDayOrder(dayString);
});

// Formatea los horarios de clase para mostrar en la tarjeta
const formatSchedule = computed(() => {
  if (!props.classData.schedule || !props.classData.schedule.slots || props.classData.schedule.slots.length === 0) {
    return 'Sin horario asignado';
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayMapping = {
    'domingo': 0, 'dom': 0, 'sunday': 0, 'sun': 0, '0': 0,
    'lunes': 1, 'lun': 1, 'monday': 1, 'mon': 1, '1': 1,
    'martes': 2, 'mar': 2, 'tuesday': 2, 'tue': 2, '2': 2,
    'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3, 'wednesday': 3, 'wed': 3, '3': 3,
    'jueves': 4, 'jue': 4, 'thursday': 4, 'thu': 4, '4': 4,
    'viernes': 5, 'vie': 5, 'friday': 5, 'fri': 5, '5': 5,
    'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6, 'saturday': 6, 'sat': 6, '6': 6
  };

  return props.classData.schedule.slots.map(slot => {
    // Intentar obtener el índice del día
    let dayIndex;
    
    if (typeof slot.day === 'number' && slot.day >= 0 && slot.day <= 6) {
      // Si el día es un número válido (0-6)
      dayIndex = slot.day;
    } else if (typeof slot.day === 'string') {
      // Normalizar e intentar mapear la cadena a un índice
      const normalizedDay = slot.day.toLowerCase().trim();
      
      // Verificar si está en nuestro mapeo
      if (normalizedDay in dayMapping) {
        dayIndex = dayMapping[normalizedDay as keyof typeof dayMapping];
      } else {
        // Intentar convertir a número como fallback
        const dayNum: number = parseInt(normalizedDay, 10);
        if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
          dayIndex = dayNum;
        } else {
          // Si no podemos determinar el día, registrar el problema
          console.warn(`Día de clase no reconocido: ${slot.day as string | number}`);
          dayIndex = 0; // Default a domingo si no se puede determinar
        }
      }
    } else {
      // Si no hay información del día, registrar problema
      console.warn('Formato de día inválido o ausente:', slot);
      dayIndex = 0; // Default a domingo si no hay información
    }
    
    // Asegurarse de que dayIndex esté dentro del rango válido
    dayIndex = Math.max(0, Math.min(6, dayIndex));
    
    return `${dayNames[dayIndex]} ${slot.startTime || '00:00'}-${slot.endTime || '00:00'}`;
  }).join(', ');
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

// Función para manejar el botón de asistencia
const handleAttendance = (e) => {
  e.stopPropagation(); // Prevenir que se active el evento del card
  
  // Obtener la fecha actual en formato YYYYMMDD para la URL
  const currentDate = format(new Date(), 'yyyyMMdd');
  
  // Redireccionar a la página de asistencia con la clase ya seleccionada
  router.push(`/attendance/${currentDate}/${props.classData.id}`);
};

// Asegurar que los estudiantes estén cargados cuando se monta el componente
onMounted(async () => {
  try {
    // Si no hay estudiantes cargados en el store, cargarlos
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents();
    }
    
    // Actualizar información de depuración
    debugInfo.value = {
      loaded: true,
      studentsCount: studentsStore.students.length,
      foundStudents: topStudents.value.length,
      error: null
    };
    
    
  } catch (error) {
    console.error('Error cargando estudiantes:', error);
    debugInfo.value.error = error instanceof Error ? error.message : String(error);
  }
});


// Función para obtener el orden del día actual de la semana
const getCurrentDayOrder = () => {
  const today = new Date().getDay(); // 0 (domingo) a 6 (sábado)
  // Convertir a nuestro sistema donde lunes = 1, domingo = 7
  return today === 0 ? 7 : today;
};

// Computed property para obtener el día actual
const currentDayOrder = ref(getCurrentDayOrder());

// Función para calcular la distancia entre el día de la clase y el día actual
const getDistanceFromCurrentDay = computed(() => {
  const classDayOrder = currentClassDayOrder.value;
  const today = currentDayOrder.value;
  
  // Calcula cuántos días faltan desde hoy hasta el día de la clase
  // Si el día de la clase es posterior a hoy, será la diferencia directa
  // Si es anterior o igual a hoy, será 7 + diferencia (para ponerlo en la siguiente semana)
  if (classDayOrder >= today) {
    return classDayOrder - today;
  } else {
    return classDayOrder + 7 - today;
  }
});

// Exponer un método que el componente padre puede usar para ordenar las clases
const getSortValue = () => {
  return getDistanceFromCurrentDay.value;
};

defineExpose({
  getSortValue
});

const getDayAbbr = (day) => {
  if (!day) return '';
  return day.slice(0, 3); // "Sábado" -> "Sáb"
}

</script>

<template>
  <div 
    @click="handleView" 
    class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden text-sm h-full flex flex-col"
  >
    <!-- Cabecera con color según día de la semana -->
    <div 
      class="h-2" 
      :class="{
        'bg-red-500': getDayAbbr(classData.schedule?.slots?.[0]?.day) === 'Lun',
        'bg-orange-500': getDayAbbr(classData.schedule?.slots?.[0]?.day) === 'Mar',
        'bg-yellow-500': getDayAbbr(classData.schedule?.slots?.[0]?.day) === 'Mié',
        'bg-green-500': getDayAbbr(classData.schedule?.slots?.[0]?.day) === 'Jue',
        'bg-blue-500': getDayAbbr(classData.schedule?.slots?.[0]?.day) === 'Vie',
        'bg-purple-500': getDayAbbr(classData.schedule?.slots?.[0]?.day) === 'Sáb',
        'bg-pink-500': getDayAbbr(classData.schedule?.slots?.[0]?.day) === 'Dom'
      }"
    ></div>
    
    <div class="p-2.5 sm:p-3 flex-grow flex flex-col"> <!-- Added flex-grow and flex-col to fill height -->
      <!-- Nombre y nivel -->
      <div class="flex justify-between items-start mb-1.5">
        <div>
          <h3 class="font-medium text-gray-900 dark:text-white text-base sm:text-sm leading-tight"> <!-- Larger on mobile -->
            {{ classData.name }}
          </h3>
          <span class="text-sm sm:text-xs text-gray-600 dark:text-gray-400 block leading-tight">
            {{ classData.level }}
            <span v-if="classData.instrument"> - {{ classData.instrument }}</span>
          </span>
        </div>
        <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 sm:px-1.5 sm:py-0.5 rounded-full">
          {{ hasStudentIds ? classData.studentIds.length : 0 }}
        </span>
      </div>
      
      <!-- Información adicional -->
      <div class="space-y-1.5 sm:space-y-1 mb-2"> <!-- More spacing on mobile -->
        <div class="flex items-center text-sm sm:text-xs text-gray-600 dark:text-gray-400 leading-tight">
          <CalendarIcon class="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1.5 sm:mr-1 flex-shrink-0" /> <!-- Larger icons on mobile -->
          <span class="truncate">{{ formatSchedule }}</span>
        </div>
        <div class="flex items-center text-sm sm:text-xs text-gray-600 dark:text-gray-400 leading-tight">
          <MapPinIcon class="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1.5 sm:mr-1 flex-shrink-0" /> <!-- Larger icons on mobile -->
          <span class="truncate">{{ classData.classroom || 'Sin aula' }}</span>
        </div>
      </div>

      <!-- Lista de estudiantes -->
      <div class="mb-3 sm:mb-2 flex-grow"> <!-- More spacing on mobile, flex-grow to push buttons to bottom -->
        <div class="text-sm sm:text-xs text-gray-500 dark:text-gray-400 mb-1 sm:mb-0.5 font-medium">Estudiantes:</div>
        <div v-if="hasStudentIds" class="space-y-1 sm:space-y-0">
          <div 
            v-for="(student, index) in topStudents" 
            :key="index" 
            class="flex items-center text-sm sm:text-xs text-gray-700 dark:text-gray-300 leading-tight py-0.5"
          >
            <UserGroupIcon class="h-3 w-3 sm:h-2.5 sm:w-2.5 mr-1.5 sm:mr-1 text-gray-500 flex-shrink-0" />
            <span class="truncate">{{ student }}</span>
          </div>          <button 
            v-if="additionalStudents > 0" 
            @click.stop="showStudentsModal = true"
            class="flex items-center gap-1 px-2 py-0.5 text-sm sm:text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
            <EyeIcon class="h-3 w-3 sm:h-2.5 sm:w-2.5" />
            Ver +{{ additionalStudents }} estudiantes más
          </button>
        </div>
        <div v-else class="text-sm sm:text-xs text-gray-500 dark:text-gray-400">
          No hay estudiantes inscritos
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="flex justify-end space-x-2 sm:space-x-1 pt-1.5 sm:pt-1 border-t border-gray-200 dark:border-gray-700 mt-auto"> <!-- More spacing between buttons on mobile -->
        <button 
          @click="handleAttendance" 
          class="p-1.5 sm:p-0.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-md" 
          title="Tomar asistencia"
        >
          <ClipboardDocumentCheckIcon class="h-5 w-5 sm:h-4 sm:w-4" /> <!-- Larger on mobile -->
        </button>
        <button 
          @click="handleManageStudents" 
          class="p-1.5 sm:p-0.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md" 
          title="Gestionar estudiantes"
        >
          <UserPlusIcon class="h-5 w-5 sm:h-4 sm:w-4" /> <!-- Larger on mobile -->
        </button>
        <button 
          @click="handleEdit" 
          class="p-1.5 sm:p-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md" 
          title="Editar clase"
        >
          <PencilIcon class="h-5 w-5 sm:h-4 sm:w-4" /> <!-- Larger on mobile -->
        </button>

        <button 
          @click="handleDelete" 
          class="p-1.5 sm:p-0.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md" 
          title="Eliminar clase"
        >
          <TrashIcon class="h-5 w-5 sm:h-4 sm:w-4" /> <!-- Larger on mobile -->
        </button>
      </div>    </div>
  </div>
  
  <!-- Modal de estudiantes -->
  <TransitionRoot appear :show="showStudentsModal" as="template">
    <Dialog 
      as="div" 
      @close="showStudentsModal = false"
      class="relative z-50"
      @click.stop
    >
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-50" />
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
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-4 text-left align-middle shadow-xl transition-all">
              <div class="flex items-center justify-between mb-3">
                <DialogTitle class="text-lg font-medium text-gray-900 dark:text-white">
                  Estudiantes de {{ classData.name }}
                </DialogTitle>
                <button @click="showStudentsModal = false" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>
              
              <div class="max-h-96 overflow-y-auto">
                <!-- Lista de estudiantes -->
                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                  <div v-for="student in allStudents" :key="student.id" class="py-2">
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ student.name }}</h4>
                        <div class="flex items-center gap-x-4 mt-1">
                          <span class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <CalendarIcon class="w-3 h-3 mr-1" />
                            {{ student.age }}
                          </span>
                          <span class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <MusicalNoteIcon class="w-3 h-3 mr-1" />
                            {{ student.instrument }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Mensaje cuando no hay estudiantes -->
                <div v-if="allStudents.length === 0" class="py-8 text-center">
                  <p class="text-gray-500 dark:text-gray-400">No hay estudiantes inscritos en esta clase</p>
                </div>
              </div>
              
              <div class="mt-4 flex justify-end">
                <button
                  @click="showStudentsModal = false"
                  class="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-900/50"
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
</template>

<style scoped>
/* Añadir estilos para condensar más el componente */
.leading-tight {
  line-height: 1.25;
}

/* Tamaños adaptados para móvil y desktop */
@media (max-width: 640px) {
  .text-sm {
    font-size: 0.8125rem; /* Slightly larger for mobile */
  }
  .text-xs {
    font-size: 0.75rem; /* Slightly larger for mobile */
  }
}

@media (min-width: 641px) {
  .text-xs {
    font-size: 0.7rem;
  }
  .text-sm {
    font-size: 0.8rem;
  }
}
</style>
