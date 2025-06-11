<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">
        Historial de Cambios
      </h3>
      <div class="flex items-center space-x-3">
        <!-- Entity Filter -->
        <select
          v-model="selectedEntity"
          class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las entidades</option>
          <option value="obra">Obras</option>
          <option value="plan">Planes</option>
          <option value="frase">Frases</option>
          <option value="evaluacion">Evaluaciones</option>
        </select>

        <!-- Action Filter -->
        <select
          v-model="selectedAction"
          class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las acciones</option>
          <option value="created">Creación</option>
          <option value="updated">Actualización</option>
          <option value="deleted">Eliminación</option>
          <option value="evaluated">Evaluación</option>
        </select>

        <!-- Date Range -->
        <div class="flex items-center space-x-2">
          <input
            v-model="dateFrom"
            type="date"
            class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          <span class="text-gray-500">-</span>
          <input
            v-model="dateTo"
            type="date"
            class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <!-- Export Button -->
        <button
          @click="exportHistory"
          class="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
          </svg>
          Exportar
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Eventos</p>
            <p class="text-lg font-semibold text-gray-900">{{ filteredHistory.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Evaluaciones</p>
            <p class="text-lg font-semibold text-gray-900">{{ getActionCount('evaluated') }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Actualizaciones</p>
            <p class="text-lg font-semibold text-gray-900">{{ getActionCount('updated') }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Creaciones</p>
            <p class="text-lg font-semibold text-gray-900">{{ getActionCount('created') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="space-y-4">
        <div
          v-for="(group, date) in groupedHistory"
          :key="date"
          class="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
        >
          <!-- Date Header -->
          <div class="flex items-center mb-4">
            <div class="bg-gray-100 rounded-full px-3 py-1">
              <span class="text-sm font-medium text-gray-600">{{ formatDate(date) }}</span>
            </div>
            <div class="flex-1 h-px bg-gray-200 ml-4"></div>
          </div>

          <!-- Events for this date -->
          <div class="space-y-3 ml-4">
            <div
              v-for="event in group"
              :key="event.id"
              class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <!-- Action Icon -->
              <div
                class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                :class="getActionIconClass(event.accion)"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    v-if="event.accion === 'created'"
                    fill-rule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clip-rule="evenodd"
                  ></path>
                  <path
                    v-else-if="event.accion === 'updated'"
                    fill-rule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clip-rule="evenodd"
                  ></path>
                  <path
                    v-else-if="event.accion === 'deleted'"
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5l1.5 1.5A1 1 0 0116 13H4a1 1 0 01-.5-1.5L5 10V5z M6 5v5.5l-1 1h10l-1-1V5H6z"
                    clip-rule="evenodd"
                  ></path>
                  <path
                    v-else
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </div>

              <!-- Event Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900">
                    {{ getActionLabel(event.accion) }} {{ getEntityTypeLabel(event.tipoEntidad) }}
                  </p>
                  <span class="text-xs text-gray-500">
                    {{ formatTime(event.timestamp) }}
                  </span>
                </div>
                
                <p class="text-sm text-gray-600 mt-1">
                  <span class="font-medium">{{ event.entidadNombre }}</span>
                  <span v-if="event.descripcion"> - {{ event.descripcion }}</span>
                </p>

                <!-- User Info -->
                <div class="flex items-center mt-2 text-xs text-gray-500">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  {{ event.usuarioNombre }}
                </div>

                <!-- Changes Details (if available) -->
                <div v-if="event.cambios && Object.keys(event.cambios).length > 0" class="mt-3">
                  <button
                    @click="toggleChangesVisibility(event.id)"
                    class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {{ expandedChanges.includes(event.id) ? 'Ocultar' : 'Ver' }} cambios
                  </button>
                  
                  <div v-if="expandedChanges.includes(event.id)" class="mt-2 bg-gray-50 rounded-md p-3">
                    <div class="space-y-2">
                      <div
                        v-for="(change, field) in event.cambios"
                        :key="field"
                        class="text-xs"
                      >
                        <span class="font-medium text-gray-700">{{ field }}:</span>
                        <div class="flex items-center space-x-2 mt-1">
                          <span class="bg-red-100 text-red-800 px-2 py-1 rounded">
                            {{ change.anterior || 'N/A' }}
                          </span>
                          <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5-5 5M6 17l5-5-5-5"></path>
                          </svg>
                          <span class="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {{ change.nuevo }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMoreHistory" class="text-center pt-6 border-t border-gray-200">
        <button
          @click="loadMoreHistory"
          :disabled="isLoadingMore"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <svg v-if="isLoadingMore" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoadingMore ? 'Cargando...' : 'Cargar más eventos' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HistorialCambio } from '../types'
import { formatDate } from '../utils'

interface Props {
  history: HistorialCambio[]
  hasMoreHistory?: boolean
  isLoadingMore?: boolean
}

interface Emits {
  (e: 'load-more'): void
  (e: 'export', filters: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedEntity = ref('')
const selectedAction = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const expandedChanges = ref<string[]>([])

const filteredHistory = computed(() => {
  let filtered = props.history

  if (selectedEntity.value) {
    filtered = filtered.filter(h => h.tipoEntidad === selectedEntity.value)
  }

  if (selectedAction.value) {
    filtered = filtered.filter(h => h.accion === selectedAction.value)
  }

  if (dateFrom.value) {
    const fromDate = new Date(dateFrom.value)
    filtered = filtered.filter(h => new Date(h.timestamp) >= fromDate)
  }

  if (dateTo.value) {
    const toDate = new Date(dateTo.value)
    toDate.setHours(23, 59, 59, 999) // End of day
    filtered = filtered.filter(h => new Date(h.timestamp) <= toDate)
  }

  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const groupedHistory = computed(() => {
  const groups: Record<string, HistorialCambio[]> = {}
  
  filteredHistory.value.forEach(event => {
    const date = new Date(event.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
  })

  return groups
})

const getActionCount = (action: string) => {
  return filteredHistory.value.filter(h => h.accion === action).length
}

const getActionLabel = (action: string) => {
  switch (action) {
    case 'created': return 'Creó'
    case 'updated': return 'Actualizó'
    case 'deleted': return 'Eliminó'
    case 'evaluated': return 'Evaluó'
    default: return action
  }
}

const getEntityTypeLabel = (type: string) => {
  switch (type) {
    case 'obra': return 'obra'
    case 'plan': return 'plan'
    case 'frase': return 'frase'
    case 'evaluacion': return 'evaluación'
    default: return type
  }
}

const getActionIconClass = (action: string) => {
  switch (action) {
    case 'created':
      return 'bg-blue-100 text-blue-600'
    case 'updated':
      return 'bg-yellow-100 text-yellow-600'
    case 'deleted':
      return 'bg-red-100 text-red-600'
    case 'evaluated':
      return 'bg-green-100 text-green-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const toggleChangesVisibility = (eventId: string) => {
  const index = expandedChanges.value.indexOf(eventId)
  if (index > -1) {
    expandedChanges.value.splice(index, 1)
  } else {
    expandedChanges.value.push(eventId)
  }
}

const loadMoreHistory = () => {
  emit('load-more')
}

const exportHistory = () => {
  const filters = {
    entity: selectedEntity.value,
    action: selectedAction.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value
  }
  emit('export', filters)
}
</script>
