<template>
  <div class="teachers-view py-6 dark:bg-gray-800 dark:text-gray-100 min-h-screen">
    <!-- Cabecera con información del profesor -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 text-white px-4 py-6 mb-6 rounded-lg shadow" role="banner">
      <div class="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4 md:gap-6">
        <div class="flex flex-col md:flex-row items-center mb-4 md:mb-0">
          <div class="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center overflow-hidden mb-4 md:mb-0 md:mr-6">
            <img v-if="teacher?.photoURL" :src="teacher.photoURL" alt="Foto de perfil" class="w-full h-full object-cover" />
            <UserIcon v-else class="h-12 w-12 text-white" />
          </div>
          <div class="text-center md:text-left">
            <h1 class="text-xl sm:text-2xl font-bold" tabindex="0">{{ teacher?.name || 'Maestro' }}</h1>
            <p class="text-white/90 text-sm sm:text-base">{{ teacher?.specialties?.join(', ') || 'Música' }}</p>
            <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-2" role="list">
              <span v-for="(specialty, index) in teacher?.specialties" :key="index" 
                class="px-2 py-1 text-xs bg-white/20 rounded-full" role="listitem">
                {{ specialty }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="flex flex-col items-center md:items-end">
          <div class="stats-card bg-white/20 p-4 rounded-lg" role="region" aria-label="Estadísticas del profesor">
            <div class="grid grid-cols-2 gap-4 text-center" role="grid">
              <div>
                <p class="text-sm opacity-90" role="columnheader">Clases</p>
                <p class="text-xl sm:text-2xl font-bold" role="cell">{{ teacherStats.classesCount || 0 }}</p>
              </div>
              <div>
                <p class="text-sm opacity-90" role="columnheader">Alumnos</p>
                <p class="text-xl sm:text-2xl font-bold" role="cell">{{ teacherStats.studentsCount || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Navegación por pestañas -->
    <nav class="tab-navigation mb-6" aria-label="Navegación por pestañas">
      <div class="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <ul class="flex flex-wrap -mb-px" role="tablist">
          <li v-for="tab in tabs" :key="tab.id" class="mr-2" role="presentation">
            <button 
              @click="activeTab = tab.id"
              :aria-selected="activeTab === tab.id"
              :aria-controls="`tabpanel-${tab.id}`"
              role="tab"
              class="inline-block py-3 px-4 border-b-2 rounded-t-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              :class="[
                activeTab === tab.id 
                  ? 'border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              ]"
            >
              <component :is="tab.icon" class="w-5 h-5 inline mr-2" />
              {{ tab.name }}
            </button>
          </li>
        </ul>
      </div>
    </nav>
    
    <!-- Contenido de la pestaña activa -->
    <div class="tab-content px-2 sm:px-0" role="tabpanel">
      <!-- Panel General -->
      <TeacherDashboard v-if="activeTab === 'dashboard'" />
      
      <!-- Horario Semanal -->
      <TeacherSchedule v-if="activeTab === 'schedule'" />
      
      <!-- Mis Clases -->
      <TeacherClasses v-if="activeTab === 'classes'" />
      
      <!-- Próximas Clases -->
      <TeacherUpcoming v-if="activeTab === 'upcoming'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useTeachersStore } from '../stores/teachers';
import { useClassesStore } from '../stores/classes';
import { useStudentsStore } from '../modulos/Students/store/students';
import TeacherDashboard from '../components/teachers/TeacherDashboard.vue';
import TeacherSchedule from '../components/teachers/TeacherSchedule.vue';
import TeacherClasses from '../components/teachers/TeacherClasses.vue';
import TeacherUpcoming from '../components/teachers/TeacherUpcoming.vue';
// obtener el ID del profesor autenticado 
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const teacherId = ref(authStore.user?.uid || ''); // ID del profesor autenticado
import {
  UserIcon,
  ChartBarIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClockIcon
} from '@heroicons/vue/24/outline';

// Estado de la pestaña activa
const activeTab = ref('dashboard');

// Definición de pestañas
const tabs = [
  { id: 'dashboard', name: 'Panel General', icon: ChartBarIcon },
  { id: 'schedule', name: 'Horario Semanal', icon: CalendarIcon },
  { id: 'classes', name: 'Mis Clases', icon: AcademicCapIcon },
  { id: 'upcoming', name: 'Próximas Clases', icon: ClockIcon }
];

// Stores
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();

// Definir la interfaz para el tipo Teacher
interface Teacher {
  id: string;
  name?: string;
  photoURL?: string;
  specialties?: string[];
}

// Datos del profesor (simulando que obtenemos el ID del profesor autenticado)
const teacher = ref<Teacher | null>(null);

// Estadísticas del profesor
const teacherStats = reactive({
  classesCount: 0,
  studentsCount: 0,
  attendanceRate: 0,
  nextClass: null
});

// Cargar datos del profesor
onMounted(async () => {
  try {
    // Cargar datos del profesor
    if (teachersStore.teachers.length === 0) {
      await teachersStore.fetchTeachers();
    }
    teacher.value = teachersStore.teachers.find(t => t.id === teacherId.value) || null;
    
    // Cargar clases
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
    }
    
    // Calcular estadísticas
    const teacherClasses = classesStore.classes.filter(c => c.profesor === teacherId.value);
    teacherStats.classesCount = teacherClasses.length;
    
    // Obtener alumnos únicos de todas las clases del profesor
    const studentIds = new Set();
    teacherClasses.forEach(c => {
      c.studentIds?.forEach(id => studentIds.add(id));
    });
    teacherStats.studentsCount = studentIds.size;
    
    // Ordenar próximas clases
    const now = new Date();
    const dayMap = { 'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6 };
    
    const upcomingClasses = teacherClasses
      .map(c => {
        // Calcular próxima fecha de clase basado en el horario
        const today = now.getDay(); // 0 = domingo, 1 = lunes, ...
        const classDay = dayMap[c.horario.dia.toLowerCase()] || 0;
        const [hours, minutes] = c.horario.horaInicio.split(':').map(Number);
        
        // Calcular días hasta la próxima clase
        let daysUntilClass = (classDay - today + 7) % 7;
        if (daysUntilClass === 0) {
          // Si es hoy, verificar si ya pasó
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const classTime = hours * 60 + minutes;
          if (classTime <= currentTime) {
            daysUntilClass = 7; // Mover a la próxima semana
          }
        }
        
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysUntilClass);
        nextDate.setHours(hours, minutes, 0, 0);
        
        return { ...c, computedNextDate: nextDate };
      })
      .filter(c => c.computedNextDate > now)
      .sort((a, b) => a.computedNextDate.getTime() - b.computedNextDate.getTime());
    
    if (upcomingClasses.length > 0) {
      teacherStats.nextClass = upcomingClasses[0];
    }
    
  } catch (error) {
    console.error('Error al cargar datos del profesor:', error);
  }
});
</script>

<style scoped>
.teachers-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.stats-card {
  backdrop-filter: blur(10px);
}

@media (max-width: 640px) {
  .teachers-view {
    padding: 0 0.5rem;
  }
}

/* Mejoras de accesibilidad para modo oscuro */
@media (prefers-color-scheme: dark) {
  .stats-card {
    background-color: rgba(255, 255, 255, 0.08) !important;
  }
}

/* Estados de foco visibles */
button:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>