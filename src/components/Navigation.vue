<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  HomeIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  UserCircleIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()

// Definir los menús según el rol
const teacherMenuItems = [
  { 
    name: 'Inicio', 
    icon: HomeIcon, 
    to: '/teacher',
    ariaLabel: 'Panel de control del maestro'
  },
  { 
    name: 'Asistencias', 
    icon: ClipboardDocumentCheckIcon, 
    to: '/teacher/attendance',
    ariaLabel: 'Gestionar asistencias'
  },
  { 
    name: 'Horarios', 
    icon: ClockIcon, 
    to: '/teacher/schedule',
    ariaLabel: 'Ver horarios'
  },
  { 
    name: 'Perfil', 
    icon: UserCircleIcon, 
    to: '/teacher/profile',
    ariaLabel: 'Mi perfil'
  }
]

const adminMenuItems = [
  { 
    name: 'Inicio', 
    icon: HomeIcon, 
    to: '/',
    ariaLabel: 'Panel de control'
  },
  { 
    name: 'Alumnos', 
    icon: UserGroupIcon, 
    to: '/students',
    ariaLabel: 'Gestionar alumnos'
  },
  { 
    name: 'Maestros', 
    icon: AcademicCapIcon, 
    to: '/teachers',
    ariaLabel: 'Gestionar maestros'
  },
  { 
    name: 'Instrumentos', 
    icon: MusicalNoteIcon, 
    to: '/instruments',
    ariaLabel: 'Gestionar instrumentos'
  },
  { 
    name: 'Analytics', 
    icon: ChartBarIcon, 
    to: '/analytics',
    ariaLabel: 'Ver análisis'
  },
  { 
    name: 'Asistencias', 
    icon: ClipboardDocumentCheckIcon, 
    to: '/attendance',
    ariaLabel: 'Gestionar asistencias'
  },
  { 
    name: 'Clases', 
    icon: BookOpenIcon, 
    to: '/classes',
    ariaLabel: 'Gestionar clases'
  },
  { 
    name: 'Horarios', 
    icon: CalendarDaysIcon, 
    to: '/schedule',
    ariaLabel: 'Gestionar horarios'
  },
  { 
    name: 'Perfil', 
    icon: UserCircleIcon, 
    to: '/profile',
    ariaLabel: 'Mi perfil'
  }
]

// Determinar qué menú mostrar según el rol
const menuItems = computed(() => {
  return authStore.isTeacher ? teacherMenuItems : adminMenuItems
})

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === path
  }
  return route.path.startsWith(path)
}

// Verificar si el usuario puede acceder al menú de navegación
const canAccessNavigation = computed(() => {
  const user = authStore.user
  return user && user.status === 'aprobado'
})
</script>

<template>
  <!-- Solo mostrar navegación si el usuario está aprobado -->
  <nav 
    v-if="canAccessNavigation"
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
    aria-label="Navegación principal"
  >
    <div class="container mx-auto px-2">
      <div class="flex justify-around py-1">
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.to"
          :aria-label="item.ariaLabel"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          class="flex flex-col items-center p-2 rounded-md transition-all duration-200 relative"
          :class="[
            isActive(item.to)
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
              : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
          ]"
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