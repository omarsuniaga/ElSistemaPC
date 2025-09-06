<template>
  <div
    :class="[
      'rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
      attendanceBackgroundColor,
      'border-gray-200 dark:border-gray-700',
    ]"
    class="relative overflow-hidden h-full min-h-[400px] flex flex-col"
  >
    <!-- Attendance Level Indicator -->
    <div :class="attendanceIndicatorColor" class="absolute top-0 left-0 right-0 h-1" />

    <!-- Card Content -->
    <div class="p-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm flex-1 flex flex-col">
      <!-- Header with Avatar and Status -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center space-x-4 flex-1 min-w-0">
          <!-- Avatar with Initials (No Images) -->
          <div class="relative">
            <div
              :class="avatarBackgroundColor"
              class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
            >
              {{ getInitials(`${student.nombre} ${student.apellido}`) }}
            </div>

            <!-- Active Status Indicator -->
            <div
              :class="student.activo ? 'bg-green-500' : 'bg-red-500'"
              class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white dark:border-gray-800 shadow-md"
            />
          </div>

          <!-- Student Info -->
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white truncate mb-1">
              {{ `${student.nombre} ${student.apellido}` }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {{ student.edad ? `${student.edad} años` : "Edad no especificada" }}
            </p>
            <div class="flex items-center space-x-2">
              <span
                :class="
                  student.activo
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                "
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ student.activo ? "Activo" : "Inactivo" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Actions Menu -->
        <div class="relative flex-shrink-0">
          <button
            class="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            :class="{ 
              'from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 shadow-xl scale-105 ring-2 ring-blue-500/30': showMenu,
              'shadow-md': !showMenu 
            }"
            title="Más opciones"
            @click.stop="toggleMenu"
          >
            <EllipsisVerticalIcon 
              class="w-5 h-5 transition-all duration-300" 
              :class="{ 
                'rotate-90 text-blue-600 dark:text-blue-400': showMenu,
                'text-gray-600 dark:text-gray-300': !showMenu
              }"
            />
          </button>

          <!-- Dropdown Menu -->
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="transform opacity-0 scale-95 translate-y-1"
            enter-to-class="transform opacity-100 scale-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="transform opacity-100 scale-100 translate-y-0"
            leave-to-class="transform opacity-0 scale-95 translate-y-1"
          >
            <div
              v-show="showMenu"
              class="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[60] overflow-hidden backdrop-blur-sm"
              style="box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);"
            >
              <!-- Header del menú -->
              <div class="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                <div class="flex items-center space-x-3">
                  <div :class="avatarBackgroundColor" class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {{ getInitials(`${student.nombre} ${student.apellido}`) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {{ `${student.nombre} ${student.apellido}` }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ student.email }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="py-2">
                <!-- Ver Perfil -->
                <button
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 flex items-center space-x-3 transition-all duration-200 group relative overflow-hidden"
                  @click="handleViewProfile"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-200" />
                  <div class="relative z-10 flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                      <EyeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span class="font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Ver Perfil</span>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Información completa</p>
                    </div>
                  </div>
                </button>

                <!-- Divider -->
                <div class="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent" />

                <!-- Editar Student -->
                <button
                  v-if="permissions.canEdit"
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 flex items-center space-x-3 transition-all duration-200 group relative overflow-hidden"
                  @click="handleEdit"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10 transition-all duration-200" />
                  <div class="relative z-10 flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                      <PencilIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <span class="font-medium text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Editar</span>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Modificar información</p>
                    </div>
                  </div>
                </button>

                <!-- Toggle Status -->
                <button
                  v-if="permissions.canEdit"
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 dark:hover:from-amber-900/20 dark:hover:to-amber-800/20 flex items-center space-x-3 transition-all duration-200 group relative overflow-hidden"
                  @click="handleToggleStatus"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/10 transition-all duration-200" />
                  <div class="relative z-10 flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors">
                      <UserIcon class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <span class="font-medium text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                        {{ student.activo ? 'Desactivar' : 'Activar' }}
                      </span>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ student.activo ? 'Suspender acceso' : 'Reactivar acceso' }}
                      </p>
                    </div>
                  </div>
                </button>

                <!-- Divider antes de eliminar -->
                <div v-if="permissions.canDelete" class="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-red-200 dark:via-red-600/50 to-transparent" />

                <!-- Delete Student -->
                <button
                  v-if="permissions.canDelete"
                  class="w-full px-4 py-3 text-left text-sm hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 flex items-center space-x-3 transition-all duration-200 group relative overflow-hidden"
                  @click="handleDelete"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:to-red-500/10 transition-all duration-200" />
                  <div class="relative z-10 flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                      <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <span class="font-medium text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">Eliminar</span>
                      <p class="text-xs text-red-500/70 dark:text-red-400/70">Acción permanente</p>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Footer con información adicional -->
              <div class="px-4 py-2 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200/50 dark:border-gray-600/50">
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span class="flex items-center space-x-1">
                    <div class="w-2 h-2 rounded-full" :class="student.activo ? 'bg-green-400' : 'bg-red-400'"></div>
                    <span>{{ student.activo ? 'Activo' : 'Inactivo' }}</span>
                  </span>
                  <span>ID: {{ student.id.slice(-6) }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Student Details -->
      <div class="space-y-3 flex-1">
        <!-- Instrument Info -->
        <div class="flex items-center space-x-3">
          <MusicalNoteIcon class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Instrumento:</span>
            <span
              v-if="getInstrumentName(student.instrumento) !== 'Sin instrumento'"
              class="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {{ getInstrumentName(student.instrumento) }}
            </span>
            <span
              v-else
              class="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            >
              Sin instrumento
            </span>
          </div>
        </div>

        <!-- Classes/Groups -->
        <div class="flex items-start space-x-3">
          <BookOpenIcon class="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Clases:</span>
            <div v-if="student.grupo && student.grupo.length > 0" class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="grupo in student.grupo"
                :key="grupo"
                class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
              >
                {{ grupo }}
              </span>
            </div>
            <span v-else class="ml-2 text-sm text-gray-500 dark:text-gray-400">
              Sin clases asignadas
            </span>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="flex items-start space-x-3">
          <PhoneIcon class="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Contacto:</span>
            <div class="mt-1 space-y-1">
              <div
                v-if="student.madre && student.tlf_madre"
                class="text-xs text-gray-600 dark:text-gray-400 truncate"
              >
                👩 {{ student.madre }}: {{ formatPhone(student.tlf_madre) }}
              </div>
              <div
                v-if="student.padre && student.tlf_padre"
                class="text-xs text-gray-600 dark:text-gray-400 truncate"
              >
                👨 {{ student.padre }}: {{ formatPhone(student.tlf_padre) }}
              </div>
              <div v-if="!hasParentPhones" class="text-xs text-gray-500 dark:text-gray-400">
                Sin contactos registrados
              </div>
            </div>
          </div>
        </div>

        <!-- Enrollment Date -->
        <div v-if="student.fecInscripcion" class="flex items-center space-x-3">
          <CalendarIcon class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span class="text-sm text-gray-600 dark:text-gray-400 truncate">
            Inscrito: {{ formatDate(student.fecInscripcion) }}
          </span>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="mt-6 flex flex-wrap gap-2">
        <button
          class="flex-1 min-w-0 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-sm"
          @click="handleViewProfile"
        >
          <EyeIcon class="w-4 h-4" />
          <span>Ver Perfil</span>
        </button>

        <button
          v-if="permissions.canEdit"
          class="flex-1 min-w-0 px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-sm"
          @click="handleEdit"
        >
          <PencilIcon class="w-4 h-4" />
          <span>Editar</span>
        </button>
      </div>

      <!-- Attendance Level Indicator -->
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nivel de Asistencia:
          </span>
          <span :class="attendanceTextColor" class="text-sm font-bold">
            {{ attendanceLevel }}
          </span>
        </div>
        <div class="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            :class="attendanceBarColor"
            :style="{width: `${attendancePercentage}%`}"
            class="h-2 rounded-full transition-all duration-300"
          />
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ attendanceDescription }}
        </p>
        <p v-if="!attendanceLoading && attendanceData && attendanceData.summary.total > 0" 
           class="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Últimos 3 meses • {{ attendanceData.recentRecords.length }} registros recientes
        </p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showDeleteConfirmation"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
        @click="showDeleteConfirmation = false"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="transform opacity-0 scale-95 translate-y-4"
          enter-to-class="transform opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="transform opacity-100 scale-100 translate-y-0"
          leave-to-class="transform opacity-0 scale-95 translate-y-4"
        >
          <div 
            v-if="showDeleteConfirmation"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700" 
            @click.stop
          >
            <!-- Header with icon -->
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <TrashIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Eliminar Estudiante
                </h3>
              </div>
            </div>
            
            <!-- Content -->
            <div class="mb-6">
              <p class="text-gray-700 dark:text-gray-300 mb-3">
                ¿Estás seguro de que deseas eliminar a:
              </p>
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                <div class="flex items-center space-x-3">
                  <div :class="avatarBackgroundColor" class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {{ getInitials(`${student.nombre} ${student.apellido}`) }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ `${student.nombre} ${student.apellido}` }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ student.email }}
                    </p>
                  </div>
                </div>
              </div>
              <p class="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ Esta acción no se puede deshacer.
              </p>
            </div>
            
            <!-- Actions -->
            <div class="flex justify-end space-x-3">
              <button
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                @click="showDeleteConfirmation = false"
              >
                Cancelar
              </button>
              <button
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                @click="confirmDelete"
              >
                <TrashIcon class="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  UserIcon,
  MusicalNoteIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarIcon,
  PlayIcon,
  PauseIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/vue/24/outline';
import { Transition } from 'vue';
import type { Student } from '@/types';
import { getStudentAttendanceMetrics } from '../../Students/services/attendanceAnalysis';
import type { AttendanceMetrics } from '../../Students/services/attendanceAnalysis';

// Define component name
defineOptions({
  name: 'StudentCard',
});

// Props
interface Props {
  student: Student
  permissions: {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

const props = defineProps<Props>();

// Emits
interface Emits {
  view: [student: Student]
  edit: [student: Student]
  delete: [student: Student]
  'toggle-status': [student: Student]
  'view-profile': [student: Student]
  'download-schedule': [student: Student]
  'whatsapp-parents': [student: Student]
}

const emit = defineEmits<Emits>();

// Router
const router = useRouter();

// State
const showMenu = ref(false);
const showDeleteConfirmation = ref(false);
const attendanceData = ref<AttendanceMetrics | null>(null);
const attendanceLoading = ref(true);

// Computed Properties
const _hasAnyPermission = computed(
  () => props.permissions.canView || props.permissions.canEdit || props.permissions.canDelete,
);

const hasParentPhones = computed(() => {
  return (
    (props.student.tlf_madre && props.student.tlf_madre.trim()) ||
    (props.student.tlf_padre && props.student.tlf_padre.trim())
  );
});

// Real attendance calculation
const attendancePercentage = computed(() => {
  if (!attendanceData.value || attendanceLoading.value) {
    return 0;
  }
  return attendanceData.value.summary.attendanceRate;
});

const totalClasses = computed(() => {
  if (!attendanceData.value) return 0;
  return attendanceData.value.summary.total;
});

const presentClasses = computed(() => {
  if (!attendanceData.value) return 0;
  return attendanceData.value.summary.present + attendanceData.value.summary.justified;
});

const attendanceLevel = computed(() => {
  if (attendanceLoading.value) return 'Cargando...';
  if (!attendanceData.value || attendanceData.value.summary.total === 0) {
    return 'Sin datos';
  }
  return attendanceData.value.classification;
});

const attendanceDescription = computed(() => {
  if (attendanceLoading.value) return 'Cargando datos de asistencia...';
  if (!attendanceData.value || attendanceData.value.summary.total === 0) {
    return 'No hay registros de asistencia disponibles';
  }
  
  const total = attendanceData.value.summary.total;
  const present = attendanceData.value.summary.present;
  const justified = attendanceData.value.summary.justified;
  const absent = attendanceData.value.summary.absent;
  const late = attendanceData.value.summary.late;
  
  return `${present + justified}/${total} clases asistidas (P:${present}, J:${justified}, A:${absent}, T:${late})`;
});

const attendanceBackgroundColor = computed(() => {
  if (attendanceLoading.value) {
    return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20';
  }
  
  const percentage = attendancePercentage.value;
  if (percentage >= 90)
    return 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20';
  if (percentage >= 80)
    return 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20';
  if (percentage >= 70)
    return 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20';
  if (percentage > 0)
    return 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20';
  return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20';
});

const attendanceIndicatorColor = computed(() => {
  if (attendanceLoading.value) {
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  }
  
  const percentage = attendancePercentage.value;
  if (percentage >= 90) return 'bg-gradient-to-r from-green-400 to-emerald-500';
  if (percentage >= 80) return 'bg-gradient-to-r from-blue-400 to-blue-500';
  if (percentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-amber-500';
  if (percentage > 0) return 'bg-gradient-to-r from-red-400 to-red-500';
  return 'bg-gradient-to-r from-gray-400 to-gray-500';
});

const attendanceTextColor = computed(() => {
  if (attendanceLoading.value) {
    return 'text-gray-700 dark:text-gray-300';
  }
  
  const percentage = attendancePercentage.value;
  if (percentage >= 90) return 'text-green-700 dark:text-green-300';
  if (percentage >= 80) return 'text-blue-700 dark:text-blue-300';
  if (percentage >= 70) return 'text-yellow-700 dark:text-yellow-300';
  if (percentage > 0) return 'text-red-700 dark:text-red-300';
  return 'text-gray-700 dark:text-gray-300';
});

const attendanceBarColor = computed(() => {
  if (attendanceLoading.value) {
    return 'bg-gradient-to-r from-gray-400 to-gray-500 animate-pulse';
  }
  
  const percentage = attendancePercentage.value;
  if (percentage >= 90) return 'bg-gradient-to-r from-green-400 to-emerald-500';
  if (percentage >= 80) return 'bg-gradient-to-r from-blue-400 to-blue-500';
  if (percentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-amber-500';
  if (percentage > 0) return 'bg-gradient-to-r from-red-400 to-red-500';
  return 'bg-gradient-to-r from-gray-400 to-gray-500';
});

const avatarBackgroundColor = computed(() => {
  // Generate consistent color based on student name
  const name = `${props.student.nombre} ${props.student.apellido}`.toLowerCase();
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-red-400 to-red-600',
    'bg-gradient-to-br from-teal-400 to-teal-600',
    'bg-gradient-to-br from-orange-400 to-orange-600',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
});

// Methods
const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '??';
  }
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getInstrumentName = (instrument: any): string => {
  if (!instrument) {
    return 'Sin instrumento';
  }
  
  // Si es un string, devolverlo directamente
  if (typeof instrument === 'string') {
    return instrument;
  }
  
  // Si es un objeto, buscar la propiedad del nombre
  if (typeof instrument === 'object') {
    // Intentar diferentes propiedades comunes para el nombre
    return (
      instrument.nombre ||
      instrument.name ||
      instrument.instrumento ||
      instrument.tipo ||
      'Instrumento no especificado'
    );
  }
  
  return 'Sin instrumento';
};

const formatPhone = (phone: string): string => {
  if (!phone) return '';
  // Basic phone formatting - can be customized based on locale
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

// Use centralized date formatter
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Error en fecha';
  }
};

// Event Handlers
const handleViewProfile = async () => {
  showMenu.value = false;
  
  try {
    console.log('Navigating to profile for student:', props.student.id);
    // Navigate to student profile using the student ID
    await router.push({
      name: 'StudentProfile',
      params: {
        id: props.student.id,
      },
    });
  } catch (error) {
    console.error('Error navigating to student profile:', error);
    // Fallback: emit event for parent component to handle
    emit('view', props.student);
  }
};

const _handleView = () => {
  showMenu.value = false;
  emit('view', props.student);
};

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const handleEdit = () => {
  showMenu.value = false;
  emit('edit', props.student);
};

const handleDelete = () => {
  showMenu.value = false;
  showDeleteConfirmation.value = true;
};

const confirmDelete = () => {
  showDeleteConfirmation.value = false;
  emit('delete', props.student);
};

const handleToggleStatus = () => {
  showMenu.value = false;
  emit('toggle-status', props.student);
};

const handleDownloadSchedule = () => {
  showMenu.value = false;
  emit('download-schedule', props.student);
};

const handleWhatsAppParents = () => {
  showMenu.value = false;
  emit('whatsapp-parents', props.student);
};

// Load attendance data
const loadAttendanceData = async () => {
  if (!props.student.id) return;
  
  try {
    attendanceLoading.value = true;
    
    // Get attendance data for the last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const dateRange = {
      start: threeMonthsAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
    
    const metrics = await getStudentAttendanceMetrics(props.student.id, dateRange);
    attendanceData.value = metrics;
  } catch (error) {
    console.error('Error loading attendance data for student:', props.student.id, error);
    attendanceData.value = null;
  } finally {
    attendanceLoading.value = false;
  }
};

// Handle clicking outside menu
const handleClickOutside = (event: MouseEvent) => {
  if (showMenu.value) {
    showMenu.value = false;
  }
};

// Load data on component mount
onMounted(() => {
  loadAttendanceData();
  document.addEventListener('click', handleClickOutside);
});

// Clean up on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.border-3 {
  border-width: 3px;
}
</style>