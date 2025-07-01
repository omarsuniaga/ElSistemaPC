<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center"
  >
    <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">{{ title }}</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            {{ message }}
          </p>
        </div>
        <div class="items-center px-4 py-3 space-x-2">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            @click="$emit('cancel')"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            @click="$emit('confirm')"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
/* Add any specific styling for the dialog */
</style>
