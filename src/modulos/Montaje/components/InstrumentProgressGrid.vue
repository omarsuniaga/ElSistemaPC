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
            :class="[
              'btn btn-sm',
              selectionMode === 'single' ? 'btn-primary' : 'btn-outline-secondary'
            ]" 
            @click="setSelectionMode('single')"
          >
            Individual
          </button>
          <button 
            :class="[
              'btn btn-sm ml-1',
              selectionMode === 'multiple' ? 'btn-primary' : 'btn-outline-secondary'
            ]" 
            @click="setSelectionMode('multiple')"
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
              v-for="estadoKey in Object.keys(PROGRESO_COMPAS_INFO)" 
              :key="estadoKey" 
              :value="parseInt(estadoKey)"
            >
              {{ PROGRESO_COMPAS_INFO[parseInt(estadoKey) as ProgresoCompasEstado].label }}
            </option>
          </select>
        </div>
        
        <button 
          class="btn btn-primary btn-sm ml-auto" 
          :disabled="selectedCells.length === 0 || loading"
          @click="updateSelectedCells"
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

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useMontajeStore } from '../store/montaje';
import { TipoInstrumento } from '../types';
import { 
  CeldaMapaCalor,
  ProgresoCompasEstado, // Importar el nuevo enum
  PROGRESO_COMPAS_INFO, // Importar la información de progreso
} from '../types/instrumentProgress';
import { MontajePermission } from '../types/permissions';
import { permissionsService } from '../service/permissionsService';

// Propiedades
const props = defineProps({
  obraId: {
    type: String,
    required: true,
  },
  instrumentId: {
    type: String as () => TipoInstrumento,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

// Store
const montajeStore = useMontajeStore();

// Estado local
const celdas = ref<CeldaMapaCalor[]>([]);
const selectedCells = ref<number[]>([]);
const compasesSeleccionados = ref<Record<number, boolean>>({});
const isSelecting = ref(false);
const selectionMode = ref<'single' | 'multiple' | 'range'>('single');
const selectedState = ref<ProgresoCompasEstado>(ProgresoCompasEstado.LEIDO); // Usar el nuevo enum
const loading = ref(false);
const hasPermission = ref(false);

// Colores para estados (usar la nueva información de progreso)
const colors = PROGRESO_COMPAS_INFO;

// Estadísticas
const estadisticas = computed(() => montajeStore.estadisticasInstrumento);

// Verificar permisos
async function checkPermissions() {
  loading.value = true;
  try {
    const canUpdate = await permissionsService.hasPermission(
      MontajePermission.UPDATE_INSTRUMENT_COMPASS_STATES,
    );
    hasPermission.value = canUpdate && !props.readOnly;
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    hasPermission.value = false;
  } finally {
    loading.value = false;
  }
}

// Cargar estados de compases para el instrumento
async function loadCompassStates() {
  if (!props.obraId || !props.instrumentId) return;
  
  loading.value = true;
  try {
    // Cargar el progreso del instrumento desde el store
    await montajeStore.loadInstrumentProgress(props.obraId, props.instrumentId);
    generateHeatmapCells();
  } catch (error) {
    console.error('Error al cargar estados de compases:', error);
  } finally {
    loading.value = false;
  }
}

// Generar celdas para el mapa de calor
function generateHeatmapCells() {
  if (!montajeStore.obraActual) return;
  
  const totalCompases = montajeStore.obraActual.totalCompases || 0;
  const progressMap = montajeStore.currentInstrumentProgress; // Es un Map<string, ProgresoCompasEstado>
  const celdaNueva: CeldaMapaCalor[] = [];
  
  for (let i = 1; i <= totalCompases; i++) {
    const estado = progressMap.get(i.toString()) || ProgresoCompasEstado.SIN_TRABAJAR;
    const info = PROGRESO_COMPAS_INFO[estado];
    
    celdaNueva.push({
      obraId: props.obraId,
      instrumentoId: props.instrumentId,
      numeroCompas: i,
      estado,
      colorHex: info.hex,
      colorClass: info.class,
    });
  }
  
  celdas.value = celdaNueva;
}

// Manejar selección de celda
function toggleCell(index: number) {
  if (!hasPermission.value) return;
  
  const numeroCompas = index + 1;
  
  if (selectionMode.value === 'single') {
    // Modo simple: solo seleccionar/deseleccionar una celda
    if (compasesSeleccionados.value[numeroCompas]) {
      delete compasesSeleccionados.value[numeroCompas];
    } else {
      compasesSeleccionados.value = { [numeroCompas]: true };
    }
  } else {
    // Modo múltiple: añadir/quitar de la selección
    if (compasesSeleccionados.value[numeroCompas]) {
      delete compasesSeleccionados.value[numeroCompas];
    } else {
      compasesSeleccionados.value = { 
        ...compasesSeleccionados.value, 
        [numeroCompas]: true, 
      };
    }
  }
  
  // Actualizar array de seleccionados para acciones masivas
  selectedCells.value = Object.keys(compasesSeleccionados.value)
    .map(key => parseInt(key))
    .sort((a, b) => a - b);
}

// Actualizar estado de compases seleccionados
async function updateSelectedCells() {
  if (!hasPermission.value || selectedCells.value.length === 0) return;
  
  loading.value = true;
  try {
    // Actualizar todos los compases seleccionados
    for (const compassNumber of selectedCells.value) {
      await montajeStore.updateInstrumentProgress(
        props.obraId,
        props.instrumentId,
        compassNumber,
        selectedState.value,
      );
    }
    
    // Limpiar selección
    compasesSeleccionados.value = {};
    selectedCells.value = [];
    
    // Recargar datos (ya se actualizan localmente en el store, pero recargar para asegurar consistencia)
    await loadCompassStates();
  } catch (error) {
    console.error('Error al actualizar estados:', error);
  } finally {
    loading.value = false;
  }
}

// Establecer modo de selección
function setSelectionMode(mode: 'single' | 'multiple' | 'range') {
  selectionMode.value = mode;
  compasesSeleccionados.value = {};
  selectedCells.value = [];
}

// Cambiar estado seleccionado
function changeSelectedState(estado: EstadoCompass) {
  selectedState.value = estado;
}

// Formatear nombre de estado para mostrar
function formatEstado(estado: ProgresoCompasEstado): string {
  return PROGRESO_COMPAS_INFO[estado].label;
}

// Vigilar cambios en propiedades
watch(() => props.instrumentId, loadCompassStates, { immediate: true });
watch(() => props.obraId, loadCompassStates);
watch(() => props.readOnly, checkPermissions);

// Al montar el componente
onMounted(async () => {
  await checkPermissions();
  await loadCompassStates();
});
</script>

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
