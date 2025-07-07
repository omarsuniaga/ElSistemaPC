<template>
  <div class="space-y-6">
    <!-- Instrument Header -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ instrument.name }}</h1>
          <p class="text-gray-600">{{ instrument.family }} • {{ work.name }}</p>
        </div>
        <button
          @click="$emit('back')"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Volver
        </button>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="font-medium text-gray-700">Cantidad:</span>
          <div class="text-lg font-bold text-blue-600">{{ instrument.quantity || 1 }}</div>
        </div>
        <div>
          <span class="font-medium text-gray-700">Familia:</span>
          <div class="text-lg font-bold">{{ instrument.family }}</div>
        </div>
        <div>
          <span class="font-medium text-gray-700">Compases:</span>
          <div class="text-lg font-bold">{{ work.totalMeasures }}</div>
        </div>
        <div>
          <span class="font-medium text-gray-700">Progreso:</span>
          <div class="text-lg font-bold text-green-600">65%</div>
        </div>
      </div>
    </div>

    <!-- Instrument Heat Map -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">🎯 Mapa de Calor - {{ instrument.name }}</h2>
      <p class="text-gray-600 mb-6">Haz clic en los compases para cambiar su nivel de dificultad</p>
      
      <InstrumentHeatMap :work="work" :instrument="instrument" />
    </div>
  </div>
</template>

<script setup lang="ts">
import InstrumentHeatMap from '../components/InstrumentHeatMap.vue'
import type { MusicalWork, Instrument } from '../types/heatmap'

const props = defineProps<{
  work: MusicalWork
  instrument: Instrument
}>()

defineEmits<{
  back: []
}>()
</script>