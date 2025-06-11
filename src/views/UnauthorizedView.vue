<template>
  <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <svg class="mx-auto h-24 w-24 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Acceso No Autorizado
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ errorMessage }}
        </p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div class="space-y-6">
          <div class="text-center">
            <p class="text-gray-700">
              No tienes permisos para acceder a este recurso.
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Si crees que esto es un error, contacta al administrador del sistema.
            </p>
          </div>

          <div class="space-y-3">
            <button 
              @click="goBack"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver Atrás
            </button>
            
            <button 
              @click="goToLogin"
              class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ir al Login
            </button>
          </div>

          <!-- Información adicional para depuración -->
          <div v-if="showDebugInfo" class="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 class="text-sm font-medium text-gray-900 mb-2">Información de Depuración</h3>
            <div class="text-xs text-gray-600 space-y-1">
              <p><strong>Usuario:</strong> {{ user?.email || 'No autenticado' }}</p>
              <p><strong>Rol:</strong> {{ user?.role || 'Sin rol' }}</p>
              <p><strong>Ruta solicitada:</strong> {{ requestedRoute }}</p>
              <p><strong>Error:</strong> {{ errorType }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/modulos/Auth/composables/useAuth';

const router = useRouter();
const route = useRoute();
const { user } = useAuth();

const showDebugInfo = ref(false);
const requestedRoute = ref('');
const errorType = ref('');

const errorMessage = computed(() => {
  const error = route.query.error as string;
  switch (error) {
    case 'access_denied':
      return 'No tienes permisos para acceder a esta página.';
    case 'rbac_error':
      return 'Error del sistema de permisos. Intenta de nuevo más tarde.';
    default:
      return 'Acceso denegado.';
  }
});

onMounted(() => {
  // Capturar información para depuración
  requestedRoute.value = (route.query.from as string) || 'Desconocida';
  errorType.value = (route.query.error as string) || 'access_denied';
  
  // Mostrar info de depuración en desarrollo
  showDebugInfo.value = import.meta.env.DEV;
});

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/login');
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>
