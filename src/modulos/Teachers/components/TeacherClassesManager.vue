<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useClassesStore } from '../../../modulos/Classes/store/classes';
import { useInstrumentsStore } from '@/stores/instruments';
import { useToast } from '../../../components/ui/toast/use-toast';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, ClockIcon } from '@heroicons/vue/24/outline';
import ConfirmModal from '../../../components/ConfirmModal.vue';

const props = defineProps({
  teacherId: {
    type: String,
    required: true
  },
  teacherName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

// Stores
const classesStore = useClassesStore();
const instrumentsStore = useInstrumentsStore();
const { toast } = useToast();

// Estado
const isLoading = ref(true);
const showDeleteConfirm = ref(false);
const classToDelete = ref(null);
const showClassForm = ref(false);
const currentClass = ref(null);
const searchQuery = ref('');
const filterInstrument = ref('');

// Cargar datos
onMounted(async () => {
  try {
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
    }
  } catch (error) {
    console.error('Error al cargar clases:', error);
    toast({
      title: 'Error',
      description: 'No se pudieron cargar las clases. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  } finally {
    isLoading.value = false;
  }
});

// Computed properties
const teacherClasses = computed(() => {
  return classesStore.getClassesByTeacher(props.teacherId) || [];
});

const filteredClasses = computed(() => {
  let result = teacherClasses.value;
  
  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(classItem => 
      classItem.name?.toLowerCase().includes(query) || 
      classItem.instrument?.toLowerCase().includes(query) ||
      classItem.level?.toLowerCase().includes(query)
    );
  }
  
  // Filtrar por instrumento
  if (filterInstrument.value) {
    result = result.filter(classItem => classItem.instrument === filterInstrument.value);
  }
  
  return result;
});

const instruments = computed(() => {
  // Obtener instrumentos únicos de las clases del maestro
  const uniqueInstruments = new Set();
  teacherClasses.value.forEach(classItem => {
    if (classItem.instrument) {
      uniqueInstruments.add(classItem.instrument);
    }
  });
  return Array.from(uniqueInstruments);
});

const availableClasses = computed(() => {
  // Clases que no tienen maestro asignado o tienen otro maestro
  return classesStore.classes.filter(classItem => 
    !classItem.teacherId || classItem.teacherId !== props.teacherId
  );
});

// Métodos
const getInstrumentName = (instrumentId) => {
  const instrument = instrumentsStore.instruments.find(i => i.id === instrumentId);
  return instrument ? instrument.name : 'No asignado';
};

const formatSchedule = (classItem) => {
  if (!classItem.schedule || !classItem.schedule.slots || classItem.schedule.slots.length === 0) {
    return 'Sin horario';
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  return classItem.schedule.slots.map(slot => {
    let dayIndex = typeof slot.day === 'number' ? slot.day : parseInt(slot.day);
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) dayIndex = 0;
    
    return `${dayNames[dayIndex]} ${slot.startTime || '00:00'}-${slot.endTime || '00:00'}`;
  }).join(', ');
};

const getStudentCount = (classItem) => {
  return classItem.studentIds?.length || 0;
};

const openClassForm = (classItem = null) => {
  currentClass.value = classItem;
  showClassForm.value = true;
};

const confirmDeleteClass = (classItem) => {
  classToDelete.value = classItem;
  showDeleteConfirm.value = true;
};

const deleteClass = async () => {
  if (!classToDelete.value) return;
  
  try {
    // Desasignar el maestro de la clase en lugar de eliminarla
    await classesStore.updateClass({
      id: classToDelete.value.id,
      teacherId: null
    });
    
    toast({
      title: 'Éxito',
      description: 'Clase desasignada correctamente',
      variant: 'default'
    });
  } catch (error) {
    console.error('Error al desasignar clase:', error);
    toast({
      title: 'Error',
      description: 'No se pudo desasignar la clase. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  } finally {
    showDeleteConfirm.value = false;
    classToDelete.value = null;
  }
};

const assignClassToTeacher = async (classId) => {
  try {
    await classesStore.assignTeacher(classId, props.teacherId);
    toast({
      title: 'Éxito',
      description: 'Clase asignada correctamente',
      variant: 'default'
    });
  } catch (error) {
    console.error('Error al asignar clase:', error);
    toast({
      title: 'Error',
      description: 'No se pudo asignar la clase. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  }
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div class="teacher-classes-manager">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Clases de {{ teacherName }}</h2>
      <button @click="handleClose" class="text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- Filtros y búsqueda -->
    <div class="flex flex-col md:flex-row gap-4 mb-6">
      <div class="flex-1">
        <div class="relative">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar clases..." 
            class="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
          />
          <div class="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="md:w-64">
        <select 
          v-model="filterInstrument" 
          class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
        >
          <option value="">Todos los instrumentos</option>
          <option v-for="instrument in instruments" :key="instrument" :value="instrument">
            {{ instrument }}
          </option>
        </select>
      </div>
      
      <div>
        <button 
          @click="openClassForm()" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusIcon class="h-5 w-5 mr-2" />
          Asignar Clase
        </button>
      </div>
    </div>
    
    <!-- Tabla de clases -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Instrumento
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nivel
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Horario
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estudiantes
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="isLoading">
            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
              <div class="flex justify-center">
                <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredClasses.length === 0">
            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
              No se encontraron clases asignadas a este maestro
            </td>
          </tr>
          <tr v-for="classItem in filteredClasses" :key="classItem.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ classItem.name }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ classItem.instrument || 'No asignado' }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ classItem.level || 'No definido' }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ formatSchedule(classItem) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <UserGroupIcon class="h-4 w-4 mr-1 text-gray-500" />
                <span class="text-sm text-gray-900">{{ getStudentCount(classItem) }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end space-x-2">
                <button 
                  @click="openClassForm(classItem)" 
                  class="text-blue-600 hover:text-blue-900"
                  title="Editar clase"
                >
                  <PencilIcon class="h-5 w-5" />
                </button>
                <button 
                  @click="confirmDeleteClass(classItem)" 
                  class="text-red-600 hover:text-red-900"
                  title="Desasignar clase"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Modal para asignar clase -->
    <div v-if="showClassForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div class="px-6 py-4 bg-blue-600">
          <h3 class="text-lg font-medium text-white">
            {{ currentClass ? 'Editar Clase' : 'Asignar Clase' }}
          </h3>
        </div>
        <div class="p-6">
          <div v-if="!currentClass">
            <h4 class="font-medium mb-4">Seleccionar clase para asignar:</h4>
            <div class="max-h-96 overflow-y-auto">
              <div v-if="availableClasses.length === 0" class="text-center py-4 text-gray-500">
                No hay clases disponibles para asignar
              </div>
              <div 
                v-for="classItem in availableClasses" 
                :key="classItem.id"
                class="border rounded-lg p-4 mb-2 hover:bg-gray-50 cursor-pointer"
                @click="assignClassToTeacher(classItem.id)"
              >
                <div class="font-medium">{{ classItem.name }}</div>
                <div class="text-sm text-gray-600">
                  {{ classItem.instrument || 'Sin instrumento' }} - {{ classItem.level || 'Sin nivel' }}
                </div>
                <div class="flex items-center text-sm text-gray-500 mt-1">
                  <ClockIcon class="h-4 w-4 mr-1" />
                  {{ formatSchedule(classItem) }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              @click="showClassForm = false"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmación para desasignar -->
    <ConfirmModal
      :show="showDeleteConfirm"
      title="Desasignar Clase"
      message="¿Estás seguro de que deseas desasignar esta clase del maestro? La clase seguirá existiendo pero sin maestro asignado."
      confirm-text="Desasignar"
      cancel-text="Cancelar"
      @confirm="deleteClass"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>