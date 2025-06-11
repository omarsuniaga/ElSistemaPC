<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-900">
            💬 Observaciones - {{ obra?.titulo }}
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Formulario de nueva observación -->
        <form @submit.prevent="guardarObservacion" class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Observación
            </label>
            <select
              v-model="nuevaObservacion.tipo"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un tipo</option>
              <option value="dinamica">Dinámica</option>
              <option value="articulacion">Articulación</option>
              <option value="tempo">Tempo</option>
              <option value="afinacion">Afinación</option>
              <option value="ritmo">Ritmo</option>
              <option value="ensemble">Ensemble</option>
              <option value="tecnica">Técnica</option>
              <option value="expresion">Expresión</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Compases (opcional)
            </label>
            <div class="grid grid-cols-2 gap-3">
              <input
                v-model.number="nuevaObservacion.compassInicio"
                type="number"
                placeholder="Compás inicio"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                :max="obra?.totalCompases"
              />
              <input
                v-model.number="nuevaObservacion.compassFin"
                type="number"
                placeholder="Compás fin"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                :max="obra?.totalCompases"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Instrumentos Involucrados
            </label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="instrumento in obra?.instrumentosRequeridos"
                :key="instrumento.id"
                class="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  v-model="nuevaObservacion.instrumentos"
                  type="checkbox"
                  :value="instrumento.id"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">{{ instrumento.nombre }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Observación
            </label>
            <textarea
              v-model="nuevaObservacion.contenido"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe la observación, sugerencia o recomendación..."
              required
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <select
              v-model="nuevaObservacion.prioridad"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>

          <!-- Opciones para estudiantes (solo para maestros) -->
          <div v-if="puedeEvaluarEstudiantes">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Evaluación
            </label>
            <div class="space-y-2">
              <label class="flex items-center space-x-2">
                <input
                  v-model="nuevaObservacion.tipoEvaluacion"
                  type="radio"
                  value="general"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">Observación general del ensayo</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  v-model="nuevaObservacion.tipoEvaluacion"
                  type="radio"
                  value="individual"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">Evaluación individual de estudiantes</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  v-model="nuevaObservacion.tipoEvaluacion"
                  type="radio"
                  value="grupal"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">Evaluación grupal por sección</span>
              </label>
            </div>
          </div>

          <!-- Sección de estudiantes (si es evaluación individual) -->
          <div v-if="nuevaObservacion.tipoEvaluacion === 'individual'" class="space-y-3">
            <h4 class="font-medium text-gray-900">Evaluación Individual</h4>
            <div class="max-h-40 overflow-y-auto space-y-2">
              <div
                v-for="estudiante in estudiantesDisponibles"
                :key="estudiante.id"
                class="flex items-center justify-between p-2 border border-gray-200 rounded"
              >
                <span class="text-sm text-gray-700">{{ estudiante.nombre }}</span>
                <select
                  v-model="nuevaObservacion.evaluacionesIndividuales[estudiante.id]"
                  class="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Sin evaluar</option>
                  <option value="excelente">Excelente</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="necesita_trabajo">Necesita trabajo</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Guardar Observación
            </button>
          </div>
        </form>

        <!-- Lista de observaciones existentes -->
        <div v-if="observacionesExistentes.length > 0" class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Observaciones Anteriores</h3>
          <div class="space-y-3 max-h-60 overflow-y-auto">
            <div
              v-for="observacion in observacionesExistentes"
              :key="observacion.id"
              class="p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center space-x-2">
                  <span
                    class="px-2 py-1 text-xs rounded-full"
                    :class="getTipoObservacionClass(observacion.tipo)"
                  >
                    {{ observacion.tipo }}
                  </span>
                  <span
                    v-if="observacion.prioridad !== 'media'"
                    class="px-2 py-1 text-xs rounded-full"
                    :class="getPrioridadClass(observacion.prioridad)"
                  >
                    {{ observacion.prioridad }}
                  </span>
                </div>
                <span class="text-xs text-gray-500">
                  {{ formatDate(observacion.fechaCreacion) }}
                </span>
              </div>
              
              <p class="text-sm text-gray-700 mb-2">{{ observacion.contenido }}</p>
              
              <div v-if="observacion.compassInicio && observacion.compassFin" class="text-xs text-gray-600">
                Compases {{ observacion.compassInicio }}-{{ observacion.compassFin }}
              </div>
              
              <div v-if="observacion.instrumentos?.length" class="text-xs text-gray-600 mt-1">
                Instrumentos: {{ observacion.instrumentos.join(', ') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Obra, ObservacionPedagogica } from '../types'

interface Props {
  obra: Obra | null
}

interface Emits {
  (e: 'close'): void
  (e: 'guardar', observacion: ObservacionPedagogica): void
}

defineProps<Props>()
defineEmits<Emits>()

const authStore = useAuthStore()

// Estado reactivo
const nuevaObservacion = ref({
  tipo: '',
  contenido: '',
  compassInicio: null as number | null,
  compassFin: null as number | null,
  instrumentos: [] as string[],
  prioridad: 'media',
  tipoEvaluacion: 'general',
  evaluacionesIndividuales: {} as Record<string, string>
})

// Datos simulados (reemplazar con datos reales)
const observacionesExistentes = ref<any[]>([
  {
    id: '1',
    tipo: 'articulacion',
    contenido: 'Mejorar la articulación en los pasajes rápidos de cuerda.',
    prioridad: 'alta',
    fechaCreacion: new Date(Date.now() - 24 * 60 * 60 * 1000),
    compassInicio: 45,
    compassFin: 60,
    instrumentos: ['Violín I', 'Violín II']
  }
])

const estudiantesDisponibles = ref([
  { id: '1', nombre: 'Ana María González' },
  { id: '2', nombre: 'Carlos Mendoza' },
  { id: '3', nombre: 'Sofia Rodriguez' }
])

// Computed
const puedeEvaluarEstudiantes = computed(() => {
  return authStore.user?.role === 'Maestro'
})

// Methods
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getTipoObservacionClass(tipo: string): string {
  const clases = {
    dinamica: 'bg-blue-100 text-blue-800',
    articulacion: 'bg-green-100 text-green-800',
    tempo: 'bg-yellow-100 text-yellow-800',
    afinacion: 'bg-purple-100 text-purple-800',
    ritmo: 'bg-red-100 text-red-800',
    ensemble: 'bg-indigo-100 text-indigo-800',
    tecnica: 'bg-orange-100 text-orange-800',
    expresion: 'bg-pink-100 text-pink-800',
    general: 'bg-gray-100 text-gray-800'
  }
  return clases[tipo as keyof typeof clases] || clases.general
}

function getPrioridadClass(prioridad: string): string {
  const clases = {
    baja: 'bg-green-100 text-green-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800'
  }
  return clases[prioridad as keyof typeof clases] || clases.media
}

function guardarObservacion() {
  const observacion: Partial<ObservacionPedagogica> = {
    tipo: nuevaObservacion.value.tipo as any,
    contenido: nuevaObservacion.value.contenido,
    compassInicio: nuevaObservacion.value.compassInicio || undefined,
    compassFin: nuevaObservacion.value.compassFin || undefined,
    instrumentosInvolucrados: nuevaObservacion.value.instrumentos,
    prioridad: nuevaObservacion.value.prioridad as any,
    fechaCreacion: new Date(),
    autorId: authStore.user?.uid || '',
    // Agregar otros campos según el tipo definido
  }

  // Incluir evaluaciones si es necesario
  if (nuevaObservacion.value.tipoEvaluacion === 'individual') {
    // Lógica para manejar evaluaciones individuales
    console.log('Evaluaciones individuales:', nuevaObservacion.value.evaluacionesIndividuales)
  }

  emit('guardar', observacion as ObservacionPedagogica)
}
</script>

<style scoped>
.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease;
}
</style>
