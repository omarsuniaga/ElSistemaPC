<template>
  <div
    id="app"
    class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
  >
    <!-- Loading overlay during auth initialization -->
    <div
      v-if="!authStore.isInitialized"
      class="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"
        />
        <p class="text-gray-600 dark:text-gray-400">Iniciando aplicación...</p>
      </div>
    </div>

    <!-- Indicador de estado de sincronización PWA -->
    <SyncStatusIndicator v-if="showSyncIndicator" class="fixed top-4 right-4 z-40" />

    <!-- Main app content -->
    <template v-else>
      <HeaderApp />
      <!-- Espaciador para compensar el header fijo -->
      <div class="h-16" />
      <main class="min-h-[calc(100vh-8rem)] w-full">
        <div class="w-full">
          <RouterView />
        </div>
      </main>
      <FooterNavigation />

      <!-- Gestor de invitaciones para maestros -->
      <TeacherInvitationManager v-if="shouldShowInvitationManager" />
    </template>
  </div>
</template>

<script setup lang="ts">
import {defineAsyncComponent, onMounted, computed} from "vue"
import {RouterView} from "vue-router"
import {setupPersistence} from "./firebase"
import {useAuthStore} from "./stores/auth"
import {useThemeSetup} from "./composables/useTheme"
import {usePWA} from "./composables/pwa/usePWA"

// Async components for better performance
const FooterNavigation = defineAsyncComponent(() => import("./components/FooterNavigation.vue"))
const HeaderApp = defineAsyncComponent(() => import("./components/HeaderApp.vue"))
const TeacherInvitationManager = defineAsyncComponent(
  () => import("./modulos/Teachers/components/TeacherInvitationManager.vue")
)
const SyncStatusIndicator = defineAsyncComponent(
  () => import("./components/sync/SyncStatusIndicator.vue")
)

// Configurar tema para toda la aplicación
useThemeSetup()

// PWA setup
const pwa = usePWA()
const {isOnline, hasActiveNotifications, pendingOperations} = pwa

const authStore = useAuthStore()
const user = authStore.user
const isLoggedIn = authStore.isLoggedIn

// Mostrar gestor de invitaciones solo para maestros autenticados
const shouldShowInvitationManager = computed(() => {
  return (
    isLoggedIn &&
    user &&
    (user.role?.toLowerCase() === "maestro" || user.role?.toLowerCase() === "profesor")
  )
})

// Mostrar indicador de sincronización cuando sea necesario
const showSyncIndicator = computed(() => {
  return !isOnline.value || pendingOperations.value > 0 || hasActiveNotifications.value
})

// Configurar Firebase y PWA después de que el componente esté montado
onMounted(async () => {
  // Configurar persistencia después de que todo esté inicializado
  try {
    await setupPersistence()
    console.log("✅ Persistencia Firebase configurada")
  } catch (error) {
    console.warn("⚠️ No se pudo habilitar la persistencia:", error)
  }

  // Inicializar autenticación para evitar el flash de login
  try {
    await authStore.checkAuth()
    console.log("🔐 Autenticación inicializada correctamente")
  } catch (error) {
    console.warn("🔐 Error al inicializar autenticación:", error)
  }

  // Inicializar PWA después de la autenticación
  try {
    await pwa.initializePWA()
    console.log("🚀 PWA inicializada correctamente")
  } catch (error) {
    console.warn("🚀 Error al inicializar PWA:", error)
  }
})
</script>
