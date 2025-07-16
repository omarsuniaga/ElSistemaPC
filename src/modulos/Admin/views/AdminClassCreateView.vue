<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Crear Nueva Clase</h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Crea una nueva clase en el sistema
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <div class="max-w-7xl mx-auto">
        <CreateClassModal :show="true" @close="handleCloseModal" @created="handleClassCreated" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import CreateClassModal from '../components/CreateClassModal.vue';

const router = useRouter();

const handleCloseModal = () => {
  router.push('/admin/classes'); // Redirigir a la lista de clases al cerrar
};

const handleClassCreated = (classData: any) => {
  console.log('Clase creada exitosamente:', classData);
  router.push('/admin/classes'); // Redirigir a la lista de clases después de crear
};
</script>
