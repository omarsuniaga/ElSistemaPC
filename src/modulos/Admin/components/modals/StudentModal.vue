<template>
  <GlobalModal
    :is-open="isOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    size="lg"
    :is-loading="isLoading"
    @close="handleClose"
    @confirm="handleSubmit"
    @cancel="handleClose"
    :show-default-actions="true"
    :confirm-text="isEditing ? 'Actualizar' : 'Crear'"
    cancel-text="Cancelar"
    :confirm-type="isEditing ? 'primary' : 'success'"
  >
    <template #content>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Personal Information Section -->
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserIcon class="h-5 w-5 mr-2 text-blue-500" />
            Información Personal
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- First Name -->
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <input
                v-model="formData.firstName"
                type="text"
                id="firstName"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Ingrese el nombre"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido *
              </label>
              <input
                v-model="formData.lastName"
                type="text"
                id="lastName"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Ingrese el apellido"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo Electrónico *
              </label>
              <input
                v-model="formData.email"
                type="email"
                id="email"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="ejemplo@correo.com"
              />
            </div>

            <!-- Phone -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                v-model="formData.phone"
                type="tel"
                id="phone"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="+1234567890"
              />
            </div>

            <!-- Birth Date -->
            <div>
              <label for="birthDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                v-model="formData.birthDate"
                type="date"
                id="birthDate"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            <!-- Gender -->
            <div>
              <label for="gender" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Género
              </label>
              <select
                v-model="formData.gender"
                id="gender"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">Seleccionar género</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Academic Information Section -->
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AcademicCapIcon class="h-5 w-5 mr-2 text-green-500" />
            Información Académica
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Student ID -->
            <div>
              <label for="studentId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID de Estudiante
              </label>
              <input
                v-model="formData.studentId"
                type="text"
                id="studentId"
                :disabled="isEditing"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
                placeholder="Auto-generado"
              />
            </div>

            <!-- Enrollment Date -->
            <div>
              <label for="enrollmentDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Inscripción *
              </label>
              <input
                v-model="formData.enrollmentDate"
                type="date"
                id="enrollmentDate"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            <!-- Level -->
            <div>
              <label for="level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nivel *
              </label>
              <select
                v-model="formData.level"
                id="level"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">Seleccionar nivel</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
                <option value="professional">Profesional</option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado *
              </label>
              <select
                v-model="formData.status"
                id="status"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="graduated">Graduado</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
          </div>

          <!-- Instruments -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instrumentos
            </label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="instrument in availableInstruments"
                :key="instrument.value"
                class="flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <input
                  v-model="formData.instruments"
                  type="checkbox"
                  :value="instrument.value"
                  class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ instrument.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Contact Information Section -->
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MapPinIcon class="h-5 w-5 mr-2 text-red-500" />
            Información de Contacto
          </h4>
          
          <div class="grid grid-cols-1 gap-4">
            <!-- Address -->
            <div>
              <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <textarea
                v-model="formData.address"
                id="address"
                rows="3"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Ingrese la dirección completa"
              />
            </div>

            <!-- Emergency Contact -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="emergencyContactName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contacto de Emergencia
                </label>
                <input
                  v-model="formData.emergencyContact.name"
                  type="text"
                  id="emergencyContactName"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Nombre del contacto"
                />
              </div>
              
              <div>
                <label for="emergencyContactPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono de Emergencia
                </label>
                <input
                  v-model="formData.emergencyContact.phone"
                  type="tel"
                  id="emergencyContactPhone"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <DocumentTextIcon class="h-5 w-5 mr-2 text-purple-500" />
            Notas Adicionales
          </h4>
          
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observaciones
            </label>
            <textarea
              v-model="formData.notes"
              id="notes"
              rows="4"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Notas adicionales sobre el estudiante..."
            />
          </div>
        </div>
      </form>
    </template>
  </GlobalModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  UserIcon,
  AcademicCapIcon,
  MapPinIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline';
import GlobalModal from '../ui/GlobalModal.vue';

export interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  studentId?: string;
  enrollmentDate: string;
  level: string;
  status: string;
  instruments: string[];
  address?: string;
  emergencyContact: {
    name?: string;
    phone?: string;
  };
  notes?: string;
}

interface Props {
  isOpen: boolean;
  student?: Student | null;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  student: null,
  isLoading: false
});

const emit = defineEmits<{
  close: [];
  submit: [student: Student];
}>();

// State
const formData = ref<Student>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: '',
  studentId: '',
  enrollmentDate: new Date().toISOString().split('T')[0],
  level: '',
  status: 'active',
  instruments: [],
  address: '',
  emergencyContact: {
    name: '',
    phone: ''
  },
  notes: ''
});

// Available instruments
const availableInstruments = [
  { value: 'piano', label: 'Piano' },
  { value: 'guitar', label: 'Guitarra' },
  { value: 'violin', label: 'Violín' },
  { value: 'drums', label: 'Batería' },
  { value: 'bass', label: 'Bajo' },
  { value: 'saxophone', label: 'Saxofón' },
  { value: 'flute', label: 'Flauta' },
  { value: 'trumpet', label: 'Trompeta' },
  { value: 'voice', label: 'Canto' },
];

// Computed
const isEditing = computed(() => !!props.student?.id);

const modalTitle = computed(() => 
  isEditing.value ? 'Editar Estudiante' : 'Crear Nuevo Estudiante'
);

const modalSubtitle = computed(() => 
  isEditing.value 
    ? `Modificar información de ${props.student?.firstName} ${props.student?.lastName}`
    : 'Ingrese los datos del nuevo estudiante'
);

// Methods
const resetForm = () => {
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    studentId: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    level: '',
    status: 'active',
    instruments: [],
    address: '',
    emergencyContact: {
      name: '',
      phone: ''
    },
    notes: ''
  };
};

const loadStudentData = () => {
  if (props.student) {
    formData.value = {
      ...props.student,
      emergencyContact: {
        ...props.student.emergencyContact
      }
    };
  } else {
    resetForm();
  }
};

const validateForm = (): boolean => {
  const required = ['firstName', 'lastName', 'email', 'enrollmentDate', 'level', 'status'];
  
  for (const field of required) {
    if (!formData.value[field as keyof Student]) {
      alert(`El campo ${field} es requerido`);
      return false;
    }
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.value.email)) {
    alert('Ingrese un correo electrónico válido');
    return false;
  }
  
  return true;
};

const handleSubmit = () => {
  if (!validateForm()) return;
  
  const studentData: Student = {
    ...formData.value,
    // Generate student ID if creating new student
    studentId: formData.value.studentId || `STU-${Date.now()}`,
  };
  
  emit('submit', studentData);
};

const handleClose = () => {
  emit('close');
};

// Watch for prop changes
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadStudentData();
  }
});

watch(() => props.student, () => {
  if (props.isOpen) {
    loadStudentData();
  }
});
</script>

<style scoped>
/* Custom styles for better form appearance */
.form-section {
  @apply bg-gray-50 dark:bg-gray-800 p-4 rounded-lg;
}

.form-section h4 {
  @apply text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center;
}

.form-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

/* Checkbox styles */
input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* Accessibility improvements */
input:focus,
select:focus,
textarea:focus {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

/* Validation styles */
input:invalid {
  @apply border-red-300 focus:border-red-500 focus:ring-red-500;
}

input:valid {
  @apply border-green-300 focus:border-green-500 focus:ring-green-500;
}
</style>