<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  ClipboardDocumentCheckIcon, 
  UserCircleIcon,
  BookmarkSquareIcon,
  ViewColumnsIcon,
  MusicalNoteIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === path
  }
  return route.path.startsWith(path)
}

const navigation = computed(() => {
  const baseNavigation = [
    { name: 'Inicio', icon: MusicalNoteIcon, to: '/', ariaLabel: 'Ir a la página principal' },
    { name: 'Alumnos', icon: UserGroupIcon, to: '/students', ariaLabel: 'Ir a gestión de alumnos' },
    { name: 'Maestros', icon: AcademicCapIcon, to: '/teachers', ariaLabel: 'Ir a gestión de maestros' },
    { name: 'Asistencias', icon: ClipboardDocumentCheckIcon, to: '/attendance', ariaLabel: 'Ir a control de asistencias' },
    { name: 'Clases', icon: BookmarkSquareIcon, to: '/classes', ariaLabel: 'Ir a gestión de clases' },
    { name: 'Perfil', icon: UserCircleIcon, to: '/profile', ariaLabel: 'Ir a tu perfil' },
  ]

  return baseNavigation
})
</script>

<template>
  <nav 
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
    aria-label="Navegación principal"
  >
    <div class="container mx-auto px-2">
      <div class="flex justify-around py-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.to"
          :aria-label="item.ariaLabel"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          class="flex flex-col items-center  rounded-md transition-all duration-200 relative"
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