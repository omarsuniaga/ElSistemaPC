<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useColorMode } from '@vueuse/core'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'

const colorMode = useColorMode({
  attribute: 'class',
  modes: {
    light: '',
    dark: 'dark',
  }
})

const route = useRoute()
// Show navigation only for authenticated routes
const showNavigation = computed(() => !route.meta.public)

// Referencia para medir la altura del menú de navegación
const navHeight = ref(0)
const mainContentClass = computed(() => {
  return showNavigation.value 
    ? `pb-${Math.ceil(navHeight.value / 4)}` // Convertir pixels a unidades rem aproximadas
    : '';
})

// Medir la altura del menú de navegación cuando el componente se monte
onMounted(() => {
  setTimeout(() => {
    const navElement = document.querySelector('nav');
    if (navElement) {
      navHeight.value = navElement.offsetHeight;
    }
  }, 100); // Pequeño retraso para asegurar que el menú esté renderizado
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Aplicamos padding-bottom dinámico basado en la presencia y altura del menú -->
    <main :class="['container mx-auto p-4', showNavigation ? 'pb-20' : '']">
      <router-view />
    </main>
    
    <!-- Show navigation only for authenticated routes -->
    <Navigation v-if="showNavigation" />
  </div>
</template>