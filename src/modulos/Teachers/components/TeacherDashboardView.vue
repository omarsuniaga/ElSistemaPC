<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useClassesStore } from '../../../modulos/Classes/store/classes';
import { useTeachersStore } from '../../../modulos/Teachers/store/teachers';
import { useStudentsStore } from '../../../modulos/Students/store/students';
import { useAuthStore } from '../../../stores/auth'; // Asumiendo que existe un store de autenticación
import { 
  CalendarIcon, 
  BookOpenIcon, 
  ClockIcon, 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarSquareIcon
} from '@heroicons/vue/24/outline';
import { useToast } from '@/components/ui/toast/use-toast';
import { Dialog, DialogPanel, DialogOverlay, TransitionRoot, TransitionChild } from '@headlessui/vue';
import TeacherWeeklySchedule from './TeacherWeeklySchedule.vue';
import TeacherClassesCard from './TeacherClassesCard.vue';
import ClassForm from '@/modulos/Classes/components/ClassForm.vue'; // Componente existente
import ClassStudentManager from '@/modulos/Classes/components/ClassStudentManager.vue'; // Componente existente

/**
 * ANÁLISIS DE REQUISITOS
 * 
 * Este componente debe cubrir las siguientes funcionalidades:
 * 
 * 1. Visualización de horario semanal del maestro
 *    - Vista tipo calendario con días de la semana
 *    - Visualización por horas de las clases programadas
 *    - Identificación visual clara de cada clase (colores, etiquetas)
 * 
 * 2. Listado de clases asignadas al maestro
 *    - Mostrar todas las clases que imparte el maestro
 *    - Incluir detalles como: nombre de la clase, nivel, instrumento, aula, horarios
 *    - Mostrar cantidad de estudiantes por clase
 * 
 * 3. Vista de próximas clases en las siguientes 24 horas
 *    - Mostrar clases programadas para hoy/mañana
 *    - Ordenar por proximidad temporal
 *    - Incluir detalles como aula y hora exacta
 * 
 * 4. Capacidad para crear, modificar y eliminar clases
 *    - Formulario para crear nuevas clases
 *    - Opciones para editar detalles de clases existentes
 *    - Confirmación para eliminar clases
 * 
 * 5. Gestión de estudiantes dentro de cada clase
 *    - Agregar/eliminar estudiantes de las clases
 *    - Visualizar lista de estudiantes por clase
 *    - Buscar estudiantes para agregar a clases
 * 
 * 6. Estadísticas relevantes para el maestro
 *    - Total de horas de clase semanal
 *    - Total de estudiantes
 *    - Distribución de clases por niveles/instrumentos
 */

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();
const { toast } = useToast();

// Estados
const loading = ref(true);
const activeTab = ref('overview'); // 'overview', 'schedule', 'classes', 'upcoming'
const selectedClassId = ref('');
const showForm = ref(false);
const showStudentManager = ref(false);
const isEditing = ref(false);

// Computar el ID del maestro actual desde el sistema de autenticación
// En un sistema real, esto vendría del usuario autenticado
const currentTeacherId = computed(() => authStore.userId || '1'); // Default para desarrollo

// Computar clases del maestro actual
const teacherClasses = computed(() => {
  return classesStore.classes.filter(classItem => classItem.teacherId === currentTeacherId.value);
});

// Clase seleccionada
const selectedClass = computed(() => {
  if (!selectedClassId.value) return null;
  return classesStore.getClassById(selectedClassId.value);
});

// Métricas para el dashboard
const dashboardMetrics = computed(() => {
  const classes = teacherClasses.value;
  const totalStudents = classes.reduce((acc, curr) => {
    return acc + (curr.studentIds?.length || 0);
  }, 0);
  
  const totalHours = classes.reduce((acc, curr) => {
    if (!curr.schedule || !curr.schedule.slots) return acc;
    
    return acc + curr.schedule.slots.reduce((slotAcc, slot) => {
      const startTime = slot.startTime.split(':').map(Number);
      const endTime = slot.endTime.split(':').map(Number);
      const hours = endTime[0] - startTime[0];
      const minutes = endTime[1] - startTime[1];
      return slotAcc + hours + (minutes / 60);
    }, 0);
  }, 0);
  
  return [
    { 
      title: 'Clases Asignadas', 
      value: classes.length, 
      icon: BookOpenIcon,
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      title: 'Total Estudiantes', 
      value: totalStudents, 
      icon: UserGroupIcon,
      color: 'bg-purple-100 text-purple-800'
    },
    { 
      title: 'Horas Semanales', 
      value: Math.round(totalHours * 10) / 10, 
      icon: ClockIcon,
      color: 'bg-green-100 text-green-800'
    },
    { 
      title: 'Clases Hoy', 
      value: upcomingClasses.value.length, 
      icon: CalendarIcon,
      color: 'bg-amber-100 text-amber-800'
    }
  ];
});

// Próximas clases del maestro (próximas 24 horas)
const upcomingClasses = computed(() => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(now.getHours() + 24);
  
  return teacherClasses.value
    .filter(classItem => {
      // Verificamos si hay alguna sesión programada para las próximas 24 horas
      if (!classItem.schedule || !classItem.schedule.slots) return false;
      
      return classItem.schedule.slots.some(slot => {
        const slotDate = getNextClassDate(slot.day, slot.startTime);
        return slotDate >= now && slotDate <= tomorrow;
      });
    })
    .sort((a, b) => {
      // Ordenar por la próxima sesión más cercana
      const aNextSession = getNextSession(a);
      const bNextSession = getNextSession(b);
      return aNextSession.getTime() - bNextSession.getTime();
    });
});

// Notificaciones de prueba
const notifications = ref([
  {
    id: 1,
    title: 'Nueva clase asignada',
    message: 'Se te ha asignado la clase de Piano Intermedio',
    date: new Date(),
    read: false,
    type: 'info'
  },
  {
    id: 2,
    title: 'Recordatorio',
    message: 'Recuerda actualizar la lista de asistencia',
    date: new Date(Date.now() - 86400000),
    read: true,
    type: 'reminder'
  }
]);

// Funciones auxiliares
function getNextClassDate(day, time) {
  const today = new Date();
  const currentDay = today.getDay();
  const daysUntilClass = (7 + day - currentDay) % 7;
  
  const classDate = new Date(today);
  classDate.setDate(today.getDate() + daysUntilClass);
  
  const [hours, minutes] = time.split(':').map(Number);
  classDate.setHours(hours, minutes, 0, 0);
  
  // Si la clase es hoy pero ya pasó, añadimos 7 días
  if (daysUntilClass === 0 && classDate < today) {
    classDate.setDate(classDate.getDate() + 7);
  }
  
  return classDate;
}

function getNextSession(classItem) {
  const now = new Date();
  let closestDate = new Date();
  closestDate.setDate(closestDate.getDate() + 8); // Inicializar con una fecha futura lejana
  
  if (classItem.schedule?.slots) {
    classItem.schedule.slots.forEach(slot => {
      const slotDate = getNextClassDate(slot.day, slot.startTime);
      if (slotDate >= now && slotDate < closestDate) {
        closestDate = slotDate;
      }
    });
  }
  
  return closestDate;
}

// Función helper para limpiar el objeto y eliminar propiedades vacías
function cleanData(obj) {
  const cleaned = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedValue = cleanData(value);
      if (Object.keys(cleanedValue).length > 0) {
        cleaned[key] = cleanedValue;
      }
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
}

// Métodos para acciones del panel
const addTeacher = () => {
  handleAddClass();
};

const filterTeachers = () => {
  toast({
    title: 'Gestionar Estudiantes',
    description: 'Por favor, seleccione una clase primero para gestionar sus estudiantes'
  });
};

// Manejadores de eventos para clases
const handleAddClass = () => {
  isEditing.value = false;
  selectedClassId.value = '';
  showForm.value = true;
};

const handleViewClass = (classId) => {
  selectedClassId.value = classId;
  activeTab.value = 'classes'; // Cambiar a la pestaña de clases para ver detalles
};

const handleEditClass = (classId) => {
  selectedClassId.value = classId;
  isEditing.value = true;
  showForm.value = true;
};

const handleDeleteClass = async (classId) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta clase?')) {
    try {
      await classesStore.deleteClass(classId);
      toast({
        title: "Clase Eliminada",
        description: "La clase ha sido eliminada exitosamente."
      });
      
      if (selectedClassId.value === classId) {
        selectedClassId.value = '';
      }
    } catch (error) {
      console.error('Error al eliminar la clase:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la clase. Intente nuevamente.",
        variant: "destructive"
      });
    }
  }
};

const handleManageStudents = (classId) => {
  selectedClassId.value = classId;
  showStudentManager.value = true;
};

const handleSaveClass = async (classData) => {
  try {
    // Validación mínima
    if (!classData.name || !classData.level) {
      toast({
        title: "Error",
        description: "El nombre y nivel son obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Añadir automáticamente el ID del maestro actual
    classData.teacherId = currentTeacherId.value;

    // Preparar datos y limpiar propiedades vacías
    const preparedData = cleanData({
      name: classData.name.trim(),
      description: classData.description?.trim(),
      level: classData.level,
      teacherId: classData.teacherId,
      classroom: classData.classroom?.trim(),
      instrument: classData.instrument?.trim(),
      schedule: {
        slots: (classData.schedule?.slots || []).map(slot => cleanData({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime
        }))
      },
      studentIds: classData.studentIds
    });

    if (isEditing.value) {
      // Actualizar clase existente
      await classesStore.updateClass({
        ...preparedData,
        id: selectedClassId.value
      });
      toast({
        title: "Clase Actualizada",
        description: `La clase "${preparedData.name}" ha sido actualizada exitosamente.`
      });
    } else {
      // Crear nueva clase
      const newClass = await classesStore.addClass(preparedData);
      toast({
        title: "Clase Creada",
        description: `La clase "${preparedData.name}" ha sido creada exitosamente.`
      });
      selectedClassId.value = newClass.id;
    }
    showForm.value = false;
  } catch (error) {
    console.error('Error al guardar la clase:', error);
    toast({
      title: "Error",
      description: "No se pudo guardar la clase. Intente nuevamente.",
      variant: "destructive"
    });
  }
};

const handleStudentChange = async (studentIds) => {
  try {
    await classesStore.updateClass({
      id: selectedClassId.value,
      studentIds
    });
    toast({
      title: "Estudiantes Actualizados",
      description: "La lista de estudiantes ha sido actualizada exitosamente."
    });
    showStudentManager.value = false;
  } catch (error) {
    console.error('Error al actualizar estudiantes:', error);
    toast({
      title: "Error",
      description: "No se pudieron actualizar los estudiantes. Intente nuevamente.",
      variant: "destructive"
    });
  }
};

// Formatear fecha para mostrar
const formatDateTime = (date) => {
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Cambiar de tab
const setActiveTab = (tab) => {
  activeTab.value = tab;
};

// Cargar datos iniciales
onMounted(async () => {
  loading.value = true;
  try {
    // Aquí cargaríamos datos reales de los stores
    await Promise.all([
      classesStore.fetchClasses && classesStore.fetchClasses(),
      teachersStore.fetchTeachers && teachersStore.fetchTeachers(),
      studentsStore.fetchStudents && studentsStore.fetchStudents()
    ]);
  } catch (error) {
    console.error('Error cargando datos:', error);
    toast({
      title: "Error",
      description: "No se pudieron cargar los datos. Por favor, intente nuevamente.",
      variant: "destructive"
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="teacher-dashboard">
    <header class="dashboard-header bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control de Maestros</h1>
          <p class="text-gray-600 dark:text-gray-400">Aquí puedes gestionar y visualizar información relevante sobre tus clases y estudiantes.</p>
        </div>
        <button 
          @click="$router.push(`/teachers/${currentTeacherId}/edit`)" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PencilIcon class="w-5 h-5" />
          <span>Editar Perfil</span>
        </button>
      </div>
      
      <!-- Tabs de navegación -->
      <div class="flex mt-6 border-b border-gray-200 dark:border-gray-700">
        <button 
          @click="setActiveTab('overview')" 
          class="px-4 py-2 font-medium text-sm focus:outline-none"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'overview',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'overview'
          }"
        >
          <div class="flex items-center gap-1">
            <ChartBarSquareIcon class="h-4 w-4" />
            Panel General
          </div>
        </button>
        
        <button 
          @click="setActiveTab('schedule')" 
          class="px-4 py-2 font-medium text-sm focus:outline-none"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'schedule',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'schedule'
          }"
        >
          <div class="flex items-center gap-1">
            <CalendarIcon class="h-4 w-4" />
            Horario Semanal
          </div>
        </button>
        
        <button 
          @click="setActiveTab('classes')" 
          class="px-4 py-2 font-medium text-sm focus:outline-none"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'classes',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'classes'
          }"
        >
          <div class="flex items-center gap-1">
            <BookOpenIcon class="h-4 w-4" />
            Mis Clases
          </div>
        </button>
        
        <button 
          @click="setActiveTab('upcoming')" 
          class="px-4 py-2 font-medium text-sm focus:outline-none"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'upcoming',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'upcoming'
          }"
        >
          <div class="flex items-center gap-1">
            <ClockIcon class="h-4 w-4" />
            Próximas Clases
          </div>
        </button>
      </div>
    </header>
    
    <!-- Estado de carga -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
    
    <section v-else class="dashboard-content space-y-6">
      <!-- Vista general (Overview) -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Componente de métricas del panel -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            v-for="metric in dashboardMetrics" 
            :key="metric.title"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <div class="flex items-center">
              <div :class="`${metric.color} p-3 rounded-lg`">
                <component :is="metric.icon" class="h-6 w-6" />
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ metric.title }}</p>
                <p class="text-xl font-bold">{{ metric.value }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Componente de notificaciones -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-3">Notificaciones</h2>
          <div v-if="notifications.length > 0" class="space-y-3">
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              :class="{
                'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500': notification.type === 'info' && !notification.read,
                'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500': notification.type === 'reminder' && !notification.read
              }"
            >
              <div class="flex justify-between">
                <h3 class="font-medium">{{ notification.title }}</h3>
                <span class="text-xs text-gray-500">
                  {{ new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(notification.date) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ notification.message }}</p>
            </div>
          </div>
          <p v-else class="text-center text-gray-500 dark:text-gray-400 py-3">No hay notificaciones.</p>
        </div>
        
        <!-- Botones de acción rápida -->
        <div class="flex flex-wrap gap-3">
          <button 
            @click="handleAddClass" 
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon class="w-5 h-5" />
            <span>Agregar Clase</span>
          </button>
          <button 
            @click="filterTeachers" 
            class="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <span>Gestionar Estudiantes</span>
          </button>
        </div>
      </div>
      
      <!-- Vista del horario semanal -->
      <div v-if="activeTab === 'schedule'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4 flex justify-between items-center">
          <span>Horario Semanal</span>
          <button 
            @click="handleAddClass"
            class="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
          >
            <PlusIcon class="w-4 h-4" />
            Nueva Clase
          </button>
        </h2>
        
        <!-- Componente de horario semanal -->
        <TeacherWeeklySchedule 
          :classes="teacherClasses"
          @view-class="handleViewClass"
        />
      </div>
      
      <!-- Vista de listado de clases -->
      <div v-if="activeTab === 'classes'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4 flex justify-between items-center">
          <span>Mis Clases</span>
          <button 
            @click="handleAddClass"
            class="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
          >
            <PlusIcon class="w-4 h-4" />
            Nueva Clase
          </button>
        </h2>
        
        <!-- Grid de tarjetas de clases -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <template v-if="teacherClasses.length > 0">
            <TeacherClassesCard
              v-for="classItem in teacherClasses"
              :key="classItem.id"
              :class-data="classItem"
              @view="handleViewClass"
              @edit="handleEditClass"
              @delete="handleDeleteClass"
              @manage-students="handleManageStudents"
            />
          </template>
          
          <div v-else class="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
            No tienes clases asignadas actualmente.
            <button @click="handleAddClass" class="ml-2 text-blue-500 hover:underline">
              Crear una nueva clase
            </button>
          </div>
        </div>
      </div>
      
      <!-- Vista de próximas clases -->
      <div v-if="activeTab === 'upcoming'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">Próximas Clases (24h)</h2>
        
        <div class="space-y-4">
          <template v-if="upcomingClasses.length > 0">
            <div 
              v-for="classItem in upcomingClasses" 
              :key="classItem.id"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 border-l-4 border-blue-500"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium text-lg">{{ classItem.name }}</h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    {{ classItem.level }} - {{ classItem.instrument || 'Sin instrumento' }}
                  </p>
                  
                  <div class="mt-2 flex items-center text-sm">
                    <span class="font-medium mr-2">Próxima sesión:</span>
                    <span>{{ formatDateTime(getNextSession(classItem)) }}</span>
                  </div>
                  
                  <p class="mt-1 text-sm text-gray-500">Aula: {{ classItem.classroom || 'Sin asignar' }}</p>
                  <p class="text-sm text-gray-500">Estudiantes: {{ classItem.studentIds?.length || 0 }}</p>
                </div>
                
                <div class="flex space-x-2">
                  <button 
                    @click="handleEditClass(classItem.id)" 
                    class="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
                    title="Editar clase"
                  >
                    <PencilIcon class="h-5 w-5" />
                  </button>
                  <button 
                    @click="handleManageStudents(classItem.id)" 
                    class="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md"
                    title="Gestionar estudiantes"
                  >
                    <UserGroupIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </template>
          
          <div v-else class="py-12 text-center text-gray-500 dark:text-gray-400">
            No tienes clases programadas para las próximas 24 horas.
          </div>
        </div>
      </div>
    </section>
    
    <!-- Modal para el formulario de clase -->
    <TransitionRoot appear :show="showForm">
      <Dialog as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="showForm = false">
        <div class="min-h-screen px-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          </TransitionChild>

          <!-- This element is to trick the browser into centering the modal contents. -->
          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <h2 class="text-xl font-semibold mb-4">{{ isEditing ? 'Editar Clase' : 'Nueva Clase' }}</h2>
              <ClassForm 
                :class-data="isEditing ? selectedClass : null"
                @save="handleSaveClass"
                @cancel="showForm = false"
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
    
    <!-- Modal para gestión de estudiantes -->
    <TransitionRoot appear :show="showStudentManager && selectedClass !== null">
      <Dialog as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="showStudentManager = false">
        <div class="min-h-screen px-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          </TransitionChild>

          <!-- This element is to trick the browser into centering the modal contents. -->
          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <h2 class="text-xl font-semibold mb-4">Gestionar Estudiantes - {{ selectedClass?.name }}</h2>
              <ClassStudentManager 
                :class-id="selectedClass?.id"
                :student-ids="selectedClass?.studentIds || []"
                @update="handleStudentChange"
                @close="showStudentManager = false"
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>    
</template>

<style scoped>
.teacher-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
