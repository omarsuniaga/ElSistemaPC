<template>
  <footer class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40">
    <div class="grid" :class="[navigationItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4']">
      <!-- Renderizamos dinámicamente los elementos de navegación según el rol -->
      <router-link 
        v-for="item in navigationItems" 
        :key="item.to" 
        :to="item.to" 
        class="flex flex-col items-center justify-center text-xs space-y-1 py-3"
        :class="[currentRoute.includes(item.to) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']"
        active-class="text-primary-600 dark:text-primary-400"
        :aria-label="item.ariaLabel"
      >
        <component 
          :is="item.icon" 
          :class="[currentRoute.includes(item.to) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']" 
          class="h-6 w-6" 
        />
        <span>{{ item.name }}</span>
      </router-link>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { teacherMenuItems, adminMenuItems } from '../modulos/Teachers/constants/menuItems'
import { HomeIcon, UserIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()
const currentRoute = computed(() => route.path)

// Items de navegación basados en el rol del usuario - usando las mismas constantes que Navigation.vue
const navigationItems = computed(() => {
  // Para directores
  if (authStore.isDirector) {
    // Mostrar hasta 5 elementos del menú de admin
    return adminMenuItems.slice(0, 5);
  }
  
  // Para maestros
  else if (authStore.isTeacher) {
    // Mostrar hasta 5 elementos del menú de maestros
    return teacherMenuItems.slice(0, 5);
  }
  
  // Para administradores u otros roles
  else {
    return [
      {
        name: 'Inicio',
        icon: HomeIcon,
        to: '/',
        ariaLabel: 'Inicio'
      },
      {
        name: 'Perfil',
        icon: UserIcon,
        to: '/profile',
        ariaLabel: 'Mi perfil'
      }
    ];
  }
})
</script>

<style scoped>
router-link-active {
  @apply text-primary-600 dark:text-primary-400;
}
</style>