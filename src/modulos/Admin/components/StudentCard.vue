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
            class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            title="Opciones"
            @click="showMenu = !showMenu"
          >
            <EllipsisVerticalIcon class="w-5 h-5" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showMenu"
            v-click-outside="() => (showMenu = false)"
            class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
          >
            <div class="py-2">
              <!-- View Profile -->
              <button
                class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                @click="handleViewProfile"
              >
                <UserIcon class="w-5 h-5 text-blue-500" />
                <span>Ver Perfil Completo</span>
              </button>

              <!-- Edit Student -->
              <button
                v-if="permissions.canEdit"
                class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                @click="handleEdit"
              >
                <PencilIcon class="w-5 h-5 text-green-500" />
                <span>Editar Estudiante</span>
              </button>

              <!-- Download Schedule -->
              <button
                class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                @click="handleDownloadSchedule"
              >
                <CalendarDaysIcon class="w-5 h-5 text-purple-500" />
                <span>Descargar Horario</span>
              </button>

              <!-- WhatsApp Parents -->
              <button
                v-if="hasParentPhones"
                class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                @click="handleWhatsAppParents"
              >
                <ChatBubbleLeftEllipsisIcon class="w-5 h-5 text-green-600" />
                <span>WhatsApp a Padres</span>
              </button>

              <hr class="my-2 border-gray-200 dark:border-gray-600" />

              <!-- Toggle Status -->
              <button
                v-if="permissions.canEdit"
                class="w-full px-4 py-3 text-left text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center space-x-3 transition-colors"
                @click="handleToggleStatus"
              >
                <component :is="student.activo ? PauseIcon : PlayIcon" class="w-5 h-5" />
                <span>{{ student.activo ? "Desactivar" : "Activar" }}</span>
              </button>

              <!-- Delete Student -->
              <button
                v-if="permissions.canDelete"
                class="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors"
                @click="handleDelete"
              >
                <TrashIcon class="w-5 h-5" />
                <span>Eliminar Estudiante</span>
              </button>
            </div>
          </div>
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
          class="flex-1 min-w-0 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
          @click="handleViewProfile"
        >
          <EyeIcon class="w-4 h-4" />
          <span>Ver Perfil</span>
        </button>

        <button
          v-if="permissions.canEdit"
          class="flex-1 min-w-0 px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
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
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showDeleteConfirmation = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4" @click.stop>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Confirmar Eliminación
        </h3>
        <p class="text-gray-700 dark:text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar a
          <strong>{{ `${student.nombre} ${student.apellido}` }}</strong
          >? Esta acción no se puede deshacer.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            @click="showDeleteConfirmation = false"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            @click="confirmDelete"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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
import type { Student } from '@/types';

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

// Attendance calculation (mock data - replace with real calculation)
const attendancePercentage = computed(() => {
  // TODO: Implement real attendance calculation
  // For now, return a value based on student ID to simulate different levels
  const studentId = props.student.id || '';
  const hash = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.max(30, Math.min(95, 50 + (hash % 45)));
});

const attendanceLevel = computed(() => {
  const percentage = attendancePercentage.value;
  if (percentage >= 85) return 'Excelente';
  if (percentage >= 70) return 'Bueno';
  if (percentage >= 55) return 'Regular';
  return 'Crítico';
});

const attendanceDescription = computed(() => {
  const percentage = attendancePercentage.value;
  if (percentage >= 85) return 'Estudiante muy constante, asistencia ejemplar';
  if (percentage >= 70) return 'Asistencia aceptable con algunas ausencias';
  if (percentage >= 55) return 'Asistencia irregular, requiere atención';
  return 'Asistencia crítica, requiere intervención inmediata';
});

const attendanceBackgroundColor = computed(() => {
  const percentage = attendancePercentage.value;
  if (percentage >= 85)
    return 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20';
  if (percentage >= 70)
    return 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20';
  if (percentage >= 55)
    return 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20';
  return 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20';
});

const attendanceIndicatorColor = computed(() => {
  const percentage = attendancePercentage.value;
  if (percentage >= 85) return 'bg-gradient-to-r from-green-400 to-emerald-500';
  if (percentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-amber-500';
  if (percentage >= 55) return 'bg-gradient-to-r from-orange-400 to-orange-500';
  return 'bg-gradient-to-r from-red-400 to-red-500';
});

const attendanceTextColor = computed(() => {
  const percentage = attendancePercentage.value;
  if (percentage >= 85) return 'text-green-700 dark:text-green-300';
  if (percentage >= 70) return 'text-yellow-700 dark:text-yellow-300';
  if (percentage >= 55) return 'text-orange-700 dark:text-orange-300';
  return 'text-red-700 dark:text-red-300';
});

const attendanceBarColor = computed(() => {
  const percentage = attendancePercentage.value;
  if (percentage >= 85) return 'bg-gradient-to-r from-green-400 to-emerald-500';
  if (percentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-amber-500';
  if (percentage >= 55) return 'bg-gradient-to-r from-orange-400 to-orange-500';
  return 'bg-gradient-to-r from-red-400 to-red-500';
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

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
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
    emit('view-profile', props.student);
  }
};

const _handleView = () => {
  showMenu.value = false;
  emit('view', props.student);
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

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement & {clickOutsideEvent?: (event: Event) => void}, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value();
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: HTMLElement & {clickOutsideEvent?: (event: Event) => void}) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent);
    }
  },
};
</script>

<style scoped>
.border-3 {
  border-width: 3px;
}
</style>
