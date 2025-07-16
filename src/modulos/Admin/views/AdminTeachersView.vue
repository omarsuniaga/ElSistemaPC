<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Header with breadcrumb and actions -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300"
    >
      <div class="px-4 sm:px-6 py-4">
        <!-- Breadcrumb -->
        <nav class="flex mb-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <router-link
                to="/admin"
                class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                <HomeIcon class="w-4 h-4 mr-2" />
                <span class="hidden sm:inline">Admin</span>
              </router-link>
            </li>
            <li>
              <div class="flex items-center">
                <ChevronRightIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span class="ml-1 text-gray-400 dark:text-gray-500">Maestros</span>
              </div>
            </li>
          </ol>
        </nav>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Maestros
            </h1>
            <div
              class="mt-2 flex flex-wrap items-center gap-4 lg:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400"
            >
              <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md"
                >Total: {{ totalTeachers }}</span
              >
              <span
                class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-md"
                >Activos: {{ activeTeachers }}</span
              >
              <span
                class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md"
                >Especialidades: {{ totalSpecialties }}</span
              >
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              @click="exportTeachers"
            >
              <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
              Exportar
            </button>

            <button
              v-if="canCreateTeacher"
              class="inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              @click="showCreateModal = true"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              <span class="hidden sm:inline">Nuevo</span> Maestro
            </button>
          </div>
        </div>
      </div>
    </header>
    <!-- Main Content -->
    <main class="p-4 sm:p-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div class="p-3 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <UsersIcon class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div class="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate"
                  >
                    Total Maestros
                  </dt>
                  <dd class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {{ totalTeachers }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div class="p-3 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircleIcon
                    class="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400"
                  />
                </div>
              </div>
              <div class="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate"
                  >
                    Activos
                  </dt>
                  <dd class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {{ activeTeachers }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div class="p-3 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <AcademicCapIcon
                    class="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400"
                  />
                </div>
              </div>
              <div class="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate"
                  >
                    <span class="hidden sm:inline">Clases</span> Asignadas
                  </dt>
                  <dd class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {{ totalAssignedClasses }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div class="p-3 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <MusicalNoteIcon
                    class="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400"
                  />
                </div>
              </div>
              <div class="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate"
                  >
                    Especialidades
                  </dt>
                  <dd class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {{ totalSpecialties }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Filters and Search -->
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 sm:p-6 mb-6 transition-colors duration-300"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <!-- Search -->
          <div class="relative lg:col-span-2">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar maestros..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm transition-colors duration-200"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="statusFilter"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm transition-colors duration-200"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="pending">Pendientes</option>
          </select>

          <!-- Specialty Filter -->
          <select
            v-model="specialtyFilter"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm transition-colors duration-200"
          >
            <option value="">Todas las especialidades</option>
            <option v-for="specialty in uniqueSpecialties" :key="specialty" :value="specialty">
              {{ getSpecialtyName(specialty) }}
            </option>
          </select>

          <!-- Experience Filter -->
          <select
            v-model="experienceFilter"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm transition-colors duration-200"
          >
            <option value="">Toda la experiencia</option>
            <option value="junior">Menor a 2 años</option>
            <option value="mid">2-5 años</option>
            <option value="senior">Más de 5 años</option>
          </select>
        </div>

        <!-- Actions -->
        <div
          class="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <button
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 underline"
              @click="clearFilters"
            >
              Limpiar filtros
            </button>
            <span
              v-if="hasActiveFilters"
              class="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md"
            >
              {{ filteredTeachers.length }} resultado{{ filteredTeachers.length !== 1 ? "s" : "" }}
            </span>
          </div>

          <!-- View toggle -->
          <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              :class="[
                'p-2 rounded-md transition-colors duration-200',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
              title="Vista de cuadrícula"
              @click="viewMode = 'grid'"
            >
              <Squares2X2Icon class="w-5 h-5" />
            </button>
            <button
              :class="[
                'p-2 rounded-md transition-colors duration-200',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
              title="Vista de lista"
              @click="viewMode = 'list'"
            >
              <ListBulletIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <!-- Teachers Grid/List -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="flex flex-col items-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"
          />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando maestros...</p>
        </div>
      </div>

      <div
        v-else-if="filteredTeachers.length === 0"
        class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay maestros</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{
            hasActiveFilters
              ? "No se encontraron maestros con los filtros aplicados."
              : "Comienza registrando un nuevo maestro."
          }}
        </p>
        <div v-if="!hasActiveFilters && canCreateTeacher" class="mt-6">
          <button
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            @click="showCreateModal = true"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Crear primer maestro
          </button>
        </div>
      </div>

      <!-- Grid View -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
      >
        <TeacherCard
          v-for="teacher in paginatedTeachers"
          :key="teacher.id"
          :teacher="teacher"
          :permissions="{
            canView: canViewTeacher,
            canEdit: canEditTeacher,
            canDelete: canDeleteTeacher,
          }"
          class="transform hover:scale-105 transition-transform duration-200"
          @view="viewTeacher"
          @edit="editTeacher"
          @delete="deleteTeacher"
          @assign-classes="assignClasses"
          @toggle-status="toggleTeacherStatus"
        />
      </div>

      <!-- List View -->
      <div
        v-else
        class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <TeachersTable
          :teachers="paginatedTeachers"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :permissions="{
            canView: canViewTeacher,
            canEdit: canEditTeacher,
            canDelete: canDeleteTeacher,
          }"
          @view="viewTeacher"
          @edit="editTeacher"
          @delete="deleteTeacher"
          @assign-classes="assignClasses"
          @toggle-status="toggleTeacherStatus"
          @sort="handleSort"
        />
      </div>
      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors duration-300"
      >
        <!-- Mobile pagination -->
        <div class="flex justify-between sm:hidden">
          <button
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            @click="previousPage"
          >
            <ChevronLeftIcon class="h-4 w-4 mr-1" />
            Anterior
          </button>

          <div class="flex items-center">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ currentPage }} de {{ totalPages }}
            </span>
          </div>

          <button
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            @click="nextPage"
          >
            Siguiente
            <ChevronRightIcon class="h-4 w-4 ml-1" />
          </button>
        </div>

        <!-- Desktop pagination -->
        <div class="hidden sm:flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando
              <span class="font-medium">{{ startIndex + 1 }}</span>
              a
              <span class="font-medium">{{ Math.min(endIndex, filteredTeachers.length) }}</span>
              de
              <span class="font-medium">{{ filteredTeachers.length }}</span>
              resultado{{ filteredTeachers.length !== 1 ? "s" : "" }}
            </p>
          </div>

          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Página anterior"
                @click="previousPage"
              >
                <ChevronLeftIcon class="h-5 w-5" />
              </button>

              <button
                v-for="page in visiblePages"
                :key="page"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200',
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
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Página siguiente"
                @click="nextPage"
              >
                <ChevronRightIcon class="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </main>
    <!-- Modals -->
    <!--
    <TeacherCreateModal
      v-if="showCreateModal"
      :isVisible="showCreateModal"
      @close="showCreateModal = false"
      @created="handleTeacherCreated"
    />

    <TeacherEditModal
      v-if="showEditModal && selectedTeacher"
      :isVisible="showEditModal"
      :teacher="selectedTeacher"
      @close="showEditModal = false"
      @updated="handleTeacherUpdated"
    />

    <ClassAssignmentModal
      v-if="showAssignModal && selectedTeacher"
      :isVisible="showAssignModal"
      :teacher="selectedTeacher"
      @close="showAssignModal = false"
      @assigned="handleClassesAssigned"
    />
    -->

    <ConfirmationModal
      v-if="showDeleteModal"
      :is-visible="showDeleteModal"
      title="Eliminar Maestro"
      :message="`¿Estás seguro de que deseas eliminar al maestro ${selectedTeacher?.name}? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      type="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRBACStore } from '../../../stores/rbacStore';
import { useTeachersStore } from '@/stores/teachersUnified';
import {
  HomeIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';

// Components
import TeacherCard from '../../Classes/components/TeacherCard.vue';
import TeachersTable from '../components/TeachersTable.vue';
// import TeacherCreateModal from '../components/TeacherCreateModal.vue'
// import TeacherEditModal from '../components/TeacherEditModal.vue'
// import ClassAssignmentModal from '../components/ClassAssignmentModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue';

// Stores
const router = useRouter();
const rbacStore = useRBACStore();
const teachersStore = useTeachersStore();

// State
const searchQuery = ref('');
const statusFilter = ref('');
const specialtyFilter = ref('');
const experienceFilter = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const sortField = ref('name');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(20);

// Modals
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showAssignModal = ref(false);
const showDeleteModal = ref(false);
const selectedTeacher = ref<any>(null);

// Computed
const teachers = computed(() => teachersStore.teachers);
const isLoading = computed(() => teachersStore.isLoading);
const totalTeachers = computed(() => teachers.value.length);
const activeTeachers = computed(() => teachers.value.filter((t) => t.status === 'active').length);
const totalAssignedClasses = computed(() =>
  teachers.value.reduce((sum, t) => sum + (t.assignedClasses?.length || 0), 0),
);
const totalSpecialties = computed(() => {
  const specialties = new Set<string>();
  teachers.value.forEach((t) => t.specialty?.forEach((s: string) => specialties.add(s)));
  return specialties.size;
});

const uniqueSpecialties = computed(() => {
  const specialties = new Set<string>();
  teachers.value.forEach((teacher) => {
    teacher.specialty?.forEach((specialty: string) => specialties.add(specialty));
  });
  return Array.from(specialties);
});

// Permissions
const canCreateTeacher = computed(() => rbacStore.hasPermission('teachers_create'));
const canViewTeacher = computed(() => rbacStore.hasPermission('teachers_view'));
const canEditTeacher = computed(() => rbacStore.hasPermission('teachers_edit'));
const canDeleteTeacher = computed(() => rbacStore.hasPermission('teachers_delete'));

// Filters
const hasActiveFilters = computed(
  () => searchQuery.value || statusFilter.value || specialtyFilter.value || experienceFilter.value,
);

const filteredTeachers = computed(() => {
  let filtered = [...teachers.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query) ||
        (teacher.phone && teacher.phone.toLowerCase().includes(query)),
    );
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter((teacher) => teacher.status === statusFilter.value);
  }

  // Specialty filter
  if (specialtyFilter.value) {
    filtered = filtered.filter((teacher) => teacher.specialty?.includes(specialtyFilter.value));
  }

  // Experience filter
  if (experienceFilter.value) {
    filtered = filtered.filter((teacher) => {
      const years = teacher.experience || 0;
      switch (experienceFilter.value) {
      case 'junior':
        return years < 2;
      case 'mid':
        return years >= 2 && years <= 5;
      case 'senior':
        return years > 5;
      default:
        return true;
      }
    });
  }

  // Sorting
  filtered.sort((a, b) => {
    const aValue = (a as any)[sortField.value];
    const bValue = (b as any)[sortField.value];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder.value === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return sortOrder.value === 'asc' ? aValue - bValue : bValue - aValue;
  });

  return filtered;
});

// Pagination
const totalPages = computed(() => Math.ceil(filteredTeachers.value.length / itemsPerPage.value));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => startIndex.value + itemsPerPage.value);

const paginatedTeachers = computed(() =>
  filteredTeachers.value.slice(startIndex.value, endIndex.value),
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
  specialtyFilter.value = '';
  experienceFilter.value = '';
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

const viewTeacher = (teacher: any) => {
  router.push(`/admin/teachers/${teacher.id}`);
};

const editTeacher = (teacher: any) => {
  selectedTeacher.value = teacher;
  showEditModal.value = true;
};

const deleteTeacher = (teacher: any) => {
  selectedTeacher.value = teacher;
  showDeleteModal.value = true;
};

const assignClasses = (teacher: any) => {
  selectedTeacher.value = teacher;
  showAssignModal.value = true;
};

const confirmDelete = async () => {
  if (selectedTeacher.value) {
    await teachersStore.deleteTeacher(selectedTeacher.value.id);
    showDeleteModal.value = false;
    selectedTeacher.value = null;
  }
};

const toggleTeacherStatus = async (teacher: any) => {
  const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
  await teachersStore.updateTeacherStatus(teacher.id, newStatus);
};

const handleTeacherCreated = (teacher: any) => {
  showCreateModal.value = false;
  teachersStore.loadTeachers();
};

const handleTeacherUpdated = (teacher: any) => {
  showEditModal.value = false;
  selectedTeacher.value = null;
  teachersStore.loadTeachers();
};

const handleClassesAssigned = (data: any) => {
  showAssignModal.value = false;
  selectedTeacher.value = null;
  teachersStore.loadTeachers();
};

const exportTeachers = () => {
  teachersStore.exportTeachers(filteredTeachers.value);
};

const getSpecialtyName = (specialty: string): string => {
  const specialties: Record<string, string> = {
    piano: 'Piano',
    guitar: 'Guitarra',
    violin: 'Violín',
    drums: 'Batería',
    voice: 'Canto',
    bass: 'Bajo',
    flute: 'Flauta',
    saxophone: 'Saxofón',
    trumpet: 'Trompeta',
    cello: 'Violonchelo',
  };
  return specialties[specialty] || specialty;
};

// Watch for filter changes to reset pagination
watch([searchQuery, statusFilter, specialtyFilter, experienceFilter], () => {
  currentPage.value = 1;
});

// Lifecycle
onMounted(() => {
  teachersStore.loadTeachers();
});
</script>

<style scoped>
/* Component-specific styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Smooth transitions for theme changes */
* {
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease;
}

/* Card hover effects */
.hover\:scale-105:hover {
  transform: scale(1.02);
}

/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background-color: #f3f4f6;
}

.dark ::-webkit-scrollbar-track {
  background-color: #374151;
}

::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 9999px;
}

.dark ::-webkit-scrollbar-thumb {
  background-color: #4b5563;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}

/* Loading animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Button focus states */
button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Enhanced mobile responsiveness */
@media (max-width: 640px) {
  .stats-mobile-compact .grid-cols-2 {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .mobile-hide-extra > div:nth-child(n + 3) {
    display: none;
  }

  .mobile-show-all > div {
    display: block !important;
  }
}

/* Enhanced accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .bg-gray-50 {
    background-color: white;
  }

  .dark .bg-gray-900 {
    background-color: black;
  }

  .border-gray-200,
  .border-gray-300 {
    border-color: #4b5563;
  }

  .dark .border-gray-700,
  .dark .border-gray-600 {
    border-color: #d1d5db;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .bg-white {
    background: white !important;
  }

  .text-gray-900 {
    color: black !important;
  }

  .shadow-sm,
  .shadow-md {
    box-shadow: none !important;
  }

  button {
    display: none !important;
  }

  .pagination {
    display: none !important;
  }
}

/* Focus indicators for better accessibility */
.focus\:ring-blue-500:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .focus\:ring-blue-400:focus {
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

/* Improved button states */
.btn-primary {
  background-color: #2563eb;
  color: white;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.dark .btn-primary {
  background-color: #3b82f6;
}

.dark .btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.dark .btn-secondary {
  background-color: #374151;
  color: #d1d5db;
  border-color: #4b5563;
}

.dark .btn-secondary:hover {
  background-color: #4b5563;
}

/* Enhanced card animations */
.card-hover {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.dark .card-hover:hover {
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
}
</style>
