<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PencilIcon, XCircleIcon, CheckIcon, UserGroupIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useStudentsStore } from '../../Students/store/students';
import { generateClassDetailsPDF } from '../../../utils/pdfExport';
import StudentProgress from '../../../components/StudentProgress.vue';

const props = defineProps({
  selectedClass: {
    type: Object,
    required: true
  },
  studentCount: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['handle-manage-students', 'save-changes']);

// Stores
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();


// State
const isEditing = ref(false);
const editableClass = ref({ ...props.selectedClass });
const saveLoading = ref(false);
const saveError = ref('');
const saveSuccess = ref(false);

// Computed
const teacherName = computed(() => {
  if (!props.selectedClass.teacherId) return 'Sin profesor asignado';
  const teacher = teachersStore.teachers.find(t => t.id === props.selectedClass.teacherId);
  return teacher ? teacher.name : 'Profesor no encontrado';
});

const classStudents = computed(() => {
  return props.selectedClass?.studentIds?.map(id => 
    studentsStore.students.find(s => s.id === id)
  ) || [];
});

// Methods
const startEditing = () => {
  editableClass.value = JSON.parse(JSON.stringify(props.selectedClass));
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  saveError.value = '';
  saveSuccess.value = false;
};

const saveClassChanges = async () => {
  saveLoading.value = true;
  saveError.value = '';
  saveSuccess.value = false;
  
  try {
    // Emitir evento para guardar cambios
    emit('save-changes', editableClass.value);
    saveSuccess.value = true;
    setTimeout(() => {
      isEditing.value = false;
      saveSuccess.value = false;
    }, 1500);
  } catch (error) {
    console.error('Error updating class:', error);
    saveError.value = 'Error al guardar los cambios. Inténtelo de nuevo.';
  } finally {
    saveLoading.value = false;
  }
};

const downloadStudentList = async () => {
  try {
    // Get teacher name from computed property
    const teacher = teacherName.value;
    
    // Get weekly hours (for now we'll set a default)
    const weeklyHours = 2; // You can calculate this from schedule if needed
    
    // Get all students with their full information
    const students = classStudents.value.filter(s => s !== undefined);
    
    // Generate and download the PDF
    await generateClassDetailsPDF(
      props.selectedClass.name,
      teacher,
      weeklyHours,
      students
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

onMounted(() => {
  // Cargar profesores al inicio
  console.log('Loading teachers...', teachersStore.teachers);
});
</script>

<template>
  <div class="space-y-4">
    <!-- Información Principal -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ isEditing ? 'Editar detalles de la clase' : 'Detalles de la clase' }}
        </h2>
        
        <!-- Edit/Save buttons -->
        <div v-if="!isEditing">
          <button 
            @click="startEditing"
            class="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-800 dark:hover:text-blue-300"
          >
            <PencilIcon class="h-4 w-4 mr-1" />
            Editar
          </button>
        </div>
        <div v-else class="flex gap-2">
          <button 
            @click="cancelEditing"
            class="inline-flex items-center text-gray-600 dark:text-gray-400 text-sm font-medium hover:text-gray-800 dark:hover:text-gray-300"
          >
            <XCircleIcon class="h-4 w-4 mr-1" />
            Cancelar
          </button>
          <button 
            @click="saveClassChanges"
            :disabled="saveLoading"
            class="inline-flex items-center text-green-600 dark:text-green-400 text-sm font-medium hover:text-green-800 dark:hover:text-green-300"
          >
            <CheckIcon v-if="!saveLoading" class="h-4 w-4 mr-1" />
            <span v-if="saveLoading" class="h-4 w-4 mr-1 animate-spin rounded-full border-t-2 border-green-500"></span>
            {{ saveLoading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
      
      <!-- Save feedback messages -->
      <div v-if="saveError" class="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md">
        {{ saveError }}
      </div>
      
      <div v-if="saveSuccess" class="mb-4 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-md">
        Cambios guardados correctamente.
      </div>
      
      <!-- View Mode -->
      <div v-if="!isEditing" class="space-y-3">
        <div class="flex items-start">
          <div class="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">Nombre:</div>
          <div class="flex-1 text-gray-900 dark:text-white">{{ selectedClass.name }}</div>
        </div>
        
        <div class="flex items-start">
          <div class="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">Profesor:</div>
          <div class="flex-1 text-gray-900 dark:text-white">{{ teacherName }}</div>
        </div>
        
        <div class="flex items-start">
          <div class="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">Instrumento:</div>
          <div class="flex-1 text-gray-900 dark:text-white">{{ selectedClass.instrument || 'No especificado' }}</div>
        </div>
        
        <div class="flex items-start">
          <div class="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">Nivel:</div>
          <div class="flex-1 text-gray-900 dark:text-white">{{ selectedClass.level }}</div>
        </div>
        
        <div class="flex items-start">
          <div class="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">Aula:</div>
          <div class="flex-1 text-gray-900 dark:text-white">{{ selectedClass.classroom || 'No asignada' }}</div>
        </div>
        
        <div v-if="selectedClass.description" class="flex items-start">
          <div class="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">Descripción:</div>
          <div class="flex-1 text-gray-900 dark:text-white">{{ selectedClass.description }}</div>
        </div>
      </div>
      
      <!-- Edit Mode -->
      <div v-else class="space-y-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
          <input 
            v-model="editableClass.name" 
            type="text" 
            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Profesor</label>
          <select 
            v-model="editableClass.teacherId" 
            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option :value="null">Sin profesor asignado</option>
            <option v-for="teacher in teachersStore.teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }}
            </option>
          </select>
        </div>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Instrumento</label>
          <input 
            v-model="editableClass.instrument" 
            type="text" 
            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nivel</label>
          <select 
            v-model="editableClass.level" 
            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Aula</label>
          <input 
            v-model="editableClass.classroom" 
            type="text" 
            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
          <textarea 
            v-model="editableClass.description" 
            rows="3"
            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Students Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Estudiantes</h2>
        <div class="flex gap-2">
          <button 
            @click="$emit('handle-manage-students')" 
            class="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <UserPlusIcon class="h-4 w-4 mr-1" />
            Gestionar
          </button>
          <button 
            @click="downloadStudentList" 
            class="inline-flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
          >
            <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
            PDF
          </button>
        </div>
      </div>
      
      <div v-if="classStudents.length > 0" class="space-y-2">
        <ul>
          <li v-for="student in classStudents" :key="student?.id">
            {{ student?.nombre }} {{ student?.apellido }}
          </li>
        </ul>
      </div>
      <div v-else class="text-center py-4">
        <UserGroupIcon class="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p class="text-gray-500 dark:text-gray-400 text-sm">No hay estudiantes asignados a esta clase</p>
        <button 
          @click="$emit('handle-manage-students')"
          class="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Agregar estudiantes
        </button>
      </div>
    </div>

    <!-- Student Progress Section -->
    <StudentProgress 
      v-if="selectedClass.id"
      :class-id="selectedClass.id"
      @student-progressed="$emit('refresh')"
    />
  </div>
</template>