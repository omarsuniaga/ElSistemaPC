<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useClassesStore } from '../../../../modulos/Classes/store/classes';
import { useTeachersStore } from '../../store/teachers';
import { useStudentsStore } from '../../../../modulos/Students/store/students';
import { useAuthStore } from '../../../../stores/auth';
import { 
  CalendarIcon, 
  BookOpenIcon, 
  ClockIcon, 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  ChartBarSquareIcon,
  Bars3Icon // Agregamos icono para menú móvil
} from '@heroicons/vue/24/outline';
import { useToast } from '../../../../components/ui/toast/use-toast';
import { Dialog, DialogPanel, DialogOverlay, TransitionRoot, TransitionChild } from '@headlessui/vue';
import TeacherWeeklySchedule from '../../components/TeacherWeeklySchedule.vue';
import TeacherClassesCard from '../../components/TeacherClassesCard.vue';
import ClassForm from '@/modulos/Classes/components/ClassForm.vue';
import ClassStudentManager from '@/modulos/Classes/components/ClassStudentManager.vue';
import TeacherDashboard from '../../../../components/teachers/TeacherDashboard.vue';
import AbsenceAlertList from '../../../../components/AbsenceAlertList.vue';

// Types
interface ClassScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

// Update ClassData interface to make more fields optional
interface ClassData {
  id: string;
  name: string;
  description?: string;
  level?: string;  // Make level optional
  teacherId?: string;  // Make teacherId optional
  studentIds?: string[];  // Make studentIds optional
  schedule?: {
    slots: ClassScheduleSlot[];
  };
  classroom?: string;
  instrument?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

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

// Configuración para navegación móvil
const showMobileMenu = ref(false);
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

// En el script del componente
const DAYS_ORDER = {
  'Lun': 1,
  'Mar': 2,
  'Mié': 3,
  'Jue': 4,
  'Vie': 5,
  'Sáb': 6,
  'Dom': 7
}

// Estructura de navegación para footer móvil
const navigationItems = computed(() => [
  {
    id: 'classes',
    name: 'Clases',
    icon: BookOpenIcon,
    active: activeTab.value === 'classes'
  },
  {
    id: 'overview',
    name: 'Panel',
    icon: ChartBarSquareIcon,
    active: activeTab.value === 'overview'
  },
  {
    id: 'schedule',
    name: 'Horario',
    icon: CalendarIcon,
    active: activeTab.value === 'schedule'
  },
  {
    id: 'upcoming',
    name: 'Próximas',
    icon: ClockIcon,
    active: activeTab.value === 'upcoming'
  }
]);

// Computar el ID del maestro actual desde el sistema de autenticación
// En un sistema real, esto vendría del usuario autenticado
const currentTeacherId = computed(() => authStore.user?.uid || '');

// Computar clases del maestro actual
const teacherClasses = computed(() => {
  return classesStore.classes.filter(classItem => classItem.teacherId === currentTeacherId.value);
});

// Clase seleccionada
const selectedClass = computed(() => {
  if (!selectedClassId.value) return null;
  return classesStore.getClassById(selectedClassId.value);
});

// Ordenar clases por día y hora de inicio
const sortedClasses = computed(() => {
  const sorted = sortClasses(teacherClasses.value)
  console.log('Clases ordenadas:', sorted)
  return sorted
})
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

const sortClasses = (classes) => {
  return classes.sort((a, b) => {
    // Obtener el primer slot de cada clase (asumiendo que cada clase tiene un solo slot)
    const slotA = a.schedule?.slots?.[0] || {};
    const slotB = b.schedule?.slots?.[0] || {};
    
    // Obtener el día en español y convertirlo al formato abreviado
    const dayA = slotA.day?.slice(0, 3) || ''; // "Sábado" -> "Sáb"
    const dayB = slotB.day?.slice(0, 3) || '';
    
    // Ordenar por día usando DAYS_ORDER
    const dayOrderA = DAYS_ORDER[dayA] || 0;
    const dayOrderB = DAYS_ORDER[dayB] || 0;
    
    if (dayOrderA !== dayOrderB) {
      return dayOrderA - dayOrderB;
    }
    
    // Si el día es el mismo, ordenar por hora de inicio
    const timeA = new Date(`1970-01-01T${slotA.startTime}`).getTime();
    const timeB = new Date(`1970-01-01T${slotB.startTime}`).getTime();
    
    return timeA - timeB;
  });
}

// Próximas clases del maestro (próximas 24 horas)
const upcomingClasses = computed(() => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(now.getHours() + 24);
  
  return teacherClasses.value
    .filter(classItem => {
      if (!classItem.schedule?.slots) return false;
      
      return classItem.schedule.slots.some(slot => {
        const slotDate = getNextClassDate(slot.day, slot.startTime);
        return slotDate >= now && slotDate <= tomorrow;
      });
    })
    .map(classItem => ({
      ...classItem,
      id: classItem.id,
      name: classItem.name,
      level: classItem.level || 'No especificado',
      teacherId: classItem.teacherId || '',
      studentIds: classItem.studentIds || []
    }))
    .sort((a, b) => {
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
function getNextClassDate(day: string, time: string): Date {
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = parseInt(day, 10);
  const daysUntilClass = (7 + targetDay - currentDay) % 7;
  
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

function getNextSession(classItem: ClassData): Date {
  const now = new Date();
  let closestDate = new Date();
  closestDate.setDate(closestDate.getDate() + 8); // Inicializar con una fecha futura lejana
  
  if (classItem.schedule?.slots) {
    classItem.schedule.slots.forEach((slot: ClassScheduleSlot) => {
      const slotDate = getNextClassDate(slot.day, slot.startTime);
      if (slotDate >= now && slotDate < closestDate) {
        closestDate = slotDate;
      }
    });
  }
  
  return closestDate;
}

// Función helper para limpiar el objeto y eliminar propiedades vacías
function cleanData(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
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
const filterTeachers = (): void => {
  toast({
    title: 'Gestionar Estudiantes',
    description: 'Por favor, seleccione una clase primero para gestionar sus estudiantes'
  });
};

// Manejadores de eventos para clases
const handleAddClass = (): void => {
  isEditing.value = false;
  selectedClassId.value = '';
  showForm.value = true;
};

const handleViewClass = (classId: string): void => {
  selectedClassId.value = classId;
  activeTab.value = 'classes'; // Cambiar a la pestaña de clases para ver detalles
};

const handleEditClass = (classId: string): void => {
  selectedClassId.value = classId;
  isEditing.value = true;
  showForm.value = true;
};

const handleDeleteClass = async (classId: string): Promise<void> => {
  if (confirm('¿Estás seguro de que deseas eliminar esta clase?')) {
    try {
      await classesStore.removeClass(classId);
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

const handleManageStudents = (classId: string): void => {
  // Aquí puedes abrir el modal o la vista para gestionar estudiantes
  selectedClassId.value = classId;
  showStudentManager.value = true;
};

const handleSaveClass = async (classData: Partial<ClassData>): Promise<void> => {
  // Validación de datos
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
    classData.teacherId = currentTeacherId.value || '';

    // Preparar datos y limpiar propiedades vacías
    const preparedData = cleanData({
      name: classData.name.trim(),
      description: classData.description?.trim(),
      level: classData.level,
      teacherId: classData.teacherId,
      classroom: classData.classroom?.trim(),
      instrument: classData.instrument?.trim(),
      schedule: {
        slots: (classData.schedule?.slots || []).map((slot: ClassScheduleSlot) => cleanData({
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

const handleStudentChange = async (studentIds: string[]): Promise<void> => {
  try {
    // Debugging: mostrar información sobre los datos recibidos
    console.log('handleStudentChange recibido:', {
      tipo: typeof studentIds,
      esArray: Array.isArray(studentIds),
      valor: studentIds
    });
    
    // Convertir a array si no lo es
    const validStudentIds = Array.isArray(studentIds) ? [...studentIds] : [];
    
    console.log('Actualizando clase:', selectedClassId.value);
    console.log('Lista de estudiantes (normalizada):', validStudentIds);
    
    // Buscar la clase actual para comparación
    const currentClass = classesStore.getClassById(selectedClassId.value);
    console.log('Clase actual antes de actualizar:', currentClass);
    
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
const formatDateTime = (date: Date): string => {
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Cambiar de tab
const setActiveTab = (tab: string): void => {
    activeTab.value = tab;
};

// Referencia al componente AbsenceAlertList
const absenceAlertListRef = ref(null);

// Nuevas funciones para analizar ausencias
const analyzeStudentAbsences = () => {
  if (!absenceAlertListRef.value) return;
  
  console.log("Información de fecha:", absenceAlertListRef.value.debugDateInfo);
  
  // Trigger the analysis in AbsenceAlertList component
  absenceAlertListRef.value.analyzeWeeklyAbsences();
  absenceAlertListRef.value.analyzeMonthlyAbsences();
  
  // Get results from the component
  const weeklyAbsences = absenceAlertListRef.value.getWeeklyAbsences();
  const monthlyAbsences = absenceAlertListRef.value.getMonthlyAbsences();
  
  console.log('===== ANÁLISIS DE AUSENCIAS =====');
  
  // Analizar ausencias por semana
  console.log('\n1. Alumnos con más de 1 inasistencia por semana:');
  if (weeklyAbsences.length === 0) {
    console.log('No hay alumnos con más de 1 inasistencia en la última semana.');
  } else {
    const studentsWithInstruments = [];
    const studentsWithoutInstruments = [];
    
    weeklyAbsences.forEach(report => {
      const student = report.student;
      const classes = classesStore.getClassesByStudentId(student.id);
      
      // Verificar si el estudiante tiene clases que indican que tiene instrumentos
      const hasInstrumentClass = classes.some(classItem => 
        ['Ensayo General', 'Ensayo Seccional', 'Taller', 'Talleres', 'Coro'].some(keyword => 
          classItem.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // Verificar si el estudiante está en clases de preparatoria o iniciación
      const isInPreparatoryClass = classes.some(classItem => 
        ['preparatoria', 'iniciacion'].some(keyword => 
          classItem.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      const studentInfo = {
        id: student.id,
        nombre: `${student.nombre} ${student.apellido}`,
        instrumento: student.instrumento || 'No especificado',
        ausencias: report.absences,
        clases: classes.map(c => c.name),
        fechas: report.absenceDates?.map(date => new Date(date).toLocaleDateString('es-ES')),
        telefono: student.parentPhone || 'No registrado'
      };
      
      if (hasInstrumentClass) {
        studentsWithInstruments.push(studentInfo);
      } else if (isInPreparatoryClass) {
        studentsWithoutInstruments.push(studentInfo);
      } else {
        // Si no podemos determinar, asumimos que tiene instrumento para ser más cautelosos
        studentsWithInstruments.push({
          ...studentInfo,
          nota: 'No se pudo determinar con certeza si tiene instrumento asignado'
        });
      }
    });
    
    console.log('Alumnos CON instrumentos (casos más graves):');
    console.table(studentsWithInstruments);
    
    console.log('Alumnos SIN instrumentos (casos menos graves):');
    console.table(studentsWithoutInstruments);
  }
  
  // Analizar ausencias por mes
  console.log('\n2. Alumnos con más de 1 inasistencia por mes:');
  if (monthlyAbsences.length === 0) {
    console.log('No hay alumnos con más de 1 inasistencia en el último mes.');
  } else {
    // Similar logic as weekly absences
    const studentsWithInstruments = [];
    const studentsWithoutInstruments = [];
    
    monthlyAbsences.forEach(report => {
      const student = report.student;
      const classes = classesStore.getClassesByStudentId(student.id);
      
      const hasInstrumentClass = classes.some(classItem => 
        ['Ensayo General', 'Ensayo Seccional', 'Taller', 'Talleres', 'Coro'].some(keyword => 
          classItem.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      const isInPreparatoryClass = classes.some(classItem => 
        ['preparatoria', 'iniciacion'].some(keyword => 
          classItem.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      const studentInfo = {
        id: student.id,
        nombre: `${student.nombre} ${student.apellido}`,
        instrumento: student.instrumento || 'No especificado',
        ausencias: report.absences,
        clases: classes.map(c => c.name),
        fechasMuestra: report.absenceDates?.slice(0, 3).map(date => new Date(date).toLocaleDateString('es-ES')),
        telefono: student.parentPhone || 'No registrado'
      };
      
      if (hasInstrumentClass) {
        studentsWithInstruments.push(studentInfo);
      } else if (isInPreparatoryClass) {
        studentsWithoutInstruments.push(studentInfo);
      } else {
        studentsWithInstruments.push({
          ...studentInfo,
          nota: 'No se pudo determinar con certeza si tiene instrumento asignado'
        });
      }
    });
    
    console.log('Alumnos CON instrumentos (casos más graves):');
    console.table(studentsWithInstruments);
    
    console.log('Alumnos SIN instrumentos (casos menos graves):');
    console.table(studentsWithoutInstruments);
  }
};

// Extender la función onMounted para analizar ausencias
onMounted(async () => {
  // Mantener la funcionalidad original
  loading.value = true;
  try {
    // Asegurarnos de que los métodos existen antes de llamarlos
    const promises: Promise<any>[] = [];
    
    if (typeof classesStore.forceSync === 'function') {
      // console.log('📚 Forzando sincronización de clases desde Firebase...');
      promises.push(classesStore.forceSync());
    } else if (typeof classesStore.fetchClasses === 'function') {
      // console.log('📚 Cargando clases...');
      promises.push(classesStore.fetchClasses());
    } else {
      console.warn('⚠️ El método fetchClasses no está disponible en classesStore');
    }
    
    if (typeof teachersStore.fetchTeachers === 'function') {
      // console.log('👨‍🏫 Cargando profesores...');
      promises.push(teachersStore.fetchTeachers());
    } else {
      console.warn('⚠️ El método fetchTeachers no está disponible en teachersStore');
    }
    
    if (typeof studentsStore.fetchStudents === 'function') {
      // console.log('👨‍🎓 Cargando estudiantes...');
      promises.push(studentsStore.fetchStudents());
    } else {
      console.warn('⚠️ El método fetchStudents no está disponible en studentsStore');
    }
    
    // Esperar a que todas las promesas se resuelvan
    await Promise.all(promises);
    // Si no hay clases, intentar nuevamente para asegurarnos
    if (classesStore.classes.length === 0) {
      // console.log('⚠️ No se encontraron clases, intentando nuevamente...');
      if (typeof classesStore.forceSync === 'function') {
        await classesStore.forceSync();
        // console.log(`   - Clases (reintento): ${classesStore.classes.length}`);
      }
    }
    
    // Mostrar estructura de una clase (si hay alguna) para debug
    if (classesStore.classes.length > 0) {
      const sampleClass = classesStore.classes[0];
      console.log('🔍 Estructura de ejemplo de una clase:', sampleClass)
      // console.log({
        // id: sampleClass.id,r
        // name: sampleClass.name,
        // schedule: sampleClass.schedule,
        // teacherId: sampleClass.teacherId
      // });
    }

    // Después de cargar todos los datos, analizar ausencias
    setTimeout(() => {
      analyzeStudentAbsences();
    }, 2000); // Dar tiempo para que todo se cargue
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
    // console.log('🔄 Detectado cambio en el profesor o en las clases. Actualizando datos...');
    
    try {
      // Si cambia el ID del profesor o no hay clases, recargamos las clases
      if (typeof classesStore.forceSync === 'function') {
        const classes = await classesStore.forceSync();
        // console.log(`✅ Clases actualizadas: ${classes.length} total, ${teacherClasses.value.length} del profesor`);
      }
    } catch (error) {
      console.error('❌ Error al actualizar clases:', error);
    }
  }
});
</script>

<template>
  <div class="teacher-dashboard pb-16 md:pb-0">
    <!-- Navegación para dispositivos móviles (visible solo en móviles) -->
    <div class="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 z-40 shadow-md p-3">
      <div class="flex justify-between items-center">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {{ activeTab === 'classes' ? 'Mis Clases' : 
             activeTab === 'overview' ? 'Panel General' : 
             activeTab === 'schedule' ? 'Horario Semanal' : 
             activeTab === 'upcoming' ? 'Próximas Clases' : 'Panel de Maestros' }}
        </h1>
        <button @click="toggleMobileMenu" class="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
          <Bars3Icon class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Mobile menu overlay -->
    <div v-if="showMobileMenu" 
         class="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
         @click="showMobileMenu = false"></div>

    <!-- Mobile side menu -->
    <div v-if="showMobileMenu"
         class="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 z-50 transform shadow-lg md:hidden p-4 overflow-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Menú</h2>
        <button @click="showMobileMenu = false" class="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="space-y-2">
        <button @click="setActiveTab('classes'); showMobileMenu = false" 
                class="w-full text-left p-2 rounded-md flex items-center gap-2"
                :class="activeTab === 'classes' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''">
          <BookOpenIcon class="h-5 w-5" />
          Mis Clases
        </button>
        <button @click="setActiveTab('overview'); showMobileMenu = false" 
                class="w-full text-left p-2 rounded-md flex items-center gap-2"
                :class="activeTab === 'overview' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''">
          <ChartBarSquareIcon class="h-5 w-5" />
          Panel General
        </button>
        <button @click="setActiveTab('schedule'); showMobileMenu = false" 
                class="w-full text-left p-2 rounded-md flex items-center gap-2"
                :class="activeTab === 'schedule' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''">
          <CalendarIcon class="h-5 w-5" />
          Horario Semanal
        </button>
        <button @click="setActiveTab('upcoming'); showMobileMenu = false" 
                class="w-full text-left p-2 rounded-md flex items-center gap-2"
                :class="activeTab === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''">
          <ClockIcon class="h-5 w-5" />
          Próximas Clases
        </button>
      </div>
      
      <div class="mt-6 pt-4 border-t">
        <p class="text-sm text-gray-500 dark:text-gray-400">Panel de Maestros v1.0</p>
      </div>
    </div>

    <!-- Header -->
    <header class="dashboard-header bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow mb-4">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
    <div class="flex-1">
      <h1 class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
        Panel de Control
      </h1>
    </div>
    
    <!-- Tabs -->
    <div class="flex flex-col sm:flex-row w-full sm:w-auto">
      <button 
        @click="setActiveTab('classes')" 
        class="flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-2 text-sm font-medium flex items-center justify-center gap-1 focus:outline-none"
        :class="{
          'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'classes',
          'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'classes'
        }"
      >
        <BookOpenIcon class="h-4 w-4" />
        <span class="hidden sm:inline">Mis Clases</span>
      </button>

      <button 
        @click="setActiveTab('overview')" 
        class="flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-2 text-sm font-medium flex items-center justify-center gap-1 focus:outline-none"
        :class="{
          'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'overview',
          'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'overview'
        }"
      >
        <ChartBarSquareIcon class="h-4 w-4" />
        <span class="hidden sm:inline">Panel General</span>
      </button>

      <button 
        @click="setActiveTab('schedule')" 
        class="flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-2 text-sm font-medium flex items-center justify-center gap-1 focus:outline-none"
        :class="{
          'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'schedule',
          'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'schedule'
        }"
      >
        <CalendarIcon class="h-4 w-4" />
        <span class="hidden sm:inline">Horario Semanal</span>
      </button>

      <button 
        @click="setActiveTab('upcoming')" 
        class="flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-2 text-sm font-medium flex items-center justify-center gap-1 focus:outline-none"
        :class="{
          'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400': activeTab === 'upcoming',
          'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': activeTab !== 'upcoming'
        }"
      >
        <ClockIcon class="h-4 w-4" />
        <span class="hidden sm:inline">Próximas Clases</span>
      </button>
    </div>
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
          :teacherId="currentTeacherId"
          @view-class="handleViewClass"
        />
      </div>
      
      <!-- Vista de listado de clases -->
      <div v-if="activeTab === 'classes'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-1 flex justify-between items-center">
          <span>Mis Clases</span>
          <button 
            @click="handleAddClass"
            class="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
          >
            <PlusIcon class="w-4 h-4" />
            Nueva Clase
          </button>
        </h2>
        
        <!-- Grid de Card de clases -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <template v-if="sortedClasses.length > 0">
            <TeacherClassesCard
              v-for="classItem in sortedClasses"
              :key="classItem.id"
              :class-data="classItem"
              @view="handleViewClass"
              @edit="handleEditClass"
              @delete="handleDeleteClass"
              @manage-students="handleManageStudents"
            />
          </template>
          
          <div v-else class="col-span-full py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            No tienes clases asignadas actualmente.
            <button @click="handleAddClass" class="ml-1 text-blue-500 hover:underline">
              Crear una nueva
            </button>
          </div>
        </div>
      </div>
      
      <!-- CREA UN NUEVO COMPONENTE PARA: Vista de próximas clases -->
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
                    {{ classItem.level }} - {{ classItem.instrumento || 'Sin instrumento' }}
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
    <TeacherDashboard />
    
    <!-- CREA UN NUEVO COMPONENTE PARA: Modal para el formulario de clase -->
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
    
    <!-- CREA UN NUEVO COMPONENTE PARA: Modal para gestión de estudiantes -->
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
    
    <!-- Footer Navigation para móviles -->
    <div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden shadow-lg z-40">
      <div class="flex justify-around items-center">
        <button 
          v-for="item in navigationItems" 
          :key="item.id"
          @click="setActiveTab(item.id)"
          class="flex flex-col items-center py-2 px-2 flex-1"
          :class="item.active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'"
        >
          <component :is="item.icon" class="h-6 w-6" />
          <span class="text-xs mt-1">{{ item.name }}</span>
        </button>
        <button 
          @click="toggleMobileMenu"
          class="flex flex-col items-center py-2 px-2 flex-1 text-gray-500 dark:text-gray-400"
        >
          <Bars3Icon class="h-6 w-6" />
          <span class="text-xs mt-1">Menú</span>
        </button>
      </div>
    </div>
    
    <!-- Añadir ref al componente AbsenceAlertList -->
    <AbsenceAlertList ref="absenceAlertListRef" class="hidden" />
  </div>    
</template>

<style scoped>
.teacher-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  /* Añadir padding en la parte inferior para compensar el footer en móviles */
  padding-top: 3.5rem; /* Compensar el header fijo */
}

@media (min-width: 768px) {
  .teacher-dashboard {
    padding-top: 0;
  }
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

@media (min-width: 640px) {
  .dashboard-header {
    flex-direction: row;
  }
}
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
