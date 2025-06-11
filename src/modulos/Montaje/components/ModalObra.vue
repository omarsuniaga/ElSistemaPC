<template>
  <div class="modal-placeholder bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">{{ obra ? 'Editar Obra' : 'Nueva Obra' }}</h3>
      <p class="text-gray-600 mb-4">Modal para gestión de obras en desarrollo...</p>
      <div class="flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Cerrar
        </button>
        <button
          @click="$emit('guardar', {})"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Obra } from '../types'

interface Props {
  obra?: Obra | null
  'repertorio-id'?: string
}

defineProps<Props>()

defineEmits<{
  (e: 'close'): void
  (e: 'guardar', data: Obra): void
}>()
</script>
