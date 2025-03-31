<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProfileStore } from '../store/profile'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  UserIcon,
  CogIcon,
  BellIcon,
  ClockIcon,
  TrophyIcon,
  PencilIcon,
  CameraIcon
} from '@heroicons/vue/24/outline'

const profileStore = useProfileStore()
const isLoading = ref(true)
const error = ref<string | null>(null)

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es })
}

const loadProfile = async () => {
  try {
    isLoading.value = true
    error.value = null
    await profileStore.fetchProfile()
  } catch (err: any) {
    console.error('Error loading profile:', err)
    error.value = err.message || 'Error loading profile'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadProfile()
})
</script>

<template>
  <div class="p-4 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UserIcon class="h-7 w-7 text-primary-600" />
        Mi Perfil
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Administra tu información personal y preferencias
      </p>
    </div>

    <!-- Loading / Error -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-red-700 dark:text-red-400">
      {{ error }}
      <button @click="loadProfile" class="ml-2 underline">Reintentar</button>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profileStore.profile" class="space-y-6">
      <!-- Personal Info Section -->
      <section class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 p-3 border-b border-primary-200 dark:border-primary-800">
          <UserIcon class="h-5 w-5 text-primary-700 dark:text-primary-400" />
          <h2 class="text-lg font-bold text-primary-700 dark:text-primary-400">Información Personal</h2>
        </div>
        
        <div class="p-4">
          <div class="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <!-- Profile Photo -->
            <div class="relative group">
              <img 
                :src="profileStore.profile.photoURL" 
                :alt="profileStore.profile.displayName || 'Profile photo'"
                class="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
              <button class="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md group-hover:opacity-100 opacity-0 transition-opacity">
                <CameraIcon class="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            
            <!-- Personal Details -->
            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Nombre</label>
                <p class="font-medium">{{ profileStore.profile.displayName || 'No especificado' }}</p>
              </div>
              
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Correo electrónico</label>
                <p class="font-medium">{{ profileStore.profile.email || 'No especificado' }}</p>
              </div>
              
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Teléfono</label>
                <p class="font-medium">{{ profileStore.profile.phone || 'No especificado' }}</p>
              </div>
              
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Rol</label>
                <p class="font-medium capitalize">{{ profileStore.profile.role || 'No especificado' }}</p>
              </div>
              
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Miembro desde</label>
                <p class="font-medium">{{ formatDate(profileStore.profile.createdAt) }}</p>
              </div>
              
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Último acceso</label>
                <p class="font-medium">{{ formatDate(profileStore.profile.lastLogin) }}</p>
              </div>
            </div>
          </div>
          
          <div class="mt-4 flex justify-end">
            <button class="btn btn-primary flex items-center gap-2">
              <PencilIcon class="h-4 w-4" />
              Editar perfil
            </button>
          </div>
        </div>
      </section>

      <!-- Settings Section -->
      <section class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 p-3 border-b border-primary-200 dark:border-primary-800">
          <CogIcon class="h-5 w-5 text-primary-700 dark:text-primary-400" />
          <h2 class="text-lg font-bold text-primary-700 dark:text-primary-400">Configuración</h2>
        </div>
        
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tema</label>
            <select 
              class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              v-model="profileStore.profile.preferences.theme"
            >
              <option value="system">Sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Idioma</label>
            <select 
              class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              v-model="profileStore.profile.preferences.language"
            >
              <option v-for="lang in profileStore.availableLanguages" :value="lang.code">
                {{ lang.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zona horaria</label>
            <select 
              class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              v-model="profileStore.profile.preferences.timezone"
            >
              <option v-for="tz in profileStore.availableTimezones" :value="tz">
                {{ tz }}
              </option>
            </select>
          </div>
          
          <div class="flex items-center">
            <input 
              type="checkbox" 
              id="email-notifications" 
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              v-model="profileStore.profile.preferences.emailNotifications"
            />
            <label for="email-notifications" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Notificaciones por correo
            </label>
          </div>
        </div>
        
        <div class="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
          <button 
            @click="profileStore.updateSettings(profileStore.profile.preferences)"
            class="btn btn-primary"
          >
            Guardar cambios
          </button>
        </div>
      </section>

      <!-- Activity Section -->
      <section class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 p-3 border-b border-primary-200 dark:border-primary-800">
          <ClockIcon class="h-5 w-5 text-primary-700 dark:text-primary-400" />
          <h2 class="text-lg font-bold text-primary-700 dark:text-primary-400">Actividad Reciente</h2>
        </div>
        
        <div class="p-4">
          <div v-if="profileStore.activityLogs.length > 0" class="space-y-4">
            <div 
              v-for="activity in profileStore.activityLogs.slice(0, 5)" 
              :key="activity.createdAt"
              class="p-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div class="flex justify-between">
                <p class="font-medium">{{ activity.description }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(activity.createdAt) }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-gray-500">
            No hay actividad registrada
          </div>
        </div>
      </section>

      <!-- Achievements Section -->
      <section v-if="profileStore.profile.achievements?.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 p-3 border-b border-primary-200 dark:border-primary-800">
          <TrophyIcon class="h-5 w-5 text-primary-700 dark:text-primary-400" />
          <h2 class="text-lg font-bold text-primary-700 dark:text-primary-400">Logros</h2>
        </div>
        
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="achievement in profileStore.profile.achievements" 
            :key="achievement.id"
            class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-3">
              <div class="text-2xl">{{ achievement.icon }}</div>
              <div>
                <h3 class="font-bold">{{ achievement.title }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ achievement.description }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Obtenido el {{ formatDate(achievement.earnedAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.btn {
  transition: all 0.3s ease;
}

section {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
</style>