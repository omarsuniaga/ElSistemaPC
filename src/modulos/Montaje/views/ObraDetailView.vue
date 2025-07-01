<template>
  <div class="obra-detail-view min-h-screen bg-gray-50">
    <!-- Professional Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <!-- Breadcrumb -->
          <nav class="mb-4" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2 text-sm">
              <li>
                <button
                  class="text-gray-500 hover:text-gray-700 transition-colors"
                  @click="$router.push('/montaje')"
                >
                  Montaje
                </button>
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-gray-700 font-medium">{{ obra?.titulo || "Cargando..." }}</span>
              </li>
            </ol>
          </nav>

          <!-- Main Header -->
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center">
                <button
                  class="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Volver"
                  @click="$router.go(-1)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
                    {{ obra?.titulo || "Cargando..." }}
                  </h1>
                  <div class="mt-1 flex items-center space-x-4">
                    <p class="text-lg text-gray-600">{{ obra?.compositor || "" }}</p>
                    <span
                      v-if="obra?.estado"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getEstadoBadgeClass(obra.estado)"
                    >
                      {{ obra.estado.replace("_", " ") }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 lg:mt-0 flex space-x-3">
              <button
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                @click="generateReport"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generar Reporte
              </button>
              <button
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
                @click="editObra"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar Obra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Professional Tabs Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200">
          <nav class="flex space-x-8 px-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all"
              :class="
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              "
              @click="activeTab = tab.id"
            >
              {{ tab.name }}
              <span
                v-if="tab.count !== undefined"
                class="ml-2 py-0.5 px-2 rounded-full text-xs"
                :class="
                  activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                "
              >
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Tab: Heat Map -->
          <div v-if="activeTab === 'mapa'" class="space-y-6">
            <div class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Mapa de Calor de Compases</h3>
              <p class="mt-1 text-sm text-gray-500">
                El mapa de calor se cargará aquí cuando esté disponible.
              </p>
            </div>
          </div>

          <!-- Tab: Phrases -->
          <div v-if="activeTab === 'frases'" class="space-y-6">
            <div class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No hay frases definidas</h3>
              <p class="mt-1 text-sm text-gray-500">
                Comienza agregando la primera frase musical de la obra.
              </p>
              <div class="mt-6">
                <button
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  @click="addFrase"
                >
                  Agregar Primera Frase
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Plans -->
          <div v-if="activeTab === 'planes'" class="space-y-6">
            <div class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No hay planes creados</h3>
              <p class="mt-1 text-sm text-gray-500">
                Crea un plan de estudio para organizar el trabajo en esta obra.
              </p>
              <div class="mt-6">
                <button
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  @click="createPlan"
                >
                  Crear Primer Plan
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Evaluations -->
          <div v-if="activeTab === 'evaluaciones'" class="space-y-6">
            <div class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No hay evaluaciones</h3>
              <p class="mt-1 text-sm text-gray-500">
                Comienza creando la primera evaluación de esta obra.
              </p>
              <div class="mt-6">
                <button
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  @click="newEvaluation"
                >
                  Crear Primera Evaluación
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Students -->
          <div v-if="activeTab === 'alumnos'" class="space-y-6">
            <div class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No hay alumnos asignados</h3>
              <p class="mt-1 text-sm text-gray-500">
                Asigna estudiantes para que trabajen en esta obra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Professional Modals -->
    <WorkFormModal
      v-if="showEditModal"
      :work="obra"
      :is-edit="true"
      @close="showEditModal = false"
      @save="updateObra"
    />

    <PhraseFormModal
      v-if="showPhraseModal"
      :is-open="showPhraseModal"
      :phrase="selectedFrase"
      :available-works="obra ? [obra] : []"
      :on-close="() => (showPhraseModal = false)"
      :on-saved="handlePhraseSave"
    />
    <EvaluationForm
      v-if="showEvaluationModal && obra"
      :work="obra"
      @close="showEvaluationModal = false"
      @submit="saveEvaluation"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRoute, useRouter} from "vue-router"

// Component imports
import WorkFormModal from "../components/WorkFormModal.vue"
import PhraseFormModal from "../components/PhraseFormModal.vue"
import EvaluationForm from "../components/EvaluationForm.vue"

import type {
  Obra,
  FraseMontaje as Frase,
  PlanAccion as Plan,
  EvaluacionContinua as Evaluacion,
  CreateEvaluationInput,
} from "../types"
import {useMontaje} from "../composables/useMontaje"
import {useMontajeStore} from "../store/montaje"
import {Compas} from "../service/compasService"
import {formatDate, formatDuration} from "../utils"

// Router and Route
const route = useRoute()
const router = useRouter()

// Stores
const montajeStore = useMontajeStore()

// Composable
const montajeComposable = useMontaje()
const {cargarObra, cargarPlan, obras, obraActual, frases, planAccion} = montajeComposable

// Reactive data
const obra = ref<Obra | null>(null)
const frasesLocal = ref<Frase[]>([])
const planes = ref<Plan[]>([])
const evaluaciones = ref<Evaluacion[]>([])
const alumnos = ref([])
const loading = ref(true)
const error = ref<string | null>(null)

// UI State
const activeTab = ref("mapa")
const showEditModal = ref(false)
const showPhraseModal = ref(false)
const showEvaluationModal = ref(false)
const selectedFrase = ref<Frase | null>(null)

// Props
const obraId = route.params.id as string

// Computed
const tabs = computed(() => [
  {id: "mapa", name: "Mapa de Calor", count: undefined},
  {id: "frases", name: "Frases", count: frases.value?.length || frasesLocal.value.length},
  {id: "planes", name: "Planes", count: planAccion.value ? 1 : 0},
  {id: "evaluaciones", name: "Evaluaciones", count: evaluaciones.value.length},
  {id: "alumnos", name: "Alumnos", count: alumnos.value.length},
])

// Methods
const getEstadoBadgeClass = (estado: string) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
  switch (estado) {
    case "activa":
      return `${baseClasses} bg-green-100 text-green-800`
    case "en_progreso":
      return `${baseClasses} bg-blue-100 text-blue-800`
    case "completada":
      return `${baseClasses} bg-gray-100 text-gray-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}

const loadData = async () => {
  try {
    loading.value = true
    error.value = null

    // Load main data using composable methods
    await cargarObra(obraId)

    // Get obra from store after loading
    obra.value = obraActual.value

    // Load plan and frases if obra exists
    if (obra.value) {
      try {
        await cargarPlan(obraId)
        // frases and evaluaciones are loaded via the store's reactive state
        frasesLocal.value = frases.value || []
        evaluaciones.value = [] // TODO: Load evaluaciones when method is available
      } catch (planError) {
        console.warn("No plan found for obra:", obraId)
        frasesLocal.value = []
        evaluaciones.value = []
      }
    }

    // Load students related to this obra
    await loadAlumnos()
  } catch (err) {
    console.error("Error loading obra data:", err)
    error.value = err instanceof Error ? err.message : "Error desconocido"

    // Fallback: try to find obra in existing obras array
    const existingObra = obras.value.find((o) => o.id === obraId)
    if (existingObra) {
      obra.value = existingObra
    }
  } finally {
    loading.value = false
  }
}

const loadAlumnos = async () => {
  try {
    // TODO: Load students related to this obra when students store is available
    // For now, we'll use an empty array
    alumnos.value = []
    console.log("Students loaded successfully (placeholder)")
  } catch (err) {
    console.error("Error loading alumnos:", err)
    alumnos.value = []
  }
}

// Action Methods
const editObra = () => {
  showEditModal.value = true
}

const generateReport = async () => {
  try {
    // Generate PDF report for the obra
    console.log("Generating report for obra:", obraId)
    // TODO: Implement PDF generation
  } catch (err) {
    console.error("Error generating report:", err)
  }
}

const addFrase = () => {
  selectedFrase.value = null
  showPhraseModal.value = true
}

const createPlan = () => {
  console.log("Creating plan for obra:", obraId)
  // TODO: Implement plan creation
}

const newEvaluation = () => {
  showEvaluationModal.value = true
}

const updateObra = async (updatedObra: Obra) => {
  try {
    obra.value = updatedObra
    showEditModal.value = false
    // TODO: Update in store/API
  } catch (err) {
    console.error("Error updating obra:", err)
  }
}

const handlePhraseSave = async (savedFrase: Frase) => {
  try {
    if (savedFrase.id) {
      // Update existing
      const index = frasesLocal.value.findIndex((f) => f.id === savedFrase.id)
      if (index !== -1) {
        frasesLocal.value[index] = savedFrase
      }
    } else {
      // Add new
      frasesLocal.value.push(savedFrase)
    }
    showPhraseModal.value = false
  } catch (err) {
    console.error("Error saving frase:", err)
  }
}

const saveEvaluation = async (evaluationData: CreateEvaluationInput) => {
  try {
    console.log("Saving evaluation:", evaluationData)
    // TODO: Implement evaluation saving when the API is ready
    // For now, just close the modal
    showEvaluationModal.value = false
  } catch (err) {
    console.error("Error saving evaluation:", err)
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.obra-detail-view {
  min-height: 100vh;
}

/* Professional transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Custom scrollbar for content areas */
.space-y-6 {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.space-y-6::-webkit-scrollbar {
  width: 6px;
}

.space-y-6::-webkit-scrollbar-track {
  background: #f7fafc;
}

.space-y-6::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.space-y-6::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
