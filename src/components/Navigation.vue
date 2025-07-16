<!-- /src/components/Navigation.vue -->
<template>
  <!-- Botón "Atrás" que aparece en todas las páginas excepto la principal -->
  <div
    v-if="shouldShowNavigation && route.path !== '/' && route.path !== '/dashboard'"
    class="fixed top-16 left-2 z-50"
  >
    <button
      class="flex items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label="Volver atrás"
      @click="router.back()"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  </div>

  <!-- Navegación dinámica usando RBAC -->
  <nav
    v-if="shouldShowNavigation"
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
    aria-label="Navegación principal"
  >
    <div class="container mx-auto px-2">
      <DynamicNavigation
        orientation="horizontal"
        :compact="true"
        class="py-1"
        @nav-click="handleNavClick"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import DynamicNavigation from './Navigation/DynamicNavigation.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Lista de rutas públicas donde no se debe mostrar la navegación
const publicRoutes = ['/login', '/register', '/reset-password', '/forgot-password'];

// Computed para determinar si la navegación debe mostrarse
const shouldShowNavigation = computed(() => {
  // No mostrar si el usuario no está autenticado
  if (!authStore.isLoggedIn) return false;

  // No mostrar en rutas públicas
  if (publicRoutes.includes(route.path)) return false;

  return true;
});

// Handle navigation click events
const handleNavClick = (item: any) => {
  console.log('Navigation clicked:', item);
};
</script>

<style scoped>
/* Estilos para integrar la navegación dinámica en el footer */
:deep(.dynamic-navigation.horizontal .navigation-items) {
  @apply justify-around;
}

:deep(.dynamic-navigation.horizontal .nav-link) {
  @apply min-w-0 flex-1 max-w-none;
}

:deep(.dynamic-navigation.horizontal .nav-link.active) {
  @apply bg-blue-50 text-blue-600 relative;
}

:deep(.dynamic-navigation.horizontal .nav-link.active::before) {
  content: "";
  @apply absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full;
}
</style>
