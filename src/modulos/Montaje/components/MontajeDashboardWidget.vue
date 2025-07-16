<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        🎼 Progreso Musical
      </h3>
      <button
        class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        @click="openMontaje"
      >
        Ver todo →
      </button>
    </div>

    <div v-if="loading" class="animate-pulse">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>

    <div v-else-if="stats" class="space-y-4">
      <!-- Progreso general -->
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-600 dark:text-gray-400">Progreso General</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ stats.overallProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${stats.overallProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Estadísticas rápidas -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.activeWorks }}</div>
          <div class="text-gray-500 dark:text-gray-400">Obras Activas</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ stats.totalEvaluations }}</div>
          <div class="text-gray-500 dark:text-gray-400">Evaluaciones</div>
        </div>
      </div>

      <!-- Próximo ensayo -->
      <div v-if="nextSession" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <div class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
          Próximo Ensayo
        </div>
        <div class="text-sm text-blue-600 dark:text-blue-300">
          {{ nextSession.title }}
        </div>
        <div class="text-xs text-blue-500 dark:text-blue-400">
          {{ formatDate(nextSession.date) }}
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
      <div class="text-2xl mb-2">🎵</div>
      <p class="text-sm">No hay datos musicales disponibles</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { moduleManager } from '../core/ModuleManager';

const loading = ref(true);
const stats = ref<any>(null);
const nextSession = ref<any>(null);

const loadStats = async () => {
  try {
    // Simular carga de estadísticas
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    stats.value = {
      overallProgress: 67,
      activeWorks: 3,
      totalEvaluations: 45,
    };
    
    nextSession.value = {
      title: 'Ensayo General - Sinfonía No. 40',
      date: new Date(Date.now() + 86400000).toISOString(),
    };
  } catch (error) {
    console.error('Error loading Montaje stats:', error);
  } finally {
    loading.value = false;
  }
};

const openMontaje = () => {
  moduleManager.activateModule('montaje');
  moduleManager.emitEvent('navigate', { module: 'montaje' });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  loadStats();
});
</script>