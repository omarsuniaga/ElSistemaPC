<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClassesStore } from '../store/classes';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useStudentsStore } from '../../Students/store/students';
import type { ClassData } from '../types/class'; // Assuming ClassData is correctly typed

// Import UI components (ensure these paths are correct and components exist)
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
      router.push({ name: 'ClassList' });
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

// Compute classroom data
const classSummaryData = computed(() => classData.value ? {
  title: classData.value.name,
  instrument: classData.value.instrument,
  level: classData.value.level,
  teacherName: teacher.value?.name || 'No asignado',
  dayOfWeek: classData.value.dayOfWeek || '',
  startTime: classData.value.startTime || '',
  durationMinutes: classData.value.durationMinutes,
  hoursPerWeek: classData.value.hoursPerWeek || calculateHoursPerWeek(),
  nextSession: classData.value.nextSession || '',
  // Extraer información de horario del objeto schedule si existe
  schedule: formatScheduleInfo(classData.value.schedule)
} : {});

// Función para formatear la información de horario desde el objeto schedule
const formatScheduleInfo = (schedule) => {
  if (!schedule || !schedule.slots || schedule.slots.length === 0) {
    return { formatted: '', days: [] };
  }

  // Mapear días para mostrarlos de forma legible
  const daysMap = {
    'monday': 'Lunes',
    'tuesday': 'Martes', 
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };

  const formattedSlots = schedule.slots.map(slot => {
    const day = daysMap[slot.day.toLowerCase()] || slot.day;
    return `${day} de ${slot.startTime || '?'} a ${slot.endTime || '?'}`;
  });

  return {
    formatted: formattedSlots.join(' | '),
    days: schedule.slots.map(slot => ({
      day: daysMap[slot.day.toLowerCase()] || slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: calculateSlotDuration(slot.startTime, slot.endTime)
    }))
  };
};

// Calcular la duración en minutos entre dos horas
const calculateSlotDuration = (startTime, endTime) => {
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

// Calculate hours per week if not provided directly
const calculateHoursPerWeek = () => {
  if (!classData.value) return 0;
  
  // If weekly hours is stored directly, use it
  if (classData.value.hoursPerWeek) return classData.value.hoursPerWeek;
  
  // Try to calculate from schedule if available
  if (classData.value.schedule?.slots && classData.value.schedule.slots.length > 0) {
    const totalMinutesPerWeek = classData.value.schedule.slots.reduce((total, slot) => {
      return total + calculateSlotDuration(slot.startTime, slot.endTime);
    }, 0);
    
    return (totalMinutesPerWeek / 60).toFixed(1);
  }
  
  // Otherwise calculate from sessions if available
  if (classData.value.durationMinutes && classData.value.sessionsPerWeek) {
    return ((classData.value.durationMinutes * classData.value.sessionsPerWeek) / 60).toFixed(1);
  }
  
  // Default fallback
  return 0;
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
</script>

<template>
  <div class="class-detail-view p-2  bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
    <!-- Toast Notifications -->
    <div v-if="toastMessage" class="fixed top-4 right-4 z-50">
      <Toast
        :message="toastMessage.message"
        :type="toastMessage.type"
        @dismiss="removeToast(toastMessage.id)"
      />
    </div>

    <!-- Header -->
    <header class="mb-6">
      <button @click="goBack" class="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-flex items-center">
        &lt; Volver a Clases
      </button>      <div class="flex items-center">
        <h1 v-if="classData" class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ classData.name }}</h1>
        <h1 v-else-if="!isLoading" class="text-3xl font-bold text-gray-800 dark:text-gray-100">Detalle de Clase</h1>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-4">
      <ClassDetailSkeleton />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mt-4">
      <ErrorState :message="error" @retry="fetchClassDetails" />
    </div>

    <!-- Content Loaded - Improved Layout -->
    <div v-else-if="classData" class="max-w-5xl mx-auto">
      <div class="class-content-grid">
        <!-- Class Details Card -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow overflow-hidden">
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Información de la Clase</h2>
          
          <!-- Main Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            
            <!-- Left Column - Class Details -->
            <div class="space-y-6">
              <!-- Basic Class Info -->
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Datos Generales</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Instrumento</p>
                    <p class="text-gray-800 dark:text-gray-200">{{ classData.instrument || 'No especificado' }}</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Nivel</p>
                    <p class="text-gray-800 dark:text-gray-200">{{ classData.level || 'No especificado' }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Schedule Info - Highlighted Section -->
              <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border-l-4 border-blue-500 dark:border-blue-600">
                <h3 class="text-lg font-medium text-blue-700 dark:text-blue-300 mb-3">Información de Horario</h3>
                
                <!-- If schedule is available in slots -->
                <div v-if="classSummaryData.schedule && classSummaryData.schedule.days && classSummaryData.schedule.days.length > 0" 
                    class="space-y-3">
                  <div v-for="(slot, index) in classSummaryData.schedule.days" :key="index" 
                      class="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-gray-800 dark:text-gray-200">{{ slot.day }}</span>
                      <span class="text-sm bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {{ slot.duration }} min
                      </span>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {{ slot.startTime || '?' }} - {{ slot.endTime || '?' }}
                    </div>
                  </div>
                </div>
                
                <!-- If no schedule is available -->
                <div v-else class="space-y-4">
                  <div class="p-3 bg-white dark:bg-gray-700 rounded-md">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Horario</p>
                    <p class="text-gray-800 dark:text-gray-200">
                      <span class="italic text-gray-500 dark:text-gray-400">No hay detalles disponibles</span>
                    </p>
                  </div>
                  
                  <div class="p-3 bg-white dark:bg-gray-700 rounded-md">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Duración por Sesión</p>
                    <p class="text-gray-800 dark:text-gray-200">
                      <span v-if="classData.durationMinutes">{{ classData.durationMinutes }} minutos</span>
                      <span v-else class="italic text-gray-500 dark:text-gray-400">No especificada</span>
                    </p>
                  </div>
                </div>
                  <!-- Hours Summary - Always Visible -->
                <div class="mt-4 bg-blue-100 dark:bg-blue-800/40 p-3 rounded-md">
                  <div class="grid grid-cols-2 gap-4">
                    <!-- Weekly Hours -->
                    <div>
                      <p class="text-sm font-medium text-blue-700 dark:text-blue-300">Horas Semanales</p>
                      <p class="text-lg font-semibold text-blue-800 dark:text-blue-200">
                        {{ classSummaryData.hoursPerWeek > 0 ? classSummaryData.hoursPerWeek + ' hrs' : 'No especificado' }}
                      </p>
                    </div>
                    <!-- Monthly Hours -->
                    <div>
                      <p class="text-sm font-medium text-blue-700 dark:text-blue-300">Horas Mensuales</p>
                      <p class="text-lg font-semibold text-blue-800 dark:text-blue-200">
                        {{ classSummaryData.hoursPerWeek > 0 ? (classSummaryData.hoursPerWeek * 4) + ' hrs' : 'No especificado' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Right Column - Teacher Info -->
            <div>
              <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Profesor</h3>
              <div v-if="teacher" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <div class="flex items-center space-x-4">
                  <img v-if="teacherCardData?.photoUrl" :src="teacherCardData.photoUrl" alt="Foto del Profesor" 
                    class="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600">
                  <div v-else class="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xl font-medium text-gray-800 dark:text-gray-100">{{ teacher.name || 'Profesor no asignado' }}</p>
                    <p v-if="teacherCardData?.specialties && teacherCardData.specialties.length" class="text-sm text-gray-600 dark:text-gray-400">
                      {{ teacherCardData.specialties.join(', ') }}
                    </p>
                  </div>
                </div>
                <div v-if="teacherCardData?.email" class="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <span class="font-medium">Email:</span> {{ teacherCardData.email }}
                </div>
                <div v-if="teacherCardData?.contactInfo" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span class="font-medium">Contacto:</span> {{ teacherCardData.contactInfo }}
                </div>
              </div>
              <div v-else class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <p class="text-gray-500 dark:text-gray-400">Profesor no asignado</p>
              </div>
              
              <!-- Class Stats -->
              <div class="mt-6 grid grid-cols-2 gap-3">
                <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-center">
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ students.length }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Estudiantes</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-center">
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ classSummaryData.hoursPerWeek > 0 ? classSummaryData.hoursPerWeek : '-' }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Horas/Semana</p>
                </div>
              </div>
            </div>
          </div>
        </div>
          <!-- Students List Card -->
        <StudentsCard 
          :students="studentsCardData" 
          :class-id="classId"
          :class-name="classData?.name || ''"
          :teacher-name="teacher?.name || 'No asignado'"
          :weekly-hours="Number(classSummaryData.hoursPerWeek) || 0"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationDialog
      :show="showDeleteModal"
      title="Confirmar Eliminación"
      message="¿Estás seguro de que quieres eliminar esta clase? Esta acción no se puede deshacer."
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<style scoped>
.class-detail-view {
  max-width: 80%;
  margin: 0 auto;
}

.class-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Transitions for theme switching */
.transition-colors {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Add hover effects for interactive elements */
.bg-white:not(button), .bg-gray-50:not(button), .bg-blue-50:not(button) {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bg-white:not(button):hover, .bg-gray-50:not(button):hover, .bg-blue-50:not(button):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>