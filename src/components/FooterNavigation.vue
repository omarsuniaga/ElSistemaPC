<template>
  <footer class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40">
    <div class="grid grid-cols-5 h-16">
      <router-link 
        to="/home" 
        class="flex flex-col items-center justify-center text-xs space-y-1"
        :class="[currentRoute.includes('/home') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']"
        active-class="text-primary-600 dark:text-primary-400"
      >
        <HomeIcon :class="[currentRoute.includes('/home') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']" class="h-6 w-6" />
        <span>Inicio</span>
      </router-link>
      
      <router-link 
        to="/students" 
        class="flex flex-col items-center justify-center text-xs space-y-1"
        :class="[currentRoute.includes('/students') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']"
        active-class="text-primary-600 dark:text-primary-400"
      >
        <UserGroupIcon :class="[currentRoute.includes('/students') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']" class="h-6 w-6" />
        <span>Alumnos</span>
      </router-link>
      
      <router-link 
        to="/classes" 
        class="flex flex-col items-center justify-center text-xs space-y-1"
        :class="[currentRoute.includes('/classes') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']"
        active-class="text-primary-600 dark:text-primary-400"
      >
        <AcademicCapIcon :class="[currentRoute.includes('/classes') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']" class="h-6 w-6" />
        <span>Clases</span>
      </router-link>
      
      <router-link 
        to="/teachers" 
        class="flex flex-col items-center justify-center text-xs space-y-1"
        :class="[currentRoute.includes('/teachers') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']"
        active-class="text-primary-600 dark:text-primary-400"
      >
        <UserIcon :class="[currentRoute.includes('/teachers') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']" class="h-6 w-6" />
        <span>Profesores</span>
      </router-link>
      
      <router-link 
        to="/attendance" 
        class="flex flex-col items-center justify-center text-xs space-y-1"
        :class="[currentRoute.includes('/attendance') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']"
        active-class="text-primary-600 dark:text-primary-400"
      >
        <ClipboardDocumentListIcon :class="[currentRoute.includes('/attendance') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400']" class="h-6 w-6" />
        <span>Asistencia</span>
      </router-link>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  UserIcon,
  ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const currentRoute = computed(() => route.path)
</script>

<style scoped>
router-link-active {
  @apply text-primary-600 dark:text-primary-400;
}
</style>