<!-- src/modulos/Admin/views/AdminStudentsAdvancedView.vue -->
<template>
  <div class="admin-students-advanced-view">
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb-nav mb-6">
      <ol class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <li>
          <router-link
            to="/admin"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronRightIcon class="w-4 h-4 mx-2" />
            Panel Admin
          </router-link>
        </li>
        <li class="flex items-center">
          <ChevronRightIcon class="w-4 h-4 mx-2" />
          <span class="text-gray-900 dark:text-white font-medium">
            Gestión Avanzada de Estudiantes
          </span>
        </li>
      </ol>
    </nav>

    <!-- Vista principal con componente avanzado -->
    <div class="advanced-view-container">
      <AdvancedStudentsManagement />
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isInitializing"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          <span class="text-gray-900 dark:text-white">Inicializando sistema...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';
import AdvancedStudentsManagement from '../components/AdvancedStudentsManagement.vue';
import { useAdminStudentsStore } from '../store/adminStudents';

// Stores
const adminStudentsStore = useAdminStudentsStore();

// Estado de inicialización
const isInitializing = ref(true);

// Head metadata - simulado
document.title = 'Gestión Avanzada de Estudiantes - Academia Musical';

// Lifecycle hooks
onMounted(async () => {
  try {
    // Verificar autenticación - simulado
    // if (!authStore.isAuthenticated) {
    //   throw new Error('Usuario no autenticado')
    // }

    // Inicializar datos necesarios
    await Promise.all([
      adminStudentsStore.loadStudents(),
      // adminStudentsStore.fetchStudentStats() // Usar método existente
    ]);

    console.log('✅ Sistema de gestión avanzada de estudiantes inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar gestión avanzada:', error);
    // Aquí podrías mostrar un toast de error o redirigir
  } finally {
    isInitializing.value = false;
  }
});

onUnmounted(() => {
  // Limpiar cualquier recurso si es necesario
  console.log('🧹 Limpiando recursos de gestión avanzada de estudiantes');
});
</script>

<style scoped>
.admin-students-advanced-view {
  min-height: 100vh;
  background: #f9fafb;
  padding: 1.5rem;
}

.breadcrumb-nav {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.advanced-view-container {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* Animaciones */
.advanced-view-container {
  animation: slideInUp 0.5s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .admin-students-advanced-view {
    padding: 1rem;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .admin-students-advanced-view {
    background: #111827;
  }

  .breadcrumb-nav,
  .advanced-view-container {
    background: #1f2937;
    border-color: #374151;
  }
}
</style>
