<template>
  <header class="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50">
    <div class="flex items-center justify-between px-4 py-2">
      <div class="flex items-center">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">El Sistema PC</h1>
      </div>
      
      <div class="flex items-center space-x-4">
        <!-- Buscador -->
        <button @click="toggleSearch" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <MagnifyingGlassIcon class="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>
        
        <!-- Menú de opciones -->
        <div class="relative">
          <button @click="toggleMenu" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <EllipsisVerticalIcon class="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
          
          <!-- Menú desplegable -->
          <div v-if="showMenu" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1">
            <router-link to="/profile" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <UserIcon class="inline-block h-5 w-5 mr-2" />
              Perfil
            </router-link>
            <router-link to="/settings" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Cog6ToothIcon class="inline-block h-5 w-5 mr-2" />
              Ajustes
            </router-link>
            <button @click="handleLogout" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowRightOnRectangleIcon class="inline-block h-5 w-5 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Barra de búsqueda -->
    <div v-if="showSearch" class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
      <div class="relative">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Buscar estudiantes..."
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="handleSearch"
        >
        <MagnifyingGlassIcon class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const showMenu = ref(false)
const showSearch = ref(false)
const searchQuery = ref('')

const toggleMenu = () => {
  showMenu.value = !showMenu.value
  if (showMenu.value) showSearch.value = false
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) showMenu.value = false
}

const handleSearch = () => {
  // Implementar lógica de búsqueda
  console.log('Buscando:', searchQuery.value)
}

const handleLogout = async () => {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}

// Cerrar menús al hacer clic fuera
const closeMenus = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenus)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
})
</script>