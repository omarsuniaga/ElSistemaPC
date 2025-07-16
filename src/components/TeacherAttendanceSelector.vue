<template>
  <div
    class="p-4 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow"
  >
    <!-- Vista de selección de maestros -->
    <div v-if="!selectedTeacherId">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-primary-600 dark:text-primary-400">
          Informe de Asistencia
        </h2>
        <button
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          @click="refreshTeachers"
        >
          <ArrowPathIcon class="h-4 w-4" :class="{'animate-spin': loading}" />
          Actualizar
        </button>
      </div>

      <!-- Filtros de maestros -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar maestro
            </label>
            <div class="relative">
              <MagnifyingGlassIcon
                class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por nombre o especialidad..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="sm:w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Indicador de carga -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <svg
          class="animate-spin h-10 w-10 text-primary-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span class="ml-3">Cargando maestros...</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Grid de maestros -->
      <div v-else>
        <div v-if="filteredTeachers.length === 0" class="text-center py-12">
          <UserGroupIcon class="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p class="text-lg text-gray-500 dark:text-gray-400 mb-2">
            {{
              searchQuery || statusFilter
                ? "No se encontraron maestros con los filtros aplicados"
                : "No hay maestros disponibles"
            }}
          </p>
          <button
            v-if="searchQuery || statusFilter"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            @click="clearFilters"
          >
            Limpiar filtros
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="teacher in filteredTeachers"
            :key="teacher.id"
            class="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6 cursor-pointer hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 group"
            @click="selectTeacher(teacher)"
          >
            <!-- Avatar y nombre -->
            <div class="flex items-center mb-4">
              <div
                class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden mr-4"
              >
                <img
                  v-if="teacher.photoURL"
                  :src="teacher.photoURL"
                  :alt="teacher.name"
                  class="w-full h-full object-cover"
                />
                <UserIcon v-else class="h-8 w-8 text-white" />
              </div>
              <div class="flex-1">
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                >
                  {{ teacher.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ teacher.email }}</p>
              </div>
            </div>

            <!-- Especialidades -->
            <div class="mb-4">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="specialty in teacher.specialties?.slice(0, 3)"
                  :key="specialty"
                  class="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
                >
                  {{ specialty }}
                </span>
                <span
                  v-if="teacher.specialties && teacher.specialties.length > 3"
                  class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-full"
                >
                  +{{ teacher.specialties.length - 3 }} más
                </span>
              </div>
            </div>

            <!-- Estado -->
            <div class="flex items-center justify-between">
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full font-medium',
                  teacher.status === 'activo'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                ]"
              >
                {{ teacher.status === "activo" ? "Activo" : "Inactivo" }}
              </span>

              <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <AcademicCapIcon class="h-4 w-4 mr-1" />
                <span>{{ teacherClassesCount[teacher.id] || 0 }} clases</span>
              </div>
            </div>

            <!-- Botón de acción -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ver Informe de Asistencia
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista del informe detallado -->
    <div v-else>
      <!-- Botón de regreso -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          <button
            class="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="goBackToTeachers"
          >
            <ArrowLeftIcon class="h-5 w-5" />
          </button>
          <h2 class="text-xl font-bold text-primary-600 dark:text-primary-400">
            Informe de Asistencia - {{ selectedTeacherName }}
          </h2>
        </div>
      </div>

      <!-- Componente de informe detallado -->
      <TeacherAttendanceReport :teacher-id="selectedTeacherId" @back="goBackToTeachers" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';
import { useTeachersStore } from '@/modulos/Teachers/store/teachers';
import { useClassesStore } from '@/modulos/Classes/store/classes';
import TeacherAttendanceReport from './reports/TeacherAttendanceReport.vue';

// Types
interface Teacher {
  id: string
  name: string
  email: string
  photoURL?: string
  specialties?: string[]
  status: string
}

interface ClassItem {
  id: string
  teacherId?: string
}

// Stores
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();

// Estado
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref('');
const selectedTeacherId = ref<string | null>(null);

// Computed
const filteredTeachers = computed(() => {
  let teachers = teachersStore.teachers;

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    teachers = teachers.filter(
      (teacher: Teacher) =>
        teacher.name?.toLowerCase().includes(query) ||
        teacher.email?.toLowerCase().includes(query) ||
        teacher.specialties?.some((specialty: string) => specialty.toLowerCase().includes(query)),
    );
  }

  // Filtrar por estado
  if (statusFilter.value) {
    teachers = teachers.filter((teacher: Teacher) => teacher.status === statusFilter.value);
  }

  return teachers;
});

const selectedTeacherName = computed(() => {
  if (!selectedTeacherId.value) return '';
  const teacher = teachersStore.teachers.find((t: Teacher) => t.id === selectedTeacherId.value);
  return teacher?.name || 'Maestro';
});

const teacherClassesCount = computed(() => {
  const counts: Record<string, number> = {};
  classesStore.classes.forEach((classItem: ClassItem) => {
    if (classItem.teacherId) {
      counts[classItem.teacherId] = (counts[classItem.teacherId] || 0) + 1;
    }
  });
  return counts;
});

// Métodos
const refreshTeachers = async () => {
  try {
    loading.value = true;
    error.value = null;

    await Promise.all([teachersStore.fetchTeachers(), classesStore.fetchClasses()]);
  } catch (err: any) {
    error.value = err.message || 'Error al cargar los maestros';
    console.error('Error refreshing teachers:', err);
  } finally {
    loading.value = false;
  }
};

const selectTeacher = (teacher: Teacher) => {
  selectedTeacherId.value = teacher.id;
};

const goBackToTeachers = () => {
  selectedTeacherId.value = null;
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
};

// Inicialización
onMounted(async () => {
  await refreshTeachers();
});
</script>

<style scoped>
/* Transiciones suaves */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Hover effects mejorados */
.group:hover {
  transform: translateY(-2px);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
