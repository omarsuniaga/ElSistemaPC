<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <div>
        <h2 class="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Crear Cuenta
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Completa el formulario para registrarte en la plataforma
        </p>

        <!-- Steps indicator -->
        <div class="mt-4 flex justify-center">
          <ol class="flex items-center w-full">
            <li
              class="flex w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block"
              :class="{
                'text-primary-600 dark:text-primary-400': currentStep >= 1,
                'text-gray-400 dark:text-gray-600': currentStep < 1,
              }"
            >
              <span
                class="flex items-center justify-center w-8 h-8 rounded-full shrink-0 border transition-all"
                :class="
                  currentStep >= 1
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                "
              >
                1
              </span>
            </li>
            <li
              class="flex items-center"
              :class="{
                'text-primary-600 dark:text-primary-400': currentStep >= 2,
                'text-gray-400 dark:text-gray-600': currentStep < 2,
              }"
            >
              <span
                class="flex items-center justify-center w-8 h-8 rounded-full shrink-0 border transition-all"
                :class="
                  currentStep >= 2
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                "
              >
                2
              </span>
            </li>
          </ol>
        </div>
      </div>

      <!-- Mensaje de éxito -->
      <div v-if="successMessage" class="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800 dark:text-green-200">
              {{ successMessage }}
            </p>
            <p class="mt-2 text-xs text-green-700 dark:text-green-300">
              Redirigiendo a la página de inicio de sesión...
            </p>
          </div>
        </div>
      </div>

      <!-- Formulario de registro -->
      <form v-else class="mt-4 space-y-6" @submit.prevent="handleRegister">
        <!-- Paso 1: Información básica -->
        <div v-if="currentStep === 1">
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre completo
              </label>
              <div class="mt-1">
                <input
                  id="name"
                  v-model="formData.name"
                  name="name"
                  type="text"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Tu nombre completo"
                  :disabled="isLoading"
                />
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo electrónico
              </label>
              <div class="mt-1">
                <input
                  id="email"
                  v-model="formData.email"
                  name="email"
                  type="email"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="tu.email@ejemplo.com"
                  :disabled="isLoading"
                />
              </div>
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Teléfono (opcional)
              </label>
              <div class="mt-1">
                <input
                  id="phone"
                  v-model="formData.phone"
                  name="phone"
                  type="tel"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="+52 123 456 7890"
                  :disabled="isLoading"
                />
              </div>
            </div>

            <div>
              <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol
              </label>
              <div class="mt-1">
                <select
                  id="role"
                  v-model="formData.role"
                  name="role"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  :disabled="isLoading"
                >
                  <option value="Maestro">Maestro</option>
                  <option value="Estudiante">Estudiante</option>
                </select>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tu cuenta deberá ser aprobada por un administrador.
              </p>
            </div>
          </div>
        </div>

        <!-- Paso 2: Contraseña -->
        <div v-if="currentStep === 2">
          <div class="space-y-4">
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Contraseña
              </label>
              <div class="mt-1 relative">
                <input
                  id="password"
                  v-model="formData.password"
                  name="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  :disabled="isLoading"
                  minlength="6"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400"
                  @click="showPassword = !showPassword"
                >
                  <EyeIcon v-if="!showPassword" class="h-5 w-5" />
                  <EyeSlashIcon v-else class="h-5 w-5" />
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Mínimo 6 caracteres.</p>
            </div>

            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirmar contraseña
              </label>
              <div class="mt-1 relative">
                <input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  name="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  :disabled="isLoading"
                  minlength="6"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <EyeIcon v-if="!showConfirmPassword" class="h-5 w-5" />
                  <EyeSlashIcon v-else class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje de error -->
        <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationCircleIcon class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800 dark:text-red-200">
                {{ error }}
              </p>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex flex-col-reverse sm:flex-row justify-between gap-3">
          <button
            v-if="currentStep > 1"
            type="button"
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            :disabled="isLoading"
            @click="prevStep"
          >
            Anterior
          </button>

          <div class="flex-1" />

          <button
            type="submit"
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
              Procesando...
            </span>
            <span v-else>
              {{ currentStep < totalSteps ? "Siguiente" : "Crear Cuenta" }}
            </span>
          </button>
        </div>

        <div class="text-center mt-4">
          <router-link
            to="/login"
            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();

const formData = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  role: 'Maestro', // Por defecto, registrarse como maestro
});

const error = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const currentStep = ref(1);
const totalSteps = 2;

// Validación del paso 1
const validateStep1 = () => {
  if (!formData.name.trim()) {
    error.value = 'Por favor, ingresa tu nombre completo';
    return false;
  }

  if (!formData.email.trim()) {
    error.value = 'Por favor, ingresa tu correo electrónico';
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    error.value = 'Por favor, ingresa un correo electrónico válido';
    return false;
  }

  return true;
};

// Validación del paso 2
const validateStep2 = () => {
  if (!formData.password) {
    error.value = 'Por favor, ingresa una contraseña';
    return false;
  }

  if (formData.password.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres';
    return false;
  }

  if (formData.password !== formData.confirmPassword) {
    error.value = 'Las contraseñas no coinciden';
    return false;
  }

  return true;
};

// Avanzar al siguiente paso
const nextStep = () => {
  error.value = '';

  if (currentStep.value === 1 && validateStep1()) {
    currentStep.value = 2;
  }
};

// Retroceder al paso anterior
const prevStep = () => {
  error.value = '';
  currentStep.value = 1;
};

// Manejar el registro completo
const handleRegister = async () => {
  error.value = '';

  // Validar el paso actual
  if (currentStep.value === 1) {
    if (!validateStep1()) return;
    nextStep();
    return;
  }

  // Validar el último paso
  if (!validateStep2()) return;

  isLoading.value = true;

  try {
    const result = await authStore.register(formData.email, formData.password, {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
    });

    successMessage.value =
      result.message || 'Registro exitoso. Tu cuenta está pendiente de aprobación.';
    setTimeout(() => {
      router.push('/login?registered=true');
    }, 3000);
  } catch (e: any) {
    error.value = e.message || 'Error al crear la cuenta';
  } finally {
    isLoading.value = false;
  }
};
</script>
