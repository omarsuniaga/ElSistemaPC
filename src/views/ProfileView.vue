<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../modulos/Profile/store/profile'
import { useColorMode } from '@vueuse/core'
import FileUpload from '../components/FileUpload.vue'
import ReportGenerator from '../modulos/Analytics/components/ReportGenerator.vue'
import AccessRequests from '../components/AccessRequests.vue'
// import { clearLocalStorage } from '../utils/localStorageUtils'
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { getApp } from 'firebase/app'
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
  CheckIcon,
  ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const colorMode = useColorMode()

// Get current user UID
const currentUserUid = computed(() => authStore.user?.uid || '')

// Estado para las solicitudes pendientes
const pendingRequests = ref(0)
const showAccessRequests = ref(false)
// Referencia para la suscripción a Firestore
const unsubscribePendingRequests = shallowRef<(() => void) | null>(null)

// Establecer el modo oscuro como predeterminado
colorMode.value = 'dark';

// Función para alternar el tema
const toggleTheme = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
  
  // Update theme preference in both local state and Firestore
  if (profileStore.profile) {
    const updatedPreferences = {
      ...profileStore.profile.preferences,
      theme: colorMode.value
    };
    profileStore.updateSettings(updatedPreferences)
    
    // Also update in Firestore users collection
    if (currentUserUid.value) {
      const db = getFirestore(getApp())
      const userDocRef = doc(db, 'USERS', currentUserUid.value)
      setDoc(userDocRef, {
        preferences: updatedPreferences
      }, { merge: true })
    }
  }
}

const startWatchingPendingRequests = () => {
  // Solo directores y administradores pueden ver solicitudes
  if (!['Director', 'Administrador'].includes(authStore.user?.role || '')) return;
  
  // Cancelar suscripción previa si existe
  if (unsubscribePendingRequests.value) {
    unsubscribePendingRequests.value();
    unsubscribePendingRequests.value = null;
  }
  
  // Iniciar nueva suscripción
  const db = getFirestore(getApp());
  const pendingRequestsQuery = query(
    collection(db, 'USERS'),
    where('status', '==', 'pendiente')
  );
  
  // Suscribirse en tiempo real pero solo con una suscripción activa
  unsubscribePendingRequests.value = onSnapshot(pendingRequestsQuery, (snapshot) => {
    pendingRequests.value = snapshot.docs.length;
  }, (err) => {
    console.error('Error al verificar solicitudes pendientes:', err);
  });
};

// Detener la suscripción cuando ya no es necesaria
const stopWatchingPendingRequests = () => {
  if (unsubscribePendingRequests.value) {
    unsubscribePendingRequests.value();
    unsubscribePendingRequests.value = null;
  }
};

// Alternar la vista de solicitudes de acceso
const toggleAccessRequests = () => {
  showAccessRequests.value = !showAccessRequests.value;
  showReports.value = false;
};

// Observar cambios en el rol de usuario para iniciar/detener suscripciones apropiadamente
watch(() => authStore.user?.role, (newRole) => {
  if (['Director', 'Administrador'].includes(newRole || '')) {
    startWatchingPendingRequests();
  } else {
    stopWatchingPendingRequests();
  }
});

// Mantener o detener la observación según el estado de la app
watch(() => showAccessRequests.value, (isShowing) => {
  // Si se muestra la vista de solicitudes, seguir observando
  // Si cambia a otra vista y no hay notificaciones, considerar detener
  if (!isShowing && pendingRequests.value === 0) {
    stopWatchingPendingRequests();
  } else if (['Director', 'Administrador'].includes(authStore.user?.role || '')) {
    startWatchingPendingRequests();
  }
});

onMounted(async () => {
  
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await profileStore.fetchProfile()
    await fetchUserFromFirebase()
    if (profileStore.profile) {
      formData.value = {
        displayName: profileStore.profile.displayName,
        email: profileStore.profile.email,
        phoneNumber: profileStore.profile.phone || '',
        preferences: { ...profileStore.profile.preferences }
      }
      
      // Iniciar vigilancia de solicitudes si es un admin/director
      if (['Director', 'Administrador'].includes(authStore.user?.role || '')) {
        startWatchingPendingRequests();
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

// Limpiar suscripciones al desmontar
onUnmounted(() => {
  stopWatchingPendingRequests();
});

</script>

<template>
  <div class="profile-container py-6 max-w-5xl mx-auto px-4 mb-14">
    <!-- Header y botones -->
    <div class="flex flex-wrap justify-between items-center mb-8 gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          Mi Perfil
        </h1>
        
        <div v-if="profileStore.profile" class="hidden md:flex items-center gap-2">
          <div class="bg-gray-200 dark:bg-gray-700 h-2 w-24 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-green-400 to-blue-500" 
              :style="{width: `${profileCompletion}%`}">
            </div>
          </div>
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ profileCompletion }}%</span>
        </div>
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <button 
          @click="toggleTheme"
          class="theme-toggle-btn"
          :title="themeInfo.text"
          aria-label="Toggle theme">
          <component :is="themeInfo.icon" class="w-5 h-5" />
        </button>
        
        <!-- Botón de solicitudes de acceso (solo para admin/director) -->
        <button 
          v-if="['Director', 'Administrador'].includes(authStore.user?.role || '') && !isEditing"
          @click="toggleAccessRequests"
          class="btn bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 relative"
          title="Solicitudes de acceso">
          <BellIcon class="w-5 h-5" />
          <span class="hidden sm:inline">{{ showAccessRequests ? 'Ver Perfil' : 'Solicitudes' }}</span>
          <!-- Indicador de número de solicitudes -->
          <span v-if="pendingRequests > 0 && !showAccessRequests" 
                class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {{ pendingRequests > 9 ? '9+' : pendingRequests }}
          </span>
        </button>
        
        <button 
          v-if="!isEditing && !showReports && !showAccessRequests"
          @click="showReports = !showReports"
          class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          title="Informes">
          <DocumentTextIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Informes</span>
        </button>
        
        <button 
          v-if="!isEditing && !showReports && !showAccessRequests"
          @click="startEditing"
          class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          title="Editar Perfil">
          <PencilSquareIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Editar Perfil</span>
        </button>
        
        <button 
          @click="handleSignOut"
          class="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          title="Cerrar Sesión">
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </div>

    <!-- Estados de carga y error -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="loading-spinner"></div>
      <p class="text-gray-600 dark:text-gray-400 ml-3">Cargando perfil...</p>
    </div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-xl flex items-center gap-3">
      <XMarkIcon class="w-6 h-6 flex-shrink-0" />
      <div>
        <p class="font-medium">{{ error }}</p>
        <button 
          @click="error = ''; fetchUserFromFirebase()" 
          class="text-sm underline hover:text-primary-600 transition-colors">
          Reintentar
        </button>
      </div>
    </div>

    <!-- Vista de Solicitudes de Acceso -->
    <AccessRequests v-else-if="showAccessRequests" @request-processed="pendingRequests--" />

    <!-- Vista de Reportes -->
    <ReportGenerator v-else-if="showReports" />

    <!-- Vista de Perfil -->
    <div v-else-if="profileStore.profile" class="space-y-8">
      <!-- Tarjeta de perfil -->
      <div class="profile-card">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur-md transition-all duration-300 -z-10"></div>
            <div class="relative overflow-hidden rounded-full w-28 h-28 border-4 border-white dark:border-gray-800">
              <img
                :src="profileStore.profile.photoURL"
                :alt="profileStore.profile.displayName"
                class="w-full h-full object-cover transition-transform duration-300"
                :class="{'opacity-50': isUploading}"
              />
              <div 
                class="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                :class="{'opacity-100': isUploading}"
              >
                <FileUpload
                  accept="image/*"
                  :path="`avatars/${authStore.user?.uid || 'default'}`"
                  :maxSize="5"
                  @select="handlePhotoUpload"
                  @success="handlePhotoSuccess"
                  @error="err => error = err"
                  @progress="progress => uploadProgress = progress"
                  class="w-full h-full"
                >
                  <template #default>
                    <div class="flex flex-col items-center justify-center h-full cursor-pointer text-white">
                      <template v-if="isUploading">
                        <div class="w-16 h-16 flex items-center justify-center">
                          <svg class="circular-progress" viewBox="0 0 36 36">
                            <path class="circular-bg"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path class="circular-progress-path"
                              :stroke-dasharray="`${uploadProgress}, 100`"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span class="absolute text-xs font-semibold">{{ uploadProgress }}%</span>
                        </div>
                        <span class="text-xs mt-1">Subiendo...</span>
                      </template>
                      <template v-else>
                        <CameraIcon class="w-5 h-5 mb-1" />
                        <span class="text-xs">Cambiar foto</span>
                      </template>
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

      <!-- Formulario de edición -->
      <form v-if="isEditing" @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Información personal -->
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

        <!-- Preferencias -->
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
              <label class="form-label dark:text-white dark:bg-black/10">Idioma</label>
              <select v-model="formData.preferences.language" class="form-select dark:text-white dark:bg-black/10">
                <option
                  v-for="lang in profileStore.availableLanguages"
                  :key="lang.code"
                  :value="lang.code"
                  class=""
                >
                  {{ lang.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group dark:text-white dark:bg-black/10">
              <label class="form-label dark:text-white dark:bg-black/10">Zona Horaria</label>
              <select v-model="formData.preferences.timezone" class="form-select dark:text-white dark:bg-black/10">
                <option
                class="dark:text-white dark:bg-black/10"
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

      <!-- Vista de perfil -->
      <div v-else class="space-y-8">
        <!-- Información de la cuenta -->
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
                  {{ profileStore.profile.phone || 'No especificado' }}
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
                <p class="info-value text-xs">{{ authStore.user?.uid || 'No disponible' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Preferencias actuales -->
        <div class="profile-card">
          <div class="flex items-center gap-2 mb-6">
            <ComputerDesktopIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 class="text-lg font-semibold">Preferencias</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
            <div class="info-item">
              <div class="setting-icon">
                <component
                  :is="profileStore.profile?.preferences?.darkMode ? MoonIcon : SunIcon"
                  class="w-5 h-5"
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
              <div class="setting-icon w-5 h-5">
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
              <div class="setting-icon w-5 h-5">
                <GlobeAmericasIcon />
              </div>
              <div>
                <p class="info-label">Zona Horaria</p>
                <p class="info-value">{{ profileStore.profile?.preferences?.timezone || 'No especificada' }}</p>
              </div>
            </div>

            <div class="info-item">
              <div class="setting-icon w-5 h-5">
                <BellIcon />
              </div>
              <div>
                <p class="info-label">Notificaciones por Email</p>
                <p class="info-value">
                  <span 
                    :class="profileStore.profile.preferences.emailNotifications ? 'bg-green-500' : 'bg-red-500'" 
                    class="inline-block h-5 w-5 rounded-full mr-2"
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

<style lang="postcss">
/* Estilo para el indicador de notificaciones */
.notification-badge {
  @apply absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center;
}
</style>
