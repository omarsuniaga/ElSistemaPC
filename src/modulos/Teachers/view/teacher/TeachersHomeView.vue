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
  ChartBarSquareIcon,
  Squares2X2Icon // Add this new icon for dashboard
} from '@heroicons/vue/24/outline';
import { useToast } from '../../../../components/ui/toast/use-toast';
import { useRouter } from 'vue-router'; // Add router import if it's not already there

// Import new components
import TeacherMobileHeader from '../../components/TeacherMobileHeader.vue';
import TeacherMobileSideMenu from '../../components/TeacherMobileSideMenu.vue';
import TeacherDesktopHeader from '../../components/TeacherDesktopHeader.vue';
import TeacherNotificationsTab from '../../components/TeacherNotificationsTab.vue';
import TeacherScheduleTab from '../../components/TeacherScheduleTab.vue';
import TeacherClassesTab from '../../components/TeacherClassesTab.vue';
import TeacherUpcomingTab from '../../components/TeacherUpcomingTab.vue';
import TeacherClassFormModal from '../../components/TeacherClassFormModal.vue';
import TeacherStudentManagerModal from '../../components/TeacherStudentManagerModal.vue';
import AbsenceAlertList from '../../../../components/AbsenceAlertList.vue';

// Import types
import type {
  ClassData,
  ClassScheduleSlot,
  AbsenceAlertListExposed,
  Notification // Import Notification type
} from '../../types/teacherTypes';

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();
const { toast } = useToast();

// Add router
const router = useRouter();

// Estados
const loading = ref(true);
const activeTab = ref('classes'); // Default tab
const selectedClassId = ref('');
const showForm = ref(false);
const showStudentManager = ref(false);
const isEditing = ref(false);
const showMobileMenu = ref(false);

// Configuración para navegación móvil
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

// Order of days
const DAYS_ORDER = { 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6, 'Dom': 7 };

// Estructura de navegación para footer móvil
const navigationItems = computed(() => [
  { id: 'classes', name: 'Clases', icon: BookOpenIcon, active: activeTab.value === 'classes' },
  { id: 'overview', name: 'Panel', icon: ChartBarSquareIcon, active: activeTab.value === 'overview' },
  { id: 'schedule', name: 'Horario', icon: CalendarIcon, active: activeTab.value === 'schedule' },
  { id: 'upcoming', name: 'Próximas', icon: ClockIcon, active: activeTab.value === 'upcoming' },
  { id: 'dashboard', name: 'Dashboard', icon: Squares2X2Icon, active: activeTab.value === 'dashboard' }
]);

const currentTeacherId = computed(() => authStore.user?.uid || '');

const teacherClasses = computed(() => {
  return classesStore.classes.filter(classItem => classItem.teacherId === currentTeacherId.value);
});

const selectedClass = computed(() => {
  if (!selectedClassId.value) return null;
  const foundClass = classesStore.getClassById(selectedClassId.value);
  return foundClass || null; // Convert undefined to null if class not found
});

// Sort classes function
const sortClasses = (classes: ClassData[]): ClassData[] => {
  return [...classes].sort((a: ClassData, b: ClassData) => {
    const slotA = a.schedule?.slots?.[0] || {} as ClassScheduleSlot;
    const slotB = b.schedule?.slots?.[0] || {} as ClassScheduleSlot;
    const dayA = (slotA.day?.slice(0, 3) || '') as keyof typeof DAYS_ORDER;
    const dayB = (slotB.day?.slice(0, 3) || '') as keyof typeof DAYS_ORDER;
    const dayOrderA = DAYS_ORDER[dayA] || 0;
    const dayOrderB = DAYS_ORDER[dayB] || 0;
    if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;
    const timeA = new Date(`1970-01-01T${slotA.startTime || '00:00'}`).getTime();
    const timeB = new Date(`1970-01-01T${slotB.startTime || '00:00'}`).getTime();
    return timeA - timeB;
  });
}

const sortedClasses = computed(() => sortClasses(teacherClasses.value));

// Métricas para el dashboard
const dashboardMetrics = computed(() => {
  const classes = teacherClasses.value;
  const totalStudents = classes.reduce((acc, curr) => acc + (curr.studentIds?.length || 0), 0);
  const totalHours = classes.reduce((acc, curr) => {
    if (!curr.schedule?.slots) return acc;
    return acc + curr.schedule.slots.reduce((slotAcc, slot) => {
      if (!slot.startTime || !slot.endTime) return slotAcc;
      const startTime = slot.startTime.split(':').map(Number);
      const endTime = slot.endTime.split(':').map(Number);
      const hours = endTime[0] - startTime[0];
      const minutes = endTime[1] - startTime[1];
      return slotAcc + hours + (minutes / 60);
    }, 0);
  }, 0);
  const classesToday = upcomingClasses.value.filter(c => {
        const nextSession = getNextSession(c);
        const today = new Date();
        return nextSession.getDate() === today.getDate() &&
               nextSession.getMonth() === today.getMonth() &&
               nextSession.getFullYear() === today.getFullYear();
    }).length;

  return [
    { title: 'Clases Asignadas', value: classes.length, icon: BookOpenIcon, color: 'bg-blue-100 text-blue-800' },
    { title: 'Total Estudiantes', value: totalStudents, icon: UserGroupIcon, color: 'bg-purple-100 text-purple-800' },
    { title: 'Horas Semanales', value: Math.round(totalHours * 10) / 10, icon: ClockIcon, color: 'bg-green-100 text-green-800' },
    { title: 'Clases Hoy', value: classesToday, icon: CalendarIcon, color: 'bg-amber-100 text-amber-800' }
  ];
});

// Funciones auxiliares de fecha
function getNumericDay(dayName: string): number {
    const daysMap: { [key: string]: number } = {
        'Dom': 0, 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6
    };
    // Handle full names or abbreviations
    const key = dayName?.slice(0, 3) as keyof typeof daysMap;
    return daysMap[key] !== undefined ? daysMap[key] : -1; // Return -1 if day is invalid
}

function getNextClassDate(day: string | undefined, time: string | undefined): Date {
  const targetDay = getNumericDay(day || '');
  const timeStr = time || '00:00';

  if (targetDay === -1) {
      // Handle invalid day - return a date far in the future or throw an error
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      return futureDate;
  }

  const today = new Date();
  const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
  let daysUntilClass = (targetDay - currentDay + 7) % 7;

  const classDate = new Date(today);
  classDate.setDate(today.getDate() + daysUntilClass);

  const [hours, minutes] = timeStr.split(':').map(Number);
  classDate.setHours(hours, minutes, 0, 0);

  // If the class is today but the time has already passed, calculate for next week
  if (daysUntilClass === 0 && classDate < today) {
    classDate.setDate(classDate.getDate() + 7);
  }

  return classDate;
}

function getNextSession(classItem: ClassData): Date {
  const now = new Date();
  let closestDate = new Date(8640000000000000); // Max Date far in the future

  if (classItem.schedule?.slots) {
    classItem.schedule.slots.forEach((slot: ClassScheduleSlot) => {
      const slotDate = getNextClassDate(slot.day, slot.startTime);
      // Check if slotDate is valid before comparison
       if (slotDate.getFullYear() < 2100 && slotDate >= now && slotDate < closestDate) {
           closestDate = slotDate;
       }
    });
  }
  // If no valid future slot found, return the far future date
  return closestDate.getFullYear() > 2100 ? closestDate : closestDate;
}


// Próximas clases (próximas 7 días)
const upcomingClasses = computed(() => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    return teacherClasses.value
        .map(classItem => ({
            ...classItem,
            nextSession: getNextSession(classItem)
        }))
        .filter(classItem => {
             // Filter out classes with invalid nextSession date (far future date)
             return classItem.nextSession.getFullYear() < 2100 &&
                    classItem.nextSession >= now &&
                    classItem.nextSession <= nextWeek;
         })
        .sort((a, b) => a.nextSession.getTime() - b.nextSession.getTime());
});


// Notificaciones (mantenido como ejemplo)
const notifications = ref<Notification[]>([
  { id: '1', title: 'Nueva clase asignada', message: 'Se te ha asignado la clase de Piano Intermedio', date: new Date(), read: false, type: 'info' },
  { id: '2', title: 'Recordatorio', message: 'Recuerda actualizar la lista de asistencia', date: new Date(Date.now() - 86400000), read: true, type: 'reminder' }
]);


function cleanData(obj: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value === null || value === undefined) return;
        if (typeof value === 'string' && value.trim() === '') return;
        // Keep empty arrays if the key indicates it should be an array (like studentIds)
        if (Array.isArray(value) && value.length === 0 && !key.toLowerCase().includes('ids')) return;
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

// Métodos para acciones
const handleAddClass = (): void => {
  isEditing.value = false;
  selectedClassId.value = ''; // Asegura que no haya ID seleccionado
  showForm.value = true;
};

const handleViewClass = (classId: string): void => {
    console.warn("handleViewClass debe ser implementado o eliminado si no se usa.");
    // selectedClassId.value = classId;
    // activeTab.value = 'classes'; // O a una pestaña de detalle si existe
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
      toast({ title: "Clase Eliminada", description: "La clase ha sido eliminada." });
      if (selectedClassId.value === classId) selectedClassId.value = '';
    } catch (error) {
      console.error('Error al eliminar la clase:', error);
      toast({ title: "Error", description: "No se pudo eliminar la clase.", variant: "destructive" });
    }
  }
};

const handleManageStudents = (classId: string): void => {
  selectedClassId.value = classId;
  showStudentManager.value = true;
};

const handleSaveClass = async (classData: Partial<ClassData>): Promise<void> => {
  try {
    if (!classData.name || !classData.level) {
        toast({ title: "Error", description: "Nombre y nivel son obligatorios", variant: "destructive" });
        return;
    }
    const teacherId = currentTeacherId.value;
    if (!teacherId) {
         toast({ title: "Error", description: "No se pudo identificar al profesor.", variant: "destructive" });
         return;
    }

    // Ensure schedule and slots are initialized if provided
    const schedule = classData.schedule?.slots ? {
        slots: classData.schedule.slots.map(slot => cleanData({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime
        })).filter(slot => slot.day && slot.startTime && slot.endTime) // Filter out incomplete slots
    } : undefined; // Set to undefined if no valid slots


    const preparedData = cleanData({
        name: classData.name?.trim(),
        description: classData.description?.trim(),
        level: classData.level,
        teacherId: teacherId, // Use validated teacherId
        classroom: classData.classroom?.trim(),
        instrument: classData.instrument?.trim(),
        schedule: schedule, // Use cleaned schedule
        studentIds: classData.studentIds || [] // Default to empty array if null/undefined
    }) as { name: string; level: string; teacherId: string; [key: string]: any };

    if (isEditing.value && selectedClassId.value) {
        await classesStore.updateClass({ ...preparedData, id: selectedClassId.value });
        toast({ title: "Clase Actualizada", description: `Clase "${preparedData.name}" actualizada.` });
    } else {
        const newClass = await classesStore.addClass(preparedData);
        toast({ title: "Clase Creada", description: `Clase "${preparedData.name}" creada.` });
        selectedClassId.value = newClass.id; // Update selected ID if needed
    }
    showForm.value = false;
  } catch (error) {
    console.error('Error al guardar la clase:', error);
    toast({ title: "Error", description: "No se pudo guardar la clase.", variant: "destructive" });
  }
};


const handleStudentChange = async (studentIds: string[] | null | undefined): Promise<void> => {
    if (!selectedClassId.value) {
        toast({ title: "Error", description: "No hay clase seleccionada.", variant: "destructive" });
        return;
    }

    // Ensure studentIds is always an array, defaulting to empty if null/undefined
    const validStudentIds = Array.isArray(studentIds) ? studentIds : [];

    try {
        await classesStore.updateClass({
            id: selectedClassId.value,
            studentIds: validStudentIds
        });
        toast({ title: "Estudiantes Actualizados", description: "Lista de estudiantes actualizada." });
        showStudentManager.value = false;
    } catch (error) {
        console.error('Error al actualizar estudiantes:', error);
        toast({ title: "Error", description: "No se pudieron actualizar los estudiantes.", variant: "destructive" });
    }
};

const formatDateTime = (date: Date | undefined | null): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'Fecha inválida';
    }
    // Return date in a specific format
    return date.toLocaleString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true
    });
};


// Cambiar de tab
const setActiveTab = (tab: string): void => {
  // Handle navigation for specific tabs that redirect to separate views
  if (tab === 'dashboard') {
    navigateToView('/teachers/dashboard', 'dashboard');
    return;
  } else if (tab === 'notifications') {
    navigateToView('/notifications', 'notifications');
    return;
  } else if (tab === 'analytics') {
    navigateToView('/teachers/analytics', 'analytics');
    return;
  }
    
  // For other tabs, just update the active tab
  activeTab.value = tab;
  showMobileMenu.value = false; // Close mobile menu on tab change
};

// Generic navigation method for external views
const navigateToView = (path: string, tabId: string) => {
  // Navigate to the specific view using router
  router.push(path);
  
  // Update active tab for highlighting in the menu
  activeTab.value = tabId;
  
  // Close mobile menu if open
  showMobileMenu.value = false;
}

const absenceAlertListRef = ref<AbsenceAlertListExposed | null>(null);

// analyzeStudentAbsences function remains the same as provided before
const analyzeStudentAbsences = () => {
    if (!absenceAlertListRef.value) {
        console.warn("AbsenceAlertList component ref not available yet.");
        return;
    }
    console.log("Iniciando análisis de ausencias...");
    if (absenceAlertListRef.value.debugDateInfo) {
         console.log("Información de fecha:", absenceAlertListRef.value.debugDateInfo);
    }

    // Trigger analysis
    absenceAlertListRef.value.analyzeWeeklyAbsences();
    absenceAlertListRef.value.analyzeMonthlyAbsences();

    // Get results
    const weeklyAbsences = absenceAlertListRef.value.getWeeklyAbsences();
    const monthlyAbsences = absenceAlertListRef.value.getMonthlyAbsences();

    console.log('===== ANÁLISIS DE AUSENCIAS =====');

    // Process Weekly Absences
    console.log('\n1. Alumnos con más de 1 inasistencia (Semana):');
    if (weeklyAbsences.length === 0) {
        console.log('   No hay alumnos con >1 inasistencia esta semana.');
    } else {
        const reportData = weeklyAbsences.map(report => {
             const student = report.student;
             const classes = classesStore.getClassesByStudent(student.id);
             return {
                Nombre: `${student.nombre} ${student.apellido}`,
                Ausencias: report.absences,
                "Fechas (max 3)": report.absenceDates?.slice(0, 3).map(d => new Date(d).toLocaleDateString('es-ES')) || [],
                "Clases": classes.map((c: ClassData) => c.name).join(', '),
                Teléfono: student.parentPhone || 'N/A'
             };
        });
        console.table(reportData);
    }

    // Process Monthly Absences
    console.log('\n2. Alumnos con más de 1 inasistencia (Mes):');
     if (monthlyAbsences.length === 0) {
         console.log('   No hay alumnos con >1 inasistencia este mes.');
     } else {
         const reportData = monthlyAbsences.map(report => {
             const student = report.student;
             const classes = classesStore.getClassesByStudent(student.id);
             return {
                 Nombre: `${student.nombre} ${student.apellido}`,
                 Ausencias: report.absences,
                 "Fechas (max 3)": report.absenceDates?.slice(0, 3).map(d => new Date(d).toLocaleDateString('es-ES')) || [],
                 "Clases": classes.map((c: ClassData) => c.name).join(', '),
                 Teléfono: student.parentPhone || 'N/A'
             };
         });
         console.table(reportData);
     }
     console.log('================================');
};

// onMounted and watch remain largely the same, ensure analyzeStudentAbsences is called appropriately
onMounted(async () => {
  loading.value = true;
  try {
    const promises: Promise<any>[] = [];
    if (typeof classesStore.forceSync === 'function') promises.push(classesStore.forceSync());
    if (typeof teachersStore.fetchTeachers === 'function') promises.push(teachersStore.fetchTeachers());
    if (typeof studentsStore.fetchStudents === 'function') promises.push(studentsStore.fetchStudents());
    await Promise.all(promises);

     // Analyze absences after data is potentially loaded and component is mounted
     setTimeout(() => {
         // Ensure the ref is available before calling
         if (absenceAlertListRef.value) {
             analyzeStudentAbsences();
         } else {
             console.warn("AbsenceAlertList ref not ready on mount, will try again on watch.");
         }
     }, 500); // Slight delay to ensure ref is bound

  } catch (error) {
    console.error('Error loading data:', error);
    toast({ title: "Error", description: "Could not load initial data.", variant: "destructive" });
  } finally {
    loading.value = false;
  }
});

watch([currentTeacherId, () => classesStore.classes.length], async ([newTeacherId]) => {
    if (!newTeacherId) return; // Don't run if teacher ID is not set
    loading.value = true; // Indicate loading state during potential re-fetch
    try {
        // Optionally re-fetch classes if teacher ID changes or classes are empty
        // This depends on whether classes are filtered server-side or client-side
        console.log(`Watcher triggered: Teacher ID ${newTeacherId}, Classes count: ${classesStore.classes.length}`);
         if (typeof classesStore.forceSync === 'function') {
              // Re-sync may be needed if data is teacher-specific server-side
              // await classesStore.forceSync();
         }
         // Analyze absences again after data might have changed
          setTimeout(() => {
             if (absenceAlertListRef.value) {
                 analyzeStudentAbsences();
             } else {
                 console.warn("AbsenceAlertList ref not ready on watch.");
             }
          }, 500);
    } catch (error) {
        console.error('Error during watch update:', error);
        toast({ title: "Error", description: "Failed to update data on change.", variant: "destructive"});
    } finally {
        loading.value = false;
    }
}, { immediate: false }); // immediate: false to avoid running on initial mount if onMounted handles it


</script>

<template>
  <div class="teacher-dashboard flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">

    <!-- Mobile Header (Visible only on small screens) -->
    <TeacherMobileHeader
      class="md:hidden sticky top-0 z-40"
      :active-tab="activeTab"
      @toggle-menu="toggleMobileMenu"
    />

    <!-- Mobile Side Menu (Conditionally rendered, hidden on medium+ screens) -->
    <TeacherMobileSideMenu
      v-if="showMobileMenu"
      class="md:hidden"
      :active-tab="activeTab"
      @set-active-tab="setActiveTab"
      @close-menu="showMobileMenu = false"
    />

    <!-- Desktop Header (Visible only on medium+ screens) -->
    <TeacherDesktopHeader
      class="hidden md:flex sticky top-0 z-40"
      :active-tab="activeTab"
      @set-active-tab="setActiveTab"
    />

    <!-- Main Content Area -->
    <main class="flex-grow container mx-auto px-4 py-6 md:py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>

      <!-- Content Tabs -->
      <section v-else class="space-y-6">
        <TeacherNotificationsTab
          v-if="activeTab === 'notifications'"
          :notifications="notifications"
        />
        <TeacherScheduleTab
          v-if="activeTab === 'schedule'"
          :teacher-classes="teacherClasses"
          :current-teacher-id="currentTeacherId"
          @add-class="handleAddClass"
          @view-class="handleViewClass"
        />
        <TeacherClassesTab
          v-if="activeTab === 'classes'"
          :sorted-classes="sortedClasses"
          @add-class="handleAddClass"
          @view-class="handleViewClass"
          @edit-class="handleEditClass"
          @delete-class="handleDeleteClass"
          @manage-students="handleManageStudents"
        />
        <TeacherUpcomingTab
          v-if="activeTab === 'upcoming'"
          :upcoming-classes="upcomingClasses"
          :get-next-session="getNextSession"
          :format-date-time="formatDateTime"
          @edit-class="handleEditClass"
          @manage-students="handleManageStudents"
        />
        
        <!-- Overview/Dashboard tab -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <h2 class="text-2xl font-bold mb-4">Panel de Información</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="metric in dashboardMetrics" :key="metric.title" 
                 class="p-4 rounded-lg shadow-md" :class="metric.color">
              <div class="flex items-center mb-2">
                <component :is="metric.icon" class="w-6 h-6 mr-2" />
                <h3 class="font-semibold">{{ metric.title }}</h3>
              </div>
              <p class="text-3xl font-bold">{{ metric.value }}</p>
            </div>
          </div>
        </div>
        <!-- Add other tabs here if needed -->
      </section>
    </main>


    <!-- Modals (Rendered outside main flow, visibility controlled by state) -->
    <TeacherClassFormModal
      :show="showForm"
      :is-editing="isEditing"
      :class-data="isEditing ? (selectedClass || null) : null"
      @update:show="showForm = $event"
      @save="handleSaveClass"
      @cancel="showForm = false"
    />

    <TeacherStudentManagerModal
      :show="showStudentManager"
      :selected-class="selectedClass"
      @update:show="showStudentManager = $event"
      @update="handleStudentChange"
      @close="showStudentManager = false"
    />

    <!-- Hidden component for logic -->
    <AbsenceAlertList ref="absenceAlertListRef" class="hidden" />

    <!-- Keep TeacherDashboard if it's a separate global component/overlay -->
    <!-- <TeacherDashboard /> -->
    
    <!-- Mobile Footer Navigation (Visible only on small screens) -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-30">
      <nav class="flex justify-around">
        <button
          v-for="item in navigationItems"
          :key="item.id"
          @click="setActiveTab(item.id)"
          class="flex flex-col items-center py-2 px-4"
          :class="{ 'text-blue-600 dark:text-blue-400': item.active, 'text-gray-600 dark:text-gray-400': !item.active }"
        >
          <component :is="item.icon" class="w-6 h-6" />
          <span class="text-xs">{{ item.name }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles can remain if needed, but responsiveness is mainly handled by Tailwind */
/* Note: Base styles for teacher-dashboard are handled by Tailwind classes */

/* Add padding to the bottom of the main content area on mobile
   to prevent overlap with the fixed footer navigation */
main {
   padding-bottom: 80px; /* Adjust height based on footer nav height */
}
@media (min-width: 768px) { /* md breakpoint */
  main {
    padding-bottom: 2rem; /* Reset padding for desktop */
  }
}

/* Ensure container takes full width */
.container {
    width: 100%;
}
</style>