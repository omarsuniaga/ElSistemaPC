<!-- /src/components/Navigation.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { teacherMenuItems, adminMenuItems } from '../modulos/Teachers/constants/menuItems'

// Use refs to store data that will be populated after component is mounted
const route = useRoute()
const isTeacher = ref(false)
const isAdminOrDirector = ref(false)
import { FunctionalComponent, HTMLAttributes, VNodeProps } from 'vue';

interface MenuItem {
  name: string;
  icon: string | FunctionalComponent<HTMLAttributes & VNodeProps, {}, any, {}>;
  to: string;
  ariaLabel: string;
}

const menuItems = ref<MenuItem[]>([])
const visibleMenuItems = computed(() => {
  // Mostrar solo los primeros 5 items para evitar sobrecarga en la interfaz móvil
  return menuItems.value.slice(0, 5)
})
const canAccessNavigation = ref(false)

// Initialize auth store only after component is mounted
onMounted(async () => {
  // Dynamic import of the auth store to ensure Pinia is initialized first
  const { useAuthStore } = await import('../stores/auth')
  const authStore = useAuthStore()
  
  // Set the data after auth store is available
  isTeacher.value = authStore.isTeacher
  isAdminOrDirector.value = authStore.isDirector || authStore.isAdmin
  
  // Asignar los items del menú según el rol
  if (isTeacher.value) {
    menuItems.value = teacherMenuItems
  } else if (isAdminOrDirector.value) {
    menuItems.value = adminMenuItems
  } else {
    // Menú básico para usuarios sin rol específico
    menuItems.value = [
      { name: 'Inicio', icon: 'HomeIcon', to: '/', ariaLabel: 'Inicio' },
      { name: 'Perfil', icon: 'UserCircleIcon', to: '/profile', ariaLabel: 'Mi perfil' }
    ]
  }
  
  canAccessNavigation.value = authStore.isAuthenticated && authStore.isApproved
})

// Función mejorada para determinar si una ruta está activa
const isActive = (path: string) => {
  // Caso especial para la ruta raíz
  if (path === '/') {
    return route.path === '/';
  }
  
  // Exact match for paths
  if (route.path === path) {
    return true;
  }
  
  // For nested routes, only activate if the current route starts with the menu path
  // and there isn't a more specific menu item that matches better
  if (route.path.startsWith(path) && path !== '/') {
    // Check if there's a more specific menu item that matches better
    const hasBetterMatch = menuItems.value.some(menuItem => {
      return menuItem.to !== path && 
             menuItem.to.startsWith(path) && 
             route.path.startsWith(menuItem.to);
    });
    
    return !hasBetterMatch;
  }
  
  return false;
}
</script>

<template>
  <nav 
    v-if="canAccessNavigation"
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
    aria-label="Navegación principal"
  >
    <div class="container mx-auto px-2">
      <div class="flex justify-around py-1">
        <router-link
          v-for="item in visibleMenuItems"
          :key="item.name"
          :to="item.to"
          :aria-label="item.ariaLabel"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          class="flex flex-col items-center p-2 rounded-md transition-all duration-200 relative"
          :class="isActive(item.to)
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'"
        >
          <component :is="item.icon" class="w-6 h-6" />
          <span class="text-xs mt-1 font-medium">{{ item.name }}</span>
          <span 
            v-if="isActive(item.to)" 
            class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full"
            aria-hidden="true"
          ></span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Puedes mover estilos comunes a un archivo global si lo prefieres */
</style>
