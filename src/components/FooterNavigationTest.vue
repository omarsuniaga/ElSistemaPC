<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Test del Footer Navigation - Superusuario
      </h1>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Estado de Autenticación
        </h2>
        <div class="space-y-2">
          <p class="text-gray-700 dark:text-gray-300">
            <strong>Usuario autenticado:</strong> {{ authStore.isLoggedIn ? "Sí" : "No" }}
          </p>
          <p class="text-gray-700 dark:text-gray-300">
            <strong>Email:</strong> {{ authStore.user?.email || "N/A" }}
          </p>
          <p class="text-gray-700 dark:text-gray-300">
            <strong>Rol:</strong> {{ authStore.user?.role || "N/A" }}
          </p>
          <p class="text-gray-700 dark:text-gray-300">
            <strong>Es Superusuario:</strong> {{ authStore.isSuperusuario ? "Sí" : "No" }}
          </p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Items del Footer Navigation
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in footerItems"
            :key="item.to"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div class="flex items-center space-x-3">
              <component :is="item.icon" class="h-6 w-6 text-primary-600" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.to }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ item.ariaLabel }}</p>
              </div>
            </div>
            <router-link
              :to="item.to"
              class="mt-2 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ir a esta página →
            </router-link>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Instrucciones de Prueba
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Verifica que el footer navigation aparezca en la parte inferior de la pantalla</li>
          <li>Confirma que se muestren 5 elementos para el Superusuario</li>
          <li>Prueba hacer clic en cada elemento del footer para navegar</li>
          <li>Verifica que se resalte el elemento activo correctamente</li>
          <li>Prueba en modo oscuro y claro</li>
          <li>Prueba en diferentes tamaños de pantalla (responsividad)</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { superusuarioMenuItems } from '../modulos/Superusuario/constants/menuItems';

const authStore = useAuthStore();

// Obtener los items del footer navigation para Superusuario
const footerItems = computed(() => {
  if (authStore.isSuperusuario) {
    return [
      superusuarioMenuItems[0], // Dashboard
      superusuarioMenuItems[1], // Usuarios
      superusuarioMenuItems[2], // Roles
      superusuarioMenuItems[3], // Permisos
      superusuarioMenuItems[4], // Sistema
    ];
  }
  return [];
});
</script>
