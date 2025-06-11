<template>
  <div class="obra-detail-view p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex justify-between items-start">
        <div>
          <button
            @click="$router.go(-1)"
            class="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 class="text-2xl font-bold text-gray-900">{{ obra?.titulo }}</h1>
          <p class="text-gray-600">{{ obra?.compositor }}</p>
        </div>
        <div class="flex space-x-3">
          <button
            @click="editObra"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Editar
          </button>
          <button
            @click="generateReport"
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Generar Reporte
          </button>
        </div>
      </div>
    </div>

    <!-- Información General -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Información General</h2>
          <div class="grid grid-cols-2 gap-4 my-4">
            <div>
              <span class="text-sm text-gray-500">Duración</span>
              <p>{{ formatDuration(obra.value?.duracionEstimada || 0) }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">Nivel de Dificultad</span>
              <div class="flex items-center">
                <div class="flex space-x-1">
                  <span 
                    v-for="i in 5" 
                    :key="i"
                    class="w-3 h-3 rounded-full"
                    :class="i <= (obra?.nivelDificultad || 0) ? 'bg-yellow-400' : 'bg-gray-200'"
                  ></span>
                </div>
                <span class="ml-2 text-sm text-gray-600">{{ obra?.nivelDificultad }}/5</span>
              </div>
            </div>
            <div>
              <span class="text-sm text-gray-500">Dificultad</span>
              <p class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs font-medium rounded-full" 
                  :class="getDifficultyClass(obra.value?.metadatos?.dificultad || 'INTERMEDIO')"
                >
                  {{ obra.value?.metadatos?.dificultad || 'INTERMEDIO' }}
                </span>
              </p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">Fecha de Creación</span>
              <p class="text-lg">{{ formatDate(obra?.fechaCreacion) }}</p>
            </div>
          </div>
          <div v-if="obra?.descripcion" class="mt-4">
            <span class="text-sm font-medium text-gray-500">Descripción</span>
            <p class="text-gray-700">{{ obra.descripcion }}</p>
          </div>
        </div>
      </div>

      <div>
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Progreso</h2>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>Progreso General</span>
                <span>{{ progressPercentage }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full"
                  :style="{ width: `${progressPercentage}%` }"
                ></div>
              </div>
            </div>
            <div v-if="obra?.frases?.length">
              <span class="text-sm font-medium text-gray-500">Frases completadas</span>
              <p class="text-2xl font-bold">{{ completedPhrases }}/{{ obra.frases.length }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="py-4 px-1 border-b-2 font-medium text-sm"
            :class="activeTab === tab.id 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <div class="p-6">
        <!-- Tab: Mapa de Calor -->
        <div v-if="activeTab === 'mapa'">
          <!-- Tab de mapa de calor -->
          <HeatMap 
            :obra-id="obraId" 
            :compases="compases" 
            @compas-updated="handleCompasUpdated"
          />
        </div>

        <!-- Tab: Frases -->
        <div v-if="activeTab === 'frases'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium">Frases Musicales</h3>
            <button
              @click="addFrase"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nueva Frase
            </button>
          </div>
          <div class="space-y-4">
            <!-- Empty state -->
            <div v-if="!obra?.frases?.length" class="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p class="text-gray-500">No hay frases definidas</p>
              <button
                @click="addFrase"
                class="mt-2 text-blue-600 hover:text-blue-800"
              >
                Agregar frase
              </button>
            </div>

            <!-- Phrases list -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="frase in obra.frases"
                :key="frase.id"
                class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex justify-between mb-2">
                  <h4 class="font-medium">{{ frase.titulo }}</h4>
                  <div class="flex space-x-1">
                    <button
                      @click="evaluateFrase(frase)"
                      class="text-yellow-600 hover:text-yellow-800 p-1 hover:bg-yellow-50 rounded"
                      title="Evaluar frase"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                      </svg>
                    </button>
                    <button
                      @click="editFrase(frase)"
                      class="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                      title="Editar frase"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                    </button>
                    <button
                      @click="deleteFrase(frase)"
                      class="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                      title="Eliminar frase"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="mb-3">
                  <div class="flex justify-between text-sm mb-1">
                    <span class="flex items-center">
                      <span 
                        class="inline-block w-2 h-2 rounded-full mr-1"
                        :class="{
                          'bg-green-500': frase.estado === 'COMPLETADA',
                          'bg-yellow-500': frase.estado === 'EN_PROGRESO',
                          'bg-red-500': frase.estado === 'PENDIENTE'
                        }"
                      ></span>
                      {{ frase.estado }}
                    </span>
                    <span>{{ frase.progreso }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      class="h-1.5 rounded-full"
                      :class="{
                        'bg-green-600': frase.progreso >= 75,
                        'bg-blue-600': frase.progreso >= 40 && frase.progreso < 75,
                        'bg-yellow-500': frase.progreso >= 20 && frase.progreso < 40,
                        'bg-red-500': frase.progreso < 20
                      }"
                      :style="{ width: `${frase.progreso}%` }"
                    ></div>
                  </div>
                </div>
                <p class="text-sm text-gray-600 mb-2">{{ frase.descripcion }}</p>
                <div class="text-xs text-gray-500 flex justify-between">
                  <span>Compases: {{ frase.compasInicial }} - {{ frase.compasInicial + frase.totalCompases - 1 }}</span>
                  <span>{{ formatDate(frase.fechaActualizacion) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Planes -->
        <div v-if="activeTab === 'planes'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium">Planes de Montaje</h3>
            <button
              @click="createPlan"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Crear Plan
            </button>
          </div>
          <div class="space-y-4">
            <PlanCard
              v-for="plan in planes"
              :key="plan.id"
              :plan="plan"
              @edit="editPlan"
              @delete="deletePlan"
              @view="viewPlan"
            />
          </div>
        </div>

        <!-- Tab: Evaluaciones -->
        <div v-if="activeTab === 'evaluaciones'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium">Evaluaciones</h3>
            <button
              @click="newEvaluation"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Nueva Evaluación
            </button>
          </div>
          <div class="space-y-4">
            <div
              v-for="evaluacion in evaluaciones"
              :key="evaluacion.id"
              class="bg-white p-4 rounded-lg shadow-md"
            >
              <h3 class="text-lg font-semibold">Evaluación {{ evaluacion.tipo }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <p class="text-sm font-medium text-gray-500">Evaluador</p>
                  <p>{{ evaluacion.maestroEvaluadorId || 'No especificado' }}</p>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-500">Fecha</p>
                  <p>{{ evaluacion.fecha ? formatDate(evaluacion.fecha.toDate()) : 'No especificada' }}</p>
                </div>
              </div>
              <div class="mt-4">
                <p class="text-sm font-medium text-gray-500">Puntuación</p>
                <div class="flex items-center mt-1">
                  <div class="bg-blue-100 h-4 rounded-full w-full">
                    <div class="bg-blue-500 h-4 rounded-full" :style="{width: `${evaluacion.calificacion || 0}%`}"></div>
                  </div>
                  <span class="ml-2 text-sm font-medium">{{ evaluacion.calificacion || 0 }}%</span>
                </div>
              </div>
              <div class="mt-4">
                <p class="text-sm font-medium text-gray-500">Comentarios</p>
                <p class="mt-1 text-sm">{{ evaluacion.observaciones || 'Sin comentarios' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Colaboración -->
        <div v-if="activeTab === 'colaboracion'">
          <CollaborationHub :obra-id="obraId" />
        </div>

        <!-- Tab: Historial -->
        <div v-if="activeTab === 'historial'">
          <HistoryTracker :entity-id="obraId" entity-type="obra" />
        </div>
      </div>
    </div>

    <!-- Modals -->
    <WorkFormModal
      v-if="showEditModal"
      :work="obra"
      :is-edit="true"
      @close="showEditModal = false"
      @save="updateObra"
    />

    <PhraseFormModal
      v-if="showPhraseModal"
      :isOpen="showPhraseModal"
      :phrase="selectedFrase"
      :availableWorks="obra.value ? [obra.value] : []"
      :onClose="() => showPhraseModal = false"
      :onSaved="handlePhraseSave"
    />

    <EvaluationForm
      v-if="showEvaluationModal"
      :entity-id="obraId"
      entity-type="obra"
      @close="showEvaluationModal = false"
      @save="saveEvaluation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { 
  Obra, 
  FraseMontaje as Frase, 
  PlanAccion as Plan, 
  EvaluacionContinua as Evaluacion 
} from '../types'
import { useMontaje } from '../composables/useMontaje'
import { useMontajeStore } from '../store/montaje'
import { Compas } from '../service/compasService'
import { formatDate, formatDuration } from '../utils'

// Components
import * as WorkFormModalModule from '../components/WorkFormModal.vue'
import * as PhraseCardModule from '../components/PhraseCard.vue'
import * as PhraseFormModalModule from '../components/PhraseFormModal.vue'
import * as PlanCardModule from '../components/PlanCard.vue'
import * as EvaluationFormModule from '../components/EvaluationForm.vue'
import * as CollaborationHubModule from '../components/CollaborationHub.vue'
import * as HistoryTrackerModule from '../components/HistoryTracker.vue'
import * as HeatMapModule from '../components/HeatMap.vue'

// Component registration
const WorkFormModal = WorkFormModalModule.default || WorkFormModalModule
const PhraseCard = PhraseCardModule.default || PhraseCardModule
const PhraseFormModal = PhraseFormModalModule.default || PhraseFormModalModule
const PlanCard = PlanCardModule.default || PlanCardModule
const EvaluationForm = EvaluationFormModule.default || EvaluationFormModule
const CollaborationHub = CollaborationHubModule.default || CollaborationHubModule
const HistoryTracker = HistoryTrackerModule.default || HistoryTrackerModule
const HeatMap = HeatMapModule.default || HeatMapModule

const route = useRoute()
const router = useRouter()
const montajeStore = useMontajeStore()
const { 
  cargarObra: getObra,
  guardarCompas,
  cargarCompases, 
  generarReporteObra,
  crearObra: updateObraService 
} = useMontaje()

const obraId = route.params.id as string
const obra = ref(null)
const frases = ref([])
const planes = ref([])
const evaluaciones = ref([])
const compases = ref([])
const cargando = ref(true)
const showWorkModal = ref(false)
const showPhraseModal = ref(false)
const selectedFrase = ref(null)
const selectedPlan = ref(null)
const showEvaluationForm = ref(false)

const activeTab = ref('mapa')
const showEditModal = ref(false)
const showEvaluationModal = ref(false)

const progressPercentage = computed(() => {
  if (!obra.value) return 0
  return obra.value.metadatos?.progresoPorcentaje || 0
})

const completedPhrases = computed(() => {
  if (!obra.value || !frases.value || frases.value.length === 0) return 0
  const frasesCompletadas = frases.value.filter(f => f.completada).length
  return Math.round((frasesCompletadas / frases.value.length) * 100)
})

const progreso = computed(() => {
  if (!obra.value || !frases.value || frases.value.length === 0) return 0
  const frasesCompletadas = frases.value.filter(f => f.completada).length
  return Math.round((frasesCompletadas / frases.value.length) * 100)
})

const loadData = async () => {
  cargando.value = true
  try {
    if (getObra && typeof getObra === 'function') {
      obra.value = await getObra(obraId)
      
      // Cargar planes
      if (typeof montajeStore.obtenerPlanesPorObra === 'function') {
        planes.value = await montajeStore.obtenerPlanesPorObra(obraId)
      } else {
        // Fallback: intentar usar cargarPlanes y filtrar después
        await cargarPlanes()
        planes.value = montajeStore.planes?.filter(plan => plan.obraId === obraId) || []
      }
      
      // Cargar evaluaciones
      if (typeof montajeStore.obtenerEvaluacionesPorObra === 'function') {
        evaluaciones.value = await montajeStore.obtenerEvaluacionesPorObra(obraId)
      } else {
        // Fallback: intentar usar cargarEvaluaciones y filtrar después
        await cargarEvaluaciones()
        evaluaciones.value = montajeStore.evaluacionesContinuas?.filter(evaluacion => evaluacion.obraId === obraId) || []
      }
      
      // Cargar frases (sólo si no están cargadas todavía)
      if (typeof montajeStore.obtenerFrasesPorObra === 'function') {
        frases.value = await montajeStore.obtenerFrasesPorObra(obraId)
      } else {
        // Usar las frases del objeto obra si están disponibles, o un array vacío
        frases.value = []
      }
      
      // Cargar compases
      if (cargarCompases && typeof cargarCompases === 'function') {
        compases.value = await cargarCompases(obraId)
      }
    }
  } catch (error) {
    console.error('Error al cargar los datos:', error)
  } finally {
    cargando.value = false
  }
}

const editObra = () => {
  showEditModal.value = true
}

const updateObra = async (updatedObra: Obra) => {
  try {
    await updateObraService(updatedObra.id, updatedObra)
    obra.value = updatedObra
    showEditModal.value = false
  } catch (error) {
    console.error('Error updating obra:', error)
  }
}

const addFrase = () => {
  selectedFrase.value = null
  showPhraseModal.value = true
}

const editFrase = (frase: Frase) => {
  selectedFrase.value = frase
  showPhraseModal.value = true
}

const deleteFrase = async (frase: Frase) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta frase?')) {
    // Implementar eliminación de frase
    console.log('Delete frase:', frase.id)
  }
}

const closePhraseModal = () => {
  showPhraseModal.value = false
  selectedFrase.value = null
}

const saveFrase = async (frase: Frase) => {
  // Implementar guardado de frase
  closePhraseModal()
  await loadData()
}

const handlePhraseDrop = (event, targetCompletedState) => {
  const phraseId = event.dataTransfer.getData('phraseId')
  const phrase = frases.value.find(f => f.id === phraseId)
  
  if (phrase) {
    // Aquí iría la lógica para actualizar el estado de la frase
    console.log(`Cambiando estado de frase ${phraseId} a ${targetCompletedState ? 'completada' : 'pendiente'}`)
  }
}

const createPlan = () => {
  router.push(`/montaje/planes/new?obraId=${obraId}`)
}

const editPlan = (plan: Plan) => {
  router.push(`/montaje/planes/${plan.id}`)
}

const deletePlan = async (plan: Plan) => {
  if (confirm('¿Estás seguro de que quieres eliminar este plan?')) {
    // Implementar eliminación de plan
    console.log('Delete plan:', plan.id)
  }
}

const viewPlan = (plan: Plan) => {
  router.push(`/montaje/planes/${plan.id}`)
}

const newEvaluation = () => {
  showEvaluationModal.value = true
}

const addEvaluation = () => {
  showEvaluationForm.value = true
}

const saveEvaluation = async (evaluation: Evaluacion) => {
  evaluaciones.value.unshift(evaluation)
  showEvaluationModal.value = false
}

const generateReport = async () => {
  try {
    if (generarReporteObra && typeof generarReporteObra === 'function') {
      await generarReporteObra(obraId)
    }
  } catch (error) {
    console.error('Error al generar el reporte:', error)
  }
}

const handleCompasUpdated = async (compasData) => {
  try {
    if (guardarCompas && typeof guardarCompas === 'function') {
      // Guardar el compás actualizado
      await guardarCompas(obraId, compasData)
      
      // Actualizar la lista local de compases
      const index = compases.value.findIndex(c => c.id === compasData.id)
      if (index !== -1) {
        compases.value[index] = compasData
      } else {
        compases.value.push(compasData)
      }
    }
  } catch (error) {
    console.error('Error al actualizar el compás:', error)
  }
}

const updateProgress = (newProgress: number) => {
  if (obra.value) {
    obra.value = {
      ...obra.value,
      metadatos: {
        ...obra.value.metadatos,
        progresoPorcentaje: newProgress
      }
    }
  }
}

const getEstadoBadgeClass = (estado: string) => {
  const classes = {
    'BORRADOR': 'bg-gray-100 text-gray-800',
    'EN_REVISION': 'bg-yellow-100 text-yellow-800',
    'EN_MONTAJE': 'bg-blue-100 text-blue-800',
    'PAUSADA': 'bg-orange-100 text-orange-800',
    'COMPLETADA': 'bg-green-100 text-green-800',
    'CANCELADA': 'bg-red-100 text-red-800'
  }
  return classes[estado] || 'bg-gray-100 text-gray-800'
}

const getScoreClass = (score: number) => {
  if (score >= 8) return 'bg-green-100 text-green-800'
  if (score >= 6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

onMounted(() => {
  loadData()
})
</script>
