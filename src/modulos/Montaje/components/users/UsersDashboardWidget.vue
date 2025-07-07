<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        👥 Usuarios
      </h3>
      <button
        @click="openUsers"
        class="text-blue-600 hover:text-blue-800 text-xs font-medium"
      >
        Ver →
      </button>
    </div>

    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Activos</span>
        <span class="font-medium text-green-600">24</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Nuevos hoy</span>
        <span class="font-medium text-blue-600">3</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { moduleManager } from '../../core/ModuleManager'

const openUsers = () => {
  // Activar el módulo montaje y navegar a la vista de usuarios
  moduleManager.activateModule('montaje')
  moduleManager.emitEvent('navigate', { module: 'montaje', view: 'users' })
}
</script>