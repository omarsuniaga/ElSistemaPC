<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with breadcrumb -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <!-- Breadcrumb -->
        <nav class="flex mb-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <router-link 
                to="/admin" 
                class="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                <HomeIcon class="w-4 h-4 mr-2" />
                Admin
              </router-link>
            </li>
            <li>
              <div class="flex items-center">
                <ChevronRightIcon class="w-4 h-4 text-gray-400" />
                <router-link 
                  to="/admin/teachers" 
                  class="ml-1 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  Maestros
                </router-link>
              </div>
            </li>
            <li>
              <div class="flex items-center">
                <ChevronRightIcon class="w-4 h-4 text-gray-400" />
                <span class="ml-1 text-gray-500 dark:text-gray-400">Crear Nuevo</span>
              </div>
            </li>
          </ol>
        </nav>

        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Crear Nuevo Maestro
            </h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Complete la información del maestro para registrarlo en el sistema
            </p>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <router-link
              to="/admin/teachers"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              Volver a Lista
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Creation Form Card -->
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <!-- Form Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Información del Maestro
            </h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Los campos marcados con * son obligatorios
            </p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Personal Information Section -->
              <div class="col-span-2">
                <h3 class="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <UserIcon class="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Información Personal
                </h3>
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
                  placeholder="Nombre completo del maestro"
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

              <!-- Hire Date -->
              <div>
                <label for="hireDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha de Contratación *
                </label>
                <input
                  id="hireDate"
                  v-model="form.hireDate"
                  type="date"
                  required
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
                <p v-if="errors.hireDate" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.hireDate }}</p>
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
                  placeholder="Dirección completa del maestro"
                />
              </div>

              <!-- Professional Information -->
              <div class="col-span-2 mt-6">
                <h3 class="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <AcademicCapIcon class="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Información Profesional
                </h3>
              </div>

              <!-- Specialties -->
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Especialidades *
                </label>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label
                    v-for="specialty in availableSpecialties"
                    :key="specialty.value"
                    class="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    :class="{ 'bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-600': form.specialties.includes(specialty.value) }"
                  >
                    <input
                      type="checkbox"
                      :value="specialty.value"
                      v-model="form.specialties"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <MusicalNoteIcon class="w-4 h-4 text-gray-500" />
                    <span class="text-sm text-gray-900 dark:text-white">
                      {{ specialty.label }}
                    </span>
                  </label>
                </div>
                <p v-if="errors.specialties" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ errors.specialties }}</p>
              </div>

              <!-- Experience -->
              <div>
                <label for="experience" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Experiencia (años)
                </label>
                <input
                  id="experience"
                  v-model="form.experience"
                  type="text"
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Ej: 5 años enseñando piano"
                />
              </div>

              <!-- Hourly Rate -->
              <div>
                <label for="hourlyRate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tarifa por Hora
                </label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    id="hourlyRate"
                    v-model.number="form.hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    class="pl-7 mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <!-- Status -->
              <div>
                <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado *
                </label>
                <select
                  id="status"
                  v-model="form.status"
                  required
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="">Seleccionar estado</option>
                  <option value="active">Activo</option>
                  <option value="on_leave">En Licencia</option>
                  <option value="inactive">Inactivo</option>
                </select>
                <p v-if="errors.status" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.status }}</p>
              </div>

              <!-- Biography -->
              <div class="col-span-2">
                <label for="biography" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Biografía
                </label>
                <textarea
                  id="biography"
                  v-model="form.biography"
                  rows="4"
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Información sobre la formación y experiencia del maestro..."
                />
              </div>

              <!-- Qualifications Section -->
              <div class="col-span-2 mt-6">
                <h3 class="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <StarIcon class="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  Calificaciones y Títulos
                </h3>
                
                <div class="space-y-3">
                  <div 
                    v-for="(qualification, index) in form.qualifications" 
                    :key="index"
                    class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md"
                  >
                    <input
                      v-model="qualification.title"
                      type="text"
                      placeholder="Título o certificación"
                      class="flex-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                    <input
                      v-model="qualification.institution"
                      type="text"
                      placeholder="Institución"
                      class="flex-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                    <input
                      v-model.number="qualification.year"
                      type="number"
                      placeholder="Año"
                      min="1900"
                      :max="new Date().getFullYear()"
                      class="w-24 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                    <button
                      type="button"
                      @click="removeQualification(index)"
                      class="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    @click="addQualification"
                    class="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <PlusIcon class="w-4 h-4" />
                    <span>Agregar Calificación</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="mt-8 flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <router-link
                to="/admin/teachers"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </router-link>
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
                <span v-else>Crear Maestro</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  HomeIcon, 
  ChevronRightIcon, 
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  StarIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { useTeachersStore } from '../../../stores/teachers'
import { TeacherStatus, type Teacher, type Qualification } from '../../../modulos/Teachers/types/teachers'

// Router and stores
const router = useRouter()
const teachersStore = useTeachersStore()

// State
const isSubmitting = ref(false)

// Form data
const form = reactive({
  name: '',
  email: '',
  phone: '',
  hireDate: '',
  address: '',
  specialties: [] as string[],
  experience: '',
  hourlyRate: null as number | null,
  status: '' as 'active' | 'on_leave' | 'inactive' | '',
  biography: '',
  qualifications: [] as Qualification[]
})

// Form errors
const errors = reactive({
  name: '',
  email: '',
  phone: '',
  hireDate: '',
  specialties: '',
  status: ''
})

// Available specialties
const availableSpecialties = [
  { value: 'piano', label: 'Piano' },
  { value: 'guitar', label: 'Guitarra' },
  { value: 'violin', label: 'Violín' },
  { value: 'drums', label: 'Batería' },
  { value: 'voice', label: 'Canto' },
  { value: 'bass', label: 'Bajo' },
  { value: 'flute', label: 'Flauta' },
  { value: 'saxophone', label: 'Saxofón' },
  { value: 'trumpet', label: 'Trompeta' },
  { value: 'cello', label: 'Violonchelo' },
  { value: 'theory', label: 'Teoría Musical' },
  { value: 'composition', label: 'Composición' }
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

  if (!form.hireDate) {
    errors.hireDate = 'La fecha de contratación es requerida'
    isValid = false
  }

  if (form.specialties.length === 0) {
    errors.specialties = 'Debe seleccionar al menos una especialidad'
    isValid = false
  }

  if (!form.status) {
    errors.status = 'El estado es requerido'
    isValid = false
  }

  return isValid
}

const addQualification = () => {
  form.qualifications.push({
    title: '',
    institution: '',
    year: new Date().getFullYear()
  })
}

const removeQualification = (index: number) => {
  form.qualifications.splice(index, 1)
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    isSubmitting.value = true

    const teacherData = {
      uid: '', // Will be set by the backend
      id: '', // Will be set by the backend
      name: form.name,
      email: form.email,
      phone: form.phone,
      hireDate: new Date(form.hireDate),
      address: form.address,
      specialties: form.specialties,
      experience: form.experience,
      hourlyRate: form.hourlyRate,
      status: form.status as TeacherStatus,
      biography: form.biography,
      qualifications: form.qualifications.filter(q => q.title.trim() !== ''),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Note: This would need to be implemented in the teachers store
    // For now, we'll just navigate back
    console.log('Creating teacher:', teacherData)
    
    // Navigate back to teachers list
    router.push('/admin/teachers')
    
  } catch (error) {
    console.error('Error creating teacher:', error)
    // Handle error (show notification, etc.)
  } finally {
    isSubmitting.value = false
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

/* Section headers */
h3 {
  border-left: 4px solid theme('colors.blue.500');
  padding-left: 0.75rem;
}
</style>
