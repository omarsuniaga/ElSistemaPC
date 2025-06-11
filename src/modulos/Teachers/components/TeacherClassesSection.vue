<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from 'vue';
import { useRouter } from 'vue-router'; // <-- Importamos useRouter
import { PlusIcon } from '@heroicons/vue/24/outline';
import TeacherClassesCard from './TeacherClassesCard.vue'; // Ajusta la ruta si es necesario

// Define types for class data
interface ClassData {
  id: string;
  name: string;
  // Incluye aquí las otras propiedades que TeacherClassesCard necesita
  level: string;
  instrument?: string;
  schedule?: {
      slots: { day: string | number; startTime: string; endTime: string; }[];
  };
  classroom?: string;
  studentIds?: string[];
}

const props = defineProps<{
  classes: ClassData[]; // Recibe las clases (probablemente ya ordenadas por el padre)
}>();

// Estado para el modo de visualización (tarjeta o lista)
const viewMode = ref('card'); // 'card' | 'list'

// Computed para calcular el total de estudiantes
const totalStudents = computed(() => {
  return props.classes.reduce((total, classItem) => {
    return total + (classItem.studentIds?.length || 0);
  }, 0);
});

// Función para obtener el número del día de la semana (0 = domingo, 1 = lunes, etc.)
const getDayNumber = (day: string | number): number => {
  if (typeof day === 'number') return day;
  
  const dayMap: Record<string, number> = {
    'domingo': 0, 'dom': 0, 'sunday': 0, '0': 0,
    'lunes': 1, 'lun': 1, 'monday': 1, '1': 1,
    'martes': 2, 'mar': 2, 'tuesday': 2, '2': 2,
    'miércoles': 3, 'miercoles': 3, 'mié': 3, 'wednesday': 3, '3': 3,
    'jueves': 4, 'jue': 4, 'thursday': 4, '4': 4,
    'viernes': 5, 'vie': 5, 'friday': 5, '5': 5,
    'sábado': 6, 'sabado': 6, 'sáb': 6, 'saturday': 6, '6': 6,
  };
  
  return dayMap[day.toString().toLowerCase()] ?? 7; // 7 para días desconocidos
};

// Computed para ordenar las clases por día de la semana, empezando por el día actual
const sortedClasses = computed(() => {
  if (!props.classes.length) return [];
  
  const today = new Date().getDay(); // 0 = domingo, 1 = lunes, etc.
  
  return [...props.classes].sort((a, b) => {
    const dayA = a.schedule?.slots?.[0]?.day;
    const dayB = b.schedule?.slots?.[0]?.day;
    
    if (!dayA && !dayB) return 0;
    if (!dayA) return 1;
    if (!dayB) return -1;
    
    const numA = getDayNumber(dayA);
    const numB = getDayNumber(dayB);
    
    // Calcular la distancia desde el día actual
    const getDistanceFromToday = (dayNum: number): number => {
      if (dayNum >= 7) return 999; // Días desconocidos al final
      let distance = dayNum - today;
      if (distance < 0) distance += 7; // Si el día ya pasó esta semana, contar para la próxima
      return distance;
    };
    
    const distanceA = getDistanceFromToday(numA);
    const distanceB = getDistanceFromToday(numB);
    
    return distanceA - distanceB;
  });
});

// Emits for actions from this component
const emit = defineEmits([
  'add-class',         // Emitido al hacer clic en "Nueva Clase"
  // 'view-class',     // Ya no necesitamos re-emitir 'view', navegamos directamente
  'edit-class',        // Re-emitido desde TeacherClassesCard
  'delete-class',      // Re-emitido desde TeacherClassesCard
  'manage-students'  // Re-emitido desde TeacherClassesCard
]);

const router = useRouter(); // <-- Inicializamos router

// Handler para el clic principal en la tarjeta (escucha el evento 'view' de TeacherClassesCard)
const handleCardView = async (classId: string) => {
    // Importar el utilitario de manejo de errores
    try {
        // Para maestros, siempre usar la vista específica para maestros
        const userDataStr = localStorage.getItem('user');
        let userRole = '';
        
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                userRole = userData.role;
            } catch (e) {
                console.warn('Error al parsear datos de usuario:', e);
            }
        }
        
        if (userRole === 'Maestro') {
            await router.push({
                name: 'TeacherClassDetail',
                params: { id: classId }
            });
        } else {
            // Para otros roles, usar la vista general de detalles
            await router.push({
                name: 'ClassDetail',
                params: { id: classId }
            });
        }
    } catch (error) {
        console.error('Error al navegar a vista detallada:', error);
        
        // Importar dinámicamente el manejador de errores para evitar problemas de circular imports
        import('../../../utils/errorHandling').then(({ handleModuleLoadingError }) => {
            // Si la función de manejo específico no resuelve el problema
            if (!handleModuleLoadingError(error, router)) {
                // Intentar la navegación de respaldo
                try {
                    router.push({
                        name: 'TeacherClassDetail',
                        params: { id: classId }
                    });
                } catch (secondError) {
                    console.error('Error en navegación de fallback:', secondError);
                    alert('Hubo un problema al cargar los detalles de la clase.');
                    router.push('/dashboard');
                }
            }
        }).catch(() => {
            // En caso de error al importar el manejador
            router.push('/dashboard');
        });
    }
};

// Handlers para las otras acciones emitidas por TeacherClassesCard (edit, delete, manage-students)
// Estas funciones simplemente re-emiten los eventos hacia el componente padre de TeachersClassesSection
const handleCardAction = (action: 'edit-class' | 'delete-class' | 'manage-students', classId: string) => {
    // El evento 'take-attendance' es manejado internamente por TeacherClassesCard
    // y realiza la navegación directamente, no necesita re-emitirse aquí.
    emit(action, classId);
};
</script>

<template>
  <!-- Contenedor principal mejorado -->
  <div class="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
    <!-- Header mejorado con gradientes y mejor tipografía -->
    <div class="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
            Mis Clases
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestiona y visualiza todas tus clases de música
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Toggle mejorado para cambiar entre vista de tarjeta y lista -->
          <div class="flex bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1 shadow-inner border border-gray-200/30 dark:border-gray-600/30">
            <button 
              @click="viewMode = 'card'" 
              :class="[
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                viewMode === 'card' 
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-md scale-105' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600/30'
              ]"
              title="Vista de tarjetas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span class="hidden sm:inline">Tarjetas</span>
            </button>
            <button 
              @click="viewMode = 'list'" 
              :class="[
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-md scale-105' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600/30'
              ]"
              title="Vista de lista"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span class="hidden sm:inline">Lista</span>
            </button>
          </div>
          
          <!-- Botón Nueva Clase mejorado -->
          <button
            @click="$emit('add-class')"
            class="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform border border-blue-500/20"
          >
            <PlusIcon class="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span class="hidden sm:inline">Nueva Clase</span>
            <span class="sm:hidden">Crear</span>
          </button>
        </div>
      </div>
      
      <!-- Estadísticas rápidas -->
      <div class="mt-4 flex items-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span class="text-gray-600 dark:text-gray-400">
            {{ classes.length }} clase{{ classes.length !== 1 ? 's' : '' }} activa{{ classes.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span class="text-gray-600 dark:text-gray-400">
            {{ totalStudents }} estudiante{{ totalStudents !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="p-6">
      <!-- Grid/List de Tarjetas de Clase (adaptable según el modo) -->
      <div :class="[
        viewMode === 'card' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-3'
      ]">
        <template v-if="classes.length > 0">
          <TeacherClassesCard
            v-for="classItem in classes"
            :key="classItem.id"
            :class-data="classItem"
            :viewMode="viewMode"
            @view="handleCardView" 
            @edit="(classId) => handleCardAction('edit-class', classId)"
            @delete="(classId) => handleCardAction('delete-class', classId)"
            @manage-students="(classId) => handleCardAction('manage-students', classId)"
            @take-attendance="handleCardView"
            @view-history="handleCardView"
            class="transition-all duration-300"
          />
        </template>

        <!-- Mensaje mejorado si no hay clases -->
        <div v-else class="col-span-full py-16 text-center">
          <div class="max-w-md mx-auto">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlusIcon class="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ¡Comienza tu viaje musical!
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              No tienes clases asignadas actualmente. Crea tu primera clase para comenzar a enseñar música.
            </p>
            <button 
              @click="$emit('add-class')" 
              class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
            >
              <PlusIcon class="w-5 h-5" />
              Crear mi primera clase
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Añade aquí cualquier estilo específico para la sección de clases */
</style>