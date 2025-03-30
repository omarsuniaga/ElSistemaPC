<template>
  <div class="app-container">
    <RouterView />
    <FooterNavigation />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import { setupPersistence } from './firebase';
import FooterNavigation from './components/FooterNavigation.vue';

// Configurar Firebase solo después de que el componente esté montado
onMounted(async () => {
  // Conectar emuladores si estamos en desarrollo
  
  
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
}
</style>