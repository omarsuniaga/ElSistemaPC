<!-- views/ClassesView.vue -->
<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden"
  >
    <!-- Mobile view navigation when showing details -->
    <div
      v-if="isMobile && showMobileDetail"
      class="fixed top-0 left-0 w-full z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center"
    >
      <button class="mr-4 text-gray-600 dark:text-gray-300" @click="goBackToList">
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div>
        <h2 class="text-lg font-medium truncate">
          {{ selectedClass?.name || "Detalles de clase" }}
        </h2>
        <!-- subtitulo -->
        <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {{ selectedClass?.classroom || "Preguntar en admin" }}
        </span>
      </div>
      <!-- mostrar avatar -->
      <div class="ml-auto">
        <button
          class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          @click="toggleDropdown(classItem.id, $event)"
        >
          <EllipsisVerticalIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>

    <!-- Main responsive container -->
    <div class="flex h-screen fixed top-0 left-0 w-full">
      <!-- List panel (full width on mobile, 30% on desktop) -->
      <div
        :class="{
          'w-full': isMobile && !showMobileDetail,
          hidden: isMobile && showMobileDetail,
          'w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700': !isMobile,
        }"
        class="h-full overflow-y-auto"
      >
        <div class="p-2 md:top-0">
          <!-- Mensajes de error y éxito -->
          <div
            v-if="errorMessage"
            class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg"
          >
            <p class="flex items-center">
              <span class="mr-2">⚠️</span>
              {{ errorMessage }}
            </p>
          </div>
          <div
            v-if="successMessage"
            class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg"
          >
            <p class="flex items-center">
              <span class="mr-2">✅</span>
              {{ successMessage }}
            </p>
          </div>

          <!-- Cabecera y botones de acción -->
          <div class="flex flex-col justify-between items-start mb-6 md:mb-6 gap-4 md:gap-2">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 md:mb-0">
              El Sistema Punta Cana
            </h1>
            <div class="flex flex-wrap gap-2 w-full md:w-auto justify-end md:justify-end">
              <!-- icono lupa -->
              <!-- <ClassFilters 
              :initial-filters="filters"
              :level-options="levelOptions"
              @update:filters="filters = $event"
            /> -->
            </div>
          </div>

          <!-- Filtros de clases -->

          <!-- Indicador de carga -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>

          <!-- Lista de clases estilo chat -->
          <div v-else-if="filteredGroups.length > 0" class="mt-4">
            <div class="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                {{ filteredGroups.length }} clases encontradas
              </p>
            </div>

            <ul
              class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              <li
                v-for="classItem in filteredGroups"
                :key="classItem.id"
                :class="{'bg-blue-50 dark:bg-blue-900/20': selectedClass?.id === classItem.id}"
                class="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors relative"
                @click="
                  handleView({
                    ...classItem,
                    level: classItem.level || 'Iniciación',
                    teacherId: classItem.teacherId || '',
                    studentIds: classItem.studentIds || [],
                    schedule: classItem.schedule || {days: [], startTime: '', endTime: ''},
                  })
                "
              >
                <div class="flex-shrink-0 mr-3">
                  <div
                    class="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center text-blue-800 dark:text-blue-200"
                  >
                    {{ classItem.name.substring(0, 2).toUpperCase() }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-medium text-gray-900 dark:text-white truncate">
                    {{ classItem.name }}
                    <span
                      v-if="classItem.instrument"
                      class="text-sm text-gray-500 dark:text-gray-400"
                    >
                      ({{ classItem.instrument }})
                    </span>
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {{ getTeacherName(classItem.teacherId) }} • {{ classItem.level }}
                  </p>
                </div>
                <div class="ml-3 flex-shrink-0">
                  <span
                    class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    {{ classItem.studentIds ? classItem.studentIds.length : 0 }}
                  </span>
                </div>
                <div class="ml-2 relative" @click.stop>
                  <button
                    class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    @click="toggleDropdown(classItem.id, $event)"
                  >
                    <EllipsisVerticalIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                  <div
                    v-if="activeDropdown === classItem.id"
                    class="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-36 z-10"
                  >
                    <button
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      @click="handleEdit(classItem.id)"
                    >
                      Editar
                    </button>
                    <button
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      @click="showStudentList(classItem.id)"
                    >
                      Estudiantes
                    </button>
                    <button
                      class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      @click="handleDelete(classItem.id)"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Estado vacío -->
          <div
            v-else-if="classesLoaded && filteredGroups.length === 0"
            class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div class="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500 mb-4">
              <UserGroupIcon class="h-full w-full" />
            </div>
            <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No hay clases</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{
                filteredGroups.length === 0 && Object.values(filters).some((f) => f)
                  ? "No se encontraron clases con los filtros seleccionados."
                  : "Aún no hay clases creadas."
              }}
            </p>
            <div class="mt-6 flex justify-center">
              <button
                class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                @click="showAddModal = true"
              >
                <PlusCircleIcon class="h-5 w-5" />
                <span>Crear nueva clase</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail panel -->
      <div
        :class="{
          'w-full': isMobile && showMobileDetail,
          hidden: isMobile && !showMobileDetail,
          'hidden md:block md:w-2/3': !isMobile && !selectedClass,
          'md:w-2/3': !isMobile && selectedClass,
        }"
        class="h-full w-full bg-gray-50 dark:bg-gray-900 p-1 overflow-y-auto"
      >
        <ClassDetail
          v-if="selectedClass"
          :selected-class="selectedClass"
          :is-mobile="isMobile"
          :show-mobile-detail="showMobileDetail"
          @show-student-list="showStudentList"
          @handle-edit="handleEdit"
          @handle-delete="handleDelete"
        />
        <div v-else class="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div class="text-center p-6">
            <UserGroupIcon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
              Selecciona una clase
            </h3>
            <p class="mt-1 text-gray-500 dark:text-gray-400">
              Selecciona una clase del panel izquierdo para ver sus detalles
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <Modal
      :show="showAddModal || showEditModal"
      :title="showEditModal ? 'Editar Clase' : 'Nueva Clase'"
      @close="closeModal"
    >
      <ClassForm
        :initial-data="
          selectedGroupId
            ? (() => {
                const c = classesStore.classes.find((g) => String(g.id) === String(selectedGroupId))
                return c
                  ? {
                      ...c,
                      createdAt: c.createdAt ? c.createdAt.toISOString() : undefined,
                      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : undefined,
                    }
                  : undefined
              })()
            : undefined
        "
        :is-loading="isLoading"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </Modal>

    <Modal :show="showInfoModal" title="Información de Clases" @close="showInfoModal = false">
      <template #footer>
        <button
          class="btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          @click="showInfoModal = false"
        >
          Cerrar
        </button>
      </template>
    </Modal>

    <Modal
      :show="showStudentsModal"
      title="Estudiantes del Grupo"
      @close="showStudentsModal = false"
    >
      <StudentManagement
        :group-name="selectedGroupName"
        :students="selectedGroupStudents"
        :is-loading="isLoading"
        @remove-student="removeStudentFromGroup"
        @add-student="showAddStudentForm"
      />
    </Modal>

    <Modal
      :show="showAddStudentModal"
      title="Agregar Estudiante al Grupo"
      @close="showAddStudentModal = false"
    >
      <StudentSelector
        :available-students="availableStudents"
        :selected-student-ids="selectedStudentIds"
        :is-loading="isLoading"
        :group-name="selectedGroupName"
        @select-student="selectStudent"
        @add-selected="addSelectedStudents"
        @cancel="showAddStudentModal = false"
        @remove-student="removeSelectedStudent"
      />
    </Modal>

    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar Grupo"
      message="¿Estás seguro de que deseas eliminar este grupo? Esta acción eliminará el grupo y lo quitará de todos los estudiantes asignados. Esta acción no se puede deshacer."
      :loading="isLoading"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    >
      <template #icon>
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
        >
          <TrashIcon class="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
      </template>
    </ConfirmModal>

    <button
      class="fixed bottom-16 right-6 w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center z-10 transition-all duration-200 hover:scale-105"
      title="Añadir Alumno"
      @click="router.push('/classes/new')"
    >
      <PlusIcon class="w-8 h-8" />
    </button>

    <!-- Botón para registrar clase emergente -->
    <button
      class="fixed bottom-16 right-20 bg-orange-600 hover:bg-orange-700 text-white shadow-lg flex items-center justify-center z-10 transition-all duration-200 hover:scale-105 rounded-full px-3 py-2"
      title="Registrar Clase Emergente"
      @click="showEmergencyClassModal = true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span class="ml-1 hidden sm:inline">Clase Emergente</span>
    </button>
    <!-- Drawer para detalles de clase -->
    <!-- <ClassesDrawer
      :show="showClassDrawer"
      :classItem="selectedClass"
      @close="showClassDrawer = false"
      @edit="handleEdit"
      @delete="handleDelete"
      @manage-students="showStudentList"
    /> -->

    <!-- Modal para registrar clase emergente -->
    <EmergencyClassModal
      v-if="showEmergencyClassModal"
      v-model="showEmergencyClassModal"
      :class-id="selectedClass?.id"
      :class-name="selectedClass?.name"
      :date="new Date().toISOString().split('T')[0]"
      @submitted="handleEmergencyClassSubmitted"
      @cancel="showEmergencyClassModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeMount } from 'vue';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { useTeachersStore } from '../modulos/Teachers/store/teachers';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useInstrumentoStore } from '../modulos/Instruments/store/instrumento';
import { useEmergencyClassStore } from '../modulos/Attendance/store/emergencyClass';
import type { Student } from '../modulos/Students/types/student';
import Modal from '../components/shared/Modal.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ClassForm from '../modulos/Classes/components/ClassForm.vue';
import StudentManagement from '../modulos/Students/components/StudentManagement.vue';
import StudentSelector from '../modulos/Students/components/StudentSelector.vue';
import ClassDetail from '../modulos/Classes/components/ClassDetail.vue';
import EmergencyClassModal from '../modulos/Attendance/components/EmergencyClassModal.vue';
import {
  PlusCircleIcon,
  InformationCircleIcon,
  UserGroupIcon,
  TrashIcon,
  BookOpenIcon,
  EllipsisVerticalIcon,
  ArrowLeftIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline';

interface ClassData {
  id: string
  name: string
  description?: string
  level: string
  instrument?: string
  teacherId: string
  studentIds: string[]
  schedule: {days: string[]; startTime: string; endTime: string}
  classroom?: string
  createdAt?: string
  updatedAt?: string
}

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const instrumentoStore = useInstrumentoStore();
const emergencyClassStore = useEmergencyClassStore();

// UI state
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showStudentsModal = ref(false);
const showAddStudentModal = ref(false);
const showInfoModal = ref(false);
const showClassDrawer = ref(false);
const showEmergencyClassModal = ref(false); // Modal para clases emergentes
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const activeDropdown = ref<string | null>(null);
const classesLoaded = ref(false);

// Selection state
const selectedGroupId = ref<string | null>(null);
const selectedGroupName = ref('');
const selectedStudent = ref<string | null>(null);
const selectedStudentIds = ref<string[]>([]);
const selectedClass = ref<ClassData | undefined>(undefined);
const searchQuery = ref('');

// Filter options
const levelOptions = ['Iniciación', 'Básico', 'Intermedio', 'Avanzado'];
const filters = ref({
  instrument: '',
  level: '',
  teacherId: '',
});

// Computed properties
const filteredGroups = computed(() => {
  let groups = classesStore.classes || [];

  if (filters.value.instrument) {
    groups = groups.filter((g) => g.instrument === filters.value.instrument);
  }

  if (filters.value.level) {
    groups = groups.filter((g) => g.level === filters.value.level);
  }

  if (filters.value.teacherId) {
    groups = groups.filter((g) => g.teacherId === filters.value.teacherId);
  }

  return groups;
});

const selectedGroupStudents = computed(() => {
  if (!selectedGroupId.value) return [];

  const group = classesStore.classes.find((g) => String(g.id) === String(selectedGroupId.value));
  return group && group.studentIds
    ? studentsStore.students
      .filter((s) => group.studentIds?.includes(s.id))
      .map(
        (s): Student => ({
          id: s.id,
          nombre: s.nombre || '',
          apellido: s.apellido || '',
          edad: (s as any).edad?.toString() || '',
          nac: s.nac || '',
          email: s.email || '',
          tlf: s.tlf || '',
          sexo: s.sexo || '',
          madre: s.madre || '',
          padre: s.padre || '',
          tlf_madre: s.tlf_madre || '',
          tlf_padre: s.tlf_padre || '',
          grupo: s.grupo || [],
          instrumento: s.instrumento || '',
          colegio_trabajo: (s as any).colegio_trabajo || '',
          horario_colegio_trabajo: (s as any).horario_colegio_trabajo || '',
          clase: (s as any).clase || '',
          propiedadExtra1: (s as any).propiedadExtra1 || '',
          propiedadExtra2: (s as any).propiedadExtra2 || '',
          propiedadExtra3: (s as any).propiedadExtra3 || '',
          activo: s.activo ?? true,
          createdAt: s.createdAt || new Date(),
          updatedAt: s.updatedAt || new Date(),
        }),
      )
    : [];
});

const students = computed(() => {
  return studentsStore.students.filter((s) => {
    const fullName = `${s.nombre || ''} ${s.apellido || ''}`.toLowerCase();
    return fullName.includes(searchQuery.value.toLowerCase());
  });
});
// Interfaces for better type checking
interface TeacherDisplay {
  id: string
  name: string
}

const instrumentOptions = computed<string[]>(() => {
  return instrumentoStore.instruments.map((i) => i.name);
});

// Helper function types
const getClassLevelClass = (level: string): string => {
  const levelClasses: Record<string, string> = {
    Iniciación: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    Básico: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    Intermedio: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    Avanzado: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  };
  return levelClasses[level] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
};
const availableStudents = computed(() => {
  return students.value.map(
    (s): Student => ({
      id: s.id,
      nombre: s.nombre || '',
      apellido: s.apellido || '',
      edad: s.edad?.toString() || '',
      nac: s.nac || '',
      email: s.email || '',
      tlf: s.tlf || '',
      sexo: s.sexo || '',
      madre: s.madre || '',
      padre: s.padre || '',
      tlf_madre: s.tlf_madre || '',
      tlf_padre: s.tlf_padre || '',
      grupo: s.grupo || [],
      instrumento: s.instrumento || '',
      colegio_trabajo: (s as any).colegio_trabajo || '',
      horario_colegio_trabajo: (s as any).horario_colegio_trabajo || '',
      clase: s.clase || '',
      propiedadExtra1: (s as any).propiedadExtra1 || '',
      propiedadExtra2: (s as any).propiedadExtra2 || '',
      propiedadExtra3: (s as any).propiedadExtra3 || '',
      activo: s.activo ?? true,
      createdAt: s.createdAt || new Date(),
      updatedAt: s.updatedAt || new Date(),
    }),
  );
});

const getTeacherName = (teacherId?: string): string => {
  if (!teacherId) return 'Sin profesor asignado';
  const teacher = teachersStore.teachers.find((t) => t.id === teacherId);
  return teacher?.name ?? 'Profesor no encontrado';
};

// UI state for responsive design
const isMobile = ref(false);
const showMobileDetail = ref(false);

// Check if device is mobile on component mount and window resize
const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768; // md breakpoint
};

onBeforeMount(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
});

// Loading and data fetching
onMounted(async () => {
  isLoading.value = true;
  try {
    await classesStore.fetchClasses();
    console.log(`Se encontraron ${classesStore.classes.length} clases en Firestore`);
    classesLoaded.value = true;

    await Promise.all([
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents(),
      instrumentoStore.fetchInstruments(),
    ]);
  } catch (error) {
    errorMessage.value = `Error al cargar los datos: ${error}`;
    console.error('Error al cargar los datos:', error);
  } finally {
    isLoading.value = false;
  }
});

// Class operations
async function handleSubmit(formData: any) {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Transform schedule format to include slots as required by ClassData type
    const scheduleSlots = Array.isArray(formData.schedule?.days)
      ? formData.schedule.days.map((day) => ({
        day,
        startTime:
            typeof formData.schedule?.startTime === 'string' ? formData.schedule.startTime : '',
        endTime: typeof formData.schedule?.endTime === 'string' ? formData.schedule.endTime : '',
      }))
      : [];

    // Create a copy of formData without the schedule property to avoid conflicts
    const { schedule, ...formDataWithoutSchedule } = formData;

    const classData: ClassData = {
      ...formDataWithoutSchedule,
      level: formData.level || 'Iniciación',
      teacherId: formData.teacherId,
      studentIds: formData.studentIds || [],
      schedule: {
        slots: scheduleSlots,
      },
      updatedAt: new Date().toISOString(),
    };

    if (showEditModal.value) {
      if (!formData.id) {
        throw new Error('ID de clase no válido');
      }

      const existingClass = classesStore.classes.find((c) => c.id === formData.id);
      if (!existingClass) {
        throw new Error(`No se encontró la clase con ID ${formData.id}`);
      }

      await classesStore.updateClass({
        ...classData,
        id: formData.id,
        createdAt: formData.createdAt
          ? new Date(formData.createdAt)
          : existingClass.createdAt || new Date(),
        updatedAt: new Date(),
      });
      successMessage.value = 'Clase actualizada correctamente';
    } else {
      await classesStore.addClass({
        ...classData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      successMessage.value = 'Clase creada correctamente';
    }

    closeModal();
    await classesStore.fetchClasses(); // Recargar la lista de clases
  } catch (err: any) {
    console.error('❌ Error en handleSubmit:', err);
    errorMessage.value = `Error: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
}

const handleEdit = (groupId: string) => {
  const group = classesStore.classes.find((g) => String(g.id) === String(groupId));
  if (!group) return;
  selectedGroupId.value = groupId;
  showEditModal.value = true;
  activeDropdown.value = null;
};

const handleDelete = (groupId: string) => {
  selectedGroupId.value = groupId;
  showDeleteModal.value = true;
  activeDropdown.value = null;
};

const confirmDelete = async () => {
  if (!selectedGroupId.value) return;

  try {
    isLoading.value = true;
    console.log('🗑️ Eliminando grupo con ID:', selectedGroupId.value);

    await classesStore.removeClass(selectedGroupId.value);

    successMessage.value = 'Grupo eliminado exitosamente';
    showDeleteModal.value = false;
  } catch (error) {
    errorMessage.value = 'Error al eliminar el grupo';
    console.error('❌ Error en confirmDelete:', error);
  } finally {
    isLoading.value = false;
  }
};

// Updated handleView for responsive behavior
const handleView = (classItem: ClassData) => {
  selectedClass.value = classItem;
  if (isMobile.value) {
    showMobileDetail.value = true;
  } else {
    showClassDrawer.value = true;
  }
  closeDropdowns();
};

const goBackToList = () => {
  showMobileDetail.value = false;
};

// Student management
const showStudentList = (groupId: string) => {
  selectedGroupId.value = groupId;
  const group = classesStore.classes.find((g) => String(g.id) === String(groupId));
  if (group) {
    selectedGroupName.value = group.name || 'Grupo sin nombre';
  }
  showStudentsModal.value = true;
  activeDropdown.value = null;
};

const removeStudentFromGroup = async (studentId: string) => {
  if (!selectedGroupId.value) return;
  try {
    isLoading.value = true;
    const classItem = classesStore.classes.find(
      (c) => String(c.id) === String(selectedGroupId.value),
    );
    if (!classItem) {
      throw new Error('Clase no encontrada');
    }
    const updatedStudentIds = (classItem.studentIds || []).filter((id) => id !== studentId);
    await classesStore.updateClass({
      ...classItem,
      studentIds: updatedStudentIds,
      createdAt: classItem.createdAt ? new Date(classItem.createdAt) : undefined,
      updatedAt: new Date(),
    });
    successMessage.value = 'Estudiante removido exitosamente';
  } catch (error: any) {
    errorMessage.value = 'Error al remover el estudiante';
    console.error('Error:', error);
  } finally {
    isLoading.value = false;
  }
};

const selectStudent = (studentId: string) => {
  selectedStudent.value = studentId;
  searchQuery.value = '';
  if (!selectedStudentIds.value.includes(studentId)) {
    selectedStudentIds.value.push(studentId);
  }
};

const addSelectedStudents = async () => {
  if (!selectedGroupId.value || selectedStudentIds.value.length === 0) return;
  try {
    isLoading.value = true;
    const classItem = classesStore.classes.find(
      (c) => String(c.id) === String(selectedGroupId.value),
    );
    if (classItem) {
      const updatedIds = [...(classItem.studentIds || []), ...selectedStudentIds.value];
      await classesStore.updateClass({
        ...classItem,
        studentIds: updatedIds,
        updatedAt: new Date(),
      });
    }
    successMessage.value = 'Estudiantes agregados exitosamente';
    showAddStudentModal.value = false;
    selectedStudentIds.value = [];
  } catch (error) {
    errorMessage.value = 'Error al agregar estudiantes';
    console.error('Error:', error);
  } finally {
    isLoading.value = false;
  }
};

const showAddStudentForm = () => {
  selectedStudentIds.value = [];
  showAddStudentModal.value = true;
};

const removeSelectedStudent = (studentId: string) => {
  selectedStudentIds.value = selectedStudentIds.value.filter((id) => id !== studentId);
};

// UI interactions
const toggleDropdown = (id: string, event: Event) => {
  event.stopPropagation();
  activeDropdown.value = activeDropdown.value === id ? null : id;
};

const closeDropdowns = () => {
  activeDropdown.value = null;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showAddStudentModal.value = false;
  showInfoModal.value = false;
  selectedGroupId.value = null;
  selectedStudentIds.value = [];
  successMessage.value = '';
  errorMessage.value = '';
};
const clearMessages = () => {
  successMessage.value = '';
  errorMessage.value = '';
};

watch([successMessage, errorMessage], clearMessages);

// Función para manejar la respuesta del modal de clase emergente
const handleEmergencyClassSubmitted = async (success: boolean) => {
  if (success) {
    successMessage.value = 'Clase emergente registrada correctamente. Pendiente de aprobación.';
    // Si se seleccionó una clase, actualizar la vista
    if (selectedClass.value) {
      // Recargar datos después de registrar la clase emergente
      await classesStore.fetchClasses();
    }
  } else {
    errorMessage.value = 'Error al registrar la clase emergente';
  }
};
</script>
