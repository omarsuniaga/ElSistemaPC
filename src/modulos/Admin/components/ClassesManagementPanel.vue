<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <svg
          class="w-5 h-5 mr-2 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        Gestión de Clases
      </h3>
      <div class="flex space-x-2">
        <button
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
          @click="showFilters = !showFilters"
        >
          Filtros
        </button>
        <button
          class="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded-md transition-colors"
          @click="refreshData"
        >
          Actualizar
        </button>
        <button
          class="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          @click="showCreateModal = true"
        >
          + Nueva Clase
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div v-if="showFilters" class="bg-gray-50 p-4 rounded-lg mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            v-model="filters.status"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="active">Activas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="scheduled">Programadas</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Instrumento</label>
          <select
            v-model="filters.instrument"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="piano">Piano</option>
            <option value="violin">Violín</option>
            <option value="guitar">Guitarra</option>
            <option value="drums">Batería</option>
            <option value="voice">Canto</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
          <select
            v-model="filters.modality"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            <option value="individual">Individual</option>
            <option value="group">Grupal</option>
            <option value="masterclass">Masterclass</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Maestro o estudiante..."
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-green-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-900">Total</p>
            <p class="text-2xl font-semibold text-green-600">{{ stats.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-blue-900">Activas</p>
            <p class="text-2xl font-semibold text-blue-600">{{ stats.active }}</p>
          </div>
        </div>
      </div>

      <div class="bg-yellow-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-yellow-900">Programadas</p>
            <p class="text-2xl font-semibold text-yellow-600">{{ stats.scheduled }}</p>
          </div>
        </div>
      </div>

      <div class="bg-purple-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"
                />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-purple-900">Grupales</p>
            <p class="text-2xl font-semibold text-purple-600">{{ stats.group }}</p>
          </div>
        </div>
      </div>

      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900">Canceladas</p>
            <p class="text-2xl font-semibold text-gray-600">{{ stats.cancelled }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de clases -->
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Clase
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Maestro
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estudiantes
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Modalidad
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Horario
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="clase in filteredClasses" :key="clase.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ clase.name }}</div>
                  <div class="text-sm text-gray-500 flex items-center">
                    <span
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800"
                    >
                      {{ clase.instrument }}
                    </span>
                    <span class="ml-2">{{ clase.level }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ clase.teacher }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ clase.studentCount }}/{{ clase.maxStudents }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ getStudentListPreview(clase.students) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getModalityClass(clase.modality)"
                >
                  {{ getModalityLabel(clase.modality) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(clase.status)"
                >
                  {{ getStatusLabel(clase.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{{ clase.schedule.day }}</div>
                <div class="text-xs text-gray-500">{{ clase.schedule.time }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    class="text-green-600 hover:text-green-900 transition-colors"
                    @click="viewClass(clase)"
                  >
                    Ver
                  </button>
                  <button
                    class="text-blue-600 hover:text-blue-900 transition-colors"
                    @click="editClass(clase)"
                  >
                    Editar
                  </button>
                  <button
                    class="text-purple-600 hover:text-purple-900 transition-colors"
                    @click="manageStudents(clase)"
                  >
                    Estudiantes
                  </button>
                  <button
                    class="text-red-600 hover:text-red-900 transition-colors"
                    @click="deleteClass(clase)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-700">
        Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a
        {{ Math.min(currentPage * itemsPerPage, totalClasses) }} de {{ totalClasses }} clases
      </div>
      <div class="flex space-x-2">
        <button
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          @click="currentPage--"
        >
          Anterior
        </button>
        <button
          :disabled="currentPage >= totalPages"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          @click="currentPage++"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface ClassSchedule {
  day: string
  time: string
  duration: number
}

interface Class {
  id: string
  name: string
  instrument: string
  level: string
  teacher: string
  students: string[]
  studentCount: number
  maxStudents: number
  modality: 'individual' | 'group' | 'masterclass'
  status: 'active' | 'completed' | 'cancelled' | 'scheduled'
  schedule: ClassSchedule
}

const emit = defineEmits<{
  createClass: []
  viewClass: [clase: Class]
  editClass: [clase: Class]
  deleteClass: [clase: Class]
  manageStudents: [clase: Class]
  refreshData: []
}>();

// State
const showFilters = ref(false);
const showCreateModal = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);

const classes = ref<Class[]>([]);
const filters = ref({
  status: '',
  instrument: '',
  modality: '',
  search: '',
});

// Computed
const filteredClasses = computed(() => {
  let filtered = classes.value;

  if (filters.value.status) {
    filtered = filtered.filter((c) => c.status === filters.value.status);
  }

  if (filters.value.instrument) {
    filtered = filtered.filter((c) => c.instrument === filters.value.instrument);
  }

  if (filters.value.modality) {
    filtered = filtered.filter((c) => c.modality === filters.value.modality);
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.teacher.toLowerCase().includes(search) ||
        c.students.some((s) => s.toLowerCase().includes(search)),
    );
  }

  return filtered.slice(
    (currentPage.value - 1) * itemsPerPage.value,
    currentPage.value * itemsPerPage.value,
  );
});

const totalClasses = computed(() => classes.value.length);
const totalPages = computed(() => Math.ceil(totalClasses.value / itemsPerPage.value));

const stats = computed(() => ({
  total: classes.value.length,
  active: classes.value.filter((c) => c.status === 'active').length,
  scheduled: classes.value.filter((c) => c.status === 'scheduled').length,
  group: classes.value.filter((c) => c.modality === 'group').length,
  cancelled: classes.value.filter((c) => c.status === 'cancelled').length,
}));

// Methods
const getStatusClass = (status: string) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
  };
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Activa',
    completed: 'Completada',
    cancelled: 'Cancelada',
    scheduled: 'Programada',
  };
  return labels[status as keyof typeof labels] || 'Desconocido';
};

const getModalityClass = (modality: string) => {
  const classes = {
    individual: 'bg-blue-100 text-blue-800',
    group: 'bg-purple-100 text-purple-800',
    masterclass: 'bg-orange-100 text-orange-800',
  };
  return classes[modality as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const getModalityLabel = (modality: string) => {
  const labels = {
    individual: 'Individual',
    group: 'Grupal',
    masterclass: 'Masterclass',
  };
  return labels[modality as keyof typeof labels] || 'Desconocido';
};

const getStudentListPreview = (students: string[]) => {
  if (students.length === 0) return 'Sin estudiantes';
  if (students.length <= 2) return students.join(', ');
  return `${students.slice(0, 2).join(', ')}...`;
};

const viewClass = (clase: Class) => {
  emit('viewClass', clase);
};

const editClass = (clase: Class) => {
  emit('editClass', clase);
};

const deleteClass = (clase: Class) => {
  emit('deleteClass', clase);
};

const manageStudents = (clase: Class) => {
  emit('manageStudents', clase);
};

const refreshData = () => {
  emit('refreshData');
  loadClasses();
};

const loadClasses = () => {
  // Simular datos de clases
  classes.value = [
    {
      id: '1',
      name: 'Piano Intermedio A',
      instrument: 'Piano',
      level: 'Intermedio',
      teacher: 'Prof. Elena Martínez',
      students: ['Ana García', 'Luis Rodríguez'],
      studentCount: 2,
      maxStudents: 6,
      modality: 'group',
      status: 'active',
      schedule: {
        day: 'Lunes',
        time: '16:00-17:00',
        duration: 60,
      },
    },
    {
      id: '2',
      name: 'Guitarra Principiante',
      instrument: 'Guitarra',
      level: 'Principiante',
      teacher: 'Mtro. Jorge Díaz',
      students: ['Carlos López'],
      studentCount: 1,
      maxStudents: 1,
      modality: 'individual',
      status: 'active',
      schedule: {
        day: 'Miércoles',
        time: '18:00-19:00',
        duration: 60,
      },
    },
    {
      id: '3',
      name: 'Violín Avanzado',
      instrument: 'Violín',
      level: 'Avanzado',
      teacher: 'Mtra. Carmen Vásquez',
      students: ['María Rodríguez', 'José Hernández', 'Laura Morales'],
      studentCount: 3,
      maxStudents: 4,
      modality: 'group',
      status: 'scheduled',
      schedule: {
        day: 'Viernes',
        time: '15:00-16:30',
        duration: 90,
      },
    },
  ];
};

// Lifecycle
onMounted(() => {
  loadClasses();
});
</script>
