<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline';
import TeacherWeeklySchedule from './TeacherWeeklySchedule.vue'; // Assuming path relative to components folder

// Define types for class data if you have them defined elsewhere
interface ClassScheduleSlot {
    day: string | number;
    startTime: string;
    endTime: string;
}
interface ClassData {
  id: string;
  name: string;
  schedule?: {
      slots?: ClassScheduleSlot[];
  };
  nextSessionDate?: Date; // Added in parent's computed property
  // Add other properties as needed
  }

const props = defineProps<{
  classes: ClassData[]; // Use the defined interface
}>();


// Emits for actions triggered from within TeacherWeeklySchedule or this section header
const emit = defineEmits([
    'add-class',
    'view-class',
    'edit-class',
    'delete-class',
    'manage-students',
    'take-attendance' // Added
]);

// Helper function to emit actions from TeacherWeeklySchedule
const handleScheduleAction = (action: string, classId: string) => {
    emit(action as any, classId); // Use 'any' if type inference is tricky for multiple events
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex justify-between items-center">
      <span>Horario Semanal</span>
      <button
        @click="$emit('add-class')"
        class="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
      >
        <PlusIcon class="w-4 h-4" />
        Nueva Clase
      </button>
    </h2>

    <!-- TeacherWeeklySchedule component -->
    <TeacherWeeklySchedule
      :classes="classes"
      @view-class="(classId) => handleScheduleAction('view-class', classId)"
      @edit-class="(classId) => handleScheduleAction('edit-class', classId)"
      @delete-class="(classId) => handleScheduleAction('delete-class', classId)"
      @manage-students="(classId) => handleScheduleAction('manage-students', classId)"
      @take-attendance="(classId) => handleScheduleAction('take-attendance', classId)"
    />
  </div>
</template>

<style scoped>
/* Add any specific styles for the schedule section here */
</style>