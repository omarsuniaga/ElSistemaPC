<template>
  <footer
    v-if="shouldShowNavigation"
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40"
  >
    <div class="grid" :class="gridCols">
      <!-- Renderizamos dinámicamente los elementos de navegación según el rol -->
      <router-link
        v-for="item in navigationItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center text-xs space-y-1 py-3 touch-action-manipulation transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        :class="[
          isRouteActive(item.to)
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'text-gray-600 dark:text-gray-400',
        ]"
        active-class="text-primary-600 dark:text-primary-400"
        :aria-label="item.ariaLabel"
        role="button"
        :aria-current="isRouteActive(item.to) ? 'page' : undefined"
      >
        <div class="relative">
          <component
            :is="item.icon"
            :class="[
              isRouteActive(item.to)
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400',
            ]"
            class="h-6 w-6 transition-colors duration-200"
          />
          <!-- Notification badge for notifications menu item -->
          <div
            v-if="
              item.to === '/teacher/notifications' &&
              authStore.isTeacher &&
              unreadNotificationsCount > 0
            "
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {{ unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount }}
          </div>
        </div>
        <span class="font-medium">{{ item.name }}</span>
      </router-link>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { teacherMenuItems, adminMenuItems } from '../modulos/Teachers/constants/menuItems';
import { superusuarioMenuItems } from '../modulos/Superusuario/constants/menuItems';
import { HomeIcon, UserIcon } from '@heroicons/vue/24/outline';
import { useGeneralNotifications } from '../modulos/Teachers/composables/useGeneralNotifications';

const route = useRoute();
const authStore = useAuthStore();

// Notification system for teachers
const { unreadCount, loadNotifications, setupRealtimeListener } = useGeneralNotifications();

const unreadNotificationsCount = computed(() => unreadCount.value);

const unsubscribe: (() => void) | null = null;

// Initialize notifications for teachers
onMounted(() => {
  if (authStore.isTeacher) {
    loadNotifications();
    setupRealtimeListener();
  }
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
// Remove unused computed property since route.path is used directly

// Determinar si la navegación debe mostrarse (ocultar en rutas públicas)
const shouldShowNavigation = computed(() => {
  // Verificar si el usuario está autenticado
  if (!authStore.isLoggedIn) return false;

  // Lista de rutas públicas donde no se debe mostrar la navegación
  const publicRoutes = ['/login', '/register', '/reset-password', '/forgot-password'];

  // No mostrar navegación en rutas públicas
  if (publicRoutes.includes(route.path)) return false;

  // Por defecto, mostrar la navegación
  return true;
});

// Determinar si una ruta está activa (para resaltarla)
const isRouteActive = (path: string) => {
  // Caso especial para la ruta raíz
  if (path === '/') {
    return route.path === '/' || route.path === '/dashboard';
  }

  // Comparación más precisa para evitar activación múltiple
  if (path !== '/') {
    // Extraer componentes de las rutas
    const routeParts = route.path.split('/').filter(Boolean);
    const itemParts = path.split('/').filter(Boolean);

    // Si la ruta del menú es exactamente igual a la ruta actual
    if (route.path === path) {
      return true;
    }

    // Si no es exacta, verificar que la ruta actual comience con la ruta del elemento del menú
    // y que sea el menú más específico para esta ruta
    if (
      routeParts.length >= itemParts.length &&
      itemParts.every((part, index) => part === routeParts[index])
    ) {
      // Verificar que no exista un ítem de menú más específico que coincida mejor
      const menuItems = [...teacherMenuItems, ...adminMenuItems, ...superusuarioMenuItems];
      const hasBetterMatch = menuItems.some((menuItem) => {
        // Convertir la ruta del menú en componentes
        const menuItemParts = menuItem.to.split('/').filter(Boolean);

        // Un menú es mejor coincidencia si:
        // 1. No es el mismo ítem que estamos evaluando
        // 2. Tiene más componentes de ruta que coinciden con la ruta actual
        // 3. Todos sus componentes coinciden con la ruta actual
        return (
          menuItem.to !== path &&
          menuItemParts.length > itemParts.length &&
          menuItemParts.every((part, idx) => part === routeParts[idx])
        );
      });

      return !hasBetterMatch;
    }

    // Caso especial para la sección de asistencia
    if (path.includes('/attendance') || path.includes('/teacher/attendance')) {
      // Verificar si estamos en alguna ruta relacionada con la asistencia
      const isAttendanceRoute = route.path.includes('/attendance');

      // Manejo especial para la ruta del calendario frente a la página de asistencia detallada
      if (path.endsWith('/attendance/calendar') || path === '/attendance') {
        // Este es el ítem de navegación principal de asistencia
        return isAttendanceRoute && !route.params.classId;
      } else if (isAttendanceRoute) {
        // Para páginas específicas de asistencia (con ID de clase)
        return route.params.classId !== undefined;
      }
    }
  }

  return false;
};

// Items de navegación basados en el rol del usuario - usando las mismas constantes que Navigation.vue
const navigationItems = computed(() => {
  // Para Superusuario - mostrar los elementos más importantes del menú
  if (authStore.isSuperusuario) {
    // Seleccionar los 5 elementos más importantes para el footer
    return [
      superusuarioMenuItems[0], // Dashboard
      superusuarioMenuItems[1], // Usuarios
      superusuarioMenuItems[2], // Roles
      superusuarioMenuItems[3], // Permisos
      superusuarioMenuItems[4], // Sistema
    ];
  }

  // Para directores o administradores
  else if (authStore.isDirector || authStore.isAdmin) {
    // Mostrar hasta 5 elementos del menú de admin
    return adminMenuItems.slice(0, 5);
  }

  // Para maestros
  else if (authStore.isTeacher) {
    // Mostrar hasta 5 elementos del menú de maestros
    return teacherMenuItems.slice(0, 5);
  }

  return [];
});

// Computed para determinar las columnas del grid dinámicamente
const gridCols = computed(() => {
  const itemCount = navigationItems.value.length;
  switch (itemCount) {
  case 3:
    return 'grid-cols-3';
  case 4:
    return 'grid-cols-4';
  case 5:
    return 'grid-cols-5';
  default:
    return 'grid-cols-4';
  }
});
</script>

<style scoped>
.router-link-active {
  color: rgb(147 51 234);
}

.dark .router-link-active {
  color: rgb(196 181 253);
}
</style>
