<template>
  <div class="unauthorized-container">
    <h1>Acceso No Autorizado</h1>
    <p>Lo sentimos, no tienes permisos para acceder a esta página.</p>
    <router-link to="/" class="back-link">Volver al Inicio</router-link>
  </div>
</template>

<script setup lang="ts">
// No se requiere lógica adicional por ahora
</script>

<style scoped>
.unauthorized-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
  padding: 2rem;
}

h1 {
  color: #dc2626;
  margin-bottom: 1rem;
  font-size: 2rem;
}

p {
  color: #4b5563;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.back-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: 2px solid #3b82f6;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
}

.back-link:hover {
  background-color: #3b82f6;
  color: white;
}
</style>
