<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 class="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">¡Oops!</h1>
      <p class="text-xl mb-6">Parece que ha ocurrido un error.</p>
      <p class="text-lg mb-8">La página que intentas cargar no está disponible o ha ocurrido un problema inesperado.</p>
      <button
        @click="$router.push('/dashboard')"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out"
      >
        Volver al Dashboard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
/* Puedes añadir estilos específicos aquí si es necesario */
</style>
