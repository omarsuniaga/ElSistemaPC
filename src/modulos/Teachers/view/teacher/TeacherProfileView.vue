<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTeachersStore } from '../../store/teachers';
import { useClassesStore } from '../../../Classes/store/classes';
import { useScheduleStore } from '../../../../modulos/Schedules/store/schedule';
import { useNotificationsStore } from '../../../../stores/notifications';
import NotificationSystem from '../../../../components/NotificationSystem.vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FileUpload from '../../../../components/FileUpload.vue';
import { getAuth } from 'firebase/auth';
import {
  SunIcon, MoonIcon, PencilIcon, DocumentArrowDownIcon, ArrowLeftOnRectangleIcon,
  ChartBarIcon, BellIcon, UserIcon, ClockIcon, XMarkIcon
} from '@heroicons/vue/24/outline';
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const notificationsStore = useNotificationsStore()
const router = useRouter();
const auth = getAuth();
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const scheduleStore = useScheduleStore();
onMounted(async () => {
  await notificationsStore.fetchNotifications()
})
const dismissNotification = async (id: string) => {
  await notificationsStore.markAsRead(id)
}

const teacherId = ref(auth.currentUser?.uid || '');
const teacher = ref(null);
const isLoading = ref(true);
const isDark = ref(localStorage.getItem('darkMode') === 'true');
document.documentElement.classList.toggle('dark', isDark.value);

const teacherClasses = computed(() =>
  classesStore.classes.filter((c: any) => c.teacherId === teacherId.value)
);

const statistics = ref({ totalStudents: 0, activeClasses: 0, weeklyHours: 0 });

const loadTeacherData = async () => {
  isLoading.value = true;
  await Promise.all([
    teachersStore.fetchTeachers(),
    classesStore.fetchClasses(),
    scheduleStore.fetchAllSchedules()
  ]);

  teacher.value = teachersStore.teachers.find(t => t.id === teacherId.value);
  
  // Get unique students from all classes
  const uniqueStudents = new Set();
  teacherClasses.value.forEach(cls => {
    if (cls.studentIds) {
      cls.studentIds.forEach(id => uniqueStudents.add(id));
    }
  });

  // Calculate total weekly hours from all class schedules
  const weeklyHours = teacherClasses.value.reduce((total, cls) => {
    if (!cls.schedule?.slots) return total;
    
    return total + cls.schedule.slots.reduce((slotTotal, slot) => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const hours = endHour - startHour + (endMin - startMin) / 60;
      return slotTotal + hours;
    }, 0);
  }, 0);

  statistics.value = {
    totalStudents: uniqueStudents.size,
    activeClasses: teacherClasses.value.length,
    weeklyHours
  };
  
  isLoading.value = false;
};

onMounted(loadTeacherData);

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('darkMode', String(isDark.value));
};

const formatHours = (hours: number) => `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
const formattedDate = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

const handleLogout = async () => {
  await auth.signOut();
  router.push('/login');
};

const handleEditProfile = () => {
  router.push(`/teachers/${teacherId.value}/edit`);
};

const showNotificationsModal = ref(false);
const notifications = ref([]);

// Function to generate and download PDF
const downloadSchedule = async () => {
  const doc = new jsPDF();
  
  // Configurar el título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Horario de Clases", doc.internal.pageSize.width/2, 20, { align: "center" });
  
  // Nombre del profesor y fecha
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(`${teacher.value?.name}`, doc.internal.pageSize.width/2, 30, { align: "center" });
  doc.text(format(new Date(), 'MMMM yyyy', { locale: es }), doc.internal.pageSize.width/2, 40, { align: "center" });
  
  // Preparar datos para la tabla
  const tableData = teacherClasses.value.map(cls => {
    return cls.schedule?.slots.map(slot => [
      cls.name,
      slot.day,
      `${slot.startTime} - ${slot.endTime}`
    ]);
  }).flat();

  // Generar tabla
  doc.autoTable({
    startY: 50,
    head: [['Clase', 'Día', 'Horario']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // Guardar el PDF
  doc.save(`${teacher.value?.name}_${format(new Date(), 'MMMM_yyyy', { locale: es })}.pdf`);
};
</script>

<template>
  <div v-if="!isLoading" class="max-w-5xl mx-auto py-8 px-6 space-y-8">

    <!-- Perfil Header -->
    <div class="flex items-center gap-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
      <img :src="teacher.photoURL || `https://ui-avatars.com/api/?name=${teacher.nombre}`" alt="teacher photo"
        class="w-24 h-24 rounded-full shadow-lg border-4 border-white object-cover">
      <div>
        <h1 class="text-2xl font-bold">{{ teacher.name }} </h1>
        <p class="text-indigo-100">{{ teacher.instruments || 'Profesor de Música' }}</p>
        <p class="text-sm">{{ formattedDate }}</p>
      </div>
      <button @click="toggleDarkMode" class="ml-auto p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30">
        <SunIcon v-if="isDark" class="w-6 h-6" />
        <MoonIcon v-else class="w-6 h-6" />
      </button>
    </div>

    <!-- Estadísticas y Clases -->
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 shadow rounded p-4">
        <ChartBarIcon class="h-8 w-8 text-indigo-500" />
        <h3 class="text-lg font-semibold">{{ statistics.activeClasses }}</h3>
        <p class="text-sm text-gray-500">Clases activas</p>
      </div>
      <div class="bg-white dark:bg-gray-800 shadow rounded p-4">
        <UserIcon class="h-8 w-8 text-indigo-500" />
        <h3 class="text-lg font-semibold">{{ statistics.totalStudents }}</h3>
        <p class="text-sm text-gray-500">Estudiantes</p>
      </div>
      <div class="bg-white dark:bg-gray-800 shadow rounded p-4">
        <ClockIcon class="h-8 w-8 text-indigo-500" />
        <h3 class="text-lg font-semibold">{{ formatHours(statistics.weeklyHours) }}</h3>
        <p class="text-sm text-gray-500">Horas semanales</p>
      </div>
    </div>

      <!-- Botones de acción -->
      <NotificationSystem
  :notifications="notificationsStore.unreadNotifications"
  @dismiss="dismissNotification"
/>
    <div class="flex flex-wrap gap-4">
      <button @click="handleLogout" class="btn-red">
        <ArrowLeftOnRectangleIcon class="w-5 h-5 mr-1" />Cerrar Sesión
      </button>
      <button @click="handleEditProfile" class="btn-indigo">
        <PencilIcon class="w-5 h-5 mr-1" />Editar Perfil
      </button>
      <button @click="downloadSchedule" class="btn-indigo">
        <DocumentArrowDownIcon class="w-5 h-5 mr-1" />Descargar Horario
      </button>
      <button @click="showNotificationsModal = true" class="btn-indigo">
        <BellIcon class="w-5 h-5 mr-1" />Notificaciones
      </button>
    </div>
  </div>

  <div v-else class="text-center py-20">
    <span class="text-gray-500">Cargando datos del profesor...</span>
  </div>

  <TransitionRoot appear :show="showNotificationsModal" as="template">
    <Dialog as="div" @close="showNotificationsModal = false" class="relative z-50">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Notificaciones
                </h3>
                <button
                  @click="showNotificationsModal = false"
                  class="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon class="h-6 w-6" />
                </button>
              </div>
              <div class="mt-4">
                <NotificationSystem
                  :notifications="notificationsStore.unreadNotifications"
                  @dismiss="dismissNotification"
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
.btn-indigo {@apply flex items-center bg-indigo-500 text-white py-2 px-4 rounded-lg shadow hover:bg-indigo-600 transition;}
.btn-red {@apply flex items-center bg-red-500 text-white py-2 px-4 rounded-lg shadow hover:bg-red-600 transition;}
</style>
