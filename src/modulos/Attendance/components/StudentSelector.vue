<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Seleccionar Estudiantes</h3>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ selectedStudents.length }} estudiante(s) seleccionado(s)
      </div>
    </div>

    <!-- Buscador de estudiantes -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          class="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Buscar estudiantes por nombre o apellido..."
      />
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label
          for="instrumentFilter"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Filtrar por instrumento
        </label>
        <select
          id="instrumentFilter"
          v-model="filters.instrument"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos los instrumentos</option>
          <option v-for="instrument in availableInstruments" :key="instrument" :value="instrument">
            {{ instrument }}
          </option>
        </select>
      </div>

      <div>
        <label
          for="levelFilter"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Filtrar por nivel
        </label>
        <select
          id="levelFilter"
          v-model="filters.level"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos los niveles</option>
          <option v-for="level in availableLevels" :key="level" :value="level">
            {{ level }}
          </option>
        </select>
      </div>

      <div class="flex items-end">
        <button
          type="button"
          class="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="clearFilters"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Acciones de selección masiva -->
    <div
      class="flex justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="flex space-x-2">
        <button
          type="button"
          :disabled="filteredStudents.length === 0"
          class="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="selectAll"
        >
          Seleccionar todos
        </button>
        <button
          type="button"
          :disabled="selectedStudents.length === 0"
          class="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="deselectAll"
        >
          Deseleccionar todos
        </button>
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ filteredStudents.length }} estudiante(s) disponible(s)
      </div>
    </div>

    <!-- Lista de estudiantes -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando estudiantes...</span>
    </div>

    <div
      v-else-if="filteredStudents.length === 0"
      class="text-center py-8 text-gray-500 dark:text-gray-400"
    >
      <svg
        class="mx-auto h-12 w-12 text-gray-400 mb-4"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
      >
        <path
          d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <p>No se encontraron estudiantes con los filtros aplicados</p>
      <button
        type="button"
        class="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        @click="clearFilters"
      >
        Limpiar filtros
      </button>
    </div>

    <div
      v-else
      class="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md"
    >
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <label
          v-for="student in filteredStudents"
          :key="student.id"
          class="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        >
          <input
            v-model="selectedStudents"
            :value="student.id"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div class="ml-3 flex-1">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ student.nombre }} {{ student.apellido }}
                </p>
                <div class="flex space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="student.instrumento">{{ student.instrumento }}</span>
                  <span v-if="student.nivel">• {{ student.nivel }}</span>
                  <span v-if="student.clases && student.clases.length > 0">
                    • {{ student.clases.length }} clase(s)
                  </span>
                </div>
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500">
                ID: {{ student.id.slice(-6) }}
              </div>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Resumen de selección -->
    <div
      v-if="selectedStudents.length > 0"
      class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md p-3"
    >
      <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
        Estudiantes seleccionados ({{ selectedStudents.length }})
      </h4>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="studentId in selectedStudents"
          :key="studentId"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
        >
          {{ getStudentName(studentId) }}
          <button
            type="button"
            class="ml-1 inline-flex items-center p-0.5 rounded-full text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700"
            @click="removeStudent(studentId)"
          >
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Types
interface Student {
  id: string
  nombre: string
  apellido: string
  instrumento?: string
  nivel?: string
  clases?: string[]
  activo?: boolean
}

interface Props {
  modelValue: string[]
  availableStudents: Student[]
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'students-changed', value: string[]): void
}

// Props and emits
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive state
const searchQuery = ref('');
const filters = ref({
  instrument: '',
  level: '',
});

// Computed properties
const selectedStudents = computed({
  get: () => props.modelValue,
  set: (value: string[]) => {
    emit('update:modelValue', value);
    emit('students-changed', value);
  },
});

const filteredStudents = computed(() => {
  let students = props.availableStudents;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    students = students.filter((student) =>
      `${student.nombre} ${student.apellido}`.toLowerCase().includes(query),
    );
  }

  // Filter by instrument
  if (filters.value.instrument) {
    students = students.filter((student) => student.instrumento === filters.value.instrument);
  }

  // Filter by level
  if (filters.value.level) {
    students = students.filter((student) => student.nivel === filters.value.level);
  }

  return students.sort((a, b) =>
    `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`),
  );
});

const availableInstruments = computed(() => {
  const instruments = [
    ...new Set(props.availableStudents.map((student) => student.instrumento).filter(Boolean)),
  ];
  return instruments.sort();
});

const availableLevels = computed(() => {
  const levels = [
    ...new Set(props.availableStudents.map((student) => student.nivel).filter(Boolean)),
  ];
  return levels.sort();
});

// Methods
const getStudentName = (studentId: string) => {
  const student = props.availableStudents.find((s) => s.id === studentId);
  return student ? `${student.nombre} ${student.apellido}` : studentId;
};

const selectAll = () => {
  const allFilteredIds = filteredStudents.value.map((student) => student.id);
  const newSelection = [...new Set([...selectedStudents.value, ...allFilteredIds])];
  selectedStudents.value = newSelection;
};

const deselectAll = () => {
  const filteredIds = new Set(filteredStudents.value.map((student) => student.id));
  selectedStudents.value = selectedStudents.value.filter((id) => !filteredIds.has(id));
};

const removeStudent = (studentId: string) => {
  selectedStudents.value = selectedStudents.value.filter((id) => id !== studentId);
};

const clearFilters = () => {
  searchQuery.value = '';
  filters.value = {
    instrument: '',
    level: '',
  };
};
</script>

<style scoped>
/* Custom scrollbar for student list */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Dark mode scrollbar */
.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
