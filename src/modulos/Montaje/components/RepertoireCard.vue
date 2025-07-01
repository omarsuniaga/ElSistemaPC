<template>
  <div class="repertoire-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ repertoire.nombre }}</h3>
        <p class="text-sm text-gray-600">{{ repertoire.descripcion }}</p>
      </div>
      <div class="flex space-x-2">
        <button
          class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          @click="$emit('edit', repertoire)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          @click="$emit('delete', repertoire)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <span class="text-xs font-medium text-gray-500 uppercase">Tipo</span>
        <p class="text-sm font-medium">{{ repertoire.tipo }}</p>
      </div>
      <div>
        <span class="text-xs font-medium text-gray-500 uppercase">Estado</span>
        <span
          class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
          :class="getEstadoBadgeClass(repertoire.estado)"
        >
          {{ repertoire.estado }}
        </span>
      </div>
    </div>

    <div class="mb-4">
      <span class="text-xs font-medium text-gray-500 uppercase">Nivel de Dificultad</span>
      <div class="flex items-center mt-1">
        <div class="flex space-x-1">
          <span
            v-for="i in 5"
            :key="i"
            class="w-3 h-3 rounded-full"
            :class="i <= repertoire.nivelDificultad ? 'bg-yellow-400' : 'bg-gray-200'"
          />
        </div>
        <span class="ml-2 text-sm text-gray-600">{{ repertoire.nivelDificultad }}/5</span>
      </div>
    </div>

    <div class="flex justify-between items-center text-sm text-gray-600">
      <span>{{ repertoire.obras?.length || 0 }} obras</span>
      <span>{{ formatDate(repertoire.fechaCreacion) }}</span>
    </div>

    <div v-if="repertoire.etiquetas?.length" class="mt-3 flex flex-wrap gap-1">
      <span
        v-for="etiqueta in repertoire.etiquetas"
        :key="etiqueta"
        class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
      >
        {{ etiqueta }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import type {Repertorio, EstadoRepertorio} from "../types"
import {formatDate} from "../utils"

interface Props {
  repertoire: Repertorio
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [repertoire: Repertorio]
  delete: [repertoire: Repertorio]
  view: [repertoire: Repertorio]
}>()

const getEstadoBadgeClass = (estado: EstadoRepertorio) => {
  const classes = {
    BORRADOR: "bg-gray-100 text-gray-800",
    EN_REVISION: "bg-yellow-100 text-yellow-800",
    APROBADO: "bg-green-100 text-green-800",
    EN_MONTAJE: "bg-blue-100 text-blue-800",
    SUSPENDIDO: "bg-red-100 text-red-800",
    COMPLETADO: "bg-purple-100 text-purple-800",
  }
  return classes[estado] || "bg-gray-100 text-gray-800"
}
</script>
