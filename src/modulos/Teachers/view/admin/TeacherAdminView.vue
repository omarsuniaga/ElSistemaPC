<!-- /src/modulos/Teachers/view/admin/TeacherAdminView.vue -->
<template>
    <div class="teacher-admin">
      <header class="page-header">
        <h1>Panel de Administración de Maestros</h1>
        <p>Aquí puedes gestionar todos los maestros.</p>
      </header>
      <section class="admin-dashboard">
        <!-- Sección de Listado de Maestros -->
        <div class="admin-section">
           <h2>Listado de Maestros</h2>
           <!-- Aquí puedes integrar un componente que liste maestros con opciones de edición/eliminación -->
           <!-- Por ejemplo: <TeacherList :teachers="allTeachers" /> -->
        </div>
        <!-- Sección de Estadísticas o Reportes -->
        <div class="admin-section">
           <h2>Estadísticas y Reportes</h2>
           <!-- Aquí puedes mostrar gráficos, estadísticas y resúmenes para la administración -->
           <!-- Por ejemplo: <TeacherStatistics :teachers="allTeachers" /> -->
        </div>
      </section>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import { useTeachersStore } from '../../../../modulos/Teachers/store/teachers'
  import { useAuthStore } from '../../../../stores/auth'
  
  const teachersStore = useTeachersStore()
  const authStore = useAuthStore()
  
  // Obtener el listado completo de maestros para la administración
  const allTeachers = computed(() => teachersStore.teachers)
  </script>
  
  <style scoped>
  .teacher-admin {
    padding: 1rem;
  }
  .page-header {
    margin-bottom: 1.5rem;
  }
  .admin-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: var(--color-bg-secondary);
    border-radius: 8px;
  }
  </style>
  