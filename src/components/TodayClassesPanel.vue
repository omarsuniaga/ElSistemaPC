<template>
  <section 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
    aria-labelledby="today-classes-title"
  >
    <!-- Panel Header -->
    <header class="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b dark:border-gray-700 flex justify-between items-center">
      <h2 
        id="today-classes-title" 
        class="text-lg font-medium text-gray-900 dark:text-gray-100"
      >
        Clases de hoy
      </h2>
      <router-link 
        to="/classes" 
        class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 rounded-md px-2 py-1"
        aria-label="Ver todas las clases"
      >
        Ver todas
      </router-link>
    </header>

    <!-- Loading State -->
    <div 
      v-if="isLoading" 
      class="flex justify-center items-center p-6"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="animate-pulse flex flex-col items-center">
        <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10 mb-2"></div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Cargando clases...</div>
      </div>
    </div>

    <!-- Error State -->
    <div 
      v-else-if="error" 
      class="p-6 text-center text-red-600 dark:text-red-400"
      aria-live="assertive"
    >
      <p class="flex items-center justify-center">
        <span class="sr-only">Error: </span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ error }}
      </p>
      <button 
        class="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md px-2 py-1"
        @click="retryLoading"
        aria-label="Intentar cargar las clases de nuevo"
      >
        Reintentar
      </button>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="classes.length === 0" 
      class="p-6 text-center text-gray-500 dark:text-gray-400"
      aria-live="polite"
    >
      <p>No hay clases programadas para hoy</p>
    </div>

    <!-- Classes List -->
    <ul 
      v-else 
      class="divide-y divide-gray-200 dark:divide-gray-700"
      aria-label="Lista de clases programadas para hoy"
    >
      <li 
        v-for="classItem in classes" 
        :key="classItem.id"
        class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <button 
          class="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 rounded-md p-1 -m-1"
          @click="navigateToClass(classItem.id)"
          :aria-label="`Ver detalles de clase: ${classItem.name} a las ${formatTime(classItem.schedule?.slots?.[0]?.startTime)}`"
        >
          <div class="sm:flex sm:justify-between sm:items-center">
            <!-- Time and Class Name -->
            <div class="mb-2 sm:mb-0">
              <div class="flex items-center">
                <!-- Time Badge -->
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mr-2"
                  aria-label="Hora de inicio"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-3 w-3 mr-1" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                  </svg>
                  {{ formatTime(classItem.schedule?.slots?.[0]?.startTime) }}
                </span>

                <!-- Class Name -->
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-xs">
                  {{ classItem.name }}
                </h3>
              </div>
            </div>

            <!-- Teacher and Location -->
            <div class="flex flex-col sm:items-end text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <!-- Teacher -->
              <div class="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-3.5 w-3.5 mr-1" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true" 
                >
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                <span>{{ teacherName(classItem.teacherId) }}</span>
              </div>

              <!-- Location -->
              <div class="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-3.5 w-3.5 mr-1" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true" 
                >
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                </svg>
                <span>{{ classItem.classroom || 'Sin asignar' }}</span>
              </div>
            </div>
          </div>

          <!-- Status Indicator -->
          <div class="mt-2 flex items-center">
            <span 
              class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs"
              :class="getStatusClass(classItem.status)"
            >
              {{ getStatusLabel(classItem.status) }}
            </span>
            
            <!-- Student count -->
            <span 
              v-if="classItem.studentIds && classItem.studentIds.length > 0"
              class="ml-2 text-xs text-gray-500 dark:text-gray-400 flex items-center"
              :aria-label="`${classItem.studentIds.length} estudiantes`"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-3.5 w-3.5 mr-0.5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              {{ classItem.studentIds.length }}
            </span>
          </div>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTeachersStore } from '@/modulos/Teachers/store/teachers';
import { useAuthStore } from '@/stores/auth';
import { useRoomsStore } from '@/stores/rooms';
import { useClassesStore } from '@/modulos/Classes/store/classes';
import { format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Props
const props = defineProps({
  // Permite filtrar por maestro específico (opcional)
  teacherId: {
    type: String,
    default: null
  },
  
  // Número máximo de clases a mostrar
  limit: {
    type: Number,
    default: 5
  }
});

// Estado local
const isLoading = ref(true);
const error = ref(null);

// Stores y router
const teachersStore = useTeachersStore();
const roomsStore = useRoomsStore();
const classesStore = useClassesStore();
const router = useRouter();

// Clases filtradas para hoy
const classes = computed(() => {
  if (!classesStore.classes || classesStore.classes.length === 0) {
    return [];
  }
  
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  
  return classesStore.classes
    .filter(classItem => {
      // Filtro por día (hoy)
      let isClassToday = false;
      
      // Verificar en los slots de horario si hay alguno programado para hoy
      if (classItem.schedule && classItem.schedule.slots && Array.isArray(classItem.schedule.slots)) {
        const today = format(now, 'EEEE', { locale: es }).toLowerCase();
        
        isClassToday = classItem.schedule.slots.some(slot => {
          const slotDay = typeof slot.day === 'string' ? slot.day.toLowerCase() : '';
          return slotDay === today;
        });
      }
      
      // Filtro para clases específicas por fecha
      if (classItem.date) {
        // Si es un string ISO, convertir a Date y verificar
        if (typeof classItem.date === 'string') {
          isClassToday = isClassToday || isToday(parseISO(classItem.date));
        } 
        // Si ya es un objeto Date, verificar directamente
        else if (classItem.date instanceof Date) {
          isClassToday = isClassToday || isToday(classItem.date);
        }
      }
      
      // Filtro adicional por profesor si se especificó
      const teacherMatches = props.teacherId ? classItem.teacherId === props.teacherId : true;
      
      // Solo devolver clases activas de hoy
      return isClassToday && teacherMatches && classItem.status !== 'cancelled';
    })
    .sort((a, b) => {
      // Ordenar por hora de inicio
      const timeA = a.schedule?.slots?.[0]?.startTime || '00:00';
      const timeB = b.schedule?.slots?.[0]?.startTime || '00:00';
      return timeA.localeCompare(timeB);
    })
    .slice(0, props.limit);
});

/**
 * Carga las clases desde el store
 */
const loadClasses = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    console.log('🔄 Iniciando carga de datos para el panel de clases de hoy...');
    
    // 1. Primero cargar los profesores para asegurar que están disponibles
    console.log('Cargando profesores...');
    if (teachersStore.teachers.length === 0) {
      console.log('No hay profesores cargados, intentando cargarlos...');
      await teachersStore.fetchTeachers();
      console.log(`✅ Profesores cargados: ${teachersStore.teachers.length}`);
      
      // Si aún no hay profesores, vamos a intentar debuggear
      if (teachersStore.teachers.length === 0) {
        console.warn('⚠️ No se pudieron cargar los profesores. Revisando errores...');
        if (teachersStore.error) {
          console.error('Error en store de profesores:', teachersStore.error);
        }
      }
    } else {
      console.log(`Ya hay ${teachersStore.teachers.length} profesores cargados.`);
    }
    
    // 2. Cargar las salas
    console.log('Cargando salas...');
    if (roomsStore.rooms.length === 0) {
      await roomsStore.fetchRooms();
      console.log(`✅ Salas cargadas: ${roomsStore.rooms.length}`);
    }
    
    // 3. Cargar las clases
    console.log('Cargando clases...');
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
      console.log(`✅ Clases cargadas: ${classesStore.classes.length}`);
      
      // Mostrar información sobre las clases para debug
      if (classesStore.classes.length > 0) {
        console.log('Muestra de teacherId en clases:', 
          classesStore.classes.slice(0, 3).map(c => ({
            id: c.id,
            name: c.name,
            teacherId: c.teacherId
          }))
        );
      }
    }
    
    // Validación adicional: verificar maestros y sus IDs
    if (teachersStore.teachers.length > 0 && classesStore.classes.length > 0) {
      // Verificar si los IDs de maestros en las clases existen en el store de maestros
      const teacherIds = new Set(teachersStore.teachers.map(t => t.id));
      const missingTeacherIds = classesStore.classes
        .filter(c => c.teacherId && !teacherIds.has(c.teacherId))
        .map(c => c.teacherId);
      
      if (missingTeacherIds.length > 0) {
        console.warn(`⚠️ Hay ${missingTeacherIds.length} teacherIds en clases que no existen en el store de maestros`);
        console.warn('Ejemplos de IDs faltantes:', missingTeacherIds.slice(0, 3));
      } else {
        console.log('✅ Todos los teacherIds en clases existen en el store de maestros');
      }
    }
    
    console.log('🎉 Carga de datos completada con éxito');
    isLoading.value = false;
  } catch (err) {
    console.error('❌ Error al cargar datos:', err);
    error.value = 'Error al cargar las clases del día';
    isLoading.value = false;
  }
};

/**
 * Navega a la vista detallada de una clase
 */
const navigateToClass = (classId) => {
  router.push(`/classes/${classId}`);
};

/**
 * Formatea la hora de 24 horas a un formato más legible
 */
const formatTime = (time) => {
  if (!time) return '--:--';
  
  // Si ya está en formato HH:MM, simplemente lo retornamos
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  
  try {
    // Si es un objeto Date o timestamp
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return time;
  }
};

/**
 * Obtiene el nombre del profesor por su ID
 */
const teacherName = (teacherId) => {
  if (!teacherId) return 'No asignado';
  
  // Log para depuración
  console.log(`Buscando profesor con ID: ${teacherId}, hay ${teachersStore.teachers.length} profesores cargados`);
  
  // Normalizar ID del profesor (por si es un string u objeto)
  const normalizedTeacherId = String(teacherId).trim();
  
  // Buscar profesor en el store
  const teacher = teachersStore.teachers.find(teacher => String(teacher.id).trim() === normalizedTeacherId);
  
  if (!teacher) {
    console.warn(`No se encontró el profesor con ID: ${teacherId} en el store de profesores`);
    return 'Profesor no encontrado';
  }
  
  // Usar firstName y lastName si existen, si no usar name o displayName
  if (teacher.firstName && teacher.lastName) {
    return `${teacher.firstName} ${teacher.lastName}`;
  } else if (teacher.name) {
    return teacher.name;
  } else if (teacher.displayName) {
    return teacher.displayName;
  }
  
  return 'Profesor #' + teacherId;
};

/**
 * Obtiene el nombre del aula por su ID
 */
const roomName = (roomId) => {
  if (!roomId) return 'Sin asignar';
  
  const room = roomsStore.getRoomById(roomId);
  if (!room) return 'Aula no encontrada';
  
  return room.name || roomId;
};

/**
 * Obtiene la clase CSS para el estado de la clase
 */
const getStatusClass = (status) => {
  switch(status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

/**
 * Obtiene la etiqueta para el estado de la clase
 */
const getStatusLabel = (status) => {
  switch(status) {
    case 'active': return 'Programada';
    case 'cancelled': return 'Cancelada';
    case 'completed': return 'Completada';
    default: return 'Activa';
  }
};

/**
 * Función para reintentar cargar las clases
 */
const retryLoading = () => {
  loadClasses();
};

// Cargar clases al montar el componente
onMounted(() => {
  loadClasses();
});
</script>