<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
    @click="$emit('irAConfiguracionAula')"
  >
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      ⚙️ Configuración del Aula
    </h3>
    <p class="text-gray-600 dark:text-gray-300">
      Personaliza los ajustes de tu aula virtual y preferencias de enseñanza.
    </p>
    <div class="mt-4 flex justify-end">
      <button
        class="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
      >
        <span>Ir a Configuración</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['irAConfiguracionAula']);
</script>
