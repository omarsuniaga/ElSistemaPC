<template>
  <div v-if="loading" class="flex justify-center items-center p-10">
    <div class="text-2xl text-gray-500">Cargando Módulo Montaje...</div>
  </div>
  <div v-else class="space-y-6">
    <!-- Contenido del Dashboard Principal -->
    <div v-if="route.name === 'montaje-dashboard'" class="space-y-6">
      <!-- Welcome Header -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">
              Bienvenido a {{ currentProject?.name || 'Montaje' }}
            </h1>
            <p class="text-blue-100">
              {{ currentProject?.description || 'Sistema profesional de gestión musical' }}
            </p>
            <div v-if="currentProject" class="mt-4 flex flex-wrap gap-4 text-sm">
              <div class="flex items-center gap-2">
                <span>🎭</span>
                <span>{{ currentProject.organization }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>📅</span>
                <span>{{ currentProject.season }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>👥</span>
                <span>{{ currentProject?.members?.length || 0 }} miembros</span>
              </div>
            </div>
          </div>
          <div class="mt-4 md:mt-0">
            <button
              class="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              @click="showCreateProject = true"
            >
              ➕ Nuevo Proyecto
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Progreso General</p>
              <p class="text-2xl font-bold text-blue-600">{{ projectStats?.progress.toFixed(0) || 0 }}%</p>
            </div>
            <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">📈</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${projectStats?.progress || 0}%` }"
              ></div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Obras Activas</p>
              <p class="text-2xl font-bold text-green-600">{{ works.length }}</p>
            </div>
            <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">🎼</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ completedWorks }} completadas</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Miembros</p>
              <p class="text-2xl font-bold text-purple-600">{{ currentProject?.members?.length || 0 }}</p>
            </div>
            <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">👥</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ activeMembers }} activos</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Días Restantes</p>
              <p class="text-2xl font-bold text-orange-600">{{ projectStats?.daysRemaining || 0 }}</p>
            </div>
            <div class="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">⏰</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Hasta fecha objetivo</p>
        </div>
      </div>

      <!-- Quick Actions & Navegación -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">🚀 Acciones Rápidas & Navegación</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
            @click="showCreateWork = true"
          >
            <div class="text-2xl mb-2">🎵</div>
            <div class="text-sm font-medium text-gray-700">Nueva Obra</div>
          </button>
          <button
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
            @click="showScheduleSession = true"
          >
            <div class="text-2xl mb-2">📅</div>
            <div class="text-sm font-medium text-gray-700">Programar Ensayo</div>
          </button>
          <button
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
            @click="showEvaluationCenter = true"
          >
            <div class="text-2xl mb-2">📋</div>
            <div class="text-sm font-medium text-gray-700">Centro de Evaluación</div>
          </button>
          <button
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
            @click="showReports = true"
          >
            <div class="text-2xl mb-2">📊</div>
            <div class="text-sm font-medium text-gray-700">Reportes</div>
          </button>
        </div>
  
      </div>
      <!-- Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Works List -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">🎼 Obras del Proyecto</h2>
            <button
              class="text-sm text-blue-600 hover:text-blue-800"
              @click="showCreateWork = true"
            >
              ➕ Agregar
            </button>
          </div>
          <div v-if="works.length > 0" class="space-y-3">
            <div
              v-for="work in works.slice(0, 5)"
              :key="work.id"
              class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              @click="goToWorkDetail(work)"
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-gray-900">{{ work.name }} </h3>
                <span 
                  class="px-2 py-1 text-xs rounded-full"
                  :class="getStatusColor(work.status || 'planning')"
                >
                  {{ getStatusText(work.status || 'planning') }}
                </span>
              </div>
              <p class="text-sm text-gray-600">{{ work.composer || 'Sin compositor' }}</p>
              <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{{ work.instruments?.length || 0 }} instrumentos</span>
                <span>{{ work.totalMeasures || work.compas || 0 }} compases</span>
              </div>
              <div class="mt-2 w-full bg-gray-200 rounded-full h-1">
                <div
class="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  :style="{ width: `${getWorkProgress(work)}%` }">
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🎵</div>
            <p>No hay obras en este proyecto</p>
            <button
              class="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              @click="showCreateWork = true"
            >
              Crear la primera obra
            </button>
          </div>
        </div>
        <!-- Recent Evaluations -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">📋 Evaluaciones Recientes</h2>
          <div class="space-y-3">
            <div
              v-for="evaluation in recentEvaluations"
              :key="evaluation.id"
              class="p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-gray-900">{{ evaluation.workName }}</span>
                <span class="text-xs text-gray-500">{{ formatDate(evaluation.date) }}</span>
              </div>
              <p class="text-sm text-gray-600">{{ evaluation.type }}</p>
              <div class="mt-2 flex items-center gap-2">
                <div class="flex items-center gap-1">
                  <span class="text-xs text-gray-500">Promedio:</span>
                  <span class="text-sm font-medium text-blue-600">{{ evaluation.averageScore?.toFixed(1) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-xs text-gray-500">Instrumentos:</span>
                  <span class="text-sm font-medium">{{ evaluation.instrumentCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Upcoming Events -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">📅 Próximos Eventos</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="event in upcomingEvents"
            :key="event.id"
            class="p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-2xl">{{ getEventIcon(event.type) }}</span>
              <div>
                <h3 class="font-medium text-gray-900">{{ event.title }}</h3>
                <p class="text-sm text-gray-600">{{ event.type }}</p>
              </div>
            </div>
            <div class="text-sm text-gray-500">
              <div>📅 {{ formatDate(event.date) }}</div>
              <div v-if="event.location">📍 {{ event.location }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Router View for Child Routes -->
    <div v-else class="mt-6">
      <router-view />
    </div>
  </div>

  <!-- Modals -->
  <CreateWorkModal 
    v-if="showCreateWork"
    @work-created="onWorkCreated"
    @close="showCreateWork = false"
  />

  <ScheduleSessionModal
    v-if="showScheduleSession"
    @session-scheduled="onSessionScheduled"
    @close="showScheduleSession = false"
  />

  <EvaluationCenterModal
    v-if="showEvaluationCenter"
    @close="showEvaluationCenter = false"
  />

  <ReportsModal
    v-if="showReports"
    @close="showReports = false"
  />

  <CreateProjectModal
    v-if="showCreateProject"
    @project-created="onProjectCreated"
    @close="showCreateProject = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { MusicalWork } from '../types';
import ScheduleSessionModal from './ScheduleSessionModal.vue';
import EvaluationCenterModal from './EvaluationCenterModal.vue';
import ReportsModal from './ReportsModal.vue';
import CreateWorkModal from './CreateWorkModal.vue';
import CreateProjectModal from './CreateProjectModal.vue';

// Importar composables reales
import { useMontaje } from '../composables/useMontaje';
import { useMusicalWorks } from '../composables/useHeatMapProjects';

/**
 * Emits:
 * - work-selected: Cuando el usuario selecciona una obra (MusicalWork)
 * - create-project: Cuando el usuario solicita crear un nuevo proyecto
 */
const emit = defineEmits(['work-selected', 'create-project']);
const router = useRouter();
const route = useRoute();

// Usar composables reales
const { currentProject, projectStats, loading: loadingProjects, loadProjects, projects } = useMontaje();
const { works, loading: loadingWorks, loadWorks } = useMusicalWorks();

// Combinar estados de carga
const loading = computed(() => loadingProjects.value || loadingWorks.value);

// Variables de control de modales
const showCreateWork = ref(false);
const showScheduleSession = ref(false);
const showEvaluationCenter = ref(false);
const showReports = ref(false);
const showCreateProject = ref(false);

// Datos simulados (ahora se cargarán desde Firestore)
const recentEvaluations = ref<any[]>([]); // TODO: Cargar desde Firestore
const upcomingEvents = ref<any[]>([]); // TODO: Cargar desde Firestore

const completedWorks = computed(() =>
  works.value.filter((w) => w.status === 'performance_ready' || w.status === 'performed').length,
);

const activeMembers = computed(() =>
  currentProject.value?.members?.filter((m) => m.role !== 'musician' || true).length || 0,
);

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-700',
    learning: 'bg-blue-100 text-blue-700',
    polishing: 'bg-yellow-100 text-yellow-700',
    performance_ready: 'bg-green-100 text-green-700',
    performed: 'bg-purple-100 text-purple-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    planning: 'Planificación',
    learning: 'Aprendizaje',
    polishing: 'Pulimiento',
    performance_ready: 'Lista',
    performed: 'Interpretada',
  };
  return texts[status] || status;
};

const getWorkProgress = (work: MusicalWork): number => {
  try {
    if (!work || !work.startDate || !work.endDate) return 0;
    
    // Asegurar que las fechas sean válidas
    const start = new Date(work.startDate);
    const end = new Date(work.endDate);
    
    // Verificar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Fechas inválidas para la obra:', work.name || work.id);
      return 0;
    }
    
    const startTime = start.getTime();
    const endTime = end.getTime();
    const now = new Date().getTime();
    
    if (now < startTime) return 0;
    if (now > endTime) return 100;
    
    return Math.round(((now - startTime) / (endTime - startTime)) * 100);
  } catch (error) {
    console.error('Error calculando progreso para obra:', work.name || work.id, error);
    return 0;
  }
};

const getEventIcon = (type: string): string => {
  const icons: Record<string, string> = {
    rehearsal: '🎼',
    sectional: '🎵',
    performance: '🎭',
    evaluation: '📋',
    meeting: '👥',
  };
  return icons[type] || '📅';
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const onWorkCreated = (work: MusicalWork) => {
  showCreateWork.value = false;
  emit('work-selected', work);
  // Después de crear una obra, recargar las obras para que aparezca en la lista
  loadWorks();
};

const onProjectCreated = (projectId: string) => {
  showCreateProject.value = false;
  // Después de crear un proyecto, recargar los proyectos y seleccionar el nuevo
  loadProjects().then(() => {
    if (projects.value.length > 0) {
      const newProject = projects.value.find(p => p.id === projectId) || projects.value[0];
      if (newProject) {
        // Aquí podrías redirigir al nuevo proyecto o simplemente seleccionarlo
        // Por ahora, solo lo seleccionamos si no es el actual
        if (currentProject.value?.id !== newProject.id) {
          // selectProject(newProject.id); // Si tuvieras un selectProject expuesto por useMontaje
          // Como no lo tenemos, forzamos la asignación y guardamos en localStorage
          currentProject.value = newProject;
          localStorage.setItem('montaje_current_project', newProject.id);
        }
      }
    }
  });
};

const onSessionScheduled = (session: any) => {
  showScheduleSession.value = false;
  // Add to upcoming events
  upcomingEvents.value.unshift({
    id: session.id,
    title: session.title,
    type: session.type,
    date: `${session.date}T${session.startTime}:00`,
    location: session.location,
  });
};

const goToWorkDetail = (work: MusicalWork) => {
  router.push({ name: 'montaje-work-detail', params: { id: work.id } });
};

const goToRoute = (routeName: string) => {
  router.push({ name: routeName });
};

onMounted(async () => {
  await loadProjects();
  await loadWorks();
});

// Observar cambios en currentProject para recargar obras si el proyecto cambia
watch(currentProject, (newProject, oldProject) => {
  if (newProject?.id !== oldProject?.id) {
    loadWorks();
  }
});
</script>