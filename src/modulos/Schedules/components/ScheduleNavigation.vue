<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeView = ref('')

const navigateTo = (route: string) => {
  router.push(route)
  activeView.value = route
}
</script>

<template>
  <div class="mb-6">
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-2">
      <div class="flex flex-wrap gap-2">
        <button
          @click="navigateTo('/schedule')"
          class="px-4 py-2 rounded-md transition-colors"
          :class="$route.path === '/schedule' ? 
            'bg-indigo-600 text-white' : 
            'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          Vista General
        </button>
        
        <button
          @click="navigateTo('/schedule-manager')"
          class="px-4 py-2 rounded-md transition-colors"
          :class="$route.path === '/schedule-manager' ? 
            'bg-indigo-600 text-white' : 
            'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          Gestor de Horarios
        </button>
        
        <button
          @click="navigateTo('/class-schedule')"
          class="px-4 py-2 rounded-md transition-colors"
          :class="$route.path === '/class-schedule' ? 
            'bg-indigo-600 text-white' : 
            'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          Lista de Clases
        </button>
        
        <button
          @click="navigateTo('/student-schedule')"
          class="px-4 py-2 rounded-md transition-colors"
          :class="$route.path === '/student-schedule' ? 
            'bg-indigo-600 text-white' : 
            'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          Horarios de Estudiantes
        </button>
        
        <button
          @click="navigateTo('/teacher-schedule')"
          class="px-4 py-2 rounded-md transition-colors"
          :class="$route.path === '/teacher-schedule' ? 
            'bg-indigo-600 text-white' : 
            'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          Horarios de Profesores
        </button>
      </div>
    </div>
  </div>
</template>
