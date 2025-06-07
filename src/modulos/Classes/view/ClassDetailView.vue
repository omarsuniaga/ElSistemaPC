<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClassesStore } from '../store/classes';
import { useTeachersStore } from '../../Teachers/store/teachers';
import AppImage from '@/components/ui/AppImage.vue';
import { useStudentsStore } from '../../Students/store/students';
import type { ClassData } from '../types/class'; // Assuming ClassData is correctly typed

// Import UI components
import ClassDetailSkeleton from '../components/ClassDetailSkeleton.vue';
import ClassSummary from '../components/ClassSummary.vue';
import TeacherCard from '../components/TeacherCard.vue';
import StatsCard from '../components/StatsCard.vue';
import StudentsCard from '../components/StudentsCard.vue';
import ErrorState from '../../../Common/components/ErrorState.vue';
import DeleteConfirmationDialog from '../../../Common/components/DeleteConfirmationDialog.vue';
import Toast from '../../../Common/components/Toast.vue';

const route = useRoute();
const router = useRouter();
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();

const classId = computed(() => route.params.id as string);

const isLoading = ref(true);
const error = ref<string | null>(null);
const classData = ref<ClassData | null>(null);
const teacher = ref<any | null>(null); // TODO: Replace 'any' with Teacher type
const students = ref<any[]>([]); // TODO: Replace 'any' with Student type

const showDeleteModal = ref(false);
const toastMessage = ref<{ message: string; type: 'success' | 'error'; id: number } | null>(null);

const fetchClassDetails = async () => {
  isLoading.value = true;
  error.value = null;
  try {    const fetchedClass = classesStore.getClassById(classId.value);
    if (!fetchedClass) {
      // Try to fetch details from Firestore if not in store
      const classDetails = await classesStore.getClassDetails(classId.value);
      if (!classDetails) {
        throw new Error('Clase no encontrada.');
      }
      classData.value = classDetails;
    } else {
      classData.value = fetchedClass;
    }

    if (classData.value.teacherId) {
      let fetchedTeacher = teachersStore.getTeacherById(classData.value.teacherId);
      if (!fetchedTeacher) {
        await teachersStore.fetchTeachers();
        fetchedTeacher = teachersStore.getTeacherById(classData.value.teacherId);
      }
      teacher.value = fetchedTeacher;
    }

    // Ensure students are loaded if getStudentsByClass relies on it being populated
    if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents();
    }
    students.value = studentsStore.getStudentsByClass(classId.value);

  } catch (e: any) {
    error.value = e.message || 'Error al cargar los detalles de la clase.';
    console.error("Error fetching class details:", e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchClassDetails);

watch(classId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchClassDetails();
  }
});

const confirmDelete = async () => {
  if (classData.value?.id) {
    try {
      await classesStore.deleteClass(classData.value.id);
      showToastHandler('Clase eliminada con éxito', 'success');
      router.push({ name: 'Classes' });
    } catch (e: any) {
      showToastHandler(`Error al eliminar la clase: ${e.message}`, 'error');
    } finally {
      showDeleteModal.value = false;
    }
  }
};

const showToastHandler = (message: string, type: 'success' | 'error') => {
  toastMessage.value = { message, type, id: Date.now() };
  setTimeout(() => {
    toastMessage.value = null;
  }, 3000);
};

const removeToast = (id: number) => {
  if (toastMessage.value && toastMessage.value.id === id) {
    toastMessage.value = null;
  }
};

const goBack = () => {
  router.go(-1);
};

const editClass = () => {
  if (classData.value?.id) {
    router.push({ name: 'EditClass', params: { id: classData.value.id } });
  }
};

const openDeleteModal = () => {
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
};

// Helper function to get first schedule slot or null
const getFirstScheduleSlot = computed(() => {
  if (!classData.value?.schedule?.slots?.length) return null;
  return classData.value.schedule.slots[0];
});

// Calculate duration in minutes from time strings
const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 0;
  
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  return (endH * 60 + endM) - (startH * 60 + startM);
};

// Calculate hours per week based on schedule slots
const calculateWeeklyHours = computed(() => {
  if (!classData.value?.schedule?.slots?.length) return 0;
  
  const totalMinutes = classData.value.schedule.slots.reduce((total, slot) => {
    return total + calculateDuration(slot.startTime, slot.endTime);
  }, 0);
  
  return parseFloat((totalMinutes / 60).toFixed(1));
});

// Compute class summary data
const classSummaryData = computed(() => {
  if (!classData.value) return null;
  
  const firstSlot = getFirstScheduleSlot.value;
  const duration = firstSlot 
    ? calculateDuration(firstSlot.startTime, firstSlot.endTime) 
    : 0;
    
  return {
    title: classData.value.name,
    instrument: classData.value.instrument || 'No especificado',
    level: classData.value.level || 'No especificado',
    teacherName: teacher.value?.name || 'No asignado',
    dayOfWeek: firstSlot?.day ? formatDay(firstSlot.day) : 'No programado',
    startTime: firstSlot?.startTime || '--:--',
    durationMinutes: duration,
    hoursPerWeek: calculateWeeklyHours.value,
    nextSession: 'Próximamente',
    schedule: formatScheduleInfo(classData.value.schedule)
  };
});

// Helper function to format day names
const formatDay = (day: string): string => {
  const daysMap: Record<string, string> = {
    'monday': 'Lunes',
    'tuesday': 'Martes', 
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };
  return daysMap[day.toLowerCase()] || day;
};

// Define interface for schedule slot
interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

// Define interface for schedule
interface Schedule {
  slots: ScheduleSlot[];
  // Add other schedule properties if they exist
}

// Función para formatear la información de horario desde el objeto schedule
const formatScheduleInfo = (schedule: Schedule | undefined) => {
  if (!schedule?.slots?.length) {
    return { formatted: '', days: [] };
  }

  const formattedSlots = schedule.slots.map((slot: ScheduleSlot) => {
    const day = formatDay(slot.day);
    return `${day} de ${slot.startTime || '?'} a ${slot.endTime || '?'}`;
  });

  return {
    formatted: formattedSlots.join(' | '),
    days: schedule.slots.map((slot: ScheduleSlot) => ({
      day: formatDay(slot.day),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: calculateSlotDuration(slot.startTime, slot.endTime)
    }))
  };
};

// Calcular la duración en minutos entre dos horas
const calculateSlotDuration = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  
  // Convertir "HH:MM" a minutos
  const getMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
  };
  
  const startMinutes = getMinutes(startTime);
  const endMinutes = getMinutes(endTime);
  
  // Si endMinutes es menor, asumimos que cruza la medianoche
  return endMinutes >= startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
};



const teacherCardData = computed(() => teacher.value ? {
  name: teacher.value.name,
  photoUrl: teacher.value.photoURL,
  specialties: teacher.value.specialties || [],
  biography: teacher.value.biography || '',
  email: teacher.value.email || '',
  contactInfo: teacher.value.phone || ''
} : null);

const studentsCardData = computed(() => {
  if (!students.value) return [];
  return students.value.map(s => ({
    id: s.id,
    name: `${s.nombre || ''} ${s.apellido || ''}`.trim(), // Handles potential undefined names
    age: s.edad, // Assuming student object from store has 'edad' for age
    instrument: s.instrumento // Assuming student object from store has 'instrumento' for instrument
  }));
});

const addStudentToClass = () => {
  try {
    router.push({ 
      name: 'AddStudentToClass', 
      params: { classId: classId.value } 
    }).catch((error) => {
      console.error('Navigation error:', error);
      // Try an alternative route
      router.push({ 
        name: 'Students/Add', 
        query: { classId: classId.value } 
      }).catch((navError) => {
        console.error('Second navigation error:', navError);
        alert('No se puede navegar a la página para añadir estudiantes. La ruta no está configurada correctamente.');
      });
    });
  } catch (error) {
    console.error('Error navigating to add student page:', error);
  }
};

const showAddStudentInfo = () => {
  alert('Esta función será implementada próximamente. Por ahora, utilice la interfaz de administración de estudiantes para añadir nuevos estudiantes a la clase.');
};
</script>

<template>
  <div class="class-detail-view bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
    <!-- Toast Notifications -->
    <div v-if="toastMessage" class="fixed top-4 right-4 z-50">
      <Toast
        :message="toastMessage.message"
        :type="toastMessage.type"
        @dismiss="removeToast(toastMessage.id)"
      />
    </div>

    <!-- Header with breadcrumbs and actions -->
    <header class="bg-white dark:bg-gray-800 shadow-sm mb-6">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center space-x-2">
            <button @click="goBack" class="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            <nav class="flex">
              <ol class="flex items-center space-x-1">
                <li>
                  <router-link to="/" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    Inicio
                  </router-link>
                </li>
                <li>
                  <span class="text-gray-500 dark:text-gray-400 mx-1">/</span>
                </li>
                <li>
                  <router-link :to="{ name: 'Classes' }" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    Clases
                  </router-link>
                </li>
                <li>
                  <span class="text-gray-500 dark:text-gray-400 mx-1">/</span>
                </li>
                <li v-if="classData" class="text-blue-600 dark:text-blue-400 font-medium truncate max-w-[150px] sm:max-w-xs">
                  {{ classData.name }}
                </li>
                <li v-else class="text-blue-600 dark:text-blue-400 font-medium">
                  Detalles
                </li>
              </ol>
            </nav>
          </div
          >
          <div v-if="!isLoading && classData" class="flex items-center space-x-3 mt-4 sm:mt-0">
            <button @click="editClass" class="inline-flex items-center px-3.5 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Editar
            </button>
            <button @click="openDeleteModal" class="inline-flex items-center px-3.5 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ClassDetailSkeleton />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ErrorState :message="error" @retry="fetchClassDetails" />
    </div>

    <!-- Content Loaded -->
    <div v-else-if="classData" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Class Title Header -->
      <div class="mb-8 text-center sm:text-left">
        <h1 class="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
          {{ classData.name }}
        </h1>
        <p class="mt-2 flex items-center justify-center sm:justify-start text-lg text-gray-500 dark:text-gray-400">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
            {{ classData.instrument || 'Sin instrumento' }}
          </span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Nivel: {{ classData.level || 'No especificado' }}
          </span>
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column - Class & Schedule info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Class Details Card -->
          <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md">
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 005.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Información de la Clase
              </h2>
            </div>
            
            <div class="px-6 py-4">
              <div class="space-y-3">
                <div v-for="stat in stats" :key="stat.label" class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ stat.label }}</span>
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ stat.value }}</span>
                  <p class="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {{ classData.level || 'No especificado' }}
                  </p>
                </div>
                
                <div>
                  <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Horas Semanales</h3>
                  <p class="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {{ classSummaryData.hoursPerWeek > 0 ? classSummaryData.hoursPerWeek + ' hrs' : 'No especificado' }}
                  </p>
                </div>
                
                <div>
                  <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Horas Mensuales</h3>
                  <p class="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {{ classSummaryData.hoursPerWeek > 0 ? (classSummaryData.hoursPerWeek * 4) + ' hrs' : 'No especificado' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Schedule Card -->
          <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md">
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                Horario
              </h2>
            </div>
            
            <div class="px-6 py-4">
              <!-- Schedule Slots -->
              <div v-if="classSummaryData.schedule && classSummaryData.schedule.days && classSummaryData.schedule.days.length > 0" class="space-y-3">
                <div v-for="(slot, index) in classSummaryData.schedule.days" :key="index" 
                    class="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div class="min-w-[80px] h-16 bg-indigo-100 dark:bg-indigo-800 rounded-md flex flex-col items-center justify-center mr-4">
                    <span class="text-xs uppercase font-bold text-indigo-800 dark:text-indigo-300">{{ slot.day.substring(0,3) }}</span>
                    <span class="font-bold text-xl text-indigo-700 dark:text-indigo-200">{{ slot.day.substring(0,1) }}</span>
                  </div>
                  
                  <div class="flex-grow">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-900 dark:text-gray-100 font-medium">{{ slot.startTime || '?' }} - {{ slot.endTime || '?' }}</span>
                      <span class="bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-bold px-2.5 py-1 rounded-full">
                        {{ slot.duration }} min
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Clase de {{ classData.name }} - {{ classData.instrument }}
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- No Schedule Available -->
              <div v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay horario disponible</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No se ha configurado un horario específico para esta clase.
                </p>
                <div class="mt-4">
                  <button @click="editClass" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    Configurar horario
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Students List -->
          <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md">
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Estudiantes <span class="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">({{ students.length }})</span>
                </h2>
                <!-- Replace RouterLink with button -->
                <button 
                  @click="showAddStudentInfo" 
                  class="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300">
                  Añadir estudiante
                </button>
              </div>
            </div>
            
            <div class="px-6 py-4">
              <ul v-if="students.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
                <li v-for="student in studentsCardData" :key="student.id" class="py-4 flex items-center">
                  <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 mr-4">
                    {{ student.name.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {{ student.name }}
                    </p>
                    <div class="flex items-center mt-1">
                      <span v-if="student.age" class="text-xs text-gray-500 dark:text-gray-400 mr-2">
                        {{ student.age }} años
                      </span>
                      <span v-if="student.instrument" class="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                        {{ student.instrument }}
                      </span>
                    </div>
                  </div>
                  <router-link :to="{ name: 'StudentProfile', params: { id: student.id } }" class="ml-3 flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                    </svg>
                  </router-link>
                </li>
              </ul>
              
              <!-- No Students -->
              <div v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay estudiantes</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comienza añadiendo un estudiante a esta clase.
                </p>
                <div class="mt-4">
                  <router-link :to="{ name: 'AddStudentToClass', params: { classId: classId } }" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                    Añadir estudiante
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right column - Teacher info -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Teacher Card -->
          <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md">
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                Profesor
              </h2>
            </div>
            
            <div class="px-6 py-4">
              <div v-if="teacher" class="flex flex-col items-center text-center">
                <div class="relative">
                  <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-100 dark:border-amber-900">
                    <AppImage 
                      :src="teacherCardData?.photoUrl || ''"
                      :alt="`Foto de ${teacher?.name || 'profesor'}`"
                      :rounded="true"
                      img-class="w-full h-full object-cover"
                    >
                      <template #fallback>
                        <div class="w-full h-full flex items-center justify-center bg-amber-100 dark:bg-amber-800">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-amber-500 dark:text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      </template>
                    </AppImage>
                  </div>
                  <div class="absolute -bottom-1 -right-1 bg-green-400 p-1 rounded-full border-2 border-white dark:border-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <h3 class="mt-4 text-xl font-medium text-gray-900 dark:text-gray-100">{{ teacher.name }}</h3>
                
                <div v-if="teacherCardData?.specialties?.length" class="mt-1 flex flex-wrap justify-center gap-1">
                  <span v-for="(specialty, idx) in teacherCardData.specialties" :key="idx" 
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {{ specialty }}
                  </span>
                </div>
                
                <div class="mt-6 w-full space-y-3">
                  <div v-if="teacherCardData?.email" class="flex items-center border-t border-gray-200 dark:border-gray-700 pt-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ teacherCardData.email }}</span>
                  </div>
                  
                  <div v-if="teacherCardData?.contactInfo" class="flex items-center border-t border-gray-200 dark:border-gray-700 pt-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ teacherCardData.contactInfo }}</span>
                  </div>
                </div>
                
                <div class="mt-6 w-full">
                  <router-link :to="{ name: 'TeacherDetail', params: { id: teacher.id } }" class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 transition-colors">
                    Ver perfil completo
                  </router-link>
                </div>
              </div>
              
              <!-- No Teacher Assigned -->
              <div v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Sin profesor asignado</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Esta clase aún no tiene un profesor asignado.
                </p>
                <div class="mt-4">
                  <button @click="editClass" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700">
                    Asignar profesor
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Stats Card -->
          <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md">
            <div class="px-6 py-4">
              <div class="space-y-3">
                <button @click="editClass" class="w-full flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Editar información
                </button>
                
                <router-link :to="{ name: 'AddStudentToClass', params: { classId: classId } }" class="w-full flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Añadir estudiante
                </router-link>
                
                <button @click="openDeleteModal" class="w-full flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  Eliminar clase
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationDialog
      :show="showDeleteModal"
      title="Confirmar Eliminación"
      message="¿Estás seguro de que quieres eliminar esta clase? Esta acción no se puede deshacer y afectará a todos los estudiantes inscritos."
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    >
      <template #default>
        <p>Esta acción no se puede deshacer.</p>
      </template>
    </DeleteConfirmationDialog>
  </div>
</template>

<style scoped>
/* Remove the current max-width restriction to use Tailwind's built-in sizing */
.class-detail-view {
  max-width: 100%;
  margin: 0 auto;
}

/* Remove the class-content-grid defined style as we're using Tailwind's grid system */
.class-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .class-content-grid {
    grid-template-columns: 2fr 1fr;
  }
}

/* Transitions for theme switching and hover effects */
.transition-colors {
  transition: background-color 0.3s ease, color 0.3s ease;
}

.transition-all {
  transition: all 0.3s ease;
}
</style>