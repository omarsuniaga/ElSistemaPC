<template>
  <div class="admin-classes-management">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Clases</h1>
        <p class="text-gray-600 dark:text-gray-400">Administra clases, profesores, estudiantes y horarios</p>
      </div>
      
      <div class="flex items-center space-x-3">
        <button
          @click="toggleView"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center"
        >
          <component :is="currentViewIcon" class="h-5 w-5 mr-2" />
          {{ currentViewText }}
        </button>
        
        <button
          @click="createNewClass"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
        >
          <PlusIcon class="h-5 w-5 mr-2" />
          Nueva Clase
        </button>
      </div>
    </div>

    <!-- View Toggle Tabs -->
    <div class="mb-6">
      <TabContainer
        :tabs="viewTabs"
        :active-tab="currentView"
        @tab-change="setCurrentView"
      />
    </div>

    <!-- Content based on current view -->
    <div class="transition-all duration-300">
      <!-- List View -->
      <div v-if="currentView === 'list'">
        <ClassList
          :classes="classes"
          :loading="loading"
          @edit="editClass"
          @delete="confirmDeleteClass"
          @view-schedule="viewClassSchedule"
        />
      </div>

      <!-- Assignment Management View -->
      <div v-if="currentView === 'assignments'">
        <ClassAssignmentManager
          :classes="classes"
          @update-class="updateClass"
          @save-assignments="saveClassAssignments"
        />
      </div>

      <!-- Analytics View -->
      <div v-if="currentView === 'analytics'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total de Clases"
            :value="analyticsData.totalClasses"
            :trend="analyticsData.classesGrowth"
            icon="AcademicCapIcon"
            color="blue"
          />
          
          <MetricCard
            title="Clases Activas"
            :value="analyticsData.activeClasses"
            :trend="analyticsData.activeGrowth"
            icon="CheckCircleIcon"
            color="green"
          />
          
          <MetricCard
            title="Profesores Asignados"
            :value="analyticsData.assignedTeachers"
            :trend="analyticsData.teachersGrowth"
            icon="UserIcon"
            color="purple"
          />
          
          <MetricCard
            title="Estudiantes Inscritos"
            :value="analyticsData.enrolledStudents"
            :trend="analyticsData.studentsGrowth"
            icon="UsersIcon"
            color="yellow"
          />
        </div>

        <!-- Charts and additional analytics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribución por Instrumento
            </h3>
            <!-- Chart component would go here -->
            <div class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              📊 Gráfico de distribución
            </div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Horarios más Populares
            </h3>
            <!-- Chart component would go here -->
            <div class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              ⏰ Gráfico de horarios
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Class Form Modal -->
    <Modal
      :show="showClassModal"
      title="Editar Clase"
      @close="closeClassModal"
    >
      <ClassFormDialog
        :class-data="selectedClass"
        @save="saveClass"
        @cancel="closeClassModal"
      />
    </Modal>

    <!-- Schedule View Modal -->
    <Modal
      :show="showScheduleModal"
      title="Horario de Clase"
      @close="closeScheduleModal"
    >
      <div v-if="selectedClass" class="p-4">
        <div class="text-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ selectedClass.name }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ selectedClass.level }} • {{ selectedClass.instrument }}
          </p>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div v-if="selectedClass.schedule" class="text-center">
            <ClockIcon class="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p class="text-lg font-medium text-gray-900 dark:text-white">
              {{ formatScheduleDisplay(selectedClass.schedule) }}
            </p>
          </div>
          <div v-else class="text-center text-gray-500 dark:text-gray-400">
            <ClockIcon class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Sin horario configurado</p>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      :show="showDeleteModal"
      title="Confirmar Eliminación"
      @close="closeDeleteModal"
    >
      <div v-if="selectedClass" class="p-4">
        <div class="text-center mb-4">
          <ExclamationTriangleIcon class="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            ¿Eliminar esta clase?
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Esta acción no se puede deshacer. La clase "{{ selectedClass.name }}" será eliminada permanentemente.
          </p>
        </div>
        
        <div class="flex justify-center space-x-3">
          <button
            @click="closeDeleteModal"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="deleteClass"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ClassData } from '../types/class';
import ClassList from '../components/ClassList.vue';
import ClassAssignmentManager from '../components/ClassAssignmentManager.vue';
import ClassFormDialog from '../components/ClassFormDialog.vue';
import TabContainer from '../../Admin/components/TabContainer.vue';
import MetricCard from '../../Admin/components/MetricCard.vue';
import Modal from '../../../components/Modal.vue';
import {
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline';

// State
const currentView = ref<'list' | 'assignments' | 'analytics'>('list');
const loading = ref(false);
const showClassModal = ref(false);
const showScheduleModal = ref(false);
const showDeleteModal = ref(false);
const selectedClass = ref<ClassData | null>(null);

// Mock data - replace with actual store
const classes = ref<ClassData[]>([
  {
    id: '1',
    name: 'Piano Básico',
    level: 'Principiante',
    instrument: 'Piano',
    teacherId: '1',
    studentIds: ['1', '2', '3'],
    schedule: {
      day: 'Lunes',
      startTime: '10:00',
      endTime: '11:00'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Add more mock classes...
]);

// View configuration
const viewTabs = [
  { id: 'list', label: 'Lista de Clases', icon: 'ListBulletIcon' },
  { id: 'assignments', label: 'Asignaciones', icon: 'UserGroupIcon' },
  { id: 'analytics', label: 'Analíticas', icon: 'ChartBarIcon' }
];

// Computed
const currentViewIcon = computed(() => {
  const iconMap = {
    list: ListBulletIcon,
    assignments: UserGroupIcon,
    analytics: ChartBarIcon
  };
  return iconMap[currentView.value];
});

const currentViewText = computed(() => {
  const textMap = {
    list: 'Vista Lista',
    assignments: 'Asignaciones',
    analytics: 'Analíticas'
  };
  return textMap[currentView.value];
});

const analyticsData = computed(() => ({
  totalClasses: classes.value.length,
  activeClasses: classes.value.filter(c => c.teacherId && c.studentIds?.length).length,
  assignedTeachers: new Set(classes.value.map(c => c.teacherId).filter(Boolean)).size,
  enrolledStudents: classes.value.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0),
  classesGrowth: 12,
  activeGrowth: 8,
  teachersGrowth: 5,
  studentsGrowth: 15
}));

// Methods
function toggleView() {
  const views: Array<'list' | 'assignments' | 'analytics'> = ['list', 'assignments', 'analytics'];
  const currentIndex = views.indexOf(currentView.value);
  const nextIndex = (currentIndex + 1) % views.length;
  currentView.value = views[nextIndex];
}

function setCurrentView(tabId: string) {
  currentView.value = tabId as 'list' | 'assignments' | 'analytics';
}

function createNewClass() {
  selectedClass.value = null;
  showClassModal.value = true;
}

function editClass(classData: ClassData) {
  selectedClass.value = classData;
  showClassModal.value = true;
}

function viewClassSchedule(classData: ClassData) {
  selectedClass.value = classData;
  showScheduleModal.value = true;
}

function confirmDeleteClass(classData: ClassData) {
  selectedClass.value = classData;
  showDeleteModal.value = true;
}

function updateClass(classId: string, updates: Partial<ClassData>) {
  const index = classes.value.findIndex(c => c.id === classId);
  if (index > -1) {
    classes.value[index] = { ...classes.value[index], ...updates };
  }
}

function saveClass(classData: ClassData) {
  if (selectedClass.value) {
    // Update existing class
    updateClass(selectedClass.value.id, classData);
  } else {
    // Create new class
    classes.value.push({
      ...classData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  closeClassModal();
}

function deleteClass() {
  if (selectedClass.value) {
    const index = classes.value.findIndex(c => c.id === selectedClass.value!.id);
    if (index > -1) {
      classes.value.splice(index, 1);
    }
  }
  closeDeleteModal();
}

function saveClassAssignments(classId: string) {
  // Here you would save to your backend/store
  console.log(`Saving assignments for class ${classId}`);
  // Show success message
}

function formatScheduleDisplay(schedule: any): string {
  if (!schedule) return 'Sin horario';
  
  if (schedule.day && schedule.startTime && schedule.endTime) {
    return `${schedule.day} de ${schedule.startTime} a ${schedule.endTime}`;
  }
  
  return 'Horario incompleto';
}

// Modal handlers
function closeClassModal() {
  showClassModal.value = false;
  selectedClass.value = null;
}

function closeScheduleModal() {
  showScheduleModal.value = false;
  selectedClass.value = null;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  selectedClass.value = null;
}
</script>

<style scoped>
.admin-classes-management {
  padding: 1.5rem;
  max-width: 100%;
}

/* Smooth transitions for view changes */
.transition-all {
  transition: all 0.3s ease-in-out;
}

/* Custom scrollbar for modal content */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.dark .modal-content::-webkit-scrollbar-thumb {
  background: #4b5563;
}
</style>
