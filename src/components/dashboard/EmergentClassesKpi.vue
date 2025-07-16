<template>
  <KpiCard
    title="Clases emergentes"
    :value="emergentClasses"
    icon="alert"
    color="purple"
    card-id="emergent-kpi"
  >
    <!-- Emergent classes percentage -->
    <div class="mb-3">
      <div class="flex justify-between text-xs mb-1">
        <span class="font-medium text-gray-700 dark:text-gray-300">Porcentaje del total</span>
        <span class="font-bold" :class="`text-${emergentColor}-600 dark:text-${emergentColor}-400`">
          {{ emergentClassPercentage }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          :class="`bg-${emergentColor}-600 dark:bg-${emergentColor}-500`"
          class="h-1.5 rounded-full transition-all duration-500"
          :style="`width: ${emergentClassPercentage}%`"
        />
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 flex justify-between">
        <span>{{ emergentClasses }} emergentes</span>
        <span>de {{ totalClassesDisplay }} clases totales</span>
      </div>
    </div>

    <!-- Warning message if percentage is high -->
    <div
      v-if="emergentClassPercentage > 20"
      class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded"
    >
      <span class="font-medium">Atención:</span> Alto porcentaje de clases emergentes
    </div>
  </KpiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import KpiCard from './KpiCard.vue';

const props = defineProps({
  emergentClasses: {
    type: Number,
    required: true,
  },
  emergentClassPercentage: {
    type: Number,
    required: true,
  },
  totalClasses: {
    type: Number,
    default: 0,
  },
});

// Determine color based on percentage
const emergentColor = computed(() => {
  if (props.emergentClassPercentage <= 10) return 'green';
  if (props.emergentClassPercentage <= 20) return 'yellow';
  return 'red'; // Too many emergent classes is concerning
});

const totalClassesDisplay = computed(() => {
  if (props.totalClasses > 0) return props.totalClasses;
  if (props.emergentClassPercentage > 0) {
    return Math.round(props.emergentClasses * (100 / props.emergentClassPercentage));
  }
  return props.emergentClasses;
});
</script>
