<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <main class="container mx-auto p-4">
      <router-view />
    </main>
    <!-- Show navigation only for authenticated routes -->
    <Navigation v-if="showNavigation" />
  </div>
</template>