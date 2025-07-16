<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="text-lg text-gray-500">Cargando mapa de calor general...</div>
    </div>

    <!-- Heat Map Grid -->
    <div v-else class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto border border-blue-500">
      <div class="mb-4 text-center text-sm text-gray-600 dark:text-gray-100">
        Dimensiones: {{ Math.ceil((work.totalMeasures || work.compas || 0) / (work.cols || 10)) }} filas × {{ work.cols || 10 }} columnas = {{ work.totalMeasures || work.compas || 0 }} compases
      </div>
      
      <div 
        class="grid gap-1 mx-auto"
        :style="{ 
          gridTemplateColumns: `repeat(${work.cols}, minmax(0, 1fr))`,
          maxWidth: `${work.cols * 2.5}rem`
        }"
      >
        <div
          v-for="cell in grid"
          :key="cell.id"
          :class="getCellClass(cell)"
          class="aspect-square flex items-center justify-center text-xs font-bold text-white text-shadow border border-gray-300 rounded-sm shadow-sm"
          :title="`Compás ${cell.measureNumber} - ${getLevelName(cell.level)}`"
        >
          {{ cell.measureNumber }}
        </div>
      </div>
      <!-- Legend -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 ">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">Leyenda de Niveles (Promedio General)</h3>
        <div class="flex flex-wrap gap-3">
          <div 
            v-for="level in work.levels" 
            :key="level.id"
            class="flex items-center gap-2"
          >
            <div 
              class="w-6 h-6 rounded-sm border border-gray-700"
              :class="level.color"
            ></div>
            <span class="text-sm text-gray-600 dark:text-gray-100">{{ level.name }}</span>
          </div>
        </div>
      </div>
    </div>


    <!-- Statistics -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-500">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-100 mb-3">Estadísticas Generales</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.total }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-300">Total Compases</div>
        </div>
        <div 
          v-for="(level, index) in work.levels" 
          :key="level.id"
          class="text-center"
        > 
          <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.levels[index] || 0 }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-300">
            {{ level.name }} ({{ stats.percentages[index] || 0 }}%)
          </div>
          <div 
            class="w-4 h-4 mx-auto mt-1 rounded-sm"
            :class="level.color"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { MusicalWork, GridCell } from '../types/heatmap';

const props = defineProps<{
  work: MusicalWork
}>();

const loading = ref(true);
const grid = ref<GridCell[]>([]);

// Initialize grid with measure numbers
const initializeGrid = () => {
  const newGrid: GridCell[] = [];
  let measureNumber = 1;
  const totalMeasures = props.work.totalMeasures || props.work.compas || 0;
  
  // Determinar filas y columnas optimizadas
  const cols = props.work.cols || 10;
  const rows = Math.ceil(totalMeasures / cols);
  
  // Crear solo las celdas necesarias para el número real de compases
  for (let row = 0; row < rows && measureNumber <= totalMeasures; row++) {
    for (let col = 0; col < cols && measureNumber <= totalMeasures; col++) {
      newGrid.push({
        id: `${row}-${col}`,
        level: Math.floor(Math.random() * props.work.levels.length), // Random for demo
        row,
        col,
        selected: false,
        measureNumber: measureNumber,
      });
      measureNumber++;
    }
  }
  
  return newGrid;
};

// Get color class from work configuration
const getCellClass = (cell: GridCell): string => {
  const levelConfig = props.work.levels.find(l => l.id === cell.level);
  return levelConfig?.color || 'bg-gray-500';
};

// Get level name from work configuration
const getLevelName = (level: number): string => {
  const levelConfig = props.work.levels.find(l => l.id === level);
  return levelConfig?.name || `Nivel ${level}`;
};

// Statistics
const stats = computed(() => {
  const totalCells = grid.value.length;
  const levelCounts = props.work.levels.map(level => 
    grid.value.filter(cell => cell.level === level.id).length,
  );
  
  return {
    total: totalCells,
    levels: levelCounts,
    percentages: levelCounts.map(count => 
      totalCells > 0 ? Math.round((count / totalCells) * 100) : 0,
    ),
  };
});

onMounted(() => {
  // Simulate loading
  setTimeout(() => {
    grid.value = initializeGrid();
    loading.value = false;
  }, 500);
});
</script>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
</style>