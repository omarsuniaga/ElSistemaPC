<template>
  <div class="admin-classes min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Clases
            </h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Administra las clases y sesiones de la academia
            </p>
          </div>
          
          <div class="flex items-center space-x-3">
            <button
              @click="refreshData"
              :disabled="isLoading"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isLoading }]" />
              Actualizar
            </button>
            
            <button
              @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              Nueva Clase
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="p-4 sm:p-6 lg:px-8">
      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Clases"
          :value="stats.total"
          :change="stats.totalChange"
          trend="up"
          color="blue"
          icon="book"
          :loading="isLoading"
        />
        
        <MetricCard
          title="Clases Activas"
          :value="stats.active"
          :change="stats.activeChange"
          trend="up"
          color="green"
          icon="check"
          :loading="isLoading"
        />
        
        <MetricCard
          title="Esta Semana"
          :value="stats.thisWeek"
          :change="stats.weekChange"
          trend="up"
          color="purple"
          icon="calendar"
          :loading="isLoading"
        />
        
        <MetricCard
          title="Capacidad Promedio"
          :value="`${stats.avgCapacity}%`"
          :change="stats.capacityChange"
          trend="stable"
          color="yellow"
          icon="users"
          :loading="isLoading"
        />
      </div>

      <!-- Filters and search -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Search -->
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar clases, maestros o estudiantes..."
                class="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
          </div>

          <!-- Status filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              v-model="filters.status"
              class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="active">Activas</option>
              <option value="scheduled">Programadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <!-- Instrument filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instrumento
            </label>
            <select
              v-model="filters.instrument"
              class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="piano">Piano</option>
              <option value="guitar">Guitarra</option>
              <option value="violin">Violín</option>
              <option value="drums">Batería</option>
              <option value="voice">Canto</option>
            </select>
          </div>

          <!-- Modality filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modalidad
            </label>
            <select
              v-model="filters.modality"
              class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="">Todas</option>
              <option value="individual">Individual</option>
              <option value="group">Grupal</option>
              <option value="masterclass">Masterclass</option>
            </select>
          </div>
        </div>

        <!-- Clear filters -->
        <div class="mt-4 flex justify-between items-center">
          <button
            @click="clearFilters"
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
          >
            Limpiar filtros
          </button>
          <span v-if="hasActiveFilters" class="text-sm text-blue-600 dark:text-blue-400">
            {{ filteredClasses.length }} resultado{{ filteredClasses.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Classes table -->
      <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Loading state -->
        <div v-if="isLoading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-500 dark:text-gray-400">Cargando clases...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredClasses.length === 0" class="p-8 text-center">
          <BookOpenIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ hasActiveFilters ? 'No se encontraron clases' : 'No hay clases registradas' }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            {{ hasActiveFilters 
              ? 'Intenta cambiar los filtros de búsqueda' 
              : 'Comienza creando tu primera clase' 
            }}
          </p>
          <button
            v-if="!hasActiveFilters"
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Crear primera clase
          </button>
        </div>

        <!-- Classes table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Clase
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Maestro
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estudiantes
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Horario
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="classItem in paginatedClasses"
                :key="classItem.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ classItem.name }}
                    </div>
                    <div class="flex items-center space-x-2 mt-1">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {{ classItem.instrument }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ classItem.level }}
                      </span>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ classItem.teacher }}
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ classItem.enrolledStudents }}/{{ classItem.maxStudents }}
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      class="bg-green-600 h-2 rounded-full transition-all duration-300"
                      :style="`width: ${(classItem.enrolledStudents / classItem.maxStudents) * 100}%`"
                    ></div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ classItem.schedule.day }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ classItem.schedule.time }}
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClasses(classItem.status)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ getStatusLabel(classItem.status) }}
                  </span>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="viewClass(classItem)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="Ver detalles"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                    
                    <button
                      @click="editClass(classItem)"
                      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    
                    <button
                      @click="manageStudents(classItem)"
                      class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                      title="Gestionar estudiantes"
                    >
                      <UserGroupIcon class="w-4 h-4" />
                    </button>
                    
                    <button
                      @click="deleteClass(classItem)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando
                  <span class="font-medium">{{ startIndex + 1 }}</span>
                  a
                  <span class="font-medium">{{ Math.min(endIndex, filteredClasses.length) }}</span>
                  de
                  <span class="font-medium">{{ filteredClasses.length }}</span>
                  clases
                </p>
              </div>
              
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    @click="previousPage"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    <ChevronLeftIcon class="h-5 w-5" />
                  </button>
                  
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="goToPage(page)"
                    :class="[
                      'relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors',
                      page === currentPage
                        ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                    ]"
                  >
                    {{ page }}
                  </button>
                  
                  <button
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    <ChevronRightIcon class="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <CreateClassModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handleClassCreated"
    />

    <EditClassModal
      :show="showEditModal"
      :class="selectedClass"
      @close="showEditModal = false"
      @updated="handleClassUpdated"
    />

    <ManageStudentsModal
      :show="showStudentsModal"
      :class="selectedClass"
      @close="showStudentsModal = false"
      @updated="handleStudentsUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  EyeIcon,
  PencilIcon,
  UserGroupIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';

// Components
import MetricCard from '../components/MetricCard.vue';
import CreateClassModal from '../components/CreateClassModal.vue';
import EditClassModal from '../../Classes/components/ClassEditModal.vue';
import ManageStudentsModal from '../components/ClassAssignmentModal.vue';

// Stores
import { useClassesStore } from '../../Classes/store/classes';

// State
const router = useRouter();
const classesStore = useClassesStore();

const searchQuery = ref('');
const isLoading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showStudentsModal = ref(false);
const selectedClass = ref(null);

const filters = ref({
  status: '',
  instrument: '',
  modality: ''
});

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Mock data for demonstration
const classes = ref([
  {
    id: '1',
    name: 'Piano Intermedio A',
    instrument: 'Piano',
    level: 'Intermedio',
    teacher: 'Prof. Elena Martínez',
    enrolledStudents: 6,
    maxStudents: 8,
    status: 'active',
    modality: 'group',
    schedule: {
      day: 'Lunes',
      time: '16:00-17:00'
    }
  },
  {
    id: '2',
    name: 'Guitarra Principiante',
    instrument: 'Guitarra',
    level: 'Principiante',
    teacher: 'Mtro. Carlos Díaz',
    enrolledStudents: 1,
    maxStudents: 1,
    status: 'active',
    modality: 'individual',
    schedule: {
      day: 'Miércoles',
      time: '18:00-19:00'
    }
  },
  {
    id: '3',
    name: 'Violín Avanzado',
    instrument: 'Violín',
    level: 'Avanzado',
    teacher: 'Mtra. Ana Vásquez',
    enrolledStudents: 4,
    maxStudents: 6,
    status: 'scheduled',
    modality: 'group',
    schedule: {
      day: 'Viernes',
      time: '15:00-16:30'
    }
  }
]);

// Computed
const stats = computed(() => ({
  total: classes.value.length,
  active: classes.value.filter(c => c.status === 'active').length,
  thisWeek: classes.value.filter(c => c.status === 'active' || c.status === 'scheduled').length,
  avgCapacity: Math.round(classes.value.reduce((acc, c) => acc + (c.enrolledStudents / c.maxStudents), 0) / classes.value.length * 100),
  totalChange: 5.2,
  activeChange: 8.1,
  weekChange: 12.3,
  capacityChange: 2.5
}));

const hasActiveFilters = computed(() => 
  searchQuery.value || filters.value.status || filters.value.instrument || filters.value.modality
);

const filteredClasses = computed(() => {
  let filtered = [...classes.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.teacher.toLowerCase().includes(query) ||
      c.instrument.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (filters.value.status) {
    filtered = filtered.filter(c => c.status === filters.value.status);
  }

  // Instrument filter
  if (filters.value.instrument) {
    filtered = filtered.filter(c => c.instrument.toLowerCase() === filters.value.instrument);
  }

  // Modality filter
  if (filters.value.modality) {
    filtered = filtered.filter(c => c.modality === filters.value.modality);
  }

  return filtered;
});

// Pagination
const totalPages = computed(() => Math.ceil(filteredClasses.value.length / itemsPerPage.value));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => startIndex.value + itemsPerPage.value);

const paginatedClasses = computed(() =>
  filteredClasses.value.slice(startIndex.value, endIndex.value)
);

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage.value - half);
  const end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// Methods
const refreshData = async () => {
  isLoading.value = true;
  try {
    await classesStore.fetchClasses();
  } catch (error) {
    console.error('Error refreshing classes:', error);
  } finally {
    isLoading.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = '';
  filters.value = {
    status: '',
    instrument: '',
    modality: ''
  };
  currentPage.value = 1;
};

const getStatusClasses = (status: string) => {
  const classes = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    scheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  };
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Activa',
    scheduled: 'Programada',
    completed: 'Completada',
    cancelled: 'Cancelada'
  };
  return labels[status as keyof typeof labels] || status;
};

const viewClass = (classItem: any) => {
  router.push(`/admin/classes/${classItem.id}`);
};

const editClass = (classItem: any) => {
  selectedClass.value = classItem;
  showEditModal.value = true;
};

const manageStudents = (classItem: any) => {
  selectedClass.value = classItem;
  showStudentsModal.value = true;
};

const deleteClass = (classItem: any) => {
  if (confirm(`¿Estás seguro de que deseas eliminar la clase "${classItem.name}"?`)) {
    classes.value = classes.value.filter(c => c.id !== classItem.id);
  }
};

const handleClassCreated = (newClass: any) => {
  classes.value.unshift(newClass);
  showCreateModal.value = false;
};

const handleClassUpdated = (updatedClass: any) => {
  const index = classes.value.findIndex(c => c.id === updatedClass.id);
  if (index !== -1) {
    classes.value[index] = updatedClass;
  }
  showEditModal.value = false;
};

const handleStudentsUpdated = () => {
  refreshData();
  showStudentsModal.value = false;
};

// Pagination methods
const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const goToPage = (page: number) => {
  currentPage.value = page;
};

// Watch for filter changes to reset pagination
watch([searchQuery, filters], () => {
  currentPage.value = 1;
}, { deep: true });

// Lifecycle
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
/* Custom animations */
.hover\:bg-gray-50:hover {
  background-color: rgba(249, 250, 251, 0.5);
}

.dark .hover\:bg-gray-700\/50:hover {
  background-color: rgba(55, 65, 81, 0.5);
}

/* Progress bar animation */
.bg-green-600 {
  transition: width 0.3s ease;
}

/* Table row hover effects */
tbody tr {
  transition: all 0.2s ease;
}

tbody tr:hover {
  transform: translateX(2px);
}

/* Button hover effects */
button {
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}
</style>