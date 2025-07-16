<template>
  <KpiCard
    title="Clases regulares"
    :value="regularClasses"
    icon="calendar"
    color="blue"
    card-id="classes-kpi"
  >
    <!-- Classes completion rate -->
    <div class="mb-3">
      <div class="flex justify-between text-xs mb-1">
        <span class="font-medium text-gray-700 dark:text-gray-300">Clases realizadas</span>
        <span
          class="font-bold"
          :class="`text-${completionColor}-600 dark:text-${completionColor}-400`"
        >
          {{ classCompletionRate }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          :class="`bg-${completionColor}-600 dark:bg-${completionColor}-500`"
          class="h-1.5 rounded-full transition-all duration-500"
          :style="`width: ${classCompletionRate}%`"
        />
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 flex justify-between">
        <span>{{ regularClasses }} realizadas</span>
        <span>de {{ expectedClasses }} programadas</span>
      </div>
    </div>

    <!-- Classrooms usage -->
    <div>
      <div class="flex justify-between text-xs mb-1">
        <span class="font-medium text-gray-700 dark:text-gray-300">Salones en uso</span>
        <span
          class="font-bold"
          :class="`text-${classroomColor}-600 dark:text-${classroomColor}-400`"
        >
          {{ classroomsUsagePercentage }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          :class="`bg-${classroomColor}-600 dark:bg-${classroomColor}-500`"
          class="h-1.5 rounded-full transition-all duration-500"
          :style="`width: ${classroomsUsagePercentage}%`"
        />
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 flex justify-between">
        <span>{{ classroomsInUse }} ocupados</span>
        <span>{{ expectedClassrooms }} disponibles</span>
      </div>
    </div>
  </KpiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import KpiCard from './KpiCard.vue';

const props = defineProps({
  regularClasses: {
    type: Number,
    required: true,
  },
  expectedClasses: {
    type: Number,
    required: true,
  },
  classCompletionRate: {
    type: Number,
    required: true,
  },
  classroomsInUse: {
    type: Number,
    required: true,
  },
  expectedClassrooms: {
    type: Number,
    required: true,
  },
});

const classroomsUsagePercentage = computed(() => {
  if (!props.expectedClassrooms) return 0;
  return Math.round((props.classroomsInUse / props.expectedClassrooms) * 100);
});

// Determine color based on completion rate
const completionColor = computed(() => {
  if (props.classCompletionRate >= 90) return 'green';
  if (props.classCompletionRate >= 70) return 'blue';
  if (props.classCompletionRate >= 50) return 'yellow';
  return 'red';
});

// Determine color for classroom usage
const classroomColor = computed(() => {
  if (classroomsUsagePercentage.value >= 90) return 'red'; // Too many rooms in use
  if (classroomsUsagePercentage.value >= 70) return 'yellow';
  return 'green'; // Good utilization
});
</script>
