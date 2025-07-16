<template>
  <div v-if="loading" class="flex justify-center items-center p-10">
    <div class="text-2xl text-gray-500">Cargando datos del instrumento...</div>
  </div>
  <div v-else-if="!currentWork || !currentInstrument" class="flex justify-center items-center p-10">
    <div class="text-2xl text-red-500">No se encontró el instrumento o la obra.</div>
    <button 
      class="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      @click="goBack"
    >
      Volver
    </button>
  </div>
  <div v-else class="space-y-6">
    <!-- Instrument Header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ currentInstrument.name }}</h1>
          <p class="text-gray-600 dark:text-gray-100">{{ currentInstrument.family }} • {{ currentWork.name }}</p>
        </div>
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          @click="goBack"
        >
          ← Volver
        </button>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-100">Cantidad:</span>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-100">{{ currentInstrument.quantity || 1 }}</div>
        </div>
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-100">Familia:</span>
          <div class="text-lg font-bold dark:text-gray-100">{{ currentInstrument.family }}</div>
        </div>
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-100">Compases:</span>
          <div class="text-lg font-bold dark:text-gray-100">{{ currentWork.totalMeasures || currentWork.compas || 0 }}</div>
        </div>
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-100">Progreso:</span>
          <div class="text-lg font-bold text-green-600 dark:text-green-100">65%</div>
        </div>
      </div>
    </div>

    <!-- Instrument Heat Map -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">🎯 Mapa de Calor - {{ currentInstrument.name }}</h2>
      <p class="text-gray-600 dark:text-gray-100 mb-6">Haz clic en los compases para cambiar su nivel de dificultad</p>
      
      <InstrumentHeatMap :work="currentWork" :instrument="currentInstrument" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InstrumentHeatMap from '../components/InstrumentHeatMap.vue';
import { useMusicalWorks } from '../composables/useHeatMapProjects';
import type { MusicalWork, Instrument } from '../types/heatmap';

// Obtener parámetros de ruta
const route = useRoute();
const router = useRouter();
const workId = computed(() => route.params.workId as string);
const instrumentId = computed(() => route.params.instrumentId as string);

// Configurar estado
const loading = ref(true);
const { loadWork, currentWork } = useMusicalWorks();
const currentInstrument = ref<Instrument | null>(null);

// Cargar datos
onMounted(async () => {
  try {
    if (workId.value) {
      await loadWork(workId.value);
      
      // Una vez cargada la obra, buscar el instrumento por su ID
      if (currentWork.value && currentWork.value.instruments) {
        const instrument = currentWork.value.instruments.find(i => 
          i.id === instrumentId.value || 
          i.id.toLowerCase() === instrumentId.value.toLowerCase(),
        );
        
        if (instrument) {
          currentInstrument.value = instrument;
        }
      }
    }
  } catch (error) {
    console.error('Error cargando datos del instrumento:', error);
  } finally {
    loading.value = false;
  }
});

// Navegación
const goBack = () => {
  router.push({ name: 'montaje-work-detail', params: { id: workId.value } });
};
</script>