<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useClassesStore } from '../../../../modulos/Classes/store/classes';
import { useTeachersStore } from '../../store/teachers';
import { useStudentsStore } from '../../../../modulos/Students/store/students';
import { useAuthStore } from '../../../../stores/auth'; // Asumiendo que existe un store de autenticación
import { 
  CalendarIcon, 
  BookOpenIcon, 
  ClockIcon, 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarSquareIcon,
  AcademicCapIcon
} from '@heroicons/vue/24/outline';
import { useToast } from '../../../../components/ui/toast/use-toast';
import { Dialog, DialogPanel, DialogOverlay, TransitionRoot, TransitionChild } from '@headlessui/vue';
import TeacherWeeklySchedule from '../../components/TeacherWeeklySchedule.vue'; // Componente que acabamos de crear
import TeacherClassesCard from '../../components/TeacherClassesCard.vue';
import ClassForm from '@/modulos/Classes/components/ClassForm.vue'; // Componente existente
import ClassStudentManager from '@/modulos/Classes/components/ClassStudentManager.vue'; // Componente existente
import ClassActivitiesView from '@/modulos/Classes/views/ClassActivitiesView.vue';
import StudentAnalytics from '../../../Analytics/components/StudentAnalytics.vue';

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();
const { toast } = useToast();

// Estados
const loading = ref(true);
const activeTab = ref('classes'); // 'overview', 'schedule', 'classes', 'upcoming', 'statistics'
const selectedClassId = ref('');
const showForm = ref(false);
const showStudentManager = ref(false);
const isEditing = ref(false);

// Mantener el ID del maestro actual
const currentTeacherId = ref('');
const currentTeacher = ref(null);

// Computar clases del maestro actual
const teacherClasses = computed(() => {
  return classesStore.classes.filter(classItem => 
    // Usar el ID del teacherStore si está disponible, o caer al UID de auth como respaldo
    classItem.teacherId === currentTeacherId.value || 
    (currentTeacher.value && classItem.teacherId === currentTeacher.value.id)
  );
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
      // Use direct removal method if available
      if (typeof classesStore.removeClass === 'function') {
        await classesStore.removeClass(classId);
      } else if (typeof classesStore.deleteClass === 'function') {
        // Alternative if a deleteClass method exists
        await classesStore.deleteClass(classId);
      } else if (typeof classesStore.updateClass === 'function') {
        // Fallback: Update with a status property that might exist in your data model
        // For example, many schemas use 'status' or 'isDeleted' instead of 'active'
        await classesStore.updateClass({
          id: classId,
          status: 'inactive' // Using a more common property name
        });
      } else {
        // Fallback if no delete method exists
        console.error('No method available to delete or update classes');
        throw new Error('No method available to delete or update classes');
      }
      
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
    }) as { name: string; [key: string]: any };
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
    if (!selectedClassId.value) {
      toast({
        title: "Error",
        description: "Por favor, seleccione una clase primero.",
        variant: "destructive"
      });
      return;
    }
    // Convertir a array si no lo es
    const validStudentIds = Array.isArray(studentIds) ? [...studentIds] : [];
    
    const currentClass = classesStore.getClassById(selectedClassId.value);
    console.log('Clase actual:', currentClass);
    // Actualizar la clase con los nuevos estudiantes
    await classesStore.updateClass({
      id: selectedClassId.value,
      studentIds: validStudentIds // Siempre será un array
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
    console.log('🔄 Iniciando carga de datos desde Firebase...');
    
    // Asegurarnos de que los métodos existen antes de llamarlos
    const promises: Promise<any>[] = [];
    
    // Primero cargamos los datos de los profesores para obtener la correspondencia UID -> ID de maestro
    if (typeof teachersStore.fetchTeachers === 'function') {
      console.log('👨‍🏫 Cargando profesores...');
      await teachersStore.fetchTeachers();
      
      // Ahora obtenemos el maestro actual basado en el UID de autenticación
      if (authStore.user?.uid) {
        console.log('🔍 Buscando maestro con UID de autenticación:', authStore.user.uid);
        const teacher = await teachersStore.fetchTeacherByAuthUid(authStore.user.uid);
        
        if (teacher) {
          console.log('✅ Maestro encontrado:', teacher.name, 'con ID:', teacher.id);
          currentTeacherId.value = teacher.id;
          currentTeacher.value = teacher;
        } else {
          console.warn('⚠️ No se encontró un maestro con el UID de autenticación:', authStore.user.uid);
          // Usar el UID como respaldo si no se encuentra el maestro
          currentTeacherId.value = authStore.user.uid;
        }
      } else {
        console.warn('⚠️ No hay usuario autenticado');
      }
    } else {
      console.warn('⚠️ El método fetchTeachers no está disponible en teachersStore');
    }
    
    if (typeof classesStore.forceSync === 'function') {
      console.log('📚 Forzando sincronización de clases desde Firebase...');
      promises.push(classesStore.forceSync());
    } else if (typeof classesStore.fetchClasses === 'function') {
      console.log('📚 Cargando clases...');
      promises.push(classesStore.fetchClasses());
    } else {
      console.warn('⚠️ El método fetchClasses no está disponible en classesStore');
    }
    
    if (typeof studentsStore.fetchStudents === 'function') {
      console.log('👨‍🎓 Cargando estudiantes...');
      promises.push(studentsStore.fetchStudents());
    } else {
      console.warn('⚠️ El método fetchStudents no está disponible en studentsStore');
    }
    
    // Esperar a que todas las promesas se resuelvan
    await Promise.all(promises);
    
    // Verificar que se hayan cargado los datos
    console.log(`✅ Datos cargados correctamente:`);
    console.log(`   - Clases: ${classesStore.classes.length}`);
    console.log(`   - ID de maestro usado para filtrar: ${currentTeacherId.value}`);
    console.log(`   - Clases del profesor: ${teacherClasses.value.length}`);
    console.log(`   - Profesores: ${teachersStore.teachers?.length || 0}`);
    console.log(`   - Estudiantes: ${studentsStore.students?.length || 0}`);
    
    // Si no hay clases, intentar nuevamente para asegurarnos
    if (classesStore.classes.length === 0) {
      console.log('⚠️ No se encontraron clases, intentando nuevamente...');
      if (typeof classesStore.forceSync === 'function') {
        await classesStore.forceSync();
        console.log(`   - Clases (reintento): ${classesStore.classes.length}`);
      }
    }

  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    toast({
      title: "Error",
      description: "No se pudieron cargar los datos. Por favor, intente nuevamente.",
      variant: "destructive"
    });
  } finally {
    loading.value = false;
  }
});

// Observar cambios en el ID del profesor o en las clases para recargar datos si es necesario
watch([currentTeacherId, () => classesStore.classes.length], async ([newTeacherId, classesCount], [oldTeacherId, oldClassesCount]) => {
  if (newTeacherId !== oldTeacherId || (classesCount === 0 && oldClassesCount === 0)) {
    console.log('🔄 Detectado cambio en el profesor o en las clases. Actualizando datos...');
    
    try {
      // Si cambia el ID del profesor o no hay clases, recargamos las clases
      if (typeof classesStore.forceSync === 'function') {
        const classes = await classesStore.forceSync();
        console.log(`✅ Clases actualizadas: ${classes.length} total, ${teacherClasses.value.length} del profesor`);
      }
    } catch (error) {
      console.error('❌ Error al actualizar clases:', error);
    }
  }
});
</script>

<template>
  <div class="teacher-dashboard">
    <header class="dashboard-header bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow mb-4 md:mb-6">
      <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Panel de Control de Maestros</h1>
      <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">Aquí puedes gestionar y visualizar información relevante sobre tus clases y estudiantes.</p>
      
      <!-- Tabs de navegación -->
      <div class="flex flex-wrap mt-4 md:mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button 
          @click="setActiveTab('classes')" 
          class="px-3 md:px-4 py-2 font-medium text-xs md:text-sm focus:outline-none whitespace-nowrap"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'classes',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'classes'
          }"
        >
          <div class="flex items-center gap-1">
            <BookOpenIcon class="h-3 w-3 md:h-4 md:w-4" />
            Mis Clases
          </div>
        </button>
        <button 
          @click="setActiveTab('overview')" 
          class="px-3 md:px-4 py-2 font-medium text-xs md:text-sm focus:outline-none whitespace-nowrap"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'overview',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'overview'
          }"
        >
          <div class="flex items-center gap-1">
            <ChartBarSquareIcon class="h-3 w-3 md:h-4 md:w-4" />
            Panel General
          </div>
        </button>
        
        <button 
          @click="setActiveTab('schedule')" 
          class="px-3 md:px-4 py-2 font-medium text-xs md:text-sm focus:outline-none whitespace-nowrap"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'schedule',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'schedule'
          }"
        >
          <div class="flex items-center gap-1">
            <CalendarIcon class="h-3 w-3 md:h-4 md:w-4" />
            Más Ausentes
          </div>
        </button>
        
        <button 
          @click="setActiveTab('upcoming')" 
          class="px-3 md:px-4 py-2 font-medium text-xs md:text-sm focus:outline-none whitespace-nowrap"
          :class="{
            'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'upcoming',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'upcoming'
          }"
        >
          <div class="flex items-center gap-1">
            <ClockIcon class="h-3 w-3 md:h-4 md:w-4" />
            Mis Observaciones
          </div>
        </button>
      </div>
    </header>
    
    <!-- Estado de carga -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
    
    <section v-else class="dashboard-content space-y-4 md:space-y-6">
      <!-- Vista general (Overview) -->
      <div v-if="activeTab === 'overview'" class="space-y-4 md:space-y-6">
        <!-- Componente de métricas del panel -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div 
            v-for="metric in dashboardMetrics" 
            :key="metric.title"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-transform hover:scale-[1.02]"
          >
            <div class="flex items-center">
              <div :class="`${metric.color} p-3 rounded-lg`">
                <component :is="metric.icon" class="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ metric.title }}</p>
                <p class="text-lg md:text-xl font-bold">{{ metric.value }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botones de acción rápida -->
        <div class="flex flex-wrap gap-2 md:gap-3">
          <button 
            @click="handleAddClass" 
            class="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white text-sm md:text-base rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon class="w-4 h-4 md:w-5 md:h-5" />
            <span>Agregar Clase</span>
          </button>
        </div>
      </div>
      
      <!-- Vista del horario semanal -->
      <div v-if="activeTab === 'schedule'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
        <h2 class="text-base md:text-lg font-semibold mb-3 md:mb-4 flex justify-between items-center">
          <span>Horario Semanal</span>
          <button 
            @click="handleAddClass"
            class="flex items-center gap-1 text-xs md:text-sm bg-blue-600 text-white px-2 md:px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon class="w-3 h-3 md:w-4 md:h-4" />
            Nueva Clase
          </button>
        </h2>
        
        <!-- Componente de horario semanal -->
        <StudentAnalytics /> 
      </div>
      
      <!-- Vista de listado de clases -->
      <div v-if="activeTab === 'classes'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
        <h2 class="text-base md:text-lg font-semibold mb-3 md:mb-4 flex justify-between items-center">
          <span>Mis Clases</span>
          <button 
            @click="handleAddClass"
            class="flex items-center gap-1 text-xs md:text-sm bg-blue-600 text-white px-2 md:px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon class="w-3 h-3 md:w-4 md:h-4" />
            Nueva Clase
          </button>
        </h2>
        
        <!-- Grid de Card de clases -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
      
      <!-- Vista de observaciones -->
      <div v-if="activeTab === 'upcoming'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
        <h2 class="text-base md:text-lg font-semibold mb-3 md:mb-4">Actividades y Observaciones de Clases</h2>
        <ClassActivitiesView />
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
                :student-ids="Array.isArray(selectedClass?.studentIds) ? selectedClass?.studentIds : []"
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
