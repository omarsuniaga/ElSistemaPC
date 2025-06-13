<template>
  <div class="class-observations-manager">
    <!-- Modal de observaciones específico para una clase -->
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <!-- Header del modal -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold mb-2">📝 Observaciones de Clase</h2>
              <p class="text-blue-100">{{ className }} - {{ formatDate(selectedDate) }}</p>
            </div>
            <button
              @click="closeModal"
              class="text-white hover:text-gray-300 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenido del modal -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
          <!-- Estadísticas rápidas de la clase -->
          <div v-if="classStats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">📝</span>
                </div>
                <div class="ml-3">
                  <div class="text-lg font-bold text-blue-900">{{ classStats.total }}</div>
                  <div class="text-sm text-blue-600">Total observaciones</div>
                </div>
              </div>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">👨‍🏫</span>
                </div>
                <div class="ml-3">
                  <div class="text-lg font-bold text-green-900">{{ classStats.teacherCount }}</div>
                  <div class="text-sm text-green-600">Maestros activos</div>
                </div>
              </div>
            </div>

            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">📅</span>
                </div>
                <div class="ml-3">
                  <div class="text-sm font-medium text-purple-900">{{ formatDate(classStats.lastObservation) }}</div>
                  <div class="text-sm text-purple-600">Última observación</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtros y acciones rápidas -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex flex-col sm:flex-row gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <select
                    v-model="selectedPeriod"
                    @change="loadObservationsForPeriod"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="today">Solo hoy</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mes</option>
                    <option value="all">Todas</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    v-model="selectedType"
                    @change="filterObservations"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="general">General</option>
                    <option value="comportamiento">Comportamiento</option>
                    <option value="academico">Académico</option>
                    <option value="asistencia">Asistencia</option>
                    <option value="evaluacion">Evaluación</option>
                  </select>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  @click="showCreateForm = true"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <span>➕</span>
                  Nueva Observación
                </button>
              </div>
            </div>
          </div>

          <!-- Lista de observaciones -->
          <div class="space-y-4">
            <div v-if="loading" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="mt-2 text-gray-600">Cargando observaciones...</p>
            </div>

            <div v-else-if="filteredObservations.length === 0" class="text-center py-8 text-gray-500">
              <div class="text-4xl mb-4">📝</div>
              <p class="text-lg font-medium">No hay observaciones para mostrar</p>
              <p class="text-sm">Crea la primera observación para esta clase</p>
              <button
                @click="showCreateForm = true"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ➕ Crear observación
              </button>
            </div>

            <div v-else class="space-y-4">
              <div 
                v-for="observation in paginatedObservations" 
                :key="observation.id"
                class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                      <span :class="getTypeClass(observation.type)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ getTypeLabel(observation.type) }}
                      </span>
                      <span :class="getPriorityClass(observation.priority)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ getPriorityLabel(observation.priority) }}
                      </span>
                      <span class="text-sm text-gray-500">
                        {{ formatDateTime(observation.createdAt) }}
                      </span>
                      <span v-if="observation.requiresFollowUp" class="text-orange-500 text-sm">
                        ⚠️ Requiere seguimiento
                      </span>
                    </div>

                    <div class="text-gray-900 leading-relaxed mb-3">
                      {{ observation.text }}
                    </div>

                    <div class="flex items-center gap-4 text-sm text-gray-500">
                      <span>👤 {{ observation.authorName || observation.author }}</span>
                      <span>📝 {{ observation.text.length }} caracteres</span>
                      <span v-if="observation.taggedStudents && observation.taggedStudents.length > 0">
                        👥 {{ observation.taggedStudents.length }} estudiantes mencionados
                      </span>
                    </div>
                  </div>

                  <div class="flex gap-2 ml-4" v-if="canEditObservation(observation)">
                    <button
                      @click="editObservation(observation)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Editar observación"
                    >
                      ✏️
                    </button>
                    <button
                      @click="deleteObservation(observation)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar observación"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <!-- Paginación -->
              <div v-if="totalPages > 1" class="flex items-center justify-between mt-6">
                <div class="text-sm text-gray-700">
                  Mostrando {{ startIndex + 1 }} a {{ Math.min(endIndex, filteredObservations.length) }} de {{ filteredObservations.length }} observaciones
                </div>
                <div class="flex space-x-2">
                  <button
                    @click="previousPage"
                    :disabled="currentPage === 1"
                    class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                    {{ currentPage }} / {{ totalPages }}
                  </span>
                  <button
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>    <!-- Modal de crear/editar observación con formulario inteligente -->
    <div v-if="showCreateForm || editingObservation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden">
        <!-- Header del modal -->
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingObservation ? '✏️ Editar Observación' : '➕ Nueva Observación' }}
            </h3>
            <button
              @click="cancelFormEditing"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenido del modal con formulario inteligente -->
        <div class="overflow-y-auto max-h-[85vh]">
          <SmartObservationForm
            :class-id="props.classId"
            :class-name="props.className || 'Clase'"
            :selected-date="editingObservation?.date || props.selectedDate"
            :initial-text="editingObservation?.text || ''"
            :initial-type="editingObservation?.type || 'general'"
            :initial-priority="editingObservation?.priority || 'media'"
            @observation-saved="handleSmartFormSave"
            @form-updated="handleFormUpdate"
            @cancel="cancelFormEditing"
          />        </div>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div v-if="observationToDelete" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🗑️ Eliminar Observación</h3>
        
        <p class="text-gray-700 mb-6">
          ¿Estás seguro de que deseas eliminar esta observación? Esta acción no se puede deshacer.
        </p>

        <div class="bg-gray-50 border rounded-lg p-3 mb-6">
          <div class="text-sm text-gray-600 mb-1">{{ formatDate(observationToDelete.date) }}</div>
          <div class="text-sm">{{ observationToDelete.text.substring(0, 100) }}...</div>
        </div>

        <div class="flex space-x-3">
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <span v-if="deleting">🗑️ Eliminando...</span>
            <span v-else">🗑️ Sí, eliminar</span>
          </button>
          <button
            @click="observationToDelete = null"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useTeacherObservations } from '../../composables/useObservationManagement';
import { useAuthStore } from '../../stores/auth';
import SmartObservationForm from './SmartObservationForm.vue';
import type { ObservationData } from '../../stores/observations';

// Props
const props = defineProps<{
  isOpen: boolean;
  classId: string;
  className?: string;
  selectedDate: string;
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'observation-created'): void;
  (e: 'observation-updated'): void;
  (e: 'observation-deleted'): void;
}>();

// Composables
const authStore = useAuthStore();
const {
  loading,
  error,
  fetchMyObservations,
  createMyObservation,
  updateMyObservation,
  deleteMyObservation
} = useTeacherObservations();

// Estado reactivo
const observations = ref<ObservationData[]>([]);
const filteredObservations = ref<ObservationData[]>([]);
const selectedPeriod = ref('today');
const selectedType = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const saving = ref(false);
const deleting = ref(false);

// Modales
const showCreateForm = ref(false);
const editingObservation = ref<ObservationData | null>(null);
const observationToDelete = ref<ObservationData | null>(null);

// Formulario
const observationForm = ref<{
  classId: string;
  date: string;
  type: 'general' | 'comportamiento' | 'academico' | 'asistencia' | 'evaluacion';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  text: string;
  requiresFollowUp: boolean;
}>({
  classId: '',
  date: '',
  type: 'general',
  priority: 'media',
  text: '',
  requiresFollowUp: false
});

// Computed properties
const classStats = computed(() => {
  const classObservations = observations.value.filter(obs => obs.classId === props.classId);
  
  return {
    total: classObservations.length,
    teacherCount: new Set(classObservations.map(obs => obs.authorId)).size,
    lastObservation: classObservations[0]?.date || null
  };
});

const totalPages = computed(() => 
  Math.ceil(filteredObservations.value.length / itemsPerPage.value)
);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => startIndex.value + itemsPerPage.value);

const paginatedObservations = computed(() => 
  filteredObservations.value.slice(startIndex.value, endIndex.value)
);

// Métodos
const loadObservations = async () => {
  try {
    const allObservations = await fetchMyObservations();
    observations.value = allObservations || [];
    filterObservations();
  } catch (err) {
    console.error('Error loading observations:', err);
  }
};

const loadObservationsForPeriod = () => {
  let dateFilter = new Date();
  const today = new Date(props.selectedDate);
  
  switch (selectedPeriod.value) {
    case 'today':
      dateFilter = today;
      break;
    case 'week':
      dateFilter = new Date(today);
      dateFilter.setDate(dateFilter.getDate() - 7);
      break;
    case 'month':
      dateFilter = new Date(today);
      dateFilter.setMonth(dateFilter.getMonth() - 1);
      break;
    case 'all':
      dateFilter = null;
      break;
  }
  
  filterObservations(dateFilter);
};

const filterObservations = (dateFilter: Date | null = null) => {
  let filtered = observations.value.filter(obs => obs.classId === props.classId);
  
  // Filtro por tipo
  if (selectedType.value) {
    filtered = filtered.filter(obs => obs.type === selectedType.value);
  }
  
  // Filtro por fecha
  if (dateFilter) {
    filtered = filtered.filter(obs => {
      const obsDate = new Date(obs.date);
      return obsDate >= dateFilter;
    });
  } else if (selectedPeriod.value === 'today') {
    filtered = filtered.filter(obs => obs.date === props.selectedDate);
  }
  
  // Ordenar por fecha (más reciente primero)
  filtered.sort((a, b) => {
    const dateA = new Date(a.createdAt as string || a.date);
    const dateB = new Date(b.createdAt as string || b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  filteredObservations.value = filtered;
  currentPage.value = 1;
};

const canEditObservation = (observation: ObservationData) => {
  return observation.authorId === authStore.user?.uid;
};

const editObservation = (observation: ObservationData) => {
  editingObservation.value = observation;
  observationForm.value = {
    classId: observation.classId,
    date: observation.date,
    type: observation.type,
    priority: observation.priority,
    text: observation.text,
    requiresFollowUp: observation.requiresFollowUp
  };
};

const deleteObservation = (observation: ObservationData) => {
  observationToDelete.value = observation;
};

const confirmDelete = async () => {
  if (!observationToDelete.value) return;

  try {
    deleting.value = true;
    await deleteMyObservation(observationToDelete.value.id);
    await loadObservations();
    observationToDelete.value = null;
    emit('observation-deleted');
  } catch (err) {
    console.error('Error deleting observation:', err);
  } finally {
    deleting.value = false;
  }
};

const saveObservation = async () => {
  try {
    saving.value = true;
    observationForm.value.classId = props.classId;

    if (editingObservation.value) {
      await updateMyObservation(editingObservation.value.id, observationForm.value);
      emit('observation-updated');
    } else {
      await createMyObservation(observationForm.value);
      emit('observation-created');
    }

    await loadObservations();
    cancelEdit();
  } catch (err) {
    console.error('Error saving observation:', err);
  } finally {
    saving.value = false;
  }
};

const cancelEdit = () => {
  showCreateForm.value = false;
  editingObservation.value = null;
  observationForm.value = {
    classId: props.classId,
    date: props.selectedDate,
    type: 'general',
    priority: 'media',
    text: '',
    requiresFollowUp: false
  };
};

const closeModal = () => {
  emit('close');
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES');
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('es-ES');
};

const getTypeClass = (type: string) => {
  const classes = {
    general: 'bg-gray-100 text-gray-800',
    comportamiento: 'bg-red-100 text-red-800',
    academico: 'bg-blue-100 text-blue-800',
    asistencia: 'bg-yellow-100 text-yellow-800',
    evaluacion: 'bg-green-100 text-green-800'
  };
  return classes[type as keyof typeof classes] || classes.general;
};

const getTypeLabel = (type: string) => {
  const labels = {
    general: 'General',
    comportamiento: 'Comportamiento',
    academico: 'Académico',
    asistencia: 'Asistencia',
    evaluacion: 'Evaluación'
  };
  return labels[type as keyof typeof labels] || type;
};

const getPriorityClass = (priority: string) => {
  const classes = {
    baja: 'bg-green-100 text-green-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800'
  };
  return classes[priority as keyof typeof classes] || classes.media;
};

const getPriorityLabel = (priority: string) => {
  const labels = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    critica: 'Crítica'
  };
  return labels[priority as keyof typeof labels] || priority;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Funciones para manejar el formulario inteligente
const handleSmartFormSave = async (observationData: any) => {
  try {
    saving.value = true;
    
    if (editingObservation.value) {
      // Actualizar observación existente
      await updateMyObservation(editingObservation.value.id, observationData);
      emit('observation-updated');
    } else {
      // Crear nueva observación
      await createMyObservation(observationData);
      emit('observation-created');
    }
    
    // Recargar observaciones y cerrar formulario
    await loadObservations();
    cancelFormEditing();
    
  } catch (error) {
    console.error('Error al guardar observación inteligente:', error);
  } finally {
    saving.value = false;
  }
};

const handleFormUpdate = (formData: any) => {
  // Manejar actualizaciones del formulario si es necesario
  console.log('Formulario actualizado:', formData);
};

const cancelFormEditing = () => {
  showCreateForm.value = false;
  editingObservation.value = null;
  
  // Resetear el formulario original si es necesario
  observationForm.value = {
    classId: props.classId,
    date: props.selectedDate,
    type: 'general',
    priority: 'media',
    text: '',
    requiresFollowUp: false
  };
};

// Watchers
watch(() => props.classId, () => {
  if (props.classId) {
    loadObservations();
  }
});

watch(() => props.selectedDate, () => {
  observationForm.value.date = props.selectedDate;
  if (selectedPeriod.value === 'today') {
    filterObservations();
  }
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    observationForm.value.classId = props.classId;
    observationForm.value.date = props.selectedDate;
    loadObservations();
  }
});

// Lifecycle
onMounted(() => {
  if (props.isOpen && props.classId) {
    loadObservations();
  }
});
</script>
