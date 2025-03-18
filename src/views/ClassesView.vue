<!-- views/ClassesView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClassesStore } from '../stores/classes'
import { useTeachersStore } from '../stores/teachers'
import { useStudentsStore } from '../stores/students'
import { useInstrumentoStore } from '../stores/instrumento'
import Modal from '../components/Modal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ClassFilters from '../components/ClassFilters.vue'
import ClassCard from '../components/ClassCard.vue'
import ClassForm from '../components/ClassForm.vue'
import StudentManagement from '../components/StudentManagement.vue'
import StudentSelector from '../components/StudentSelector.vue'
import { PlusCircleIcon, InformationCircleIcon, UserGroupIcon, TrashIcon, BookOpenIcon } from '@heroicons/vue/24/outline'
import type { Class } from '../types/class'
// Stores
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()
const instrumentoStore = useInstrumentoStore()

// Estado de UI
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showStudentsModal = ref(false)
const showAddStudentModal = ref(false)
const showInfoModal = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Estado de selección
const selectedGroupId = ref<string | null>(null)
const selectedGroupName = ref('')
const selectedStudent = ref<string | null>(null)
const searchQuery = ref('')
const selectedStudentIds = ref<string[]>([])

// Constantes
const levelOptions = ['Iniciación', 'Básico', 'Intermedio', 'Avanzado']

// Filtros
interface Filters {
  instrument: string
  level: string
  teacherId: string
}
const filters = ref<Filters>({
  instrument: '',
  level: '',
  teacherId: ''
})

// Agregar un estado para rastrear si se han consultado las clases
const classesLoaded = ref(false)

// Función para obtener la cantidad de estudiantes en una clase por su nombre
const getStudentCount = (className: string) => {
  return classesStore.getStudentCountByClassName(className)
}

// Función para obtener detalles de los estudiantes por clase
const getStudentsDetailsByClass = (className: string) => {
  const classItem = classesStore.classes.find(c => c.name === className);
  if (!classItem || !classItem.studentIds) return [];
  
  return studentsStore.students.filter(student => 
    classItem.studentIds.includes(student.id)
  );
}

// Nueva función para obtener estudiantes por clase
const getStudentsDetailsByClassName = (className: string) => {
  // Obtener IDs de estudiantes de la clase
  const studentIds = classesStore.getStudentIdsByClass(className);
  
  // Usar estas IDs para filtrar el array de estudiantes y obtener todos sus detalles
  return studentsStore.students.filter(student => 
    studentIds.includes(student.id)
  );
};

// Función de demostración para usar en el componente
const handleClassSelection = (className: string) => {
  const studentsByClass = classesStore.getStudentToClass(className);
  console.log(`IDs de estudiantes en la clase ${className}:`, studentsByClass);
  
  // Obtener detalles completos de los estudiantes
  const studentsDetails = getStudentsDetailsByClassName(className);
  console.log(`Detalles de estudiantes en la clase ${className}:`, studentsDetails);
  
  // Aquí puedes hacer lo que necesites con estos datos
  // Por ejemplo, actualizar alguna referencia reactiva
  selectedStudents.value = studentsDetails;
};

// Computed Properties
const filteredGroups = computed(() => {
  let groups = classesStore.classes || []

  console.log('Clases disponibles:', groups.length)
  
  if (filters.value.instrument) {
    groups = groups.filter((g: Class) => g.instrument === filters.value.instrument)
  }
  
  if (filters.value.level) {
    groups = groups.filter((g: Class) => g.level === filters.value.level)
  }
  
  if (filters.value.teacherId) {
    groups = groups.filter((g: Class) => g.teacherId === filters.value.teacherId)
  }
  
  return groups
})

const selectedGroupStudents = computed(() => {
  if (!selectedGroupId.value) return []
  
  const group = classesStore.classes.find((g: Class) => String(g.id) === String(selectedGroupId.value))
  return group && group.studentIds 
    ? studentsStore.students.filter((s) => group.studentIds.includes(s.id))
    : []
})

const availableStudents = computed(() => {
  if (!selectedGroupId.value) return []
  
  const group = classesStore.classes.find((g: Class) => String(g.id) === String(selectedGroupId.value))
  return group && group.studentIds 
    ? studentsStore.students.filter((s) => !group.studentIds.includes(s.id))
    : studentsStore.students
})

// Event Handlers
const handleSubmit = async (formData: Partial<Class>) => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    if (showEditModal.value && selectedGroupId.value) {
      console.log('🔍 Preparando actualización para clase:', selectedGroupId.value);
      
      // Preparar datos completos para la actualización
      const completeData = {
        ...formData,
        id: selectedGroupId.value,
        name: formData.name || '',
        teacherId: formData.teacherId || '',
        studentIds: Array.isArray(formData.studentIds) ? formData.studentIds : [],
        level: formData.level || 'Iniciación',
        instrument: formData.instrument || '',
        schedule: formData.schedule || { days: [], startTime: '', endTime: '' },
        description: formData.description || '',
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contentIds: formData.contentIds || []
      } as Class;
      
      console.log('📝 Datos completos para actualización:', completeData);
      await classesStore.updateClass(completeData);
      successMessage.value = 'Cambios guardados exitosamente';
    } else {
      if (!formData.name) {
        errorMessage.value = 'El nombre del grupo es requerido';
        return;
      }
      
      console.log('🔍 Preparando creación de nueva clase');
      const newClassData = {
        ...formData,
        name: formData.name,
        teacherId: formData.teacherId || '',
        studentIds: Array.isArray(formData.studentIds) ? formData.studentIds : [],
        level: formData.level || 'Iniciación',
        instrument: formData.instrument || '',
        schedule: formData.schedule || { days: [], startTime: '', endTime: '' },
        description: formData.description || '',
      };
      
      await classesStore.createClass(newClassData as Class);
      successMessage.value = 'Grupo creado exitosamente';
    }
    
    closeModal();
  } catch (error) {
    console.error('❌ Error en handleSubmit:', error);
    errorMessage.value = 'Error al guardar los cambios. Verificar consola para detalles.';
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (groupId: string) => {
  const group = classesStore.classes.find((g: Class) => String(g.id) === String(groupId))
  if (!group) return
  selectedGroupId.value = groupId
  showEditModal.value = true
}

const handleDelete = (groupId: string) => {
  selectedGroupId.value = groupId
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!selectedGroupId.value) return;
  
  try {
    isLoading.value = true;
    console.log('🗑️ Eliminando grupo con ID:', selectedGroupId.value);
    
    // Usar el ID correcto del grupo seleccionado
    await classesStore.deleteClass(selectedGroupId.value);
    
    successMessage.value = 'Grupo eliminado exitosamente';
    showDeleteModal.value = false;
  } catch (error) {
    errorMessage.value = 'Error al eliminar el grupo';
    console.error('❌ Error en confirmDelete:', error);
  } finally {
    isLoading.value = false;
  }
};

const showStudentList = (groupId: string) => {
  selectedGroupId.value = groupId
  const group = classesStore.classes.find((g: Class) => String(g.id) === String(groupId))
  if (group) {
    selectedGroupName.value = group.name || 'Grupo sin nombre'
  }
  showStudentsModal.value = true
}

const removeStudentFromGroup = async (studentId: string) => {
  if (!selectedGroupId.value) return
  try {
    isLoading.value = true
    await classesStore.removeStudentFromClass(selectedGroupId.value, studentId)
    successMessage.value = 'Estudiante removido exitosamente'
  } catch (error) {
    errorMessage.value = 'Error al remover el estudiante'
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

const selectStudent = (studentId: string) => {
  selectedStudent.value = studentId
  searchQuery.value = ''
  if (!selectedStudentIds.value.includes(studentId)) {
    selectedStudentIds.value.push(studentId)
  }
}

const addSelectedStudents = async () => {
  if (!selectedGroupId.value || selectedStudentIds.value.length === 0) return
  try {
    isLoading.value = true
    for (const studentId of selectedStudentIds.value) {
      await classesStore.addStudentToClass(selectedGroupId.value, studentId)
    }
    successMessage.value = 'Estudiantes agregados exitosamente'
    showAddStudentModal.value = false
    selectedStudentIds.value = []
  } catch (error) {
    errorMessage.value = 'Error al agregar estudiantes'
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

const showAddStudentForm = () => {
  selectedStudentIds.value = []
  showAddStudentModal.value = true
}

const openInfoModal = () => {
  showInfoModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  showAddStudentModal.value = false
  showInfoModal.value = false
  selectedGroupId.value = null
  selectedStudentIds.value = []
}

const clearMessages = () => {
  if (successMessage.value) {
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
  if (errorMessage.value) {
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

const removeSelectedStudent = (studentId: string) => {
  selectedStudentIds.value = selectedStudentIds.value.filter(id => id !== studentId)
}

// Cargar la data inicial
onMounted(async () => {
  isLoading.value = true
  try {
    // Cargar clases primero para asegurar que estén disponibles
    let clases = await classesStore.fetchClasses()
    console.log(`Se encontraron ${clases.length} clases en Firestore`)
    classesLoaded.value = true
    
    // Luego cargar los datos complementarios en paralelo
    await Promise.all([
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents(),
      instrumentoStore.fetchInstrumentos()
    ])
  } catch (error) {
    errorMessage.value = 'Error al cargar los datos'
    console.error('Error al cargar los datos:', error)
  } finally {
    isLoading.value = false
  }
})

// Recarga de clases cuando sea necesario (opcional)
const reloadClasses = async () => {
  try {
    isLoading.value = true
    await classesStore.fetchClasses()
    console.log(`Clases actualizadas: ${classesStore.classes.length} clases cargadas`)
    successMessage.value = 'Clases actualizadas'
  } catch (error) {
    errorMessage.value = 'Error al actualizar las clases'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// Observar mensajes para limpiarlos automáticamente
watch([successMessage, errorMessage], clearMessages)
</script>
<template>
  <div class="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <div class="max-w-7xl mx-auto">
      <!-- Mensajes de estado -->
      <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
        <p class="flex items-center">
          <span class="mr-2">⚠️</span>
          {{ errorMessage }}
        </p>
      </div>
      <div v-if="successMessage" class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
        <p class="flex items-center">
          <span class="mr-2">✅</span>
          {{ successMessage }}
        </p>
      </div>

      <!-- Header y botones -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Grupos y Clases</h1>
        <div class="flex flex-row sm:flex-row gap-2">
          <button 
            @click="openInfoModal" 
            class="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center gap-2"
            :disabled="isLoading"
          >
            <InformationCircleIcon class="w-5 h-5" />
            <span>Información</span>
          </button>
          <button 
            @click="$router.push('/contents')" 
            class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            :disabled="isLoading"
          >
            <BookOpenIcon class="w-5 h-5" />
            <span>Contenidos</span>
          </button>
          <button 
            @click="showAddModal = true" 
            class="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
            :disabled="isLoading"
          >
            <UserGroupIcon class="w-5 h-5" />
            <span>Nuevo Grupo</span>
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <ClassFilters 
        :initial-filters="filters"
        :level-options="levelOptions"
        @update:filters="filters = $event"
      />

      <!-- Estado de carga -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>

      <!-- Lista de Grupos -->
      <div v-else-if="filteredGroups.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-if="filteredGroups.length > 0" class="col-span-full mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-200">
            Se encontraron {{ filteredGroups.length }} grupos en la colección CLASES.
          </p>
        </div>
        
        <ClassCard
          v-for="group in filteredGroups"
          :key="group.id"
          :class-data="group"
          :student-count="group.studentIds ? group.studentIds.length : 0"
          :top-students="studentsStore.students.filter(s => group.studentIds?.includes(s.id)).slice(0, 3)"
          @edit="handleEdit"
          @delete="handleDelete"
          @manage-students="showStudentList"
        />
      </div>

      <!-- Estado vacío -->
      <div v-else-if="classesLoaded && filteredGroups.length === 0" class="text-center py-12">
        <div class="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500 mb-4">
          <UserGroupIcon class="h-full w-full" />
        </div>
        <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No hay grupos</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredGroups.length === 0 && Object.values(filters).some(f => f) ? 
            'No se encontraron grupos con los filtros seleccionados.' : 
            'Aún no hay grupos creados en la colección CLASES.' 
          }}
        </p>
        <div class="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            @click="showAddModal = true"
            class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <PlusCircleIcon class="h-5 w-5" />
            <span>Crear nuevo grupo</span>
          </button>
          <button
            @click="reloadClasses"
            class="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            <span>Actualizar clases</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Agregar/Editar Grupo -->
    <Modal
      :show="showAddModal || showEditModal"
      :title="showEditModal ? 'Editar Grupo' : 'Nuevo Grupo'"
      @close="closeModal"
    >
      <ClassForm
        :initial-data="selectedGroupId ? classesStore.classes.find(g => String(g.id) === String(selectedGroupId)) : undefined"
        :is-loading="isLoading"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </Modal>
    
    <!-- Modal de información -->
    <Modal
      :show="showInfoModal"
      title="Información de Clases"
      @close="showInfoModal = false"
    >
      <div class="text-gray-700 dark:text-gray-300">
        <p>
          Aquí puedes gestionar todas las clases y grupos de tu academia de música. 
          Crea nuevos grupos, asigna estudiantes y profesores, y mantén un seguimiento 
          de todas las actividades académicas.
        </p>
      </div>
      <template #footer>
        <button @click="showInfoModal = false" class="btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Cerrar
        </button>
      </template>
    </Modal>

    <!-- Modal de Gestión de Estudiantes -->
    <Modal
      :show="showStudentsModal"
      title="Estudiantes del Grupo"
      @close="showStudentsModal = false"
    >
      <StudentManagement
        :group-name="selectedGroupName"
        :students="selectedGroupStudents"
        :is-loading="isLoading"
        @remove-student="removeStudentFromGroup"
        @add-student="showAddStudentForm"
      />
    </Modal>

    <!-- Modal para Agregar Estudiante al Grupo -->
    <Modal
      :show="showAddStudentModal"
      title="Agregar Estudiante al Grupo"
      @close="showAddStudentModal = false"
    >
      <StudentSelector
        :available-students="availableStudents"
        :selected-student-ids="selectedStudentIds"
        :is-loading="isLoading"
        :group-name="selectedGroupName"
        @select-student="selectStudent"
        @add-selected="addSelectedStudents"
        @cancel="showAddStudentModal = false"
        @remove-student="removeSelectedStudent"
      />
    </Modal>

    <!-- Modal de Confirmación para Eliminar Grupo -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar Grupo"
      message="¿Estás seguro de que deseas eliminar este grupo? Esta acción eliminará el grupo y lo quitará de todos los estudiantes asignados. Esta acción no se puede deshacer."
      :loading="isLoading"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    >
      <template #icon>
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <TrashIcon class="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
      </template>
    </ConfirmModal>
  </div>
</template>
