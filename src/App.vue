<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">    <!-- Loading overlay during auth initialization -->
    <div 
      v-if="!authStore.isInitialized" 
      class="fixed inset-0 bg-background flex items-center justify-center z-50"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" style="border-color: var(--color-primary);"></div>
        <p class="text-secondary">Iniciando aplicación...</p>
      </div>
    </div>
    
    <!-- Main app content -->
    <template v-else>
      <HeaderApp />
      <!-- Espaciador para compensar el header fijo -->
      <div class="header-spacer"></div>
      <RouterView />
      <FooterNavigation />
        <!-- Gestor de invitaciones para maestros -->
      <TeacherInvitationManager v-if="shouldShowInvitationManager" />
      
      <!-- Panel de depuración (solo en desarrollo) -->
      <DebugInvitations v-if="isDev" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted, watch, computed } from 'vue';
import { setupPersistence } from './firebase';
import FooterNavigation from './components/FooterNavigation.vue';
import { useAuthStore } from './stores/auth';
import { provideTheme } from './contexts/ThemeContext';
import HeaderApp from './components/HeaderApp.vue';
import TeacherInvitationManager from './modulos/Teachers/components/TeacherInvitationManager.vue';
import DebugInvitations from './components/DebugInvitations.vue';

// Proveer el contexto de tema para toda la aplicación
const { isDarkMode } = provideTheme();

const authStore = useAuthStore();
const user = authStore.user;
const isLoggedIn = authStore.isLoggedIn;
const isLoading = authStore.isLoading;
const isDev = import.meta.env.DEV;

// Mostrar gestor de invitaciones solo para maestros autenticados
const shouldShowInvitationManager = computed(() => {
  return (
    isLoggedIn && 
    user && 
    (user.role?.toLowerCase() === 'maestro' || user.role?.toLowerCase() === 'profesor')
  );
});

// Configurar Firebase solo después de que el componente esté montado
onMounted(async () => {
  // Configurar persistencia después de que todo esté inicializado
  try {
    await setupPersistence();
    console.log('Bienvenidos al Sistema Punta Cana, Debes Logearte para continuar');
  } catch (error) {
    console.warn('No se pudo habilitar la persistencia:', error);
  }

  // Inicializar autenticación para evitar el flash de login
  try {
    await authStore.checkAuth();
    console.log('🔐 Autenticación inicializada correctamente');
  } catch (error) {
    console.warn('🔐 Error al inicializar autenticación:', error);
  }
});
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 70px; /* Espacio para el footer */
  background-color: var(--color-background);
  color: var(--color-text-primary);
  transition: background-color 0.3s, color 0.3s;
}

/* Espaciador para el header fijo */
.header-spacer {
  height: 56px; /* Altura base del header */
}

/* Cuando el buscador está abierto, añadir más espacio */
.header-has-search .header-spacer {
  height: 108px; /* Altura del header con el buscador */
}

body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
}
</style>