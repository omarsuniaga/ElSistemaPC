<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with breadcrumb and actions -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <!-- Breadcrumb -->
        <nav class="flex mb-4" aria-label="Breadcrumb">
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
                <span class="ml-1 text-gray-500 dark:text-gray-400">Maestros</span>
              </div>
            </li>
          </ol>
        </nav>

        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Maestros
            </h1>
            <div class="mt-2 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <span>Total: {{ totalTeachers }}</span>
              <span>Activos: {{ activeTeachers }}</span>
              <span>Especialidades: {{ totalSpecialties }}</span>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <button
              @click="exportTeachers"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
              Exportar
            </button>
            
            <button
              @click="showCreateModal = true"
              v-if="canCreateTeacher"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              Nuevo Maestro
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UsersIcon class="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Maestros
                  </dt>
                  <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ totalTeachers }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CheckCircleIcon class="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Activos
                  </dt>
                  <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ activeTeachers }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <AcademicCapIcon class="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Clases Asignadas
                  </dt>
                  <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ totalAssignedClasses }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <MusicalNoteIcon class="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Especialidades
                  </dt>
                  <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ totalSpecialties }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Search -->
          <div class="relative lg:col-span-2">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar maestros..."
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
          
          <!-- Specialty Filter -->
          <select
            v-model="specialtyFilter"
            class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las especialidades</option>
            <option v-for="specialty in uniqueSpecialties" :key="specialty" :value="specialty">
              {{ getSpecialtyName(specialty) }}
            </option>
          </select>
          
          <!-- Experience Filter -->
          <select
            v-model="experienceFilter"
            class="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Toda la experiencia</option>
            <option value="junior">Menor a 2 años</option>
            <option value="mid">2-5 años</option>
            <option value="senior">Más de 5 años</option>
          </select>
        </div>
        
        <!-- Actions -->
        <div class="mt-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button
              @click="clearFilters"
              class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Limpiar filtros
            </button>
            <span v-if="hasActiveFilters" class="text-sm text-blue-600 dark:text-blue-400">
              {{ filteredTeachers.length }} resultados
            </span>
          </div>
          
          <!-- View toggle -->
          <div class="flex items-center space-x-2">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'p-2 rounded-md',
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              ]"
            >
              <Squares2X2Icon class="w-5 h-5" />
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-2 rounded-md',
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              ]"
            >
              <ListBulletIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Teachers Grid/List -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="filteredTeachers.length === 0" class="text-center py-12">
        <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay maestros</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ hasActiveFilters ? 'No se encontraron maestros con los filtros aplicados.' : 'Comienza registrando un nuevo maestro.' }}
        </p>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <TeacherCard
          v-for="teacher in paginatedTeachers"
          :key="teacher.id"
          :teacher="teacher"
          @view="viewTeacher"
          @edit="editTeacher"
          @delete="deleteTeacher"
          @assign-classes="assignClasses"
          @toggle-status="toggleTeacherStatus"
          :permissions="{
            canView: canViewTeacher,
            canEdit: canEditTeacher,
            canDelete: canDeleteTeacher
          }"
        />
      </div>

      <!-- List View -->
      <div v-else class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <TeachersTable
          :teachers="paginatedTeachers"
          @view="viewTeacher"
          @edit="editTeacher"
          @delete="deleteTeacher"
          @assign-classes="assignClasses"
          @toggle-status="toggleTeacherStatus"
          @sort="handleSort"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :permissions="{
            canView: canViewTeacher,
            canEdit: canEditTeacher,
            canDelete: canDeleteTeacher
          }"
        />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span class="font-medium">{{ Math.min(endIndex, filteredTeachers.length) }}</span>
              de
              <span class="font-medium">{{ filteredTeachers.length }}</span>
              resultados
            </p>
          </div>
          
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon class="h-5 w-5" />
              </button>
              
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
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
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon class="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <TeacherCreateModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleTeacherCreated"
    />

    <TeacherEditModal
      v-if="showEditModal && selectedTeacher"
      :teacher="selectedTeacher"
      @close="showEditModal = false"
      @updated="handleTeacherUpdated"
    />

    <ClassAssignmentModal
      v-if="showAssignModal && selectedTeacher"
      :teacher="selectedTeacher"
      @close="showAssignModal = false"
      @assigned="handleClassesAssigned"
    />

    <ConfirmationModal
      v-if="showDeleteModal"
      title="Eliminar Maestro"
      :message="`¿Estás seguro de que deseas eliminar al maestro ${selectedTeacher?.name}? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRBACStore } from '../../../stores/rbacStore'
import { useAdminTeachersStore } from '../store/admin'
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
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

// Components (would need to be created)
import TeacherCard from '../../Classes/components/TeacherCard.vue'
import TeachersTable from '../components/TeachersTable.vue'
import TeacherCreateModal from '../components/TeacherCreateModal.vue'
import TeacherEditModal from '../components/TeacherEditModal.vue'
import ClassAssignmentModal from '../components/ClassAssignmentModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

// Stores
const router = useRouter()
const rbacStore = useRBACStore()
const teachersStore = useAdminTeachersStore()

// State
const searchQuery = ref('')
const statusFilter = ref('')
const specialtyFilter = ref('')
const experienceFilter = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const sortField = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(20)

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showAssignModal = ref(false)
const showDeleteModal = ref(false)
const selectedTeacher = ref<any>(null)

// Computed
const teachers = computed(() => teachersStore.teachers)
const isLoading = computed(() => teachersStore.isLoading)
const totalTeachers = computed(() => teachers.value.length)
const activeTeachers = computed(() => teachers.value.filter(t => t.status === 'active').length)
const totalAssignedClasses = computed(() => teachers.value.reduce((sum, t) => sum + (t.assignedClasses?.length || 0), 0))
const totalSpecialties = computed(() => {
  const specialties = new Set()
  teachers.value.forEach(t => t.specialties?.forEach(s => specialties.add(s)))
  return specialties.size
})

const uniqueSpecialties = computed(() => {
  const specialties = new Set<string>()
  teachers.value.forEach(teacher => {
    teacher.specialties?.forEach(specialty => specialties.add(specialty))
  })
  return Array.from(specialties)
})

// Permissions
const canCreateTeacher = computed(() => rbacStore.hasPermission('teachers', 'create'))
const canViewTeacher = computed(() => rbacStore.hasPermission('teachers', 'view'))
const canEditTeacher = computed(() => rbacStore.hasPermission('teachers', 'edit'))
const canDeleteTeacher = computed(() => rbacStore.hasPermission('teachers', 'delete'))

// Filters
const hasActiveFilters = computed(() => 
  searchQuery.value || statusFilter.value || specialtyFilter.value || experienceFilter.value
)

const filteredTeachers = computed(() => {
  let filtered = [...teachers.value]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(teacher => 
      teacher.name.toLowerCase().includes(query) ||
      teacher.email.toLowerCase().includes(query) ||
      teacher.phone.toLowerCase().includes(query)
    )
  }
  
  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(teacher => teacher.status === statusFilter.value)
  }
  
  // Specialty filter
  if (specialtyFilter.value) {
    filtered = filtered.filter(teacher => 
      teacher.specialties?.includes(specialtyFilter.value)
    )
  }
  
  // Experience filter
  if (experienceFilter.value) {
    filtered = filtered.filter(teacher => {
      const years = teacher.experienceYears || 0
      switch (experienceFilter.value) {
        case 'junior': return years < 2
        case 'mid': return years >= 2 && years <= 5
        case 'senior': return years > 5
        default: return true
      }
    })
  }
  
  // Sorting
  filtered.sort((a, b) => {
    const aValue = a[sortField.value]
    const bValue = b[sortField.value]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder.value === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    return sortOrder.value === 'asc' 
      ? aValue - bValue
      : bValue - aValue
  })
  
  return filtered
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredTeachers.value.length / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => startIndex.value + itemsPerPage.value)

const paginatedTeachers = computed(() => 
  filteredTeachers.value.slice(startIndex.value, endIndex.value)
)

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 7
  const half = Math.floor(maxVisible / 2)
  
  let start = Math.max(1, currentPage.value - half)
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
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
  searchQuery.value = ''
  statusFilter.value = ''
  specialtyFilter.value = ''
  experienceFilter.value = ''
  currentPage.value = 1
}

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
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

const viewTeacher = (teacher: any) => {
  router.push(`/admin/teachers/${teacher.id}`)
}

const editTeacher = (teacher: any) => {
  selectedTeacher.value = teacher
  showEditModal.value = true
}

const deleteTeacher = (teacher: any) => {
  selectedTeacher.value = teacher
  showDeleteModal.value = true
}

const assignClasses = (teacher: any) => {
  selectedTeacher.value = teacher
  showAssignModal.value = true
}

const confirmDelete = async () => {
  if (selectedTeacher.value) {
    await teachersStore.deleteTeacher(selectedTeacher.value.id)
    showDeleteModal.value = false
    selectedTeacher.value = null
  }
}

const toggleTeacherStatus = async (teacher: any) => {
  const newStatus = teacher.status === 'active' ? 'inactive' : 'active'
  await teachersStore.updateTeacherStatus(teacher.id, newStatus)
}

const handleTeacherCreated = (teacher: any) => {
  showCreateModal.value = false
  teachersStore.loadTeachers()
}

const handleTeacherUpdated = (teacher: any) => {
  showEditModal.value = false
  selectedTeacher.value = null
  teachersStore.loadTeachers()
}

const handleClassesAssigned = (data: any) => {
  showAssignModal.value = false
  selectedTeacher.value = null
  teachersStore.loadTeachers()
}

const exportTeachers = () => {
  teachersStore.exportTeachers(filteredTeachers.value)
}

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
    cello: 'Violonchelo'
  }
  return specialties[specialty] || specialty
}

// Watch for filter changes to reset pagination
watch([searchQuery, statusFilter, specialtyFilter, experienceFilter], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(() => {
  teachersStore.loadTeachers()
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
