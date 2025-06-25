<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
        </svg>
        Gestión de Estudiantes
      </h3>
      <div class="flex space-x-2">
        <button
          @click="showFilters = !showFilters"
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
        >
          Filtros
        </button>
        <button
          @click="refreshData"
          class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md transition-colors"
        >
          Actualizar
        </button>
        <button
          @click="showCreateModal = true"
          class="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          + Nuevo
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div v-if="showFilters" class="bg-gray-50 p-4 rounded-lg mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select v-model="filters.status" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="suspended">Suspendidos</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Instrumento</label>
          <select v-model="filters.instrument" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="piano">Piano</option>
            <option value="violin">Violín</option>
            <option value="guitar">Guitarra</option>
            <option value="drums">Batería</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Nombre o email..."
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
        </div>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-blue-900">Total</p>
            <p class="text-2xl font-semibold text-blue-600">{{ stats.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-green-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-900">Activos</p>
            <p class="text-2xl font-semibold text-green-600">{{ stats.active }}</p>
          </div>
        </div>
      </div>

      <div class="bg-yellow-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-yellow-900">En Riesgo</p>
            <p class="text-2xl font-semibold text-yellow-600">{{ stats.atRisk }}</p>
          </div>
        </div>
      </div>

      <div class="bg-red-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-900">Inactivos</p>
            <p class="text-2xl font-semibold text-red-600">{{ stats.inactive }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de estudiantes -->
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estudiante
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instrumento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clases/Mes
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último acceso
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <img 
                      class="h-10 w-10 rounded-full object-cover" 
                      :src="student.avatar || '/default-avatar.png'" 
                      :alt="student.name"
                    >
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ student.name }}</div>
                    <div class="text-sm text-gray-500">{{ student.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {{ student.instrument }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(student.status)"
                >
                  {{ getStatusLabel(student.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ student.classesPerMonth }}/{{ student.maxClasses }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(student.lastAccess) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="viewStudent(student)"
                    class="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    Ver
                  </button>
                  <button
                    @click="editStudent(student)"
                    class="text-green-600 hover:text-green-900 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    @click="deleteStudent(student)"
                    class="text-red-600 hover:text-red-900 transition-colors"
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
        Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a {{ Math.min(currentPage * itemsPerPage, totalStudents) }} de {{ totalStudents }} estudiantes
      </div>
      <div class="flex space-x-2">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>
        <button
          @click="currentPage++"
          :disabled="currentPage >= totalPages"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Student {
  id: string
  name: string
  email: string
  instrument: string
  status: 'active' | 'inactive' | 'suspended'
  classesPerMonth: number
  maxClasses: number
  lastAccess: Date
  avatar?: string
}

const emit = defineEmits<{
  createStudent: []
  viewStudent: [student: Student]
  editStudent: [student: Student]
  deleteStudent: [student: Student]
  refreshData: []
}>()

// State
const showFilters = ref(false)
const showCreateModal = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)

const students = ref<Student[]>([])
const filters = ref({
  status: '',
  instrument: '',
  search: ''
})

// Computed
const filteredStudents = computed(() => {
  let filtered = students.value

  if (filters.value.status) {
    filtered = filtered.filter(s => s.status === filters.value.status)
  }

  if (filters.value.instrument) {
    filtered = filtered.filter(s => s.instrument === filters.value.instrument)
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(search) || 
      s.email.toLowerCase().includes(search)
    )
  }

  return filtered.slice(
    (currentPage.value - 1) * itemsPerPage.value,
    currentPage.value * itemsPerPage.value
  )
})

const totalStudents = computed(() => students.value.length)
const totalPages = computed(() => Math.ceil(totalStudents.value / itemsPerPage.value))

const stats = computed(() => ({
  total: students.value.length,
  active: students.value.filter(s => s.status === 'active').length,
  inactive: students.value.filter(s => s.status === 'inactive').length,
  atRisk: students.value.filter(s => s.classesPerMonth < s.maxClasses * 0.5).length
}))

// Methods
const getStatusClass = (status: string) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || classes.inactive
}

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido'
  }
  return labels[status as keyof typeof labels] || 'Desconocido'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const viewStudent = (student: Student) => {
  emit('viewStudent', student)
}

const editStudent = (student: Student) => {
  emit('editStudent', student)
}

const deleteStudent = (student: Student) => {
  emit('deleteStudent', student)
}

const refreshData = () => {
  emit('refreshData')
  loadStudents()
}

const loadStudents = () => {
  // Simular datos de estudiantes
  students.value = [
    {
      id: '1',
      name: 'Ana García',
      email: 'ana.garcia@email.com',
      instrument: 'Piano',
      status: 'active',
      classesPerMonth: 8,
      maxClasses: 12,
      lastAccess: new Date(Date.now() - 86400000),
      avatar: '/avatars/ana.jpg'
    },
    {
      id: '2',
      name: 'Carlos López',
      email: 'carlos.lopez@email.com',
      instrument: 'Guitarra',
      status: 'active',
      classesPerMonth: 6,
      maxClasses: 8,
      lastAccess: new Date(Date.now() - 172800000),
      avatar: '/avatars/carlos.jpg'
    },
    {
      id: '3',
      name: 'María Rodríguez',
      email: 'maria.rodriguez@email.com',
      instrument: 'Violín',
      status: 'inactive',
      classesPerMonth: 2,
      maxClasses: 10,
      lastAccess: new Date(Date.now() - 604800000),
      avatar: '/avatars/maria.jpg'
    }
  ]
}

// Lifecycle
onMounted(() => {
  loadStudents()
})
</script>
