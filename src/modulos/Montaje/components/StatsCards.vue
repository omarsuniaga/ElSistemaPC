<!-- src/modulos/Montaje/components/StatsCards.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Total Works -->
    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg
              class="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Total de Obras
              </dt>
              <dd class="text-lg font-medium text-gray-900 dark:text-white">
                {{ stats.totalWorks }}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Works -->
    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg
              class="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Obras Activas
              </dt>
              <dd class="text-lg font-medium text-gray-900 dark:text-white">
                {{ stats.activeWorks }}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Completed Works -->
    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg
              class="h-6 w-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Obras Completadas
              </dt>
              <dd class="text-lg font-medium text-gray-900 dark:text-white">
                {{ stats.completedWorks }}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Average Progress -->
    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg
              class="h-6 w-6 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Progreso Promedio
              </dt>
              <dd class="text-lg font-medium text-gray-900 dark:text-white">
                {{ stats.averageProgress }}%
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Progress Chart -->
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Progreso por Obra</h3>
    <div class="space-y-4">
      <div v-for="work in worksProgress" :key="work.id" class="flex items-center">
        <div class="w-32 text-sm text-gray-900 dark:text-white truncate">
          {{ work.title }}
        </div>
        <div class="flex-1 mx-4">
          <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{width: work.progress + '%'}"
            />
          </div>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
          {{ work.progress }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Work {
  id: string
  title: string
  progress: number
  status: string
}

interface Props {
  works: Work[]
}

const props = defineProps<Props>();

const stats = computed(() => {
  const totalWorks = props.works.length;
  const activeWorks = props.works.filter(
    (w) => w.status === 'en_montaje' || w.status === 'en_estudio' || w.status === 'en_pulimiento',
  ).length;
  const completedWorks = props.works.filter(
    (w) => w.status === 'presentada' || w.status === 'lista',
  ).length;
  const averageProgress =
    totalWorks > 0
      ? Math.round(props.works.reduce((sum, w) => sum + w.progress, 0) / totalWorks)
      : 0;

  return {
    totalWorks,
    activeWorks,
    completedWorks,
    averageProgress,
  };
});

const worksProgress = computed(() =>
  props.works
    .slice(0, 10) // Mostrar solo las primeras 10 obras
    .map((work) => ({
      id: work.id,
      title: work.title,
      progress: work.progress || 0,
    })),
);
</script>
