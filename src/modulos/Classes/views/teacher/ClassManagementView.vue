<!--
🎯 CLASS MANAGEMENT VIEW - NUEVA ARQUITECTURA
Vista de gestión de clases para maestros
Implementa sistema de pestañas con widgets de funcionalidades
-->

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 🎯 HEADER -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Título y descripción -->
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              Gestión de Clases
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra tus clases, estudiantes y analiza el rendimiento
            </p>
          </div>

          <!-- Estadísticas rápidas -->
          <div class="hidden md:flex items-center space-x-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ classStats.totalClasses }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Clases
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ classStats.totalStudents }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Estudiantes
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {{ classStats.averageAttendance }}%
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Asistencia
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 🏗️ CONTENIDO PRINCIPAL -->
    <main class="flex-1">
      <!-- Sistema de pestañas -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="px-6">
          <nav class="flex space-x-8">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'group relative py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              ]"
              @click="changeTab(tab.id)"
            >
              <div class="flex items-center space-x-2">
                <!-- Ícono de la pestaña -->
                <svg
                  class="w-5 h-5"
                  :class="[
                    activeTab === tab.id
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500'
                  ]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  v-html="getTabIcon(tab.icon)"
                >
                </svg>
                
                <!-- Label de la pestaña -->
                <span>{{ tab.label }}</span>
              </div>

              <!-- Tooltip con descripción -->
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {{ tab.description }}
                <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <!-- Contenido de las pestañas -->
      <div class="p-6">
        <!-- Estado de carga -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-gray-600 dark:text-gray-400">Cargando datos de clases...</span>
          </div>
        </div>

        <!-- Contenido de pestañas -->
        <div v-else class="max-w-7xl mx-auto">
          <!-- Pestaña: Mis Clases -->
          <div v-show="activeTab === 'classes'" class="space-y-6">
            <!-- Resumen de clases -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ classStats.totalClasses }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      Total de Clases
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ classStats.totalStudents }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      Total Estudiantes
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ classStats.averageAttendance }}%
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      Promedio Asistencia
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ classStats.activeInstruments }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      Instrumentos
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Lista de clases -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Mis Clases Asignadas
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Lista completa de clases que tienes asignadas
                </p>
              </div>

              <div class="p-6">
                <div v-if="teacherClasses.length === 0" class="text-center py-8">
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay clases asignadas
                  </h3>
                  <p class="text-gray-500 dark:text-gray-400">
                    Contacta con la administración para que te asignen clases
                  </p>
                </div>

                <div v-else class="space-y-4">
                  <div
                    v-for="classItem in teacherClasses"
                    :key="classItem.id"
                    class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div class="flex items-center space-x-4">
                      <!-- Ícono del instrumento -->
                      <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>

                      <!-- Información de la clase -->
                      <div>
                        <h4 class="font-medium text-gray-900 dark:text-white">
                          {{ classItem.name || classItem.instrument }}
                        </h4>
                        <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>📅 {{ classItem.schedule || 'Horario por definir' }}</span>
                          <span>👥 {{ classItem.studentIds?.length || 0 }} estudiantes</span>
                          <span>📍 {{ classItem.location || 'Aula por asignar' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Acciones -->
                    <div class="flex items-center space-x-2">
                      <button class="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Otras pestañas - Placeholders -->
          <div v-show="activeTab !== 'classes'" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                class="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                v-html="getTabIcon(activeTabData?.icon || 'academic-cap')"
              >
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {{ activeTabData?.label }} - En Desarrollo
            </h3>
            <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Esta funcionalidad está en desarrollo. Próximamente tendrás acceso a {{ activeTabData?.description?.toLowerCase() }}.
            </p>
            <div class="mt-6">
              <button
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                @click="changeTab('classes')"
              >
                Volver a Mis Clases
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useClassesStore } from '../../store/classes';
import { useStudentsStore } from '../../../Students/store/students';
import { useAuthStore } from '../../../../stores/auth';

// TODO: Importar componentes de widgets cuando se implementen
// import ClassListWidget from '../../components/widgets/ClassListWidget.vue'
// import AbsenteeismAnalysisWidget from '../../components/widgets/AbsenteeismAnalysisWidget.vue'
// import ScheduleOverviewWidget from '../../components/widgets/ScheduleOverviewWidget.vue'
// import StudentProgressWidget from '../../components/widgets/StudentProgressWidget.vue'

// Stores
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();

// Estado del componente
const isLoading = ref(true);
const activeTab = ref('classes');
const teacherClasses = ref<any[]>([]);
const classStats = ref({
  totalClasses: 0,
  totalStudents: 0,
  averageAttendance: 0,
  activeInstruments: 0,
});

// Definición de pestañas
const tabs = [
  {
    id: 'classes',
    label: 'Mis Clases',
    icon: 'academic-cap',
    description: 'Lista y gestión de clases asignadas',
  },
  {
    id: 'students',
    label: 'Estudiantes',
    icon: 'users',
    description: 'Gestión de estudiantes por clase',
  },
  {
    id: 'analysis',
    label: 'Análisis',
    icon: 'chart-bar',
    description: 'Análisis de ausentismo y rendimiento',
  },
  {
    id: 'schedule',
    label: 'Horarios',
    icon: 'calendar',
    description: 'Vista general de horarios y calendario',
  },
];

// Computed properties
const currentTeacher = computed(() => ({
  name: authStore.user?.email || 'Maestro',
  id: authStore.user?.uid,
}));

const activeTabData = computed(() => {
  return tabs.find(tab => tab.id === activeTab.value);
});

// Métodos principales
const loadTeacherClasses = async () => {
  if (!currentTeacher.value.id) return;

  isLoading.value = true;

  try {
    console.log('📚 [ClassManagement] Loading teacher classes for:', currentTeacher.value.id);

    // Cargar clases del maestro desde el store
    await classesStore.fetchTeacherClasses(currentTeacher.value.id);
    teacherClasses.value = classesStore.getTeacherClasses(currentTeacher.value.id);

    // Calcular estadísticas
    calculateClassStats();

    console.log('✅ [ClassManagement] Classes loaded successfully:', {
      totalClasses: teacherClasses.value.length,
      classes: teacherClasses.value,
    });

  } catch (err) {
    console.error('❌ [ClassManagement] Error loading teacher classes:', err);
  } finally {
    isLoading.value = false;
  }
};

const calculateClassStats = () => {
  const classes = teacherClasses.value;

  // Calcular estadísticas básicas
  const totalStudents = classes.reduce((sum, cls) => {
    return sum + (cls.studentIds?.length || 0);
  }, 0);

  const instruments = new Set(classes.map(cls => cls.instrument).filter(Boolean));

  classStats.value = {
    totalClasses: classes.length,
    totalStudents,
    averageAttendance: 85, // TODO: Calcular desde datos reales de asistencia
    activeInstruments: instruments.size,
  };

  console.log('📊 [ClassManagement] Stats calculated:', classStats.value);
};

const changeTab = (tabId: string) => {
  activeTab.value = tabId;
  console.log('🔄 [ClassManagement] Tab changed to:', tabId);
};

const getTabIcon = (iconName: string) => {
  const icons = {
    'academic-cap': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />',
    'users': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />',
    'chart-bar': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
    'calendar': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />',
  };
  return icons[iconName as keyof typeof icons] || icons['academic-cap'];
};

// Lifecycle
onMounted(() => {
  console.log('🚀 [ClassManagement] Component mounted');
  loadTeacherClasses();
});
</script>

<style scoped>
/* Animaciones suaves para las pestañas */
.tab-enter-active,
.tab-leave-active {
  transition: opacity 0.3s ease;
}

.tab-enter-from,
.tab-leave-to {
  opacity: 0;
}

/* Efectos hover mejorados */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Transiciones suaves para botones */
button {
  transition: all 0.2s ease;
}

/* Tooltips */
.group:hover .tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(-4px);
}

.tooltip {
  opacity: 0;
  visibility: hidden;
  transform: translateY(0);
  transition: all 0.2s ease;
}
</style>
