<template>
  <div class="teachers-admin-view p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <!-- Dashboard Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-1">
          Gestión de Maestros
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Administra y supervisa a todos los maestros de la academia
        </p>
      </div>
      
      <!-- Quick Stats -->
      <div class="flex flex-wrap gap-3">
        <div class="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-md">
            <UserIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <span class="text-xs text-gray-500 dark:text-gray-400">Total Maestros</span>
            <p class="font-semibold text-gray-900 dark:text-white">{{ teachers.length }}</p>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
            <AcademicCapIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <span class="text-xs text-gray-500 dark:text-gray-400">Clases Activas</span>
            <p class="font-semibold text-gray-900 dark:text-white">{{ getTotalClasses() }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Actions Bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar maestros..." 
              class="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div class="flex gap-2">
            <select 
              v-model="filterInstrument" 
              class="pl-3 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Todos los instrumentos</option>
              <option v-for="instrument in instruments" :key="instrument.id" :value="instrument.id">
                {{ instrument.name }}
              </option>
            </select>
            
            <select 
              v-model="filterStatus" 
              class="pl-3 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
        
        <!-- Add New -->
        <div class="flex justify-end">
          <button 
            @click="openTeacherForm(null)" 
            class="bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors duration-200"
          >
            <PlusIcon class="h-5 w-5 mr-2" />
            Nuevo Maestro
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-6">
          <div class="flex items-start space-x-4">
            <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
            <div class="flex-1">
              <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
          <div class="mt-6 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
          <div class="mt-6 flex justify-between">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Results -->
    <div v-else-if="filteredTeachers.length === 0" 
         class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      <FolderOpenIcon class="h-16 w-16 mx-auto text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No se encontraron maestros</h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Prueba con otros filtros o agrega un nuevo maestro a la plataforma.
      </p>
      <div class="mt-6">
        <button 
          @click="resetFilters" 
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowPathIcon class="h-5 w-5 mr-2" />
          Limpiar filtros
        </button>
      </div>
    </div>
    
    <!-- Teachers Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="teacher in paginatedTeachers"
        :key="teacher.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-shadow hover:shadow-md"
      >
        <!-- Teacher Card Header -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-start space-x-4">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div v-if="teacher.photoURL" class="h-12 w-12 rounded-full overflow-hidden">
                <img :src="teacher.photoURL" alt="" class="h-full w-full object-cover" />
              </div>
              <div v-else class="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                <span class="text-lg font-semibold">{{ teacher.name.charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            
            <!-- Name and Status -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                {{ teacher.name }}
              </h3>
              <div class="mt-1 flex items-center">
                <span
                  :class="{
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium': true,
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200': teacher.status === 'active',
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200': teacher.status === 'inactive',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200': teacher.status === 'pending'
                  }"
                >
                  {{ getStatusText(teacher.status) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Specialties Tags -->
          <div class="mt-4 flex flex-wrap gap-2">
            <span 
              v-for="specialty in getSpecialtiesArray(teacher.specialties)" 
              :key="specialty" 
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
            >
              {{ specialty }}
            </span>
            <span 
              v-if="getSpecialtiesArray(teacher.specialties).length === 0" 
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
            >
              Sin especialidad
            </span>
          </div>
        </div>
        
        <!-- Info Section -->
        <div class="px-6 py-4 flex-1">
          <!-- Instrument -->
          <div class="flex items-start space-x-3">
            <MusicalNoteIcon class="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ getInstrumentName(teacher.instrumentId) || 'No especificado' }}
            </span>
          </div>
          
          <!-- Contact -->
          <div class="flex items-start space-x-3 mt-2">
            <EnvelopeIcon class="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ teacher.email }}</span>
          </div>
          
          <!-- Phone -->
          <div class="flex items-start space-x-3 mt-2">
            <PhoneIcon class="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ teacher.phone || 'No disponible' }}</span>
          </div>
          
          <!-- Classes -->
          <div class="flex items-start space-x-3 mt-2">
            <AcademicCapIcon class="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ getTeacherClassCount(teacher.id) }} clases · {{ getTeacherStudentsCount(teacher.id) }} estudiantes
            </span>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-2">
          <button
            @click="viewTeacherAttendance(teacher.id)"
            class="flex flex-col items-center justify-center py-2 px-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Ver asistencias"
          >
            <ClipboardDocumentCheckIcon class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span class="mt-1 text-xs text-gray-600 dark:text-gray-400">Asistencias</span>
          </button>
          
          <button
            @click="viewTeacherSchedule(teacher.id)"
            class="flex flex-col items-center justify-center py-2 px-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Ver horario"
          >
            <CalendarDaysIcon class="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <span class="mt-1 text-xs text-gray-600 dark:text-gray-400">Horario</span>
          </button>
          
          <button
            @click="manageTeacherClasses(teacher)"
            class="flex flex-col items-center justify-center py-2 px-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Gestionar clases"
          >
            <AcademicCapIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
            <span class="mt-1 text-xs text-gray-600 dark:text-gray-400">Clases</span>
          </button>
          
          <div class="relative">
            <button
              @click="toggleActionMenu(teacher.id)"
              class="flex flex-col items-center justify-center py-2 px-1 w-full rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Más opciones"
            >
              <EllipsisHorizontalIcon class="h-6 w-6 text-gray-500 dark:text-gray-400" />
              <span class="mt-1 text-xs text-gray-600 dark:text-gray-400">Más</span>
            </button>
            
            <!-- Dropdown Menu -->
            <div 
              v-if="activeActionMenu === teacher.id"
              class="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
            >
              <div class="py-1">
                <button 
                  @click="openTeacherForm(teacher)" 
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <PencilSquareIcon class="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Editar maestro
                </button>
                <button 
                  @click="confirmDeleteTeacher(teacher)" 
                  class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <TrashIcon class="mr-2 h-4 w-4" />
                  Eliminar maestro
                </button>
                <button 
                  @click="toggleTeacherStatus(teacher)" 
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <ArrowPathIcon class="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                  {{ teacher.status === 'active' ? 'Desactivar' : 'Activar' }} maestro
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination -->
    <div v-if="filteredTeachers.length > pageSize" class="mt-6 flex justify-center sm:justify-between items-center">
      <div class="hidden sm:flex text-sm text-gray-700 dark:text-gray-300">
        Mostrando <span class="font-medium">{{ startIndex + 1 }}</span> a <span class="font-medium">{{ endIndex }}</span> de <span class="font-medium">{{ filteredTeachers.length }}</span> maestros
      </div>
      
      <div class="flex justify-center space-x-1">
        <button
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          :class=" [
            'px-2 py-1 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            currentPage === 1 
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
        >
          <ChevronDoubleLeftIcon class="h-5 w-5" />
        </button>
        
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          :class=" [
            'px-2 py-1 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            currentPage === 1 
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
        >
          <ChevronLeftIcon class="h-5 w-5" />
        </button>
        
        <div class="flex">
          <template v-for="page in displayedPages" :key="page">
            <button
              v-if="page !== '...'"
              @click="currentPage = page"
              :class=" [
                'px-4 py-1 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                currentPage === page
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ page }}
            </button>
            <span 
              v-else 
              class="px-4 py-1 border-t border-b border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 flex items-center"
            >
              ...
            </span>
          </template>
        </div>
        
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          :class=" [
            'px-2 py-1 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            currentPage === totalPages 
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
        >
          <ChevronRightIcon class="h-5 w-5" />
        </button>
        
        <button
          @click="currentPage = totalPages"
          :disabled="currentPage === totalPages"
          :class=" [
            'px-2 py-1 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            currentPage === totalPages 
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
        >
          <ChevronDoubleRightIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
    
    <!-- Modal for teacher form -->
    <Dialog :open="showTeacherForm" @close="showTeacherForm = false" class="relative z-50">
      <div class="fixed inset-0 bg-black/30 dark:bg-black/60" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div class="px-6 py-4 bg-primary-600 dark:bg-primary-700">
            <h3 class="text-lg font-medium text-white">
              {{ currentTeacher ? 'Editar Maestro' : 'Nuevo Maestro' }}
            </h3>
          </div>
          <div class="p-6">
            <TeacherForm 
              :teacher="currentTeacher" 
              @save="saveTeacher" 
              @cancel="showTeacherForm = false" 
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
    
    <!-- Modal for delete confirmation -->
    <ConfirmModal
      :show="showDeleteConfirm"
      title="Eliminar Maestro"
      message="¿Estás seguro de que deseas eliminar este maestro? Esta acción no se puede deshacer y podría afectar clases y estudiantes asociados."
      confirm-text="Eliminar"
      confirm-type="danger"
      cancel-text="Cancelar"
      @confirm="deleteTeacher"
      @cancel="showDeleteConfirm = false"
    />
    
    <!-- Modal for managing teacher classes -->
    <Dialog :open="showClassesManager" @close="showClassesManager = false" class="relative z-50">
      <div class="fixed inset-0 bg-black/30 dark:bg-black/60" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div class="px-6 py-4 bg-green-600 dark:bg-green-700">
            <h3 class="text-lg font-medium text-white flex items-center">
              <AcademicCapIcon class="h-5 w-5 mr-2" />
              Gestionar Clases - {{ selectedTeacher?.name }}
            </h3>
          </div>
          <div class="p-6">
            <TeacherClassesManager 
              :teacherId="selectedTeacher?.id" 
              :teacherName="selectedTeacher?.name"
              @close="showClassesManager = false" 
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTeachersStore } from '../../store/teachers';
import { useClassesStore } from '../../../Classes/store/classes';
import { useStudentsStore } from '../../../Students/store/students'; // Added missing import
import { useInstrumentsStore } from '@/stores/instruments';
import { Dialog, DialogPanel } from '@headlessui/vue';
import TeacherForm from '../../components/TeacherForm.vue';
import TeacherClassesManager from '../../components/TeacherClassesManager.vue';
import ConfirmModal from '../../../../components/ConfirmModal.vue';
import { useToast } from '../../../../components/ui/toast/use-toast';
import { 
  UserIcon, 
  AcademicCapIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  EllipsisHorizontalIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  FolderOpenIcon,
  MusicalNoteIcon
} from '@heroicons/vue/24/outline';

// Stores
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore(); // Initialize students store
const instrumentsStore = useInstrumentsStore();
const router = useRouter();
const { toast } = useToast();

// State
const isLoading = ref(true);
const searchQuery = ref('');
const filterInstrument = ref('');
const filterStatus = ref('all');
const showTeacherForm = ref(false);
const currentTeacher = ref(null);
const showDeleteConfirm = ref(false);
const teacherToDelete = ref(null);
const showClassesManager = ref(false);
const selectedTeacher = ref(null);
const currentPage = ref(1);
const pageSize = ref(6);
const activeActionMenu = ref(null);
const clickOutsideListener = ref(null);

// Computed properties
const teachers = computed(() => teachersStore.teachers);

const filteredTeachers = computed(() => {
  let result = [...teachers.value];
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(teacher => 
      (teacher.name && teacher.name.toLowerCase().includes(query)) || 
      (teacher.lastName && teacher.lastName.toLowerCase().includes(query)) ||
      (teacher.email && teacher.email.toLowerCase().includes(query))
    );
  }
  
  // Filter by instrument
  if (filterInstrument.value) {
    result = result.filter(teacher => teacher.instrumentId === filterInstrument.value);
  }
  
  // Filter by status
  if (filterStatus.value !== 'all') {
    result = result.filter(teacher => {
      if (filterStatus.value === 'active') {
        return teacher.status === 'active' || teacher.status === undefined || teacher.active !== false;
      } else {
        return teacher.status === 'inactive' || teacher.active === false;
      }
    });
  }
  
  return result;
});

const instruments = computed(() => instrumentsStore.instruments);

const totalPages = computed(() => Math.ceil(filteredTeachers.value.length / pageSize.value));

const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = Math.min(start + pageSize.value, filteredTeachers.value.length);
  return filteredTeachers.value.slice(start, end);
});

const startIndex = computed(() => (currentPage.value - 1) * pageSize.value);
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, filteredTeachers.value.length));

const displayedPages = computed(() => {
  const pages = [];
  
  if (totalPages.value <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Always include first and last page
    pages.push(1);
    
    // For current pages near the beginning
    if (currentPage.value <= 3) {
      pages.push(2, 3, 4, '...', totalPages.value - 1);
    }
    // For current pages near the end
    else if (currentPage.value >= totalPages.value - 2) {
      pages.push('...', totalPages.value - 3, totalPages.value - 2, totalPages.value - 1);
    }
    // For current pages in the middle
    else {
      pages.push('...', currentPage.value - 1, currentPage.value, currentPage.value + 1, '...'); 
    }
    
    pages.push(totalPages.value);
  }
  
  return pages;
});

// Watch for filter changes to reset page
watch([searchQuery, filterInstrument, filterStatus], () => {
  currentPage.value = 1;
});

// Methods
function resetFilters() {
  searchQuery.value = '';
  filterInstrument.value = '';
  filterStatus.value = 'all';
  currentPage.value = 1;
}

function getTotalClasses() {
  let totalClasses = 0;
  teachers.value.forEach(teacher => {
    totalClasses += getTeacherClassCount(teacher.id);
  });
  return totalClasses;
}

function toggleActionMenu(teacherId) {
  // Close any open menu first
  if (activeActionMenu.value && activeActionMenu.value !== teacherId) {
    activeActionMenu.value = null;
  }
  
  // Toggle the clicked menu
  activeActionMenu.value = activeActionMenu.value === teacherId ? null : teacherId;
  
  // Add click outside listener
  if (activeActionMenu.value) {
    setTimeout(() => {
      clickOutsideListener.value = (event) => {
        if (!event.target.closest('.action-menu-container')) {
          activeActionMenu.value = null;
          document.removeEventListener('click', clickOutsideListener.value);
        }
      };
      document.addEventListener('click', clickOutsideListener.value);
    }, 10);
  }
}

function getInstrumentName(instrumentId: string): string {
const instrument = instruments.value.find((i: { id: string }) => i.id === instrumentId);
  return instrument ? instrument.name : 'No asignado';
}

function getTeacherClassCount(teacherId: string): number {
  return classesStore.classes.filter((c) => c.teacherId && c.teacherId === teacherId).length;
}

function getTeacherStudentsCount(teacherId: string): number {
  try {
    if (!teacherId || !studentsStore.students || !classesStore.classes) return 0;
    
    // Get all class IDs for this teacher
    const teacherClassIds = classesStore.classes
      .filter(cls => cls.teacherId === teacherId)
      .map(cls => cls.id);
    
    if (teacherClassIds.length === 0) return 0;
    
    // Create a Set to track unique student IDs
    const uniqueStudentIds = new Set<string>();
    
    // For each student in our store, check if they belong to any of the teacher's classes
    studentsStore.students.forEach(student => {
      if (student.classId && teacherClassIds.includes(student.classId)) {
        uniqueStudentIds.add(student.id);
      }
    });
    
    return uniqueStudentIds.size;
  } catch (error) {
    console.error('Error counting teacher students:', error);
    return 0;
  }
}

function getStatusText(status) {
  switch (status) {
    case 'active': return 'Activo';
    case 'inactive': return 'Inactivo';
    case 'pending': return 'Pendiente';
    default: return status ? status : 'Activo';
  }
}

function getSpecialtiesArray(specialties) {
  if (!specialties) return [];
  if (Array.isArray(specialties)) return specialties;
  if (typeof specialties === 'string') return [specialties];
  return [];
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function openTeacherForm(teacher) {
  currentTeacher.value = teacher;
  showTeacherForm.value = true;
  activeActionMenu.value = null;
}

function saveTeacher(teacherData) {
  try {
    if (currentTeacher.value) {
      // Update existing teacher
      teachersStore.updateTeacher(currentTeacher.value.id, {
        ...teacherData
      });
      toast({
        title: 'Éxito',
        description: 'Maestro actualizado correctamente',
        variant: 'default'
      });
    } else {
      // Create new teacher
      teachersStore.addTeacher(teacherData);
      toast({
        title: 'Éxito',
        description: 'Maestro creado correctamente',
        variant: 'default'
      });
    }
    showTeacherForm.value = false;
  } catch (error) {
    console.error('Error saving teacher:', error);
    toast({
      title: 'Error',
      description: 'No se pudo guardar el maestro. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  }
}

function confirmDeleteTeacher(teacher) {
  teacherToDelete.value = teacher;
  showDeleteConfirm.value = true;
  activeActionMenu.value = null;
}

function deleteTeacher() {
  if (!teacherToDelete.value) return;
  
  try {
    teachersStore.deleteTeacher(teacherToDelete.value.id);
    toast({
      title: 'Éxito',
      description: 'Maestro eliminado correctamente',
      variant: 'default'
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    toast({
      title: 'Error',
      description: 'No se pudo eliminar el maestro. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  } finally {
    showDeleteConfirm.value = false;
    teacherToDelete.value = null;
  }
}

function viewTeacherSchedule(teacherId) {
  router.push(`/teachers/${teacherId}/schedule`);
  activeActionMenu.value = null;
}

function viewTeacherAttendance(teacherId) {
  // Update to navigate to the correct informe route with teacherId as query parameter
  router.push({
    path: '/attendance/informe',
    query: { teacherId }
  });
  activeActionMenu.value = null;
}

function manageTeacherClasses(teacher) {
  selectedTeacher.value = teacher;
  showClassesManager.value = true;
  activeActionMenu.value = null;

  // Ensure classes are loaded
  if (classesStore.classes.length === 0) {
    classesStore.fetchClasses().catch(error => {
      console.error('Error loading classes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las clases. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
    });
  }
}

function toggleTeacherStatus(teacher) {
  const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
  
  try {
    teachersStore.updateTeacher(teacher.id, {
      ...teacher,
      status: newStatus,
      active: newStatus === 'active'
    });
    
    toast({
      title: 'Estado actualizado',
      description: `Maestro ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`,
      variant: 'default'
    });
  } catch (error) {
    console.error('Error toggling teacher status:', error);
    toast({
      title: 'Error',
      description: 'No se pudo actualizar el estado del maestro',
      variant: 'destructive'
    });
  }
  activeActionMenu.value = null;
}

// Load data
onMounted(async () => {
  try {
    await Promise.all([
      teachersStore.fetchTeachers(),
      classesStore.fetchClasses()
    ]);
  } catch (error) {
    console.error('Error loading data:', error);
    toast({
      title: 'Error',
      description: 'No se pudieron cargar los datos. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  } finally {
    isLoading.value = false;
  }
  
  // Close action menu when clicking outside
  document.addEventListener('click', (event) => {
    if (activeActionMenu.value && !event.target.closest('.action-menu-container')) {
      activeActionMenu.value = null;
    }
  });
});
</script>

<style scoped>
.action-menu-container {
  position: relative;
}

@media (max-width: 768px) {
  .action-menu-container .dropdown-menu {
    left: 0;
    right: auto;
  }
}

/* Card hover effect */
.teacher-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Dark mode optimizations */
.dark .teacher-card {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: rgba(55, 65, 81, 0.5);
}

.dark .teacher-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
}
</style>