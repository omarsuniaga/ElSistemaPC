<template>
  <footer class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40">
    <div class="grid" :class="[navigationItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4']">
      <!-- Renderizamos dinámicamente los elementos de navegación según el rol -->
      <router-link 
        v-for="item in navigationItems" 
        :key="item.path" 
        :to="item.path" 
        class="flex flex-col items-center justify-center text-xs space-y-1 py-3"
        :class="[currentRoute.includes(item.path) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']"
        active-class="text-primary-600 dark:text-primary-400"
      >
        <component 
          :is="item.icon" 
          :class="[currentRoute.includes(item.path) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']" 
          class="h-6 w-6" 
        />
        <span>{{ item.label }}</span>
      </router-link>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()
const currentRoute = computed(() => route.path)

// Items de navegación basados en el rol del usuario
const navigationItems = computed(() => {
  // Elementos comunes a todos los roles
  const commonItems = [
    {
      path: '/home',
      label: 'Inicio',
      icon: HomeIcon
    }
  ]

  // Para directores
  if (authStore.isDirector) {
    return [
      ...commonItems,
      {
        path: '/students',
        label: 'Alumnos',
        icon: UserGroupIcon
      },
      {
        path: '/classes',
        label: 'Clases',
        icon: AcademicCapIcon
      },
      {
        path: '/attendance',
        label: 'Asistencia',
        icon: ClipboardDocumentListIcon
      },
      {
        path: '/profile',
        label: 'Perfil',
        icon: UserIcon
      }
    ]
  }
  
  // Para maestros
  else if (authStore.isTeacher) {
    return [
      ...commonItems,
      {
        path: '/students',
        label: 'Alumnos',
        icon: UserGroupIcon
      },
      {
        path: '/attendance',
        label: 'Asistencia',
        icon: ClipboardDocumentListIcon
      },
      {
        path: '/schedule',
        label: 'Horarios',
        icon: ClockIcon
      },
      {
        path: '/profile',
        label: 'Perfil',
        icon: UserIcon
      }
    ]
  }
  
  // Para administradores u otros roles
  else {
    return [
      ...commonItems,
      {
        path: '/profile',
        label: 'Perfil',
        icon: UserIcon
      },
      {
        path: '/settings',
        label: 'Ajustes',
        icon: UserIcon
      }
    ]
  }
})
</script>

<style scoped>
router-link-active {
  @apply text-primary-600 dark:text-primary-400;
}
</style>