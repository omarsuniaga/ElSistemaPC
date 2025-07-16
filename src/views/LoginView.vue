<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div class="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Academia de Música
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Inicia sesión para continuar
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Correo electrónico</label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Correo electrónico"
              :disabled="isLoading"
            />
          </div>
          <div class="relative">
            <label for="password" class="sr-only">Contraseña</label>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña"
              :disabled="isLoading"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              @click="showPassword = !showPassword"
            >
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ showPassword ? "Ocultar" : "Mostrar" }}
              </span>
            </button>
          </div>
        </div>

        <div v-if="error" class="text-red-500 dark:text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="isLoading">
              <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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
              Iniciando sesión...
            </span>
            <span v-else>Iniciar sesión</span>
          </button>
        </div>

        <div class="text-center">
          <router-link
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            ¿No tienes una cuenta? Regístrate
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { LockClosedIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);
const showPassword = ref(false);

const handleSubmit = async () => {
  if (isLoading.value) return;

  if (!email.value || !password.value) {
    error.value = 'Por favor, complete todos los campos';
    return;
  }

  error.value = '';
  isLoading.value = true;

  try {
    const user = await authStore.login(email.value, password.value);

    // Redirigir según el rol
    if (user.role === 'Director') {
      router.push('/dashboard');
    } else if (user.role === 'Maestro') {
      router.push('/attendance');
    } else {
      router.push('/');
    }
  } catch (e: any) {
    error.value = e.message || 'Error al iniciar sesión';
  } finally {
    isLoading.value = false;
  }
};
</script>
