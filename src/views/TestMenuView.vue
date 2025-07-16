<template>
  <div class="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Menú de Pruebas del Sistema</h1>

    <p class="text-gray-700 dark:text-gray-300 mb-6">
      Aquí puedes encontrar una lista organizada de las pruebas unitarias y de integración del proyecto.
      Haz clic en el nombre del archivo para ver su ubicación.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Tests de Stores -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">🧪 Tests de Stores</h2>
        <ul class="space-y-2">
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/store/montaje.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-300">montaje.test.ts</a></li>
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/store/montaje.simple.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-300">montaje.simple.test.ts</a></li>
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/store/repertorio.spec.ts')" class="text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-300">repertorio.spec.ts</a></li>
          <!-- Agrega más tests de stores aquí -->
        </ul>
      </div>

      <!-- Tests de Composables -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">🧩 Tests de Composables</h2>
        <ul class="space-y-2">
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/composables/useMaestroMontajeData.ts')" class="text-gray-800 dark:text-gray-200 hover:text-green-500 dark:hover:text-green-300">useMaestroMontajeData.test.ts</a></li>
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/composables/useMaestroMontajeUI.ts')" class="text-gray-800 dark:text-gray-200 hover:text-green-500 dark:hover:text-green-300">useMaestroMontajeUI.test.ts</a></li>
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/composables/useMontajePermissions.ts')" class="text-gray-800 dark:text-gray-200 hover:text-green-500 dark:hover:text-green-300">useMontajePermissions.test.ts</a></li>
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/composables/useMontaje.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-green-500 dark:hover:text-green-300">useMontaje.test.ts</a></li>
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/composables/useHeatmapTracking.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-green-500 dark:hover:text-green-300">useHeatmapTracking.test.ts</a></li>
          <!-- Agrega más tests de composables aquí -->
        </ul>
      </div>

      <!-- Tests de Componentes -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-4">⚛️ Tests de Componentes</h2>
        <ul class="space-y-2">
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/tests/EstadoSelectorModal.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-purple-500 dark:hover:text-purple-300">EstadoSelectorModal.test.ts</a></li>
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/tests/InstrumentGroupSelector.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-purple-500 dark:hover:text-purple-300">InstrumentGroupSelector.test.ts</a></li>
          <!-- Agrega más tests de componentes aquí -->
        </ul>
      </div>

      <!-- Tests de Vistas -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">👁️ Tests de Vistas</h2>
        <ul class="space-y-2">
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/views/ObraDetailView.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-300">ObraDetailView.test.ts</a></li>
          <!-- Agrega más tests de vistas aquí -->
        </ul>
      </div>

      <!-- Tests de Integración -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-yellow-600 dark:text-yellow-400 mb-4">🔗 Tests de Integración</h2>
        <ul class="space-y-2">
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/integration/montaje.integration.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-yellow-500 dark:hover:text-yellow-300">montaje.integration.test.ts</a></li>
          <!-- Agrega más tests de integración aquí -->
        </ul>
      </div>

      <!-- Tests de Utilidades -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-4">🛠️ Tests de Utilidades</h2>
        <ul class="space-y-2">
          <li><a href="#" @click.prevent="copyPath('src/modulos/Montaje/utils/index.test.ts')" class="text-gray-800 dark:text-gray-200 hover:text-teal-500 dark:hover:text-teal-300">index.test.ts</a></li>
          <!-- Agrega más tests de utilidades aquí -->
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toast-notification';

const $toast = useToast();

const copyPath = (path: string) => {
  navigator.clipboard.writeText(path).then(() => {
    $toast.success(`Ruta copiada: ${path}`, { position: 'top-right' });
  }).catch(err => {
    console.error('Error al copiar la ruta: ', err);
    $toast.error('No se pudo copiar la ruta.', { position: 'top-right' });
  });
};
</script>

<style scoped>
/* Puedes añadir estilos específicos si es necesario */
</style>
