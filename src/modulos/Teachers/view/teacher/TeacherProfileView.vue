<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTeachersStore } from '../../store/teachers';
import { useClassesStore } from '../../../Classes/store/classes';
import { useScheduleStore } from '../../../../modulos/Schedules/store/schedule';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FileUpload from '../../../../components/FileUpload.vue';
import { getAuth } from 'firebase/auth';
import {
  SunIcon, MoonIcon, PencilIcon, DocumentArrowDownIcon, ArrowLeftOnRectangleIcon,
  ChartBarIcon, BellIcon, UserIcon, ClockIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const auth = getAuth();
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const scheduleStore = useScheduleStore();

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
  statistics.value = {
    totalStudents: teacherClasses.value.reduce((acc, cls) => acc + (cls.students?.length || 0), 0),
    activeClasses: teacherClasses.value.length,
    weeklyHours: scheduleStore.schedules.reduce((acc, s) => acc + ((new Date(`1970-01-01T${s.scheduleDay.timeSlot.endTime}`) - new Date(`1970-01-01T${s.scheduleDay.timeSlot.startTime}`)) / 3600000), 0)
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
</script>

<template>
  <div v-if="!isLoading" class="max-w-5xl mx-auto py-8 px-6 space-y-8">

    <!-- Perfil Header -->
    <div class="flex items-center gap-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
      <img :src="teacher.photoURL || `https://ui-avatars.com/api/?name=${teacher.nombre}`" alt="teacher photo"
        class="w-24 h-24 rounded-full shadow-lg border-4 border-white object-cover">
      <div>
        <h1 class="text-2xl font-bold">{{ teacher.nombre }} {{ teacher.apellido }}</h1>
        <p class="text-indigo-100">{{ teacher.titulo || 'Profesor de Música' }}</p>
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
    <div class="flex flex-wrap gap-4">
      <button @click="handleLogout" class="btn-red">
        <ArrowLeftOnRectangleIcon class="w-5 h-5 mr-1" />Cerrar Sesión
      </button>
      <button class="btn-indigo">
        <PencilIcon class="w-5 h-5 mr-1" />Editar Perfil
      </button>
      <button class="btn-indigo">
        <DocumentArrowDownIcon class="w-5 h-5 mr-1" />Descargar Horario
      </button>
      <button class="btn-indigo">
        <BellIcon class="w-5 h-5 mr-1" />Notificaciones
      </button>
    </div>
  </div>

  <div v-else class="text-center py-20">
    <span class="text-gray-500">Cargando datos del profesor...</span>
  </div>
</template>

<style scoped>
.btn-indigo {@apply flex items-center bg-indigo-500 text-white py-2 px-4 rounded-lg shadow hover:bg-indigo-600 transition;}
.btn-red {@apply flex items-center bg-red-500 text-white py-2 px-4 rounded-lg shadow hover:bg-red-600 transition;}
</style>
