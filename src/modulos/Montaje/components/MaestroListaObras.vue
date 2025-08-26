<template>
  <div class="xl:col-span-2 space-y-6">
    <!-- Filtros y Búsqueda -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div class="flex flex-wrap gap-4 items-center">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar obras..."
          class="flex-1 min-w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <select
          v-model="filtroEstado"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          <option value="sin_trabajar">Sin trabajar</option>
          <option value="en_progreso">En progreso</option>
          <option value="completado">Completado</option>
        </select>
      </div>
    </div>

    <!-- Lista de Obras -->
    <div class="space-y-4">
      <div
        v-for="obra in obrasFiltradas"
        :key="obra.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        @click="$emit('verDetalleObra', obra)"
      >
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ obra.titulo }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300">{{ obra.compositor }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ obra.totalCompases ?? 0 }} compases • {{ obra.duracionEstimada ?? 0 }} min
              </p>
            </div>
            <div class="text-right">
              <div
                class="text-2xl font-bold"
                :class="getProgresoColorClass(obra.metadatos?.progresoPorcentaje ?? 0)"
              >
                {{ obra.metadatos?.progresoPorcentaje ?? 0 }}%
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Progreso</div>
            </div>
          </div>

          <!-- Barra de progreso -->
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="getProgresoBarClass(obra.metadatos?.progresoPorcentaje ?? 0)"
              :style="{width: (obra.metadatos?.progresoPorcentaje ?? 0) + '%'}"
            />
          </div>

          <!-- Selector de instrumentos para filtrar el mapa de calor -->
          <div class="mb-2 flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mapa de Calor - Compases
            </h4>
            <select
              v-model="instrumentoSeleccionado[obra.id]"
              class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              @change="$emit('filtrarPorInstrumento', obra.id)"
            >
              <option value="">Todos los instrumentos</option>
              <option
                v-for="instrumento in obra.instrumentosRequeridos"
                :key="instrumento.instrumentoId"
                :value="instrumento.instrumentoId"
              >
                {{ instrumento.nombre }}
              </option>
            </select>
          </div>
          <div>
            <MapaCalorCompases
              :obra-id="obra.id"
              :instrument-id="instrumentoSeleccionado[obra.id]"
              :total-compases="obra.totalCompases ?? 0"
              :estados-compases="montajeStore.currentInstrumentProgress"
              :editable="true"
              @update-estado="montajeStore.updateInstrumentProgress(obra.id, instrumentoSeleccionado[obra.id], $event.compas, $event.estado)"
            />
          </div>

          <!-- Instrumentos asignados -->
          <div class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instrumentos
            </h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="instrumento in obra.instrumentosRequeridos"
                :key="instrumento.instrumentoId"
                class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full"
              >
                {{ instrumento.nombre }}
              </span>
            </div>
          </div>

          <!-- Acciones -->
          <div
            class="flex justify-end items-center pt-4 border-t border-gray-100 dark:border-gray-700"
          >
            <div class="flex space-x-2">
              <button
                class="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                @click.stop="$emit('abrirModalObservaciones', obra)"
              >
                💬 Observaciones
              </button>
              <button
                class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                @click.stop="$emit('abrirModalEvaluacion', obra)"
              >
                ⭐ Evaluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, PropType } from 'vue';
import type { Obra, TipoInstrumento } from '../types';
import MapaCalorCompases from '../components/MapaCalorCompases.vue';
import { useMontajeStore } from '../store/montaje'; // Importar el store

const montajeStore = useMontajeStore(); // Instanciar el store

const props = defineProps({
  obras: {
    type: Array as PropType<Obra[]>,
    required: true,
  },
  // estadosCompasesPorObra ya no es un prop, se obtiene del store
  searchTerm: {
    type: String,
    required: true,
  },
  filtroEstado: {
    type: String,
    required: true,
  },
  instrumentoSeleccionado: {
    type: Object as PropType<Record<string, TipoInstrumento>>,
    required: true,
  },
  getProgresoColorClass: {
    type: Function as PropType<(progreso: number) => string>,
    required: true,
  },
  getProgresoBarClass: {
    type: Function as PropType<(progreso: number) => string>,
    required: true,
  },
});

const emit = defineEmits([
  'update:searchTerm',
  'update:filtroEstado',
  'update:instrumentoSeleccionado',
  'verDetalleObra',
  'filtrarPorInstrumento',
  'actualizarEstadoCompass',
  'abrirModalObservaciones',
  'abrirModalEvaluacion',
]);

const searchTerm = computed({
  get: () => props.searchTerm,
  set: (value) => emit('update:searchTerm', value),
});

const filtroEstado = computed({
  get: () => props.filtroEstado,
  set: (value) => emit('update:filtroEstado', value),
});

const instrumentoSeleccionado = computed({
  get: () => props.instrumentoSeleccionado,
  set: (value) => {
    emit('update:instrumentoSeleccionado', value);
    // Cuando el instrumento seleccionado cambia, cargar el progreso para esa obra y ese instrumento
    if (value && montajeStore.obraActual?.id) {
      montajeStore.loadInstrumentProgress(montajeStore.obraActual.id, value[montajeStore.obraActual.id]);
    }
  },
});

// Obtener el progreso del instrumento actual del store
const estadosCompasesPorObra = computed(() => montajeStore.currentInstrumentProgress);

const obrasFiltradas = computed(() => {
  let filteredObras = props.obras;

  if (searchTerm.value) {
    filteredObras = filteredObras.filter(
      (obra) =>
        obra.titulo.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        obra.compositor?.toLowerCase().includes(searchTerm.value.toLowerCase()),
    );
  }

  if (filtroEstado.value) {
    filteredObras = filteredObras.filter((obra) => {
      const progreso = obra.metadatos?.progresoPorcentaje ?? 0;
      switch (filtroEstado.value) {
        case 'sin_trabajar':
          return progreso === 0;
        case 'en_progreso':
          return progreso > 0 && progreso < 100;
        case 'completado':
          return progreso === 100;
        default:
          return true;
      }
    });
  }

  return filteredObras;
});
</script>
