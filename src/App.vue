<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
    <HeaderApp />
    <!-- Espaciador para compensar el header fijo -->
    <div class="header-spacer"></div>
    <RouterView />
    <FooterNavigation />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted, watch } from 'vue';
import { setupPersistence } from './firebase';
import FooterNavigation from './components/FooterNavigation.vue';
import { useAuthStore } from './stores/auth';
import { provideTheme } from './contexts/ThemeContext';
import HeaderApp from './components/HeaderApp.vue';

// Proveer el contexto de tema para toda la aplicación
const { isDarkMode } = provideTheme();

const authStore = useAuthStore();

// Configurar Firebase solo después de que el componente esté montado
onMounted(async () => {
  // Configurar persistencia después de que todo esté inicializado
  try {
    await setupPersistence();
  } catch (error) {
    console.warn('No se pudo habilitar la persistencia:', error);
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

/* Variables para el tema claro (predeterminado) */
:root {
  --bg-color: #f8f9fa;
  --text-color: #212529;
  --card-bg: #ffffff;
  --border-color: #dee2e6;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

/* Variables para el tema oscuro */
.dark-mode {
  --bg-color: #121212;
  --text-color: #e9ecef;
  --card-bg: #212529;
  --border-color: #495057;
  --shadow-color: rgba(0, 0, 0, 0.3);
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
</style>