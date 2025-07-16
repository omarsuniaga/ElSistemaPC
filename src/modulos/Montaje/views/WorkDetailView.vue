<template>
  <div class="work-detail-view p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div v-if="montajeStore.isLoading" class="text-center text-gray-600 dark:text-gray-400">
      Cargando obra...
    </div>
    <div v-else-if="montajeStore.error" class="text-center text-red-600 dark:text-red-400">
      Error: {{ montajeStore.error }}
    </div>
    <div v-else-if="!montajeStore.obraActual" class="text-center text-gray-600 dark:text-gray-400">
      Obra no encontrada.
    </div>
    <div v-else class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {{ montajeStore.obraActual.titulo }}
      </h1>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Compositor: {{ montajeStore.obraActual.compositor }}
      </p>

      <!-- Mapa de Calor General -->
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
        Mapa de Calor General
      </h2>
      <MapaCalorCompases
        :obra-id="montajeStore.obraActual.id"
        :total-compases="montajeStore.obraActual.totalCompases"
        :estados-compases="montajeStore.estadosCompasesPorObra[montajeStore.obraActual.id] || {}"
        :editable="false"
      />

      <!-- Selector de Instrumento -->
      <div class="mt-6">
        <label for="instrument-select" class="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Seleccionar Instrumento para Gestión de Compases
        </label>
        <select
          id="instrument-select"
          v-model="selectedInstrument"
          class="input w-full md:w-1/2"
        >
          <option :value="null">Selecciona un instrumento</option>
          <option
            v-for="instrumento in montajeStore.obraActual.instrumentosRequeridos"
            :key="instrumento.instrumentoId"
            :value="instrumento.instrumentoId"
          >
            {{ instrumento.nombre }}
          </option>
        </select>
      </div>

      <!-- Botón Gestionar Compases -->
      <div class="mt-6 text-right">
        <button
          :disabled="!selectedInstrument"
          class="btn btn-primary"
          @click="goToMeasureManager"
        >
          Gestionar Compases
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMontajeStore } from '../store/montaje';
import MapaCalorCompases from '../components/MapaCalorCompases.vue';
import { TipoInstrumento } from '../types/montaje'; // Importar TipoInstrumento

const route = useRoute();
const router = useRouter();
const montajeStore = useMontajeStore();

const obraId = route.params.obraId as string;
const selectedInstrument = ref<TipoInstrumento | null>(null);

onMounted(async () => {
  if (obraId) {
    await montajeStore.cargarObra(obraId);
    // Cargar estados de compases para la obra
    await montajeStore.cargarEstadosCompases(obraId);
  }
});

// Watch para cargar la obra si cambia el obraId de la ruta (aunque no debería en esta vista)
watch(
  () => route.params.obraId,
  async (newObraId) => {
    if (newObraId) {
      await montajeStore.cargarObra(newObraId as string);
      await montajeStore.cargarEstadosCompases(newObraId as string);
    }
  }
);

const goToMeasureManager = () => {
  if (montajeStore.obraActual && selectedInstrument.value) {
    router.push({
      name: 'MeasureManager', // Este nombre de ruta se definirá en la Fase 2, Paso 6
      params: {
        obraId: montajeStore.obraActual.id,
        instrumentoId: selectedInstrument.value,
      },
    });
  }
};
</script>

<style scoped>
/* Estilos específicos para WorkDetailView */
.input {
  @apply p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
