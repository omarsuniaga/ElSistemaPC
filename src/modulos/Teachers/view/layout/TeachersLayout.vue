<!-- src/modulos/Teachers/view/layout/TeachersLayout.vue -->
<template>
    <div class="teachers-layout">
      <header class="module-header">
        <h2>Gestión de Maestros</h2>
        <!-- Aquí puedes incluir botones o enlaces específicos del módulo -->
      </header>
      
      <!-- Componente de navegación global (o específico del módulo si prefieres) -->
      <Navigation />
  
      <!-- Contenedor principal de vistas -->
      <main>
        <router-view />
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  import Navigation from '@/components/Navigation.vue'
  </script>
  
  <style scoped>
  .teachers-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .module-header {
    padding: 1rem;
    background-color: var(--color-primary);
    color: white;
  }
  main {
    flex: 1;
    padding: 1rem;
  }
  </style>
  