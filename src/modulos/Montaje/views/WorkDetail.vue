<template>
  <div v-if="loading" class="flex justify-center items-center p-10">
    <div class="text-2xl text-gray-500">Cargando Obra...</div>
  </div>
  <div v-else-if="!work" class="flex justify-center items-center p-10">
    <div class="text-2xl text-red-500">Obra no encontrada.</div>
  </div>
  <div v-else class="space-y-6 pb-24 px-2 md:px-4 mb-20 max-w-7xl mx-auto">
    <!-- Work Header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{{ work.name }}</h1>
          <p class="text-xl text-blue-600 font-medium mb-4">{{ work.composer }}</p>
          
          <p v-if="work.description" class="text-gray-600 dark:text-gray-300 mb-4">{{ work.description }}</p>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-100">Compases:</span>
              <div class="text-lg font-bold text-blue-600 dark:text-blue-100">{{ work.totalMeasures }}</div>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-100">Tonalidad:</span>
              <div class="text-lg font-bold text-blue-600 dark:text-blue-100">{{ work.key }}</div>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-100">Tempo:</span>
              <div class="text-lg font-bold text-blue-600 dark:text-blue-100">{{ work.tempo }}</div>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-100">Compás:</span>
              <div class="text-lg font-bold text-blue-600 dark:text-blue-100">{{ work.timeSignature }}</div>
            </div>
          </div>
        </div>
        
        <div class="lg:w-80">
          <div class="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
            <h3 class="font-medium text-gray-700 dark:text-gray-100 mb-2">Información de Estudio</h3>
            <div class="space-y-2 text-sm">
              <div v-if="work.startDate">
                <span class="text-gray-500 dark:text-gray-100">Inicio:</span>
                <span class="ml-2 font-medium">{{ formatDate(work.startDate) }}</span>
              </div>
              <div v-if="work.endDate">
                <span class="text-gray-500 dark:text-gray-100">Meta:</span>
                <span class="ml-2 font-medium">{{ formatDate(work.endDate) }}</span>
              </div>
              <div v-if="work.requirements">
                <span class="text-gray-500 dark:text-gray-100">Requisitos:</span>
                <p class="text-gray-700 dark:text-gray-100 mt-1">{{ work.requirements }}</p>
              </div>
              <div v-if="work.techniques">
                <span class="text-gray-500 dark:text-gray-100">Técnicas:</span>
                <p class="text-gray-700 dark:text-gray-100 mt-1">{{ work.techniques }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- General Heat Map -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 overflow-x-auto">
      <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">📊 Mapa de Calor General</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">Vista promedio de todos los instrumentos</p>
      
      <div class="max-w-full">
        <GeneralHeatMap :work="work" />
      </div>
    </div>

    <!-- Instruments List -->
    <div class="dark:bg-gray-800 dark:text-gray-700 rounded-lg bg-gray-50 text-gray-700  rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">🎼 Instrumentos de la Obra</h2>
      <p class="dark:text-gray-100 text-gray-700 mb-6">
        Selecciona un instrumento para ver su mapa de calor específico
      </p>
      
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="instrument in work.instruments"
          :key="instrument.id"
          class="border border-blue-400 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200"
          @click="goToInstrumentDetail(instrument)"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium dark:text-gray-100 text-gray-700 ">{{ instrument.name }}</h3>
            <span v-if="instrument.quantity" class="text-sm text-gray-500 dark:text-gray-100">
              {{ instrument.quantity }}
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-blue-600 font-medium dark:text-blue-100">{{ instrument.family }}</span>
            <button class="text-blue-500 hover:text-blue-700 text-sm" @click.stop="goToInstrumentDetail(instrument)">Ver mapa →</button>
          </div>
          
          <!-- Progress indicators preview -->
          <div class="mt-3 pt-3 border-t border-gray-100">
            <div class="text-xs text-gray-500 mb-1 dark:text-gray-100 ">Progreso promedio</div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{width: '60%'}"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import GeneralHeatMap from '../components/GeneralHeatMap.vue';
import type { Instrument } from '../types/heatmap';
import { useMusicalWorks } from '../composables/useHeatMapProjects';

const route = useRoute();
const router = useRouter();
const { loadWork, currentWork, loading } = useMusicalWorks();

const workId = computed(() => route.params.id as string);

onMounted(async () => {
  if (workId.value) {
    await loadWork(workId.value);
  }
});

const work = computed(() => currentWork.value);

const goToInstrumentDetail = (instrument: Instrument) => {
  router.push({ 
    name: 'montaje-instrument-detail', 
    params: { workId: workId.value, instrumentId: instrument.id }, 
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES');
};
</script>

<style scoped>
/* Asegurar que el contenedor principal tenga suficiente espacio para el menú inferior */
.mb-20 {
  margin-bottom: 5rem;
}
</style>