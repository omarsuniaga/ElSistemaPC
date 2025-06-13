<script setup lang="ts">
import { ref, computed, onMounted, watch, provide, type FunctionalComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useClassesStore } from '../../Classes/store/classes';
import { useTeachersStore } from '../store/teachers';
import { useStudentsStore } from '../../Students/store/students';
import { useAuthStore } from '../../../stores/auth';
import { useToast } from '../../../components/ui/toast/use-toast';
import {
  CalendarIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarSquareIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/vue/24/outline';
import { Dialog, DialogPanel, DialogOverlay, TransitionRoot, TransitionChild } from '@headlessui/vue';

// Import components used in the template
import TeacherDashboardHeader from '../components/TeacherDashboardHeader.vue';
import DashboardMetricsSection from '../components/DashboardMetricsSection.vue';
import TodaysClassesSection from '../components/TodaysClassesSection.vue'; // Self-contained component for "Clases Hoy"
import AusentesSection from '../components/AusentesSection.vue'; // Component for "Ausentes" tab
import ObservacionesSection from '../components/ObservacionesSection.vue'; // Component for "Observaciones" tab
import TeacherClassesSection from '../components/TeacherClassesSection.vue'; // Component for "Mis Clases"
import NotificationsSection from '../components/NotificationsSection.vue'; // Self-contained component for "Notificaciones" tab

// Import existing components used in modals
import ClassForm from '../../Classes/components/ClassForm.vue';
import ClassStudentManager from '../../Classes/components/ClassStudentManager.vue';

// Import collaboration composable
import { useTeacherCollaboration } from '../../Classes/composables/useTeacherCollaboration';

// Stores and Router
const router = useRouter();
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();
const { toast } = useToast();

// Teacher collaboration composable for handling shared classes
const { 
  myClasses: allTeacherClasses, 
  fetchMyClasses, 
  leadClasses, 
  assistantClasses,
  isLoading: collaborationLoading 
} = useTeacherCollaboration();

// State
const loading = ref(true);
const activeTab = ref('classes'); // 'overview', 'schedule'(Ausentes), 'classes', 'upcoming'(Observaciones)
const selectedClassId = ref('');
const showForm = ref(false);
const showStudentManager = ref(false);
const isEditing = ref(false);

// Teacher identification
const currentTeacherId = ref(''); // Will hold the ID from the teachers store or auth UID
const currentTeacher = ref<any>(null); // Will hold the teacher object from the teachers store

// Provide currentTeacherId to child components
provide('currentTeacherId', currentTeacherId);

// Computed properties
const teacherClasses = computed(() => {
  // Use collaboration composable data which includes both lead and assistant classes
  if (!Array.isArray(allTeacherClasses.value)) {
    console.warn("allTeacherClasses is not an array", allTeacherClasses.value);
    return [];
  }
  return allTeacherClasses.value;
});

const selectedClass = computed(() => {
  if (!selectedClassId.value) return null;
  if (!Array.isArray(allTeacherClasses.value)) {
    return null;
  }
  return allTeacherClasses.value.find(c => c.id === selectedClassId.value) || null;
});

// Métricas para el dashboard (simplificadas)
const dashboardMetrics = computed(() => {
  const classes = teacherClasses.value;
  const totalStudents = classes.reduce((acc, curr) => {
    return acc + (curr.studentIds?.length || 0);
  }, 0);

  const totalHours = classes.reduce((acc, curr) => {
    if (!curr.schedule?.slots || !Array.isArray(curr.schedule.slots)) return acc;

    return acc + curr.schedule.slots.reduce((slotAcc, slot) => {
       if (!slot.startTime || !slot.endTime) return slotAcc;
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const durationMinutes = endMinutes - startMinutes;
      return slotAcc + durationMinutes / 60;
    }, 0);
  }, 0);

  // Separar clases principales de compartidas para métricas
  const leadClassesCount = leadClasses.value.length;
  const assistantClassesCount = assistantClasses.value.length;

  return [
    {
      title: 'Clases Principales',
      value: leadClassesCount,
      icon: BookOpenIcon as FunctionalComponent,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    },
    {
      title: 'Clases Compartidas',
      value: assistantClassesCount,
      icon: BookOpenIcon as FunctionalComponent,
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    },
    {
      title: 'Total Estudiantes',
      value: totalStudents,
      icon: UserGroupIcon as FunctionalComponent,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    },
    {
      title: 'Horas Semanales',
      value: Math.round(totalHours * 10) / 10,
      icon: ClockIcon as FunctionalComponent,
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    }
  ];
});

// --- Helper functions for sorting classes by day ---
// Mapping from day name/number to numeric day index (0-6 for getDay)
const getDayIndex = (dayValue: any): number => {
    const dayMapping: { [key: string | number]: number } = {
        'domingo': 0, 'dom': 0, 'sunday': 0, 'sun': 0, '0': 0,
        'lunes': 1, 'lun': 1, 'monday': 1, 'mon': 1, '1': 1,
        'martes': 2, 'mar': 2, 'tuesday': 2, 'tue': 2, '2': 2,
        'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3, 'wednesday': 3, 'wed': 3, '3': 3,
        'jueves': 4, 'jue': 4, 'thursday': 4, 'thu': 4, '4': 4,
        'viernes': 5, 'vie': 5, 'friday': 5, 'fri': 5, '5': 5,
        'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6, 'saturday': 6, 'sat': 6, '6': 6,
    };
    return dayMapping[typeof dayValue === 'string' ? dayValue.toLowerCase().trim() : dayValue] ?? -1;
};

const getCurrentDayIndex = () => new Date().getDay();
const currentDayIndex = ref(getCurrentDayIndex());

const getDistanceFromTodayIndex = (dayIndex: number): number => {
  const today = currentDayIndex.value;
  return (dayIndex - today + 7) % 7;
};

// Clases ordenadas comenzando desde el día actual de la semana (Used in Classes tab)
const sortedTeacherClasses = computed(() => {
  if (!teacherClasses.value.length) return [];

  return [...teacherClasses.value].sort((a, b) => {
    const aFirstSlotDay = a.schedule?.slots?.[0]?.day;
    const bFirstSlotDay = b.schedule?.slots?.[0]?.day;

    const dayIndexA = aFirstSlotDay !== undefined ? getDayIndex(aFirstSlotDay) : -1;
    const dayIndexB = bFirstSlotDay !== undefined ? getDayIndex(bFirstSlotDay) : -1;

    if (dayIndexA === -1 && dayIndexB === -1) return 0;
    if (dayIndexA === -1) return 1;
    if (dayIndexB === -1) return -1;

    const distanceA = getDistanceFromTodayIndex(dayIndexA);
    const distanceB = getDistanceFromTodayIndex(dayIndexB);

    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }

    const startTimeA = a.schedule?.slots?.[0]?.startTime || '00:00';
    const startTimeB = b.schedule?.slots?.[0]?.startTime || '00:00';
    return startTimeA.localeCompare(startTimeB);
  });
});


// --- Helper Functions (General Utility) ---
function getNextClassDate(dayValue: string | number, time: string): Date {
  const today = new Date();
  const currentDay = today.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6

  const targetDay = getDayIndex(dayValue);

  if (targetDay === -1) {
    console.error("Invalid day value in getNextClassDate:", dayValue);
    return new Date(today.getFullYear() + 10, 0, 1); // Return date far in future
  }

  let daysUntilClass = (targetDay - currentDay + 7) % 7;

  const classDate = new Date(today);
  classDate.setDate(today.getDate() + daysUntilClass);

  const [hours, minutes] = time.split(':').map(Number);
  classDate.setHours(hours, minutes, 0, 0);

  // If the class is scheduled for today but the time has already passed, add 7 days
  const now = new Date();
  if (daysUntilClass === 0 && classDate < now) {
    classDate.setDate(classDate.getDate() + 7);
  }

  return classDate;
}

function getNextSession(classItem: any): Date { // Define classItem type if possible
  const now = new Date();
  let closestDate = new Date();
  closestDate.setDate(closestDate.getDate() + 365); // Initialize with a date far in the future

  if (classItem.schedule?.slots && Array.isArray(classItem.schedule.slots)) {
    classItem.schedule.slots.forEach((slot: { day: string | number; startTime: string; }) => { // Define slot type
       if (slot.day !== undefined && slot.startTime) {
          const slotDate = getNextClassDate(slot.day, slot.startTime);
          if (slotDate >= now && slotDate < closestDate) {
            closestDate = slotDate;
          }
       }
    });
  }
  return closestDate;
}

const formatDateTime = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Fecha inválida';
  }
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Function helper to clean data (used by save handler)
function cleanData(obj: any): any {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    if (Array.isArray(value) && value.length === 0) {
       // Keep empty arrays for studentIds or schedule slots if necessary for schema
       if (key === 'studentIds' || (key === 'schedule' && Array.isArray(value))) {
            cleaned[key] = value;
       }
       return;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedValue = cleanData(value);
      if (Object.keys(cleanedValue).length > 0) {
        cleaned[key] = cleanedValue;
      } else if (key === 'schedule' && value.slots !== undefined) { // Special handling for schedule
          // If schedule object was present but has no slots after cleaning, keep it with empty slots array
          cleaned[key] = { slots: [] };
      }
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
}


// --- Handlers (Methods triggered by events from children or directly) ---
const handleCollaborationUpdated = async () => {
  // Recargar las clases cuando se actualiza una colaboración
  await fetchMyClasses();
  console.log('Colaboración actualizada, clases recargadas');
};

const handleAddClass = () => {
  isEditing.value = false;
  selectedClassId.value = '';
  showForm.value = true;
};

const handleViewClass = (classId: string) => {
  selectedClassId.value = classId;
  activeTab.value = 'classes'; // Switch to classes tab to show the specific class card if needed
  // You might want to scroll to the selected card or highlight it in TeacherClassesSection
};

const handleEditClass = (classId: string) => {
  selectedClassId.value = classId;
  isEditing.value = true;
  showForm.value = true;
};

const handleDeleteClass = async (classId: string) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta clase?')) {
    try {
      // Determine the correct delete/remove method based on your store
      if (typeof classesStore.removeClass === 'function') {
        await classesStore.removeClass(classId);
      } else if (typeof classesStore.deleteClass === 'function') {
        await classesStore.deleteClass(classId);
      } else if (typeof classesStore.updateClass === 'function') {
         // Assuming updateClass can mark as inactive
         await classesStore.updateClass(classId, { status: 'inactive' });
      }
      else {
        console.error('No suitable method found in classesStore to delete/remove/update class.');
        throw new Error('Failed to delete class: Store method not available.');
      }

      toast({
        title: "Clase Eliminada",
        description: "La clase ha sido eliminada exitosamente."
      });

      // Deselect if the deleted class was selected
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

const handleManageStudents = (classId: string) => {
  selectedClassId.value = classId;
  showStudentManager.value = true;
};

const handleSaveClass = async (classData: any) => { // Define classData type
  try {
    if (!classData.name || !classData.level) {
      toast({ title: "Error", description: "El nombre y nivel son obligatorios", variant: "destructive" });
      return;
    }

    if (!currentTeacherId.value) {
       toast({ title: "Error", description: "No se pudo determinar el maestro actual.", variant: "destructive" });
       return;
    }
    classData.teacherId = currentTeacherId.value;

    const preparedData = cleanData(classData);

    if (isEditing.value) {
      if (!selectedClassId.value) {
          console.error("Error: No selected class ID for editing.");
           toast({ title: "Error", description: "No se pudo determinar la clase a editar.", variant: "destructive" });
           return;
      }
      await classesStore.updateClass(selectedClassId.value, preparedData); // Assuming updateClass takes id and data
      toast({ title: "Clase Actualizada", description: `La clase "${preparedData.name}" ha sido actualizada exitosamente.` });
    } else {
      const newClass = await classesStore.addClass(preparedData);
      toast({ title: "Clase Creada", description: `La clase "${preparedData.name}" ha sido creada exitosamente.` });
      selectedClassId.value = newClass.id; // Optional: Auto-select the new class
    }
    showForm.value = false;
  } catch (error) {
    console.error('Error al guardar la clase:', error);
    toast({ title: "Error", description: "No se pudo guardar la clase. Intente nuevamente.", variant: "destructive" });
  }
};

const handleStudentChange = async (studentIds: string[]) => { // Define type for studentIds
  if (!selectedClassId.value) {
      console.error("Error: No selected class ID for student management.");
      toast({ title: "Error", description: "No se pudo determinar la clase para actualizar estudiantes.", variant: "destructive" });
      showStudentManager.value = false;
      return;
  }

  try {
    const validStudentIds = Array.isArray(studentIds) ? studentIds : [];

    await classesStore.updateClass(selectedClassId.value, {
      studentIds: validStudentIds
    });

    toast({
      title: "Estudiantes Actualizados",
      description: "La lista de estudiantes ha sido actualizada exitosamente."
    });
    showStudentManager.value = false;
  } catch (error) {
    console.error('Error al actualizar estudiantes:', error);
    toast({ title: "Error", description: "No se pudieron actualizar los estudiantes. Intente nuevamente.", variant: "destructive" });
  }
};

// Handler for taking attendance (USES ROUTER)
const handleTakeAttendance = (classId: string) => {
  const today = new Date();
  // Format date as YYYYMMDD
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const dateString = `${year}${month}${day}`;

  // Navigate to the attendance route
  router.push({
    name: 'attendance', // Make sure you have a route named 'attendance' with params { date, classId }
    params: {
      date: dateString,
      classId: classId
    }
  }).catch(err => {
      console.error('Error navigating to attendance route:', err);
      toast({
          title: "Error de navegación",
          description: "No se pudo abrir la página de asistencia.",
          variant: "destructive"
      });
  });
};


// --- Data Loading and Watching ---
onMounted(async () => {
  loading.value = true;
  try {
    console.log('🔄 Iniciando carga de datos...');
    const promises: Promise<any>[] = [];

    // 1. Fetch teachers first to get current teacher ID
    if (teachersStore && typeof teachersStore.fetchTeachers === 'function') {
      await teachersStore.fetchTeachers();
      // Find the teacher ID based on auth UID
      if (authStore.user?.uid) {
        // Assuming fetchTeacherByAuthUid exists and returns teacher object or null
        const teacher = await teachersStore.fetchTeacherByAuthUid(authStore.user.uid);
        if (teacher) {
          currentTeacherId.value = teacher.id; // Use teacher ID from store
          currentTeacher.value = teacher;
        } else {
          console.warn('⚠️ No teacher found with auth UID:', authStore.user.uid, 'Using UID as fallback.');
          currentTeacherId.value = authStore.user.uid; // Fallback to auth UID
        }
      } else {
        console.warn('⚠️ No authenticated user found.');
        // Optionally set a default or handle unauthenticated state
      }    } else {
      console.warn('⚠️ teachersStore or its fetch method not available.');
      // If teacher store is crucial, you might want to stop here or show an error
    }

    // 2. Fetch teacher's classes using collaboration composable (includes shared classes)
    await fetchMyClasses();

    // 3. Fetch students (can run in parallel)
    if (studentsStore && typeof studentsStore.fetchStudents === 'function') {
      promises.push(studentsStore.fetchStudents());
    } else { console.warn('⚠️ studentsStore or its fetchStudents method not available.'); }

    await Promise.all(promises.filter(p => p !== undefined)); // Filter out any undefined promises

    console.log(`✅ Datos cargados. Clases del profesor (${currentTeacherId.value}): ${teacherClasses.value.length}`);
    console.log(`📋 Clases donde es encargado: ${leadClasses.value.length}`);
    console.log(`🤝 Clases compartidas (asistente): ${assistantClasses.value.length}`);

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

// Watch for changes in currentTeacherId or explicit class store sync
watch([currentTeacherId, () => classesStore.lastSync], async ([newTeacherId], [oldTeacherId]) => {
    if (newTeacherId && newTeacherId !== oldTeacherId) {
        console.log('🔄 Teacher ID changed. Re-fetching classes.');
         try {
             if (classesStore && (typeof classesStore.forceSync === 'function' || typeof classesStore.fetchClasses === 'function')) {
                await (classesStore.forceSync ? classesStore.forceSync() : classesStore.fetchClasses());
                console.log('✅ Re-fetched classes.');
             } else {
                console.warn('⚠️ classesStore or its fetch method not available for re-fetch.');
             }
         } catch (error) {
             console.error('❌ Error re-fetching classes:', error);
         }
    }
     // Also re-calculate current day for sorting on mount/watch
    currentDayIndex.value = getCurrentDayIndex();
}, { immediate: true }); // Run immediately on mount


// Watch to reset selectedClassId if the selected class is deleted or teacher changes
watch([selectedClassId, teacherClasses], ([newSelectedId], [_, newTeacherClasses]) => {
    if (newSelectedId && !newTeacherClasses.some((c: any) => c.id === newSelectedId)) {
        selectedClassId.value = '';
        showForm.value = false; // Close modal if selected class is deleted
        showStudentManager.value = false;
    }
}, { deep: false }); // No need for deep watch on teacherClasses, just check existence


const setActiveTab = (tab: string) => {
    activeTab.value = tab;
};

</script>

<template>
  <div class="teacher-dashboard">
    <!-- Header and Tabs Component -->
    <TeacherDashboardHeader
      :active-tab="activeTab"
      @set-active-tab="setActiveTab"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <!-- Content Sections (Conditional) -->
    <section v-else class="dashboard-content space-y-4 md:space-y-6">

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-4 md:space-y-6">
        <!-- Metrics Component -->
        <DashboardMetricsSection
          :metrics="dashboardMetrics"
        />        <!-- Todays Classes Component (Self-contained) -->
        <!-- <TodaysClassesSection /> -->
      </div>      <!-- Ausentes Tab (NEW Section Component) -->
      <AusentesSection
        v-if="activeTab === 'schedule'"
      />      <!-- Notificaciones Tab (Self-contained Component) -->
      <NotificationsSection
        v-if="activeTab === 'notifications'"
      />      <!-- Mis Clases Tab (UPDATED Section Component) -->
      <!-- Este componente utiliza el nuevo TeacherClassesCard con soporte para viewMode (tarjeta/lista) -->
      <!-- Esta vista reemplaza la página separada de "Clases" que se ha eliminado del menú principal -->
      <TeacherClassesSection
        v-if="activeTab === 'classes'"
        :classes="sortedTeacherClasses"
        @add-class="handleAddClass"
        @view-class="handleViewClass"
        @edit-class="handleEditClass"
        @delete-class="handleDeleteClass"
        @manage-students="handleManageStudents"
        @collaboration-updated="handleCollaborationUpdated"
      />      <!-- Observaciones Tab (NEW Section Component) -->
       <ObservacionesSection
         v-if="activeTab === 'upcoming'"
         :classes="teacherClasses"
       />

    </section>

    <!-- Modal for Class Form -->
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

          <span class="inline-block h-screen align-middle" aria-hidden="true">​</span>

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
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">{{ isEditing ? 'Editar Clase' : 'Nueva Clase' }}</h2>
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

    <!-- Modal for Student Manager -->
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

          <span class="inline-block h-screen align-middle" aria-hidden="true">​</span>

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
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Gestionar Estudiantes - {{ selectedClass?.name }}</h2>
              <ClassStudentManager
                :class-id="selectedClass?.id || ''"
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
  padding: 1rem;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Slightly reduced gap for mobile */
}

/* Responsive padding for header */
@media (min-width: 768px) {
  .teacher-dashboard {
    padding: 1.5rem;
  }
   .dashboard-content {
    gap: 1.5rem;
  }
}
</style>