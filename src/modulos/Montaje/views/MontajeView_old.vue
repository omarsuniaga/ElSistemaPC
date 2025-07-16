<template>
  <div class="montaje-module min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Módulo Montaje</h1>
            <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
              {{ unreadNotifications.length }} pendientes 
            </span>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Toggle de tema oscuro/claro -->
            <button
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              :title="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
              @click="toggleDarkMode"
            >
              <SunIcon v-if="isDarkMode" class="w-5 h-5 text-yellow-500" />
              <MoonIcon v-else class="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <!-- Quick Actions -->
            <button
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md transition-colors"
              @click="showWorkModal = true"
            >
              Nueva Obra
            </button>
            
            <button
              class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-md transition-colors"
              @click="showPlanModal = true"
            >
              Nuevo Plan
            </button>

            <button
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-md transition-colors"
              @click="showEvaluationModal = true"
            >
              Nueva Evaluación
            </button>
              
            <!-- Notifications -->
            <div class="relative">
              <button
                class="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 relative"
                @click="showNotifications = !showNotifications"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2m5 0a2 2 0 012 2v12a2 2 0 01-2 2h-5"/>
                </svg>
                <span
                  v-if="unreadNotifications.length > 0"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center"
                >
                  {{ unreadNotifications.length }}
                </span>
              </button>
              
              <!-- Notifications Dropdown -->
              <div
                v-if="showNotifications"
                class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20"
              >
                <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">Notificaciones</h3>
                    <button
                      v-if="unreadNotifications.length > 0"
                      class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      @click="markAllNotificationsAsRead"
                    >
                      Marcar todas como leídas
                    </button>
                  </div>
                </div>
                <div class="max-h-64 overflow-y-auto">                  
                  <div
                    v-for="notification in notifications.slice(0, 10)"
                    :key="notification.id"
                    :class="[
                      'p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
                      !notification.metadatos.leida ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    ]"
                    @click="markNotificationAsRead(notification.id)"
                  >
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ notification.titulo }}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">{{ notification.mensaje }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatDate(notification.fechaCreacion.toDate()) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Statistics Cards -->
      <StatsCards :works="worksWithProgress" />

      <!-- Tab Navigation -->
      <div class="mb-8">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
            @click="setActiveTab(tab.key)"
          >
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              class="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              class="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">        <!-- Works Tab -->
        <div v-if="activeTab === 'obras'" class="space-y-6">
          <!-- Filters and Search -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Buscar obras..."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div>
                <select
                  v-model="statusFilter"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activas</option>
                  <option value="completed">Completadas</option>
                  <option value="inactive">Inactivas</option>
                  <option value="archived">Archivadas</option>
                </select>
              </div>
              <div>
                <select
                  v-model="difficultyFilter"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todas las dificultades</option>
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>
              <div>
                <button
                  class="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  @click="clearFilters"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          <!-- Works Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WorkCard
              v-for="work in filteredWorks"
              :key="work.id"
              :work="work"
              :average-score="getAverageScore(work.id)"
              :progress-percentage="getWorkProgress(work.id)"
              @view="viewWork"
              @edit="editWork"
              @duplicate="duplicateWork"
              @evaluate="evaluateWork"
              @delete="deleteWork"
            />
          </div>

          <!-- Empty State -->
          <div v-if="filteredWorks.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay obras</h3>
            <p class="mt-1 text-sm text-gray-500">Comienza creando tu primera obra musical.</p>
            <div class="mt-6">
              <button
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                @click="showWorkModal = true"
              >
                Nueva Obra
              </button>
            </div>
          </div>
        </div>        <!-- Plans Tab -->
        <div v-if="activeTab === 'planes'" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Planes de Montaje</h2>
            <!-- Plans content will be implemented here -->
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Gestión de planes de montaje - En desarrollo
            </div>
          </div>
        </div>

        <!-- Phrases Tab -->
        <div v-if="activeTab === 'frases'" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gestión de Frases</h2>
            <!-- Phrases content will be implemented here -->
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Gestión de frases musicales - En desarrollo
            </div>
          </div>
        </div>

        <!-- Evaluations Tab -->
        <div v-if="activeTab === 'evaluaciones'" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evaluaciones</h2>
            <!-- Evaluations list will be implemented here -->
            <div class="space-y-4">
              <div
                v-for="evaluation in recentEvaluations"
                :key="evaluation.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
              >                <div class="flex items-center justify-between space-x-4">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">{{ getWorkTitle(evaluation.workId) }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300">Evaluado por {{ evaluation.evaluatorId }}</p>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ evaluation.score }}/100</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(evaluation.createdAt) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics Tab -->
        <div v-if="activeTab === 'analytics'">
          <AnalyticsDashboard
            :works="works"
            :evaluations="evaluations"
            :states="states"
            :plans="plans"
          />
        </div>
      </div>
    </div>

    <!-- Modals -->
    <WorkFormModal
      v-if="showWorkModal"
      :work="selectedWork"
      :loading="loading"
      @close="closeWorkModal"
      @submit="handleWorkSubmit"
    />

    <EvaluationForm
      v-if="showEvaluationModal && workToEvaluate"
      :work="convertedWorkToEvaluate"
      :loading="loading"
      @close="closeEvaluationModal"
      @submit="handleEvaluationSubmit"
      @save-draft="handleEvaluationDraft"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMontaje } from '../composables/useMontaje';
import { useTheme } from '../../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline';
import WorkCard from '../components/WorkCard.vue';
import WorkFormModal from '../components/WorkFormModal.vue';
import EvaluationForm from '../components/EvaluationForm.vue';
import AnalyticsDashboard from '../components/AnalyticsDashboard.vue';
import type { Obra, Work, CreateWorkInput, CreateEvaluationInput, EstadoRepertorio } from '../types';
import { TipoInstrumento } from '../types';

// Composables
const {
  works,
  plans,
  phrases,
  states,
  evaluations,
  notifications,
  loading,
  error,
  selectedWork,
  activeTab,
  activeWorks,
  completedWorks,
  currentPlans,
  recentEvaluations,
  unreadNotifications,
  createWork,
  updateWork,  deleteWork: deleteWorkAction,
  createEvaluation,
  getAverageScore,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  loadMontajeData,
  selectWork,
  clearSelection,
  setActiveTab,
} = useMontaje();

// Contexto de tema
const { isDarkMode, toggleDarkMode } = useTheme();

// Local state
const showWorkModal = ref(false);
const showEvaluationModal = ref(false);
const showPlanModal = ref(false);
const showNotifications = ref(false);
const workToEvaluate = ref<Obra | null>(null);

// Filters
const searchQuery = ref('');
const statusFilter = ref('');
const difficultyFilter = ref('');

// Helper functions for type conversions
const convertWorkToObra = (work: Work): any => {
  return {
    ...work,
    estado: work.status as EstadoRepertorio,
  };
};

const convertObraToWork = (obra: any): Work => {
  return {
    ...obra,
    title: obra.titulo,
    composer: obra.compositor,
    description: obra.descripcion,
    estimatedDuration: obra.duracionEstimada,
    instruments: obra.instrumentosRequeridos,
    sheetMusicUrl: obra.archivoPartitura,
    status: obra.estado,
  };
};

// Computed
const tabs = computed(() => [
  {
    key: 'obras' as const,
    label: 'Obras',
    count: works.value.length,
  },
  {
    key: 'planes' as const,
    label: 'Planes',
    count: currentPlans.value.length,
  },
  {
    key: 'frases' as const,
    label: 'Frases',
    count: phrases.value.length,
  },
  {
    key: 'evaluaciones' as const,
    label: 'Evaluaciones',
    count: evaluations.value.length,
  },
  {
    key: 'analytics' as const,
    label: 'Analytics',
  },
]);

const filteredWorks = computed(() => {
  let filtered = works.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(work =>
      work.titulo.toLowerCase().includes(query) ||
      work.compositor?.toLowerCase().includes(query) ||
      work.descripcion?.toLowerCase().includes(query),
    );
  }
  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(work => work.estado === statusFilter.value);
  }

  // Difficulty filter
  if (difficultyFilter.value) {
    filtered = filtered.filter(work => work.metadatos.complejidadGeneral === difficultyFilter.value);
  }

  return filtered;
});

const convertedWorkToEvaluate = computed(() => {
  return workToEvaluate.value ? convertObraToWork(workToEvaluate.value) : null;
});

// Methods
const viewWork = (work: Work) => {
  selectWork(convertWorkToObra(work));
  // Navigate to work detail view (implement routing)
};

const editWork = (work: Work) => {
  selectWork(convertWorkToObra(work));
  showWorkModal.value = true;
};

const duplicateWork = async (work: Work) => {
  try {
    const duplicateData: CreateWorkInput = {
      title: `${work.titulo} (Copia)`,
      titulo: `${work.titulo} (Copia)`,
      composer: work.compositor,
      compositor: work.compositor,
      description: work.descripcion,
      descripcion: work.descripcion,
      totalCompases: work.totalCompases,
      tonalidad: work.tonalidad,
      tempo: work.tempo,
      estimatedDuration: work.duracionEstimada,
      duracionEstimada: work.duracionEstimada,      instruments: work.instrumentosRequeridos.map(inst => inst.instrumentoId as TipoInstrumento),
      instrumentosRequeridos: work.instrumentosRequeridos,
      repertorioId: work.repertorioId,
      sheetMusicUrl: work.archivoPartitura || '',
      archivoPartitura: work.archivoPartitura,
      audioUrl: work.audioUrl,
      videoUrl: work.videoUrl,
      imagenPortada: work.imagenPortada,
      tags: [],
      status: 'planificando' as EstadoRepertorio,
      estado: 'planificando' as EstadoRepertorio,
    };
    
    await createWork(duplicateData);
  } catch (error) {
    console.error('Error duplicating work:', error);
  }
};

const evaluateWork = (work: Work) => {
  workToEvaluate.value = work;
  showEvaluationModal.value = true;
};

const deleteWork = async (work: Work) => {
  if (confirm(`¿Estás seguro de que quieres eliminar "${work.title}"?`)) {
    try {
      await deleteWorkAction(work.id);
    } catch (error) {
      console.error('Error deleting work:', error);
    }
  }
};

const getWorkProgress = (workId: string): number | undefined => {
  // Calculate work progress based on state and evaluations
  const workStates = states.value.filter(state => state.workId === workId);
  if (workStates.length === 0) return undefined;

  const latestState = workStates[workStates.length - 1];
  const progressMap: Record<string, number> = {
    'planning': 10,
    'in-progress': 50,
    'review': 80,
    'completed': 100,
    'archived': 100,
  };

  return progressMap[latestState.currentState] || 0;
};

const getWorkTitle = (workId: string): string => {
  const work = works.value.find(w => w.id === workId);
  return work?.titulo || 'Obra desconocida';
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  difficultyFilter.value = '';
};

const closeWorkModal = () => {
  showWorkModal.value = false;
  clearSelection();
};

const closeEvaluationModal = () => {
  showEvaluationModal.value = false;
  workToEvaluate.value = null;
};

const handleWorkSubmit = async (workData: CreateWorkInput) => {
  try {
    console.log('🔄 Iniciando guardado de obra:', workData);
    
    // Agregar el repertorioId requerido para todas las obras
    const completeWorkData = {
      ...workData,
      repertorioId: 'default-repertorio', // TODO: Obtener el repertorioId del contexto actual
    };
    
    if (selectedWork.value) {
      console.log('📝 Actualizando obra existente:', selectedWork.value.id);
      await updateWork(selectedWork.value.id, completeWorkData);
      console.log('✅ Obra actualizada exitosamente');
    } else {
      console.log('➕ Creando nueva obra');
      const result = await createWork(completeWorkData);
      console.log('✅ Obra creada exitosamente:', result);
    }
    closeWorkModal();
  } catch (error) {
    console.error('❌ Error saving work:', error);
    // Mostrar el error al usuario
    alert(`Error al guardar la obra: ${error.message || error}`);
  }
};

const handleEvaluationSubmit = async (evaluationFormData: CreateEvaluationInput) => {
  try {
    // The createEvaluation function expects additional properties not present in
    // evaluationFormData (which comes from EvaluationForm and is typed by ../types/CreateEvaluationInput).
    // We augment the data here.
    // TODO: Replace placeholder IDs with actual dynamic values from your application's state/context.
    const completeEvaluationData = {
      ...evaluationFormData, // Data from the form (e.g., workId, score, comments)
      metadatos: (evaluationFormData as any).metadatos || {}, // Provide default if not on form data
      estudianteId: (evaluationFormData as any).estudianteId || 'PLACEHOLDER_STUDENT_ID', // Must be replaced with actual student ID
      maestroEvaluadorId: (evaluationFormData as any).maestroEvaluadorId || 'PLACEHOLDER_EVALUATOR_ID', // Must be replaced with actual evaluator ID (e.g., logged-in user)
      fecha: (evaluationFormData as any).fecha || new Date(), // Use date from form if available, else current date
      tiempoSesion: (evaluationFormData as any).tiempoSesion || 0, // Use session time from form if available, else 0
    };

    await createEvaluation(completeEvaluationData as any);
    closeEvaluationModal();
  } catch (error) {
    console.error('Error saving evaluation:', error);
  }
};

const handleEvaluationDraft = async (evaluationData: CreateEvaluationInput) => {
  try {
    // Save as draft (implement draft functionality)
    console.log('Saving evaluation draft:', evaluationData);
  } catch (error) {
    console.error('Error saving evaluation draft:', error);
  }
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Lifecycle
onMounted(async () => {
  try {
    await loadMontajeData();
  } catch (error) {
    console.error('Error loading montaje data:', error);
  }
});
</script>
