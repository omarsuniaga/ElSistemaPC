<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with breadcrumb -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
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
                  to="/admin/students"
                  class="ml-1 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  Estudiantes
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
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Crear Nuevo Estudiante</h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Complete la información del estudiante para registrarlo en el sistema
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <router-link
              to="/admin/students"
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
        <div
          class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <!-- Form Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Información del Estudiante
            </h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Los campos marcados con * son obligatorios
            </p>
          </div>

          <!-- Form -->
          <form class="p-6" @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Personal Information Section -->
              <div class="col-span-2">
                <h3
                  class="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                >
                  <UserIcon class="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Información Personal
                </h3>
              </div>

              <!-- Full Name -->
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.name }}
                </p>
              </div>

              <!-- Email -->
              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                <p v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.email }}
                </p>
              </div>

              <!-- Phone -->
              <div>
                <label
                  for="phone"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                <p v-if="errors.phone" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.phone }}
                </p>
              </div>

              <!-- Birth Date -->
              <div>
                <label
                  for="birthDate"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Fecha de Nacimiento *
                </label>
                <input
                  id="birthDate"
                  v-model="form.birthDate"
                  type="date"
                  required
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
                <p v-if="errors.birthDate" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.birthDate }}
                </p>
              </div>

              <!-- Address -->
              <div class="col-span-2">
                <label
                  for="address"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                <h3
                  class="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                >
                  <UsersIcon class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Información del Padre/Tutor
                </h3>
              </div>

              <!-- Parent Name -->
              <div>
                <label
                  for="parentName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                <p v-if="errors.parentName" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.parentName }}
                </p>
              </div>

              <!-- Parent Phone -->
              <div>
                <label
                  for="parentPhone"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                <p v-if="errors.parentPhone" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.parentPhone }}
                </p>
              </div>

              <!-- Parent Email -->
              <div class="col-span-2">
                <label
                  for="parentEmail"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Correo del Padre/Tutor
                </label>
                <input
                  id="parentEmail"
                  v-model="form.parentEmail"
                  type="email"
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="correo@ejemplo.com"
                />
                <p v-if="errors.parentEmail" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.parentEmail }}
                </p>
              </div>

              <!-- Academic Information -->
              <div class="col-span-2 mt-6">
                <h3
                  class="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                >
                  <AcademicCapIcon class="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Información Académica
                </h3>
              </div>

              <!-- Instruments -->
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Instrumentos
                </label>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label
                    v-for="instrument in availableInstruments"
                    :key="instrument.value"
                    class="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    :class="{
                      'bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-600':
                        form.instruments.includes(instrument.value),
                    }"
                  >
                    <input
                      v-model="form.instruments"
                      type="checkbox"
                      :value="instrument.value"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <MusicalNoteIcon class="w-4 h-4 text-gray-500" />
                    <span class="text-sm text-gray-900 dark:text-white">
                      {{ instrument.label }}
                    </span>
                  </label>
                </div>
                <p v-if="errors.instruments" class="mt-2 text-sm text-red-600 dark:text-red-400">
                  {{ errors.instruments }}
                </p>
              </div>

              <!-- Grade Level -->
              <div>
                <label
                  for="grade"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                <p v-if="errors.grade" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.grade }}
                </p>
              </div>

              <!-- Status -->
              <div>
                <label
                  for="status"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                <label
                  for="notes"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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

            <!-- Form Actions -->
            <div
              class="mt-8 flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600"
            >
              <router-link
                to="/admin/students"
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
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creando...
                </span>
                <span v-else>Crear Estudiante</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import {
  HomeIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  UserIcon,
  UsersIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
} from '@heroicons/vue/24/outline';
import { useAdminStudentsStore } from '../store/adminStudents';
import type { Student } from '../store/adminStudents';

// Router and stores
const router = useRouter();
const studentsStore = useAdminStudentsStore();

// State
const isSubmitting = ref(false);

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
  notes: '',
});

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
  grade: '',
});

// Available instruments
const availableInstruments = []; //debemos iterar los instrumentos desde la base de datos


// Methods
const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = '';
  });

  let isValid = true;

  // Required fields validation
  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido';
    isValid = false;
  }

  if (!form.email.trim()) {
    errors.email = 'El correo electrónico es requerido';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'El correo electrónico no es válido';
    isValid = false;
  }

  if (!form.phone.trim()) {
    errors.phone = 'El teléfono es requerido';
    isValid = false;
  }

  if (!form.birthDate) {
    errors.birthDate = 'La fecha de nacimiento es requerida';
    isValid = false;
  }

  if (!form.parentName.trim()) {
    errors.parentName = 'El nombre del padre/tutor es requerido';
    isValid = false;
  }

  if (!form.parentPhone.trim()) {
    errors.parentPhone = 'El teléfono del padre/tutor es requerido';
    isValid = false;
  }

  if (form.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) {
    errors.parentEmail = 'El correo electrónico del padre/tutor no es válido';
    isValid = false;
  }

  if (form.instruments.length === 0) {
    errors.instruments = 'Debe seleccionar al menos un instrumento';
    isValid = false;
  }

  if (!form.grade) {
    errors.grade = 'El nivel es requerido';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    isSubmitting.value = true;

    const studentData = {
      ...form,
      grade: form.grade as 'beginner' | 'intermediate' | 'advanced', // Type assertion since validation ensures it's not empty
      birthDate: new Date(form.birthDate),
      enrollmentDate: new Date(),
      classes: [],
      createdBy: 'current_user_id', // Replace with actual user ID
    };

    const newStudent = await studentsStore.createStudent(studentData);

    // Navigate to the created student's detail page or back to list
    router.push(`/admin/students/${newStudent.id}`);
  } catch (error) {
    console.error('Error creating student:', error);
    // Handle error (show notification, etc.)
  } finally {
    isSubmitting.value = false;
  }
};
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
  border-left: 4px solid theme("colors.blue.500");
  padding-left: 0.75rem;
}
</style>
