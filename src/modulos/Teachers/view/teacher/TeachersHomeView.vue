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
import TopAbsenteesByRange from '@/components/TopAbsenteesByRange.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { Dialog, DialogPanel, DialogOverlay, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';
import TeacherWeeklySchedule from '../../components/TeacherWeeklySchedule.vue'; // Componente que acabamos de crear
import TeacherClassesCard from '../../components/TeacherClassesCard.vue';
import ClassForm from '../modulos/Classes/components/ClassForm.vue'; // Componente existente
import ClassStudentManager from '../modulos/Classes/components/ClassStudentManager.vue'; // Componente existente
import ClassActivitiesView from '../modulos/Classes/views/ClassActivitiesView.vue';
import StudentAnalytics from '../modulos/Analytics/components/StudentAnalytics.vue';

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();
const { toast } = useToast();

// Referencia al componente de observaciones
const classActivitiesRef = ref(null);

// Estados
const loading = ref(true);
const activeTab = ref('classes'); // 'overview', 'schedule', 'classes', 'upcoming', 'statistics'
const selectedClassId = ref('');
const showForm = ref(false);
const showStudentManager = ref(false);
const isEditing = ref(false);
const classesViewMode = ref('card'); // 'card' | 'list' - Control the view mode for TeacherClassesCard

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

// Función auxiliar para obtener el orden del día de la semana (lunes=1, domingo=7)
const getDayOrder = (classItem) => {
  if (!classItem?.schedule?.slots?.[0]?.day) return 8; // Si no hay día, se coloca al final
  
  const day = classItem.schedule.slots[0].day;
  const dayOrder = {
    'lunes': 1, 'lun': 1, 'monday': 1, 'mon': 1, '1': 1, 0: 1,
    'martes': 2, 'mar': 2, 'tuesday': 2, 'tue': 2, '2': 2, 1: 2,
    'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3, 'wednesday': 3, 'wed': 3, '3': 3, 2: 3,
    'jueves': 4, 'jue': 4, 'thursday': 4, 'thu': 4, '4': 4, 3: 4,
    'viernes': 5, 'vie': 5, 'friday': 5, 'fri': 5, '5': 5, 4: 5,
    'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6, 'saturday': 6, 'sat': 6, '6': 6, 5: 6,
    'domingo': 7, 'dom': 7, 'sunday': 7, 'sun': 7, '0': 7, 6: 7,
  };
  
  // Normalizar el día
  const normalizedDay = typeof day === 'string' 
    ? day.toLowerCase().trim() 
    : day.toString();
  
  return normalizedDay in dayOrder 
    ? dayOrder[normalizedDay] 
    : (typeof day === 'number' && day >= 0 && day <= 6
        ? day === 0 ? 7 : day // Convertir 0 (domingo) a 7 para el orden correcto
        : 8); // Valor por defecto si no se puede determinar
};

// Función para obtener el día de la semana actual (0-6, donde 0 es domingo)
const getCurrentDayOrder = () => {
  const today = new Date().getDay(); // 0 (domingo) a 6 (sábado)
  // Convertir a nuestro sistema donde lunes = 1, domingo = 7
  return today === 0 ? 7 : today;
};

// Día actual de la semana
const currentDayOrder = ref(getCurrentDayOrder());

// Calcular la distancia desde hoy a un día específico de la semana
const getDistanceFromToday = (dayOrder) => {
  const today = currentDayOrder.value;
  
  // Si el día de la clase es igual o posterior a hoy en la semana, será la diferencia directa
  // Si es anterior a hoy, será 7 + diferencia (para ponerlo en la siguiente semana)
  if (dayOrder >= today) {
    return dayOrder - today;
  } else {
    return dayOrder + 7 - today;
  }
};

// Clases ordenadas comenzando desde el día actual de la semana
const sortedTeacherClasses = computed(() => {
  if (!teacherClasses.value.length) return [];
  
  return [...teacherClasses.value].sort((a, b) => {
    const dayOrderA = getDayOrder(a);
    const dayOrderB = getDayOrder(b);
    
    // Calcular la distancia desde hoy para ambos días
    const distanceA = getDistanceFromToday(dayOrderA);
    const distanceB = getDistanceFromToday(dayOrderB);
    
    if (distanceA !== distanceB) {
      return distanceA - distanceB; // Ordenar por proximidad al día actual
    }
    
    // Si son del mismo día, ordenar por hora de inicio
    const startTimeA = a.schedule?.slots?.[0]?.startTime || '00:00';
    const startTimeB = b.schedule?.slots?.[0]?.startTime || '00:00';
    return startTimeA.localeCompare(startTimeB);
  });
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
      }
      
      toast({
        title: 'Clase eliminada',
        description: 'La clase ha sido eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar la clase:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al eliminar la clase',
        variant: 'destructive'
      });
    }
  }
};

const handleManageStudents = (classId) => {
  selectedClassId.value = classId;
  showStudentManager.value = true;
};

// Nuevos manejadores para tomar asistencia y ver historial
const handleTakeAttendance = (classId) => {
  // Navegar a la página de tomar asistencia para la clase específica
  router.push({ 
    name: 'TeacherAttendanceClass', 
    params: { id: classId } 
  });
};

const handleViewHistory = (classId) => {
  // Navegar a la página de historial de observaciones para la clase específica
  router.push({ 
    name: 'ClassObservations', 
    params: { id: classId } 
  });
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

    // Obtener la clase actual y validar que existe
    const currentClass = classesStore.getClassById(selectedClassId.value);
    if (!currentClass) {
      throw new Error('No se encontró la clase seleccionada');
    }

    // Validar y normalizar IDs de estudiantes
    const validStudentIds = Array.isArray(studentIds) 
      ? [...new Set(studentIds.filter(id => id && typeof id === 'string'))] // Eliminar duplicados y valores inválidos
      : [];
    
    // Verificar que todos los estudiantes existan en el store
    const studentsStore = useStudentsStore();
    await studentsStore.fetchStudents(); // Asegurar que tenemos datos actualizados
    
    const validatedIds = validStudentIds.filter(id => {
      const exists = studentsStore.students.some(student => student.id === id);
      if (!exists) {
        console.warn(`Advertencia: El estudiante con ID ${id} no existe en el sistema.`);
      }
      return exists;
    });
    
    if (validatedIds.length !== validStudentIds.length) {
      console.warn(`Se eliminaron ${validStudentIds.length - validatedIds.length} IDs de estudiantes inválidos`);
    }
    
    // Verificar si hay cambios reales
    const currentIds = new Set(currentClass.studentIds || []);
    const newIds = new Set(validatedIds);
    
    const addedStudents = validatedIds.filter(id => !currentIds.has(id));
    const removedStudents = Array.from(currentIds).filter(id => !newIds.has(id));
    const hasChanges = addedStudents.length > 0 || removedStudents.length > 0;

    if (!hasChanges) {
      toast({
        title: "Sin Cambios",
        description: "No se detectaron cambios en la lista de estudiantes."
      });
      showStudentManager.value = false;
      return;
    }

    // Preparar los datos para la actualización preservando otros campos
    const updateData = {
      id: selectedClassId.value,
      ...currentClass, // Mantener datos existentes
      studentIds: validatedIds,
      updatedAt: new Date().toISOString() // Agregar timestamp de actualización
    };

    // Validar que la actualización no deje la clase sin datos esenciales
    if (!updateData.name || !updateData.teacherId) {
      throw new Error('Faltan datos esenciales de la clase');
    }

    // Actualizar la clase
    await classesStore.updateClass(updateData);
    
    // También actualizar la propiedad grupo en cada estudiante si es necesario
    for (const studentId of addedStudents) {
      try {
        const student = studentsStore.getStudentById(studentId);
        if (student) {
          // Asegurar que el grupo siempre sea un array
          const currentGrupos = Array.isArray(student.grupo) ? [...student.grupo] : 
                              (student.grupo ? [student.grupo] : []);
          
          // Si esta clase no está en los grupos del estudiante, añadirla
          if (!currentGrupos.includes(selectedClassId.value)) {
            await studentsStore.updateStudent(studentId, {
              grupo: [...currentGrupos, selectedClassId.value]
            });
            console.log(`Actualizado grupo del estudiante ${studentId}: añadido a clase ${selectedClassId.value}`);
          }
        }
      } catch (err) {
        console.error(`Error al actualizar los grupos del estudiante ${studentId}:`, err);
        // Continuar con los demás estudiantes
      }
    }
    
    // Log detallado para debugging
    console.log('Clase actualizada exitosamente:', {
      classId: selectedClassId.value,
      className: currentClass.name,
      previousCount: currentClass.studentIds?.length || 0,
      newCount: validatedIds.length,
      added: addedStudents.map(id => {
        const student = studentsStore.getStudentById(id);
        return {
          id,
          name: student ? `${student.nombre} ${student.apellido}` : 'Nombre desconocido'
        };
      }),
      removed: removedStudents.map(id => {
        const student = studentsStore.getStudentById(id);
        return {
          id,
          name: student ? `${student.nombre} ${student.apellido}` : 'Nombre desconocido'
        };
      })
    });

    // Mensaje específico basado en los cambios realizados
    let description = "Se han actualizado los estudiantes de la clase.";
    if (addedStudents.length > 0 && removedStudents.length > 0) {
      description = `Se ${addedStudents.length === 1 ? 'agregó' : 'agregaron'} ${addedStudents.length} y se ${removedStudents.length === 1 ? 'eliminó' : 'eliminaron'} ${removedStudents.length} estudiante${removedStudents.length === 1 ? '' : 's'}.`;
    } else if (addedStudents.length > 0) {
      description = `Se ${addedStudents.length === 1 ? 'agregó' : 'agregaron'} ${addedStudents.length} estudiante${addedStudents.length === 1 ? '' : 's'} a la clase.`;
    } else if (removedStudents.length > 0) {
      description = `Se ${removedStudents.length === 1 ? 'eliminó' : 'eliminaron'} ${removedStudents.length} estudiante${removedStudents.length === 1 ? '' : 's'} de la clase.`;
    }

    toast({
      title: "Estudiantes Actualizados",
      description: description
    });
    
    // Forzar una recarga de las clases para reflejar los cambios
    await classesStore.forceSync();
    
    showStudentManager.value = false;
  } catch (error) {
    console.error('Error al actualizar estudiantes:', error);
    toast({
      title: "Error",
      description: error.message || "No se pudieron actualizar los estudiantes. Intente nuevamente.",
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

// Función para actualizar las observaciones
const loadActivities = () => {
  if (classActivitiesRef.value && typeof classActivitiesRef.value.loadActivities === 'function') {
    classActivitiesRef.value.loadActivities();
  } else {
    console.warn('No se pudo actualizar las observaciones: la referencia o el método no existe');
    // Mostrar mensaje de feedback al usuario
    toast({
      title: "Actualizando...",
      description: "Recargando observaciones de clases"
    });
    // Si no se puede acceder al método del componente hijo, intentar cambiando de tab y volviendo
    const currentTab = activeTab.value;
    activeTab.value = 'classes';
    setTimeout(() => {
      activeTab.value = currentTab;
    }, 100);
  }
};

// Cargar datos iniciales
onMounted(async () => {
  loading.value = true;
  try {
    // Asegurarnos de que los métodos existen antes de llamarlos
    const promises: Promise<any>[] = [];
    
    // Primero cargamos los datos de los profesores para obtener la correspondencia UID -> ID de maestro
    if (typeof teachersStore.fetchTeachers === 'function') {
      await teachersStore.fetchTeachers();
      
      // Ahora obtenemos el maestro actual basado en el UID de autenticación
      if (authStore.user?.uid) {
        const teacher = await teachersStore.fetchTeacherByAuthUid(authStore.user.uid);
        
        if (teacher) {
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
      promises.push(classesStore.forceSync());
    } else if (typeof classesStore.fetchClasses === 'function') {
      promises.push(classesStore.fetchClasses());
    } else {
      console.warn('⚠️ El método fetchClasses no está disponible en classesStore');
    }
    if (typeof studentsStore.fetchStudents === 'function') {
      promises.push(studentsStore.fetchStudents());
    } else {
      console.warn('⚠️ El método fetchStudents no está disponible en studentsStore');
    }
    
    // Esperar a que todas las promesas se resuelvan
    await Promise.all(promises);
    
    // Si no hay clases, intentar nuevamente para asegurarnos
    if (classesStore.classes.length === 0) {
      if (typeof classesStore.forceSync === 'function') {
        await classesStore.forceSync();
      } else if (typeof classesStore.fetchClasses === 'function') {
        await classesStore.fetchClasses();
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
    try {
      // Si cambia el ID del profesor o no hay clases, recargamos las clases
      if (typeof classesStore.forceSync === 'function') {
        const classes = await classesStore.forceSync();
        return classes;
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
      <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
        {{ currentTeacher.name }}
      </h1>
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
            Metricas
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
            Ausentes
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
            Observaciones
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
      
      <!-- Vista de listado de ausentes -->
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
        <!-- <StudentAnalytics />  -->
        <TopAbsenteesByRange :limit="10" class="mt-8" />
      </div>
        <!-- Vista de listado de clases -->
      <div v-if="activeTab === 'classes'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
        <h2 class="text-base md:text-lg font-semibold mb-3 md:mb-4 flex justify-between items-center">
          <span>Mis Clases</span>
          <div class="flex items-center gap-2">
            <!-- Toggle para cambiar entre vista de tarjeta y lista -->
            <div class="flex bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
              <button 
                @click="classesViewMode = 'card'" 
                :class="[
                  'px-2 py-1 text-xs rounded-md transition-colors',
                  classesViewMode === 'card' 
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                @click="classesViewMode = 'list'" 
                :class="[
                  'px-2 py-1 text-xs rounded-md transition-colors',
                  classesViewMode === 'list' 
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <button
              @click="handleAddClass"
              class="flex items-center gap-1 text-xs md:text-sm bg-blue-600 text-white px-2 md:px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon class="w-3 h-3 md:w-4 md:h-4" />
              Nueva Clase
            </button>
          </div>
        </h2>
        
        <!-- Grid/List de clases (responsivo según el modo de vista) -->
        <div :class="[
          classesViewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4' : 'space-y-2'
        ]">
          <template v-if="sortedTeacherClasses.length">
            <TeacherClassesCard
              v-for="classItem in sortedTeacherClasses"
              :key="classItem.id"
              :classData="classItem"
              :viewMode="classesViewMode"
              @view="handleViewClass"
              @edit="handleEditClass"
              @delete="handleDeleteClass"
              @manage-students="handleManageStudents"
              @take-attendance="handleTakeAttendance"
              @view-history="handleViewHistory"
            />          </template>
          <div v-else class="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
            No tienes clases asignadas todavía.
          </div>
        </div>
      </div>
      
      <!-- Vista de observaciones -->
      <div v-if="activeTab === 'upcoming'" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <!-- Encabezado con título y botones de acción -->
        <div class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 md:p-4 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h2 class="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100">
              Historial de Observaciones
            </h2>
          </div>
          <!-- Botones de acción (opcional) -->
          <div class="flex items-center gap-2">
            <button 
              @click="loadActivities" 
              class="flex items-center gap-1 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-3 py-1 rounded-md transition-colors"
              title="Actualizar observaciones"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="hidden md:inline">Actualizar</span>
            </button>
          </div>
        </div>
          <!-- Contenedor del componente con espacio de padding adecuado -->
        <div class="p-0">
          <ClassActivitiesView ref="classActivitiesRef" />
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
            <div class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <DialogPanel>
                <DialogTitle as="h2" class="text-xl font-semibold mb-4">
                  {{ isEditing ? 'Editar Clase' : 'Nueva Clase' }}
                </DialogTitle>
                <ClassForm 
                  :class-data="isEditing ? selectedClass : null"
                  @save="handleSaveClass"
                  @cancel="showForm = false"
                />
              </DialogPanel>
            </div>
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
            <div class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <DialogPanel>
                <DialogTitle as="h2" class="text-xl font-semibold mb-4">
                  Gestionar Estudiantes - {{ selectedClass?.name }}
                </DialogTitle>
                <ClassStudentManager 
                  :key="selectedClass?.id || 'no-class'"
                  :class-id="selectedClass?.id || ''"
                  :student-ids="Array.isArray(selectedClass?.studentIds) ? [...selectedClass.studentIds] : []"
                  @update="handleStudentChange"
                  @close="showStudentManager = false"
                />
              </DialogPanel>
            </div>
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
