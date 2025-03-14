<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

// Verificar si ya está autenticado
onMounted(async () => {
  const user = await authStore.checkAuth()
  if (user) {
    router.push(route.query.redirect?.toString() || '/')
  }
})

const setDemoCredentials = () => {
  email.value = 'demo@example.com'
  password.value = 'demo123'
}

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    error.value = 'Por favor, complete todos los campos'
    return
  }

  error.value = ''
  isLoading.value = true
  
  try {
    await authStore.login(email.value, password.value)
    const redirectPath = route.query.redirect?.toString() || '/'
    router.push(redirectPath)
  } catch (e: any) {
    error.value = e.message
    console.error('Error de login:', e)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Iniciar Sesión
        </h2>
        
        <!-- Demo notice -->
        <div class="mt-2 text-center">
          <button
            @click="setDemoCredentials"
            class="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            Usar cuenta demo
          </button>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Demo: demo@example.com / demo123
          </p>
        </div>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Email</label>
            <input
              v-model="email"
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-700"
              placeholder="Email"
              :disabled="isLoading"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Contraseña</label>
            <input
              v-model="password"
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-700"
              placeholder="Contraseña"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700 dark:text-red-200">
                {{ error }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg 
                class="h-5 w-5 text-primary-500 group-hover:text-primary-400" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                aria-hidden="true"
              >
                <path 
                  fill-rule="evenodd" 
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
                  clip-rule="evenodd" 
                />
              </svg>
            </span>
            {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </div>

        <div class="text-center space-y-2">
          <router-link
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            ¿No tienes cuenta? Regístrate
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>