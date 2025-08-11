<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with breadcrumb and actions -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- Breadcrumb -->
            <nav class="flex" aria-label="Breadcrumb">
              <ol class="inline-flex items-center space-x-1 md:space-x-3">
                <li class="inline-flex items-center">
                  <router-link
                    to="/admin"
                    class="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  >
                    <HomeIcon class="w-4 h-4 mr-2" />
                    Admin
                  </router-link>
                </li>
                <li>
                  <div class="flex items-center">
                    <ChevronRightIcon class="w-4 h-4 text-gray-400" />
                    <span class="ml-1 text-gray-500 dark:text-gray-400">Estudiantes</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <button
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="exportStudents"
            >
              <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
              Exportar
            </button>

            <button
              v-if="canCreateStudent"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="showCreateModal = true"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              Nuevo Estudiante
            </button>
          </div>
        </div>

        <!-- Title and stats -->
        <div class="mt-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Estudiantes</h1>
          <div class="mt-2 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <span>Total: {{ totalStudents }}</span>
            <span>Activos: {{ activeStudents }}</span>
            <span>Nuevos este mes: {{ newThisMonth }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <!-- Filters Toggle Button -->
      <div class="flex justify-between items-center mb-4">
        <button
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="showFilters = !showFilters"
        >
          <FunnelIcon class="h-4 w-4 mr-2" />
          {{ showFilters ? 'Ocultar filtros' : 'Mostrar filtros' }}
        </button>
        
        <!-- View Toggle -->
        <div class="flex items-center space-x-2">
          <button
            title="Vista de cuadrícula"
            :class="[
              'p-2 rounded-md',
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            ]"
            @click="viewMode = 'grid'"
          >
            <Squares2X2Icon class="w-5 h-5" />
          </button>
          <button
            title="Vista de lista"
            :class="[
              'p-2 rounded-md',
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            ]"
            @click="viewMode = 'list'"
          >
            <ListBulletIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Filters Panel -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div 
          v-show="showFilters"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Search -->
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                v-model.lazy="searchQuery"
                type="text"
                placeholder="Buscar estudiantes..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                @keyup.enter="applyFilters()"
              />
            </div>

            <!-- Status Filter -->
            <div class="relative">
              <select
                v-model="statusFilter"
                class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>

            <!-- Grade Filter -->
            <div class="relative">
              <select
                v-model="gradeFilter"
                class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los niveles</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            <!-- Instrument Filter -->
            <div class="relative">
              <select
                v-model="instrumentFilter"
                class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los instrumentos</option>
                <option value="piano">Piano</option>
                <option value="guitar">Guitarra</option>
                <option value="violin">Violín</option>
                <option value="drums">Batería</option>
                <option value="voice">Canto</option>
              </select>
            </div>
          </div>

          <!-- Clear filters and pagination controls -->
          <div class="mt-4 flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <button
                class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                @click="clearFilters"
              >
                Limpiar filtros
              </button>
              <span v-if="hasActiveFilters" class="text-sm text-blue-600 dark:text-blue-400">
                {{ filteredStudents.length }} resultados
              </span>
              
              <!-- Items per page selector -->
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">Mostrar:</span>
                <select
                  v-model="itemsPerPage"
                  class="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  @change="currentPage = 1"
                >
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                  <option :value="200">200</option>
                  <option v-if="filteredStudents.length > 0" :value="filteredStudents.length">
                    Todos ({{ filteredStudents.length }})
                  </option>
                </select>
                <span class="text-sm text-gray-500 dark:text-gray-400">por página</span>
              </div>
            </div>

            <!-- View toggle -->
            <div class="flex items-center space-x-2">
              <button
                :class="[
                  'p-2 rounded-md',
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                ]"
                @click="viewMode = 'grid'"
              >
                <Squares2X2Icon class="w-5 h-5" />
              </button>
              <button
                :class="[
                  'p-2 rounded-md',
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                ]"
                @click="viewMode = 'list'"
              >
                <ListBulletIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Students Grid/List -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>

      <div v-else-if="filteredStudents.length === 0" class="text-center py-12">
        <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay estudiantes</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{
            hasActiveFilters
              ? "No se encontraron estudiantes con los filtros aplicados."
              : "Comienza creando un nuevo estudiante."
          }}
        </p>
        <div class="mt-6">
          <button
            v-if="!hasActiveFilters && canCreateStudent"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="showCreateModal = true"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Crear primer estudiante
          </button>
        </div>
      </div>

      <!-- Grid View -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <student-card
          v-for="student in paginatedStudents"
          :key="student.id"
          :student="student"
          :permissions="{
            canView: canViewStudent,
            canEdit: canEditStudent,
            canDelete: canDeleteStudent,
          }"
          @view="viewStudent"
          @edit="editStudent"
          @delete="deleteStudent"
          @toggle-status="toggleStudentStatus"
        />
      </div>

      <!-- List View -->
      <div
        v-else
        class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <students-table
          :students="paginatedStudents"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :permissions="{
            canView: canViewStudent,
            canEdit: canEditStudent,
            canDelete: canDeleteStudent,
          }"
          @view="viewStudent"
          @edit="editStudent"
          @delete="deleteStudent"
          @toggle-status="toggleStudentStatus"
          @sort="handleSort"
        />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="previousPage">
            Anterior
          </button>
          <button
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="nextPage"
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
              <span class="font-medium">{{ Math.min(endIndex, filteredStudents.length) }}</span>
              de
              <span class="font-medium">{{ filteredStudents.length }}</span>
              resultados
            </p>
          </div>

          <div>
            <nav
              class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="previousPage"
              >
                <ChevronLeftIcon class="h-5 w-5" />
              </button>

              <button
                v-for="page in visiblePages"
                :key="page"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600',
                ]"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>

              <button
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="nextPage"
              >
                <ChevronRightIcon class="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Student Modal -->
    <student-create-modal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleStudentCreated"
    />

    <!-- Edit Student Modal -->
    <student-edit-modal
      v-if="showEditModal && selectedStudent"
      :student="selectedStudent"
      @close="showEditModal = false"
      @updated="handleStudentUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <confirmation-modal
      :is-visible="showDeleteModal"
      title="Eliminar Estudiante"
      :message="`¿Estás seguro de que deseas eliminar al estudiante ${selectedStudent?.nombre} ${selectedStudent?.apellido}? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      type="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
// Vue and Vue Router
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
// Icons
import {
  HomeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/vue/24/outline';

// Stores
import { useRBACStore } from '../../../stores/rbacStore';
import { useAdminStudentsStore } from '../store/adminStudents';

// Types
interface IStudent {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  phone?: string;
  activo: boolean;
  clase?: string;
  classId?: string;
  grupo?: string[];
  instrumento?: string;
  nivel?: string;
  [key: string]: unknown;
}

// Components
const studentCard = defineAsyncComponent(() => import('../components/StudentCard.vue'));

const studentCreateModal = defineAsyncComponent(() => import('../components/StudentCreateModal.vue'));

const studentEditModal = defineAsyncComponent(() => import('../components/StudentEditModal.vue'));

const studentsTable = defineAsyncComponent(() => import('../components/StudentsTable.vue'));

const confirmationModal = defineAsyncComponent(() => import('@/components/ConfirmationModal.vue'));

// Stores
const router = useRouter();
const rbacStore = useRBACStore();
const studentsStore = useAdminStudentsStore();

// State
const showFilters = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const gradeFilter = ref('');
const instrumentFilter = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const sortField = ref('name');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Apply filters with debounce
let filterTimeout: ReturnType<typeof setTimeout> | null = null;
const applyFilters = () => {
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    currentPage.value = 1;
  }, 300);
};

// Watch for filter changes
watch([searchQuery, statusFilter, gradeFilter, instrumentFilter], () => {
  applyFilters();
}, { deep: true });

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(50); // Aumentamos a 50 por defecto para mostrar más estudiantes

// Modals
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedStudent = ref<IStudent | null>(null);

// Computed
const students = computed(() => studentsStore.students);
const isLoading = computed(() => studentsStore.isLoading);
const totalStudents = computed(() => students.value.length);
const activeStudents = computed(() => students.value.filter((s) => s.status === 'active').length);
const newThisMonth = computed(() => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return students.value.filter((s) => new Date(s.createdAt) >= startOfMonth).length;
});

// Permissions
const canCreateStudent = computed(() => rbacStore.hasPermission('students:create'));
const canViewStudent = computed(() => rbacStore.hasPermission('students:view'));
const canEditStudent = computed(() => rbacStore.hasPermission('students:edit'));
const canDeleteStudent = computed(() => rbacStore.hasPermission('students:delete'));

// Filters
const hasActiveFilters = computed(() => 
  searchQuery.value || statusFilter.value || gradeFilter.value || instrumentFilter.value
);

const filteredStudents = computed(() => {
  let filtered = [...students.value];

  // Search filter with safe property access
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((student) => {
      const nombre = String(student?.nombre || '').toLowerCase();
      const apellido = String(student?.apellido || '').toLowerCase();
      const email = String(student?.email || '').toLowerCase();
      const phone = String(student?.phone || '').toLowerCase();
      
      return nombre.includes(query) || 
             apellido.includes(query) ||
             email.includes(query) || 
             phone.includes(query);
    });
  }

  // Status filter (activo/inactivo)
  if (statusFilter.value) {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter((student) => student.activo === isActive);
  }

  // Grade filter (nivel)
  if (gradeFilter.value && gradeFilter.value !== 'all') {
    filtered = filtered.filter((student) => {
      const nivel = (student as IStudent).nivel?.toString().toLowerCase() || '';
      return nivel === gradeFilter.value.toLowerCase();
    });
  }

  // Instrument filter (instrumento)
  if (instrumentFilter.value && instrumentFilter.value !== 'all') {
    filtered = filtered.filter((student) => {
      const instrumento = (student as IStudent).instrumento?.toString().toLowerCase() || '';
      return instrumento === instrumentFilter.value.toLowerCase();
    });
  }

  // Sorting
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aValue = String((a as IStudent)[sortField.value as keyof IStudent] || '');
      const bValue = String((b as IStudent)[sortField.value as keyof IStudent] || '');
      return sortOrder.value === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  }

  return filtered;
});

// Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(filteredStudents.value.length / itemsPerPage.value)));

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => startIndex.value + itemsPerPage.value);

const paginatedStudents = computed(() =>
  filteredStudents.value.slice(startIndex.value, endIndex.value),
);

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 7;
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
const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  gradeFilter.value = '';
  instrumentFilter.value = '';
  currentPage.value = 1;
};

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPage = (page: number) => {
  currentPage.value = page;
};

const viewStudent = (student: any) => {
  router.push(`/admin/students/${student.id}`);
};

const editStudent = (student: any) => {
  selectedStudent.value = student;
  showEditModal.value = true;
};

const deleteStudent = (_student: any) => {
  selectedStudent.value = _student;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (selectedStudent.value) {
    await studentsStore.deleteStudent(selectedStudent.value.id);
    showDeleteModal.value = false;
    selectedStudent.value = null;
  }
};

const toggleStudentStatus = async (student: IStudent) => {
  const newStatus = student.status === 'active' ? 'inactive' : 'active';
  await studentsStore.updateStudentStatus(student.id, newStatus);
};

const handleStudentCreated = (student: any) => {
  showCreateModal.value = false;
  studentsStore.loadStudents(); // Refresh list
};

const handleStudentUpdated = (student: IStudent) => {
  showEditModal.value = false;
  selectedStudent.value = null;
  studentsStore.loadStudents(); // Refresh list
};

const exportStudents = () => {
  studentsStore.exportStudents(filteredStudents.value);
};

// Watch for filter changes to reset pagination
watch([searchQuery, statusFilter, gradeFilter, instrumentFilter], () => {
  currentPage.value = 1;
  applyFilters();
});

// Lifecycle
onMounted(() => {
  studentsStore.loadStudents();
});
</script>

<style scoped>
/* Component-specific styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
