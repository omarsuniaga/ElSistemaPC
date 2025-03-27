<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useStudentsStore } from '../../Students/store/students';
import { UserPlusIcon, UserMinusIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  classId: {
    type: String,
    required: true
  },
  studentIds: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update', 'close']);

const studentsStore = useStudentsStore();
const selectedStudentIds = ref([...props.studentIds]);
const searchQuery = ref('');
const isLoading = ref(false);
const multiSelectMode = ref(false);
const selectedForAddition = ref<string[]>([]);


// Computed properties for filtering students
const availableStudents = computed(() => {
  return studentsStore.students.filter(student => !selectedStudentIds.value.includes(student.id));
});

const filteredAvailableStudents = computed(() => {
  if (!searchQuery.value) return availableStudents.value;
  
  const query = searchQuery.value.toLowerCase();
  return availableStudents.value.filter(student => {
    const fullName = `${student.nombre || ''} ${student.apellido || ''}`.toLowerCase();
    return fullName.includes(query);
  });
});

const selectedStudents = computed(() => {
  return studentsStore.students.filter(student => selectedStudentIds.value.includes(student.id));
});

const filteredSelectedStudents = computed(() => {
  if (!searchQuery.value) return selectedStudents.value;
  
  const query = searchQuery.value.toLowerCase();
  return selectedStudents.value.filter(student => {
    const fullName = `${student.nombre || ''} ${student.apellido || ''}`.toLowerCase();
    return fullName.includes(query);
  });
});

// Methods
const addStudent = (studentId) => {
  if (!selectedStudentIds.value.includes(studentId)) {
    selectedStudentIds.value.push(studentId);
  }
};

const toggleStudentSelection = (studentId) => {
  const index = selectedForAddition.value.indexOf(studentId);
  if (index === -1) {
    selectedForAddition.value.push(studentId);
  } else {
    selectedForAddition.value.splice(index, 1);
  }
};

const addSelectedStudents = () => {
  for (const studentId of selectedForAddition.value) {
    if (!selectedStudentIds.value.includes(studentId)) {
      selectedStudentIds.value.push(studentId);
    }
  }
  selectedForAddition.value = [];
  multiSelectMode.value = false;
};

const removeStudent = (studentId) => {
  selectedStudentIds.value = selectedStudentIds.value.filter(id => id !== studentId);
};

const saveChanges = async () => {
  isLoading.value = true;
  try {
    await emit('update', props.classId, selectedStudentIds.value);
    emit('close');
  } catch (error) {
    console.error('Error al guardar cambios:', error);
  } finally {
    isLoading.value = false;
  }
};

const toggleMultiSelectMode = () => {
  multiSelectMode.value = !multiSelectMode.value;
  if (!multiSelectMode.value) {
    selectedForAddition.value = [];
  }
};

onMounted(async () => {
  if (studentsStore.students.length === 0) {
    isLoading.value = true;
    try {
      await studentsStore.fetchStudents();
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    } finally {
      isLoading.value = false;
    }
  }
});
</script>

<template>
  <div>
    <!-- Search Bar -->
    <div class="mb-6 relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar estudiantes..."
        class="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
      />
      <MagnifyingGlassIcon class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Available Students -->
      <div>
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-medium text-gray-700 dark:text-gray-300">Estudiantes Disponibles ({{ filteredAvailableStudents.length }})</h3>
          <button 
            @click="toggleMultiSelectMode" 
            class="text-sm px-2 py-1 rounded-md" 
            :class="multiSelectMode ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'"
          >
            {{ multiSelectMode ? 'Cancelar selección' : 'Selección múltiple' }}
          </button>
        </div>
        
        <div class="border border-gray-200 dark:border-gray-700 rounded-md h-64 overflow-y-auto bg-white dark:bg-gray-800">
          <div v-if="isLoading" class="flex justify-center items-center h-full">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="filteredAvailableStudents.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
            No hay estudiantes disponibles
          </div>
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div 
              v-for="student in filteredAvailableStudents" 
              :key="student.id"
              class="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              @click="multiSelectMode ? toggleStudentSelection(student.id) : addStudent(student.id)"
            >
              <div class="flex items-center">
                <div v-if="multiSelectMode" class="mr-3">
                  <div class="w-5 h-5 border rounded flex items-center justify-center" :class="selectedForAddition.includes(student.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'">
                    <CheckIcon v-if="selectedForAddition.includes(student.id)" class="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <span class="font-medium">{{ student.nombre }} {{ student.apellido }}</span>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ student.email || 'Sin correo' }}
                  </p>
                </div>
              </div>
              <button 
                v-if="!multiSelectMode"
                class="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                title="Agregar estudiante"
              >
                <UserPlusIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="multiSelectMode && selectedForAddition.length > 0" class="mt-3 flex justify-end">
          <button 
            @click="addSelectedStudents" 
            class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
          >
            <UserPlusIcon class="h-4 w-4" />
            Agregar {{ selectedForAddition.length }} estudiante{{ selectedForAddition.length !== 1 ? 's' : '' }}
          </button>
        </div>
      </div>

      <!-- Selected Students -->
      <div>
        <h3 class="font-medium mb-3 text-gray-700 dark:text-gray-300">Estudiantes Asignados ({{ filteredSelectedStudents.length }})</h3>
        
        <div class="border border-gray-200 dark:border-gray-700 rounded-md h-64 overflow-y-auto bg-white dark:bg-gray-800">
          <div v-if="isLoading" class="flex justify-center items-center h-full">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="filteredSelectedStudents.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
            No hay estudiantes asignados
          </div>
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div 
              v-for="student in filteredSelectedStudents" 
              :key="student.id"
              class="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div>
                <span class="font-medium">{{ student.nombre }} {{ student.apellido }}</span>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ student.email || 'Sin correo' }}
                </p>
              </div>
              <button 
                @click="removeStudent(student.id)"
                class="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                title="Quitar estudiante"
              >
                <UserMinusIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end space-x-3 pt-6">
      <button 
        @click="emit('close')" 
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Cancelar
      </button>
      <button 
        @click="saveChanges" 
        :disabled="isLoading"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </div>
  </div>
</template>
