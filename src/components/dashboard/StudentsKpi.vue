<template>
  <KpiCard
    title="Estudiantes presentes"
    :value="studentsPresent"
    icon="check"
    color="green"
    card-id="students-kpi"
  >
    <!-- Attendance rate progress -->
    <div class="mb-3">
      <div class="flex justify-between text-xs mb-1">
        <span class="font-medium text-gray-700 dark:text-gray-300">Asistencia</span>
        <span
          class="font-bold"
          :class="`text-${attendanceColor}-600 dark:text-${attendanceColor}-400`"
        >
          {{ attendancePercentage }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          :class="`bg-${attendanceColor}-600 dark:bg-${attendanceColor}-500`"
          class="h-1.5 rounded-full transition-all duration-500"
          :style="`width: ${attendancePercentage}%`"
        />
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 flex justify-between">
        <span>{{ studentsPresent }} estudiantes</span>
        <span v-if="totalActiveStudents > 0">de {{ totalActiveStudents }} activos</span>
      </div>
    </div>

    <!-- Status message based on attendance -->
    <div
      v-if="showLowAttendanceWarning"
      class="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded mb-3"
    >
      <span class="font-medium">Aviso:</span> Baja asistencia de estudiantes hoy
    </div>

    <!-- Trend indicator if available -->
    <div v-if="previousAttendancePercentage > 0" class="text-xs mt-1">
      <span
        :class="{
          'text-green-600 dark:text-green-400': trend === 'up',
          'text-red-600 dark:text-red-400': trend === 'down',
          'text-gray-600 dark:text-gray-400': trend === 'neutral',
        }"
      >
        <span v-if="trend === 'up'">↑</span>
        <span v-else-if="trend === 'down'">↓</span>
        <span v-else>→</span>
        {{ Math.abs(attendancePercentage - previousAttendancePercentage).toFixed(1) }}% respecto a
        ayer
      </span>
    </div>
  </KpiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import KpiCard from './KpiCard.vue';

const props = defineProps({
  studentsPresent: {
    type: Number,
    required: true,
  },
  attendancePercentage: {
    type: Number,
    required: true,
  },
  previousAttendancePercentage: {
    type: Number,
    default: 0,
  },
  totalActiveStudents: {
    type: Number,
    default: 0,
  },
});

// Determine color based on attendance percentage
const attendanceColor = computed(() => {
  if (props.attendancePercentage >= 90) return 'green';
  if (props.attendancePercentage >= 70) return 'blue';
  if (props.attendancePercentage >= 50) return 'yellow';
  return 'red';
});

// Determine if low attendance warning should be displayed
const showLowAttendanceWarning = computed(() => {
  return props.attendancePercentage < 70;
});

// Determine trend based on previous data
const trend = computed(() => {
  if (
    props.previousAttendancePercentage === 0 ||
    props.attendancePercentage === props.previousAttendancePercentage
  ) {
    return 'neutral';
  }
  return props.attendancePercentage > props.previousAttendancePercentage ? 'up' : 'down';
});

const totalStudentsDisplay = computed(() => {
  return props.totalActiveStudents || props.studentsPresent;
});
</script>
