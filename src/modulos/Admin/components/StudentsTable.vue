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
              v-model="compactMode"
              type="checkbox"
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

    <!-- Mobile view (cards) - Only show on small screens -->
    <div class="sm:hidden space-y-3 p-4">
      <div 
        v-for="student in students"
        :key="student.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
      >
        <!-- Student header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-10 w-10 mr-3">
              <div
                v-if="!student.photoURL"
                class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
              >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ getInitials(getStudentFullName(student)) }}
                </span>
              </div>
              <img
                v-else
                class="h-10 w-10 rounded-full object-cover"
                :src="student.photoURL"
                :alt="getStudentFullName(student)"
              >
            </div>
            <div>
              <h4 class="text-base font-medium text-gray-900 dark:text-white">
                {{ getStudentFullName(student) }}
              </h4>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1"
                :class="getStatusBadgeColors(getStudentStatus(student))"
              >
                {{ getStatusText(getStudentStatus(student)) }}
              </span>
            </div>
          </div>
          <div class="flex space-x-1">
            <button
              class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
              title="Ver detalles"
              @click="handleView(student)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <button
              class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1"
              title="Editar"
              @click="handleEdit(student)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <!-- Student details -->
        <div class="mt-2 space-y-2 text-sm">
          <div class="flex items-center text-gray-600 dark:text-gray-300">
            <EnvelopeIcon class="h-4 w-4 mr-2 text-gray-400" />
            <span class="truncate">{{ student.email }}</span>
          </div>
          <div class="flex items-center text-gray-600 dark:text-gray-300">
            <PhoneIcon class="h-4 w-4 mr-2 text-gray-400" />
            <span>{{ formatPhone(student.phone || student.tlf) || 'Sin teléfono' }}</span>
          </div>
          <div class="flex items-center text-gray-600 dark:text-gray-300">
            <BookOpenIcon class="h-4 w-4 mr-2 text-gray-400" />
            <span>{{ getInstrumentName(student.instrumento || 'sin asignar') }}</span>
          </div>
        </div>
      </div>
      
      <!-- Empty state for mobile -->
      <div 
        v-if="students.length === 0"
        class="text-center py-12 px-4"
      >
        <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay estudiantes</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comienza agregando un nuevo estudiante.
        </p>
      </div>
    </div>

    <!-- Tablet/Desktop view -->
    <div class="hidden sm:block overflow-x-auto">
      <!-- Compact table for tablets -->
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
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900"
                  title="Ver detalles"
                  @click="handleView(student)"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
                <button
                  class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900"
                  title="Editar"
                  @click="handleEdit(student)"
                >
                  <PencilIcon class="h-4 w-4" />
                </button>
                <button
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900"
                  title="Eliminar"
                  @click="handleDelete(student)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Detailed table for desktop -->
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
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
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 hidden md:table-cell"
              @click="handleSort('email')"
            >
              <div class="flex items-center space-x-1">
                <span>Email</span>
                <ChevronUpDownIcon class="h-4 w-4" />
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell"
            >
              <div class="flex items-center space-x-1">
                <PhoneIcon class="h-4 w-4" />
                <span>Teléfono</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell"
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
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell"
            >
              <div class="flex items-center space-x-1">
                <span>Asistencia</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 hidden xl:table-cell"
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
            <td class="px-6 py-4 whitespace-nowrap hidden md:table-cell">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ student.email }}
              </div>
            </td>

            <!-- Phone column -->
            <td class="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ formatPhone(student.phone || student.tlf) }}
              </div>
            </td>

            <!-- Parents column -->
            <td class="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
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
                class="ml-2 text-xs text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                @click="handleToggleStatus(student)"
              >
                Cambiar
              </button>
            </td>

            <!-- Attendance column -->
            <td class="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
              <div v-if="loadingAttendance.has(student.id)" class="animate-pulse">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div v-else-if="attendanceDataMap.has(student.id)" class="">
                <div class="flex items-center space-x-2">
                  <span :class="getAttendanceTextColor(student.id)" class="text-sm font-medium">
                    {{ getAttendanceLevel(student.id) }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ getAttendancePercentage(student.id) }}%
                  </span>
                </div>
                <div class="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    :class="getAttendanceBarColor(student.id)"
                    :style="{width: `${getAttendancePercentage(student.id)}%`}"
                    class="h-1.5 rounded-full transition-all duration-300"
                  />
                </div>
              </div>
              <div v-else class="text-xs text-gray-400 dark:text-gray-500">
                Sin datos
              </div>
            </td>

            <!-- Registration date column -->
            <td class="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(student.createdAt) }}
              </div>
            </td>

            <!-- Actions column -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                  title="Ver detalles"
                  @click="handleView(student)"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
                <button
                  class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  title="Editar estudiante"
                  @click="handleEdit(student)"
                >
                  <PencilIcon class="h-4 w-4" />
                </button>
                <button
                  class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors"
                  title="Ver historial"
                  @click="handleShowHistory(student)"
                >
                  <ChatBubbleLeftRightIcon class="h-4 w-4" />
                </button>
                <button
                  class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
                  :title="getStudentStatus(student) === 'active' ? 'Desactivar' : 'Activar'"
                  @click="handleToggleStatus(student)"
                >
                  <UserIcon class="h-4 w-4" />
                </button>
                <button
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                  title="Eliminar estudiante"
                  @click="handleDelete(student)"
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
// External dependencies
import {
  ChevronUpDownIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  BookOpenIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline';
import { ref, computed, onMounted } from 'vue';

// Local components
import ConversationHistoryModal from '../../../components/SuperAdmin/ConversationHistoryModal.vue';

// Services
import { getStudentAttendanceMetrics } from '../../Students/services/attendanceAnalysis';
import type { AttendanceMetrics } from '../../Students/services/attendanceAnalysis';

// Utils
import { formatDate } from '../utils/dateFormatter';

// Types
import type { Student } from '@/modulos/Students/types/student';

// Interface definitions with proper I prefix
interface IProps {
  students: Student[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  compactView?: boolean;
}

interface IEmits {
  (e: 'sort', field: string): void;
  (e: 'view', student: Student): void;
  (e: 'edit', student: Student): void;
  (e: 'delete', student: Student): void;
  (e: 'toggle-status', student: Student): void;
}

// Props and emits
const props = withDefaults(defineProps<IProps>(), {
  sortField: '',
  sortDirection: 'asc',
  loading: false,
  compactView: false,
});

const emit = defineEmits<IEmits>();

// Local state
const compactMode = ref(props.compactView);
const selectedStudentId = ref<string>('');
const isHistoryModalVisible = ref(false);
const attendanceDataMap = ref<Map<string, AttendanceMetrics>>(new Map());
const loadingAttendance = ref<Set<string>>(new Set());

// Utility functions
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return 'Sin teléfono';
  
  const cleanPhone = phone.toString().replace(/\D/g, '');
  
  if (cleanPhone.length < 10) return phone.toString();
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  
  const last10 = cleanPhone.slice(-10);
  return last10.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};


const getStudentStatus = (student: Student): string => {
  if (student.activo === false) return 'inactive';
  if (student.status) return student.status;
  if (student.activo === true) return 'active';
  return 'pending';
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    graduated: 'Graduado',
    dropped: 'Retirado',
  };
  return statusMap[status] || status;
};

const getStudentFullName = (student: Student): string => {
  const nombre = student.nombre || '';
  const apellido = student.apellido || '';
  return `${nombre} ${apellido}`.trim() || 'Sin nombre';
};

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
  };
  return instruments[instrument] || instrument || 'Sin asignar';
};

const getParentName = (student: Student): string => {
  if (student.padre && student.madre) {
    return `${student.padre} / ${student.madre}`;
  }
  if (student.padre) return student.padre;
  if (student.madre) return student.madre;
  if (student.tutor) return student.tutor;
  return 'Sin contacto';
};

const getStatusBadgeColors = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return colors[status] || colors.pending;
};

// Event handlers
const handleSort = (field: string) => {
  emit('sort', field);
};

const handleView = (student: Student) => {
  emit('view', student);
};

const handleEdit = (student: Student) => {
  emit('edit', student);
};

const handleDelete = (student: Student) => {
  emit('delete', student);
};

const handleToggleStatus = (student: Student) => {
  emit('toggle-status', student);
};

const handleShowHistory = (student: Student) => {
  selectedStudentId.value = student.id;
  isHistoryModalVisible.value = true;
};

// Attendance methods
const loadStudentAttendance = async (studentId: string) => {
  if (loadingAttendance.value.has(studentId) || attendanceDataMap.value.has(studentId)) {
    return;
  }
  
  try {
    loadingAttendance.value.add(studentId);
    
    // Get attendance data for the last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const dateRange = {
      start: threeMonthsAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
    
    const metrics = await getStudentAttendanceMetrics(studentId, dateRange);
    attendanceDataMap.value.set(studentId, metrics);
  } catch (error) {
    console.error('Error loading attendance for student:', studentId, error);
  } finally {
    loadingAttendance.value.delete(studentId);
  }
};

const getAttendanceLevel = (studentId: string): string => {
  const data = attendanceDataMap.value.get(studentId);
  if (!data || data.summary.total === 0) return 'Sin datos';
  return data.classification;
};

const getAttendancePercentage = (studentId: string): number => {
  const data = attendanceDataMap.value.get(studentId);
  if (!data) return 0;
  return data.summary.attendanceRate;
};

const getAttendanceTextColor = (studentId: string): string => {
  const percentage = getAttendancePercentage(studentId);
  if (percentage >= 90) return 'text-green-700 dark:text-green-300';
  if (percentage >= 80) return 'text-blue-700 dark:text-blue-300';
  if (percentage >= 70) return 'text-yellow-700 dark:text-yellow-300';
  if (percentage > 0) return 'text-red-700 dark:text-red-300';
  return 'text-gray-500 dark:text-gray-400';
};

const getAttendanceBarColor = (studentId: string): string => {
  const percentage = getAttendancePercentage(studentId);
  if (percentage >= 90) return 'bg-gradient-to-r from-green-400 to-emerald-500';
  if (percentage >= 80) return 'bg-gradient-to-r from-blue-400 to-blue-500';
  if (percentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-amber-500';
  if (percentage > 0) return 'bg-gradient-to-r from-red-400 to-red-500';
  return 'bg-gradient-to-r from-gray-400 to-gray-500';
};

// Load attendance for visible students
const loadVisibleStudentsAttendance = () => {
  props.students.forEach((student) => {
    loadStudentAttendance(student.id);
  });
};

// Watch for student changes and load attendance data
onMounted(() => {
  loadVisibleStudentsAttendance();
});

// Load attendance when students prop changes
computed(() => {
  // This reactive computation will trigger when students change
  const studentIds = props.students.map(s => s.id);
  // Load attendance for any new students
  studentIds.forEach(id => {
    if (!attendanceDataMap.value.has(id) && !loadingAttendance.value.has(id)) {
      loadStudentAttendance(id);
    }
  });
  return studentIds;
});
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
