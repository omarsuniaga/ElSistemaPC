<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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

// Add theme toggle function
const toggleTheme = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
  
  // Update preferences if profile exists
  if (profileStore.profile) {
    profileStore.updateSettings({
      ...profileStore.profile.preferences,
      theme: colorMode.value
    })
  }
}

// Computed property for theme icon/text
const themeInfo = computed(() => ({
  icon: colorMode.value === 'dark' ? SunIcon : MoonIcon,
  text: colorMode.value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
}))

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

// Firebase integration for user data
const userFirebaseData = ref(null)
const profileCompletion = computed(() => {
  if (!profileStore.profile) return 0
  
  const fields = [
    !!profileStore.profile.displayName,
    !!profileStore.profile.email,
    !!profileStore.profile.phoneNumber,
    !!profileStore.profile.photoURL
  ]
  
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
})

// Fetch user data directly from Firebase USERS collection
const fetchUserFromFirebase = async () => {
  if (!authStore.currentUser?.uid) return
  
  try {
    const db = firebase.firestore()
    const userDoc = await db.collection('USERS').doc(authStore.currentUser.uid).get()
    
    if (userDoc.exists) {
      userFirebaseData.value = userDoc.data()
      
      // Update form with fetched Firebase data
      formData.value = {
        displayName: userFirebaseData.value.displayName || profileStore.profile?.displayName || '',
        email: userFirebaseData.value.email || profileStore.profile?.email || '',
        phoneNumber: userFirebaseData.value.phoneNumber || profileStore.profile?.phoneNumber || '',
        preferences: { 
          ...profileStore.profile?.preferences,
          ...userFirebaseData.value.preferences
        }
      }
      
      // Sync theme preference with current theme
      if (formData.value.preferences.theme) {
        colorMode.value = formData.value.preferences.theme
      }
    }
  } catch (err) {
    error.value = 'Error al cargar datos de usuario desde Firebase'
    console.error('Firebase user fetch error:', err)
  }
}

// Enhanced profile update to save to Firebase
const handleSubmit = async () => {
  try {
    // Update profile store
    await profileStore.updateProfile({
      displayName: formData.value.displayName,
      email: formData.value.email,
      phoneNumber: formData.value.phoneNumber
    })
    
    await profileStore.updateSettings(formData.value.preferences)
    
    // Save directly to Firebase USERS collection
    if (authStore.currentUser?.uid) {
      const db = firebase.firestore()
      await db.collection('USERS').doc(authStore.currentUser.uid).set({
        displayName: formData.value.displayName,
        email: formData.value.email,
        phoneNumber: formData.value.phoneNumber,
        preferences: formData.value.preferences,
        lastUpdated: new Date().toISOString()
      }, { merge: true })
    }
    
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
    await fetchUserFromFirebase() // Add Firebase fetch
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
  <div class="profile-container py-6 max-w-5xl mx-auto px-4">
    <!-- Enhanced header section -->
    <div class="flex flex-wrap justify-between items-center mb-8 gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          Mi Perfil
        </h1>
        
        <!-- Profile completion indicator -->
        <div v-if="profileStore.profile" class="hidden md:flex items-center gap-2">
          <div class="bg-gray-200 dark:bg-gray-700 h-2 w-24 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-green-400 to-blue-500" 
              :style="{width: `${profileCompletion}%`}"
            ></div>
          </div>
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ profileCompletion }}%</span>
        </div>
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Theme toggle with improved design -->
        <button 
          @click="toggleTheme"
          class="theme-toggle-btn"
          :title="themeInfo.text"
          aria-label="Toggle theme"
        >
          <component :is="themeInfo.icon" class="w-5 h-5" />
        </button>
        
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

    <!-- Enhanced loading state -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="loading-spinner"></div>
      <p class="text-gray-600 dark:text-gray-400 ml-3">Cargando perfil...</p>
    </div>

    <!-- Enhanced error state -->
    <div 
      v-else-if="error" 
      class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-xl flex items-center gap-3"
    >
      <XMarkIcon class="w-6 h-6 flex-shrink-0" />
      <div>
        <p class="font-medium">{{ error }}</p>
        <button 
          @click="error = ''; fetchUserFromFirebase()" 
          class="text-sm underline hover:text-primary-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- Reports View -->
    <ReportGenerator v-else-if="showReports" />

    <!-- Enhanced Profile View -->
    <div v-else-if="profileStore.profile" class="space-y-8">
      <!-- Profile Header Card -->
      <div class="profile-card">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur-md transition-all duration-300 -z-10"></div>
            <div class="relative overflow-hidden rounded-full w-28 h-28 border-4 border-white dark:border-gray-800">
              <img
                :src="profileStore.profile.photoURL"
                :alt="profileStore.profile.displayName"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <FileUpload
                  accept="image/*"
                  @select="handlePhotoUpload"
                  class="w-full h-full"
                >
                  <template #default>
                    <div class="flex flex-col items-center justify-center h-full cursor-pointer text-white">
                      <CameraIcon class="w-6 h-6" />
                      <span class="text-xs mt-1">Cambiar</span>
                    </div>
                  </template>
                </FileUpload>
              </div>
            </div>
          </div>
          
          <div class="text-center md:text-left flex-1">
            <h2 class="text-2xl font-bold">
              {{ profileStore.profile.displayName }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-1 mt-1">
              <EnvelopeIcon class="w-4 h-4" />
              {{ profileStore.profile.email }}
            </p>
            
            <div class="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              <span class="badge">
                <AcademicCapIcon class="w-4 h-4" />
                <span class="capitalize">{{ profileStore.profile.role || 'Usuario' }}</span>
              </span>
              <span class="badge">
                <span>Miembro desde {{ new Date(profileStore.profile.createdAt || Date.now()).toLocaleDateString() }}</span>
              </span>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Última conexión: {{ new Date(profileStore.profile.lastLogin || '').toLocaleString() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Enhanced Edit Form -->
      <form v-if="isEditing" @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Personal Information -->
        <div class="profile-card">
          <div class="flex items-center gap-2 mb-4">
            <UserCircleIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 class="text-lg font-semibold">Información Personal</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input
                v-model="formData.displayName"
                type="text"
                class="form-input"
                required
                placeholder="Tu nombre completo"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                v-model="formData.email"
                type="email"
                class="form-input"
                required
                placeholder="tu.email@ejemplo.com"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input
                v-model="formData.phoneNumber"
                type="tel"
                class="form-input"
                placeholder="+52 123 456 7890"
              />
              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">Formato recomendado: +52 123 456 7890</span>
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="profile-card">
          <div class="flex items-center gap-2 mb-4">
            <ComputerDesktopIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 class="text-lg font-semibold">Preferencias</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label">Tema</label>
              <div class="flex gap-4 mt-2">
                <label class="theme-option" :class="{'active': formData.preferences.theme === 'light'}">
                  <input 
                    type="radio" 
                    v-model="formData.preferences.theme" 
                    value="light" 
                    class="sr-only"
                  />
                  <SunIcon class="w-5 h-5" />
                  <span>Claro</span>
                </label>
                
                <label class="theme-option" :class="{'active': formData.preferences.theme === 'dark'}">
                  <input 
                    type="radio" 
                    v-model="formData.preferences.theme" 
                    value="dark" 
                    class="sr-only"
                  />
                  <MoonIcon class="w-5 h-5" />
                  <span>Oscuro</span>
                </label>
                
                <label class="theme-option" :class="{'active': formData.preferences.theme === 'system'}">
                  <input 
                    type="radio" 
                    v-model="formData.preferences.theme" 
                    value="system" 
                    class="sr-only"
                  />
                  <ComputerDesktopIcon class="w-5 h-5" />
                  <span>Sistema</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Idioma</label>
              <select v-model="formData.preferences.language" class="form-select">
                <option
                  v-for="lang in profileStore.availableLanguages"
                  :key="lang.code"
                  :value="lang.code"
                >
                  {{ lang.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Zona Horaria</label>
              <select v-model="formData.preferences.timezone" class="form-select">
                <option
                  v-for="tz in profileStore.availableTimezones"
                  :key="tz"
                  :value="tz"
                >
                  {{ tz }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Notificaciones</label>
              <div class="flex items-center mt-2">
                <label class="switch">
                  <input
                    v-model="formData.preferences.emailNotifications"
                    type="checkbox"
                  >
                  <span class="slider"></span>
                  <span class="ml-2">Recibir notificaciones por email</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="cancelEditing"
            class="btn-secondary"
          >
            <XMarkIcon class="w-5 h-5" />
            <span>Cancelar</span>
          </button>
          
          <button
            type="submit"
            class="btn-primary"
          >
            <CheckIcon class="w-5 h-5" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>

      <!-- Enhanced Profile View Display -->
      <div v-else class="space-y-8">
        <!-- Account Information -->
        <div class="profile-card">
          <div class="flex items-center gap-2 mb-6">
            <UserCircleIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 class="text-lg font-semibold">Información de la Cuenta</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
            <div class="info-item">
              <EnvelopeIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="info-label">Email</p>
                <p class="info-value">{{ profileStore.profile.email }}</p>
              </div>
            </div>
            
            <div class="info-item">
              <PhoneIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="info-label">Teléfono</p>
                <p class="info-value">
                  {{ profileStore.profile.phoneNumber || 'No especificado' }}
                </p>
              </div>
            </div>
            
            <div class="info-item">
              <AcademicCapIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="info-label">Rol</p>
                <p class="info-value capitalize">{{ profileStore.profile.role || 'Usuario' }}</p>
              </div>
            </div>
            
            <div class="info-item">
              <DocumentTextIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="info-label">Usuario ID</p>
                <p class="info-value text-xs">{{ authStore.currentUser?.uid || 'No disponible' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Preferences -->
        <div class="profile-card">
          <div class="flex items-center gap-2 mb-6">
            <ComputerDesktopIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 class="text-lg font-semibold">Preferencias</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
            <div class="info-item">
              <div class="setting-icon">
                <component
                  :is="profileStore.profile.preferences.theme === 'dark' ? MoonIcon : profileStore.profile.preferences.theme === 'light' ? SunIcon : ComputerDesktopIcon"
                />
              </div>
              <div>
                <p class="info-label">Tema</p>
                <p class="info-value">
                  {{ profileStore.profile.preferences.theme === 'dark' ? 'Oscuro' : profileStore.profile.preferences.theme === 'light' ? 'Claro' : 'Sistema' }}
                </p>
              </div>
            </div>

            <div class="info-item">
              <div class="setting-icon">
                <LanguageIcon />
              </div>
              <div>
                <p class="info-label">Idioma</p>
                <p class="info-value">
                  {{ profileStore.availableLanguages.find(l => l.code === profileStore.profile.preferences.language)?.name }}
                </p>
              </div>
            </div>

            <div class="info-item">
              <div class="setting-icon">
                <GlobeAmericasIcon />
              </div>
              <div>
                <p class="info-label">Zona Horaria</p>
                <p class="info-value">{{ profileStore.profile.preferences.timezone }}</p>
              </div>
            </div>

            <div class="info-item">
              <div class="setting-icon">
                <BellIcon />
              </div>
              <div>
                <p class="info-label">Notificaciones por Email</p>
                <p class="info-value">
                  <span 
                    :class="profileStore.profile.preferences.emailNotifications ? 'bg-green-500' : 'bg-red-500'" 
                    class="inline-block h-2.5 w-2.5 rounded-full mr-2"
                  ></span>
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
/* Base enhanced styles */
.profile-container {
  @apply transition-colors duration-300;
}

/* Enhanced cards with animation */
.profile-card {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm;
  border: 1px solid rgba(125, 125, 125, 0.1);
  transition: all 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* Loading spinner */
.loading-spinner {
  @apply w-10 h-10 border-4 border-gray-300 dark:border-gray-700 rounded-full;
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Form styling */
.form-group {
  @apply flex flex-col;
}

.form-label {
  @apply block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300;
}

.form-input, .form-select {
  @apply px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:outline-none;
  @apply transition-all duration-200;
}

.form-input:hover, .form-select:hover {
  @apply border-gray-400 dark:border-gray-600;
}

/* Theme options */
.theme-option {
  @apply flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200;
}

.theme-option.active {
  @apply border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400;
}

/* Switch toggle */
.switch {
  @apply flex items-center cursor-pointer;
}

.switch input {
  @apply sr-only;
}

.slider {
  @apply relative inline-block h-6 w-12 rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-200;
}

.slider:before {
  content: '';
  @apply absolute left-1 bottom-1 h-4 w-4 rounded-full bg-white transition-transform duration-200;
}

input:checked + .slider {
  @apply bg-primary-600;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Info items */
.info-item {
  @apply flex items-center gap-4;
}

.info-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.info-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.setting-icon {
  @apply flex items-center justify-center p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-10 h-10;
}

.setting-icon svg {
  @apply w-5 h-5 text-gray-600 dark:text-gray-400;
}

/* Badges */
.badge {
  @apply inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200;
}

/* Primary and secondary buttons */
.btn-primary {
  @apply px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center gap-2 font-medium;
  @apply hover:from-blue-700 hover:to-blue-800 transition-all duration-200;
  @apply active:scale-95;
}

.btn-secondary {
  @apply px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-2 font-medium;
  @apply hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200;
}

/* Theme toggle button */
.theme-toggle-btn {
  @apply w-10 h-10 rounded-full flex items-center justify-center;
  @apply bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700;
  @apply hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200;
}
</style>