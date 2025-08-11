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
      <!-- Search and Filters -->
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 sm:p-6 mb-6 transition-colors duration-300"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
        </div>

        <!-- Clear Filters -->
        <div class="mt-4 flex justify-between items-center">
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
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="flex flex-col items-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"
          />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando maestros...</p>
        </div>
      </div>

      <!-- Empty State -->
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

      <!-- Teachers Grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
      >
        <AdminTeacherCard
          v-for="teacher in paginatedTeachers"
          :key="teacher.id"
          :teacher="teacher"
          :permissions="{
            canView: canViewTeacher,
            canEdit: canEditTeacher,
            canDelete: canDeleteTeacher,
          }"
          @view="viewTeacher"
          @edit="editTeacher"
          @delete="deleteTeacher"
          @view-classes="viewTeacherClasses"
        />
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors duration-300"
      >
        <div class="flex justify-center">
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
              @click="nextPage"
            >
              <ChevronRightIcon class="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </main>

    <!-- Modals -->
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
import {
  HomeIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useRBACStore } from '../../../stores/rbacStore';
import { useClassesStore } from '../../Classes/store/classes';
import AdminTeacherCard from '../components/AdminTeacherCard.vue';
import { useAdminTeachersStore } from '../store/teachers';

import ConfirmationModal from '@/components/ConfirmationModal.vue';

interface ITeacher {
  uid?: string
  id: string
  name: string
  email: string
  phone?: string
  specialty?: string[]
  specialties?: string[]
  experience?: number | string
  status?: string
  bio?: string
  biography?: string
  profileImage?: string
  photoURL?: string
  assignedClasses?: string[]
  classCount?: number
  availableHours?: string[]
  createdAt?: Date
  updatedAt?: Date
  [key: string]: unknown // Para flexibilidad con propiedades adicionales
}

// Stores
const router = useRouter();
const rbacStore = useRBACStore();
const teachersStore = useAdminTeachersStore();
const classesStore = useClassesStore();

// State
const searchQuery = ref('');
const statusFilter = ref('');
const specialtyFilter = ref('');
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const selectedTeacher = ref<ITeacher | null>(null);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(20);

// Computed
const teachers = computed(() => teachersStore.teachers);
const isLoading = computed(() => teachersStore.isLoading);

// Enriquecer datos de maestros con información de clases
const enrichedTeachers = computed(() => {
  return teachers.value.map((teacher) => {
    // Obtener clases reales asignadas al maestro
    const assignedClasses = classesStore.classes.filter(
      (cls) => cls.teacherId === teacher.id || cls.teachers?.includes(teacher.id),
    );

    // Normalizar propiedades para compatibilidad
    const teacherData = teacher as unknown as ITeacher;
    return {
      ...teacherData,
      // Usar 'bio' si existe, sino 'biography'
      bio: teacherData.bio || teacherData.biography || '',
      // Asegurar que specialty sea un array
      specialty: Array.isArray(teacherData.specialty) 
        ? teacherData.specialty 
        : Array.isArray(teacherData.specialties)
          ? teacherData.specialties
          : [],
      // Para compatibilidad inversa
      specialties: Array.isArray(teacherData.specialties) 
        ? teacherData.specialties 
        : Array.isArray(teacherData.specialty)
          ? teacherData.specialty
          : [],
      // Información real de clases asignadas
      assignedClasses: assignedClasses.map((cls) => cls.id),
      // Agregar conteo real de clases
      classCount: assignedClasses.length,
      // Normalizar años de experiencia
      experience: teacherData.experience || 0,
    };
  });
});

const totalTeachers = computed(() => enrichedTeachers.value.length);
const activeTeachers = computed(() => enrichedTeachers.value.filter((t) => t.status === 'active').length);
const totalSpecialties = computed(() => {
  const specialties = new Set<string>();
  enrichedTeachers.value.forEach((t) => t.specialty?.forEach((s: string) => specialties.add(s)));
  return specialties.size;
});

const uniqueSpecialties = computed(() => {
  const specialties = new Set<string>();
  enrichedTeachers.value.forEach((teacher) => {
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
const hasActiveFilters = computed(() => searchQuery.value || statusFilter.value || specialtyFilter.value);

const filteredTeachers = computed(() => {
  let filtered = [...enrichedTeachers.value];

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
  currentPage.value = 1;
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

const viewTeacher = (teacher: ITeacher) => {
  router.push(`/admin/teachers/${teacher.id}`);
};

const editTeacher = (teacher: ITeacher) => {
  selectedTeacher.value = teacher;
  // TODO: Implementar modal de edición
  console.log('Editar maestro:', teacher);
};

const deleteTeacher = (teacher: ITeacher) => {
  selectedTeacher.value = teacher;
  showDeleteModal.value = true;
};

const viewTeacherClasses = (teacher: ITeacher) => {
  // Navegar al gestor de clases con filtro del maestro
  router.push({
    path: '/admin/classes',
    query: { teacherId: teacher.id, teacherName: teacher.name },
  });
};

const confirmDelete = async () => {
  if (selectedTeacher.value) {
    await teachersStore.deleteTeacher(selectedTeacher.value.id);
    showDeleteModal.value = false;
    selectedTeacher.value = null;
  }
};

const exportTeachers = () => {
  teachersStore.exportTeachers(teachers.value);
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
watch([searchQuery, statusFilter, specialtyFilter], () => {
  currentPage.value = 1;
});

// Lifecycle
onMounted(async () => {
  await Promise.all([
    teachersStore.loadTeachers(),
    classesStore.fetchClasses(),
  ]);
});
</script>

<style scoped>
/* Enhanced animations and transitions */
* {
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease,
    transform 0.2s ease;
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

/* Button hover effects */
button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* Custom scrollbar */
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

/* Focus indicators for accessibility */
.focus\:ring-blue-500:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .focus\:ring-blue-400:focus {
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

/* Responsive grid improvements */
@media (max-width: 640px) {
  .grid {
    gap: 1rem;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  button {
    display: none !important;
  }
}
</style>
