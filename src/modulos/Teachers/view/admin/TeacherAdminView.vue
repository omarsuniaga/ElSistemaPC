<template>
  <div class="teachers-admin-view p-6">
    <h1 class="text-3xl font-bold mb-8">Gestión de Maestros</h1>
    
    <!-- Barra de acciones superior -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-4">
        <div class="relative">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar maestros..." 
            class="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
          <div class="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <select 
          v-model="filterInstrument" 
          class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos los instrumentos</option>
          <option v-for="instrument in instruments" :key="instrument.id" :value="instrument.id">
            {{ instrument.name }}
          </option>
        </select>
      </div>
      
      <button 
        @click="openTeacherForm(null)" 
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nuevo Maestro
      </button>
    </div>
    
    <!-- Tabla de maestros -->
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
              Contacto
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clases
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
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
          <tr v-else-if="filteredTeachers.length === 0">
            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
              No se encontraron maestros
            </td>
          </tr>
          <tr v-for="teacher in filteredTeachers" :key="teacher.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <img 
                    :src="teacher.photoURL || 'https://placehold.co/40'" 
                    class="h-10 w-10 rounded-full object-cover" 
                    alt="Foto de perfil"
                  />
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ teacher.name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ teacher.specialties || 'Sin especialización' }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ getInstrumentName(teacher.instrumentId) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ teacher.email }}</div>
              <div class="text-sm text-gray-500">{{ teacher.phone || 'Sin teléfono' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ getTeacherClassCount(teacher.id) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="{
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                  'bg-green-100 text-green-800': teacher.status === 'active',
                  'bg-red-100 text-red-800': teacher.status === 'inactive',
                  'bg-yellow-100 text-yellow-800': teacher.status === 'pending'
                }"
              >
                {{ getStatusText(teacher.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end space-x-2">
                <button 
                  @click="viewTeacherSchedule(teacher.id)" 
                  class="text-indigo-600 hover:text-indigo-900"
                  title="Ver horario"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button 
                  @click="manageTeacherClasses(teacher)" 
                  class="text-green-600 hover:text-green-900"
                  title="Gestionar clases"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </button>
                <button 
                  @click="openTeacherForm(teacher)" 
                  class="text-blue-600 hover:text-blue-900"
                  title="Editar maestro"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  @click="confirmDeleteTeacher(teacher)" 
                  class="text-red-600 hover:text-red-900"
                  title="Eliminar maestro"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Modal para formulario de maestro -->
    <Dialog :open="showTeacherForm" @close="showTeacherForm = false" class="relative z-50">
      <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
          <div class="px-6 py-4 bg-blue-600">
            <h3 class="text-lg font-medium text-white">
              {{ currentTeacher ? 'Editar Maestro' : 'Nuevo Maestro' }}
            </h3>
          </div>
          <div class="p-6">
            <TeacherForm 
              :teacher="currentTeacher" 
              @save="saveTeacher" 
              @cancel="showTeacherForm = false" 
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
    
    <!-- Modal de confirmación para eliminar -->
    <ConfirmModal
      :show="showDeleteConfirm"
      title="Eliminar Maestro"
      message="¿Estás seguro de que deseas eliminar este maestro? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      @confirm="deleteTeacher"
      @cancel="showDeleteConfirm = false"
    />
    
    <!-- Modal para gestionar clases del maestro -->
    <Dialog :open="showClassesManager" @close="showClassesManager = false" class="relative z-50">
      <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
          <div class="p-6">
            <TeacherClassesManager 
              :teacherId="selectedTeacher?.id" 
              :teacherName="selectedTeacher?.name"
              @close="showClassesManager = false" 
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTeachersStore } from '../../store/teachers';
import { useClassesStore } from '../../../Classes/store/classes';
import { useInstrumentsStore } from '@/stores/instruments';
import { Dialog, DialogPanel } from '@headlessui/vue';
import TeacherForm from '../../components/TeacherForm.vue';
import TeacherClassesManager from '../../components/TeacherClassesManager.vue';
import ConfirmModal from '../../../../components/ConfirmModal.vue';
import { useToast } from '../../../../components/ui/toast/use-toast';

// Stores
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const instrumentsStore = useInstrumentsStore();
const router = useRouter();
const { toast } = useToast();

// Estado
const isLoading = ref(true);
const searchQuery = ref('');
const filterInstrument = ref('');
const showTeacherForm = ref(false);
const currentTeacher = ref(null);
const showDeleteConfirm = ref(false);
const teacherToDelete = ref(null);
const showClassesManager = ref(false);
const selectedTeacher = ref(null);

// Cargar datos
onMounted(async () => {
  try {
    await Promise.all([
      teachersStore.fetchTeachers(),
      classesStore.fetchClasses()
      // No es necesario fetchInstruments ya que los datos están hardcodeados en el store
    ]);
  } catch (error) {
    console.error('Error al cargar datos:', error);
    toast({
      title: 'Error',
      description: 'No se pudieron cargar los datos. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  } finally {
    isLoading.value = false;
  }
});

// Computed properties
const filteredTeachers = computed(() => {
  let result = teachersStore.teachers;
  
  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(teacher => 
      teacher.name.toLowerCase().includes(query) || 
      teacher.lastName.toLowerCase().includes(query) ||
      teacher.email.toLowerCase().includes(query)
    );
  }
  
  // Filtrar por instrumento
  if (filterInstrument.value) {
    result = result.filter(teacher => teacher.instrumentId === filterInstrument.value);
  }
  
  return result;
});

const instruments = computed(() => {
  return instrumentsStore.instruments;
});

// Métodos
const getInstrumentName = (instrumentId: string): string => {
const instrument = instruments.value.find((i: { id: string }) => i.id === instrumentId);
  return instrument ? instrument.name : 'No asignado';
};

const getTeacherClassCount = (teacherId: string): number => {



return classesStore.classes.filter((c) => c.teacherId && c.teacherId === teacherId).length;
};

const getStatusText = (status) => {
  switch (status) {
    case 'active': return 'Activo';
    case 'inactive': return 'Inactivo';
    case 'pending': return 'Pendiente';
    default: return 'Desconocido';
  }
};

const openTeacherForm = (teacher) => {
  currentTeacher.value = teacher;
  showTeacherForm.value = true;
};

const saveTeacher = async (teacherData) => {
  try {
    if (currentTeacher.value) {
      // Actualizar maestro existente
      await teachersStore.updateTeacher(currentTeacher.value.id, {
        ...teacherData
      });
      toast({
        title: 'Éxito',
        description: 'Maestro actualizado correctamente',
        variant: 'default'
      });
    } else {
      // Crear nuevo maestro
      await teachersStore.createTeacher(teacherData);
      toast({
        title: 'Éxito',
        description: 'Maestro creado correctamente',
        variant: 'default'
      });
    }
    showTeacherForm.value = false;
  } catch (error) {
    console.error('Error al guardar maestro:', error);
    toast({
      title: 'Error',
      description: 'No se pudo guardar el maestro. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  }
};

const confirmDeleteTeacher = (teacher) => {
  teacherToDelete.value = teacher;
  showDeleteConfirm.value = true;
};

const deleteTeacher = async () => {
  if (!teacherToDelete.value) return;
  
  try {
    await teachersStore.deleteTeacher(teacherToDelete.value.id);
    toast({
      title: 'Éxito',
      description: 'Maestro eliminado correctamente',
      variant: 'default'
    });
  } catch (error) {
    console.error('Error al eliminar maestro:', error);
    toast({
      title: 'Error',
      description: 'No se pudo eliminar el maestro. Por favor, intenta de nuevo.',
      variant: 'destructive'
    });
  } finally {
    showDeleteConfirm.value = false;
    teacherToDelete.value = null;
  }
};

const viewTeacherSchedule = (teacherId) => {
  router.push(`/teachers/${teacherId}/schedule`);
};

const manageTeacherClasses = (teacher) => {
  selectedTeacher.value = teacher;
  showClassesManager.value = true;

  // Asegurarse de que las clases estén cargadas
  if (classesStore.classes.length === 0) {
    classesStore.fetchClasses().catch(error => {
      console.error('Error al cargar clases:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las clases. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
    });
  }
};
</script>