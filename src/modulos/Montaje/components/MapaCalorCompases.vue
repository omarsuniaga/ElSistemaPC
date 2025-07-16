<template>
  <div class="mapa-calor-container">
    <div class="flex justify-between items-center mb-3">
      <h4 class="text-sm font-medium text-gray-700">Mapa de Calor - Compases</h4>
      <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-1 text-xs">
          <div class="h-3 w-3 bg-gray-300 rounded" />
          <span>Sin trabajar</span>
        </div>
        <div class="flex items-center space-x-1 text-xs">
          <div class="h-3 w-3 bg-blue-400 rounded" />
          <span>Leído</span>
        </div>
        <div class="flex items-center space-x-1 text-xs">
          <div class="h-3 w-3 bg-yellow-400 rounded" />
          <span>Con dificultad</span>
        </div>
        <div class="flex items-center space-x-1 text-xs">
          <div class="h-3 w-3 bg-green-400 rounded" />
          <span>Logrado</span>
        </div>
      </div>
    </div>

    <div class="compases-grid">
      <div
        v-for="compas in totalCompases"
        :key="compas"
        class="compas-cell"
        :class="[
          getEstadoClass(estadosCompases[compas] || 'sin_trabajar'),
          {'cursor-pointer': editable, 'hover:ring-2 hover:ring-blue-300': editable},
        ]"
        :title="`Compás ${compas}: ${getEstadoLabel(estadosCompases[compas] || 'sin_trabajar')}`"
        @click="editable && cambiarEstado(compas)"
      >
        <span class="text-xs font-medium">{{ compas }}</span>
      </div>
    </div>

    <!-- Resumen estadístico -->
    <div class="mt-4 grid grid-cols-4 gap-2 text-xs">
      <div class="text-center">
        <div class="font-medium text-gray-700">{{ estadisticas.sinTrabajar }}</div>
        <div class="text-gray-500">Sin trabajar</div>
      </div>
      <div class="text-center">
        <div class="font-medium text-blue-700">{{ estadisticas.leidos }}</div>
        <div class="text-gray-500">Leídos</div>
      </div>
      <div class="text-center">
        <div class="font-medium text-yellow-700">{{ estadisticas.conDificultad }}</div>
        <div class="text-gray-500">Con dificultad</div>
      </div>
      <div class="text-center">
        <div class="font-medium text-green-700">{{ estadisticas.logrados }}</div>
        <div class="text-gray-500">Logrados</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { EstadoCompass } from '../types';

interface Props {
  obraId: string
  totalCompases: number
  estadosCompases: Record<number, string>
  editable?: boolean
}

interface Emits {
  (e: 'update-estado', obraId: string, compas: number, estado: string): void
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
});

const emit = defineEmits<Emits>();

// Estados disponibles en orden para rotación
const estadosOrden = [
  EstadoCompass.SIN_TRABAJAR,
  EstadoCompass.LEIDO,
  EstadoCompass.CON_DIFICULTAD,
  EstadoCompass.LOGRADO,
];

// Computed
const estadisticas = computed(() => {
  const stats = {
    sinTrabajar: 0,
    leidos: 0,
    conDificultad: 0,
    logrados: 0,
  };

  for (let i = 1; i <= props.totalCompases; i++) {
    const estado = props.estadosCompases[i] || EstadoCompass.SIN_TRABAJAR;
    switch (estado) {
    case EstadoCompass.SIN_TRABAJAR:
      stats.sinTrabajar++;
      break;
    case EstadoCompass.LEIDO:
      stats.leidos++;
      break;
    case EstadoCompass.CON_DIFICULTAD:
      stats.conDificultad++;
      break;
    case EstadoCompass.LOGRADO:
      stats.logrados++;
      break;
    }
  }

  return stats;
});

// Methods
function getEstadoClass(estado: string): string {
  switch (estado) {
  case EstadoCompass.SIN_TRABAJAR:
    return 'bg-gray-300 text-gray-700';
  case EstadoCompass.LEIDO:
    return 'bg-blue-400 text-blue-900';
  case EstadoCompass.CON_DIFICULTAD:
    return 'bg-yellow-400 text-yellow-900';
  case EstadoCompass.LOGRADO:
    return 'bg-green-400 text-green-900';
  default:
    return 'bg-gray-300 text-gray-700';
  }
}

function getEstadoLabel(estado: string): string {
  switch (estado) {
  case EstadoCompass.SIN_TRABAJAR:
    return 'Sin trabajar';
  case EstadoCompass.LEIDO:
    return 'Leído';
  case EstadoCompass.CON_DIFICULTAD:
    return 'Con dificultad';
  case EstadoCompass.LOGRADO:
    return 'Logrado';
  default:
    return 'Sin trabajar';
  }
}

function cambiarEstado(compas: number) {
  if (!props.editable) return;

  const estadoActual = props.estadosCompases[compas] || EstadoCompass.SIN_TRABAJAR;
  const indiceActual = estadosOrden.indexOf(estadoActual as EstadoCompass);
  const siguienteIndice = (indiceActual + 1) % estadosOrden.length;
  const nuevoEstado = estadosOrden[siguienteIndice];

  emit('update-estado', props.obraId, compas, nuevoEstado);
}
</script>

<style scoped>
.mapa-calor-container {
  @apply w-full;
}

.compases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
}

.compas-cell {
  @apply h-8 w-8 rounded flex items-center justify-center transition-all duration-200;
  min-width: 32px;
}

.compas-cell:hover {
  transform: scale(1.1);
}
</style>
