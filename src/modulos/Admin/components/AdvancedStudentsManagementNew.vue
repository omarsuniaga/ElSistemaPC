<template>
  <div class="advanced-students-management">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
          <UsersIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión Avanzada de Estudiantes
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ filteredStudents.length }} de {{ totalStudents }} estudiantes
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-3">
        <button 
          @click="refreshData"
          :disabled="isLoading"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
        >
          <ArrowPathIcon :class="['w-4 h-4', { 'animate-spin': isLoading }]" />
          <span>Actualizar</span>
        </button>
        
        <button 
          @click="showImportModal = true"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <DocumentArrowUpIcon class="w-4 h-4" />
          <span>Importar</span>
        </button>
        
        <button 
          @click="exportStudents"
          :disabled="isExporting"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <DocumentArrowDownIcon class="w-4 h-4" />
          <span>{{ isExporting ? 'Exportando...' : 'Exportar' }}</span>
        </button>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
            <UsersIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ metrics.totalStudents }}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">Total Estudiantes</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
            <CheckCircleIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ metrics.activeStudents }}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">Estudiantes Activos</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
            <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ metrics.riskStudents }}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">En Riesgo</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
            <CurrencyDollarIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-gray-900 dark:text-white">${{ metrics.revenueImpact.toLocaleString() }}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">Impacto en Ingresos</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="lg:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Buscar Estudiante
          </label>
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por nombre, email o instrumento..."
              class="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado
          </label>
          <select 
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="risk">En Riesgo</option>
          </select>
        </div>

        <!-- Instrument Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instrumento
          </label>
          <select 
            v-model="filters.instrument"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos</option>
            <option v-for="instrument in availableInstruments" :key="instrument" :value="instrument">
              {{ instrument }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Basic Table for now -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Estudiantes</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estudiante
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Instrumento
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="student in filteredStudents.slice(0, 10)" 
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >              <td class="px-4 py-4">
                <div class="flex items-center">
                  <div class="flex-shrink-0 w-10 h-10">
                    <img 
                      :src="student.avatar || `https://ui-avatars.com/api/?name=${student.name}&background=random`"
                      :alt="student.name"
                      class="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ student.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ student.email }}
                    </div>
                  </div>
                </div>
              </td>
                <td class="px-4 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {{ student.instruments?.join(', ') || 'No asignado' }}
                </span>
              </td>
              
              <td class="px-4 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="student.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'">
                  {{ student.status === 'active' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              
              <td class="px-4 py-4">
                <div class="flex items-center space-x-2">
                  <button 
                    @click="viewStudentDetails(student)"
                    class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  
                  <button 
                    @click="editStudent(student)"
                    class="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  UsersIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/vue/24/outline'

import { useAdminStudentsStore } from '../store/adminStudents'
import { advancedStudentsService } from '../services/advancedStudentsService'
import type { StudentMetrics } from '../services/advancedStudentsService'

// Store
const studentsStore = useAdminStudentsStore()

// State
const isLoading = ref(false)
const isExporting = ref(false)
const searchQuery = ref('')
const showImportModal = ref(false)

// Filters
const filters = ref({
  status: '',
  instrument: ''
})

// Data
const metrics = ref<StudentMetrics>({
  totalStudents: 0,
  activeStudents: 0,
  newThisMonth: 0,
  retentionRate: 0,
  averageAttendance: 0,
  riskStudents: 0,
  topPerformers: 0,
  revenueImpact: 0
})

// Computed
const students = computed(() => studentsStore.students)
const totalStudents = computed(() => students.value.length)

const availableInstruments = computed(() => {
  const instruments = students.value
    .flatMap(s => s.instruments || [])
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index)
  return instruments.sort()
})

const filteredStudents = computed(() => {
  let filtered = students.value
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      (student.instruments && student.instruments.some(inst => inst.toLowerCase().includes(query)))
    )
  }

  // Status filter
  if (filters.value.status) {
    if (filters.value.status === 'active') {
      filtered = filtered.filter(s => s.status === 'active')
    } else if (filters.value.status === 'inactive') {
      filtered = filtered.filter(s => s.status === 'inactive')
    }
  }
  // Instrument filter
  if (filters.value.instrument) {
    filtered = filtered.filter(s => s.instruments && s.instruments.includes(filters.value.instrument))
  }

  return filtered
})

// Methods
const loadData = async () => {
  isLoading.value = true
  try {
    await studentsStore.loadStudents()
    
    // Load metrics
    metrics.value = await advancedStudentsService.getStudentMetrics()
    
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  loadData()
}

const exportStudents = async () => {
  isExporting.value = true
  try {
    const blob = await advancedStudentsService.exportStudentsToExcel({
      active: filters.value.status === 'active' ? true : undefined,
      instrument: filters.value.instrument || undefined
    })
    
    // Download file
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error exporting students:', error)
  } finally {
    isExporting.value = false
  }
}

const viewStudentDetails = (student: any) => {
  console.log('View student details:', student)
}

const editStudent = (student: any) => {
  console.log('Edit student:', student)
}

// Initialize
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.advanced-students-management {
  max-width: 100%;
  padding: 1.5rem;
}

tbody tr {
  transition: background-color 0.2s ease-in-out;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background-color: rgb(243 244 246);
}

.dark .overflow-x-auto::-webkit-scrollbar-track {
  background-color: rgb(31 41 55);
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgb(209 213 219);
  border-radius: 9999px;
}

.dark .overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgb(75 85 99);
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgb(156 163 175);
}

.dark .overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgb(107 114 128);
}
</style>
