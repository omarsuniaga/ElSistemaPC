<template>
  <div 
    v-if="show"
    class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="modal-container bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="modal-header flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-semibold text-gray-900">
          {{ isEdit ? 'Editar Obra' : 'Nueva Obra' }}
        </h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content overflow-y-auto max-h-[calc(90vh-120px)]">
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Título de la obra *
              </label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Sinfonía No. 9"
              />
            </div>

            <!-- Composer -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Compositor *
              </label>
              <input
                v-model="form.composer"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Ludwig van Beethoven"
              />
            </div>

            <!-- Genre -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <input
                v-model="form.genre"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Sinfonía, Concierto, Ópera"
              />
            </div>

            <!-- Difficulty -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Dificultad *
              </label>              <select
                v-model="form.difficulty"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar dificultad</option>
                <option :value="DificultadFrase.FACIL">Fácil</option>
                <option :value="DificultadFrase.MEDIO">Medio</option>
                <option :value="DificultadFrase.DIFICIL">Difícil</option>
                <option :value="DificultadFrase.MUY_DIFICIL">Muy Difícil</option>
              </select>
            </div>

            <!-- Duration -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Duración estimada (minutos)
              </label>
              <input
                v-model.number="form.estimatedDuration"
                type="number"
                min="1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="45"
              />
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>              <select
                v-model="form.status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option :value="EstadoObra.PENDIENTE">Pendiente</option>
                <option :value="EstadoObra.EN_ESTUDIO">En Estudio</option>
                <option :value="EstadoObra.EN_MONTAJE">En Montaje</option>
                <option :value="EstadoObra.EN_PULIMIENTO">En Pulimiento</option>
                <option :value="EstadoObra.LISTA">Lista</option>
                <option :value="EstadoObra.PRESENTADA">Presentada</option>
                <option :value="EstadoObra.ARCHIVADA">Archivada</option>
              </select>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción detallada de la obra..."
            ></textarea>
          </div>

          <!-- Instruments -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Instrumentos requeridos *
            </label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <label
                v-for="instrument in availableInstruments"
                :key="instrument.value"
                class="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="instrument.value"
                  v-model="form.instruments"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">{{ instrument.label }}</span>
              </label>
            </div>
          </div>

          <!-- Resources -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Sheet Music URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL de la partitura
              </label>
              <input
                v-model="form.sheetMusicUrl"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <!-- Audio URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL del audio
              </label>
              <input
                v-model="form.audioUrl"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <!-- Video URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL del video
              </label>
              <input
                v-model="form.videoUrl"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Etiquetas
            </label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span
                v-for="(tag, index) in form.tags"
                :key="index"
                class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                #{{ tag }}
                <button
                  type="button"
                  @click="removeTag(index)"
                  class="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="newTag"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar etiqueta..."
                @keyup.enter="addTag"
              />
              <button
                type="button"
                @click="addTag"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="text-red-500">
                <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
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
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Obra, CreateWorkInput } from '../types'
import { DificultadFrase, EstadoObra, TipoInstrumento } from '../types'

interface Props {
  show?: boolean
  work?: Obra
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: CreateWorkInput): void
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  work: undefined,
  loading: false
})

const emit = defineEmits<Emits>()

// Form state
const form = ref<CreateWorkInput>({
  title: '',
  composer: '',
  genre: '',
  difficulty: DificultadFrase.FACIL,
  estimatedDuration: 30,
  instruments: [],
  description: '',
  sheetMusicUrl: '',
  audioUrl: '',
  videoUrl: '',
  tags: [],  status: EstadoObra.PENDIENTE,
  totalCompases: 0
})

const newTag = ref('')
const error = ref('')

// Available instruments
const availableInstruments = [
  { value: TipoInstrumento.VIOLIN1, label: 'Violín 1' },
  { value: TipoInstrumento.VIOLIN2, label: 'Violín 2' },
  { value: TipoInstrumento.VIOLA, label: 'Viola' },
  { value: TipoInstrumento.CELLO, label: 'Violonchelo' },
  { value: TipoInstrumento.CONTRABAJO, label: 'Contrabajo' },
  { value: TipoInstrumento.FLUTE, label: 'Flauta' },
  { value: TipoInstrumento.OBOE, label: 'Oboe' },
  { value: TipoInstrumento.CLARINET, label: 'Clarinete' },
  { value: TipoInstrumento.BASSOON, label: 'Fagot' },  { value: TipoInstrumento.HORN, label: 'Trompa' },
  { value: TipoInstrumento.TRUMPET, label: 'Trompeta' },
  { value: TipoInstrumento.TROMBONE, label: 'Trombón' },
  { value: TipoInstrumento.TUBA, label: 'Tuba' },
  { value: TipoInstrumento.TIMPANI, label: 'Timbales' },
  { value: TipoInstrumento.PERCUSSION, label: 'Percusión' }
]

// Computed properties
const isEdit = computed(() => !!props.work)

const isFormValid = computed(() => {
  return form.value.title.trim() !== '' &&
         form.value.composer?.trim() !== '' &&
         form.value.difficulty !== undefined &&
         form.value.instruments.length > 0
})

// Methods
const addTag = () => {
  if (newTag.value.trim() && !form.value.tags?.includes(newTag.value.trim())) {
    if (!form.value.tags) form.value.tags = []
    form.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  if (form.value.tags) {
    form.value.tags.splice(index, 1)
  }
}

const handleSubmit = () => {
  if (!isFormValid.value) {
    error.value = 'Por favor, completa todos los campos obligatorios'
    return
  }

  if (form.value.instruments.length === 0) {
    error.value = 'Selecciona al menos un instrumento'
    return
  }

  error.value = ''
  emit('submit', { ...form.value })
}

const resetForm = () => {
  form.value = {
    title: '',
    composer: '',
    genre: '',
    difficulty: DificultadFrase.FACIL,
    estimatedDuration: 30,
    instruments: [],
    description: '',
    sheetMusicUrl: '',
    audioUrl: '',
    videoUrl: '',
    tags: [],
    status: EstadoObra.PENDIENTE,
    totalCompases: 0
  }
  newTag.value = ''
  error.value = ''
}

// Watch for modal visibility changes
watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.work) {      // Load existing work data
      form.value = {
        title: props.work.titulo,
        composer: props.work.compositor,
        genre: props.work.genero || '',
        difficulty: props.work.metadatos.complejidadGeneral,
        estimatedDuration: props.work.duracionEstimada,
        totalCompases: props.work.metadatos.totalCompases || 0,
        instruments: props.work.instrumentosRequeridos?.map(inst => inst.instrumentoId as TipoInstrumento) || [],
        description: props.work.descripcion || '',
        sheetMusicUrl: props.work.archivoPartitura || '',
        audioUrl: props.work.audioReferencia || '',
        videoUrl: props.work.videoReferencia || '',
        tags: [], // Las obras no tienen tags en la interfaz actual
        status: props.work.estado
      }
    } else {
      // Reset form for new work
      resetForm()
    }
  }
})

// Initialize form with work data if editing
onMounted(() => {    if (props.work) {
      form.value = {
        title: props.work.titulo,
        composer: props.work.compositor,
        genre: props.work.genero || '',
        difficulty: props.work.metadatos.complejidadGeneral,
        estimatedDuration: props.work.duracionEstimada,
        totalCompases: props.work.metadatos.totalCompases || 0,
        instruments: props.work.instrumentosRequeridos?.map(inst => inst.instrumentoId as TipoInstrumento) || [],
        description: props.work.descripcion || '',
        sheetMusicUrl: props.work.archivoPartitura || '',
        audioUrl: props.work.audioReferencia || '',
        videoUrl: props.work.videoReferencia || '',
        tags: [], // Las obras no tienen tags en la interfaz actual
        status: props.work.estado
      }
  }
})
</script>
