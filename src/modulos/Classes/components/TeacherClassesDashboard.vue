<!-- src/modulos/Classes/components/TeacherClassesDashboard.vue -->
<template>
  <div class="teacher-classes-dashboard">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mis Clases</h2>
      <div class="flex items-center space-x-4">
        <!-- Filtros -->
        <select
          v-model="selectedFilter"
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Todas las clases</option>
          <option value="lead">Como Encargado</option>
          <option value="assistant">Como Asistente</option>
        </select>

        <!-- Vista -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
          <button
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              viewMode === 'cards'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
            ]"
            @click="viewMode = 'cards'"
          >
            <ViewColumnsIcon class="h-4 w-4 inline mr-1" />
            Tarjetas
          </button>
          <button
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
            ]"
            @click="viewMode = 'list'"
          >
            <Bars3Icon class="h-4 w-4 inline mr-1" />
            Lista
          </button>
        </div>
      </div>
    </div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando clases...</span>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6"
    >
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            Error al cargar las clases
          </h3>
          <p class="mt-2 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
          <button
            class="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline"
            @click="loadTeacherClasses"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredClasses.length === 0" class="text-center py-12">
      <AcademicCapIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
      <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No hay clases</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{
          selectedFilter === "all"
            ? "No tienes clases asignadas."
            : selectedFilter === "lead"
              ? "No tienes clases como encargado."
              : "No tienes clases como asistente."
        }}
      </p>
    </div>

    <!-- Classes Grid/List -->
    <div v-else>
      <!-- Vista de Tarjetas -->
      <div v-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TeacherClassCard
          v-for="classData in filteredClasses"
          :key="classData.id"
          :class-data="classData"
          :teacher-role="getTeacherRole(classData)"
          @view-details="handleViewDetails"
          @take-attendance="handleTakeAttendance"
          @view-attendance="handleViewAttendance"
        />
      </div>
      <!-- Vista de Lista -->
      <div v-else class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
          <TeacherClassListItem
            v-for="classData in filteredClasses"
            :key="classData.id"
            :class-data="classData"
            :teacher-role="getTeacherRole(classData)"
            @view-details="handleViewDetails"
            @take-attendance="handleTakeAttendance"
            @view-attendance="handleViewAttendance"
            @add-observation="handleAddObservation"
            @edit-class="handleEditClass"
          />
        </ul>
      </div>
    </div>
    <!-- Stats Summary -->
    <div
      v-if="!isLoading && !error && filteredClasses.length > 0"
      class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div class="flex items-center">
          <UserIcon class="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div class="ml-3">
            <p class="text-sm font-medium text-blue-600 dark:text-blue-400">
              Clases como Encargado
            </p>
            <p class="text-2xl font-semibold text-blue-900 dark:text-blue-200">
              {{ leadClassesCount }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div class="flex items-center">
          <UsersIcon class="h-8 w-8 text-green-600 dark:text-green-400" />
          <div class="ml-3">
            <p class="text-sm font-medium text-green-600 dark:text-green-400">
              Clases como Asistente
            </p>
            <p class="text-2xl font-semibold text-green-900 dark:text-green-200">
              {{ assistantClassesCount }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <div class="flex items-center">
          <AcademicCapIcon class="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <div class="ml-3">
            <p class="text-sm font-medium text-purple-600 dark:text-purple-400">
              Total de Estudiantes
            </p>
            <p class="text-2xl font-semibold text-purple-900 dark:text-purple-200">
              {{ totalStudents }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTeacherCollaboration } from '../composables/useTeacherCollaboration';
import { useAuthStore } from '../../../stores/auth';
import TeacherClassCard from './TeacherClassCard.vue';
import TeacherClassListItem from './TeacherClassListItem.vue';
import {
  ViewColumnsIcon,
  Bars3Icon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline';
import type { TeacherClassView } from '../types/class';

// Router y stores
const router = useRouter();
const authStore = useAuthStore();

// Composables
const { isLoading, myClasses, error, fetchMyClasses } = useTeacherCollaboration();

// Estados locales
const selectedFilter = ref<'all' | 'lead' | 'assistant'>('all');
const viewMode = ref<'cards' | 'list'>('cards');

// Computed properties
const filteredClasses = computed(() => {
  switch (selectedFilter.value) {
  case 'lead':
    return myClasses.value.filter((c) => c.myRole === 'lead');
  case 'assistant':
    return myClasses.value.filter((c) => c.myRole === 'assistant');
  default:
    return myClasses.value;
  }
});

const leadClassesCount = computed(() => myClasses.value.filter((c) => c.myRole === 'lead').length);

const assistantClassesCount = computed(
  () => myClasses.value.filter((c) => c.myRole === 'assistant').length,
);

const totalStudents = computed(() => {
  const uniqueStudents = new Set();
  filteredClasses.value.forEach((classData) => {
    classData.studentIds?.forEach((studentId) => uniqueStudents.add(studentId));
  });
  return uniqueStudents.size;
});

// Methods
const getTeacherRole = (classData: TeacherClassView): 'lead' | 'assistant' => {
  return classData.myRole || 'assistant';
};

const loadTeacherClasses = async () => {
  await fetchMyClasses();
};

const handleViewDetails = (classData: TeacherClassView) => {
  router.push(`/classes/${classData.id}`);
};

const handleTakeAttendance = (classData: TeacherClassView) => {
  // Verificar permisos
  if (classData.myPermissions?.canTakeAttendance) {
    router.push(`/attendance/${classData.id}`);
  } else {
    // Mostrar mensaje de permisos insuficientes
    console.warn('No tienes permisos para tomar asistencia en esta clase');
  }
};

const handleViewAttendance = (classData: TeacherClassView) => {
  // Verificar permisos
  if (classData.myPermissions?.canViewAttendanceHistory) {
    router.push(`/attendance/history/${classData.id}`);
  } else {
    // Mostrar mensaje de permisos insuficientes
    console.warn('No tienes permisos para ver el historial de asistencia en esta clase');
  }
};

const handleAddObservation = (classData: TeacherClassView) => {
  // Verificar permisos
  if (classData.myPermissions?.canAddObservations) {
    router.push(`/classes/${classData.id}/observations`);
  } else {
    console.warn('No tienes permisos para agregar observaciones en esta clase');
  }
};

const handleEditClass = (classData: TeacherClassView) => {
  // Verificar permisos
  if (classData.myPermissions?.canEditClass) {
    router.push(`/classes/${classData.id}/edit`);
  } else {
    console.warn('No tienes permisos para editar esta clase');
  }
};

// Lifecycle
onMounted(() => {
  loadTeacherClasses();
});
</script>

<style scoped>
.teacher-classes-dashboard {
  padding: 1.5rem;
}
</style>
