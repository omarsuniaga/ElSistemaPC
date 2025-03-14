<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import { useColorMode } from '@vueuse/core'
import FileUpload from '../components/FileUpload.vue'
import ReportGenerator from '../components/ReportGenerator.vue'
import { clearLocalStorageData } from '../services/attendance';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  LanguageIcon,
  GlobeAmericasIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
  CameraIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const colorMode = useColorMode()

// Establecer el modo oscuro como predeterminado
colorMode.value = 'dark';

const isLoading = ref(true)
const isEditing = ref(false)
const showReports = ref(false)
const error = ref('')

const formData = ref({
  displayName: '',
  email: '',
  phoneNumber: '',
  preferences: {
    theme: 'system',
    emailNotifications: true,
    language: 'es',
    timezone: 'America/Mexico_City'
  }
})

const handleSignOut = async () => {
  try {
    await clearLocalStorageData();
    await authStore.signOut()
    
    router.push('/login')
  } catch (err) {
    error.value = 'Error al cerrar sesión'
    console.error('Error signing out:', err)
  }
}

const handlePhotoUpload = async (files: FileList) => {
  if (!files.length) return
  
  try {
    await profileStore.uploadPhoto(files[0])
  } catch (err) {
    error.value = 'Error al subir la foto'
    console.error('Error uploading photo:', err)
  }
}

const startEditing = () => {
  if (profileStore.profile) {
    formData.value = {
      displayName: profileStore.profile.displayName,
      email: profileStore.profile.email,
      phoneNumber: profileStore.profile.phoneNumber || '',
      preferences: { ...profileStore.profile.preferences }
    }
  }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  error.value = ''
}

const handleSubmit = async () => {
  try {
    await profileStore.updateProfile({
      displayName: formData.value.displayName,
      email: formData.value.email,
      phoneNumber: formData.value.phoneNumber
    })
    
    await profileStore.updateSettings(formData.value.preferences)
    
    isEditing.value = false
    error.value = ''
  } catch (err) {
    error.value = 'Error al actualizar el perfil'
    console.error('Error updating profile:', err)
  }
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await profileStore.fetchProfile()
    if (profileStore.profile) {
      formData.value = {
        displayName: profileStore.profile.displayName,
        email: profileStore.profile.email,
        phoneNumber: profileStore.profile.phoneNumber || '',
        preferences: { ...profileStore.profile.preferences }
      }
    } else {
      throw new Error('No se pudo cargar el perfil')
    }
  } catch (err) {
    error.value = 'Error al cargar el perfil'
    console.error('Error loading profile:', err)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="py-6">
    <div class="flex justify-between items-start mb-6">
      <h1 class="text-2xl font-bold">Mi Perfil</h1>
      <div class="flex gap-3">
        <button 
          v-if="!isEditing"
          @click="showReports = !showReports"
          class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          title="Informes"
        >
          <DocumentTextIcon class="w-5 h-5" />
          <span class="hidden sm:inline">{{ showReports ? 'Ver Perfil' : 'Informes' }}</span>
        </button>
        <button 
          v-if="!isEditing && !showReports"
          @click="startEditing"
          class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          title="Editar Perfil"
        >
          <PencilSquareIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Editar Perfil</span>
        </button>
        <button 
          @click="handleSignOut"
          class="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          title="Cerrar Sesión"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error State -->
    <div 
      v-else-if="error" 
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4"
    >
      {{ error }}
    </div>

    <!-- Reports View -->
    <ReportGenerator v-else-if="showReports" />

    <!-- Profile View -->
    <div v-else-if="profileStore.profile" class="space-y-6">
      <!-- Profile Header -->
      <div class="card">
        <div class="flex items-center gap-4">
          <div class="relative">
            <img
              :src="profileStore.profile.photoURL"
              :alt="profileStore.profile.displayName"
              class="w-24 h-24 rounded-full object-cover"
            />
            <div class="absolute -bottom-2 -right-2">
              <FileUpload
                accept="image/*"
                @select="handlePhotoUpload"
              >
                <template #default>
                  <button
                    type="button"
                    class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <CameraIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </template>
              </FileUpload>
            </div>
          </div>
          <div>
            <h2 class="text-xl font-semibold">
              {{ profileStore.profile.displayName }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ profileStore.profile.email }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Última conexión: {{ new Date(profileStore.profile.lastLogin || '').toLocaleString() }}
            </p>
          </div>
        </div>
      </div>

      <form v-if="isEditing" @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Personal Information -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Información Personal</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nombre</label>
              <input
                v-model="formData.displayName"
                type="text"
                class="input"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Email</label>
              <input
                v-model="formData.email"
                type="email"
                class="input"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Teléfono</label>
              <input
                v-model="formData.phoneNumber"
                type="tel"
                class="input"
              />
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Preferencias</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Tema</label>
              <select v-model="formData.preferences.theme" class="input">
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="system">Sistema</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Idioma</label>
              <select v-model="formData.preferences.language" class="input">
                <option
                  v-for="lang in profileStore.availableLanguages"
                  :key="lang.code"
                  :value="lang.code"
                >
                  {{ lang.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Zona Horaria</label>
              <select v-model="formData.preferences.timezone" class="input">
                <option
                  v-for="tz in profileStore.availableTimezones"
                  :key="tz"
                  :value="tz"
                >
                  {{ tz }}
                </option>
              </select>
            </div>
            <div class="flex items-center justify-between">
              <span>Notificaciones por Email</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="formData.preferences.emailNotifications"
                  type="checkbox"
                  class="sr-only peer"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="cancelEditing"
            class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
            title="Cancelar"
          >
            <XMarkIcon class="w-5 h-5" />
            <span class="hidden sm:inline">Cancelar</span>
          </button>
          <button
            type="submit"
            class="btn btn-primary flex items-center gap-2"
            title="Guardar Cambios"
          >
            <CheckIcon class="w-5 h-5" />
            <span class="hidden sm:inline">Guardar Cambios</span>
          </button>
        </div>
      </form>

      <div v-else class="space-y-6">
        <!-- Account Information -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Información de la Cuenta</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <EnvelopeIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p class="font-medium">{{ profileStore.profile.email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <PhoneIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Teléfono</p>
                <p class="font-medium">
                  {{ profileStore.profile.phoneNumber || 'No especificado' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <AcademicCapIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Rol</p>
                <p class="font-medium capitalize">{{ profileStore.profile.role }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Preferences -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Preferencias</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <component
                  :is="profileStore.profile.preferences.theme === 'dark' ? MoonIcon : profileStore.profile.preferences.theme === 'light' ? SunIcon : ComputerDesktopIcon"
                  class="w-5 h-5 text-gray-600 dark:text-gray-400"
                />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Tema</p>
                <p class="font-medium">
                  {{ profileStore.profile.preferences.theme === 'dark' ? 'Oscuro' : profileStore.profile.preferences.theme === 'light' ? 'Claro' : 'Sistema' }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <LanguageIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Idioma</p>
                <p class="font-medium">
                  {{ profileStore.availableLanguages.find(l => l.code === profileStore.profile.preferences.language)?.name }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <GlobeAmericasIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Zona Horaria</p>
                <p class="font-medium">{{ profileStore.profile.preferences.timezone }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <BellIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Notificaciones por Email</p>
                <p class="font-medium">
                  {{ profileStore.profile.preferences.emailNotifications ? 'Activadas' : 'Desactivadas' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-enter-active,
.progress-leave-active {
  transition: all 0.5s ease;
}

.progress-enter-from,
.progress-leave-to {
  height: 0;
  opacity: 0;
  transform: translateY(20px);
}

.progress-move {
  transition: transform 0.5s ease;
}
</style>