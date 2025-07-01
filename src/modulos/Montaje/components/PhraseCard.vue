<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <!-- Phrase Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <h4 class="text-lg font-medium text-gray-900 mb-1">
          {{ phrase.nombre }}
        </h4>
        <div class="flex items-center space-x-3 text-sm text-gray-600 mb-2">
          <span v-if="phrase.compases" class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            Compases: {{ phrase.compases }}
          </span>
          <span v-if="phrase.tempo" class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{ phrase.tempo }}
          </span>
          <span v-if="phrase.tonalidad" class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 01-1-1V5a1 1 0 011-1h4z"
              />
            </svg>
            {{ phrase.tonalidad }}
          </span>
        </div>
      </div>

      <!-- Priority and Difficulty Badges -->
      <div class="flex flex-col space-y-2 ml-4">
        <span
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          :class="priorityClasses"
        >
          {{ priorityText }}
        </span>
        <span
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          :class="difficultyClasses"
        >
          {{ difficultyText }}
        </span>
      </div>
    </div>

    <!-- Description -->
    <p v-if="phrase.descripcion" class="text-sm text-gray-600 mb-4">
      {{ phrase.descripcion }}
    </p>

    <!-- Technical Aspects -->
    <div v-if="phrase.aspectosTecnicos.length > 0" class="mb-4">
      <h5 class="text-sm font-medium text-gray-700 mb-2">Aspectos Técnicos</h5>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="aspecto in phrase.aspectosTecnicos"
          :key="aspecto"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
        >
          {{ getAspectoLabel(aspecto) }}
        </span>
      </div>
    </div>

    <!-- Study Objectives -->
    <div v-if="phrase.objetivosEstudio.length > 0" class="mb-4">
      <h5 class="text-sm font-medium text-gray-700 mb-2">Objetivos de Estudio</h5>
      <ul class="space-y-1">
        <li
          v-for="(objetivo, index) in phrase.objetivosEstudio"
          :key="index"
          class="flex items-start text-sm text-gray-600"
        >
          <svg
            class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          {{ objetivo }}
        </li>
      </ul>
    </div>

    <!-- Current State -->
    <div v-if="currentState" class="mb-4 p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center justify-between mb-2">
        <h5 class="text-sm font-medium text-gray-700">Estado Actual</h5>
        <span
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          :class="getStateClasses(currentState.estado)"
        >
          {{ getStateLabel(currentState.estado) }}
        </span>
      </div>
      <div class="flex items-center space-x-4 text-xs text-gray-500">
        <span>Calificación: {{ currentState.calificacion }}/10</span>
        <span>Actualizado: {{ formatDate(currentState.fechaActualizacion) }}</span>
      </div>
      <p v-if="currentState.observaciones" class="text-sm text-gray-600 mt-2">
        {{ currentState.observaciones }}
      </p>
    </div>

    <!-- Notes -->
    <div v-if="phrase.notas" class="mb-4">
      <h5 class="text-sm font-medium text-gray-700 mb-2">Notas</h5>
      <p class="text-sm text-gray-600">{{ phrase.notas }}</p>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-200">
      <div class="flex items-center space-x-2 text-xs text-gray-500">
        <span>Última actualización:</span>
        <span>{{ formatDate(phrase.fechaActualizacion) }}</span>
      </div>

      <div class="flex items-center space-x-2">
        <button
          class="inline-flex items-center px-3 py-1.5 text-sm text-green-600 hover:text-green-800 border border-green-200 hover:border-green-300 rounded-md transition-colors"
          @click="$emit('evaluate', phrase)"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Evaluar
        </button>

        <button
          class="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
          @click="$emit('edit', phrase)"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import type {FraseMusical, EstadoFrase} from "../types"
import {formatDate} from "../utils"

interface Props {
  phrase: FraseMusical
  currentState?: EstadoFrase | null
}

interface Emits {
  (e: "edit", phrase: FraseMusical): void
  (e: "evaluate", phrase: FraseMusical): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const priorityText = computed(() => {
  switch (props.phrase.prioridad) {
    case "baja":
      return "Baja"
    case "media":
      return "Media"
    case "alta":
      return "Alta"
    case "critica":
      return "Crítica"
    default:
      return "Media"
  }
})

const priorityClasses = computed(() => {
  switch (props.phrase.prioridad) {
    case "baja":
      return "bg-gray-100 text-gray-800"
    case "media":
      return "bg-yellow-100 text-yellow-800"
    case "alta":
      return "bg-orange-100 text-orange-800"
    case "critica":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
})

const difficultyText = computed(() => {
  switch (props.phrase.dificultad) {
    case "facil":
      return "Fácil"
    case "intermedio":
      return "Intermedio"
    case "avanzado":
      return "Avanzado"
    case "experto":
      return "Experto"
    default:
      return "Intermedio"
  }
})

const difficultyClasses = computed(() => {
  switch (props.phrase.dificultad) {
    case "facil":
      return "bg-green-100 text-green-800"
    case "intermedio":
      return "bg-blue-100 text-blue-800"
    case "avanzado":
      return "bg-purple-100 text-purple-800"
    case "experto":
      return "bg-red-100 text-red-800"
    default:
      return "bg-blue-100 text-blue-800"
  }
})

const getAspectoLabel = (aspecto: string) => {
  const aspectos: Record<string, string> = {
    afinacion: "Afinación",
    ritmo: "Ritmo",
    dinamica: "Dinámica",
    articulacion: "Articulación",
    fraseo: "Fraseo",
    tecnica: "Técnica",
    expresion: "Expresión",
    balance: "Balance",
    precision: "Precisión",
  }
  return aspectos[aspecto] || aspecto
}

const getStateLabel = (estado: string) => {
  switch (estado) {
    case "no_iniciado":
      return "No Iniciado"
    case "en_proceso":
      return "En Proceso"
    case "en_revision":
      return "En Revisión"
    case "completado":
      return "Completado"
    case "necesita_trabajo":
      return "Necesita Trabajo"
    default:
      return estado
  }
}

const getStateClasses = (estado: string) => {
  switch (estado) {
    case "no_iniciado":
      return "bg-gray-100 text-gray-800"
    case "en_proceso":
      return "bg-blue-100 text-blue-800"
    case "en_revision":
      return "bg-yellow-100 text-yellow-800"
    case "completado":
      return "bg-green-100 text-green-800"
    case "necesita_trabajo":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
</script>
