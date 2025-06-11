<template>
  <div class="work-card border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
    <!-- Header -->
    <div class="p-4 border-b">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ work.title }}</h3>
          <p class="text-sm text-gray-600">{{ work.composer }}</p>
          <div class="flex items-center gap-2 mt-2">
            <span 
              :class="statusClasses"
              class="px-2 py-1 rounded-full text-xs font-medium"
            >
              {{ statusText }}
            </span>
            <span 
              :class="difficultyClasses"
              class="px-2 py-1 rounded-full text-xs font-medium"
            >
              {{ work.difficulty }}
            </span>
          </div>
        </div>
        
        <div class="flex items-center gap-2 ml-4">
          <!-- Score -->
          <div v-if="averageScore > 0" class="text-center">
            <div class="text-lg font-bold text-green-600">{{ averageScore.toFixed(1) }}</div>
            <div class="text-xs text-gray-500">Promedio</div>
          </div>
          
          <!-- Actions -->
          <div class="relative">
            <button
              @click="showActions = !showActions"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
            </button>
            
            <!-- Actions Dropdown -->
            <div 
              v-if="showActions"
              class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10"
            >
              <div class="py-1">
                <button
                  @click="$emit('view', work)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Ver detalles
                </button>
                <button
                  @click="$emit('edit', work)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Editar
                </button>
                <button
                  @click="$emit('duplicate', work)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Duplicar
                </button>
                <button
                  @click="$emit('evaluate', work)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Evaluar
                </button>
                <hr class="my-1">
                <button
                  @click="$emit('delete', work)"
                  class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Description -->
      <p v-if="work.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
        {{ work.description }}
      </p>

      <!-- Instruments -->
      <div class="mb-3">
        <div class="text-xs text-gray-500 mb-1">Instrumentos:</div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="instrument in work.instruments"
            :key="instrument"
            class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            {{ instrumentLabels[instrument] }}
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="progressPercentage !== undefined" class="mb-3">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progreso</span>
          <span>{{ progressPercentage }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            :class="progressBarClasses"
            class="h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
        <div>
          <span class="font-medium">Duración:</span>
          {{ work.estimatedDuration }} min
        </div>
        <div>
          <span class="font-medium">Creado:</span>
          {{ formatDate(work.createdAt) }}
        </div>
      </div>

      <!-- Tags -->
      <div v-if="work.tags && work.tags.length > 0" class="mt-3">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tag in work.tags"
            :key="tag"
            class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
          >
            #{{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="work.sheetMusicUrl || work.audioUrl || work.videoUrl" class="px-4 py-3 bg-gray-50 border-t">
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500">Recursos:</span>
        <a
          v-if="work.sheetMusicUrl"
          :href="work.sheetMusicUrl"
          target="_blank"
          class="text-xs text-blue-600 hover:text-blue-800"
        >
          Partitura
        </a>
        <a
          v-if="work.audioUrl"
          :href="work.audioUrl"
          target="_blank"
          class="text-xs text-blue-600 hover:text-blue-800"
        >
          Audio
        </a>
        <a
          v-if="work.videoUrl"
          :href="work.videoUrl"
          target="_blank"
          class="text-xs text-blue-600 hover:text-blue-800"
        >
          Video
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Work, InstrumentType } from '../types'

interface Props {
  work: Work
  averageScore?: number
  progressPercentage?: number
}

interface Emits {
  (e: 'view', work: Work): void
  (e: 'edit', work: Work): void
  (e: 'duplicate', work: Work): void
  (e: 'evaluate', work: Work): void
  (e: 'delete', work: Work): void
}

const props = withDefaults(defineProps<Props>(), {
  averageScore: 0,
  progressPercentage: undefined
})

const emit = defineEmits<Emits>()

const showActions = ref(false)

// Computed properties
const statusClasses = computed(() => {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
  switch (props.work.status) {
    case 'active':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'inactive':
      return `${baseClasses} bg-gray-100 text-gray-800`
    case 'completed':
      return `${baseClasses} bg-blue-100 text-blue-800`
    case 'archived':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
})

const statusText = computed(() => {
  const statusMap = {
    active: 'Activa',
    inactive: 'Inactiva',
    completed: 'Completada',
    archived: 'Archivada'
  }
  return statusMap[props.work.status] || props.work.status
})

const difficultyClasses = computed(() => {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
  switch (props.work.difficulty) {
    case 'beginner':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'intermediate':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'advanced':
      return `${baseClasses} bg-orange-100 text-orange-800`
    case 'professional':
      return `${baseClasses} bg-red-100 text-red-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
})

const progressBarClasses = computed(() => {
  if (props.progressPercentage === undefined) return 'bg-gray-300'
  
  if (props.progressPercentage >= 80) return 'bg-green-500'
  if (props.progressPercentage >= 60) return 'bg-blue-500'
  if (props.progressPercentage >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
})

const instrumentLabels: Record<InstrumentType, string> = {
  violin: 'Violín',
  viola: 'Viola',
  cello: 'Violonchelo',
  bass: 'Contrabajo',
  flute: 'Flauta',
  oboe: 'Oboe',
  clarinet: 'Clarinete',
  bassoon: 'Fagot',
  horn: 'Trompa',
  trumpet: 'Trompeta',
  trombone: 'Trombón',
  tuba: 'Tuba',
  timpani: 'Timbales',
  percussion: 'Percusión',
  piano: 'Piano',
  harp: 'Arpa'
}

// Methods
const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Close actions dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showActions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
