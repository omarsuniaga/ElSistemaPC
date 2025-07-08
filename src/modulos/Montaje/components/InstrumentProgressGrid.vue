<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMontajeStore } from '../store/montaje'
import { EstadoCompass, TipoInstrumento, COLOR_ESTADOS_COMPASS } from '../types'
import { 
  CeldaMapaCalor,
  EstadoCompassInstrumento
} from '../types/instrumentProgress'
import { MontajePermission } from '../types/permissions'
import { permissionsService } from '../service/permissionsService'

// Propiedades
const props = defineProps({
  obraId: {
    type: String,
    required: true
  },
  instrumentId: {
    type: String as () => TipoInstrumento,
    required: true
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

// Store
const montajeStore = useMontajeStore()

// Estado local
const celdas = ref<CeldaMapaCalor[]>([])
const selectedCells = ref<number[]>([])
const compasesSeleccionados = ref<Record<number, boolean>>({})
const isSelecting = ref(false)
const selectionMode = ref<'single' | 'multiple' | 'range'>('single')
const selectedState = ref<EstadoCompass>(EstadoCompass.LEIDO)
const loading = ref(false)
const hasPermission = ref(false)

// Colores para estados
const colors = COLOR_ESTADOS_COMPASS

// Estadísticas
const estadisticas = computed(() => montajeStore.estadisticasInstrumento)

// Verificar permisos
async function checkPermissions() {
  loading.value = true
  try {
    const canUpdate = await permissionsService.hasPermission(
      MontajePermission.UPDATE_INSTRUMENT_COMPASS_STATES
    )
    hasPermission.value = canUpdate && !props.readOnly
  } catch (error) {
    console.error('Error al verificar permisos:', error)
    hasPermission.value = false
  } finally {
    loading.value = false
  }
}

// Cargar estados de compases para el instrumento
async function loadCompassStates() {
  if (!props.obraId || !props.instrumentId) return
  
  loading.value = true
  try {
    await montajeStore.seleccionarInstrumento(props.instrumentId)
    generateHeatmapCells()
  } catch (error) {
    console.error('Error al cargar estados de compases:', error)
  } finally {
    loading.value = false
  }
}

// Generar celdas para el mapa de calor
function generateHeatmapCells() {
  if (!montajeStore.obraActual) return
  
  const totalCompases = montajeStore.obraActual.compas || 0
  const estados = montajeStore.instrumentCompassStates || []
  const celdaNueva: CeldaMapaCalor[] = []
  
  for (let i = 1; i <= totalCompases; i++) {
    const estadoCompass = estados.find(e => e.numeroCompas === i)
    const estado = estadoCompass?.estado || EstadoCompass.SIN_TRABAJAR
    
    celdaNueva.push({
      obraId: props.obraId,
      instrumentoId: props.instrumentId,
      numeroCompas: i,
      estado,
      colorHex: colors[estado].hex,
      colorClass: colors[estado].class
    })
  }
  
  celdas.value = celdaNueva
}

// Manejar selección de celda
function toggleCell(index: number) {
  if (!hasPermission.value) return
  
  const numeroCompas = index + 1
  
  if (selectionMode.value === 'single') {
    // Modo simple: solo seleccionar/deseleccionar una celda
    if (compasesSeleccionados.value[numeroCompas]) {
      delete compasesSeleccionados.value[numeroCompas]
    } else {
      compasesSeleccionados.value = { [numeroCompas]: true }
    }
  } else {
    // Modo múltiple: añadir/quitar de la selección
    if (compasesSeleccionados.value[numeroCompas]) {
      delete compasesSeleccionados.value[numeroCompas]
    } else {
      compasesSeleccionados.value = { 
        ...compasesSeleccionados.value, 
        [numeroCompas]: true 
      }
    }
  }
  
  // Actualizar array de seleccionados para acciones masivas
  selectedCells.value = Object.keys(compasesSeleccionados.value)
    .map(key => parseInt(key))
    .sort((a, b) => a - b)
}

// Actualizar estado de compases seleccionados
async function updateSelectedCells() {
  if (!hasPermission.value || selectedCells.value.length === 0) return
  
  loading.value = true
  try {
    if (selectedCells.value.length === 1) {
      // Actualizar un solo compás
      await montajeStore.actualizarEstadoCompassInstrumento(
        selectedCells.value[0],
        selectedState.value
      )
    } else {
      // Actualizar múltiples compases
      await montajeStore.actualizarCompassesMasivamente(
        selectedCells.value,
        selectedState.value
      )
    }
    
    // Limpiar selección
    compasesSeleccionados.value = {}
    selectedCells.value = []
    
    // Recargar datos
    await loadCompassStates()
  } catch (error) {
    console.error('Error al actualizar estados:', error)
  } finally {
    loading.value = false
  }
}

// Establecer modo de selección
function setSelectionMode(mode: 'single' | 'multiple' | 'range') {
  selectionMode.value = mode
  compasesSeleccionados.value = {}
  selectedCells.value = []
}

// Cambiar estado seleccionado
function changeSelectedState(estado: EstadoCompass) {
  selectedState.value = estado
}

// Formatear nombre de estado para mostrar
function formatEstado(estado: EstadoCompass): string {
  return estado.replace(/_/g, ' ').toLowerCase()
}

// Vigilar cambios en propiedades
watch(() => props.instrumentId, loadCompassStates, { immediate: true })
watch(() => props.obraId, loadCompassStates)
watch(() => props.readOnly, checkPermissions)

// Al montar el componente
onMounted(async () => {
  await checkPermissions()
  await loadCompassStates()
})
</script>

<template>
  <div class="instrument-progress-grid">
    <!-- Información del instrumento -->
    <div class="instrument-header mb-4">
      <h3 class="text-xl font-bold">{{ props.instrumentId }}</h3>
      <div v-if="estadisticas" class="statistics-summary">
        <div class="flex items-center gap-2 text-sm">
          <div class="statistic">
            <span class="font-bold">Total compases:</span>
            {{ estadisticas.totalCompases }}
          </div>
          <div class="statistic">
            <span class="font-bold">Completados:</span>
            {{ estadisticas.porcentajeCompletado }}%
          </div>
          <div class="statistic">
            <span class="font-bold">Con dificultad:</span>
            {{ estadisticas.conDificultad }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Controles para actualización (solo si tiene permisos) -->
    <div v-if="hasPermission" class="controls-container mb-4">
      <div class="flex flex-wrap gap-2 items-center">
        <div class="selection-mode">
          <span class="text-sm mr-2">Modo selección:</span>
          <button 
            @click="setSelectionMode('single')" 
            :class="[
              'btn btn-sm',
              selectionMode === 'single' ? 'btn-primary' : 'btn-outline-secondary'
            ]"
          >
            Individual
          </button>
          <button 
            @click="setSelectionMode('multiple')" 
            :class="[
              'btn btn-sm ml-1',
              selectionMode === 'multiple' ? 'btn-primary' : 'btn-outline-secondary'
            ]"
          >
            Múltiple
          </button>
        </div>
        
        <div class="state-selector ml-4">
          <span class="text-sm mr-2">Estado:</span>
          <select 
            v-model="selectedState"
            class="form-select form-select-sm"
          >
            <option 
              v-for="estado in Object.values(EstadoCompass)" 
              :key="estado" 
              :value="estado"
            >
              {{ formatEstado(estado) }}
            </option>
          </select>
        </div>
        
        <button 
          @click="updateSelectedCells" 
          class="btn btn-primary btn-sm ml-auto"
          :disabled="selectedCells.length === 0 || loading"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm mr-1"></span>
          Actualizar {{ selectedCells.length }} {{ selectedCells.length === 1 ? 'compás' : 'compases' }}
        </button>
      </div>
    </div>
    
    <!-- Leyenda de colores -->
    <div class="color-legend mb-4">
      <div class="text-sm font-bold mb-1">Estados:</div>
      <div class="flex flex-wrap gap-1">
        <div 
          v-for="(colorInfo, estado) in colors" 
          :key="estado"
          class="legend-item flex items-center"
        >
          <div 
            class="color-box w-4 h-4 mr-1 rounded"
            :style="{ backgroundColor: colorInfo.hex }"
          ></div>
          <span class="text-xs">{{ formatEstado(estado as EstadoCompass) }}</span>
        </div>
      </div>
    </div>
    
    <!-- Grid de compases -->
    <div class="grid-container relative">
      <div v-if="loading" class="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
      
      <div class="grid-wrapper">
        <div class="grid grid-cols-10 gap-1">
          <template v-for="(celda, index) in celdas" :key="`celda-${index}`">
            <div 
              class="compass-cell relative cursor-pointer transition-all"
              :class="[
                celda.colorClass, 
                { 'selected': compasesSeleccionados[celda.numeroCompas] }
              ]"
              @click="toggleCell(index)"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                {{ celda.numeroCompas }}
              </div>
              <div 
                v-if="compasesSeleccionados[celda.numeroCompas]"
                class="absolute inset-0 border-2 border-blue-500 rounded"
              ></div>
            </div>
          </template>
        </div>
      </div>
    </div>
    
    <!-- Información de selección -->
    <div v-if="selectedCells.length > 0" class="selection-info mt-4 p-2 bg-blue-50 rounded">
      <p class="text-sm">
        Seleccionados: {{ selectedCells.length }} compases 
        <span v-if="selectedCells.length <= 10">
          ({{ selectedCells.join(', ') }})
        </span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.instrument-progress-grid {
  @apply p-4 bg-white rounded-lg shadow-sm;
}

.compass-cell {
  @apply h-10 w-10 rounded flex items-center justify-center text-xs font-medium transition-all;
}

.compass-cell:hover {
  @apply shadow-md transform scale-110 z-10;
}

.compass-cell.selected {
  @apply z-20;
  transform: scale(1.1);
}

.legend-item {
  @apply mr-3 mb-1;
}

.grid-container {
  @apply overflow-auto max-h-[500px] border border-gray-200 rounded p-2;
}

.grid-wrapper {
  @apply min-w-full;
}

/* Modo oscuro */
:root.dark .instrument-progress-grid {
  @apply bg-gray-800 text-white;
}

:root.dark .grid-container {
  @apply border-gray-700;
}
</style>
