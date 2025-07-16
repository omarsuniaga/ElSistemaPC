<template>
  <div
    id="app"
    class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
  >
    <!-- Loading overlay during auth initialization -->
    <div
      v-if="!isAppInitialized"
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
    <SyncStatusIndicator
      v-if="showSyncIndicator && isAppInitialized"
      class="fixed top-4 right-4 z-40"
    />

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
import { defineAsyncComponent, onMounted, onUnmounted, computed, ref, nextTick } from 'vue';
import { RouterView } from 'vue-router';
import { setupPersistence } from './firebase';
import { useThemeSetup } from './composables/useTheme';

// AGREGAR: Importaciones del sistema de módulos
import { moduleManager } from './modulos/Montaje/core/ModuleManager';
import { initializeProjectModules } from './config/modules';

// import {initializeSyncManager} from "./composables/sync/useOfflineSync" // Temporalmente comentado

// Async components for better performance
const FooterNavigation = defineAsyncComponent(() => import('./components/FooterNavigation.vue'));
const HeaderApp = defineAsyncComponent(() => import('./components/HeaderApp.vue'));
const TeacherInvitationManager = defineAsyncComponent(
  () => import('./modulos/Teachers/components/TeacherInvitationManager.vue'),
);
const SyncStatusIndicator = defineAsyncComponent(
  () => import('./components/sync/SyncStatusIndicator.vue'),
);

// Configurar tema para toda la aplicación
useThemeSetup();

// State reactive variables
const isAppInitialized = ref(false);
const authStore = ref<any>(null);
const pwa = ref<any>(null);
const user = ref<any>(null);
const isLoggedIn = ref(false);
const isOnline = ref(true);
const hasActiveNotifications = ref(false);
const pendingOperations = ref(0);
const cleanupSyncManager: (() => void) | null = null;

// Fallback timer to prevent infinite loading
setTimeout(() => {
  if (!isAppInitialized.value) {
    console.warn('⚠️ [App] Timeout alcanzado, forzando inicialización');
    isAppInitialized.value = true;
  }
}, 5000); // 5 seconds fallback

// Computed properties
const shouldShowInvitationManager = computed(() => {
  return (
    isLoggedIn.value &&
    user.value &&
    (user.value.role?.toLowerCase() === 'maestro' || user.value.role?.toLowerCase() === 'profesor')
  );
});

const showSyncIndicator = computed(() => {
  return !isOnline.value || pendingOperations.value > 0 || hasActiveNotifications.value;
});

// Initialize stores and composables after component is mounted
onMounted(async () => {
  console.log('🔍 [App] Iniciando montaje del componente...');

  try {
    // Wait for next tick to ensure Pinia is fully initialized
    await nextTick();
    console.log('✅ [App] nextTick completado');

    // Initialize stores after Pinia is ready
    console.log('🔍 [App] Importando stores...');
    const { useAuthStore } = await import('./stores/auth');
    console.log('✅ [App] AuthStore importado');

    let pwaModule;
    try {
      pwaModule = await import('./composables/pwa/usePWA');
      console.log('✅ [App] PWA module importado');
    } catch (error) {
      console.error('❌ [App] Error importando PWA module:', error);
      // Continue without PWA if it fails
    }

    console.log('✅ [App] Stores importados correctamente');

    authStore.value = useAuthStore();
    if (pwaModule) {
      pwa.value = pwaModule.usePWA();
    }
    console.log('✅ [App] Stores inicializados');

    // Setup reactive references
    user.value = authStore.value.user;
    isLoggedIn.value = authStore.value.isLoggedIn;

    if (pwa.value) {
      isOnline.value = pwa.value.isOnline?.value ?? true;
      hasActiveNotifications.value = pwa.value.hasActiveNotifications?.value ?? false;
      pendingOperations.value = pwa.value.pendingOperations?.value ?? 0;
    } else {
      // Default values if PWA is not available
      isOnline.value = true;
      hasActiveNotifications.value = false;
      pendingOperations.value = 0;
    }
    console.log('✅ [App] Referencias reactivas configuradas');

    // Configurar persistencia después de que todo esté inicializado
    try {
      await setupPersistence();
      console.log('✅ Persistencia Firebase configurada');
    } catch (error) {
      console.warn('⚠️ No se pudo habilitar la persistencia:', error);
    }

    // Inicializar autenticación para evitar el flash de login
    try {
      await authStore.value.checkAuth();
      console.log('🔐 Autenticación inicializada correctamente');
    } catch (error) {
      console.warn('🔐 Error al inicializar autenticación:', error);
    }

    // AGREGAR: Inicializar sistema de módulos después de la autenticación
    try {
      if (authStore.value.user) {
        const userForModules = {
          id: authStore.value.user.uid,
          name: authStore.value.user.name || authStore.value.user.displayName || 'Usuario',
          email: authStore.value.user.email,
          role: authStore.value.user.role || 'musician',
          permissions: [
            'montaje:access',
            'montaje:read',
            'works:read',
            'evaluations:read',
            'reports:read',
            // Agregar más permisos según el rol del usuario
            ...(authStore.value.user.role === 'admin' ? ['*:*'] : []),
            ...(authStore.value.user.role === 'profesor' || authStore.value.user.role === 'maestro'
              ? ['works:*', 'evaluations:*', 'users:read']
              : []),
          ],
        };
        
        const moduleInitSuccess = initializeProjectModules(moduleManager, userForModules);
        if (moduleInitSuccess) {
          console.log('🎼 Sistema de módulos inicializado correctamente');
        }
      }
    } catch (error) {
      console.warn('🎼 Error al inicializar sistema de módulos:', error);
    }

    // Inicializar PWA después de la autenticación
    if (pwa.value) {
      try {
        await pwa.value.initializePWA();
        console.log('🚀 PWA inicializada correctamente');
        pwa.value.setupEventListeners();
        console.log('✅ [App] Event listeners del PWA configurados');
      } catch (error) {
        console.warn('🚀 Error al inicializar PWA:', error);
      }
    } else {
      console.log('⚠️ PWA no disponible, continuando sin funcionalidades offline');
    }

    // Inicializar Sync Manager
    // cleanupSyncManager = initializeSyncManager() // Temporalmente comentado
    console.log('🔄 [App] Sync Manager inicializado (comentado temporalmente)');

    // Mark app as initialized
    console.log('✅ [App] Marcando aplicación como inicializada');
    isAppInitialized.value = true;
    console.log('🎉 [App] Aplicación completamente inicializada');
  } catch (error) {
    console.error('❌ [App] Error inicializando aplicación:', error);
    console.error('📊 [App] Stack trace:', error);
    // Even on error, show the app to prevent infinite loading
    console.log('🔧 [App] Forzando inicialización para prevenir pantalla de carga infinita');
    isAppInitialized.value = true;
  }
});

// Limpiar event listeners al desmontar
onUnmounted(() => {
  if (pwa.value?.cleanupEventListeners) {
    pwa.value.cleanupEventListeners();
    console.log('🧹 [App] Event listeners del PWA limpiados');
  }
  if (cleanupSyncManager) {
    cleanupSyncManager();
    console.log('🧹 [App] Sync Manager limpiado');
  } else {
    console.log('🧹 [App] Sync Manager no estaba inicializado');
  }
});
</script>
