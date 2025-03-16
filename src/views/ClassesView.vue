<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClassesStore } from '../stores/classes'
import { useTeachersStore } from '../stores/teachers'
import { useStudentsStore } from '../stores/students'
import { useInstrumentoStore } from '../stores/instrumento'

// Componentes
import Modal from '../components/Modal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ClassFilters from '../components/ClassFilters.vue'
import ClassCard from '../components/ClassCard.vue'
import ClassForm from '../components/ClassForm.vue'
import StudentManagement from '../components/StudentManagement.vue'
import StudentSelector from '../components/StudentSelector.vue'

// Iconos
import {
  PlusCircleIcon,
  UserGroupIcon,
  TrashIcon,
  BookOpenIcon
} from '@heroicons/vue/24/outline'

// Tipo de datos
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

// Computed Properties
const filteredGroups = computed(() => {
  let groups = classesStore.classes || []
  
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
  
  const group = classesStore.classes.find((g: Class) => g.id === selectedGroupId.value)
  // Asegurarse de que group y group.studentIds existen antes de usarlos
  return group && group.studentIds 
    ? studentsStore.students.filter((s) => group.studentIds.includes(s.id)) 
    : []
})

const availableStudents = computed(() => {
  if (!selectedGroupId.value) return []
  
  const group = classesStore.classes.find((g: Class) => g.id === selectedGroupId.value)
  // Asegurarse de que group y group.studentIds existen antes de usarlos
  return group && group.studentIds 
    ? studentsStore.students.filter((s) => !group.studentIds.includes(s.id)) 
    : studentsStore.students
})

// Event Handlers
const handleSubmit = async (formData: Partial<Class>) => {
  isLoading.value = true
  
  try {
    if (showEditModal.value && selectedGroupId.value) {
      await classesStore.updateClass({ 
        id: selectedGroupId.value, 
        ...formData, 
        name: formData.name || '', 
        teacherId: formData.teacherId || '', 
        studentIds: formData.studentIds || [],
        level: formData.level || 'Iniciación',
        instrument: formData.instrument || '',
        schedule: formData.schedule || { days: [], startTime: '', endTime: '' },
        description: formData.description || ''
      })
      successMessage.value = 'Cambios guardados exitosamente'
    } else {
      if (!formData.name) {
        errorMessage.value = 'El nombre del grupo es requerido'
        return
      }
      await classesStore.createClass(formData as Omit<Class, 'id'>)
      successMessage.value = 'Grupo creado exitosamente'
    }
    closeModal()
  } catch (error) {
    errorMessage.value = 'Error al guardar el grupo'
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

const handleEdit = (groupId: string) => {
  const group = classesStore.classes.find((g: Class) => g.id === groupId)
  if (!group) return
  
  selectedGroupId.value = groupId
  showEditModal.value = true
}

const handleDelete = (groupId: string) => {
  selectedGroupId.value = groupId
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!selectedGroupId.value) return
  
  try {
    isLoading.value = true
    await classesStore.deleteClass(selectedGroupId.value)
    successMessage.value = 'Grupo eliminado exitosamente'
    showDeleteModal.value = false
  } catch (error) {
    errorMessage.value = 'Error al eliminar el grupo'
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

const showStudentList = (groupId: string) => {
  selectedGroupId.value = groupId
  
  const group = classesStore.classes.find((g: Class) => g.id === groupId)
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
  
  // Evitar duplicados
  if (!selectedStudentIds.value.includes(studentId)) {
    selectedStudentIds.value.push(studentId)
  }
}

const addSelectedStudents = async () => {
  if (!selectedGroupId.value || selectedStudentIds.value.length === 0) return
  
  try {
    isLoading.value = true
    
    // Añadir cada estudiante al grupo
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

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  showAddStudentModal.value = false
  selectedGroupId.value = null
  selectedStudentIds.value = []
}

const clearMessages = () => {
  // Limpiar mensajes después de unos segundos
  if (successMessage.value) {
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
  
  if (errorMessage.value) {
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// Cargamos la data inicial
onMounted(async () => {
  isLoading.value = true
  
  try {
    await Promise.all([
      classesStore.fetchClasses(),
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

// Observamos los mensajes para limpiarlos automáticamente
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

      <!-- Header y botón de nuevo grupo -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Grupos y Clases</h1>
        <button 
          @click="$router.push('/contents')" 
          class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
          :disabled="isLoading"
        >
          <BookOpenIcon class="w-5 h-5" />
          <span>Ir a Contenidos</span>
        </button>
        <button 
          @click="showAddModal = true" 
          class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
          :disabled="isLoading"
        >
          <PlusCircleIcon class="w-5 h-5" />
          <span>Nuevo Grupo</span>
        </button>
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
        <ClassCard
          v-for="group in filteredGroups"
          :key="group.id"
          :class-data="group"
          :student-count="group.studentIds ? group.studentIds.length : 0"
          :top-students="studentsStore.students
            .filter(s => group.studentIds?.includes(s.id))
            .slice(0, 3)"
          @edit="handleEdit"
          @delete="handleDelete"
          @manage-students="showStudentList"
        />
      </div>

      <!-- Estado vacío -->
      <div v-else class="text-center py-12">
        <div class="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500 mb-4">
          <UserGroupIcon class="h-full w-full" />
        </div>
        <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No hay grupos</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredGroups.length === 0 && Object.values(filters).some(f => f) ? 
            'No se encontraron grupos con los filtros seleccionados.' : 
            'Aún no hay grupos creados.' 
          }}
        </p>
        <div class="mt-6">
          <button
            @click="showAddModal = true"
            class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 mx-auto"
          >
            <PlusCircleIcon class="h-5 w-5" />
            <span>Crear nuevo grupo</span>
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
        :initial-data="selectedGroupId ? 
          classesStore.classes.find(g => g.id === selectedGroupId) : 
          undefined"
        :is-loading="isLoading"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
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
      />
    </Modal>

    <!-- Modal de Confirmación para Eliminar -->
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

<style>
</style>