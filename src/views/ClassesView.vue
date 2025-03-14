<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useClassesStore } from '../stores/classes'
import { useTeachersStore } from '../stores/teachers'
import { useInstrumentoStore } from '../stores/instrumento'
import { useStudentsStore } from '../stores/students'
import Modal from '../components/Modal.vue'
import { default as ConfirmModal } from '../components/ConfirmModal.vue'
import type { Class } from '../types/class'
import {
  PlusCircleIcon,
  UserIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// Store instances
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const instrumentoStore = useInstrumentoStore()
const studentsStore = useStudentsStore()

// UI State
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showStudentsModal = ref(false)
const showAddStudentModal = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const selectedGroupId = ref<string | null>(null)
const selectedGroupName = ref('')
const selectedStudent = ref<string | null>(null)
const searchQuery = ref('')
const selectedStudentIds = ref<string[]>([])

// Filters
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

// Form Errors
interface FormErrors {
  name?: string
  teacherId?: string
  level?: string
  instrument?: string
  schedule?: string
}

const formErrors = ref<FormErrors>({})

// Constants
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const levelOptions = ['Iniciación', 'Básico', 'Intermedio', 'Avanzado']

// Form Data
const form = ref<Omit<Class, 'id'>>({
  name: '',
  teacherId: '',
  studentIds: [],
  level: '',
  instrument: '',
  schedule: {
    days: [],
    startTime: '',
    endTime: ''
  },
  description: ''
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

const instrumentsByFamily = computed(() => instrumentoStore.instrumentsByFamily)

const selectedGroupStudents = computed(() => {
  if (!selectedGroupId.value) return []
  const group = classesStore.classes.find((g: Class) => g.id === selectedGroupId.value)
  return group ? studentsStore.students.filter((s) => group.studentIds.includes(s.id)) : []
})

const availableStudents = computed(() => {
  if (!selectedGroupId.value) return []
  const group = classesStore.classes.find((g: Class) => g.id === selectedGroupId.value)
  return group ? studentsStore.students.filter((s) => !group.studentIds.includes(s.id)) : []
})

const filteredStudents = computed(() => {
  if (!searchQuery.value) return []
  return availableStudents.value.filter((student) => {
    const query = searchQuery.value.toLowerCase()
    return student.nombre.toLowerCase().includes(query) || student.apellido.toLowerCase().includes(query)
  })
})

const selectedGroupStudentsCount = computed(() => {
  if (!selectedGroupId.value) return 0
  const group = classesStore.classes.find((g: Class) => g.id === selectedGroupId.value)
  return group ? group.studentIds.length : 0
})

const selectedGroupTeacher = computed(() => {
  if (!selectedGroupId.value) return null
  const group = classesStore.classes.find((g: Class) => g.id === selectedGroupId.value)
  return group ? teachersStore.teachers.find((t) => t.id === group.teacherId) : null
})

const selectedStudents = computed(() => {
  return studentsStore.students.filter(student => selectedStudentIds.value.includes(student.id))
})

// Helper Functions
const getTeacherName = (teacherId: string): string => {
  const teacher = teachersStore.teachers.find((t) => t.id === teacherId) as unknown as { id: string, name: string }
  return teacher ? `${teacher.name}` : 'Profesor no asignado'
}

const formatSchedule = (schedule: { days: string[], startTime: string, endTime: string }): string => {
  if (!schedule?.days?.length || !schedule.startTime || !schedule.endTime) {
    return 'Horario no definido'
  }
  return `${schedule.days.join(', ')} de ${schedule.startTime} a ${schedule.endTime}`
}

// Event Handlers
const handleSubmit = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    if (showEditModal.value) {
      await classesStore.updateClass(selectedGroupId.value, form.value);
      successMessage.value = 'Cambios guardados exitosamente';
    } else {
      await classesStore.createClass(form.value);
      successMessage.value = 'Grupo creado exitosamente';
    }
    closeModal();
  } catch (error) {
    errorMessage.value = 'Error al guardar el grupo';
    console.error('Error:', error);
  } finally {
    isLoading.value = false;
  }
}

const validateForm = (): boolean => {
  formErrors.value = {}
  let isValid = true

  if (!form.value.name?.trim()) {
    formErrors.value.name = 'El nombre es requerido'
    isValid = false
  }

  if (!form.value.teacherId) {
    formErrors.value.teacherId = 'El profesor es requerido'
    isValid = false
  }

  if (!form.value.level) {
    formErrors.value.level = 'El nivel es requerido'
    isValid = false
  }

  if (!form.value.instrument) {
    formErrors.value.instrument = 'El instrumento es requerido'
    isValid = false
  }

  if (!form.value.schedule.days.length || !form.value.schedule.startTime || !form.value.schedule.endTime) {
    formErrors.value.schedule = 'El horario completo es requerido'
    isValid = false
  }

  return isValid
}

const handleEdit = (groupId: string) => {
  const group = classesStore.classes.find((g : Class) => g.id === groupId)
  if (!group) return

  selectedGroupId.value = groupId
  form.value = { ...group }
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
  const group = classesStore.classes.find((g : Class) => g.id === groupId)
  if (group) {
    selectedGroupName.value = group.name
  }
  showStudentsModal.value = true
}

const addStudentToGroup = async (studentId: string) => {
  if (!selectedGroupId.value) {
    console.error('No hay clase seleccionada');
    return;
  }

  const classFound = classesStore.classes.find(g => g.id === selectedGroupId.value);
  if (!classFound) {
    console.error('Clase no encontrada');
    return;
  }

  try {
    await classesStore.addStudentToClass(selectedGroupId.value, studentId);
    // Actualizar la lista de estudiantes después de agregar
    selectedStudentIds.value.push(studentId);
  } catch (error) {
    console.error('Error al agregar estudiante a la clase:', error);
  }
};

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
  selectedStudentIds.value.push(studentId)
}

const addSelectedStudents = () => {
  if (selectedGroupId.value) {
    const group = classesStore.classes.find((g  : Class) => g.id === selectedGroupId.value)
    if (group) {
      classesStore.updateClassStudents(selectedGroupId.value, [...group.studentIds, ...selectedStudentIds.value])
      addStudentToGroup(selectedStudent.value as string)
      closeModal()

    }
  }
}

const closeModal = () => {
  showAddModal.value = false
  showAddStudentModal.value = false
  showEditModal.value = false
  selectedGroupId.value = null
  form.value = {
    name: '',
    teacherId: '',
    studentIds: [],
    level: '',
    instrument: '',
    schedule: {
      days: [],
      startTime: '',
      endTime: ''
    },
    description: ''
  }
  formErrors.value = {}
  selectedStudentIds.value = []
}
onMounted(async () => {
  await classesStore.fetchClasses(); // Cargar las clases al abrir el módulo
  await teachersStore.fetchTeachers(); // Cargar los profesores al abrir el módulo
  if (selectedGroupId.value) {
    const group = classesStore.classes.find(g => g.id === selectedGroupId.value);
    if (group) {
      selectedStudentIds.value = group.studentIds; // Cargar estudiantes de la clase
      selectedGroupName.value = group.name;
      // Cargar la lista de estudiantes registrados en la clase
      availableStudents.value = studentsStore.students.filter(s => !selectedStudentIds.value.includes(s.id));
    }
  }
})

</script>

<template>
  <div class="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-900">
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
          @click="showAddModal = true" 
          class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :disabled="isLoading"
        >
          <PlusCircleIcon class="w-5 h-5" />
          Nuevo Grupo
        </button>
      </div>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Filtros</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Filtro de Instrumento -->
          <div class="flex flex-col">
            <label class="block text-sm font-medium text-gray-700 mb-1">Instrumento</label>
            <div class="relative">
              <select
                v-model="filters.instrument"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                :disabled="isLoading"
              >
                <option value="">Todos los instrumentos</option>
                <template v-for="(instruments, family) in instrumentsByFamily" :key="family">
                  <optgroup :label="family.charAt(0).toUpperCase() + family.slice(1)">
                    <option 
                      v-for="instrument in instruments" 
                      :key="instrument"
                      :value="instrument"
                    >
                      {{ instrument }}
                    </option>
                  </optgroup>
                </template>
              </select>
            </div>
          </div>

          <!-- Filtro de Nivel -->
          <div class="flex flex-col">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
            <select
              v-model="filters.level"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              :disabled="isLoading"
            >
              <option value="">Todos los niveles</option>
              <option v-for="level in levelOptions" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
          </div>

          <!-- Filtro de Profesor -->
          <div class="flex flex-col">
            <label class="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
            <select
              v-model="filters.teacherId"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              :disabled="isLoading"
            >
              <option value="">Todos los profesores</option>
              <option v-for="teacher in teachersStore.teachers" :key="teacher.id" :value="teacher.id">
                {{ teacher.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Estado de carga -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>

      <!-- Lista de Grupos -->
      <div v-else-if="filteredGroups.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="group in filteredGroups"
          :key="group.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700"
        >
          <div class="p-5">
            <!-- Cabecera del grupo -->
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ group.name }}</h3>
              <div class="flex space-x-2">
                <button
                  @click="handleEdit(group.id)"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  title="Editar grupo"
                >
                  <PencilIcon class="w-5 h-5" />
                </button>
                <button
                  @click="handleDelete(group.id)"
                  class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                  title="Eliminar grupo"
                >
                  <TrashIcon class="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <!-- Detalles del grupo -->
            <div class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div class="flex items-center">
                <UserIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span>{{ getTeacherName(group.teacherId) }}</span>
              </div>
              <div class="flex items-center">
                <AcademicCapIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span>{{ group.level }}</span>
              </div>
              <div class="flex items-center">
                <MusicalNoteIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span>{{ group.instrument }}</span>
              </div>
              
              <!-- Lista de estudiantes -->
              <div>
                <div class="flex items-center mb-2">
                  <UserGroupIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span>{{ selectedGroupStudentsCount }}</span>
                </div>
                
                <div v-if="selectedGroupStudents.length > 0" class="flex flex-wrap gap-1 mt-1 mb-2">
                  <div 
                    v-for="student in selectedGroupStudents.slice(0, 3)" 
                    :key="student.id"
                    class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                  >
                    {{ student.nombre }} {{ student.apellido }}
                  </div>
                  <div 
                    v-if="selectedGroupStudents.length > 3"
                    class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs"
                  >
                    +{{ selectedGroupStudents.length - 3 }} más
                  </div>
                </div>
              </div>
              
              <div class="flex items-center">
                <ClockIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span>{{ formatSchedule(group.schedule) }}</span>
              </div>
            </div>

            <!-- Botón de gestión de estudiantes -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                @click="showStudentList(group.id)"
                class="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <UserGroupIcon class="w-4 h-4" />
                Gestionar Estudiantes
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="text-center py-12">
        <div class="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500 mb-4">
          <UserGroupIcon class="h-full w-full" />
        </div>
        <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No hay grupos</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredGroups.length === 0 ? 'No se encontraron grupos con los filtros seleccionados.' : 'Aún no hay grupos creados.' }}
        </p>
        <div class="mt-6">
          <button
            @click="showAddModal = true"
            class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusCircleIcon class="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Crear nuevo grupo
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
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Campo: Nombre del Grupo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo</label>
          <input
            v-model="form.name"
            type="text"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            :class="{ 'border-red-500': formErrors.name }"
            placeholder="Nombre del grupo"
          />
          <p v-if="formErrors.name" class="mt-1 text-sm text-red-600">{{ formErrors.name }}</p>
        </div>

        <!-- Campo: Profesor -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
          <select
            v-model="form.teacherId"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            :class="{ 'border-red-500': formErrors.teacherId }"
          >
            <option value="">Seleccionar profesor</option>
            <option v-for="teacher in teachersStore.teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }}
            </option>
          </select>
          <p v-if="formErrors.teacherId" class="mt-1 text-sm text-red-600">{{ formErrors.teacherId }}</p>
        </div>

        <!-- Campo: Nivel -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
          <select
            v-model="form.level"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            :class="{ 'border-red-500': formErrors.level }"
          >
            <option value="">Seleccionar nivel</option>
            <option v-for="level in levelOptions" :key="level" :value="level">
              {{ level }}
            </option>
          </select>
          <p v-if="formErrors.level" class="mt-1 text-sm text-red-600">{{ formErrors.level }}</p>
        </div>

        <!-- Campo: Instrumento -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Instrumento</label>
          <select
            v-model="form.instrument"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            :class="{ 'border-red-500': formErrors.instrument }"
          >
            <option value="">Seleccionar instrumento</option>
            <template v-for="(instruments, family) in instrumentsByFamily" :key="family">
              <optgroup :label="family">
                <option 
                  v-for="instrument in instruments" 
                  :key="instrument"
                  :value="instrument"
                >
                  {{ instrument }}
                </option>
              </optgroup>
            </template>
          </select>
          <p v-if="formErrors.instrument" class="mt-1 text-sm text-red-600">{{ formErrors.instrument }}</p>
        </div>

        <!-- Campo: Horario -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Horario</label>
          <div class="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Días</label>
              <select
                v-model="form.schedule.days"
                multiple
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                :class="{ 'border-red-500': formErrors.schedule }"
              >
                <option v-for="day in weekDays" :key="day" :value="day">
                  {{ day }}
                </option>
              </select>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mantén presionado Ctrl para seleccionar múltiples días
              </p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hora inicio</label>
                <input
                  v-model="form.schedule.startTime"
                  type="time"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  :class="{ 'border-red-500': formErrors.schedule }"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hora fin</label>
                <input
                  v-model="form.schedule.endTime"
                  type="time"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  :class="{ 'border-red-500': formErrors.schedule }"
                />
              </div>
            </div>
          </div>
          <p v-if="formErrors.schedule" class="mt-1 text-sm text-red-600">{{ formErrors.schedule }}</p>
        </div>
        
        <!-- Campo: Descripción -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
          <textarea
            v-model="form.description"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="3"
            placeholder="Descripción o notas sobre este grupo"
          ></textarea>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            class="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            :disabled="isLoading"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="flex items-center">
              <span class="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
              Guardando...
            </span>
            <span v-else>
              {{ showEditModal ? 'Guardar Cambios' : 'Crear Grupo' }}
            </span>
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal de Gestión de Estudiantes -->
    <Modal
      :show="showStudentsModal"
      title="Estudiantes del Grupo"
      @close="showStudentsModal = false"
    >
      <div class="space-y-4">
        <!-- Cabecera del grupo -->
        <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-800 p-3 rounded-lg mb-4">
          <h3 class="font-medium">{{ selectedGroupName }}</h3>
          <p class="text-sm">Gestión de estudiantes</p>
        </div>
        
        <!-- Lista de estudiantes -->
        <div v-if="selectedGroupStudents.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <UserGroupIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-blue-800 mb-2" />
          <p>No hay estudiantes en este grupo</p>
        </div>
        
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
          <div
            v-for="student in selectedGroupStudents"
            :key="student.id"
            class="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-800 dark:text-blue-200">
                {{ student.nombre.charAt(0) }}{{ student.apellido.charAt(0) }}
              </div>
              <div>
                <p class="font-medium text-gray-800 dark:text-gray-200">
                  {{ student.nombre }} {{ student.apellido }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ student.instrumento }}
                </p>
              </div>
            </div>
            <button
              @click="removeStudentFromGroup(student.id)"
              class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Eliminar del grupo"
              :disabled="isLoading"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Botón para agregar estudiantes -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="showAddStudentModal = true"
            class="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
            :disabled="isLoading"
          >
            <PlusCircleIcon class="w-5 h-5" />
            Agregar Estudiante
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal para Agregar Estudiante al Grupo -->
    <Modal
      :show="showAddStudentModal"
      title="Agregar Estudiante al Grupo"
      @close="showAddStudentModal = false"
    >
      <div class="space-y-4">
        <!-- Información del grupo -->
        <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-800 p-3 rounded-lg mb-2 text-sm">
          Grupo: <span class="font-medium">{{ selectedGroupName }}</span>
        </div>
        
        <!-- Selector de estudiante -->
        <div class="flex flex-col relative">
          <label class="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
          <input
            type="text"
            v-model="searchQuery"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Buscar estudiante por nombre o apellido"
          />
          <ul v-if="selectedStudents.length > 0" class="mt-2">
            <li v-for="student in selectedStudents" :key="student.id" class="text-sm">{{ student.nombre }} {{ student.apellido }}</li>
          </ul>
          <ul v-if="searchQuery" class="absolute z-10 mt-12 w-full bg-white border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
            <li
              v-for="student in filteredStudents"
              :key="student.id"
              class="py-2 px-4 hover:bg-gray-50 cursor-pointer"
              @click="selectStudent(student.id)"
            >
              {{ student.nombre }} {{ student.apellido }} - {{ student.instrumento }}
            </li>
            <li v-if="filteredStudents.length === 0" class="py-2 px-4 text-gray-500">No se encontraron estudiantes</li>
          </ul>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center rounded-md border border-transparent bg-gray-200 text-gray-700 font-semibold py-2 px-4 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            @click="showAddStudentModal = false"
            :disabled="isLoading"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="addSelectedStudents"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 text-white font-semibold py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :disabled="isLoading"
          >
            Agregar Alumnos
          </button>
        </div>
      </div>
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