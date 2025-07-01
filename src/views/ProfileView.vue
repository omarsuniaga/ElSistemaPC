<script setup lang="ts">
import {ref, onMounted, computed, watch, onUnmounted, shallowRef} from "vue"
import {useRouter} from "vue-router"
import {useAuthStore} from "../stores/auth"
import {useProfileStore} from "../modulos/Profile/store/profile"
import {useColorMode} from "@vueuse/core"
import FileUpload from "../components/FileUpload.vue"
import ReportGenerator from "../modulos/Analytics/components/ReportGenerator.vue"
import AccessRequests from "../components/AccessRequests.vue"
import EmergencyClassRequests from "../components/EmergencyClassRequests.vue"
import {useEmergencyClassStore} from "../modulos/Attendance/store/emergencyClass"
// import { clearLocalStorage } from '../utils/localStorageUtils'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore"
import {getApp} from "firebase/app"
import {getAuth, signOut} from "firebase/auth"
import {safeGet, safeArrayLength, safeStoreAccess} from "../utils/safeAccess"
import {useAdminErrorHandling} from "../composables/useAdminErrorHandling"
import {
  UserIcon,
  CogIcon,
  BellIcon,
  ClockIcon,
  DocumentTextIcon,
  LanguageIcon,
  GlobeAmericasIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  CameraIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  TrophyIcon,
  AcademicCapIcon,
  StarIcon,
  SunIcon,
  MoonIcon,
  PencilSquareIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  KeyIcon,
  ComputerDesktopIcon,
  LockClosedIcon,
  UserCircleIcon,
  CheckIcon,
} from "@heroicons/vue/24/outline"

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const colorMode = useColorMode()
const emergencyClassStore = useEmergencyClassStore()
const {handleAdminError, clearResolvedErrors} = useAdminErrorHandling()

// Variables de estado
const isLoading = ref(false)
const error = ref("")
const isEditing = ref(false)
const showReports = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const profileActivityLog = ref<Array<{activity: string; timestamp: string}>>([])
const showSecuritySettings = ref(false)

// Nuevo estado para las solicitudes de clases emergentes
const showEmergencyClassRequests = ref(false)
const pendingEmergencyClasses = ref(0)

// Get current user UID
const currentUserUid = computed(() => safeGet(authStore.user, "uid", ""))

// Datos del formulario
const formData = ref({
  displayName: "",
  email: "",
  phoneNumber: "",
  preferences: {
    theme: "dark",
    language: "es",
    timezone: "",
    emailNotifications: true,
  },
})

// Estado para las solicitudes pendientes
const pendingRequests = ref(0)
const showAccessRequests = ref(false)
// Referencia para la suscripción a Firestore
const unsubscribePendingRequests = shallowRef<(() => void) | null>(null)

// Cálculo del completado del perfil
const profileCompletion = computed(() => {
  const profile = safeStoreAccess(profileStore, "profile", null)
  if (!profile) return 0

  let total = 0
  let completed = 0

  // Campos básicos
  const fields = ["displayName", "email", "phone", "photoURL"]

  total += fields.length

  fields.forEach((field) => {
    if (safeGet(profile, field)) completed++
  })

  // Preferencias
  const preferenceFields = ["theme", "language", "timezone", "emailNotifications"]

  total += preferenceFields.length

  preferenceFields.forEach((field) => {
    if (safeGet(profile, `preferences.${field}`)) completed++
  })

  return Math.round((completed / total) * 100)
})

// Información del tema actual para el botón
const themeInfo = computed(() => {
  if (colorMode.value === "dark") {
    return {
      icon: SunIcon,
      text: "Cambiar a modo claro",
    }
  } else {
    return {
      icon: MoonIcon,
      text: "Cambiar a modo oscuro",
    }
  }
})

// Establecer el modo oscuro como predeterminado
colorMode.value = "dark"

// Función para alternar el tema
const toggleTheme = () => {
  colorMode.value = colorMode.value === "dark" ? "light" : "dark"

  // Update theme preference in both local state and Firestore
  const profile = safeStoreAccess(profileStore, "profile", null)
  if (profile) {
    const currentPreferences = safeGet(profile, "preferences", {})
    const updatedPreferences = {
      ...currentPreferences,
      theme: colorMode.value,
    }
    profileStore.updateSettings(updatedPreferences)

    // Also update in Firestore users collection
    if (currentUserUid.value) {
      const db = getFirestore(getApp())
      const userDocRef = doc(db, "USERS", currentUserUid.value)
      setDoc(
        userDocRef,
        {
          preferences: updatedPreferences,
        },
        {merge: true}
      )
    }
  }
}

// Función para iniciar modo de edición
const startEditing = () => {
  const profile = safeStoreAccess(profileStore, "profile", null)
  if (!profile) return

  const defaultPreferences = {
    theme: "dark",
    language: "es",
    timezone: "",
    emailNotifications: true,
  }

  formData.value = {
    displayName: safeGet(profile, "displayName", ""),
    email: safeGet(profile, "email", ""),
    phoneNumber: safeGet(profile, "phone", ""),
    preferences: {...defaultPreferences, ...safeGet(profile, "preferences", {})},
  }

  isEditing.value = true
  showReports.value = false
  showAccessRequests.value = false
  showSecuritySettings.value = false
}

// Función para cancelar edición
const cancelEditing = () => {
  isEditing.value = false
}

// Función para manejar el envío del formulario
const handleSubmit = async () => {
  if (!profileStore.profile) return

  isLoading.value = true
  error.value = ""

  try {
    await profileStore.updateProfile({
      displayName: formData.value.displayName,
      email: formData.value.email,
      phone: formData.value.phoneNumber,
    })

    await profileStore.updateSettings(formData.value.preferences)

    isEditing.value = false

    // Registrar actividad
    addToActivityLog("Perfil actualizado")
  } catch (err) {
    error.value = handleAdminError(err, "Error al actualizar el perfil").message
    console.error("Error updating profile", err)
  } finally {
    isLoading.value = false
  }
}

// Función para manejar la selección de una nueva foto
const handlePhotoUpload = () => {
  isUploading.value = true
  uploadProgress.value = 0
}

// Función para manejar el éxito de la carga de la foto
const handlePhotoSuccess = async (url) => {
  isUploading.value = false

  try {
    await profileStore.updateProfile({
      photoURL: url,
    })

    // Registrar actividad
    addToActivityLog("Foto de perfil actualizada")
  } catch (err) {
    error.value = handleAdminError(err, "Error al actualizar la foto de perfil").message
    console.error("Error updating profile photo", err)
  }
}

// Función para cerrar sesión
const handleSignOut = async () => {
  try {
    const auth = getAuth()
    await signOut(auth)
    router.push("/login")
  } catch (err) {
    error.value = handleAdminError(err, "Error al cerrar sesión").message
    console.error("Error signing out", err)
  }
}

// Función para obtener información adicional del usuario desde Firebase
const fetchUserFromFirebase = async () => {
  if (!currentUserUid.value) return

  try {
    const db = getFirestore(getApp())
    const userDocRef = doc(db, "USERS", currentUserUid.value)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()

      // Actualizar datos del perfil local si hay información adicional
      if (userData) {
        await profileStore.mergeFirebaseData(userData)
      }
    }
  } catch (err) {
    console.error("Error fetching user data from Firebase", err)
  }
}

// Función para añadir entradas al registro de actividad
const addToActivityLog = (activity) => {
  profileActivityLog.value.unshift({
    activity,
    timestamp: new Date().toISOString(),
  })

  // Mantener el registro limitado a 10 entradas
  if (profileActivityLog.value.length > 10) {
    profileActivityLog.value = profileActivityLog.value.slice(0, 10)
  }
}

const startWatchingPendingRequests = () => {
  // Solo directores y administradores pueden ver solicitudes
  if (!["Director", "Administrador"].includes(authStore.user?.role || "")) return

  // Cancelar suscripción previa si existe
  if (unsubscribePendingRequests.value) {
    unsubscribePendingRequests.value()
    unsubscribePendingRequests.value = null
  }

  // Iniciar nueva suscripción
  const db = getFirestore(getApp())
  const pendingRequestsQuery = query(collection(db, "USERS"), where("status", "==", "pendiente"))
  // Suscribirse en tiempo real pero solo con una suscripción activa
  unsubscribePendingRequests.value = onSnapshot(
    pendingRequestsQuery,
    (snapshot) => {
      pendingRequests.value = safeArrayLength(snapshot.docs)
    },
    (err) => {
      console.error("Error al verificar solicitudes pendientes", err)
    }
  )
}

// Detener la suscripción cuando ya no es necesaria
const stopWatchingPendingRequests = () => {
  if (unsubscribePendingRequests.value) {
    unsubscribePendingRequests.value()
    unsubscribePendingRequests.value = null
  }
}

// Alternar la vista de solicitudes de acceso
const toggleAccessRequests = () => {
  showAccessRequests.value = !showAccessRequests.value
  showReports.value = false
  isEditing.value = false
  showSecuritySettings.value = false
  showEmergencyClassRequests.value = false
}

// Alternar la vista de configuración de seguridad
const toggleSecuritySettings = () => {
  showSecuritySettings.value = !showSecuritySettings.value
  showReports.value = false
  isEditing.value = false
  showAccessRequests.value = false
  showEmergencyClassRequests.value = false
}

// Alternar la vista de solicitudes de clases emergentes
const toggleEmergencyClassRequests = () => {
  showEmergencyClassRequests.value = !showEmergencyClassRequests.value
  showReports.value = false
  isEditing.value = false
  showAccessRequests.value = false
  showSecuritySettings.value = false

  if (showEmergencyClassRequests.value) {
    loadPendingEmergencyClasses()
  }
}

// Cargar las solicitudes pendientes de clases emergentes
const loadPendingEmergencyClasses = async () => {
  try {
    await emergencyClassStore.fetchEmergencyClasses("Pendiente" as any)
    pendingEmergencyClasses.value = safeArrayLength(emergencyClassStore.getPendingEmergencyClasses)
  } catch (error) {
    handleAdminError(error, "Error al cargar clases emergentes pendientes")
  }
}

// Observar cambios en el rol de usuario para iniciar/detener suscripciones apropiadamente
watch(
  () => safeGet(authStore.user, "role"),
  (newRole) => {
    if (["Director", "Administrador"].includes(newRole || "")) {
      startWatchingPendingRequests()
      loadPendingEmergencyClasses()
    } else {
      stopWatchingPendingRequests()
    }
  }
)

// Mantener o detener la observación según el estado de la app
watch(
  () => showAccessRequests.value,
  (isShowing) => {
    // Si se muestra la vista de solicitudes, seguir observando
    // Si cambia a otra vista y no hay notificaciones, considerar detener
    if (!isShowing && pendingRequests.value === 0) {
      stopWatchingPendingRequests()
    } else if (["Director", "Administrador"].includes(authStore.user?.role || "")) {
      startWatchingPendingRequests()
    }
  }
)

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push("/login")
    return
  }

  isLoading.value = true
  error.value = ""
  try {
    await profileStore.fetchProfile()
    await fetchUserFromFirebase()
    const profile = safeStoreAccess(profileStore, "profile", null)
    if (profile) {
      const defaultPreferences = {
        theme: "dark",
        language: "es",
        timezone: "",
        emailNotifications: true,
      }

      formData.value = {
        displayName: safeGet(profile, "displayName", ""),
        email: safeGet(profile, "email", ""),
        phoneNumber: safeGet(profile, "phone", ""),
        preferences: {...defaultPreferences, ...safeGet(profile, "preferences", {})},
      }

      // Iniciar vigilancia de solicitudes si es un admin/director
      const userRole = safeGet(authStore.user, "role", "")
      if (["Director", "Administrador"].includes(userRole)) {
        startWatchingPendingRequests()
      }

      // Registrar actividad
      addToActivityLog("Perfil cargado")
    } else {
      throw new Error("No se pudo cargar el perfil")
    }
  } catch (err) {
    error.value = handleAdminError(err, "Error al cargar el perfil").message
    console.error("Error loading profile", err)
  } finally {
    isLoading.value = false
  }
})

// Limpiar suscripciones al desmontar
onUnmounted(() => {
  stopWatchingPendingRequests()
})
</script>

<template>
  <div class="profile-container py-6 max-w-5xl mx-auto px-4 mb-14">
    <!-- Header y botones -->
    <div class="flex flex-wrap justify-between items-center mb-8 gap-4">
      <div class="flex items-center gap-3">
        <h1
          class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent"
        >
          Mi Perfil
        </h1>

        <div v-if="profileStore.profile" class="hidden md:flex items-center gap-2">
          <div class="bg-gray-200 dark:bg-gray-700 h-2 w-24 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-green-400 to-blue-500"
              :style="{width: `${profileCompletion}%`}"
            />
          </div>
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ profileCompletion }}%</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          class="theme-toggle-btn"
          :title="themeInfo.text"
          aria-label="Toggle theme"
          @click="toggleTheme"
        >
          <component :is="themeInfo.icon" class="w-5 h-5" />
        </button>

        <!-- Botón de configuración de seguridad -->
        <button
          v-if="!isEditing && !showAccessRequests && !showReports"
          class="btn bg-yellow-600 text-white hover:bg-yellow-700 flex items-center gap-2"
          title="Configuración de Seguridad"
          @click="toggleSecuritySettings"
        >
          <ShieldCheckIcon class="w-5 h-5" />
          <span class="hidden sm:inline">{{
            showSecuritySettings ? "Ver Perfil" : "Seguridad"
          }}</span>
        </button>

        <!-- Botón para solicitudes de clases emergentes (solo para admin/director) -->
        <button
          v-if="['Director', 'Administrador'].includes(authStore.user?.role || '') && !isEditing"
          class="btn bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-2 relative"
          title="Solicitudes de Clases Emergentes"
          @click="toggleEmergencyClassRequests"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="hidden sm:inline">{{
            showEmergencyClassRequests ? "Ver Perfil" : "Clases Emergentes"
          }}</span>
          <!-- Indicador de clases emergentes pendientes -->
          <span
            v-if="pendingEmergencyClasses > 0 && !showEmergencyClassRequests"
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {{ pendingEmergencyClasses > 9 ? "9+" : pendingEmergencyClasses }}
          </span>
        </button>

        <!-- Botón de solicitudes de acceso (solo para admin/director) -->
        <button
          v-if="['Director', 'Administrador'].includes(authStore.user?.role || '') && !isEditing"
          class="btn bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 relative"
          title="Solicitudes de acceso"
          @click="toggleAccessRequests"
        >
          <BellIcon class="w-5 h-5" />
          <span class="hidden sm:inline">{{
            showAccessRequests ? "Ver Perfil" : "Solicitudes"
          }}</span>
          <!-- Indicador de número de solicitudes -->
          <span
            v-if="pendingRequests > 0 && !showAccessRequests"
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {{ pendingRequests > 9 ? "9+" : pendingRequests }}
          </span>
        </button>

        <button
          v-if="
            !isEditing &&
            !showReports &&
            !showAccessRequests &&
            !showSecuritySettings &&
            !showEmergencyClassRequests
          "
          class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          title="Informes"
          @click="showReports = !showReports"
        >
          <DocumentTextIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Informes</span>
        </button>

        <button
          v-if="
            !isEditing &&
            !showReports &&
            !showAccessRequests &&
            !showSecuritySettings &&
            !showEmergencyClassRequests
          "
          class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          title="Editar Perfil"
          @click="startEditing"
        >
          <PencilSquareIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Editar Perfil</span>
        </button>

        <button
          class="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          title="Cerrar Sesión"
          @click="handleSignOut"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </div>

    <!-- Estados de carga y error -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="loading-spinner" />
      <p class="text-gray-600 dark:text-gray-400 ml-3">Cargando perfil...</p>
    </div>

    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-xl flex items-center gap-3"
    >
      <XMarkIcon class="w-6 h-6 flex-shrink-0" />
      <div>
        <p class="font-medium">{{ error }}</p>
        <button
          class="text-sm underline hover:text-primary-600 transition-colors"
          @click="
            () => {
              error = ''
              fetchUserFromFirebase()
            }
          "
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- Vista de Solicitudes de Acceso -->
    <AccessRequests v-else-if="showAccessRequests" @request-processed="pendingRequests--" />

    <!-- Vista de Solicitudes de Clases Emergentes -->
    <EmergencyClassRequests
      v-else-if="showEmergencyClassRequests"
      @request-processed="pendingEmergencyClasses--"
    />

    <!-- Vista de Reportes -->
    <ReportGenerator v-else-if="showReports" />

    <!-- Vista de Configuración de Seguridad -->
    <div v-else-if="showSecuritySettings" class="space-y-8">
      <div class="profile-card">
        <div class="flex items-center gap-2 mb-4">
          <ShieldCheckIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 class="text-lg font-semibold">Configuración de Seguridad</h3>
        </div>

        <div class="space-y-8">
          <!-- Cambio de contraseña -->
          <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h4 class="text-base font-medium flex items-center gap-2 mb-4">
              <KeyIcon class="w-4 h-4 text-yellow-500" />
              <span>Cambiar Contraseña</span>
            </h4>

            <form class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Contraseña Actual</label>
                <input type="password" class="form-input" placeholder="••••••••" />
              </div>

              <div class="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Nueva Contraseña</label>
                  <input type="password" class="form-input" placeholder="••••••••" />
                </div>

                <div class="form-group">
                  <label class="form-label">Confirmar Nueva Contraseña</label>
                  <input type="password" class="form-input" placeholder="••••••••" />
                </div>
              </div>

              <div class="mt-2">
                <button type="button" class="btn bg-yellow-600 hover:bg-yellow-700 text-white">
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>

          <!-- Sesiones activas -->
          <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h4 class="text-base font-medium flex items-center gap-2 mb-4">
              <ComputerDesktopIcon class="w-4 h-4 text-blue-500" />
              <span>Sesiones Activas</span>
            </h4>

            <div class="space-y-4">
              <div
                class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <ComputerDesktopIcon class="w-5 h-5 text-green-500" />
                  <div>
                    <p class="font-medium">Este dispositivo</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">Última actividad: Ahora</p>
                  </div>
                </div>
                <span
                  class="badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >Activo</span
                >
              </div>
            </div>
          </div>

          <!-- Verificación en dos pasos -->
          <div>
            <h4 class="text-base font-medium flex items-center gap-2 mb-4">
              <LockClosedIcon class="w-4 h-4 text-indigo-500" />
              <span>Verificación en Dos Pasos</span>
            </h4>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Añade una capa adicional de seguridad a tu cuenta activando la verificación en dos
                  pasos.
                </p>
              </div>

              <label class="switch">
                <input type="checkbox" />
                <span class="slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista de Perfil -->
    <div v-else-if="profileStore.profile" class="space-y-8">
      <!-- Tarjeta de perfil -->
      <div class="profile-card">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div class="relative group">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur-md transition-all duration-300 -z-10"
            />
            <div
              class="relative overflow-hidden rounded-full w-28 h-28 border-4 border-white dark:border-gray-800"
            >
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
                  :max-size="5"
                  class="w-full h-full"
                  @select="handlePhotoUpload"
                  @success="handlePhotoSuccess"
                  @error="(err) => (error = err)"
                  @progress="(progress) => (uploadProgress = progress)"
                >
                  <template #default>
                    <div
                      class="flex flex-col items-center justify-center h-full cursor-pointer text-white"
                    >
                      <template v-if="isUploading">
                        <div class="w-16 h-16 flex items-center justify-center">
                          <svg class="circular-progress" viewBox="0 0 36 36">
                            <path
                              class="circular-bg"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              class="circular-progress-path"
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
            <p
              class="text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-1 mt-1"
            >
              <EnvelopeIcon class="w-4 h-4" />
              {{ profileStore.profile.email }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              <span class="badge">
                <AcademicCapIcon class="w-4 h-4" />
                <span class="capitalize">{{ profileStore.profile.role || "Usuario" }}</span>
              </span>
              <span class="badge">
                <span
                  >Miembro desde
                  {{
                    new Date(profileStore.profile.createdAt || Date.now()).toLocaleDateString()
                  }}</span
                >
              </span>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Última conexión: {{ new Date(profileStore.profile.lastLogin || "").toLocaleString() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Formulario de edición -->
      <form v-if="isEditing" class="space-y-6" @submit.prevent="handleSubmit">
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
              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                >Formato recomendado: +52 123 456 7890</span
              >
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
                <label
                  class="theme-option"
                  :class="{active: formData.preferences.theme === 'light'}"
                >
                  <input
                    v-model="formData.preferences.theme"
                    type="radio"
                    value="light"
                    class="sr-only"
                  />
                  <SunIcon class="w-5 h-5" />
                  <span>Claro</span>
                </label>

                <label
                  class="theme-option"
                  :class="{active: formData.preferences.theme === 'dark'}"
                >
                  <input
                    v-model="formData.preferences.theme"
                    type="radio"
                    value="dark"
                    class="sr-only"
                  />
                  <MoonIcon class="w-5 h-5" />
                  <span>Oscuro</span>
                </label>

                <label
                  class="theme-option"
                  :class="{active: formData.preferences.theme === 'system'}"
                >
                  <input
                    v-model="formData.preferences.theme"
                    type="radio"
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
              <select
                v-model="formData.preferences.language"
                class="form-select dark:text-white dark:bg-black/10"
              >
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
              <select
                v-model="formData.preferences.timezone"
                class="form-select dark:text-white dark:bg-black/10"
              >
                <option
                  v-for="tz in profileStore.availableTimezones"
                  :key="tz"
                  class="dark:text-white dark:bg-black/10"
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
                  <input v-model="formData.preferences.emailNotifications" type="checkbox" />
                  <span class="slider" />
                  <span class="ml-2">Recibir notificaciones por email</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button type="button" class="btn-secondary" @click="cancelEditing">
            <XMarkIcon class="w-5 h-5" />
            <span>Cancelar</span>
          </button>

          <button type="submit" class="btn-primary">
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
                  {{ profileStore.profile.phone || "No especificado" }}
                </p>
              </div>
            </div>

            <div class="info-item">
              <AcademicCapIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="info-label">Rol</p>
                <p class="info-value capitalize">{{ profileStore.profile.role || "Usuario" }}</p>
              </div>
            </div>

            <div class="info-item">
              <DocumentTextIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p class="info-label">Usuario ID</p>
                <p class="info-value text-xs">{{ authStore.user?.uid || "No disponible" }}</p>
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
                  {{
                    profileStore.profile.preferences.theme === "dark"
                      ? "Oscuro"
                      : profileStore.profile.preferences.theme === "light"
                        ? "Claro"
                        : "Sistema"
                  }}
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
                  {{
                    profileStore.availableLanguages.find(
                      (l) => l.code === profileStore.profile.preferences.language
                    )?.name
                  }}
                </p>
              </div>
            </div>

            <div class="info-item">
              <div class="setting-icon w-5 h-5">
                <GlobeAmericasIcon />
              </div>
              <div>
                <p class="info-label">Zona Horaria</p>
                <p class="info-value">
                  {{ profileStore.profile?.preferences?.timezone || "No especificada" }}
                </p>
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
                    :class="
                      profileStore.profile.preferences.emailNotifications
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    "
                    class="inline-block h-5 w-5 rounded-full mr-2"
                  />
                  {{
                    profileStore.profile.preferences.emailNotifications
                      ? "Activadas"
                      : "Desactivadas"
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas del Usuario -->
        <div class="profile-card">
          <div class="flex items-center gap-2 mb-6">
            <DocumentTextIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 class="text-lg font-semibold">Estadísticas</h3>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="stat-card bg-blue-50 dark:bg-blue-900/20">
              <span class="stat-number text-blue-600 dark:text-blue-400">{{
                profileStore.profile.logins || 0
              }}</span>
              <span class="stat-label text-blue-800 dark:text-blue-300">Inicios de sesión</span>
            </div>

            <div class="stat-card bg-green-50 dark:bg-green-900/20">
              <span class="stat-number text-green-600 dark:text-green-400">{{
                profileStore.profile.daysActive || 0
              }}</span>
              <span class="stat-label text-green-800 dark:text-green-300">Días activo</span>
            </div>

            <div class="stat-card bg-purple-50 dark:bg-purple-900/20">
              <span class="stat-number text-purple-600 dark:text-purple-400">{{
                profileStore.profile.contributions || 0
              }}</span>
              <span class="stat-label text-purple-800 dark:text-purple-300">Contribuciones</span>
            </div>

            <div class="stat-card bg-amber-50 dark:bg-amber-900/20">
              <span class="stat-number text-amber-600 dark:text-amber-400"
                >{{ profileCompletion }}%</span
              >
              <span class="stat-label text-amber-800 dark:text-amber-300">Perfil completo</span>
            </div>
          </div>
        </div>

        <!-- Actividad reciente -->
        <div class="profile-card">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <ClockIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 class="text-lg font-semibold">Actividad Reciente</h3>
            </div>

            <button
              v-if="profileActivityLog.length > 0"
              class="text-sm text-gray-500 hover:text-red-500 transition-colors"
              @click="profileActivityLog = []"
            >
              Limpiar historial
            </button>
          </div>

          <div
            v-if="profileActivityLog.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            <p>No hay actividad reciente</p>
          </div>

          <ul v-else class="space-y-3">
            <li
              v-for="(activity, index) in profileActivityLog"
              :key="index"
              class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <span>{{ activity.activity }}</span>
              <span class="text-sm text-gray-500">{{
                new Date(activity.timestamp).toLocaleString()
              }}</span>
            </li>
          </ul>
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

/* Estilos para tarjetas de perfil */
.profile-card {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700;
}

/* Estilos para campos de formulario */
.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input,
.form-select {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white;
}

/* Estilos para botones */
.btn-primary {
  @apply flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors;
}

.btn-secondary {
  @apply flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors;
}

.theme-toggle-btn {
  @apply p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors;
}

.btn {
  @apply px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors;
}

/* Estilos para opciones de tema */
.theme-option {
  @apply flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.theme-option.active {
  @apply border-primary-500 bg-primary-50 dark:bg-primary-900/30;
}

/* Estilos para items de información */
.info-item {
  @apply flex items-start gap-3;
}

.info-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.info-value {
  @apply font-medium;
}

/* Estilos para iconos de configuraciones */
.setting-icon {
  @apply flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400;
}

/* Estilos para botones badge */
.badge {
  @apply inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200;
}

/* Estilos para switch toggle */
.switch {
  @apply relative inline-flex items-center cursor-pointer;
}

.switch input {
  @apply sr-only;
}

.slider {
  @apply relative inline-block w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full transition-all duration-300 mr-3;
}

.slider::before {
  @apply content-[''] absolute h-4 w-4 left-0.5 bottom-0.5 bg-white rounded-full transition-all duration-300;
}

input:checked + .slider {
  @apply bg-primary-500;
}

input:checked + .slider::before {
  @apply translate-x-5;
}

/* Estilos para tarjetas de estadísticas */
.stat-card {
  @apply flex flex-col items-center justify-center p-4 rounded-lg text-center;
}

.stat-number {
  @apply text-2xl font-bold mb-1;
}

.stat-label {
  @apply text-xs font-medium;
}

/* Estilos para el indicador de progreso circular */
.circular-progress {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.circular-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 3;
}

.circular-progress-path {
  fill: none;
  stroke: white;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

/* Estilo para el spinner de carga */
.loading-spinner {
  @apply h-6 w-6 border-2 border-t-primary-500 border-r-primary-500 border-b-primary-200 border-l-primary-200 rounded-full animate-spin;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
