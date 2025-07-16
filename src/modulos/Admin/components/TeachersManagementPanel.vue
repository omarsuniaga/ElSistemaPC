<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <svg
          class="w-5 h-5 mr-2 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Gestión de Maestros
      </h3>
      <div class="flex space-x-2">
        <button
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
          @click="showFilters = !showFilters"
        >
          Filtros
        </button>
        <button
          class="px-3 py-1 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded-md transition-colors"
          @click="refreshData"
        >
          Actualizar
        </button>
        <button
          class="px-3 py-1 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          @click="showCreateModal = true"
        >
          + Nuevo
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
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="vacation">En vacaciones</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
          <select
            v-model="filters.specialty"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            <option value="piano">Piano</option>
            <option value="violin">Violín</option>
            <option value="guitar">Guitarra</option>
            <option value="drums">Batería</option>
            <option value="voice">Canto</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Experiencia</label>
          <select
            v-model="filters.experience"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Cualquiera</option>
            <option value="1-3">1-3 años</option>
            <option value="3-5">3-5 años</option>
            <option value="5+">5+ años</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Nombre o email..."
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-purple-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-purple-900">Total</p>
            <p class="text-2xl font-semibold text-purple-600">{{ stats.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-green-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-900">Activos</p>
            <p class="text-2xl font-semibold text-green-600">{{ stats.active }}</p>
          </div>
        </div>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"
                />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-blue-900">Con Estudiantes</p>
            <p class="text-2xl font-semibold text-blue-600">{{ stats.withStudents }}</p>
          </div>
        </div>
      </div>

      <div class="bg-orange-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-orange-900">Vacaciones</p>
            <p class="text-2xl font-semibold text-orange-600">{{ stats.onVacation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de maestros -->
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Maestro
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Especialidades
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estudiantes
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Calificación
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Último acceso
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="teacher in filteredTeachers" :key="teacher.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <img
                      class="h-10 w-10 rounded-full object-cover"
                      :src="teacher.avatar || '/default-avatar.png'"
                      :alt="teacher.name"
                    />
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ teacher.name }}</div>
                    <div class="text-sm text-gray-500">{{ teacher.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="specialty in teacher.specialties"
                    :key="specialty"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800"
                  >
                    {{ specialty }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(teacher.status)"
                >
                  {{ getStatusLabel(teacher.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ teacher.studentCount }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex text-yellow-400">
                    <svg
                      v-for="i in 5"
                      :key="i"
                      class="w-4 h-4"
                      :class="i <= teacher.rating ? 'text-yellow-400' : 'text-gray-300'"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                  </div>
                  <span class="ml-1 text-sm text-gray-600">({{ teacher.rating }})</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(teacher.lastAccess) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    class="text-purple-600 hover:text-purple-900 transition-colors"
                    @click="viewTeacher(teacher)"
                  >
                    Ver
                  </button>
                  <button
                    class="text-green-600 hover:text-green-900 transition-colors"
                    @click="editTeacher(teacher)"
                  >
                    Editar
                  </button>
                  <button
                    class="text-blue-600 hover:text-blue-900 transition-colors"
                    @click="manageSchedule(teacher)"
                  >
                    Horario
                  </button>
                  <button
                    class="text-red-600 hover:text-red-900 transition-colors"
                    @click="deleteTeacher(teacher)"
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
        {{ Math.min(currentPage * itemsPerPage, totalTeachers) }} de {{ totalTeachers }} maestros
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

interface Teacher {
  id: string
  name: string
  email: string
  specialties: string[]
  status: 'active' | 'inactive' | 'vacation'
  studentCount: number
  rating: number
  lastAccess: Date
  avatar?: string
  experience: string
}

const emit = defineEmits<{
  createTeacher: []
  viewTeacher: [teacher: Teacher]
  editTeacher: [teacher: Teacher]
  deleteTeacher: [teacher: Teacher]
  manageSchedule: [teacher: Teacher]
  refreshData: []
}>();

// State
const showFilters = ref(false);
const showCreateModal = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);

const teachers = ref<Teacher[]>([]);
const filters = ref({
  status: '',
  specialty: '',
  experience: '',
  search: '',
});

// Computed
const filteredTeachers = computed(() => {
  let filtered = teachers.value;

  if (filters.value.status) {
    filtered = filtered.filter((t) => t.status === filters.value.status);
  }

  if (filters.value.specialty) {
    filtered = filtered.filter((t) => t.specialties.includes(filters.value.specialty));
  }

  if (filters.value.experience) {
    filtered = filtered.filter((t) => t.experience === filters.value.experience);
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    filtered = filtered.filter(
      (t) => t.name.toLowerCase().includes(search) || t.email.toLowerCase().includes(search),
    );
  }

  return filtered.slice(
    (currentPage.value - 1) * itemsPerPage.value,
    currentPage.value * itemsPerPage.value,
  );
});

const totalTeachers = computed(() => teachers.value.length);
const totalPages = computed(() => Math.ceil(totalTeachers.value / itemsPerPage.value));

const stats = computed(() => ({
  total: teachers.value.length,
  active: teachers.value.filter((t) => t.status === 'active').length,
  withStudents: teachers.value.filter((t) => t.studentCount > 0).length,
  onVacation: teachers.value.filter((t) => t.status === 'vacation').length,
}));

// Methods
const getStatusClass = (status: string) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    vacation: 'bg-orange-100 text-orange-800',
  };
  return classes[status as keyof typeof classes] || classes.inactive;
};

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
    vacation: 'En vacaciones',
  };
  return labels[status as keyof typeof labels] || 'Desconocido';
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const viewTeacher = (teacher: Teacher) => {
  emit('viewTeacher', teacher);
};

const editTeacher = (teacher: Teacher) => {
  emit('editTeacher', teacher);
};

const deleteTeacher = (teacher: Teacher) => {
  emit('deleteTeacher', teacher);
};

const manageSchedule = (teacher: Teacher) => {
  emit('manageSchedule', teacher);
};

const refreshData = () => {
  emit('refreshData');
  loadTeachers();
};

const loadTeachers = () => {
  // Simular datos de maestros
  teachers.value = [
    {
      id: '1',
      name: 'Prof. Elena Martínez',
      email: 'elena.martinez@academia.com',
      specialties: ['Piano', 'Teoría Musical'],
      status: 'active',
      studentCount: 15,
      rating: 4.8,
      lastAccess: new Date(Date.now() - 3600000),
      avatar: '/avatars/elena.jpg',
      experience: '5+',
    },
    {
      id: '2',
      name: 'Mtro. Jorge Díaz',
      email: 'jorge.diaz@academia.com',
      specialties: ['Guitarra', 'Bajo'],
      status: 'active',
      studentCount: 12,
      rating: 4.6,
      lastAccess: new Date(Date.now() - 7200000),
      avatar: '/avatars/jorge.jpg',
      experience: '3-5',
    },
    {
      id: '3',
      name: 'Mtra. Carmen Vásquez',
      email: 'carmen.vasquez@academia.com',
      specialties: ['Violín', 'Viola'],
      status: 'vacation',
      studentCount: 8,
      rating: 4.9,
      lastAccess: new Date(Date.now() - 604800000),
      avatar: '/avatars/carmen.jpg',
      experience: '5+',
    },
  ];
};

// Lifecycle
onMounted(() => {
  loadTeachers();
});
</script>
