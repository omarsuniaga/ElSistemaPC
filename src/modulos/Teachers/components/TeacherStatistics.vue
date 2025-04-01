<script setup lang="ts">
// ../modulos/Teacher/components/TeacherStatistics.vue
import { computed } from 'vue';
import { ChartBarIcon, PieChartIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  classes: {
    type: Array,
    required: true,
    default: () => []
  }
});

// Calcular estadísticas de clases por nivel
const classesByLevel = computed(() => {
  const levels = {};
  
  props.classes.forEach(classItem => {
    const level = classItem.level || 'Sin nivel';
    levels[level] = (levels[level] || 0) + 1;
  });
  
  return Object.entries(levels).map(([level, count]) => ({ 
    level, 
    count,
    percentage: Math.round((count as number) * 100 / props.classes.length)
  }));
});

// Calcular estadísticas de clases por instrumento
const classesByInstrument = computed(() => {
  const instruments = {};
  
  props.classes.forEach(classItem => {
    const instrument = classItem.instrument || 'Sin instrumento';
    instruments[instrument] = (instruments[instrument] || 0) + 1;
  });
  
  return Object.entries(instruments).map(([instrument, count]) => ({ 
    instrument, 
    count,
    percentage: Math.round((count as number) * 100 / props.classes.length)
  }));
});

// Calcular total de estudiantes
const totalStudents = computed(() => {
  return props.classes.reduce((acc, curr) => {
    return acc + (curr.studentIds?.length || 0);
  }, 0);
});

// Calcular total de horas de clase semanales
const totalHoursWeekly = computed(() => {
  return props.classes.reduce((acc, curr) => {
    if (!curr.schedule || !curr.schedule.slots) return acc;
    
    return acc + curr.schedule.slots.reduce((slotAcc, slot) => {
      const startTime = slot.startTime.split(':').map(Number);
      const endTime = slot.endTime.split(':').map(Number);
      const hours = endTime[0] - startTime[0];
      const minutes = endTime[1] - startTime[1];
      return slotAcc + hours + (minutes / 60);
    }, 0);
  }, 0);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Resumen general -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex items-center mb-3">
          <ChartBarIcon class="w-5 h-5 text-blue-500 mr-2" />
          <h3 class="font-medium">Resumen General</h3>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div class="text-sm text-gray-600 dark:text-gray-400">Total de clases</div>
            <div class="text-2xl font-bold">{{ props.classes.length }}</div>
          </div>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div class="text-sm text-gray-600 dark:text-gray-400">Total de estudiantes</div>
            <div class="text-2xl font-bold">{{ totalStudents }}</div>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg col-span-2">
            <div class="text-sm text-gray-600 dark:text-gray-400">Horas semanales</div>
            <div class="text-2xl font-bold">{{ Math.round(totalHoursWeekly * 10) / 10 }} hrs</div>
          </div>
        </div>
      </div>
      
      <!-- Clases por nivel -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex items-center mb-3">
          <PieChartIcon class="w-5 h-5 text-purple-500 mr-2" />
          <h3 class="font-medium">Clases por Nivel</h3>
        </div>
        <div class="space-y-3">
          <div v-for="item in classesByLevel" :key="item.level" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span>{{ item.level }}</span>
              <span class="font-medium">{{ item.count }} ({{ item.percentage }}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                class="bg-purple-500 h-1.5 rounded-full"
                :style="`width: ${item.percentage}%`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Clases por instrumento -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="flex items-center mb-4">
        <h3 class="font-medium">Clases por Instrumento</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div 
          v-for="item in classesByInstrument" 
          :key="item.instrument"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
        >
          <div class="flex justify-between mb-2">
            <span class="font-medium">{{ item.instrument }}</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ item.count }} clases</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              class="bg-blue-500 h-1.5 rounded-full"
              :style="`width: ${item.percentage}%`"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
