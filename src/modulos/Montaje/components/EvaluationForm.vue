<template>
  <div class="evaluation-form bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Evaluar Obra</h3>
      <button v-if="!isEmbedded" class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
        ×
      </button>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Work Information -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-2">{{ work.title }}</h4>
        <p class="text-sm text-gray-600">{{ work.composer }}</p>
      </div>

      <!-- Score -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Puntuación (0-100) * </label>
        <div class="flex items-center space-x-4">
          <input
            v-model.number="form.score"
            type="range"
            min="0"
            max="100"
            step="5"
            class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div class="text-lg font-semibold text-blue-600 min-w-[3rem]">
            {{ form.score }}
          </div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>Deficiente</span>
          <span>Regular</span>
          <span>Bueno</span>
          <span>Muy Bueno</span>
          <span>Excelente</span>
        </div>
      </div>

      <!-- Criteria Evaluation -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Criterios de Evaluación</h4>
        <div class="space-y-4">
          <div
            v-for="criterion in evaluationCriteria"
            :key="criterion.key"
            class="flex items-center justify-between p-3 border rounded-lg"
          >
            <div>
              <div class="font-medium text-sm text-gray-900">{{ criterion.name }}</div>
              <div class="text-xs text-gray-500">{{ criterion.description }}</div>
            </div>
            <select
              v-model="form.criteria[criterion.key]"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-</option>
              <option value="poor">Deficiente</option>
              <option value="fair">Regular</option>
              <option value="good">Bueno</option>
              <option value="very-good">Muy Bueno</option>
              <option value="excellent">Excelente</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Comentarios </label>
        <textarea
          v-model="form.comments"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Proporciona comentarios detallados sobre la interpretación..."
        />
      </div>

      <!-- Recommendations -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Recomendaciones </label>
        <textarea
          v-model="form.recommendations"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Sugerencias para mejorar la interpretación..."
        />
      </div>

      <!-- Areas for Improvement -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Áreas de mejora </label>
        <div class="space-y-2">
          <label v-for="area in improvementAreas" :key="area" class="flex items-center space-x-2">
            <input
              v-model="form.areasForImprovement"
              type="checkbox"
              :value="area"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">{{ area }}</span>
          </label>
        </div>
      </div>

      <!-- Private Notes (for evaluator only) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Notas privadas
          <span class="text-xs text-gray-500">(solo visible para el evaluador)</span>
        </label>
        <textarea
          v-model="form.privateNotes"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Notas internas del evaluador..."
        />
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="text-red-500">
            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-6 border-t">
        <button
          v-if="!isEmbedded"
          type="button"
          class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          @click="$emit('close')"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="loading"
          class="px-4 py-2 text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50"
          @click="saveDraft"
        >
          Guardar borrador
        </button>
        <button
          type="submit"
          :disabled="loading || !isFormValid"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Enviando..." : "Enviar Evaluación" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import type {Work, CreateEvaluationInput} from "../types"

interface Props {
  work: Work
  loading?: boolean
  isEmbedded?: boolean
  existingEvaluation?: any
}

interface Emits {
  (e: "close"): void
  (e: "submit", data: CreateEvaluationInput): void
  (e: "save-draft", data: CreateEvaluationInput): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isEmbedded: false,
  existingEvaluation: undefined,
})

const emit = defineEmits<Emits>()

// Form state
const form = ref<CreateEvaluationInput>({
  workId: props.work.id,
  score: 75,
  comments: "",
  recommendations: "",
  criteria: {},
  areasForImprovement: [],
  privateNotes: "",
})

const error = ref("")

// Evaluation criteria
const evaluationCriteria = [
  {
    key: "technique",
    name: "Técnica",
    description: "Precisión técnica e interpretación",
  },
  {
    key: "rhythm",
    name: "Ritmo",
    description: "Precisión rítmica y tempo",
  },
  {
    key: "intonation",
    name: "Afinación",
    description: "Precisión en la afinación",
  },
  {
    key: "expression",
    name: "Expresión",
    description: "Musicalidad y expresión artística",
  },
  {
    key: "ensemble",
    name: "Conjunto",
    description: "Coordinación con el grupo",
  },
  {
    key: "preparation",
    name: "Preparación",
    description: "Nivel de preparación de la obra",
  },
]

// Areas for improvement
const improvementAreas = [
  "Técnica instrumental",
  "Lectura a primera vista",
  "Interpretación musical",
  "Dinámicas",
  "Articulación",
  "Fraseo",
  "Tempo y ritmo",
  "Afinación",
  "Coordinación de conjunto",
  "Preparación individual",
]

// Computed properties
const isFormValid = computed(() => {
  return form.value.score >= 0 && form.value.score <= 100 && form.value.comments.trim() !== ""
})

// Methods
const handleSubmit = () => {
  if (!isFormValid.value) {
    error.value = "Por favor, completa todos los campos obligatorios"
    return
  }

  error.value = ""
  emit("submit", {...form.value})
}

const saveDraft = () => {
  error.value = ""
  emit("save-draft", {...form.value})
}

// Initialize form with existing evaluation if provided
onMounted(() => {
  if (props.existingEvaluation) {
    form.value = {
      workId: props.work.id,
      score: props.existingEvaluation.score,
      comments: props.existingEvaluation.comments || "",
      recommendations: props.existingEvaluation.recommendations || "",
      criteria: {...props.existingEvaluation.criteria},
      areasForImprovement: [...(props.existingEvaluation.areasForImprovement || [])],
      privateNotes: props.existingEvaluation.privateNotes || "",
    }
  }
})
</script>

<style scoped>
/* Custom range slider styling */
input[type="range"] {
  background: linear-gradient(
    to right,
    #ef4444 0%,
    #f59e0b 25%,
    #eab308 50%,
    #22c55e 75%,
    #10b981 100%
  );
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
