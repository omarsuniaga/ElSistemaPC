<template>
  <div class="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p class="text-gray-600 dark:text-gray-400">Redirigiendo...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    // Esperar a que la autenticación esté inicializada
    if (!authStore.isInitialized) {
      await authStore.checkAuth();
    }

    if (!authStore.isLoggedIn) {
      router.replace('/login');
      return;
    }

    // Redirección basada en rol
    const userRole = authStore.user?.role;
    const normalizedRole = userRole?.toLowerCase() || '';

    // Usar includes para hacer comparaciones más flexibles
    if (normalizedRole.includes('maestro') || normalizedRole.includes('teacher')) {
      router.replace('/teacher');
    } else if (normalizedRole.includes('director') || normalizedRole.includes('admin')) {
      router.replace('/admin');
    } else if (normalizedRole.includes('superusuario')) {
      router.replace('/superusuario');
    } else {
      // Si no coincide con ningún rol conocido
      console.log(`Rol no reconocido: ${userRole}, redirigiendo a dashboard`);
      router.replace('/dashboard');
    }
  } catch (error) {
    console.error('Error en redirección inicial:', error);
    router.replace('/login');
  }
});
</script>
