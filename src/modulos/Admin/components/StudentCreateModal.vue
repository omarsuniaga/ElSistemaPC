<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Background overlay -->
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="handleCancel"
      ></div>

      <!-- Modal positioning -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Modal content -->
      <div class="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white" id="modal-title">
              Crear Nuevo Estudiante
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Complete la información del estudiante para registrarlo en el sistema.
            </p>
          </div>
          <button
            @click="handleCancel"
            class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="mt-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Personal Information Section -->
            <div class="col-span-2">
              <h4 class="text-base font-medium text-gray-900 dark:text-white mb-4">
                Información Personal
              </h4>
            </div>

            <!-- Full Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre Completo *
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Nombre completo del estudiante"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.name }}</p>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo Electrónico *
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="correo@ejemplo.com"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.email }}</p>
            </div>

            <!-- Phone -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Teléfono *
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="(123) 456-7890"
              />
              <p v-if="errors.phone" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.phone }}</p>
            </div>

            <!-- Birth Date -->
            <div>
              <label for="birthDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Nacimiento *
              </label>
              <input
                id="birthDate"
                v-model="form.birthDate"
                type="date"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <p v-if="errors.birthDate" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.birthDate }}</p>
            </div>

            <!-- Address -->
            <div class="col-span-2">
              <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dirección
              </label>
              <textarea
                id="address"
                v-model="form.address"
                rows="2"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Dirección completa del estudiante"
              />
            </div>

            <!-- Parent/Guardian Information -->
            <div class="col-span-2 mt-6">
              <h4 class="text-base font-medium text-gray-900 dark:text-white mb-4">
                Información del Padre/Tutor
              </h4>
            </div>

            <!-- Parent Name -->
            <div>
              <label for="parentName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Padre/Tutor *
              </label>
              <input
                id="parentName"
                v-model="form.parentName"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Nombre completo del padre o tutor"
              />
              <p v-if="errors.parentName" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.parentName }}</p>
            </div>

            <!-- Parent Phone -->
            <div>
              <label for="parentPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Teléfono del Padre/Tutor *
              </label>
              <input
                id="parentPhone"
                v-model="form.parentPhone"
                type="tel"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="(123) 456-7890"
              />
              <p v-if="errors.parentPhone" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.parentPhone }}</p>
            </div>

            <!-- Parent Email -->
            <div class="col-span-2">
              <label for="parentEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo del Padre/Tutor
              </label>
              <input
                id="parentEmail"
                v-model="form.parentEmail"
                type="email"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="correo@ejemplo.com"
              />
              <p v-if="errors.parentEmail" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.parentEmail }}</p>
            </div>

            <!-- Academic Information -->
            <div class="col-span-2 mt-6">
              <h4 class="text-base font-medium text-gray-900 dark:text-white mb-4">
                Información Académica
              </h4>
            </div>

            <!-- Instruments -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instrumentos de Interés *
              </label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label
                  v-for="instrument in availableInstruments"
                  :key="instrument.value"
                  class="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="instrument.value"
                    v-model="form.instruments"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ instrument.label }}
                  </span>
                </label>
              </div>
              <p v-if="errors.instruments" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.instruments }}</p>
            </div>

            <!-- Grade Level -->
            <div>
              <label for="grade" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nivel *
              </label>
              <select
                id="grade"
                v-model="form.grade"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="">Seleccionar nivel</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
              <p v-if="errors.grade" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.grade }}</p>
            </div>

            <!-- Status -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado Inicial
              </label>
              <select
                id="status"
                v-model="form.status"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notas Adicionales
              </label>
              <textarea
                id="notes"
                v-model="form.notes"
                rows="3"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Información adicional sobre el estudiante..."
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSubmitting" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando...
              </span>
              <span v-else>Crear Estudiante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useAdminStudentsStore } from '../store/adminStudents'
import type { Student } from '../store/adminStudents'

// Emits
interface Emits {
  close: []
  created: [student: Student]
}

const emit = defineEmits<Emits>()

// Store
const studentsStore = useAdminStudentsStore()

// State
const isSubmitting = ref(false)

// Form data
const form = reactive({
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  address: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  instruments: [] as string[],
  grade: '' as 'beginner' | 'intermediate' | 'advanced' | '',
  status: 'pending' as 'active' | 'inactive' | 'pending',
  notes: ''
})

// Form errors
const errors = reactive({
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  instruments: '',
  grade: ''
})

// Available instruments
const availableInstruments = [
  { value: 'piano', label: 'Piano' },
  { value: 'guitar', label: 'Guitarra' },
  { value: 'violin', label: 'Violín' },
  { value: 'drums', label: 'Batería' },
  { value: 'voice', label: 'Canto' },
  { value: 'bass', label: 'Bajo' },
  { value: 'flute', label: 'Flauta' },
  { value: 'saxophone', label: 'Saxofón' },
  { value: 'trumpet', label: 'Trompeta' },
  { value: 'cello', label: 'Violonchelo' }
]

// Methods
const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let isValid = true

  // Required fields validation
  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido'
    isValid = false
  }

  if (!form.email.trim()) {
    errors.email = 'El correo electrónico es requerido'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'El correo electrónico no es válido'
    isValid = false
  }

  if (!form.phone.trim()) {
    errors.phone = 'El teléfono es requerido'
    isValid = false
  }

  if (!form.birthDate) {
    errors.birthDate = 'La fecha de nacimiento es requerida'
    isValid = false
  }

  if (!form.parentName.trim()) {
    errors.parentName = 'El nombre del padre/tutor es requerido'
    isValid = false
  }

  if (!form.parentPhone.trim()) {
    errors.parentPhone = 'El teléfono del padre/tutor es requerido'
    isValid = false
  }

  if (form.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) {
    errors.parentEmail = 'El correo electrónico del padre/tutor no es válido'
    isValid = false
  }

  if (form.instruments.length === 0) {
    errors.instruments = 'Debe seleccionar al menos un instrumento'
    isValid = false
  }

  if (!form.grade) {
    errors.grade = 'El nivel es requerido'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    isSubmitting.value = true

    const studentData = {
      ...form,
      birthDate: new Date(form.birthDate),
      enrollmentDate: new Date(),
      classes: [],
      createdBy: 'current_user_id' // Replace with actual user ID
    }

    const newStudent = await studentsStore.createStudent(studentData)
    emit('created', newStudent)
    
  } catch (error) {
    console.error('Error creating student:', error)
    // Handle error (show notification, etc.)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('close')
}
</script>
<script>
export default {
  components: {
    name: 'StudentCreateModal',
  }
}
</script>
<style scoped>
/* Custom styles for form elements */
input:focus,
select:focus,
textarea:focus {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

/* Checkbox styles */
input[type="checkbox"]:checked {
  @apply bg-blue-600 border-blue-600;
}

/* Loading spinner */
.loading-spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
