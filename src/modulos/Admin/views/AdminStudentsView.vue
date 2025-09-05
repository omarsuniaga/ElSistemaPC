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
                <li class="items-center">
                  <router-link
                    to="/admin"
                    class="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  >
                    <HomeIcon class="w-4 h-4 mr-2" />
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
              Export
            </button>
            <!-- boton para abrir /admin/student/new -->
            <router-link
              to="/admin/students/new"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-2"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              Nuevo Estudiante
            </router-link>
            <button
              v-if="canCreateStudent"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="showCreateModal = true"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              Nuevo Estudiante (Modal)
            </button>

            <button
              v-if="canCreateStudent"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              @click="navigateToNewStudentForm"
            >
              <DocumentPlusIcon class="w-4 h-4 mr-2" />
              Nuevo Estudiante (Formulario)
            </button>
          </div>
        </div>

        <!-- Title and stats -->
        <div class="mt-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Estudiantes
          </h1>
          <div class="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div class="font-medium text-blue-700 dark:text-blue-300">Total</div>
              <div class="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {{ totalStudents }}
              </div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div class="font-medium text-green-700 dark:text-green-300">Activos</div>
              <div class="text-2xl font-bold text-green-800 dark:text-green-200">
                {{ activeStudents }}
              </div>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div class="font-medium text-purple-700 dark:text-purple-300">
                Nuevos (mes)
              </div>
              <div class="text-2xl font-bold text-purple-800 dark:text-purple-200">
                {{ newThisMonth }}
              </div>
            </div>
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <div class="font-medium text-amber-700 dark:text-amber-300">
                Con asistencia
              </div>
              <div class="text-2xl font-bold text-amber-800 dark:text-amber-200">
                {{ studentsWithAttendance }}
              </div>
            </div>
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
          {{ showFilters ? "Ocultar filtros" : "Mostrar filtros" }}
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
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                v-model.lazy="searchQuery"
                type="text"
                placeholder="Buscar estudiantes..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Status Filter -->
            <div>
              <select
                v-model="statusFilter"
                class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <!-- Instrument Filter -->
            <div>
              <select
                v-model="instrumentFilter"
                class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los instrumentos</option>
                <option value="piano">Piano</option>
                <option value="guitar">Guitarra</option>
                <option value="violin">Violín</option>
                <option value="drums">Batería</option>
                <option value="voice">Canto</option>
                <option value="bass">Bajo</option>
              </select>
            </div>

            <!-- Attendance Filter -->
            <div>
              <select
                v-model="attendanceFilter"
                class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los niveles</option>
                <option value="Excelente">Asistencia Excelente (90%+)</option>
                <option value="Bueno">Asistencia Buena (80-89%)</option>
                <option value="Regular">Asistencia Regular (70-79%)</option>
                <option value="Deficiente">Asistencia Deficiente (<70%)</option>
              </select>
            </div>
          </div>

          <!-- Clear filters -->
          <div class="mt-4 flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <button
                class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                @click="clearFilters"
              >
                Limpiar filtros
              </button>
              <span
                v-if="hasActiveFilters"
                class="text-sm text-blue-600 dark:text-blue-400"
              >
                {{ filteredStudents.length }} de {{ totalStudents }} estudiantes
              </span>
              <span
                v-if="attendanceFilter"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                Filtro de asistencia: {{ attendanceFilter }}
              </span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Students Grid/List -->
      <div v-if="isLoading" class="">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8"
        >
          <div class="flex flex-col items-center justify-center space-y-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600" />
            <div class="text-center">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Cargando estudiantes...
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Obteniendo información y métricas de asistencia
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="filteredStudents.length === 0" class="text-center py-12">
        <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No hay estudiantes
        </h3>
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
          v-for="student in filteredStudents"
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
          :students="filteredStudents"
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
import { ref, computed, onMounted, defineAsyncComponent } from "vue";
import { useRouter } from "vue-router";
// Icons
import {
  HomeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  DocumentPlusIcon,
  ChevronRightIcon,
} from "@heroicons/vue/24/outline";

// Stores
import { useRBACStore } from "../../../stores/rbacStore";
import { useAdminStudentsStore } from "../store/adminStudents";

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
  status?: "active" | "inactive";
  createdAt: string; // Assuming createdAt is a string like an ISO date
  [key: string]: unknown;
}

// Components
const studentCard = defineAsyncComponent(
  () => import(/* webpackChunkName: "student-card" */ "../components/StudentCard.vue")
);
const studentCreateModal = defineAsyncComponent(
  () =>
    import(
      /* webpackChunkName: "student-create-modal" */ "../components/StudentCreateModal.vue"
    )
);
const studentEditModal = defineAsyncComponent(
  () =>
    import(
      /* webpackChunkName: "student-edit-modal" */ "../components/StudentEditModal.vue"
    )
);
const studentsTable = defineAsyncComponent(
  () => import(/* webpackChunkName: "students-table" */ "../components/StudentsTable.vue")
);
const confirmationModal = defineAsyncComponent(
  () =>
    import(
      /* webpackChunkName: "confirmation-modal" */ "@/components/ConfirmationModal.vue"
    )
);

// Stores
const router = useRouter();
const rbacStore = useRBACStore();
const studentsStore = useAdminStudentsStore();

// --- State ---
const showFilters = ref(false);
const viewMode = ref<"grid" | "list">("grid");
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedStudent = ref<IStudent | null>(null);

// --- Filtering State ---
const searchQuery = ref("");
const statusFilter = ref("");
const gradeFilter = ref("");
const instrumentFilter = ref("");
const attendanceFilter = ref("");

// --- Sorting State ---
const sortField = ref("nombre"); // Default sort field
const sortOrder = ref<"asc" | "desc">("asc");

// --- Computed Properties ---

const students = computed(() => studentsStore.students as IStudent[]);
const isLoading = computed(() => studentsStore.isLoading);

// Stats
const totalStudents = computed(() => students.value.length);
const activeStudents = computed(() => students.value.filter((s) => s.activo).length);
const newThisMonth = computed(() => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return students.value.filter((s) => new Date(s.createdAt) >= startOfMonth).length;
});
const studentsWithAttendance = computed(() => {
  // This is a placeholder - in a real implementation, you'd check for students with attendance records
  return Math.floor(activeStudents.value * 0.85); // Aproximadamente 85% tienen registros de asistencia
});

// Permissions
const canCreateStudent = computed(() => rbacStore.hasPermission("students:create"));
const canViewStudent = computed(() => rbacStore.hasPermission("students:view"));
const canEditStudent = computed(() => rbacStore.hasPermission("students:edit"));
const canDeleteStudent = computed(() => rbacStore.hasPermission("students:delete"));

// Filtering Logic
const hasActiveFilters = computed(
  () =>
    searchQuery.value ||
    statusFilter.value ||
    gradeFilter.value ||
    instrumentFilter.value ||
    attendanceFilter.value
);

const filteredStudents = computed(() => {
  let filtered = [...students.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((student) => {
      const nombre = String(student?.nombre || "").toLowerCase();
      const apellido = String(student?.apellido || "").toLowerCase();
      const email = String(student?.email || "").toLowerCase();
      const phone = String(student?.phone || "").toLowerCase();
      return (
        nombre.includes(query) ||
        apellido.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }

  if (statusFilter.value) {
    const isActive = statusFilter.value === "active";
    filtered = filtered.filter((student) => student.activo === isActive);
  }

  if (gradeFilter.value && gradeFilter.value !== "all") {
    filtered = filtered.filter(
      (student) =>
        (student.nivel?.toString().toLowerCase() || "") ===
        gradeFilter.value.toLowerCase()
    );
  }

  if (instrumentFilter.value && instrumentFilter.value !== "all") {
    filtered = filtered.filter(
      (student) =>
        (student.instrumento?.toString().toLowerCase() || "") ===
        instrumentFilter.value.toLowerCase()
    );
  }

  // Sorting
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aValue = String(a[sortField.value as keyof IStudent] || "");
      const bValue = String(b[sortField.value as keyof IStudent] || "");
      return sortOrder.value === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  return filtered;
});

// --- Methods ---

const clearFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "";
  gradeFilter.value = "";
  instrumentFilter.value = "";
  attendanceFilter.value = "";
};

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
};

// Navigation and Modal Handlers
const viewStudent = (student: IStudent) => {
  router.push(`/admin/students/${student.id}`);
};

const navigateToNewStudentForm = () => {
  router.push("/admin/students/new");
};

const editStudent = (student: IStudent) => {
  selectedStudent.value = student;
  showEditModal.value = true;
};

const deleteStudent = (student: IStudent) => {
  selectedStudent.value = student;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (selectedStudent.value) {
    await studentsStore.deleteStudent(selectedStudent.value.id);
    showDeleteModal.value = false;
    selectedStudent.value = null;
    await studentsStore.loadStudents();
  }
};

const toggleStudentStatus = async (student: IStudent) => {
  const newStatus = student.activo ? "inactive" : "active";
  await studentsStore.updateStudentStatus(student.id, newStatus);
  await studentsStore.loadStudents();
};

const handleStudentCreated = () => {
  showCreateModal.value = false;
  studentsStore.loadStudents();
};

const handleStudentUpdated = () => {
  showEditModal.value = false;
  selectedStudent.value = null;
  studentsStore.loadStudents();
};

const exportStudents = () => {
  studentsStore.exportStudents(filteredStudents.value);
};

// --- Lifecycle Hooks ---

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
