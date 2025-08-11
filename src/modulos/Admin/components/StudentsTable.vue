<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <!-- Header and controls -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Lista de Estudiantes
        </h3>
        
        <!-- Compact mode toggle -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600 dark:text-gray-400">Vista:</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="compactMode"
              class="sr-only peer"
            >
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ compactMode ? 'Compacta' : 'Detallada' }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Table container -->
    <div class="overflow-x-auto">
      <!-- Compact table -->
      <table v-if="compactMode" class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Compact table header -->
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="handleSort('nombre')"
            >
              <div class="flex items-center space-x-1">
                <span>Nombre</span>
                <ChevronUpDownIcon class="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Contacto
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              <div class="flex items-center space-x-1">
                <BookOpenIcon class="h-4 w-4" />
                <span>Instrumento</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Estado
            </th>
            <th
              scope="col"
              class="relative px-6 py-3"
            >
              <span class="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <!-- Compact table body -->
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="student in students"
            :key="student.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <!-- Compact name column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-8 w-8">
                  <div
                    v-if="!student.photoURL"
                    class="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                  >
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {{ getInitials(getStudentFullName(student)) }}
                    </span>
                  </div>
                  <img
                    v-else
                    class="h-8 w-8 rounded-full object-cover"
                    :src="student.photoURL"
                    :alt="getStudentFullName(student)"
                  >
                </div>
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ getStudentFullName(student) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    ID: {{ student.id }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Compact contact column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ student.email }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatPhone(student.phone || student.tlf) }}
              </div>
            </td>

            <!-- Compact instrument column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                <BookOpenIcon class="h-3 w-3 mr-1" />
                {{ getInstrumentName(student.instrumento || 'sin asignar') }}
              </span>
            </td>

            <!-- Compact status column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="getStatusBadgeColors(getStudentStatus(student))"
              >
                {{ getStatusText(getStudentStatus(student)) }}
              </span>
            </td>

            <!-- Compact actions column -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  @click="handleView(student)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900"
                  title="Ver detalles"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
                <button
                  @click="handleEdit(student)"
                  class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900"
                  title="Editar"
                >
                  <PencilIcon class="h-4 w-4" />
                </button>
                <button
                  @click="handleDelete(student)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900"
                  title="Eliminar"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Detailed table -->
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Detailed table header -->
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="handleSort('nombre')"
            >
              <div class="flex items-center space-x-1">
                <span>Estudiante</span>
                <ChevronUpDownIcon class="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="handleSort('email')"
            >
              <div class="flex items-center space-x-1">
                <span>Email</span>
                <ChevronUpDownIcon class="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              <div class="flex items-center space-x-1">
                <PhoneIcon class="h-4 w-4" />
                <span>Teléfono</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              <div class="flex items-center space-x-1">
                <UserGroupIcon class="h-4 w-4" />
                <span>Contactos</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              <div class="flex items-center space-x-1">
                <BookOpenIcon class="h-4 w-4" />
                <span>Instrumento</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="handleSort('activo')"
            >
              <div class="flex items-center space-x-1">
                <span>Estado</span>
                <ChevronUpDownIcon class="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="handleSort('createdAt')"
            >
              <div class="flex items-center space-x-1">
                <span>Fecha Registro</span>
                <ChevronUpDownIcon class="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              class="relative px-6 py-3"
            >
              <span class="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <!-- Detailed table body -->
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="student in students"
            :key="student.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <!-- Student column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div
                    v-if="!student.photoURL"
                    class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center"
                  >
                    <span class="text-sm font-medium text-white">
                      {{ getInitials(getStudentFullName(student)) }}
                    </span>
                  </div>
                  <img
                    v-else
                    class="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    :src="student.photoURL"
                    :alt="getStudentFullName(student)"
                  >
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ getStudentFullName(student) }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    ID: {{ student.id }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Email column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ student.email }}
              </div>
            </td>

            <!-- Phone column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ formatPhone(student.phone || student.tlf) }}
              </div>
            </td>

            <!-- Parents column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ getParentName(student) }}
              </div>
            </td>

            <!-- Instrument column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                <BookOpenIcon class="h-3 w-3 mr-1" />
                {{ getInstrumentName(student.instrumento || 'sin asignar') }}
              </span>
            </td>

            <!-- Status column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusBadgeColors(getStudentStatus(student))"
              >
                {{ getStatusText(getStudentStatus(student)) }}
              </span>
              <button
                @click="handleToggleStatus(student)"
                class="ml-2 text-xs text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Cambiar
              </button>
            </td>

            <!-- Registration date column -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(student.createdAt) }}
              </div>
            </td>

            <!-- Actions column -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  @click="handleView(student)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                  title="Ver detalles"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
                <button
                  @click="handleEdit(student)"
                  class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  title="Editar estudiante"
                >
                  <PencilIcon class="h-4 w-4" />
                </button>
                <button
                  @click="handleShowHistory(student)"
                  class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors"
                  title="Ver historial"
                >
                  <ChatBubbleLeftRightIcon class="h-4 w-4" />
                </button>
                <button
                  @click="handleToggleStatus(student)"
                  class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
                  :title="getStudentStatus(student) === 'active' ? 'Desactivar' : 'Activar'"
                >
                  <UserIcon class="h-4 w-4" />
                </button>
                <button
                  @click="handleDelete(student)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                  title="Eliminar estudiante"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div
      v-if="students.length === 0"
      class="text-center py-12"
    >
      <UserIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        No hay estudiantes
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Comienza agregando un nuevo estudiante al sistema.
      </p>
    </div>

    <!-- Conversation History Modal -->
    <ConversationHistoryModal
      :visible="isHistoryModalVisible"
      :student-id="selectedStudentId"
      @close="isHistoryModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/vue/24/outline'

import type { Student } from '../../../Students/types/student'
import ConversationHistoryModal from '../../../components/SuperAdmin/ConversationHistoryModal.vue'

// Interface definitions with proper I prefix
interface IProps {
  students: Student[]
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  loading?: boolean
  compactView?: boolean
}

interface IEmits {
  (e: 'sort', field: string): void
  (e: 'view', student: Student): void
  (e: 'edit', student: Student): void
  (e: 'delete', student: Student): void
  (e: 'toggle-status', student: Student): void
}

// Props and emits
const props = withDefaults(defineProps<IProps>(), {
  sortField: '',
  sortDirection: 'asc',
  loading: false,
  compactView: false,
})

const emit = defineEmits<IEmits>()

// Local state
const compactMode = ref(props.compactView)
const selectedStudentId = ref<string>('')
const isHistoryModalVisible = ref(false)

// Utility functions
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return 'Sin teléfono'
  
  const cleanPhone = phone.toString().replace(/\D/g, '')
  
  if (cleanPhone.length < 10) return phone.toString()
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  }
  
  const last10 = cleanPhone.slice(-10)
  return last10.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
}

const formatDate = (date: string | Date | undefined): string => {
  if (!date) return 'Sin fecha'
  
  let dateObj: Date
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }
  
  if (isNaN(dateObj.getTime())) return 'Fecha inválida'
  
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getStudentStatus = (student: Student): string => {
  if (student.activo === false) return 'inactive'
  if (student.status) return student.status
  if (student.activo === true) return 'active'
  return 'pending'
}

const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
  }
  return statusTexts[status] || 'Desconocido'
}

const getStudentFullName = (student: Student): string => {
  const nombre = student.nombre || ''
  const apellido = student.apellido || ''
  return `${nombre} ${apellido}`.trim() || 'Sin nombre'
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
    cello: 'Violonchelo',
  }
  return instruments[instrument] || instrument || 'Sin asignar'
}

const getParentName = (student: Student): string => {
  if (student.padre && student.madre) {
    return `${student.padre} / ${student.madre}`
  }
  if (student.padre) return student.padre
  if (student.madre) return student.madre
  if (student.tutor) return student.tutor
  return 'Sin contacto'
}

const getStatusBadgeColors = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  }
  return colors[status] || colors.pending
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

const handleShowHistory = (student: Student) => {
  selectedStudentId.value = student.id
  isHistoryModalVisible.value = true
}
</script>

<style scoped>
/* Table row hover effects */
tbody tr:hover {
  background-color: rgb(249 250 251);
}

@media (prefers-color-scheme: dark) {
  tbody tr:hover {
    background-color: rgb(55 65 81);
  }
}

/* Sortable header hover effects */
th.cursor-pointer:hover {
  background-color: rgb(243 244 246);
}

@media (prefers-color-scheme: dark) {
  th.cursor-pointer:hover {
    background-color: rgb(75 85 99);
  }
}

/* Action button hover effects */
td button {
  transition: all 0.2s ease-in-out;
}

td button:hover {
  transform: scale(1.05);
}

/* Compact mode optimizations */
.compact-mode {
  font-size: 0.875rem;
}

.compact-mode td {
  padding: 0.5rem 1rem;
}

.compact-mode .avatar {
  width: 2rem;
  height: 2rem;
}
</style>
