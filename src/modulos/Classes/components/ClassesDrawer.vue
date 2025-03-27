
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useStudentsStore } from '../../Students/store/students';
import type { Class } from '../../Classes/types/class';
import Modal from '../../../components/shared/Modal.vue';
import { 
  XMarkIcon, 
  UserIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline';

const props = defineProps<{
  show: boolean;
  classItem?: Class;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
  (e: 'manage-students', id: string): void;
}>();

const router = useRouter();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const isLoading = ref(false);
const drawerPanel = ref<HTMLElement | null>(null);
const showDeleteConfirm = ref(false);

// Computed properties
const teacherName = computed(() => {
  if (!props.classItem?.teacherId) return 'No asignado';
  const teacher = teachersStore.teachers.find(t => t.id === props.classItem!.teacherId);
  return teacher ? teacher.name : 'No asignado';
});

const teacherAvatar = computed(() => {
  if (!props.classItem?.teacherId) return `https://api.dicebear.com/7.x/avataaars/svg?seed=default`;
  const teacher = teachersStore.teachers.find(t => t.id === props.classItem!.teacherId);
  return teacher?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher?.name}`;
});

const students = computed(() => {
  if (!props.classItem?.studentIds?.length) return [];
  return studentsStore.students.filter(student => 
    props.classItem?.studentIds?.includes(student.id)
  );
});

// Methods
const closeDrawer = () => {
  emit('close');
};

const formatDay = (day: string): string => {
  const days: Record<string, string> = {
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo',
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miércoles': 'Miércoles',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sábado': 'Sábado',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };
  return days[day.toLowerCase()] || day;
};

const editSchedule = () => {
  emit('edit', props.classItem!.id);
};

const confirmDelete = () => {
  showDeleteConfirm.value = true;
};

const handleDelete = () => {
  showDeleteConfirm.value = false;
  emit('delete', props.classItem!.id);
};

const goToStudentProfile = (studentId: string) => {
  router.push(`/students/${studentId}`);
};

const isStudentActive = (student: any) => {
  // Implementar lógica para determinar si el estudiante está activo
  // Por ejemplo, basado en asistencia reciente o estado de pagos
  return true;
};

// Keyboard events
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    if (showDeleteConfirm.value) {
      showDeleteConfirm.value = false;
    } else {
      closeDrawer();
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
});

// Prevent body scroll when drawer is open
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>
<template>
  <div
    class="fixed inset-0 overflow-hidden z-30"
    v-if="show"
    @click="closeDrawer"
  >
    <!-- Backdrop with blur and fade animation -->
    <div 
      class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
      :class="show ? 'opacity-100' : 'opacity-0'"
    ></div>
    
    <!-- Drawer Panel -->
    <div class="absolute inset-y-0 right-0 max-w-full flex">
      <div 
        class="relative w-screen max-w-2xl transform transition-transform duration-300 ease-in-out pb-20"
        :class="show ? 'translate-x-0' : 'translate-x-full'"
        @click.stop
        ref="drawerPanel"
      >
        <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900 rounded-l-xl shadow-2xl">
          <!-- Header with gradient -->
          <div class="relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-800/20 backdrop-blur-sm"></div>
            <div class="relative px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white group">
                    {{ classItem?.name || 'Detalles de Clase' }}
                    <span class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        @click="$emit('edit', classItem!.id)"
                        class="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        title="Editar nombre"
                      >
                        <PencilIcon class="h-5 w-5" />
                      </button>
                    </span>
                  </h2>
                  <div class="mt-1 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span class="flex items-center gap-1">
                      <MusicalNoteIcon class="h-4 w-4" />
                      {{ classItem?.instrument }}
                    </span>
                    <span class="text-gray-300 dark:text-gray-600">•</span>
                    <span class="flex items-center gap-1">
                      <AcademicCapIcon class="h-4 w-4" />
                      {{ classItem?.level }}
                    </span>
                  </div>
                </div>
                <button 
                  @click="closeDrawer"
                  class="rounded-full p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/10 transition-colors"
                >
                  <XMarkIcon class="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-6 py-6">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center h-full">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
            
            <!-- Class Details -->
            <div v-else-if="classItem" class="space-y-8">
              <!-- Teacher Section -->
              <section class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <UserIcon class="h-5 w-5 text-primary-500" />
                  Profesor Asignado
                </h3>
                <div class="flex items-center gap-4">
                  <img
                    :src="teacherAvatar"
                    :alt="teacherName"
                    class="h-12 w-12 rounded-full object-cover border-2 border-primary-100 dark:border-primary-900"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ teacherName }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Profesor principal</p>
                  </div>
                </div>
              </section>
              
              <!-- Schedule Section -->
              <section class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <CalendarIcon class="h-5 w-5 text-primary-500" />
                      Horario de Clases
                    </h3>
                    <button 
                      @click="editSchedule"
                      class="text-primary-600 hover:text-primary-700 dark:text-primary-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div class="p-4">
                  <div v-if="classItem.schedule?.days?.length" class="grid gap-3">
                    <div 
                      v-for="(day, index) in classItem.schedule.days" 
                      :key="index"
                      class="flex items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                    >
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ formatDay(day) }}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <ClockIcon class="h-4 w-4" />
                          {{ classItem.schedule.startTime }} - {{ classItem.schedule.endTime }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-3 text-gray-500 dark:text-gray-400">
                    No hay horarios definidos
                  </div>
                </div>
              </section>
              
              <!-- Students Section -->
              <section class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <UserGroupIcon class="h-5 w-5 text-primary-500" />
                      Estudiantes Inscritos
                    </h3>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      Total: {{ students.length }}
                    </span>
                  </div>
                </div>
                
                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                  <div v-if="students.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400">
                    <UserGroupIcon class="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    No hay estudiantes inscritos en esta clase
                  </div>
                  <div v-else>
                    <div 
                      v-for="student in students" 
                      :key="student.id" 
                      class="group cursor-pointer"
                      @click="goToStudentProfile(student.id)"
                    >
                      <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div class="flex items-center gap-4">
                          <div class="relative">
                            <img
                              :src="student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nombre}`"
                              :alt="`${student.nombre} ${student.apellido}`"
                              class="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-primary-300 dark:group-hover:border-primary-700 transition-colors"
                            />
                            <div class="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"
                                 v-if="isStudentActive(student)"></div>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {{ student.nombre }} {{ student.apellido }}
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <MusicalNoteIcon class="h-4 w-4" />
                              {{ student.instrumento || 'Sin instrumento asignado' }}
                            </p>
                          </div>
                          <ChevronRightIcon class="h-5 w-5 text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            
            <!-- Error State -->
            <div v-else class="flex flex-col items-center justify-center h-full">
              <ExclamationCircleIcon class="h-12 w-12 text-gray-400" />
              <p class="mt-2 text-gray-500 dark:text-gray-400">No se pudo cargar la información de la clase</p>
            </div>
          </div>
          
          <!-- Footer with Actions -->
          <div class="absolute bottom-10 left-0 right-0 px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
            <div class="flex items-center justify-between gap-4">
              <button
                @click="$emit('manage-students', classItem!.id)"
                class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors gap-2"
              >
                <UserGroupIcon class="h-5 w-5" />
                Gestionar Estudiantes
              </button>
              <div class="flex gap-2">
                <button
                  @click="$emit('edit', classItem!.id)"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors text-gray-700 dark:text-gray-200"
                >
                  <PencilIcon class="h-5 w-5" />
                </button>
                <button
                  @click="confirmDelete"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-white"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <Modal
    :show="showDeleteConfirm"
    title="Eliminar Clase"
    @close="showDeleteConfirm = false"
  >
    <div class="p-6">
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
        <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
      </div>
      <h3 class="text-lg font-medium text-center text-gray-900 dark:text-gray-100 mb-2">
        ¿Estás seguro de eliminar esta clase?
      </h3>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        Esta acción no se puede deshacer y eliminará todos los registros asociados a esta clase.
      </p>
    </div>
    <div class="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3">
      <button
        @click="showDeleteConfirm = false"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="handleDelete"
        class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        Eliminar
      </button>
    </div>
  </Modal>
</template>
