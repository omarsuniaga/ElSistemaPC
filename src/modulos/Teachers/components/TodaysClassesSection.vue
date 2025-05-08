<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { CalendarIcon, ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline';

// Define types for class data
interface ClassScheduleSlot {
    day: string | number;
    startTime: string;
    endTime: string;
}

interface ClassData {
  id: string;
  name: string;
  level: string;
  instrument?: string;
  classroom?: string;
  studentIds?: string[];
  schedule?: {
      slots?: ClassScheduleSlot[];
  };
}

const props = defineProps<{
  classes: ClassData[]; // Will receive todaysClasses
}>();

const emit = defineEmits(['take-attendance', 'view-class']); // Emits for actions

// Helper to emit view-class on card click
const onViewClass = (classId: string) => {
    emit('view-class', classId);
};

// Helper to emit take-attendance on button click
const onTakeAttendance = (classId: string) => {
    // Use stopPropagation to prevent the card's click event
    emit('take-attendance', classId);
};

</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <h2 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 flex justify-between items-center">
      <span>Clases Programadas para Hoy</span>
      <span class="flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">
        <CalendarIcon class="h-4 w-4" />
        {{ classes.length }} clases
      </span>
    </h2>

    <div v-if="classes.length > 0" class="space-y-3">
      <div
        v-for="classItem in classes"
        :key="classItem.id"
        class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer transition-all"
        @click="onViewClass(classItem.id)"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-medium text-gray-800 dark:text-gray-200">{{ classItem.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ classItem.level }} - {{ classItem.instrument || 'Sin instrumento' }}
            </p>

            <div v-if="classItem.schedule?.slots && classItem.schedule.slots.length > 0" class="flex flex-wrap gap-1 mt-1.5">
               <!-- Display relevant slots (e.g., slots for today) - Logic to filter slots for today can be added here if needed -->
              <span
                v-for="(slot, idx) in classItem.schedule.slots"
                :key="idx"
                class="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded"
              >
                 {{ slot.startTime }} - {{ slot.endTime }} <!-- Consider filtering slots just for today -->
              </span>
            </div>

            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Aula: {{ classItem.classroom || 'Sin asignar' }} |
              Estudiantes: {{ classItem.studentIds?.length || 0 }}
            </p>
          </div>

          <div class="flex space-x-1">
            <button
              @click.stop="onTakeAttendance(classItem.id)"
              class="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-md"
              title="Tomar Asistencia"
            >
              <ClipboardDocumentCheckIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-center text-gray-500 dark:text-gray-400 py-3">
      No tienes clases programadas para hoy.
    </p>
  </div>
</template>

<style scoped>
/* Add any specific styles for this section here */
</style>