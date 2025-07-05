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

          <!-- Debug info -->
          <div class="mt-2 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <p class="text-sm font-medium text-blue-800 dark:text-blue-200">Debug Info:</p>
            <p class="text-xs text-blue-700 dark:text-blue-300">- Loading: {{ isLoading }}</p>
            <p class="text-xs text-blue-700 dark:text-blue-300">
              - Students length: {{ students.length }}
            </p>
            <p class="text-xs text-blue-700 dark:text-blue-300">
              - Filtered students: {{ filteredStudents.length }}
            </p>
            <p class="text-xs text-blue-700 dark:text-blue-300">
              - Paginated students: {{ paginatedStudents.length }}
            </p>
            <div v-if="students.length > 0" class="mt-2">
              <p class="text-xs text-blue-700 dark:text-blue-300">Sample student structure:</p>
              <pre class="text-xs text-blue-600 dark:text-blue-400 mt-1 max-h-32 overflow-y-auto">{{
                JSON.stringify(students[0], null, 2)
              }}</pre>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <!-- Filters and Search -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar estudiantes..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="statusFilter"
            class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="pending">Pendientes</option>
          </select>

          <!-- Grade Filter -->
          <select
            v-model="gradeFilter"
            class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los niveles</option>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>

          <!-- Instrument Filter -->
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

        <!-- Clear filters -->
        <div class="mt-4 flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <button
              class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="clearFilters"
            >
              Limpiar filtros
            </button>
            <span v-if="hasActiveFilters" class="text-sm text-blue-600 dark:text-blue-400">
              {{ filteredStudents.length }} resultados
            </span>
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
        <StudentCard
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
        <StudentsTable
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
            @click="previousPage"
          >
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
    <StudentCreateModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleStudentCreated"
    />

    <!-- Edit Student Modal -->
    <StudentEditModal
      v-if="showEditModal && selectedStudent"
      :student="selectedStudent"
      @close="showEditModal = false"
      @updated="handleStudentUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-if="showDeleteModal"
      title="Eliminar Estudiante"
      :message="`¿Estás seguro de que deseas eliminar al estudiante ${selectedStudent?.name}? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>

  <!-- Debug Panel (temporal) -->
  <DebugPanel v-if="showDebugPanel" @close="showDebugPanel = false" />

  <!-- Debug Toggle Button -->
  <button
    class="fixed bottom-4 left-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 z-40"
    title="Toggle Debug Panel"
    @click="showDebugPanel = !showDebugPanel"
  >
    🔧
  </button>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useRouter} from "vue-router"
import {useRBACStore} from "../../../stores/rbacStore"
import {useAdminStudentsStore} from "../store/adminStudents"
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
} from "@heroicons/vue/24/outline"

// Components
import StudentCard from "../components/StudentCard.vue"
import StudentsTable from "../components/StudentsTable.vue"
import StudentCreateModal from "../components/StudentCreateModal.vue"
import StudentEditModal from "../components/StudentEditModal.vue"
import ConfirmationModal from "@/components/ConfirmationModal.vue"
import DebugPanel from "../components/DebugPanel.vue"

// Stores
const router = useRouter()
const rbacStore = useRBACStore()
const studentsStore = useAdminStudentsStore()

// State
const searchQuery = ref("")
const statusFilter = ref("")
const gradeFilter = ref("")
const instrumentFilter = ref("")
const viewMode = ref<"grid" | "list">("grid")
const sortField = ref("name")
const sortOrder = ref<"asc" | "desc">("asc")

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(20)

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedStudent = ref<any>(null)

// Debug
const showDebugPanel = ref(true) // Mostrar por defecto para debug

// Computed
const students = computed(() => studentsStore.students)
const isLoading = computed(() => studentsStore.isLoading)
const totalStudents = computed(() => students.value.length)
const activeStudents = computed(() => students.value.filter((s) => s.status === "active").length)
const newThisMonth = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return students.value.filter((s) => new Date(s.createdAt) >= startOfMonth).length
})

// Permissions
const canCreateStudent = computed(() => rbacStore.hasPermission("students", "create"))
const canViewStudent = computed(() => rbacStore.hasPermission("students", "view"))
const canEditStudent = computed(() => rbacStore.hasPermission("students", "edit"))
const canDeleteStudent = computed(() => rbacStore.hasPermission("students", "delete"))

// Filters
const hasActiveFilters = computed(
  () => searchQuery.value || statusFilter.value || gradeFilter.value || instrumentFilter.value
)

const filteredStudents = computed(() => {
  let filtered = [...students.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.phone.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter((student) => student.status === statusFilter.value)
  }

  // Grade filter
  if (gradeFilter.value) {
    filtered = filtered.filter((student) => student.grade === gradeFilter.value)
  }

  // Instrument filter
  if (instrumentFilter.value) {
    filtered = filtered.filter((student) => student.instruments?.includes(instrumentFilter.value))
  }

  // Sorting
  filtered.sort((a, b) => {
    const aValue = a[sortField.value]
    const bValue = b[sortField.value]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder.value === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortOrder.value === "asc" ? aValue - bValue : bValue - aValue
  })

  return filtered
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => startIndex.value + itemsPerPage.value)

const paginatedStudents = computed(() =>
  filteredStudents.value.slice(startIndex.value, endIndex.value)
)

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 7
  const half = Math.floor(maxVisible / 2)

  let start = Math.max(1, currentPage.value - half)
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Methods
const clearFilters = () => {
  searchQuery.value = ""
  statusFilter.value = ""
  gradeFilter.value = ""
  instrumentFilter.value = ""
  currentPage.value = 1
}

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc"
  } else {
    sortField.value = field
    sortOrder.value = "asc"
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
}

const viewStudent = (student: any) => {
  router.push(`/admin/students/${student.id}`)
}

const editStudent = (student: any) => {
  selectedStudent.value = student
  showEditModal.value = true
}

const deleteStudent = (student: any) => {
  selectedStudent.value = student
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (selectedStudent.value) {
    await studentsStore.deleteStudent(selectedStudent.value.id)
    showDeleteModal.value = false
    selectedStudent.value = null
  }
}

const toggleStudentStatus = async (student: any) => {
  const newStatus = student.status === "active" ? "inactive" : "active"
  await studentsStore.updateStudentStatus(student.id, newStatus)
}

const handleStudentCreated = (student: any) => {
  showCreateModal.value = false
  studentsStore.loadStudents() // Refresh list
}

const handleStudentUpdated = (student: any) => {
  showEditModal.value = false
  selectedStudent.value = null
  studentsStore.loadStudents() // Refresh list
}

const exportStudents = () => {
  studentsStore.exportStudents(filteredStudents.value)
}

// Watch for filter changes to reset pagination
watch([searchQuery, statusFilter, gradeFilter, instrumentFilter], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(() => {
  studentsStore.loadStudents()
})
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
