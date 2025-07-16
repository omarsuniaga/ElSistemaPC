<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Panel General</h2>
    <!-- Componente de métricas del panel -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="metric in metrics"
        :key="metric.title"
        :class="[
          'bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4',
          metric.color.replace('text-', 'dark:text-'),
        ]"
      >
        <div
          :class="[
            'rounded-full p-3',
            metric.color,
            metric.color.replace('bg-', 'dark:bg-opacity-20 dark:bg-'),
          ]"
        >
          <component :is="metric.icon" class="h-6 w-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ metric.title }}</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ metric.value }}</p>
        </div>
      </div>
    </div>
    <!-- Aquí podrían ir otros elementos del panel general, como gráficos o resúmenes adicionales -->
  </div>
</template>

<script setup lang="ts">
import { BookOpenIcon, ClockIcon, UserGroupIcon, CalendarIcon } from '@heroicons/vue/24/outline';

// Definir los tipos esperados para las métricas
interface Metric {
  title: string
  value: number | string
  icon: any // Tipo más específico si es posible, ej: FunctionalComponent
  color: string
}

// Mapeo de iconos por nombre si es necesario (alternativa a pasar el componente icono directamente)
// const iconMap = {
//   BookOpenIcon,
//   ClockIcon,
//   UserGroupIcon,
//   CalendarIcon
// };
</script>

<style scoped>
/* Estilos específicos para este componente si son necesarios */
</style>
