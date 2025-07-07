<template>
  <div class="space-y-6">
    <!-- Work Header -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ work.name }}</h1>
          <p class="text-xl text-blue-600 font-medium mb-4">{{ work.composer }}</p>
          
          <p v-if="work.description" class="text-gray-600 mb-4">{{ work.description }}</p>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700">Compases:</span>
              <div class="text-lg font-bold text-blue-600">{{ work.totalMeasures }}</div>
            </div>
            <div>
              <span class="font-medium text-gray-700">Tonalidad:</span>
              <div class="text-lg font-bold">{{ work.key }}</div>
            </div>
            <div>
              <span class="font-medium text-gray-700">Tempo:</span>
              <div class="text-lg font-bold">{{ work.tempo }}</div>
            </div>
            <div>
              <span class="font-medium text-gray-700">Compás:</span>
              <div class="text-lg font-bold">{{ work.timeSignature }}</div>
            </div>
          </div>
        </div>
        
        <div class="lg:w-80">
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-medium text-gray-700 mb-2">Información de Estudio</h3>
            <div class="space-y-2 text-sm">
              <div v-if="work.startDate">
                <span class="text-gray-500">Inicio:</span>
                <span class="ml-2 font-medium">{{ formatDate(work.startDate) }}</span>
              </div>
              <div v-if="work.endDate">
                <span class="text-gray-500">Meta:</span>
                <span class="ml-2 font-medium">{{ formatDate(work.endDate) }}</span>
              </div>
              <div v-if="work.requirements">
                <span class="text-gray-500">Requisitos:</span>
                <p class="text-gray-700 mt-1">{{ work.requirements }}</p>
              </div>
              <div v-if="work.techniques">
                <span class="text-gray-500">Técnicas:</span>
                <p class="text-gray-700 mt-1">{{ work.techniques }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- General Heat Map -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">📊 Mapa de Calor General</h2>
      <p class="text-gray-600 mb-6">Vista promedio de todos los instrumentos</p>
      
      <GeneralHeatMap :work="work" />
    </div>

    <!-- Instruments List -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">🎼 Instrumentos de la Obra</h2>
      <p class="text-gray-600 mb-6">Selecciona un instrumento para ver su mapa de calor específico</p>
      
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="instrument in work.instruments"
          :key="instrument.id"
          @click="selectInstrument(instrument)"
          class="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-gray-900">{{ instrument.name }}</h3>
            <span v-if="instrument.quantity" class="text-sm text-gray-500">
              {{ instrument.quantity }}
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-blue-600 font-medium">{{ instrument.family }}</span>
            <button class="text-blue-500 hover:text-blue-700 text-sm">
              Ver mapa →
            </button>
          </div>
          
          <!-- Progress indicators preview -->
          <div class="mt-3 pt-3 border-t border-gray-100">
            <div class="text-xs text-gray-500 mb-1">Progreso promedio</div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: '60%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GeneralHeatMap from '../components/GeneralHeatMap.vue'
import type { MusicalWork, Instrument } from '../types/heatmap'

const props = defineProps<{
  work: MusicalWork
}>()

const emit = defineEmits<{
  instrumentSelected: [instrument: Instrument]
}>()

const selectInstrument = (instrument: Instrument) => {
  emit('instrumentSelected', instrument)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES')
}
</script>