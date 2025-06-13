<template>
  <div class="overflow-hidden">
    <!-- Table Header -->
    <div class="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          Lista de Estudiantes
        </h3>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ students.length }} estudiante{{ students.length !== 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <!-- Name -->
            <th
              @click="handleSort('name')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
            >
              <div class="flex items-center space-x-1">
                <span>Nombre</span>
                <ChevronUpDownIcon 
                  v-if="sortField !== 'name'"
                  class="w-4 h-4 text-gray-400" 
                />
                <ChevronUpIcon 
                  v-else-if="sortOrder === 'asc'"
                  class="w-4 h-4 text-blue-500" 
                />
                <ChevronDownIcon 
                  v-else
                  class="w-4 h-4 text-blue-500" 
                />
              </div>
            </th>

            <!-- Contact -->
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Contacto
            </th>

            <!-- Instruments -->
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Instrumentos
            </th>

            <!-- Grade -->
            <th
              @click="handleSort('grade')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
            >
              <div class="flex items-center space-x-1">
                <span>Nivel</span>
                <ChevronUpDownIcon 
                  v-if="sortField !== 'grade'"
                  class="w-4 h-4 text-gray-400" 
                />
                <ChevronUpIcon 
                  v-else-if="sortOrder === 'asc'"
                  class="w-4 h-4 text-blue-500" 
                />
                <ChevronDownIcon 
                  v-else
                  class="w-4 h-4 text-blue-500" 
                />
              </div>
            </th>

            <!-- Status -->
            <th
              @click="handleSort('status')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
            >
              <div class="flex items-center space-x-1">
                <span>Estado</span>
                <ChevronUpDownIcon 
                  v-if="sortField !== 'status'"
                  class="w-4 h-4 text-gray-400" 
                />
                <ChevronUpIcon 
                  v-else-if="sortOrder === 'asc'"
                  class="w-4 h-4 text-blue-500" 
                />
                <ChevronDownIcon 
                  v-else
                  class="w-4 h-4 text-blue-500" 
                />
              </div>
            </th>

            <!-- Enrollment Date -->
            <th
              @click="handleSort('enrollmentDate')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
            >
              <div class="flex items-center space-x-1">
                <span>Inscripción</span>
                <ChevronUpDownIcon 
                  v-if="sortField !== 'enrollmentDate'"
                  class="w-4 h-4 text-gray-400" 
                />
                <ChevronUpIcon 
                  v-else-if="sortOrder === 'asc'"
                  class="w-4 h-4 text-blue-500" 
                />
                <ChevronDownIcon 
                  v-else
                  class="w-4 h-4 text-blue-500" 
                />
              </div>
            </th>

            <!-- Classes -->
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Clases
            </th>

            <!-- Actions -->
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
          <tr
            v-for="student in students"
            :key="student.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <!-- Name Column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center space-x-3">
                <!-- Avatar -->
                <div class="relative">
                  <img
                    v-if="student.avatar"
                    :src="student.avatar"
                    :alt="student.name"
                    class="w-10 h-10 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm"
                  >
                    {{ getInitials(student.name) }}
                  </div>
                  
                  <!-- Status indicator -->
                  <div
                    :class="[
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                      statusColors[student.status]
                    ]"
                  ></div>
                </div>
                
                <!-- Name and Email -->
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ student.name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {{ student.email }}
                  </p>
                </div>
              </div>
            </td>

            <!-- Contact Column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm">
                <div class="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <PhoneIcon class="w-4 h-4 text-gray-400" />
                  <span>{{ formatPhone(student.phone) }}</span>
                </div>
                <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mt-1">
                  <UserIcon class="w-4 h-4 text-gray-400" />
                  <span class="truncate">{{ student.parentName }}</span>
                </div>
              </div>
            </td>

            <!-- Instruments Column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="instrument in student.instruments.slice(0, 2)"
                  :key="instrument"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {{ getInstrumentName(instrument) }}
                </span>
                <span
                  v-if="student.instruments.length > 2"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  :title="student.instruments.slice(2).map(getInstrumentName).join(', ')"
                >
                  +{{ student.instruments.length - 2 }}
                </span>
              </div>
            </td>

            <!-- Grade Column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="gradeColors[student.grade]" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                {{ getGradeName(student.grade) }}
              </span>
            </td>

            <!-- Status Column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <button
                  v-if="permissions.canEdit"
                  @click="handleToggleStatus(student)"
                  :class="statusBadgeColors[student.status]"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                >
                  <div :class="statusColors[student.status]" class="w-1.5 h-1.5 rounded-full mr-2"></div>
                  {{ getStatusName(student.status) }}
                </button>
                <span
                  v-else
                  :class="statusBadgeColors[student.status]"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  <div :class="statusColors[student.status]" class="w-1.5 h-1.5 rounded-full mr-2"></div>
                  {{ getStatusName(student.status) }}
                </span>
              </div>
            </td>

            <!-- Enrollment Date Column -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(student.enrollmentDate) }}
            </td>

            <!-- Classes Column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center text-sm">
                <BookOpenIcon class="w-4 h-4 text-gray-400 mr-2" />
                <span class="text-gray-900 dark:text-white">
                  {{ student.classes?.length || 0 }}
                </span>
                <span class="text-gray-500 dark:text-gray-400 ml-1">
                  clase{{ (student.classes?.length || 0) !== 1 ? 's' : '' }}
                </span>
              </div>
            </td>

            <!-- Actions Column -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  v-if="permissions.canView"
                  @click="handleView(student)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1"
                  title="Ver detalles"
                >
                  <EyeIcon class="w-4 h-4" />
                </button>
                
                <button
                  v-if="permissions.canEdit"
                  @click="handleEdit(student)"
                  class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1"
                  title="Editar estudiante"
                >
                  <PencilIcon class="w-4 h-4" />
                </button>
                
                <button
                  v-if="permissions.canDelete"
                  @click="handleDelete(student)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1"
                  title="Eliminar estudiante"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="students.length === 0" class="text-center py-12">
      <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay estudiantes</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        No se encontraron estudiantes que coincidan con los criterios de búsqueda.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PhoneIcon,
  UserIcon,
  BookOpenIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'
import { Student } from '../store/adminStudents'

// Props
interface Props {
  students: Student[]
  permissions: {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
  }
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  sortField: 'name',
  sortOrder: 'asc'
})

// Emits
interface Emits {
  view: [student: Student]
  edit: [student: Student]
  delete: [student: Student]
  'toggle-status': [student: Student]
  sort: [field: string]
}

const emit = defineEmits<Emits>()

// Colors and styling
const statusColors = {
  active: 'bg-green-500',
  inactive: 'bg-red-500',
  pending: 'bg-yellow-500'
}

const statusBadgeColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
}

const gradeColors = {
  beginner: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  intermediate: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
}

// Methods
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getInstrumentName = (instrument: string): string => {
  const instruments: Record<string, string> = {
    piano: 'Piano',
    guitar: 'Guitarra',
    violin: 'Violín',
    drums: 'Batería',
    voice: 'Canto',
    bass: 'Bajo',
    flute: 'Flauta',
    saxophone: 'Saxofón',
    trumpet: 'Trompeta',
    cello: 'Violonchelo'
  }
  return instruments[instrument] || instrument
}

const getGradeName = (grade: string): string => {
  const grades: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado'
  }
  return grades[grade] || grade
}

const getStatusName = (status: string): string => {
  const statuses: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente'
  }
  return statuses[status] || status
}

// Event handlers
const handleSort = (field: string) => {
  emit('sort', field)
}

const handleView = (student: Student) => {
  emit('view', student)
}

const handleEdit = (student: Student) => {
  emit('edit', student)
}

const handleDelete = (student: Student) => {
  emit('delete', student)
}

const handleToggleStatus = (student: Student) => {
  emit('toggle-status', student)
}
</script>
<script>
export default {
  components: {
    name: 'StudentsTable',
  }
}
</script>
<style scoped>
/* Table row hover effects */
tbody tr:hover {
  @apply bg-gray-50 dark:bg-gray-700;
}

/* Sortable header hover effects */
th.cursor-pointer:hover {
  @apply bg-gray-100 dark:bg-gray-600;
}

/* Action button hover effects */
td button {
  @apply transition-all duration-150;
}

td button:hover {
  @apply scale-110;
}
</style>
