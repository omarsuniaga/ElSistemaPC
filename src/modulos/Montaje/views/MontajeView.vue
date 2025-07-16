<!-- src/modulos/Montaje/views/MontajeView.vue -->
<template>
  <div class="montaje-module min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Módulo Montaje</h1>
            <span
              class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full"
            >
              {{ montajeStore.notificacionesSinLeer.length }} pendientes
            </span>
          </div>

          <div class="flex items-center space-x-4">
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
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2m5 0a2 2 0 012 2v12a2 2 0 01-2 2h-5"
                  />
                </svg>
                <span
                  v-if="montajeStore.notificacionesSinLeer.length > 0"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center"
                >
                  {{ montajeStore.notificacionesSinLeer.length }}
                </span>
              </button>

              <!-- Notifications Dropdown -->
              <div
                v-if="showNotifications"
                class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20"
              >
                <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Notificaciones
                    </h3>
                    <button
                      v-if="montajeStore.notificacionesSinLeer.length > 0"
                      class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      @click="montajeStore.markAllNotificationsAsRead"
                    >
                      Marcar todas como leídas
                    </button>
                  </div>
                </div>
                <div class="max-h-64 overflow-y-auto">
                  <div
                    v-for="notification in montajeStore.notificaciones.slice(0, 10)"
                    :key="notification.id"
                    :class="[
                      'p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
                      !notification.metadatos.leida ? 'bg-blue-50 dark:bg-blue-900/20' : '',
                    ]"
                    @click="montajeStore.marcarNotificacionLeida(notification.id)"
                  >
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ notification.titulo }}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {{ notification.mensaje }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {{ formatDate(notification.fechaCreacion?.toDate?.() || new Date()) }}
                    </div>
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
      <StatsCards :works="montajeStore.obras" />

      <!-- Tab Navigation -->
      <div class="mb-8">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              montajeStore.activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600',
            ]"
            @click="montajeStore.setActiveTab(tab.key as 'obras' | 'planes' | 'evaluaciones' | 'analytics')"
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

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Works Tab -->
        <div v-if="montajeStore.activeTab === 'obras'" class="space-y-6">
          <!-- Works List -->
          <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Obras del Repertorio
              </h3>

              <!-- Empty state -->
              <div v-if="filteredWorks.length === 0" class="text-center py-12">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay obras</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comienza creando una nueva obra musical.
                </p>
                <div class="mt-6">
                  <button
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    @click="showWorkModal = true"
                  >
                    <svg
                      class="-ml-1 mr-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Nueva Obra
                  </button>
                </div>
              </div>
              <!-- Works list -->
              <div v-else class="space-y-4">
                <div
                  v-for="work in filteredWorks"
                  :key="work.id"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  @click="openWorkDetail(work)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ work.titulo || work.title }}
                      </h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ work.compositor || work.composer }}
                      </p>
                      <div
                        class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
                      >
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                        >
                          {{ work.metadatos?.complejidadGeneral || work.difficulty }}
                        </span>
                        <span class="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {{ work.duracionEstimada || work.estimatedDuration }} min
                        </span>
                        <span class="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M9 19V6l12-3v13M9 19c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm12-3c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z"
                            />
                          </svg>
                          {{ work.metadatos?.totalCompases || 0 }} compases
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="text-right">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ work.metadatos?.progresoPorcentaje || work.progress || 0 }}%
                        </div>
                        <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            :style="{
                              width:
                                (work.metadatos?.progresoPorcentaje || work.progress || 0) + '%',
                            }"
                          />
                        </div>
                      </div>
                      <div class="flex space-x-2" @click.stop>
                        <button
                          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar obra"
                          @click="editWork(work)"
                        >
                          <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar obra"
                          @click="montajeStore.eliminarObra(work.id)"
                        >
                          <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Plans Tab -->
        <div v-if="activeTab === 'planes'" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Planes de Acción
              </h3>

              <div class="text-center py-12">
                <div class="text-gray-500 dark:text-gray-400">
                  Los planes de acción se mostrarán aquí próximamente.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Evaluations Tab -->
        <div v-if="activeTab === 'evaluaciones'" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Evaluaciones
              </h3>

              <div class="text-center py-12">
                <div class="text-gray-500 dark:text-gray-400">
                  Las evaluaciones se mostrarán aquí próximamente.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics Tab -->
        <div v-if="activeTab === 'analytics'" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Análisis y Estadísticas
              </h3>

              <div class="text-center py-12">
                <div class="text-gray-500 dark:text-gray-400">
                  Los análisis detallados se mostrarán aquí próximamente.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <WorkFormModal
      :show="showWorkModal"
      :work="montajeStore.selectedWork"
      @close="closeWorkModal"
      @submit="handleWorkSubmit"
    />

    <PlanModal
      :show="showPlanModal"
      :work-id="montajeStore.selectedWork?.id"
      @close="showPlanModal = false"
      @submit="handlePlanSubmit"
    />

    <EvaluationModal
      :show="showEvaluationModal"
      :work-id="montajeStore.selectedWork?.id"
      @close="closeEvaluationModal"
      @submit="handleEvaluationSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMontajeStore } from '../store/montaje';
import WorkFormModal from '../components/WorkFormModal.vue';
import PlanModal from '../components/PlanModal.vue';
import EvaluationModal from '../components/EvaluationModal.vue';
import StatsCards from '../components/StatsCards.vue';
import type { CreateWorkInput, CreateEvaluationInput } from '../types';

// Router
const router = useRouter();

// Pinia Store
const montajeStore = useMontajeStore();

// Local state
const showWorkModal = ref(false);
const showPlanModal = ref(false);
const showEvaluationModal = ref(false);
const showNotifications = ref(false);

// Computed
const tabs = computed(() => [
  {
    key: 'obras',
    label: 'Obras',
    count: montajeStore.obras.length,
  },
  {
    key: 'planes',
    label: 'Planes',
    count: 0,
  },
  {
    key: 'evaluaciones',
    label: 'Evaluaciones',
    count: 0,
  },
  {
    key: 'analytics',
    label: 'Análisis',
  },
]);

const filteredWorks = computed(() => {
  let filtered = montajeStore.obras;

  if (montajeStore.searchQuery) {
    filtered = filtered.filter(
      (work) =>
        work.title?.toLowerCase().includes(montajeStore.searchQuery.toLowerCase()) ||
        work.composer?.toLowerCase().includes(montajeStore.searchQuery.toLowerCase()),
    );
  }

  if (montajeStore.statusFilter) {
    filtered = filtered.filter((work) => {
      switch (montajeStore.statusFilter) {
      case 'active':
        return work.status === 'en_montaje' || work.status === 'en_estudio';
      case 'completed':
        return work.status === 'presentada' || work.status === 'lista';
      case 'inactive':
        return work.status === 'pendiente';
      case 'archived':
        return work.status === 'archivada';
      default:
        return true;
      }
    });
  }

  if (montajeStore.difficultyFilter) {
    filtered = filtered.filter((work) => work.difficulty === montajeStore.difficultyFilter);
  }

  return filtered;
});

// Methods
const closeWorkModal = () => {
  showWorkModal.value = false;
  montajeStore.selectWork(null);
  montajeStore.clearSelectedWork();
};

const closeEvaluationModal = () => {
  showEvaluationModal.value = false;
  workToEvaluate.value = null;
};

const editWork = (work: any) => {
  montajeStore.selectWork(work);
  showWorkModal.value = true;
};

const openWorkDetail = (work: any) => {
  console.log('🎵 Abriendo detalle de obra:', work.titulo || work.title || 'Sin título');
  console.log('📄 Datos completos de la obra:', work);

  if (!work.id) {
    console.error('❌ Error: La obra no tiene ID');
    return;
  }

  // Navegar solo con el ID de la obra
  router.push({
    name: 'MontajeObraDetail',
    params: { id: work.id },
  });
};

const handleWorkSubmit = async (workData: CreateWorkInput) => {
  try {
    console.log('🔄 Iniciando guardado de obra:', workData);

    const completeWorkData = {
      ...workData,
      repertorioId: 'default-repertorio',
    };

    if (montajeStore.selectedWork) {
      console.log('📝 Actualizando obra existente:', montajeStore.selectedWork.id);
      await montajeStore.actualizarObra(montajeStore.selectedWork.id, completeWorkData);
      console.log('✅ Obra actualizada exitosamente');
    } else {
      console.log('➕ Creando nueva obra');
      const result = await montajeStore.crearObra(completeWorkData);
      console.log('✅ Obra creada exitosamente:', result);
    }
    closeWorkModal();
  } catch (error) {
    console.error('❌ Error saving work:', error);
    alert(`Error al guardar la obra: ${error.message || error}`);
  }
};

const handlePlanSubmit = async (planData: any) => {
  try {
    console.log('Plan data:', planData);
    await montajeStore.crearPlanAccion(planData);
    showPlanModal.value = false;
  } catch (error) {
    console.error('Error creating plan:', error);
  }
};

const handleEvaluationSubmit = async (evaluationData: CreateEvaluationInput) => {
  try {
    console.log('Evaluation data:', evaluationData);
    await montajeStore.crearEvaluacionContinua(evaluationData);
    closeEvaluationModal();
  } catch (error) {
    console.error('Error creating evaluation:', error);
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Lifecycle
onMounted(async () => {
  try {
    await montajeStore.cargarObras('default-repertorio');
    console.log('✅ Datos del módulo Montaje cargados');
  } catch (error) {
    console.error('❌ Error loading montaje data:', error);
  }
});
</script>

<style scoped>
.tab-content {
  min-height: 400px;
}
</style>
