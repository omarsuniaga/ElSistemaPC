<!--
  🎯 TARJETA DE CLASE - COMPONENTE ATÓMICO
  Responsabilidad única: Mostrar información de una clase
-->
<template>
  <div 
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
    :class="cardClasses"
  >
    <!-- Header de la clase -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <h4 class="font-semibold text-gray-900 dark:text-white">
          {{ classItem.name }}
        </h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ classItem.location || 'Sin ubicación' }}
        </p>
      </div>
      
      <!-- Estado de la clase -->
      <div class="flex items-center space-x-2">
        <StatusBadge :status="classStatus" />
        <RoleBadge :role="classItem.userRole" />
      </div>
    </div>

    <!-- Horarios -->
    <div class="mb-3">
      <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Horarios del día
      </div>
      
      <div class="space-y-1">
        <div 
          v-for="timeSlot in todayTimeSlots"
          :key="`${timeSlot.startTime}-${timeSlot.endTime}`"
          class="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
        >
          {{ timeSlot.startTime }} - {{ timeSlot.endTime }}
        </div>
      </div>
    </div>

    <!-- Información adicional -->
    <div class="mb-4 space-y-2">
      <!-- Estudiantes -->
      <div v-if="classItem.students?.length" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {{ classItem.students.length }} estudiantes
      </div>

      <!-- Profesor principal -->
      <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Profesor: {{ teacherName }}
      </div>

      <!-- Asistencia -->
      <div v-if="classItem.hasAttendanceRecord" class="flex items-center text-sm text-green-600 dark:text-green-400">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Asistencia registrada
      </div>
    </div>

    <!-- Acciones -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="flex space-x-2">
        <!-- Botón principal -->
        <button
          v-if="!classItem.hasAttendanceRecord && classItem.canTakeAttendance"
          class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          @click="handleTakeAttendance"
        >
          Tomar Asistencia
        </button>
        
        <button
          v-else-if="classItem.hasAttendanceRecord"
          class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          @click="handleViewAttendance"
        >
          Ver/Editar Asistencia
        </button>

        <!-- Botón secundario -->
        <button
          class="px-3 py-1.5 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="handleEditClass"
        >
          Detalles
        </button>
      </div>

      <!-- Permisos -->
      <div v-if="!classItem.canTakeAttendance" class="text-xs text-gray-500 dark:text-gray-400">
        Sin permisos de asistencia
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CalendarService } from '../services/CalendarService';
import StatusBadge from './StatusBadge.vue';
import RoleBadge from './RoleBadge.vue';
import type { DayClassItem, ClassTimeSlot } from '../types/calendar.types';

// Props
interface Props {
  classItem: DayClassItem
  currentDate?: string
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'take-attendance': [classId: string]
  'view-attendance': [classId: string]
  'edit-class': [classId: string]
}>();

// Computed
const cardClasses = computed(() => {
  const classes = [];
  
  if (props.classItem.hasAttendanceRecord) {
    classes.push('border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10');
  } else if (props.classItem.canTakeAttendance) {
    classes.push('border-blue-200 dark:border-blue-700');
  } else {
    classes.push('border-gray-200 dark:border-gray-600 opacity-75');
  }
  
  return classes.join(' ');
});

const classStatus = computed(() => {
  if (props.classItem.hasAttendanceRecord) return 'completed';
  if (props.classItem.canTakeAttendance) return 'pending';
  return 'readonly';
});

const teacherName = computed(() => {
  const teacherId = props.classItem.teacherId;
  return `${teacherId.substring(0, 8)}...`; // Mostrar ID truncado
});

const todayTimeSlots = computed((): ClassTimeSlot[] => {
  if (!props.currentDate || !props.classItem.schedule?.slots) {
    return [];
  }

  const dayName = CalendarService.getDayName(props.currentDate);
  
  return props.classItem.schedule.slots.filter(slot => 
    slot.day.toLowerCase() === dayName.toLowerCase(),
  );
});

// Methods
const handleTakeAttendance = () => {
  emit('take-attendance', props.classItem.id);
};

const handleViewAttendance = () => {
  emit('view-attendance', props.classItem.id);
};

const handleEditClass = () => {
  emit('edit-class', props.classItem.id);
};
</script>

<style scoped>
/* Transiciones suaves */
.transition-shadow {
  transition: box-shadow 0.2s ease-in-out;
}

.transition-colors {
  transition: all 0.2s ease-in-out;
}

/* Hover effects */
.hover\:shadow-md:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
